import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingTaskColumns1774601000000 implements MigrationInterface {
  name = 'AddMissingTaskColumns1774601000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tasks');
    if (!table) return;

    // isRecurring column
    if (!table.columns.find(c => c.name === 'isRecurring')) {
      await queryRunner.addColumn('tasks', new TableColumn({
        name: 'isRecurring',
        type: 'boolean',
        isNullable: false,
        default: false,
      }));
    }

    // recurringIntervalDays column
    if (!table.columns.find(c => c.name === 'recurringIntervalDays')) {
      await queryRunner.addColumn('tasks', new TableColumn({
        name: 'recurringIntervalDays',
        type: 'integer',
        isNullable: true,
      }));
    }

    // recurringUntil column
    if (!table.columns.find(c => c.name === 'recurringUntil')) {
      await queryRunner.addColumn('tasks', new TableColumn({
        name: 'recurringUntil',
        type: 'timestamp with time zone',
        isNullable: true,
      }));
    }

    // completedAt column
    if (!table.columns.find(c => c.name === 'completedAt')) {
      await queryRunner.addColumn('tasks', new TableColumn({
        name: 'completedAt',
        type: 'timestamp with time zone',
        isNullable: true,
      }));
    }

    // customerRecordId column
    if (!table.columns.find(c => c.name === 'customerRecordId')) {
      await queryRunner.addColumn('tasks', new TableColumn({
        name: 'customerRecordId',
        type: 'uuid',
        isNullable: true,
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tasks');
    if (!table) return;

    const cols = ['isRecurring', 'recurringIntervalDays', 'recurringUntil', 'completedAt', 'customerRecordId'];
    for (const col of cols) {
      if (table.columns.find(c => c.name === col)) {
        await queryRunner.dropColumn('tasks', col);
      }
    }
  }
}
