import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
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
}