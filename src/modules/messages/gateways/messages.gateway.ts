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

            const payload = await this.jwtService.verifyAsync(token as string);
            client.userId = payload.sub || payload.id;

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
