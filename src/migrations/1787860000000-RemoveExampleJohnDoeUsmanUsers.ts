import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Removes all dummy 'example', 'John Doe' (*.doe@email.com, john smith, John Test, John Johnys),
 * and 'usman' (123@example.com) test accounts and leads, while preserving the active
 * superadmin@example.com login and all payment_records (setting email = NULL on any payment-linked
 * client that had an @example.com / example28@gmail.com placeholder email).
 */
export class RemoveExampleJohnDoeUsmanUsers1787860000000 implements MigrationInterface {
    name = 'RemoveExampleJohnDoeUsmanUsers1787860000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                del_user_ids uuid[];
                real_sales_id uuid;
            BEGIN
                -- Find the primary real Greek salesperson to reassign any staff references
                SELECT id INTO real_sales_id
                FROM "users"
                WHERE LOWER(COALESCE(email, '')) IN ('solakidi.rania@gmail.com', 'mpelas1984@gmail.com', 'katiaxatzistavrianu@gmail.com')
                ORDER BY "createdAt" ASC
                LIMIT 1;

                -- Collect all dummy example / John Doe / Usman / test users that do NOT own clinics and are NOT payment clients
                SELECT array_agg(u.id) INTO del_user_ids
                FROM "users" u
                WHERE COALESCE(LOWER(u.email), '') != 'superadmin@example.com'
                  AND LOWER(u.role::text) != 'super_admin'
                  AND NOT EXISTS (SELECT 1 FROM "clinics" c WHERE c."ownerId" = u.id)
                  AND NOT EXISTS (SELECT 1 FROM "payment_records" p WHERE p."clientId" = u.id)
                  AND (
                      LOWER(COALESCE(u.email, '')) LIKE '%@example.com%'
                      OR LOWER(COALESCE(u.email, '')) LIKE 'example%@gmail.com'
                      OR LOWER(COALESCE(u.email, '')) LIKE '%.doe@email.com'
                      OR LOWER(COALESCE(u.email, '')) IN (
                          'johntest@gmail.com',
                          'johnjonys@gmail.com',
                          'sarah.test@gmail.com',
                          'bobjohnson@gmail.com',
                          'test@de.de',
                          'owner@de.de',
                          'test1@de.de',
                          'test@gmail.com',
                          'test1@gmail.com',
                          'test111@gmail.com',
                          'test765@gmail.com'
                      )
                      OR LOWER(TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) IN (
                          'john doe',
                          'johnb doe',
                          'admin doe',
                          'john smith',
                          'john test',
                          'john johnys',
                          'usman mian',
                          'farhan farhan',
                          'bob johnson',
                          'sarah johnson'
                      )
                  );

                IF del_user_ids IS NOT NULL AND array_length(del_user_ids, 1) > 0 THEN
                    -- Reassign or nullify payment_records staff references
                    IF real_sales_id IS NOT NULL THEN
                        UPDATE "payment_records" SET "salespersonId" = real_sales_id WHERE "salespersonId" = ANY(del_user_ids);
                        UPDATE "payment_records" SET "recordedById" = real_sales_id WHERE "recordedById" = ANY(del_user_ids);
                    ELSE
                        UPDATE "payment_records" SET "salespersonId" = NULL WHERE "salespersonId" = ANY(del_user_ids);
                        UPDATE "payment_records" SET "recordedById" = NULL WHERE "recordedById" = ANY(del_user_ids);
                    END IF;
                    UPDATE "payment_records" SET "providerId" = NULL WHERE "providerId" = ANY(del_user_ids);

                    -- Clean or nullify appointments references
                    UPDATE "appointments" SET "providerId" = NULL WHERE "providerId" = ANY(del_user_ids);
                    UPDATE "appointments" SET "bookedById" = real_sales_id WHERE "bookedById" = ANY(del_user_ids);
                    UPDATE "appointments" SET "representativeId" = real_sales_id WHERE "representativeId" = ANY(del_user_ids);
                    UPDATE "appointments" SET "executedById" = NULL WHERE "executedById" = ANY(del_user_ids);
                    UPDATE "appointments" SET "cancelledById" = NULL WHERE "cancelledById" = ANY(del_user_ids);
                    UPDATE "appointments" SET "noShowMarkedById" = NULL WHERE "noShowMarkedById" = ANY(del_user_ids);

                    DELETE FROM "reviews" WHERE "appointmentId" IN (
                        SELECT id FROM "appointments" WHERE "clientId" = ANY(del_user_ids)
                    ) OR "clientId" = ANY(del_user_ids);
                    UPDATE "reviews" SET "approvedById" = NULL WHERE "approvedById" = ANY(del_user_ids);

                    DELETE FROM "appointments"
                    WHERE "clientId" = ANY(del_user_ids)
                      AND NOT EXISTS (SELECT 1 FROM "payment_records" p WHERE p."appointmentId" = "appointments".id);

