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

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
  },
})
export class MarketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly intervalId: NodeJS.Timeout;

  constructor(private readonly marketsService: MarketsService) {
    this.intervalId = setInterval(() => {
      const summary = this.marketsService.updateWatchlistPrices();
      this.server.emit('market.update', summary);
    }, 3000);
  }

  afterInit() {}

  handleConnection(client: Socket) {
    client.emit('market.update', this.marketsService.getSummary());
  }

  handleDisconnect() {}

  onModuleDestroy() {
    clearInterval(this.intervalId);
  }
}
