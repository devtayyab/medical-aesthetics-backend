import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateCustomerDto } from './dto/create.customer.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { FacebookWebhookDto } from './dto/facebook-webhook.dto';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities';
import { CreateActionDto } from './dto/create-action.dto';

@ApiTags('CRM')
@Controller('crm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(private readonly crmService: CrmService) { }

  @Post('leads')
  @ApiOperation({ summary: 'Create a new lead' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.crmService.create(createLeadDto);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Get leads with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assignedSalesId', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'search', required: false })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() filters: any, @Request() req) {
    return this.crmService.findAll({ ...filters, _requesterId: req.user.id });
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get lead details' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.crmService.findById(id);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update lead information' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.crmService.update(id, updateLeadDto);
  }

  @Delete('leads/:id')
  @ApiOperation({ summary: 'Soft delete lead' })
  @Roles(UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.crmService.softDelete(id);
  }

  // Customer Record Management
  @Get('customers/:id/record')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get complete customer record with full history' })
  getCustomerRecord(@Param('id') customerId: string, @Request() req) {
    return this.crmService.getCustomerRecord(customerId, req.user.id);
  }

  @Put('customers/:id/record')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update customer record' })
  updateCustomerRecord(
    @Param('id') customerId: string,
    @Body() updateData: any,
  ) {
    return this.crmService.updateCustomerRecord(customerId, updateData);
  }

  // Communication Log Management
  @Post('communications')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Log communication (call, email, meeting, etc.)' })
  logCommunication(@Body() communicationData: any, @Request() req) {
    return this.crmService.logCommunication({
      ...communicationData,
      salespersonId: communicationData.salespersonId || req.user.id,
    });
  }

  @Post('customers')
  @Roles(UserRole.CLINIC_OWNER, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new customer directly' })
  createCustomer(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    return this.crmService.createCustomer(createCustomerDto, req.user.id);
  }

  @Get('customers')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all customers' })
  getCustomers(@Query() filters: any, @Request() req) {
    return this.crmService.getCustomers({ ...filters, _requesterId: req.user.id });
  }

  @Get('customers/:id/communications')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get customer communication history' })
  getCommunicationHistory(
    @Param('id', new ParseUUIDPipe()) customerId: string,
    @Query() filters: any,
    @Request() req,
  ) {
    return this.crmService.getCommunicationHistory(customerId, { ...filters, _requesterId: req.user.id });
  }

  @Patch('communications/:id')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update communication log' })
  updateCommunication(@Param('id') id: string, @Body() updateData: any) {
    return this.crmService.updateCommunication(id, updateData);
  }

  @Delete('communications/:id')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete communication log' })
  deleteCommunication(@Param('id') id: string) {
    return this.crmService.deleteCommunication(id);
  }

  // Action/Task Management
  @Post('actions')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create manual CRM action/task' })
  createAction(@Body() actionData: CreateActionDto, @Request() req) {
    return this.crmService.createAction({
      ...actionData,
      salespersonId: actionData.salespersonId || req.user.id,
    });
  }

  @Patch('actions/:id')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update CRM action' })
  updateAction(@Param('id') id: string, @Body() updateData: any) {
    return this.crmService.updateAction(id, updateData);
  }

  @Delete('actions/:id')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete CRM action' })
  deleteAction(@Param('id') id: string) {
    return this.crmService.deleteAction(id);
  }

  @Get('actions')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get actions with filters' })
  getActions(@Query() filters: any, @Request() req) {
    return this.crmService.getActions(req.user.id, filters);
  }

  @Get('actions/:salespersonId/pending')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get pending actions for salesperson' })
  getPendingActions(@Param('salespersonId') salespersonId: string) {
    return this.crmService.getPendingActions(salespersonId);
  }

  @Get('tasks/overdue')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get overdue tasks' })
  getOverdueTasks(@Query('salespersonId') salespersonId: string, @Request() req) {
    const sid = salespersonId || (req.user.role === UserRole.SALESPERSON ? req.user.id : undefined);
    return this.crmService.getOverdueTasks(sid);
  }

  @Get('tasks/kpis')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get task management KPIs' })
  getTaskKpis(@Query('salespersonId') salespersonId: string, @Request() req) {
    const sid = salespersonId || (req.user.role === UserRole.SALESPERSON ? req.user.id : undefined);
    return this.crmService.getTaskKpis(sid);
  }

  // Tag Management
  @Post('customers/:id/tags')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add tag to customer' })
  addCustomerTag(
    @Param('id') customerId: string,
    @Body() tagData: { tagId: string; notes?: string },
    @Request() req,
  ) {
    return this.crmService.addCustomerTag(customerId, tagData.tagId, req.user.id, tagData.notes);
  }

  @Delete('tags/:id')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Remove tag from customer' })
  removeCustomerTag(@Param('id') id: string) {
    return this.crmService.removeCustomerTag(id);
  }

  @Get('tags/:tagId/customers')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get customers by tag' })
  getCustomersByTag(@Param('tagId') tagId: string, @Request() req) {
    return this.crmService.getCustomersByTag(tagId, req.user.id);
  }

  // Task Automation
  @Get('automation/rules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get automation rules' })
  getAutomationRules() {
    return this.crmService.getAutomationRules();
  }

  @Post('automation/run-check')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Trigger manual automation check' })
  runAutomationCheck() {
    return this.crmService.runTaskAutomationCheck();
  }

  // Repeat Customers
  @Get('customers/repeat')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Identify potential repeat customers' })
  identifyRepeatCustomers(@Request() req) {
    return this.crmService.identifyRepeatCustomers(req.user.id);
  }

  @Get('follow-up')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get customers due for follow-up' })
  getFollowUpDue(@Query('days') days: string, @Request() req) {
    return this.crmService.getCustomersDueForFollowUp(req.user.id, days ? parseInt(days) : 30);
  }

  // Field Validation
  @Get('validation/required-fields/call')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get mandatory fields for logging calls' })
  getRequiredFieldsForCall() {
    return this.crmService.getRequiredFieldsForCall();
  }

  @Get('validation/required-fields/action/:type')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get mandatory fields for specific action' })
  getRequiredFieldsForAction(@Param('type') type: string) {
    return this.crmService.getRequiredFieldsForAction(type);
  }

  @Post('validation/validate-communication')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Validate communication log fields' })
  validateCommunication(@Body() data: { customerId: string; communicationData: Partial<CommunicationLog> }) {
    return this.crmService.validateCommunicationFields(data.customerId, data.communicationData);
  }

  @Post('validation/validate-action')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Validate action fields' })
  validateAction(@Body() data: { customerId: string; actionData: Partial<CrmAction> }) {
    return this.crmService.validateActionFields(data.customerId, data.actionData);
  }

  // Analytics
  @Get('analytics/clinic-return-rates')
  @ApiOperation({ summary: 'Get clinic-wise return rates' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getClinicReturnRates() {
    return this.crmService.getClinicReturnRates();
  }

  @Get('analytics/service-performance')
  @ApiOperation({ summary: 'Get service-wise performance' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getServicePerformance(@Query() query: { startDate?: string; endDate?: string }) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getServicePerformance(dateRange);
  }

  @Get('analytics/advertisement-stats')
  @ApiOperation({ summary: 'Get advertisement campaign stats' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getAdvertisementStats(@Query() query: { startDate?: string; endDate?: string }) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getAdvertisementStats(dateRange);
  }

  @Get('analytics/performance-dashboard')
  @ApiOperation({ summary: 'Combined performance dashboard' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SALESPERSON)
  @UseGuards(RolesGuard)
  getPerformanceDashboard(
    @Query() query: { startDate?: string; endDate?: string; salespersonId?: string },
    @Request() req
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    const salespersonId = req.user.role === UserRole.SALESPERSON ? req.user.id : query.salespersonId;
    return this.crmService.getPerformanceDashboard(dateRange, salespersonId);
  }

  @Get('analytics/agent-forms')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get agent form submission stats' })
  getAgentFormStats(@Query() query: { startDate?: string; endDate?: string }) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) }
      : undefined;
    return this.crmService.getAgentFormStats(dateRange);
  }

  @Get('analytics/agent-communications')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get agent communication metrics' })
  getAgentCommunicationStats(@Query() query: { startDate?: string; endDate?: string }) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) }
      : undefined;
    return this.crmService.getAgentCommunicationStats(dateRange);
  }

  @Get('analytics/agent-appointments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get agent appointment booking performance' })
  getAgentAppointmentStats(@Query() query: { startDate?: string; endDate?: string }) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) }
      : undefined;
    return this.crmService.getAgentAppointmentStats(dateRange);
  }

  @Get('analytics/agent-cashflow')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get agent revenue and cashflow stats' })
  getAgentCashflow(@Query() query: { startDate?: string; endDate?: string }) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) }
      : undefined;
    return this.crmService.getAgentCashflow(dateRange);
  }

  @Get('analytics/:salespersonId')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get core salesperson KPIs' })
  getSalespersonAnalytics(
    @Param('salespersonId') salespersonId: string,
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getSalespersonAnalytics(salespersonId, dateRange);
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Global CRM efficiency metrics' })
  getCrmMetrics() {
    return this.crmService.getCrmMetrics();
  }

  // Facebook Integration
  @Post('facebook/webhook')
  @Public()
  @ApiOperation({ summary: 'Messenger/Lead Ads Webhook' })
  handleFacebookWebhook(@Body() data: FacebookWebhookDto) {
    return this.crmService.handleFacebookWebhook(data);
  }

  @Post('facebook/import/:formId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Manual lead import' })
  importFacebookLeads(@Param('formId') formId: string, @Query('limit') limit?: number) {
    return this.crmService.importFacebookLeads(formId, limit);
  }

  @Get('facebook/forms')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getFacebookForms() {
    return this.crmService.getFacebookForms();
  }

  @Get('customer/:id')
  @ApiOperation({ summary: 'Get customer details' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getCustomer(@Param('id') id: string) {
    return this.crmService.getCustomer(id);
  }

  @Get('duplicates/check')
  @ApiOperation({ summary: 'Check for potential duplicates' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  checkForDuplicates(@Query() query: { email?: string; phone?: string; firstName?: string; lastName?: string }) {
    return this.crmService.checkForDuplicates(
      query.email,
      query.phone,
      query.firstName,
      query.lastName,
    );
  }

  @Get('duplicates/suggestions')
  @ApiOperation({ summary: 'Get duplicate suggestions' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getDuplicateSuggestions(@Query() query: { email?: string; phone?: string; firstName?: string; lastName?: string }) {
    return this.crmService.getDuplicateSuggestions(
      query.email,
      query.phone,
      query.firstName,
      query.lastName,
    );
  }

  // Manager analytics and reports (admin/super admin only)
  @Get('analytics/manager/agents')
  @ApiOperation({ summary: 'Manager view: per-agent KPIs' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  async getManagerAgentKpis(
    @Query() query: { startDate?: string; endDate?: string },
    @Request() req
  ) {
    try {
      const dateRange = query.startDate && query.endDate
        ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
        : undefined;
      return await this.crmService.getManagerAgentKpis(dateRange);
    } catch (error) {
      console.error('CRITICAL ERROR in getManagerAgentKpis controller:', error);
      throw error;
    }
  }

  @Get('analytics/manager/services')
  @ApiOperation({ summary: 'Manager view: per-service stats' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getServiceStats(
    @Query() query: { startDate?: string; endDate?: string },
    @Request() req
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getServiceStats(dateRange);
  }

  @Get('analytics/manager/clinics')
  @ApiOperation({ summary: 'Manager view: per-clinic stats' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getClinicAnalytics(
    @Query() query: { startDate?: string; endDate?: string; clinicId?: string },
    @Request() req
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getClinicAnalytics(dateRange, query.clinicId);
  }

  @Get('analytics/campaigns')
  @ApiOperation({ summary: 'Get Facebook campaign performance' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getCampaignPerformance(
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getCampaignPerformance(dateRange);
  }

  @Get('accessible-clinics')
  @ApiOperation({ summary: 'Get accessible clinics for current user' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getAccessibleClinics(@Request() req) {
    return this.crmService.getAccessibleClinicsForUser(req.user.id);
  }

  @Get('salespersons')
  @ApiOperation({ summary: 'Get all salespersons' })
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  getSalespersons() {
    return this.crmService.getSalespersons();
  }

  @Get('activities/diary')
  @ApiOperation({ summary: 'Get sales activities for diary view' })
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  getSalesActivities(@Query('date') date: string, @Request() req) {
    const salespersonId = req.user.role === UserRole.SALESPERSON ? req.user.id : undefined;
    return this.crmService.getSalesActivities(date ? new Date(date) : undefined, salespersonId);
  }

  @Get('manager-crm/calls')
  @ApiOperation({ summary: 'Get global call logs for manager view' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getGlobalCallLogs(@Query() query: { startDate?: string; endDate?: string; salespersonId?: string }) {
    const filters = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      salespersonId: query.salespersonId
    };
    return this.crmService.getGlobalCallLogs(filters);
  }
  @Get('manager-crm/seed-mock-data')
  @Public()
  @ApiOperation({ summary: 'Seed mock CRM data for testing' })
  seedMockData() {
    return this.crmService.seedMockCrmData();
  }

  @Get('access-matrix')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get agent access matrix' })
  getAccessMatrix() {
    return this.crmService.getAccessMatrix();
  }

  @Post('tasks/inject-confirmations')
  injectConfirmations() {
    return this.crmService.scheduledInjectConfirmationTask();
  }

  @Post('tasks/inject-followups')
  injectFollowups() {
    return this.crmService.scheduledInjectNextDayFollowUp();
  }

  @Get('client-benefits')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get client benefits list' })
  getClientBenefits(@Query() filters: any) {
    return this.crmService.getClientBenefits(filters);
  }

  @Put('client-benefits/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update client benefit' })
  updateClientBenefit(@Param('id') id: string, @Body() body: any) {
    return this.crmService.updateClientBenefit(id, body);
  }

  @Get('no-show-alerts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get no-show alerts' })
  getNoShowAlerts(@Query() filters: any) {
    return this.crmService.getNoShowAlerts(filters);
  }

  @Post('no-show-alerts/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Resolve a no-show alert' })
  resolveNoShowAlert(@Param('id') id: string, @Body('actionTaken') actionTaken: string) {
    return this.crmService.resolveNoShowAlert(id, actionTaken);
  }

  @Get('agents/emails')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get list of agent emails' })
  getAgentEmails() {
    return this.crmService.getAgentEmails();
  }


}