import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedFrontendCategories1772782770000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Define the categories
        const categories = [
            { name: 'Plastic Surgery', description: 'Precision surgical procedures for anatomical perfection.' },
            { name: 'Medical Dermatology', description: 'Clinical skin solutions by board-certified practitioners.' },
            { name: 'Hair Restoration', description: 'Advanced transplantation and follicular science.' }
        ];

        // 2. Insert categories if they don't exist
        for (const cat of categories) {
            const exists = await queryRunner.query(
                `SELECT id FROM "treatment_categories" WHERE "name" = $1 LIMIT 1`,
                [cat.name]
            );
            if (exists.length === 0) {
                await queryRunner.query(
                    `INSERT INTO "treatment_categories" ("name", "description", "status", "isActive", "createdAt", "updatedAt") 
                     VALUES ($1, $2, 'approved', true, NOW(), NOW())`,
                    [cat.name, cat.description]
                );
            }
        }

        // 3. Define the treatments
        const treatments = [
            // Plastic Surgery
            { category: 'Plastic Surgery', name: 'Rhinoplasty', short: 'Precision nose reshaping', full: 'Advanced surgical rhinoplasty for aesthetic and functional improvement.' },
            { category: 'Plastic Surgery', name: 'Blepharoplasty', short: 'Eyelid rejuvenation surgery', full: 'Surgical refinement of the eyelids for a youthful, alert appearance.' },
            { category: 'Plastic Surgery', name: 'Abdominoplasty', short: 'Tummy tuck procedure', full: 'Surgical contouring of the abdominal area for a firm and toned profile.' },
            { category: 'Plastic Surgery', name: 'Facelift Elite', short: 'Comprehensive facial lifting', full: 'Elite surgical facelift targeting deep tissues for long-lasting rejuvenation.' },

            // Medical Dermatology
            { category: 'Medical Dermatology', name: 'Botox Therapy', short: 'Neuromodulator treatments', full: 'Targeted botulinum toxin injections for wrinkle reduction and prevention.' },
            { category: 'Medical Dermatology', name: 'Dermal Fillers', short: 'Facial volume restoration', full: 'Premium hyaluronic acid fillers for contouring and volume.' },
            { category: 'Medical Dermatology', name: 'Skin Rejuvenation', short: 'Advanced skin renewal', full: 'Clinical treatments to restore skin vitality and youthful texture.' },
            { category: 'Medical Dermatology', name: 'Chemical Peel', short: 'Medical-grade exfoliation', full: 'Deep chemical exfoliation to resolve pigmentation and uneven skin tone.' },

            // Hair Restoration
            { category: 'Hair Restoration', name: 'FUE Transplant', short: 'Follicular Unit Extraction', full: 'State-of-the-art minimally invasive hair transplant technique.' },
            { category: 'Hair Restoration', name: 'PRP Therapy', short: 'Platelet-Rich Plasma for hair', full: 'Regenerative therapy using your own plasma to stimulate hair growth.' },
            { category: 'Hair Restoration', name: 'Beard Transplant', short: 'Facial hair restoration', full: 'Precision transplantation for a fuller, denser beard.' },
            { category: 'Hair Restoration', name: 'Hair Mesotherapy', short: 'Vitamin micro-injections', full: 'Targeted delivery of nutrients to the scalp to strengthen hair follicles.' }
        ];

        // 4. Insert treatments
        for (const t of treatments) {
            const categoryResult = await queryRunner.query(
                `SELECT id FROM "treatment_categories" WHERE "name" = $1 LIMIT 1`,
                [t.category]
            );

            if (categoryResult && categoryResult.length > 0) {
                const categoryId = categoryResult[0].id;
                
                // Check if treatment already exists
                const exists = await queryRunner.query(
                    `SELECT id FROM "treatments" WHERE "name" = $1 LIMIT 1`,
                    [t.name]
                );

                if (exists.length === 0) {
                    await queryRunner.query(
                        `INSERT INTO "treatments" ("name", "shortDescription", "fullDescription", "category", "categoryId", "status", "isActive", "createdAt", "updatedAt") 
                         VALUES ($1, $2, $3, $4, $5, 'approved', true, NOW(), NOW())`,
                        [t.name, t.short, t.full, t.category, categoryId]
                    );
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert not strictly necessary for this seed migration
    }
}
