import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingTables1703000000002 implements MigrationInterface {
  name = 'AddMissingTables1703000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ad_attributions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ad_attributions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerRecordId" uuid NOT NULL,
        "adCampaignId" uuid NOT NULL,
        "firstInteractionAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "lastInteractionAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "interactionCount" integer NOT NULL DEFAULT 1,
        "converted" boolean NOT NULL DEFAULT false,
        "convertedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "FK_ad_attributions_customer_record" FOREIGN KEY ("customerRecordId") REFERENCES customer_records(id) ON DELETE CASCADE,
        CONSTRAINT "FK_ad_attributions_ad_campaign" FOREIGN KEY ("adCampaignId") REFERENCES ad_campaigns(id) ON DELETE CASCADE
      );
    `);

    // Create ad_campaigns table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ad_campaigns (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        platform varchar(50) NOT NULL,
        "externalId" varchar(255) NOT NULL,
        "ownerAgentId" uuid,
        name varchar(255) NOT NULL,
        budget numeric(12,2) DEFAULT 0,
        "startDate" TIMESTAMP WITH TIME ZONE,
        "endDate" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);

    // Add foreign key from customer_records to ad_attributions
    await queryRunner.query(`
      ALTER TABLE customer_records 
      ADD COLUMN IF NOT EXISTS "facebookCampaignId" varchar(100) NULL,
      ADD COLUMN IF NOT EXISTS "adAttributionId" uuid NULL,
      ADD CONSTRAINT "FK_customer_records_ad_attribution" 
        FOREIGN KEY ("adAttributionId") 
        REFERENCES ad_attributions(id) 
        ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customer_records 
      DROP CONSTRAINT IF EXISTS "FK_customer_records_ad_attribution",
      DROP COLUMN IF EXISTS "facebookCampaignId",
      DROP COLUMN IF EXISTS "adAttributionId";
    `);
    
    await queryRunner.query(`DROP TABLE IF EXISTS ad_attributions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS ad_campaigns;`);
  }
}
