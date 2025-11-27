import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddAdAttributionToLeads1702000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add facebookCampaignId to customer_records
    await queryRunner.addColumn(
      'customer_records',
      new TableColumn({
        name: 'facebookCampaignId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    // Create ad_attribution table
    await queryRunner.query(`
      CREATE TABLE "ad_attributions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customerRecordId" uuid NOT NULL,
        "adCampaignId" uuid NOT NULL,
        "firstInteractionAt" timestamp with time zone NOT NULL DEFAULT now(),
        "lastInteractionAt" timestamp with time zone NOT NULL DEFAULT now(),
        "interactionCount" integer NOT NULL DEFAULT 1,
        "converted" boolean NOT NULL DEFAULT false,
        "convertedAt" timestamp with time zone,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ad_attribution_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ad_attribution_unique" UNIQUE ("customerRecordId", "adCampaignId")
      )
    `);

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'ad_attributions',
      new TableForeignKey({
        columnNames: ['customerRecordId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customer_records',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ad_attributions',
      new TableForeignKey({
        columnNames: ['adCampaignId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ad_campaigns',
        onDelete: 'CASCADE',
      }),
    );

    // Create index for better query performance
    await queryRunner.query(
      'CREATE INDEX IDX_ad_attributions_customer ON ad_attributions("customerRecordId");',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_ad_attributions_campaign ON ad_attributions("adCampaignId");',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customer_records', 'facebookCampaignId');
    await queryRunner.dropTable('ad_attributions');
  }
}
