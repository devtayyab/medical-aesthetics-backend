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
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // A task may be read/modified by its assignee or an admin/manager. Anything else is an IDOR.
  private async assertCanAccess(id: string, user: any) {
    const task = await this.tasksService.findById(id);
    const isPrivileged = ['admin', 'SUPER_ADMIN', 'manager'].includes(user?.role);
    if (!isPrivileged && task.assigneeId !== user?.id) {
      throw new ForbiddenException('You do not have access to this task.');
    }
    return task;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    // Non-privileged users can only create tasks assigned to themselves.
    const isPrivileged = ['admin', 'SUPER_ADMIN', 'manager'].includes(req.user?.role);
    if (!isPrivileged) {
      createTaskDto.assigneeId = req.user.id;
    }
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get tasks with filters' })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'overdueOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'dueDateFrom', required: false })
  @ApiQuery({ name: 'dueDateTo', required: false })
  findAll(@Query() filters: any, @Request() req) {
    // If no specific assignee filter, show user's own tasks, except for admin/super admin
    const isAdminLike =
      req.user.role === 'admin' || req.user.role === 'SUPER_ADMIN';

    if (!filters.assigneeId && !isAdminLike) {
      filters.assigneeId = req.user.id;
    }

    if (typeof filters.overdueOnly === 'string') {
      filters.overdueOnly = filters.overdueOnly === 'true';
    }

    return this.tasksService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.assertCanAccess(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    await this.assertCanAccess(id, req.user);
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete task' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.assertCanAccess(id, req.user);
    return this.tasksService.softDelete(id);
  }
}