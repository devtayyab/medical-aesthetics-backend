import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTreatmentImages1777888119689 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const imageMappings = [
            { name: 'Botox Anti-Wrinkle', url: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800' },
            { name: 'Lip Fillers (1ml)', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800' },
            { name: 'Cheek Fillers', url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=800' },
            { name: 'Full Body Laser', url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=800' },
            { name: 'Underarm Laser', url: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&q=80&w=800' },
            { name: 'Face Laser', url: 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&q=80&w=800' },
            { name: 'HydraFacial', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800' },
            { name: 'Chemical Peel', url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?auto=format&fit=crop&q=80&w=800' },
            { name: 'Microneedling', url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=800' },
            { name: 'CoolSculpting', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800' },
            { name: 'Emsculpt Body Toning', url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=800' },
            { name: 'Teeth Whitening', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800' },
            { name: 'Veneers', url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=800' }
        ];

        for (const mapping of imageMappings) {
            await queryRunner.query(
                `UPDATE "treatments" SET "imageUrl" = $1 WHERE "name" = $2 AND ("imageUrl" IS NULL OR "imageUrl" = '')`,
                [mapping.url, mapping.name]
            );
        }

        // Also nullify any obvious placehold.co or placehold.it URLs to trigger frontend fallback logic if they are not in our list
        await queryRunner.query(
            `UPDATE "treatments" SET "imageUrl" = NULL WHERE "imageUrl" ILIKE '%placehold%'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No easy way to revert just these specific updates without losing user-added data
    }

}
