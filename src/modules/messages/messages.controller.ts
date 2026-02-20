import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateConversationDto, SendMessageDto } from './dto/messages.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post('conversations')
    @ApiOperation({ summary: 'Create or get a conversation' })
    createConversation(@Req() req, @Body() dto: CreateConversationDto) {
        return this.messagesService.createConversation(req.user.id, dto);
    }

    @Get('conversations')
    @ApiOperation({ summary: 'Get user conversations' })
    getConversations(@Req() req) {
        return this.messagesService.getConversations(req.user.id);
    }

    @Post('conversations/:id/messages')
    @ApiOperation({ summary: 'Send a message' })
    sendMessage(@Req() req, @Param('id') id: string, @Body() dto: SendMessageDto) {
        return this.messagesService.sendMessage(req.user.id, id, dto);
    }

    @Get('conversations/:id/messages')
    @ApiOperation({ summary: 'Get messages for a conversation' })
    getMessages(
        @Req() req,
        @Param('id') id: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.messagesService.getMessages(req.user.id, id, limit, offset);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search conversations' })
    search(@Req() req, @Query('q') query: string) {
        return this.messagesService.searchConversations(req.user.id, query);
    }
}
