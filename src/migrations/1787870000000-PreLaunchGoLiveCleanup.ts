import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Pre-Launch Go-Live Cleanup Migration (Urgent Items #2, #3, #4, #5, #6, #10, #11):
 * - #11: Remove muneeb@gmail.com from all Dr. Moustakis clinics, set iliasmoustakis@gmail.com as main owner of Cyprus, and disconnect ahsanhonyar00@gmail.com from Cyprus Google Calendar.
 * - #5: Change superadmin@example.com to info@beautydoctors.gr.
 * - #10: Mark existing active accounts as isEmailVerified = true so existing users are not locked out.
 * - #6: Ensure appointment email templates in notification_templates include {{googleMapsUrl}}.
 * - #3 & #4: Remove mock English treatments (Botox x2, CoolSculpting, Cheek Fillers, Chemical Peel, Emsculpt, Face Laser, etc.) and test treatments ('TEST Claude 35 egkrisi', 'TEST Claude νέα θεραπεία').
 * - #4: Delete all test accounts, test appointments (including 13/11, 16/11, 18/11, 25/11, 26/11, 27/11, 30/11), test payments (including the €40 payment), test tasks, and test leads.
 */
export class PreLaunchGoLiveCleanup1787870000000 implements MigrationInterface {
    name = 'PreLaunchGoLiveCleanup1787870000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                ilias_id uuid;
                muneeb_id uuid;
                superadmin_id uuid;
                real_sales_id uuid;
                inactive_clinic_ids uuid[];
                del_treatment_ids uuid[];
                del_service_ids uuid[];
                del_user_ids uuid[];
                del_lead_ids uuid[];
            BEGIN
                -- =====================================================================
                -- 1. (Item #11) Clinic owners & Google Calendar connections
                -- =====================================================================
                SELECT id INTO ilias_id FROM "users" WHERE LOWER(COALESCE(email, '')) = 'iliasmoustakis@gmail.com' LIMIT 1;
                SELECT id INTO muneeb_id FROM "users" WHERE LOWER(COALESCE(email, '')) = 'muneeb@gmail.com' LIMIT 1;

                IF ilias_id IS NOT NULL THEN
                    -- Set iliasmoustakis@gmail.com as main owner of Cyprus and all Dr. Moustakis clinics
                    UPDATE "clinics"
                    SET "ownerId" = ilias_id
                    WHERE name LIKE '%Μουστάκης%' OR id = '13d24fae-4aa6-4c3f-93e1-a9c869b12ffa';

                    -- Ensure iliasmoustakis@gmail.com is in clinic_ownership for all Dr. Moustakis clinics
                    INSERT INTO "clinic_ownership" ("clinicId", "ownerUserId")
                    SELECT c.id, ilias_id
                    FROM "clinics" c
                    WHERE (c.name LIKE '%Μουστάκης%' OR c.id = '13d24fae-4aa6-4c3f-93e1-a9c869b12ffa')
                      AND NOT EXISTS (
                          SELECT 1 FROM "clinic_ownership" co
                          WHERE co."clinicId" = c.id AND co."ownerUserId" = ilias_id
                      );
                END IF;

                IF muneeb_id IS NOT NULL THEN
                    DELETE FROM "clinic_ownership" WHERE "ownerUserId" = muneeb_id;
                END IF;

                -- Disconnect ahsanhonyar00@gmail.com from Cyprus Google Calendar
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clinic_calendar_connections') THEN
                    DELETE FROM "clinic_calendar_connections"
                    WHERE LOWER(COALESCE("googleAccountEmail", '')) = 'ahsanhonyar00@gmail.com'
                       OR "clinicId" IN (SELECT id FROM "clinics" WHERE name LIKE '%Κύπρος%' OR id = '13d24fae-4aa6-4c3f-93e1-a9c869b12ffa');
                END IF;

                -- =====================================================================
                -- 2. (Item #5) Change superadmin@example.com -> info@beautydoctors.gr
                -- =====================================================================
                SELECT id INTO superadmin_id
                FROM "users"
                WHERE LOWER(COALESCE(email, '')) = 'superadmin@example.com'
                   OR id = '3ef50ac1-8e38-4464-9964-73ad93ea3052'
                LIMIT 1;

                IF superadmin_id IS NOT NULL THEN
                    -- Clear any other user holding info@beautydoctors.gr if one exists
                    UPDATE "users"
                    SET email = NULL
                    WHERE LOWER(COALESCE(email, '')) = 'info@beautydoctors.gr'
                      AND id != superadmin_id;

                    UPDATE "users"
                    SET email = 'info@beautydoctors.gr',
                        "isEmailVerified" = true,
                        "isActive" = true
                    WHERE id = superadmin_id;
                END IF;

                -- =====================================================================
                -- 3. (Item #10) Mark existing active accounts as email-verified
                -- =====================================================================
                UPDATE "users"
                SET "isEmailVerified" = true
                WHERE "isActive" = true AND "isEmailVerified" IS DISTINCT FROM true;

                -- =====================================================================
                -- 4. (Item #6) Add Google Maps link to appointment email templates
                -- =====================================================================
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_templates') THEN
                    UPDATE "notification_templates"
                    SET "content" = CASE
                        WHEN "content" LIKE '%{{clinicAddress}}%' AND "content" NOT LIKE '%{{googleMapsUrl}}%' THEN
                            REPLACE("content", '{{clinicAddress}}', E'{{clinicAddress}}\nΧάρτης Google Maps: {{googleMapsUrl}}')
                        WHEN "content" NOT LIKE '%{{googleMapsUrl}}%' THEN
                            "content" || E'\nΧάρτης Google Maps: {{googleMapsUrl}}'
                        ELSE "content"
                    END
                    WHERE "type" = 'email'
                      AND "trigger" IN (
                          'APPOINTMENT_CONFIRMED',
                          'APPOINTMENT_BOOKED',
                          'APPOINTMENT_RESCHEDULED',
                          'APPOINTMENT_REMINDER',
                          'APPOINTMENT_REMINDER_SAME_DAY'
                      );
                END IF;

                -- =====================================================================
                -- 5. (Item #4) Delete all pre-launch test appointments, payments, tasks
                -- =====================================================================
                DELETE FROM "reviews";
                DELETE FROM "payment_records";
                DELETE FROM "crm_actions";
                DELETE FROM "tasks";
                DELETE FROM "communication_logs";
                DELETE FROM "appointments";
                DELETE FROM "appointment_holds";
                DELETE FROM "blocked_time_slots";
                DELETE FROM "notifications";
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_dispatches') THEN
                    DELETE FROM "notification_dispatches";
                END IF;
                DELETE FROM "audit_logs";

                -- =====================================================================
                -- 6. (Item #3 & #4) Remove mock & test treatments and inactive test clinics
                -- =====================================================================
                SELECT array_agg(id) INTO inactive_clinic_ids
                FROM "clinics"
                WHERE "isActive" = false
                   OR LOWER(TRIM(name)) IN ('epistimi beauty', 'dinails', 'test clinic', 'dibeauty');

                IF inactive_clinic_ids IS NOT NULL AND array_length(inactive_clinic_ids, 1) > 0 THEN
                    DELETE FROM "clinic_ownership" WHERE "clinicId" = ANY(inactive_clinic_ids);
                    DELETE FROM "agent_clinic_access" WHERE "clinicId" = ANY(inactive_clinic_ids);
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clinic_calendar_connections') THEN
                        DELETE FROM "clinic_calendar_connections" WHERE "clinicId" = ANY(inactive_clinic_ids);
                    END IF;
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_clinic_statuses') THEN
                        DELETE FROM "lead_clinic_statuses" WHERE "clinicId" = ANY(inactive_clinic_ids);
                    END IF;
                    DELETE FROM "services" WHERE "clinicId" = ANY(inactive_clinic_ids);
                    DELETE FROM "clinics" WHERE id = ANY(inactive_clinic_ids);
                END IF;

                SELECT array_agg(id) INTO del_treatment_ids
                FROM "treatments"
                WHERE LOWER(TRIM(name)) IN (
                    'botox',
                    'cheek fillers',
                    'chemical peel',
                    'coolsculpting',
                    'emsculpt body toning',
                    'emsculpt',
                    'face laser',
                    'full body laser',
                    'lip fillers (1ml)',
                    'microneedling',
                    'teeth whitening',
                    'underarm laser',
                    'veneers',
                    'yalouronic',
                    'face wash',
                    'advance',
                    'surgery',
                    'beauty treatment',
                    'fever',
                    'test claude 35 egkrisi',
                    'test claude 35',
                    'test claude νέα θεραπεία'
                )
                OR LOWER(TRIM(name)) LIKE 'test claude%';

                IF del_treatment_ids IS NOT NULL AND array_length(del_treatment_ids, 1) > 0 THEN
                    DELETE FROM "services" WHERE "treatmentId" = ANY(del_treatment_ids);
                    DELETE FROM "treatments" WHERE id = ANY(del_treatment_ids);
                END IF;

                -- =====================================================================
                -- 7. (Item #4) Delete all test leads and test user accounts
                -- =====================================================================
                SELECT id INTO real_sales_id
                FROM "users"
                WHERE LOWER(COALESCE(email, '')) = 'solakidi.rania@gmail.com'
                LIMIT 1;

                -- Delete test leads (TEST Claude*, kabrialelena+*, kabrialelena-*, giorgostest*, etc.)
                SELECT array_agg(id) INTO del_lead_ids
                FROM "leads"
                WHERE LOWER(COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')) LIKE '%test claude%'
                   OR LOWER(COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')) LIKE '%idiotis%'
                   OR LOWER(COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')) LIKE '%lead 41%'
                   OR LOWER(COALESCE("email", '')) LIKE 'kabrialelena+%@gmail.com'
                   OR LOWER(COALESCE("email", '')) LIKE 'kabrialelena-%@gmail.com'
                   OR LOWER(COALESCE("email", '')) LIKE 'giorgostest%'
                   OR LOWER(COALESCE("email", '')) LIKE '%@example.com%';

                IF del_lead_ids IS NOT NULL AND array_length(del_lead_ids, 1) > 0 THEN
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_owners') THEN
                        DELETE FROM "lead_owners" WHERE "leadId" = ANY(del_lead_ids);
                    END IF;
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_clinic_statuses') THEN
                        DELETE FROM "lead_clinic_statuses" WHERE "leadId" = ANY(del_lead_ids);
                    END IF;
                    DELETE FROM "leads" WHERE id = ANY(del_lead_ids);
                END IF;

                -- Collect all test user accounts (salespeople, inactive clinic owners, test doctors/secretariat, test clients)
                -- while strictly protecting info@beautydoctors.gr, the 5 real clinic owners, and the 3 real salespeople
                SELECT array_agg(u.id) INTO del_user_ids
                FROM "users" u
                WHERE LOWER(COALESCE(u.email, '')) NOT IN (
                    'info@beautydoctors.gr',
                    'superadmin@example.com',
                    'iliasmoustakis@gmail.com',
                    'npoulieris@yahoo.gr',
                    'info@dibeauty.gr',
                    'skinmedicals@gmail.com',
                    'kabrialelena@gmail.com',
                    'solakidi.rania@gmail.com',
                    'mpelas1984@gmail.com',
                    'katiaxatzistavrianu@gmail.com'
                )
                AND NOT EXISTS (SELECT 1 FROM "clinics" c WHERE c."ownerId" = u.id)
                AND (
                    LOWER(u.role::text) != 'client'
                    OR u.email IS NULL
                    OR LOWER(COALESCE(u.email, '')) LIKE 'kabrialelena+%@gmail.com'
                    OR LOWER(COALESCE(u.email, '')) LIKE 'kabrialelena-%@gmail.com'
                    OR LOWER(COALESCE(u.email, '')) LIKE 'giorgos%'
                    OR LOWER(COALESCE(u.email, '')) LIKE '%test%'
                    OR LOWER(COALESCE(u.email, '')) LIKE '%ahsan%'
                    OR LOWER(COALESCE(u.email, '')) LIKE '%@de.de'
                    OR LOWER(COALESCE(u.email, '')) IN (
                        'khuram@gmail.com',
                        'r@gmail.com',
                        'sarahbob@gmail.com',
                        'kabri@gmail.com',
                        'kabriale@gmail.com',
                        'kabrialelen@gmail.com',
                        'adeel@gmail.com',
                        'hlias@gmail.com',
                        'moyst@gmail.com',
                        'mg@gmail.com',
                        'yy@gmail.com',
                        'shoib@gmail.com',
                        'hello@gmail.com',
                        'hi@gmail.com',
                        'hmm@gmail.com',
                        'horam@gmail.com',
                        'nan@gmail.com',
                        'sab@gmail.com',
                        'samii@gmail.com',
                        'te@gmail.com',
                        'a@gmail.com',
                        'gsmith@gmail.com',
                        'bobbeard@gmail.com',
                        'rania@gmail.com'
                    )
                    OR LOWER(TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) LIKE '%claude%'
                    OR LOWER(TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) LIKE '%ahsan%'
                    OR LOWER(TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) LIKE '%yiasemides%'
                    OR LOWER(TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", ''))) IN (
                        'sarah johnson',
                        'sarah bobson',
                        'e k',
                        'el el',
                        'marios marios',
                        'giorgos ioannou'
                    )
                );

                IF del_user_ids IS NOT NULL AND array_length(del_user_ids, 1) > 0 THEN
                    UPDATE "leads" SET "assignedSalesId" = real_sales_id WHERE "assignedSalesId" = ANY(del_user_ids);
                    DELETE FROM "loyalty_ledger" WHERE "clientId" = ANY(del_user_ids);
                    DELETE FROM "consent_records" WHERE "userId" = ANY(del_user_ids);
                    DELETE FROM "customer_tags" WHERE "addedBy" = ANY(del_user_ids) OR "customerId" = ANY(del_user_ids);
                    DELETE FROM "customer_records" WHERE "customerId" = ANY(del_user_ids);
                    UPDATE "customer_records" SET "assignedSalespersonId" = real_sales_id WHERE "assignedSalespersonId" = ANY(del_user_ids);
                    UPDATE "users" SET "assignedSalespersonId" = NULL WHERE "assignedSalespersonId" = ANY(del_user_ids);
                    UPDATE "users" SET "referredById" = NULL WHERE "referredById" = ANY(del_user_ids);
                    DELETE FROM "agent_clinic_access" WHERE "agentUserId" = ANY(del_user_ids);
                    DELETE FROM "messages" WHERE "senderId" = ANY(del_user_ids);
                    DELETE FROM "conversation_participants" WHERE "userId" = ANY(del_user_ids);
                    DELETE FROM "blog_posts" WHERE "authorId" = ANY(del_user_ids);
                    DELETE FROM "gift_cards" WHERE "userId" = ANY(del_user_ids);
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_owners') THEN
                        DELETE FROM "lead_owners" WHERE "userId" = ANY(del_user_ids);
                    END IF;

                    DELETE FROM "users" WHERE id = ANY(del_user_ids);
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Pre-launch go-live data cleanup
    }
}

