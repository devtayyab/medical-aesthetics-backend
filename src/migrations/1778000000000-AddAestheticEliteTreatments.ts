import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAestheticEliteTreatments1778000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure Categories exist first
        const categories = [
            { name: 'Plastic Surgery', description: 'Advanced surgical procedures for aesthetic and functional perfection.' },
            { name: 'Dermatology', description: 'Clinical skin solutions and medical aesthetics.' },
            { name: 'Aesthetics', description: 'Non-surgical beauty and rejuvenation treatments.' },
            { name: 'Hair Restoration', description: 'State-of-the-art hair and scalp treatments.' }
        ];

        for (const cat of categories) {
            const exists = await queryRunner.query(
                `SELECT id FROM "treatment_categories" WHERE "name" = $1 LIMIT 1`,
                [cat.name]
            );
            if (exists.length === 0) {
                await queryRunner.query(
                    `INSERT INTO "treatment_categories" ("name", "description", "status", "isActive") 
                     VALUES ($1, $2, 'approved', true)`,
                    [cat.name, cat.description]
                );
            }
        }

        // Add treatments
        const treatments = [
            { name: 'Rhinoplasty', category: 'Plastic Surgery', short: 'Precision nose reshaping', full: 'Advanced surgical rhinoplasty for aesthetic and functional nasal improvement.' },
            { name: 'Breast Augmentation', category: 'Plastic Surgery', short: 'Enhance breast volume', full: 'Surgical breast enhancement using premium implants or fat transfer.' },
            { name: 'Liposuction', category: 'Plastic Surgery', short: 'Targeted fat removal', full: 'Advanced body contouring and fat removal for a sculpted profile.' },
            { name: 'Blepharoplasty', category: 'Plastic Surgery', short: 'Eyelid rejuvenation', full: 'Eyelid surgery to remove excess skin and restore a youthful gaze.' },
            { name: 'Facelift', category: 'Plastic Surgery', short: 'Total facial rejuvenation', full: 'Comprehensive surgical lifting targeting deep facial tissues.' },
            { name: 'Botox Anti-Wrinkle', category: 'Aesthetics', short: 'Smooth fine lines', full: 'Targeted neuromodulator injections for wrinkle reduction.' },
            { name: 'Dermal Fillers', category: 'Aesthetics', short: 'Restore facial volume', full: 'Premium fillers for contouring lips, cheeks, and jawline.' },
            { name: 'HydraFacial', category: 'Dermatology', short: 'Deep skin cleansing', full: 'Multi-step clinical facial for cleansing, extraction, and hydration.' },
            { name: 'FUE Hair Transplant', category: 'Hair Restoration', short: 'Follicular hair restoration', full: 'Minimally invasive hair transplantation for natural results.' }
        ];

        for (const t of treatments) {
            const catRes = await queryRunner.query(
                `SELECT id FROM "treatment_categories" WHERE "name" = $1 LIMIT 1`,
                [t.category]
            );

            if (catRes && catRes.length > 0) {
                const categoryId = catRes[0].id;
                
                // Check if treatment already exists
                const exists = await queryRunner.query(
                    `SELECT id FROM "treatments" WHERE "name" = $1 LIMIT 1`,
                    [t.name]
                );

                if (exists.length === 0) {
                    await queryRunner.query(
                        `INSERT INTO "treatments" ("name", "shortDescription", "fullDescription", "category", "categoryId", "status", "isActive") 
                         VALUES ($1, $2, $3, $4, $5, 'approved', true)`,
                        [t.name, t.short, t.full, t.category, categoryId]
                    );
                } else {
                    // Update existing to ensure it is active and approved
                    await queryRunner.query(
                        `UPDATE "treatments" SET "isActive" = true, "status" = 'approved', "categoryId" = $1 WHERE "name" = $2`,
                        [categoryId, t.name]
                    );
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No down migration needed for seed data
    }

}
