import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MarketsService } from './markets.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class MarketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly intervalId: NodeJS.Timeout;
  private readonly connectedClients = new Map<string, string | null>();

  constructor(
    private readonly marketsService: MarketsService,
    private readonly authService: AuthService,
  ) {
    this.intervalId = setInterval(() => {
      this.marketsService.updateWatchlistPrices();

      if (!this.server) {
        return;
      }

      this.connectedClients.forEach((userId, clientId) => {
        this.server.to(clientId).emit('market.update', this.marketsService.getSummary(userId ?? undefined));
      });
    }, 3000);
  }

  afterInit() {}

  handleConnection(client: Socket) {
    const session = this.authService.resolveSessionFromInput({
      headers: client.handshake.headers,
      auth: client.handshake.auth,
    });

    this.connectedClients.set(client.id, session?.user.id ?? null);
    client.emit('market.update', this.marketsService.getSummary(session?.user.id));
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  onModuleDestroy() {
    clearInterval(this.intervalId);
    this.connectedClients.clear();
  }
}
