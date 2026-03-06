import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedDefaultTreatments1772782769146 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const treatments = [
            { category: 'Injectables', name: 'Botox Anti-Wrinkle', short: 'Smooth fine lines and wrinkles', full: 'Botox injections help reduce the appearance of facial wrinkles by temporarily relaxing muscles.' },
            { category: 'Injectables', name: 'Lip Fillers (1ml)', short: 'Enhance lip volume and shape', full: 'Hyaluronic acid based fillers to add volume, shape, and structure to the lips.' },
            { category: 'Injectables', name: 'Cheek Fillers', short: 'Restore volume and lift to cheeks', full: 'Dermal fillers designed to add volume and lift to the mid-face area.' },

            { category: 'Hair Removal', name: 'Full Body Laser', short: 'Permanent hair reduction for whole body', full: 'Complete body laser hair removal using medical grade technology.' },
            { category: 'Hair Removal', name: 'Underarm Laser', short: 'Fast and effective underarm clearing', full: 'Targeted laser treatment for the underarm area.' },
            { category: 'Hair Removal', name: 'Face Laser', short: 'Gentle facial hair removal', full: 'Safe laser hair removal specifically for facial hair.' },

            { category: 'Skin Care', name: 'HydraFacial', short: 'Deep cleansing and hydration', full: 'A multi-step professional facial that cleanses, extracts, and hydrates.' },
            { category: 'Skin Care', name: 'Chemical Peel', short: 'Skin resurfacing and brightening', full: 'Medical grade peel to improve skin texture and tone.' },
            { category: 'Skin Care', name: 'Microneedling', short: 'Collagen induction therapy', full: 'Minimal invasive treatment to stimulate collagen production and reduce scarring.' },

            { category: 'Body', name: 'CoolSculpting', short: 'Non-surgical fat reduction', full: 'Cryolipolysis treatment to freeze and eliminate stubborn fat cells.' },
            { category: 'Body', name: 'Emsculpt Body Toning', short: 'Build muscle and burn fat', full: 'High-intensity focused electromagnetic technology for muscle building.' },

            { category: 'Dental', name: 'Teeth Whitening', short: 'Professional smile brightening', full: 'In-office professional whitening for immediate results.' },
            { category: 'Dental', name: 'Veneers', short: 'Perfect smile transformation', full: 'Custom-made porcelain shells to cover the front surface of teeth.' }
        ];

        for (const t of treatments) {
            // Get category ID
            const categoryResult = await queryRunner.query(
                `SELECT id FROM "treatment_categories" WHERE "name" = $1 LIMIT 1`,
                [t.category]
            );

            if (categoryResult && categoryResult.length > 0) {
                const categoryId = categoryResult[0].id;
                await queryRunner.query(
                    `INSERT INTO "treatments" ("name", "shortDescription", "fullDescription", "category", "categoryId", "status") 
                     VALUES ($1, $2, $3, $4, $5, 'approved')`,
                    [t.name, t.short, t.full, t.category, categoryId]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "treatments" WHERE "status" = 'approved'`);
    }

}
