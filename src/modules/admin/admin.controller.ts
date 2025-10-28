import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  constructor(private readonly adminService: AdminService) { }

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

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers(
    @Query() query: { role?: string; isActive?: boolean; search?: string; limit?: number; offset?: number }
  ) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateUser(id, updateData);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status' })
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Clinic Management
  @Get('clinics')
  @ApiOperation({ summary: 'Get all clinics' })
  getAllClinics(
    @Query() query: { isActive?: boolean; search?: string; limit?: number; offset?: number }
  ) {
    return this.adminService.getAllClinics(query);
  }

  @Get('clinics/:id')
  @ApiOperation({ summary: 'Get clinic by ID' })
  getClinicById(@Param('id') id: string) {
    return this.adminService.getClinicById(id);
  }

  @Patch('clinics/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle clinic active status (approve/suspend)' })
  toggleClinicStatus(@Param('id') id: string) {
    return this.adminService.toggleClinicStatus(id);
  }

  @Get('clinics/:id/analytics')
  @ApiOperation({ summary: 'Get clinic analytics' })
  getClinicAnalytics(
    @Param('id') id: string,
    @Query() query?: { startDate: string; endDate: string }
  ) {
    return this.adminService.getClinicAnalytics(id, query);
  }

  // Platform Analytics
  @Get('analytics/platform')
  @ApiOperation({ summary: 'Get platform-wide analytics (users, sales, loyalty)' })
  getPlatformAnalytics(@Query() query?: { startDate: string; endDate: string }) {
    return this.adminService.getPlatformAnalytics(query);
  }

  // Offer Management
  @Post('offers')
  @ApiOperation({ summary: 'Create new offer/promotion' })
  createOffer(@Body() offerData: any) {
    return this.adminService.createOffer(offerData);
  }

  @Get('offers')
  @ApiOperation({ summary: 'Get all offers' })
  getAllOffers(@Query() query: { isActive?: boolean; limit?: number; offset?: number }) {
    return this.adminService.getAllOffers(query);
  }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get offer by ID' })
  getOfferById(@Param('id') id: string) {
    return this.adminService.getOfferById(id);
  }

  @Put('offers/:id')
  @ApiOperation({ summary: 'Update offer' })
  updateOffer(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateOffer(id, updateData);
  }

  @Patch('offers/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle offer active status' })
  toggleOfferStatus(@Param('id') id: string) {
    return this.adminService.toggleOfferStatus(id);
  }

  @Delete('offers/:id')
  @ApiOperation({ summary: 'Delete offer' })
  deleteOffer(@Param('id') id: string) {
    return this.adminService.deleteOffer(id);
  }

  // Reward Management
  @Post('rewards')
  @ApiOperation({ summary: 'Create new reward' })
  createReward(@Body() rewardData: any) {
    return this.adminService.createReward(rewardData);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get all rewards' })
  getAllRewards(@Query() query: { isActive?: boolean; tier?: string; limit?: number; offset?: number }) {
    return this.adminService.getAllRewards(query);
  }

  @Get('rewards/:id')
  @ApiOperation({ summary: 'Get reward by ID' })
  getRewardById(@Param('id') id: string) {
    return this.adminService.getRewardById(id);
  }

  @Put('rewards/:id')
  @ApiOperation({ summary: 'Update reward' })
  updateReward(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateReward(id, updateData);
  }

  @Patch('rewards/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle reward active status' })
  toggleRewardStatus(@Param('id') id: string) {
    return this.adminService.toggleRewardStatus(id);
  }

  @Delete('rewards/:id')
  @ApiOperation({ summary: 'Delete reward' })
  deleteReward(@Param('id') id: string) {
    return this.adminService.deleteReward(id);
  }

  // Platform Settings
  @Get('settings/:key')
  @ApiOperation({ summary: 'Get specific setting' })
  getSetting(@Param('key') key: string) {
    return this.adminService.getSetting(key);
  }

  @Put('settings/:key')
  @ApiOperation({ summary: 'Update specific setting' })
  updateSetting(@Param('key') key: string, @Body('value') value: any) {
    return this.adminService.updateSetting(key, value);
  }

  @Get('settings/category/:category')
  @ApiOperation({ summary: 'Get all settings by category' })
  getSettingsByCategory(@Param('category') category: string) {
    return this.adminService.getAllSettings(category);
  }
}