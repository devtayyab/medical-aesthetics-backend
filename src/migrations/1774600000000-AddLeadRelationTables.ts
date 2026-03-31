import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddLeadRelationTables1774600000000 implements MigrationInterface {
  name = 'AddLeadRelationTables1774600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create lead_owners (ManyToMany junction: leads <-> users)
    const leadOwnersExists = await queryRunner.hasTable('lead_owners');
    if (!leadOwnersExists) {
      await queryRunner.createTable(
        new Table({
          name: 'lead_owners',
          columns: [
            {
              name: 'leadId',
              type: 'uuid',
              isPrimary: true,
              isNullable: false,
            },
            {
              name: 'userId',
              type: 'uuid',
              isPrimary: true,
              isNullable: false,
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'lead_owners',
        new TableForeignKey({
          columnNames: ['leadId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'leads',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'lead_owners',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'lead_owners',
        new TableIndex({ columnNames: ['leadId'] }),
      );

      await queryRunner.createIndex(
        'lead_owners',
        new TableIndex({ columnNames: ['userId'] }),
      );
    }

    // 2. Create lead_clinics (ManyToMany junction: leads <-> clinics)
    const leadClinicsExists = await queryRunner.hasTable('lead_clinics');
    if (!leadClinicsExists) {
      await queryRunner.createTable(
        new Table({
          name: 'lead_clinics',
          columns: [
            {
              name: 'leadId',
              type: 'uuid',
              isPrimary: true,
              isNullable: false,
            },
            {
              name: 'clinicId',
              type: 'uuid',
              isPrimary: true,
              isNullable: false,
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'lead_clinics',
        new TableForeignKey({
          columnNames: ['leadId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'leads',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'lead_clinics',
        new TableForeignKey({
          columnNames: ['clinicId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'clinics',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'lead_clinics',
        new TableIndex({ columnNames: ['leadId'] }),
      );

      await queryRunner.createIndex(
        'lead_clinics',
        new TableIndex({ columnNames: ['clinicId'] }),
      );
    }

    // 3. Create lead_clinic_statuses
    const leadClinicStatusesExists = await queryRunner.hasTable('lead_clinic_statuses');
    if (!leadClinicStatusesExists) {
      await queryRunner.createTable(
        new Table({
          name: 'lead_clinic_statuses',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'leadId',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'clinicId',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              isNullable: false,
              default: "'new'",
            },
            {
              name: 'createdAt',
              type: 'timestamp with time zone',
              default: 'now()',
            },
            {
              name: 'updatedAt',
              type: 'timestamp with time zone',
              default: 'now()',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'lead_clinic_statuses',
        new TableForeignKey({
          columnNames: ['leadId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'leads',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'lead_clinic_statuses',
        new TableForeignKey({
          columnNames: ['clinicId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'clinics',
          onDelete: 'NO ACTION',
        }),
      );

      await queryRunner.createIndex(
        'lead_clinic_statuses',
        new TableIndex({ columnNames: ['leadId'] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('lead_clinic_statuses')) {
      await queryRunner.dropTable('lead_clinic_statuses', true);
    }
    if (await queryRunner.hasTable('lead_clinics')) {
      await queryRunner.dropTable('lead_clinics', true);
    }
    if (await queryRunner.hasTable('lead_owners')) {
      await queryRunner.dropTable('lead_owners', true);
    }
  }
}
