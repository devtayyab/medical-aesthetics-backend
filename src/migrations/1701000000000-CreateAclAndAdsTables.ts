// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class CreateAclAndAdsTables1701000000000 implements MigrationInterface {
//   name = 'CreateAclAndAdsTables1701000000000'

//   public async up(queryRunner: QueryRunner): Promise<void> {
//     // clinic_ownership
//     await queryRunner.query(`
//       CREATE TABLE IF NOT EXISTS clinic_ownership (
//         id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//         clinicId uuid NOT NULL,
//         ownerUserId uuid NOT NULL,
//         visibilityScope varchar(20) NOT NULL DEFAULT 'private'
//       );
//     `);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_clinic_ownership_clinic ON clinic_ownership (clinicId);`);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_clinic_ownership_owner ON clinic_ownership (ownerUserId);`);

//     // agent_clinic_access
//     await queryRunner.query(`
//       CREATE TABLE IF NOT EXISTS agent_clinic_access (
//         id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//         agentUserId uuid NOT NULL,
//         clinicId uuid NOT NULL
//       );
//     `);
//     await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_clinic ON agent_clinic_access (agentUserId, clinicId);`);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_agent_access_agent ON agent_clinic_access (agentUserId);`);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_agent_access_clinic ON agent_clinic_access (clinicId);`);

//     // ad_campaigns
//     await queryRunner.query(`
//       CREATE TABLE IF NOT EXISTS ad_campaigns (
//         id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//         platform varchar(50) NOT NULL,
//         externalId varchar(255) NOT NULL,
//         ownerAgentId uuid NULL,
//         name varchar(255) NOT NULL,
//         budget numeric(12,2) NULL,
//         startDate timestamptz NULL,
//         endDate timestamptz NULL,
//         metadata jsonb NULL,
//         "createdAt" timestamptz NOT NULL DEFAULT now(),
//         "updatedAt" timestamptz NOT NULL DEFAULT now()
//       );
//     `);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform ON ad_campaigns (platform);`);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ad_campaigns_external ON ad_campaigns (externalId);`);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ad_campaigns_owner ON ad_campaigns (ownerAgentId);`);

//     // ad_spend_logs
//     await queryRunner.query(`
//       CREATE TABLE IF NOT EXISTS ad_spend_logs (
//         id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//         campaignId uuid NOT NULL,
//         date date NOT NULL,
//         spend numeric(12,2) NOT NULL DEFAULT 0,
//         clicks int NOT NULL DEFAULT 0,
//         impressions int NOT NULL DEFAULT 0,
//         leads int NOT NULL DEFAULT 0,
//         "createdAt" timestamptz NOT NULL DEFAULT now()
//       );
//     `);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ad_spend_campaign ON ad_spend_logs (campaignId);`);
//     await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ad_spend_date ON ad_spend_logs (date);`);
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(`DROP TABLE IF EXISTS ad_spend_logs;`);
//     await queryRunner.query(`DROP TABLE IF EXISTS ad_campaigns;`);
//     await queryRunner.query(`DROP TABLE IF EXISTS agent_clinic_access;`);
//     await queryRunner.query(`DROP TABLE IF EXISTS clinic_ownership;`);
//   }
// }
