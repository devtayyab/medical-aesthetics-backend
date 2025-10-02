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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('CRM')
@Controller('crm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('leads')
  @ApiOperation({ summary: 'Create a new lead' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
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
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  findAll(@Query() filters: any) {
    return this.crmService.findAll(filters);
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get lead details' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.crmService.findById(id);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update lead information' })
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.crmService.update(id, updateLeadDto);
  }

  @Delete('leads/:id')
  @ApiOperation({ summary: 'Soft delete lead' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.crmService.softDelete(id);
  }

  // Customer Record Management
  @Get('customers/:id/record')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get complete customer record with full history' })
  getCustomerRecord(@Param('id') customerId: string, @Request() req) {
    return this.crmService.getCustomerRecord(customerId, req.user.id);
  }

  @Put('customers/:id/record')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
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
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Log communication (call, email, meeting, etc.)' })
  logCommunication(@Body() communicationData: any, @Request() req) {
    return this.crmService.logCommunication({
      ...communicationData,
      salespersonId: req.user.id,
    });
  }

  @Get('customers/:id/communications')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get customer communication history' })
  getCommunicationHistory(
    @Param('id') customerId: string,
    @Query() filters: any,
  ) {
    return this.crmService.getCommunicationHistory(customerId, filters);
  }

  // Action/Task Management
  @Post('actions')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create action/task (phone call, follow-up, etc.)' })
  createAction(@Body() actionData: any, @Request() req) {
    return this.crmService.createAction({
      ...actionData,
      salespersonId: req.user.id,
    });
  }

  @Put('actions/:id')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update action/task' })
  updateAction(@Param('id') id: string, @Body() updateData: any) {
    return this.crmService.updateAction(id, updateData);
  }

  @Get('actions')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get actions/tasks with filters' })
  getActions(@Query() filters: any, @Request() req) {
    return this.crmService.getActions(req.user.id, filters);
  }

  @Get('actions/pending')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get pending actions/tasks' })
  getPendingActions(@Request() req) {
    return this.crmService.getPendingActions(req.user.id);
  }

  // Customer Tag Management
  @Post('customers/:id/tags')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
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
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Remove customer tag' })
  removeCustomerTag(@Param('id') id: string) {
    return this.crmService.removeCustomerTag(id);
  }

  @Get('tags/:tagId/customers')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get customers by tag' })
  getCustomersByTag(@Param('tagId') tagId: string, @Request() req) {
    return this.crmService.getCustomersByTag(tagId, req.user.id);
  }

  // Repeat Customer Management
  @Get('customers/repeat')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get repeat customers' })
  getRepeatCustomers(@Request() req) {
    return this.crmService.identifyRepeatCustomers(req.user.id);
  }

  @Get('customers/follow-up')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON, UserRole.SECRETARIAT)
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

  // Salesperson Analytics
  @Get('analytics/salesperson')
  @Roles(UserRole.ADMIN, UserRole.SALESPERSON)
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
}