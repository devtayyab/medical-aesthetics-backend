import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, MoreThan } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '../users/entities/user.entity';
import { CreateConversationDto, SendMessageDto } from './dto/messages.dto';
import { MessagesGateway } from './gateways/messages.gateway';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepo: Repository<Message>,
        @InjectRepository(ConversationParticipant)
        private participantRepo: Repository<ConversationParticipant>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private readonly gateway: MessagesGateway,
    ) { }

    async createConversation(userId: string, dto: CreateConversationDto) {
        const participantIds = [...new Set([...dto.participantIds, userId])];

        if (participantIds.length < 2) {
            throw new BadRequestException('Conversations must have at least 2 participants');
        }

        // If not group, check if a 1-on-1 conversation already exists
        if (!dto.isGroup && participantIds.length === 2) {
            const existing = await this.conversationRepo
                .createQueryBuilder('c')
                .innerJoinAndSelect('c.participants', 'p')
                .innerJoinAndSelect('p.user', 'u')
                .where('c.isGroup = :isGroup', { isGroup: false })
                .andWhere('c.id IN (SELECT "conversationId" FROM conversation_participants WHERE "userId" = :u1)', { u1: participantIds[0] })
                .andWhere('c.id IN (SELECT "conversationId" FROM conversation_participants WHERE "userId" = :u2)', { u2: participantIds[1] })
                .getOne();

            if (existing) return existing;
        }

        const conversation = this.conversationRepo.create({
            title: dto.title,
            isGroup: !!dto.isGroup,
        });

        const savedConversation = await this.conversationRepo.save(conversation);

        const participants = participantIds.map((pid) =>
            this.participantRepo.create({
                conversationId: savedConversation.id,
                userId: pid,
            }),
        );

        await this.participantRepo.save(participants);

        const result = await this.conversationRepo.findOne({
            where: { id: savedConversation.id },
            relations: ['participants', 'participants.user'],
        });

        // Notify participants about new conversation
        this.gateway.notifyParticipants(participantIds, 'new-conversation', result);

        return result;
    }

    async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
        const participants = await this.participantRepo.find({
            where: { conversationId },
        });

        if (!participants.find((p) => p.userId === userId)) {
            throw new NotFoundException('Conversation not found or access denied');
        }

        const message = this.messageRepo.create({
            conversationId,
            senderId: userId,
            content: dto.content,
            type: dto.type || 'text',
            metadata: dto.metadata,
        });

        const savedMessage = await this.messageRepo.save(message);

        await this.conversationRepo.update(conversationId, {
            lastMessageId: savedMessage.id,
            updatedAt: new Date(),
        });

        const fullMessage = await this.messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['sender'],
        });

        // Notify all participants
        const participantIds = participants.map((p) => p.userId);
        this.gateway.notifyParticipants(participantIds, 'new-message', fullMessage);

        return fullMessage;
    }

    async getConversations(userId: string) {
        const conversations = await this.conversationRepo
            .createQueryBuilder('c')
            .innerJoinAndSelect('c.participants', 'p')
            .innerJoinAndSelect('p.user', 'u')
            .leftJoinAndSelect('c.lastMessage', 'lm')
            .leftJoinAndSelect('lm.sender', 's')
            .where('EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp."conversationId" = c.id AND cp."userId" = :userId)', { userId })
            .orderBy('c.updatedAt', 'DESC')
            .getMany();

        return Promise.all(
            conversations.map(async (c) => {
                const userParticipant = c.participants.find((p) => p.userId === userId);
                const lastReadAt = userParticipant?.lastReadAt || new Date(0); // If never read, all messages are unread (or since join?)

                // More accurate: count messages created after lastReadAt
                const unreadCount = await this.messageRepo.count({
                    where: {
                        conversationId: c.id,
                        createdAt: MoreThan(lastReadAt),
                    },
                });

                return { ...c, unreadCount };
            })
        );
    }

    async getMessages(userId: string, conversationId: string, limit = 50, offset = 0) {
        const participant = await this.participantRepo.findOne({
            where: { userId, conversationId },
        });

        if (!participant) {
            throw new NotFoundException('Conversation not found or access denied');
        }

        const messages = await this.messageRepo.find({
            where: { conversationId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['sender'],
        });

        // Mark as read
        await this.participantRepo.update(
            { userId, conversationId },
            { lastReadAt: new Date() },
        );

        return messages.reverse();
    }

    async searchConversations(userId: string, query: string) {
        return this.conversationRepo
            .createQueryBuilder('c')
            .innerJoinAndSelect('c.participants', 'p')
            .innerJoinAndSelect('p.user', 'u')
            .leftJoinAndSelect('c.lastMessage', 'lm')
            .where('EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp."conversationId" = c.id AND cp."userId" = :userId)', { userId })
            .andWhere('(u."firstName" ILIKE :q OR u."lastName" ILIKE :q OR c.title ILIKE :q)', { q: `%${query}%` })
            .getMany();
    }
}
