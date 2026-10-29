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
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  // Only a SUPER_ADMIN may change, reset, (de)activate or delete a SUPER_ADMIN account;
  // otherwise an ADMIN could change its email or password and take it over.
  private async assertCanManageUser(actor: any, targetId: string) {
    if (String(actor?.role || '').toUpperCase() === UserRole.SUPER_ADMIN) return;
    const target = await this.adminService.getUserById(targetId);
    if (String(target?.role || '').toUpperCase() === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a SUPER_ADMIN can manage this account.');
    }
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system audit logs (who changed what, when, before/after)' })
  getAuditLogs(
    @Query() query: {
      resource?: string;
      action?: string;
      userId?: string;
      resourceId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    },
  ) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get dashboard metrics' })
  async getMetrics() {
    const reports = await this.adminService.getReports();
    return {
      leads: reports.leadsToConversions.totalLeads,
      conversions: reports.leadsToConversions.conversions,
      revenue: reports.revenueStats.totalRevenue
    };
  }

  @Get('integrations/logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get integration status and error logs (Meta, HubSpot, etc.)' })
  getIntegrationLogs() {
    return this.adminService.getIntegrationLogs();
  }

  @Post('tags')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Create CRM tag' })
  createTag(@Body() body: { name: string; color?: string; description?: string }) {
    return this.adminService.createTag(body.name, body.color, body.description);
  }

  @Get('tags')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Get all tags' })
  getTags() {
    return this.adminService.getTags();
  }

  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform reports and analytics' })
  getReports() {
    return this.adminService.getReports();
  }

  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update platform settings' })
  updateSettings(@Body() settings: any) {
    return this.adminService.updateSettings(settings);
  }

  // User Management
  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers(
    @Query() query: { role?: string; isActive?: boolean; search?: string; limit?: number; offset?: number }
  ) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Request() req, @Param('id') id: string, @Body() updateData: any) {
    // Only a SUPER_ADMIN may grant the SUPER_ADMIN role — prevents ADMIN self-escalation.
    if (String(updateData?.role || '').toUpperCase() === UserRole.SUPER_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You are not allowed to assign the SUPER_ADMIN role.');
    }
    await this.assertCanManageUser(req.user, id);
    return this.adminService.updateUser(id, updateData);
  }

  @Patch('users/:id/password')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change user password' })
  async changeUserPassword(@Request() req, @Param('id') id: string, @Body() body: { password: string }) {
    await this.assertCanManageUser(req.user, id);
    return this.adminService.changeUserPassword(id, body.password);
  }

  @Patch('users/:id/toggle-status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle user active status (prefer deactivate/reactivate)' })
  async toggleUserStatus(@Request() req, @Param('id') id: string) {
    await this.assertCanManageUser(req.user, id);
    return this.adminService.toggleUserStatus(id, req.user?.id);
  }

  @Get('users/:id/open-work')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Open leads and tasks owned by a user (asked before deactivation)' })
  getUserOpenWork(@Param('id') id: string) {
    return this.adminService.getUserOpenWork(id);
  }

  @Post('users/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a user: blocks login at once and hands open leads/tasks to another user' })
  async deactivateUser(@Request() req, @Param('id') id: string, @Body() body: { reassignToUserId?: string }) {
    await this.assertCanManageUser(req.user, id);
    return this.adminService.deactivateUser(id, req.user?.id, body?.reassignToUserId);
  }

  @Post('users/:id/reactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactivate a user' })
  async reactivateUser(@Request() req, @Param('id') id: string) {
    await this.assertCanManageUser(req.user, id);
    return this.adminService.reactivateUser(id, req.user?.id);
  }

  @Get('staff-requests')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pending "Add staff" requests from clinics' })
  getStaffRequests() {
    return this.adminService.getPendingStaffRequests();
  }

  @Post('staff-requests/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a staff request (sends a set-password link)' })
  approveStaffRequest(@Request() req, @Param('id') id: string) {
    return this.adminService.approveStaffRequest(id, req.user?.id);
  }

  @Post('staff-requests/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a staff request' })
  rejectStaffRequest(@Request() req, @Param('id') id: string) {
    return this.adminService.rejectStaffRequest(id, req.user?.id);
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Request() req, @Param('id') id: string) {
    await this.assertCanManageUser(req.user, id);
    return this.adminService.deleteUser(id);
  }

  // Treatment Category Management
  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all treatment categories' })
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create treatment category' })
  createCategory(@Body() body: any) {
    return this.adminService.createCategory(body);
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update treatment category' })
  updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete treatment category' })
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // Therapy (Treatment) Management
  @Get('treatments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all therapies (treatments)' })
  getTreatments(@Query() query: any) {
    return this.adminService.getTreatments(query);
  }

  @Post('treatments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new therapy/treatment' })
  createTreatment(@Body() body: any) {
    return this.adminService.createTreatment(body);
  }

  @Put('treatments/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update therapy/treatment' })
  updateTreatment(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateTreatment(id, body);
  }

  @Delete('treatments/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete therapy/treatment' })
  deleteTreatment(@Param('id') id: string) {
    return this.adminService.deleteTreatment(id);
  }

  // Clinic Management
  @Get('clinics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all clinics' })
  getAllClinics(
    @Query() query: { isActive?: boolean; search?: string; limit?: number; offset?: number }
  ) {
    return this.adminService.getAllClinics(query);
  }

  @Get('clinics/:id')
  // Admin only: this returns any clinic with all its appointments and owners (no ownership check).
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get clinic by ID' })
  getClinicById(@Param('id') id: string) {
    return this.adminService.getClinicById(id);
  }

  @Patch('clinics/:id/toggle-status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle clinic active status (approve/suspend)' })
  toggleClinicStatus(@Param('id') id: string) {
    return this.adminService.toggleClinicStatus(id);
  }

  @Post('clinics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new clinic' })
  createClinic(@Body() clinicData: any) {
    return this.adminService.createClinic(clinicData);
  }

  @Put('clinics/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update clinic profile' })
  updateClinic(@Param('id') id: string, @Body() clinicData: any) {
    return this.adminService.updateClinic(id, clinicData);
  }

  @Get('clinics/:id/analytics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get clinic analytics' })
  getClinicAnalytics(
    @Param('id') id: string,
    @Query() query?: { startDate: string; endDate: string }
  ) {
    return this.adminService.getClinicAnalytics(id, query);
  }

  // Platform Analytics
  @Get('analytics/platform')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform-wide analytics (users, sales, loyalty)' })
  getPlatformAnalytics(@Query() query?: { startDate: string; endDate: string }) {
    return this.adminService.getPlatformAnalytics(query);
  }

  // Offer Management
  @Post('offers')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new offer/promotion' })
  createOffer(@Body() offerData: any) {
    return this.adminService.createOffer(offerData);
  }

  @Get('offers')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all offers' })
  getAllOffers(@Query() query: { isActive?: boolean; limit?: number; offset?: number }) {
    return this.adminService.getAllOffers(query);
  }

  @Get('offers/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get offer by ID' })
  getOfferById(@Param('id') id: string) {
    return this.adminService.getOfferById(id);
  }

  @Put('offers/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update offer' })
  updateOffer(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateOffer(id, updateData);
  }

  @Patch('offers/:id/toggle-status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle offer active status' })
  toggleOfferStatus(@Param('id') id: string) {
    return this.adminService.toggleOfferStatus(id);
  }

  @Delete('offers/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete offer' })
  deleteOffer(@Param('id') id: string) {
    return this.adminService.deleteOffer(id);
  }

  // Reward Management
  @Post('rewards')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new reward' })
  createReward(@Body() rewardData: any) {
    return this.adminService.createReward(rewardData);
  }

  @Get('rewards')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all rewards' })
  getAllRewards(@Query() query: { isActive?: boolean; tier?: string; limit?: number; offset?: number }) {
    return this.adminService.getAllRewards(query);
  }

  @Get('rewards/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get reward by ID' })
  getRewardById(@Param('id') id: string) {
    return this.adminService.getRewardById(id);
  }

  @Put('rewards/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update reward' })
  updateReward(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateReward(id, updateData);
  }

  @Patch('rewards/:id/toggle-status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle reward active status' })
  toggleRewardStatus(@Param('id') id: string) {
    return this.adminService.toggleRewardStatus(id);
  }

  @Delete('rewards/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete reward' })
  deleteReward(@Param('id') id: string) {
    return this.adminService.deleteReward(id);
  }

  // Platform Settings
  @Get('settings/:key')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get specific setting' })
  getSetting(@Param('key') key: string) {
    return this.adminService.getSetting(key);
  }

  @Put('settings/:key')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update specific setting' })
  updateSetting(@Param('key') key: string, @Body('value') value: any) {
    return this.adminService.updateSetting(key, value);
  }

  @Get('settings/category/:category')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all settings by category' })
  getSettingsByCategory(@Param('category') category: string) {
    return this.adminService.getAllSettings(category);
  }
  @Get('loyalty')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get loyalty settings' })
  getLoyalty() {
    return this.adminService.getLoyalty();
  }

  @Patch('loyalty')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update loyalty settings' })
  updateLoyalty(@Body() body: any) {
    return this.adminService.updateLoyalty(body);
  }

  @Get('monitor')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get monitor logs' })
  getLogs() {
    return this.adminService.getLogs();
  }

  // Global calendar (week view) with cross-clinic oversight
  @Get('calendar')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get global calendar appointments (week view) with privacy rules' })
  getGlobalCalendar(
    @Query()
    query: {
      startDate: string;
      endDate: string;
      clinicId?: string;
      providerId?: string;
    },
    @Request() req,
  ) {
    return this.adminService.getGlobalCalendarAppointments(req.user.id, req.user.role, query);
  }

  // Notifications: send both email + push to a specific user
  @Post('notifications/email-push')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send both email and push notification to a user' })
  sendEmailAndPushToUser(
    @Body()
    body: {
      userId: string;
      title: string;
      message: string;
      emailBody?: string;
      data?: any;
    },
  ) {
    return this.adminService.sendEmailAndPushToUser(body);
  }
}