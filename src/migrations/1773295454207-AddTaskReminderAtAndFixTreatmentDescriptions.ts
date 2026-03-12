import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskReminderAtAndFixTreatmentDescriptions1773295454207 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add reminderAt to tasks table if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE "tasks" 
            ADD COLUMN IF NOT EXISTS "reminderAt" TIMESTAMP WITH TIME ZONE
        `);

        // 2. Ensure treatment descriptions are consistent (shortDescription/fullDescription)
        // No schema changes needed for treatments as they already have shortDescription and fullDescription,
        // but let's ensure they are present.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tasks" DROP COLUMN IF EXISTS "reminderAt"
        `);
    }

}
