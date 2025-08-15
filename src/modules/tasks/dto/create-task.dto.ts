import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  IsObject,
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
  @IsObject()
  metadata?: any;
}