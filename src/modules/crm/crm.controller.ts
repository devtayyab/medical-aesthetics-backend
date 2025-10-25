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
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FacebookWebhookDto } from './dto/facebook-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('CRM')
@Controller('crm')
export class CrmController {
  private readonly logger = new Logger(CrmController.name);

  constructor(private readonly crmService: CrmService) {}

  // ==================== FACEBOOK WEBHOOK (NO AUTH) ====================
  
  @Post('webhook/facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Facebook Lead Ads Webhook (No Authentication)',
    description: 'Receives lead data from Facebook and handles duplicate detection automatically'
  })
  async facebookWebhook(@Body() webhookData: FacebookWebhookDto) {
    try {
      this.logger.log('Received Facebook webhook');
      const result = await this.crmService.processFacebookLead(webhookData);
      return result;
    } catch (error) {
      this.logger.error('Error processing Facebook webhook:', error);
      throw error;
    }
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  @Post('leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lead' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.crmService.create(createLeadDto);
  }

  @Get('leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get leads with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assignedSalesId', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'search', required: false })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  findAll(@Query() filters: any) {
    return this.crmService.findAll(filters);
  }

  @Get('leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead details' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  findOne(@Param('id') id: string) {
    return this.crmService.findById(id);
  }

  @Patch('leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead information' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.crmService.update(id, updateLeadDto);
  }

  @Delete('leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete lead' })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.crmService.softDelete(id);
  }

  // Customer Record Management
  @Get('customers/:id/record')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get complete customer record with full history' })
  getCustomerRecord(@Param('id') customerId: string, @Request() req) {
    return this.crmService.getCustomerRecord(customerId, req.user.id);
  }

  @Put('customers/:id/record')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Update customer record' })
  updateCustomerRecord(
    @Param('id') customerId: string,
    @Body() updateData: any,
  ) {
    return this.crmService.updateCustomerRecord(customerId, updateData);
  }

  @Get('customers/:id/form-submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get all form submissions for a customer (shows duplicate history)' })
  getCustomerFormSubmissions(@Param('id') customerId: string) {
    return this.crmService.getCustomerFormSubmissions(customerId);
  }

  // Communication Log Management
  @Post('communications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Log communication (call, email, meeting, etc.)' })
  logCommunication(@Body() communicationData: any, @Request() req) {
    return this.crmService.logCommunication({
      ...communicationData,
      salespersonId: req.user.id,
    });
  }

  @Get('customers/:id/communications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get customer communication history' })
  getCommunicationHistory(
    @Param('id') customerId: string,
    @Query() filters: any,
  ) {
    return this.crmService.getCommunicationHistory(customerId, filters);
  }

  // Action/Task Management
  @Post('actions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Create action/task (phone call, follow-up, etc.)' })
  createAction(@Body() actionData: any, @Request() req) {
    return this.crmService.createAction({
      ...actionData,
      salespersonId: req.user.id,
    });
  }

  @Put('actions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Update action/task' })
  updateAction(@Param('id') id: string, @Body() updateData: any) {
    return this.crmService.updateAction(id, updateData);
  }

  @Get('actions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get actions/tasks with filters' })
  getActions(@Query() filters: any, @Request() req) {
    return this.crmService.getActions(req.user.id, filters);
  }

  @Get('actions/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get pending actions/tasks' })
  getPendingActions(@Request() req) {
    return this.crmService.getPendingActions(req.user.id);
  }

  // Customer Tag Management
  @Post('customers/:id/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Remove customer tag' })
  removeCustomerTag(@Param('id') id: string) {
    return this.crmService.removeCustomerTag(id);
  }

  @Get('tags/:tagId/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get customers by tag' })
  getCustomersByTag(@Param('tagId') tagId: string, @Request() req) {
    return this.crmService.getCustomersByTag(tagId, req.user.id);
  }

  // Repeat Customer Management
  @Get('customers/repeat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get repeat customers' })
  getRepeatCustomers(@Request() req) {
    return this.crmService.identifyRepeatCustomers(req.user.id);
  }

  @Get('customers/follow-up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
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

  // Salesperson Analytics
  @Get('analytics/salesperson')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
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

  // Form Submission Statistics
  @Get('analytics/form-submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get form submission statistics (duplicates, new leads, etc.)' })
  getFormSubmissionStats(@Query() query: { startDate?: string; endDate?: string; source?: string }) {
    const filters = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      source: query.source,
    };
    return this.crmService.getFormSubmissionStats(filters);
  }
}