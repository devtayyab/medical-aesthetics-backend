import { IsString, IsArray, IsObject, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FacebookLeadGenValue {
  @ApiProperty()
  @IsString()
  form_id: string;

  @ApiProperty()
  @IsString()
  leadgen_id: string;

  @ApiProperty()
  @IsNumber()
  created_time: number;

  @ApiProperty()
  @IsString()
  page_id: string;
}

export class FacebookChange {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty({ type: FacebookLeadGenValue })
  @ValidateNested()
  @Type(() => FacebookLeadGenValue)
  value: FacebookLeadGenValue;
}

export class FacebookLeadEntry {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNumber()
  time: number;

  @ApiProperty({ type: [FacebookChange] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookChange)
  changes: FacebookChange[];
}

export class FacebookWebhookDto {
  @ApiProperty()
  @IsString()
  object: string;

  @ApiProperty({ type: [FacebookLeadEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookLeadEntry)
  entry: FacebookLeadEntry[];
}
