import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('tags')
  @ApiOperation({ summary: 'Create CRM tag' })
  createTag(@Body() body: { name: string; color?: string; description?: string }) {
    return this.adminService.createTag(body.name, body.color, body.description);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags' })
  getTags() {
    return this.adminService.getTags();
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get platform reports and analytics' })
  getReports() {
    return this.adminService.getReports();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get platform settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update platform settings' })
  updateSettings(@Body() settings: any) {
    return this.adminService.updateSettings(settings);
  }
}