import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * QA #44: every payment carries its salesperson. Backfills payment_records.salespersonId where
 * it is NULL, with the same rule as FinancialService.recordPayment:
 *   1. the appointment's representative (salesperson / manager / admin / super admin),
 *   2. else the appointment's bookedBy, when that user is a salesperson,
 *   3. else the client's assigned salesperson in the CRM customer record,
 *   4. else the assignedSalesId of the client's CRM lead (matched by email).
 * Refund/void records also inherit the salesperson of the payment they reverse when they
 * share an appointment. Rows changed here are marked in metadata so down() can undo exactly them.
 */
export class BackfillPaymentSalesperson1787820000000 implements MigrationInterface {
    name = 'BackfillPaymentSalesperson1787820000000'

    private readonly mark = `(COALESCE(p."metadata"::jsonb, '{}'::jsonb) || '{"salespersonBackfilled": true}'::jsonb)::json`;

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Appointment representative (staff only)
        await queryRunner.query(`
            UPDATE "payment_records" p
               SET "salespersonId" = a."representativeId", "metadata" = ${this.mark}
              FROM "appointments" a
              JOIN "users" u ON u.id = a."representativeId"
             WHERE p."salespersonId" IS NULL
               AND p."appointmentId" = a.id
               AND u.role::text IN ('salesperson', 'manager', 'admin', 'SUPER_ADMIN')
        `);

        // 2. Booked by a salesperson
        await queryRunner.query(`
            UPDATE "payment_records" p
               SET "salespersonId" = a."bookedById", "metadata" = ${this.mark}
              FROM "appointments" a
              JOIN "users" u ON u.id = a."bookedById"
             WHERE p."salespersonId" IS NULL
               AND p."appointmentId" = a.id
               AND u.role::text = 'salesperson'
        `);

        // 3. Client's assigned salesperson on the CRM customer record
        await queryRunner.query(`
            UPDATE "payment_records" p
               SET "salespersonId" = cr."assignedSalespersonId"::uuid, "metadata" = ${this.mark}
              FROM (
                    SELECT DISTINCT ON ("customerId") "customerId", "assignedSalespersonId"
                      FROM "customer_records"
                     WHERE "assignedSalespersonId" IS NOT NULL
                     ORDER BY "customerId", "updatedAt" DESC
                   ) cr
             WHERE p."salespersonId" IS NULL
               AND cr."customerId"::text = p."clientId"::text
        `);

        // 4. CRM lead of the client (same email)
        await queryRunner.query(`
            UPDATE "payment_records" p
               SET "salespersonId" = l."assignedSalesId"::uuid, "metadata" = ${this.mark}
              FROM "users" u
              JOIN LATERAL (
                    SELECT "assignedSalesId"
                      FROM "leads"
                     WHERE "assignedSalesId" IS NOT NULL
                       AND "deletedAt" IS NULL
                       AND u.email IS NOT NULL
                       AND LOWER("email") = LOWER(u.email)
                     ORDER BY "updatedAt" DESC
                     LIMIT 1
                   ) l ON TRUE
             WHERE p."salespersonId" IS NULL
               AND u.id = p."clientId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "payment_records"
               SET "salespersonId" = NULL,
                   "metadata" = ("metadata"::jsonb - 'salespersonBackfilled')::json
             WHERE "metadata" IS NOT NULL
               AND ("metadata"::jsonb ->> 'salespersonBackfilled') = 'true'
        `);
    }
}
