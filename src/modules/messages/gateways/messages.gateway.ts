import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// NOTE: same fallback chain as JwtStrategy (testing phase); remove the hardcoded fallback before production.
// Read at connect time: .env is loaded by ConfigModule after this file is imported.
const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'medical-aesthetics-secret-key';

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessagesGateway.name);
    private connectedClients: Map<string, string> = new Map(); // userId -> socketId

    constructor(private jwtService: JwtService) {
        this.logger.log('MessagesGateway initialized on namespace: /messages');
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync(token as string, { secret: accessSecret() });
            // Only access tokens: login-challenge (password step only), reset, verification and
            // refresh tokens can share the secret and must never open a session.
            if (!payload?.sub || payload.purpose || payload.type === 'refresh') {
                client.disconnect();
                return;
            }
            client.userId = payload.sub;

            this.connectedClients.set(client.userId, client.id);
            await client.join(`user:${client.userId}`);

            this.logger.log(`Messages: Client ${client.id} connected as user ${client.userId}`);
        } catch (error) {
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.userId) {
            this.connectedClients.delete(client.userId);
        }
    }

    notifyParticipants(participantIds: string[], event: string, payload: any) {
        participantIds.forEach((pid) => {
            this.server.to(`user:${pid}`).emit(event, payload);
        });
    }
}
