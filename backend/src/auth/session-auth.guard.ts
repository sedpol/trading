import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<{
        headers: Record<string, unknown>;
        cookies?: Record<string, unknown>;
        user?: unknown;
      }>();
      const session = this.authService.resolveSessionFromHttpRequest({
        headers: request.headers,
        cookies: request.cookies,
      });

      if (!session) {
        throw new UnauthorizedException('Unauthorized');
      }

      request.user = session.user;
      return true;
    }

    const client = context.switchToWs().getClient<{
      handshake: {
        headers: Record<string, unknown>;
        auth?: Record<string, unknown>;
      };
      data?: Record<string, unknown>;
    }>();

    const session = this.authService.resolveSessionFromInput({
      headers: client.handshake.headers,
      auth: client.handshake.auth,
    });

    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }

    client.data = {
      ...(client.data ?? {}),
      user: session.user,
    };

    return true;
  }
}
