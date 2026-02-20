import {
    IsString,
    IsArray,
    IsOptional,
    IsBoolean,
    IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
    @ApiProperty({ example: ['uuid-1', 'uuid-2'] })
    @IsUUID(undefined, { each: true })
    @IsArray()
    participantIds: string[];

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ default: false })
    @IsBoolean()
    @IsOptional()
    isGroup?: boolean;
}

export class SendMessageDto {
    @ApiProperty()
    @IsString()
    content: string;

    @ApiProperty({ required: false, default: 'text' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    metadata?: any;
}

export class SearchMessageDto {
    @ApiProperty()
    @IsString()
    query: string;
}
