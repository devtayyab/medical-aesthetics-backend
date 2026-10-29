import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateConversationDto, SendMessageDto } from './dto/messages.dto';
import { stripUserPersonalData } from '../../common/utils/privacy.util';

const isClient = (user: any) => String(user?.role || '').toLowerCase() === 'client';

// Clients never receive staff personal email/phone through conversation participants or senders.
function stripConversation(c: any) {
    if (!c) return c;
    return {
        ...c,
        participants: (c.participants || []).map((p: any) => ({ ...p, user: stripUserPersonalData(p.user) })),
        lastMessage: c.lastMessage ? { ...c.lastMessage, sender: stripUserPersonalData(c.lastMessage.sender) } : c.lastMessage,
    };
}

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post('conversations')
    @ApiOperation({ summary: 'Create or get a conversation' })
    createConversation(@Req() req, @Body() dto: CreateConversationDto) {
        // Clients only receive messages (their inbox); they do not start conversations.
        if (String(req.user?.role || '').toLowerCase() === 'client') {
            throw new ForbiddenException('Clients cannot start new conversations');
        }
        return this.messagesService.createConversation(req.user.id, dto);
    }

    @Get('inbox')
    @ApiOperation({ summary: 'Messages received by the current user (from BeautyDoctors and clinics)' })
    getInbox(@Req() req) {
        return this.messagesService.getInbox(req.user.id);
    }

    @Get('conversations')
    @ApiOperation({ summary: 'Get user conversations' })
    async getConversations(@Req() req) {
        const conversations = await this.messagesService.getConversations(req.user.id);
        return isClient(req.user) ? conversations.map(stripConversation) : conversations;
    }

    @Post('conversations/:id/messages')
    @ApiOperation({ summary: 'Send a message' })
    async sendMessage(@Req() req, @Param('id') id: string, @Body() dto: SendMessageDto) {
        const message: any = await this.messagesService.sendMessage(req.user.id, id, dto);
        return isClient(req.user) && message ? { ...message, sender: stripUserPersonalData(message.sender) } : message;
    }

    @Get('conversations/:id/messages')
    @ApiOperation({ summary: 'Get messages for a conversation' })
    async getMessages(
        @Req() req,
        @Param('id') id: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
        const safeOffset = Math.max(Number(offset) || 0, 0);
        const messages: any[] = await this.messagesService.getMessages(req.user.id, id, safeLimit, safeOffset);
        return isClient(req.user)
            ? messages.map((m) => ({ ...m, sender: stripUserPersonalData(m.sender) }))
            : messages;
    }

    @Get('search')
    @ApiOperation({ summary: 'Search conversations' })
    async search(@Req() req, @Query('q') query: string) {
        const conversations = await this.messagesService.searchConversations(req.user.id, query);
        return isClient(req.user) ? conversations.map(stripConversation) : conversations;
    }
}
