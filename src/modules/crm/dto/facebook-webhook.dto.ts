import { IsString, IsArray, IsObject, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// All value fields are optional: Facebook batches multiple entries/changes per
// delivery and may include non-leadgen changes on the same subscription. A strict
// DTO would 400 the entire batch (discarding valid leads) and repeated 400s make
// Facebook disable the subscription. handleFacebookWebhook filters on
// field === 'leadgen' and a present leadgen_id itself.
export class FacebookLeadGenValue {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  form_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  leadgen_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  created_time?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  page_id?: string;
}

export class FacebookChange {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty({ type: FacebookLeadGenValue, required: false })
  @IsOptional()
  @IsObject()
  value: any;
}

export class FacebookLeadEntry {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  time?: number;

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
