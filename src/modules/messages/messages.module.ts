import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { MessagesGateway } from './gateways/messages.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation, Message, ConversationParticipant, User]),
        JwtModule.register({
            secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'medical-aesthetics-secret-key',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [MessagesController],
    providers: [MessagesService, MessagesGateway],
    exports: [MessagesService, MessagesGateway],
})
export class MessagesModule { }
