import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsArray,
  IsPhoneNumber,
  IsObject,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+306912345678', required: true })
  @IsString()
  @IsNotEmpty({ message: 'Mobile phone number is required' })
  @Matches(/^\+?[\d\s()-]{8,20}$/, { message: 'Please enter a valid mobile phone number' })
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  profile?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  marketingEmailConsent?: boolean;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ example: 'uuid-of-clinic', required: false })
  @IsOptional()
  @IsString()
  assignedClinicId?: string;

  @ApiProperty({ type: [String], example: ['uuid-clinic-1', 'uuid-clinic-2'], required: false })
  @IsOptional()
  @IsArray()
  assignedClinicIds?: string[];
}