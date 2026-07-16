import { IsString, IsArray, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// --- Real Facebook Leadgen Webhook payload ------------------------------------
// POST /crm/facebook/webhook
// {
//   "object": "page",
//   "entry": [{
//     "id": "PAGE_ID",
//     "time": 123456789,
//     "changes": [{
//       "field": "leadgen",
//       "value": {
//         "leadgen_id": "LEAD_ID",
//         "page_id":    "PAGE_ID",
//         "form_id":    "FORM_ID",
//         "ad_id":      "AD_ID",
//         "adgroup_id": "ADGROUP_ID",
//         "created_time": 123456789
//       }
//     }]
//   }]
// }

export class FacebookLeadgenValue {
  @ApiProperty()
  @IsString()
  leadgen_id: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  page_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  form_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ad_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  adgroup_id?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  created_time?: number;
}

export class FacebookWebhookChange {
  @ApiProperty()
  @IsString()
  field: string;          // e.g. "leadgen"

  @ApiProperty()
  @Type(() => FacebookLeadgenValue)
  value: FacebookLeadgenValue;
}

export class FacebookWebhookEntry {
  @ApiProperty()
  @IsString()
  id: string;             // Page ID

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  time?: number;

  @ApiProperty({ type: [FacebookWebhookChange] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookWebhookChange)
  changes: FacebookWebhookChange[];
}

export class FacebookWebhookDto {
  @ApiProperty()
  @IsString()
  object: string;         // "page"

  @ApiProperty({ type: [FacebookWebhookEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookWebhookEntry)
  entry: FacebookWebhookEntry[];
}

// --- Legacy / Test DTO (kept for backward compat) -----------------------------
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
  @IsOptional()
  ad_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  adset_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  campaign_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  form_id?: string;
}
