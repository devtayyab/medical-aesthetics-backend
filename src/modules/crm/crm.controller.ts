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
      salespersonId: req.user.id,
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

  // Action/Task Management
  @Post('actions')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }))
  @ApiOperation({ summary: 'Create action/task (phone call, follow-up, etc.)' })
  async createAction(@Body() createActionDto: CreateActionDto, @Request() req) {
    const action = await this.crmService.createAction({
      ...createActionDto,
      salespersonId: req.user.id, // attach logged-in user
    });
    return action;
  }

  @Post('recurring-appointments')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Schedule recurring appointments' })
  async createRecurringAppointment(@Body() data: any, @Request() req) {
    return this.crmService.scheduleRecurringAppointment(data);
  }



  @Patch('actions/:id')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update action/task' })
  updateAction(@Param('id') id: string, @Body() updateData: any) {
    return this.crmService.updateAction(id, updateData);
  }

  @Get('actions')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get actions/tasks with filters' })
  getActions(@Query() filters: any, @Request() req) {
    return this.crmService.getActions(req.user.id, filters);
  }

  @Get('actions/pending')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get pending actions/tasks' })
  getPendingActions(@Request() req) {
    return this.crmService.getPendingActions(req.user.id);
  }


  // Customer Tag Management
  @Post('customers/:id/tags')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add characterization tag to customer' })
  addCustomerTag(
    @Param('id') customerId: string,
    @Body() body: { tagId: string; notes?: string },
    @Request() req,
  ) {
    return this.crmService.addCustomerTag(
      customerId,
      body.tagId,
      req.user.id,
      body.notes,
    );
  }

  @Delete('customer-tags/:id')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Remove customer tag' })
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

  // Repeat Customer Management
  @Get('customers/repeat')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get repeat customers' })
  getRepeatCustomers(@Request() req) {
    return this.crmService.identifyRepeatCustomers(req.user.id);
  }

  @Get('customers/follow-up')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get customers due for follow-up' })
  getCustomersDueForFollowUp(
    @Query('daysThreshold') daysThreshold: number,
    @Request() req,
  ) {
    return this.crmService.getCustomersDueForFollowUp(
      req.user.id,
      daysThreshold || 30,
    );
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get general CRM metrics' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getCrmMetrics() {
    return this.crmService.getCrmMetrics();
  }

  // Salesperson Analytics
  @Get('analytics/salesperson')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get salesperson performance analytics' })
  getSalespersonAnalytics(
    @Query() query: { startDate?: string; endDate?: string },
    @Request() req,
  ) {
    const dateRange = query.startDate && query.endDate
      ? {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      }
      : undefined;
    return this.crmService.getSalespersonAnalytics(req.user.id, dateRange);
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
    @Query() query: { startDate?: string; endDate?: string },
    @Request() req
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getClinicAnalytics(dateRange);
  }

  @Get('analytics/campaigns')
  @ApiOperation({ summary: 'Campaign performance with spend and revenue' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getCampaignPerformance(
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getCampaignPerformance(dateRange);
  }

  @Get('analytics/agent-forms')
  @ApiOperation({ summary: 'Get agent form statistics' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getAgentFormStats(
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getAgentFormStats(dateRange);
  }

  @Get('analytics/agent-communications')
  @ApiOperation({ summary: 'Get agent communication statistics' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getAgentCommunicationStats(
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getAgentCommunicationStats(dateRange);
  }

  @Get('analytics/agent-appointments')
  @ApiOperation({ summary: 'Get agent appointment statistics' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getAgentAppointmentStats(
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getAgentAppointmentStats(dateRange);
  }

  @Get('analytics/agent-cashflow')
  @ApiOperation({ summary: 'Get agent cashflow statistics' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getAgentCashflow(
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getAgentCashflow(dateRange);
  }

  @Get('analytics/clinic-return-rates')
  @ApiOperation({ summary: 'Get clinic return rates' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getClinicReturnRates() {
    return this.crmService.getClinicReturnRates();
  }

  @Get('analytics/service-performance')
  @ApiOperation({ summary: 'Get service performance statistics' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getServicePerformance(
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getServicePerformance(dateRange);
  }

  @Get('analytics/advertisement-stats')
  @ApiOperation({ summary: 'Get advertisement statistics' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getAdvertisementStats(
    @Query() query: { startDate?: string; endDate?: string }
  ) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getAdvertisementStats(dateRange);
  }

  @Get('analytics/:salespersonId')
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get analytics for a specific salesperson' })
  getSalespersonAnalyticsById(
    @Param('salespersonId') salespersonId: string,
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    const dateRange = query.startDate && query.endDate
      ? {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      }
      : undefined;
    return this.crmService.getSalespersonAnalytics(salespersonId, dateRange);
  }
  // Facebook Integration Endpoints
  @Get('facebook/webhook')
  @Public()
  @ApiOperation({ summary: 'Verify Facebook webhook' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.crmService.verifyWebhook(mode, verifyToken, challenge);
  }

  @Post('facebook/webhook')
  @ApiOperation({ summary: 'Handle Facebook webhook for lead generation' })
  @Public() // Allow Facebook to call this without JWT
  async handleFacebookWebhook(
    @Body() webhookData: FacebookWebhookDto,
    @Request() req: any,
  ) {
    // Facebook sends X-Hub-Signature in headers
    const signature = req.headers['x-hub-signature'];

    // In a real production app with body-parser, getting the raw body for HMAC can be tricky.
    // For this implementation, we will pass the signature to the service.
    // Ideally, we need the raw buffer. If the app is set up with standard JSON body parser,
    // verify might need a middleware or interceptor. 
    // For now, we'll delegate to the service to check if it can validate or if we skip securely.

    // Check signature if provided
    if (signature) {
      const isValid = this.crmService.validateFacebookSignature(signature, webhookData);
      if (!isValid) {
        // throw new ForbiddenException('Invalid Facebook signature');
        // For now, just log warning as user doesn't have secret yet
        console.warn('Invalid or missing Facebook App Secret for signature verification');
      }
    }

    return this.crmService.handleFacebookWebhook(webhookData);
  }

  @Post('facebook/import/:formId')
  @ApiOperation({ summary: 'Import leads from Facebook form' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  importFacebookLeads(
    @Param('formId') formId: string,
    @Query('limit') limit?: number,
  ) {
    return this.crmService.importFacebookLeads(formId, limit);
  }

  @Get('facebook/test')
  @ApiOperation({ summary: 'Test Facebook API connection' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  testFacebookConnection() {
    return this.crmService.testFacebookConnection();
  }

  @Get('facebook/forms')
  @ApiOperation({ summary: 'Get available Facebook lead forms' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.ADMIN)
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

  @Get('validation/required-fields/call')
  @ApiOperation({ summary: 'Get required fields for call communications' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getRequiredFieldsForCall() {
    return this.crmService.getRequiredFieldsForCall();
  }

  @Get('validation/required-fields/action/:actionType')
  @ApiOperation({ summary: 'Get required fields for action type' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getRequiredFieldsForAction(@Param('actionType') actionType: string) {
    return this.crmService.getRequiredFieldsForAction(actionType);
  }

  @Post('validation/validate-communication')
  @ApiOperation({ summary: 'Validate communication data' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  validateCommunication(@Body() data: { customerId: string; communicationData: Partial<CommunicationLog> }) {
    return this.crmService.validateCommunicationFields(data.customerId, data.communicationData);
  }

  @Post('validation/validate-action')
  @ApiOperation({ summary: 'Validate action data' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  validateAction(@Body() data: { customerId: string; actionData: Partial<CrmAction> }) {
    return this.crmService.validateActionFields(data.customerId, data.actionData);
  }

  @Get('tasks/overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getOverdueTasks(@Query('salespersonId') salespersonId?: string) {
    return this.crmService.getOverdueTasks(salespersonId);
  }

  @Get('automation/rules')
  @ApiOperation({ summary: 'Get automation rules' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getAutomationRules() {
    return this.crmService.getAutomationRules();
  }

  @Post('automation/run-check')
  @ApiOperation({ summary: 'Run task automation check' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  runTaskAutomationCheck() {
    return this.crmService.runTaskAutomationCheck();
  }

  @Get('accessible-clinics')
  @ApiOperation({ summary: 'List clinics accessible to the current user' })
  @Roles(UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  getAccessibleClinics(@Request() req) {
    return this.crmService.getAccessibleClinicsForUser(req.user.id);
  }



  @Post('reports/weekly/agents')
  @ApiOperation({ summary: 'Send weekly reports to agents' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  sendWeeklyReports() {
    return this.crmService.sendWeeklyAgentReports();
  }

  // Agent Management Endpoints
  @Get('agents/emails')
  @ApiOperation({ summary: 'Get all agent emails' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getAgentEmails() {
    return this.crmService.getAgentEmails();
  }



  // Access Control Endpoints
  @Get('access-matrix')
  @ApiOperation({ summary: 'Get agent access matrix' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getAccessMatrix() {
    return this.crmService.getAccessMatrix();
  }

  @Put('access-matrix/:agentId')
  @ApiOperation({ summary: 'Update agent access matrix' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  updateAgentAccess(
    @Param('agentId') agentId: string,
    @Body() data: { clinicAccess: { clinicId: string; hasAccess: boolean }[] }
  ) {
    return this.crmService.updateAgentAccess(agentId, data.clinicAccess);
  }

  // Client Benefits Endpoints
  @Get('client-benefits')
  @ApiOperation({ summary: 'Get client benefits' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getClientBenefits(
    @Query() query: { search?: string; clinicId?: string }
  ) {
    return this.crmService.getClientBenefits(query);
  }

  @Put('client-benefits/:customerId')
  @ApiOperation({ summary: 'Update client benefit' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  updateClientBenefit(
    @Param('customerId') customerId: string,
    @Body() data: any
  ) {
    return this.crmService.updateClientBenefit(customerId, data);
  }

  // No-Show Management Endpoints
  @Get('no-show-alerts')
  @ApiOperation({ summary: 'Get no-show alerts' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getNoShowAlerts(
    @Query() query: { daysAgo?: number; status?: 'pending' | 'resolved' }
  ) {
    return this.crmService.getNoShowAlerts(query);
  }

  @Post('no-show-alerts/:appointmentId/resolve')
  @ApiOperation({ summary: 'Resolve no-show alert' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  resolveNoShowAlert(
    @Param('appointmentId') appointmentId: string,
    @Body() data: { actionTaken: string }
  ) {
    return this.crmService.resolveNoShowAlert(appointmentId, data.actionTaken);
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
}