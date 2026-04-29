import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PRODUCTION FIX: crm_actions.customerId FK mismatch
 *
 * On production the crm_actions.customerId FK may be pointing to users(id) instead
 * of customer_records(id), or may not exist at all.  This migration:
 *   1. Drops ALL existing FKs on crm_actions.customerId (regardless of name).
 *   2. Makes the column nullable (matches the entity).
 *   3. Re-creates the correct FK → customer_records(id) ON DELETE CASCADE.
 *
 * This is idempotent and safe to run multiple times.
 */
export class FixCrmActionsCustomerIdFK1775900000000 implements MigrationInterface {
  name = 'FixCrmActionsCustomerIdFK1775900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Find and drop every FK on crm_actions.customerId (there may be 0 or more)
    const fks = await queryRunner.query(`
      SELECT tc.constraint_name
      FROM   information_schema.table_constraints AS tc
      JOIN   information_schema.key_column_usage  AS kcu
             ON  tc.constraint_name = kcu.constraint_name
             AND tc.table_schema    = kcu.table_schema
      WHERE  tc.constraint_type = 'FOREIGN KEY'
        AND  tc.table_name      = 'crm_actions'
        AND  kcu.column_name    = 'customerId'
        AND  tc.table_schema    = 'public'
    `);

    for (const row of fks) {
      console.log(`[FixCrmActionsCustomerIdFK] Dropping FK: ${row.constraint_name}`);
      await queryRunner.query(
        `ALTER TABLE "crm_actions" DROP CONSTRAINT "${row.constraint_name}"`,
      );
    }

    // 2. Ensure the column is nullable (matches entity definition)
    await queryRunner.query(
      `ALTER TABLE "crm_actions" ALTER COLUMN "customerId" DROP NOT NULL`,
    );

    // 3. Re-create the correct FK → customer_records(id)
    const correctFkExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE  constraint_name = 'FK_crm_actions_customerId_customer_records'
          AND  table_schema    = 'public'
      )
    `);

    if (!correctFkExists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "crm_actions"
        ADD CONSTRAINT "FK_crm_actions_customerId_customer_records"
        FOREIGN KEY ("customerId")
        REFERENCES "customer_records"("id")
        ON DELETE CASCADE
      `);
      console.log('[FixCrmActionsCustomerIdFK] Correct FK added → customer_records(id)');
    } else {
      console.log('[FixCrmActionsCustomerIdFK] Correct FK already exists — skipping.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "crm_actions" DROP CONSTRAINT IF EXISTS "FK_crm_actions_customerId_customer_records"`,
    );
  }
}
