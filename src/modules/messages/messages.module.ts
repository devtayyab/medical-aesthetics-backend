import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { User } from '../users/entities/user.entity';
import { resolveJwtSecret } from '../../common/utils/jwt-secret.util';
import { JwtModule } from '@nestjs/jwt';
import { MessagesGateway } from './gateways/messages.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Conversation, Message, ConversationParticipant, User]),
        JwtModule.register({
            // Dev fallback only; startup fails in production when the secret is missing.
            secret: resolveJwtSecret('JWT_ACCESS_SECRET', 'JWT_SECRET'),
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [MessagesController],
    providers: [MessagesService, MessagesGateway],
    exports: [MessagesService, MessagesGateway],
})
export class MessagesModule { }
