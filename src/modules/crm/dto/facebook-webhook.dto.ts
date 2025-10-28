import { IsString, IsArray, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FacebookFieldData {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  values: string[];
}

export class FacebookLeadEntry {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ type: [FacebookFieldData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookFieldData)
  field_data: FacebookFieldData[];

  @ApiProperty()
  @IsString()
  created_time: string;

  @ApiProperty({ required: false })
  @IsString()
  ad_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  adset_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  campaign_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  form_id?: string;
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
