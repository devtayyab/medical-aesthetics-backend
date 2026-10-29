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
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// NOTE: same fallback chain as JwtStrategy (testing phase); remove the hardcoded fallback before production.
// Read at connect time: .env is loaded by ConfigModule after this file is imported.
const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'medical-aesthetics-secret-key';
import { NotificationsService } from '../notifications.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      // Same secret the access tokens are signed with (this module's JwtModule has none).
      const payload = await this.jwtService.verifyAsync(token as string, { secret: accessSecret() });
      // Only access tokens: login-challenge (password step only), reset, verification and
      // refresh tokens can share the secret and must never open a session.
      if (!payload?.sub || payload.purpose || payload.type === 'refresh') {
        client.disconnect();
        return;
      }
      client.userId = payload.sub;
      
      // Store connection
      this.connectedClients.set(client.userId, client.id);
      
      // Join user-specific room
      await client.join(`user:${client.userId}`);
      
      // Send current unread count
      const unreadCount = await this.notificationsService.getUnreadCount(client.userId);
      client.emit('unread-count', { count: unreadCount });

      this.logger.log(`Client ${client.id} connected as user ${client.userId}`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedClients.delete(client.userId);
      this.logger.log(`Client ${client.id} disconnected (user ${client.userId})`);
    }
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (!client.userId) return;

    await this.notificationsService.markAsRead(data.notificationId, client.userId);
    
    // Update unread count
    const unreadCount = await this.notificationsService.getUnreadCount(client.userId);
    client.emit('unread-count', { count: unreadCount });
  }

  // Method to send notification to specific user
  async sendToUser(userId: string, notification: any) {
    const socketId = this.connectedClients.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit('notification', notification);
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.server.to(`user:${userId}`).emit('unread-count', { count: unreadCount });
    }
  }

  // Method to send unread count update
  async updateUnreadCount(userId: string) {
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unread-count', { count: unreadCount });
  }
}