                    -- Clean dependent tables
                    DELETE FROM "tasks" WHERE "assigneeId" = ANY(del_user_ids);
                    UPDATE "leads" SET "assignedSalesId" = real_sales_id WHERE "assignedSalesId" = ANY(del_user_ids);
                    DELETE FROM "loyalty_ledger" WHERE "clientId" = ANY(del_user_ids);
                    DELETE FROM "notifications" WHERE "recipientId" = ANY(del_user_ids);
                    DELETE FROM "consent_records" WHERE "userId" = ANY(del_user_ids);
                    DELETE FROM "customer_tags" WHERE "addedBy" = ANY(del_user_ids) OR "customerId" = ANY(del_user_ids);
                    DELETE FROM "crm_actions" WHERE "salespersonId" = ANY(del_user_ids) OR "customerId" = ANY(del_user_ids);
                    DELETE FROM "communication_logs" WHERE "customerId" = ANY(del_user_ids) OR "salespersonId" = ANY(del_user_ids);
                    DELETE FROM "customer_records" WHERE "customerId" = ANY(del_user_ids);
                    UPDATE "customer_records" SET "assignedSalespersonId" = real_sales_id WHERE "assignedSalespersonId" = ANY(del_user_ids);
                    UPDATE "users" SET "assignedSalespersonId" = NULL WHERE "assignedSalespersonId" = ANY(del_user_ids);
                    UPDATE "users" SET "referredById" = NULL WHERE "referredById" = ANY(del_user_ids);
                    DELETE FROM "audit_logs" WHERE "userId" = ANY(del_user_ids);
                    DELETE FROM "agent_clinic_access" WHERE "agentUserId" = ANY(del_user_ids);
                    DELETE FROM "messages" WHERE "senderId" = ANY(del_user_ids);
                    DELETE FROM "conversation_participants" WHERE "userId" = ANY(del_user_ids);
                    DELETE FROM "blog_posts" WHERE "authorId" = ANY(del_user_ids);
                    DELETE FROM "gift_cards" WHERE "userId" = ANY(del_user_ids);
                    DELETE FROM "blocked_time_slots" WHERE "providerId" = ANY(del_user_ids) OR "blockedById" = ANY(del_user_ids);
                    DELETE FROM "lead_owners" WHERE "userId" = ANY(del_user_ids);

                    -- Finally delete the dummy users
                    DELETE FROM "users" WHERE id = ANY(del_user_ids);
                END IF;

                -- For any remaining users that are kept because they have payment_records or clinics,
                -- clear any fake @example.com / example*@gmail.com / @walkin.local emails (except superadmin@example.com)
                UPDATE "users"
                SET "email" = NULL
                WHERE COALESCE(LOWER("email"), '') != 'superadmin@example.com'
                  AND LOWER("role"::text) != 'super_admin'
                  AND (
                      LOWER(COALESCE("email", '')) LIKE '%@example.com%'
                      OR LOWER(COALESCE("email", '')) LIKE 'example%@gmail.com'
                      OR LOWER(COALESCE("email", '')) LIKE '%@walkin.local%'
                  );

                -- Clean clientDetails JSON on appointments so guest-*@example.com / example28@gmail.com doesn't show in modals
                UPDATE "appointments"
                SET "clientDetails" = ("clientDetails"::jsonb - 'email')::json
                WHERE "clientDetails" IS NOT NULL
                  AND (
                      LOWER(COALESCE("clientDetails"->>'email', '')) LIKE '%@example.com%'
                      OR LOWER(COALESCE("clientDetails"->>'email', '')) LIKE 'example%@gmail.com'
                      OR LOWER(COALESCE("clientDetails"->>'email', '')) LIKE '%@walkin.local%'
                  );

                -- Delete dummy @example.com leads that are not converted payment leads, and clear @example.com email on any remaining leads
                DELETE FROM "tasks"
                WHERE "relatedLeadId" IN (
                    SELECT id FROM "leads"
                    WHERE LOWER(COALESCE("email", '')) IN (
                        'test@example.com',
                        'yao_gym@example.com',
                        'test-claude-newlead@example.com',
                        'test-claude-dup@example.com'
                    )
                );

                DELETE FROM "lead_owners"
                WHERE "leadId" IN (
                    SELECT id FROM "leads"
                    WHERE LOWER(COALESCE("email", '')) IN (
                        'test@example.com',
                        'yao_gym@example.com',
                        'test-claude-newlead@example.com',
                        'test-claude-dup@example.com'
                    )
                );

                DELETE FROM "leads"
                WHERE LOWER(COALESCE("email", '')) IN (
                    'test@example.com',
                    'yao_gym@example.com',
                    'test-claude-newlead@example.com',
                    'test-claude-dup@example.com'
                );

                UPDATE "leads"
                SET "email" = NULL
                WHERE LOWER(COALESCE("email", '')) LIKE '%@example.com%'
                   OR LOWER(COALESCE("email", '')) LIKE 'example%@gmail.com'
                   OR LOWER(COALESCE("email", '')) LIKE '%@walkin.local%';
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Test account cleanup
    }
}
