import { CreateUserDto } from '../../users/dto/create-user.dto';
import { IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto extends CreateUserDto {
  @ApiProperty({
    required: false,
    description: 'Clinic data for clinic_owner role',
    example: {
      name: 'My Clinic',
      description: 'A premier medical aesthetics clinic',
      phone: '+1234567890',
      email: 'clinic@example.com',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    }
  })
  @IsOptional()
  @IsObject()
  clinicData?: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };

  @ApiProperty({ required: false, description: 'Referral code if invited by a friend' })
  @IsOptional()
  referralCode?: string;
}