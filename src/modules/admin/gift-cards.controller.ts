import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { GiftCardsService } from './gift-cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { Request } from 'express';

@ApiTags('Admin Gift Cards')
@Controller('admin/gift-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GiftCardsController {
    constructor(private readonly giftCardsService: GiftCardsService) { }

    @Get('summary')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get total gift cards metrics' })
    getSummary() {
        return this.giftCardsService.getSummary();
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get all gift cards' })
    getAllGiftCards(@Query() query: { search?: string }) {
        return this.giftCardsService.getAllGiftCards(query);
    }

    @Post('generate')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Generate a new global gift card manually' })
    generateGiftCard(
        @Req() req: any,
        @Body() body: { amount: number; recipientEmail?: string; message?: string; expiresAt?: string }
    ) {
        return this.giftCardsService.generateGiftCard(req.user.id, {
            ...body,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
        });
    }
}
