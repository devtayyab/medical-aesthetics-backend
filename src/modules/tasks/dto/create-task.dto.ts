import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  IsObject,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../../../common/enums/task-type.enum';
import { TaskStatus } from '../../../common/enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Follow up with lead' })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ example: '2025-01-20T09:00:00Z', description: 'When the user should be reminded about this task' })
  @IsDateString()
  reminderAt: string;

  @ApiProperty({ example: '2025-01-20T10:00:00Z' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  customerRecordId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ required: false, description: 'Whether this task is recurring' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    required: false,
    description: 'Interval in days for recurring tasks (e.g. 7 for weekly)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  recurringIntervalDays?: number;

  @ApiProperty({
    required: false,
    example: '2026-01-20T10:00:00Z',
    description: 'Optional end date for recurring tasks',
  })
  @IsOptional()
  @IsDateString()
  recurringUntil?: string;
}