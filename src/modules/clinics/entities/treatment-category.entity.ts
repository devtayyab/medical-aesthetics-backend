import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { TreatmentStatus } from '../enums/treatment-status.enum';
import { Treatment } from './treatment.entity';

@Entity('treatment_categories')
export class TreatmentCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    icon: string;

    @Column({
        type: 'enum',
        enum: TreatmentStatus,
        default: TreatmentStatus.APPROVED,
    })
    status: TreatmentStatus;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Treatment, (treatment) => treatment.categoryRef)
    treatments: Treatment[];
}
