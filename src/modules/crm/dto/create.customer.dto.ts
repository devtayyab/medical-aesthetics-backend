import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john.doe@email.com', required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ example: '+971501234567', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'Some notes about the customer', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ example: 'uuid-of-salesperson', required: false })
    @IsOptional()
    @IsUUID()
    salespersonId?: string;
}
