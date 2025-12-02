import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdTables1703000000002 implements MigrationInterface {
  name = 'AddAdTables1703000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ad_campaigns table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ad_campaigns (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "platform" varchar(50) NOT NULL,
        "externalId" varchar(255) NOT NULL,
        "ownerAgentId" uuid NULL,
        "name" varchar(255) NOT NULL,
        "budget" numeric(12,2) DEFAULT 0,
        "startDate" TIMESTAMP WITH TIME ZONE NULL,
        "endDate" TIMESTAMP WITH TIME ZONE NULL,
        "metadata" jsonb NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ad_campaigns_externalId" ON "ad_campaigns" ("externalId");
      CREATE INDEX IF NOT EXISTS "IDX_ad_campaigns_owner" ON "ad_campaigns" ("ownerAgentId");
    `);

    // Create ad_attributions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ad_attributions (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerRecordId" uuid NOT NULL,
        "adCampaignId" uuid NOT NULL,
        "firstInteractionAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "lastInteractionAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "interactionCount" integer NOT NULL DEFAULT 1,
        "converted" boolean NOT NULL DEFAULT false,
        "convertedAt" TIMESTAMP WITH TIME ZONE NULL,
        "metadata" jsonb NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_ad_attributions_customer_record" 
          FOREIGN KEY ("customerRecordId") 
          REFERENCES customer_records(id) 
          ON DELETE CASCADE,
        CONSTRAINT "FK_ad_attributions_ad_campaign" 
          FOREIGN KEY ("adCampaignId") 
          REFERENCES ad_campaigns(id) 
          ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_ad_attributions_customer" ON "ad_attributions" ("customerRecordId");
      CREATE INDEX IF NOT EXISTS "IDX_ad_attributions_campaign" ON "ad_attributions" ("adCampaignId");
    `);

    // Add columns to customer_records
    await queryRunner.query(`
      ALTER TABLE "customer_records" 
      ADD COLUMN IF NOT EXISTS "facebookCampaignId" varchar(100) NULL,
      ADD COLUMN IF NOT EXISTS "adAttributionId" uuid NULL,
      ADD CONSTRAINT "FK_customer_records_ad_attribution" 
        FOREIGN KEY ("adAttributionId") 
        REFERENCES ad_attributions(id) 
        ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    await queryRunner.query(`
      ALTER TABLE "customer_records" 
      DROP CONSTRAINT IF EXISTS "FK_customer_records_ad_attribution";
    `);
    
    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "customer_records" 
      DROP COLUMN IF EXISTS "facebookCampaignId",
      DROP COLUMN IF EXISTS "adAttributionId";
    `);
    
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "ad_attributions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ad_campaigns" CASCADE;`);
  }
}
