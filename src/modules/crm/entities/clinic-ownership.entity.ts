import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'clinic_ownership' })
export class ClinicOwnership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  clinicId: string;

  @Index()
  @Column({ type: 'uuid' })
  ownerUserId: string;

  @Column({ type: 'varchar', length: 20, default: 'private' })
  visibilityScope: 'private' | 'shared';
}
