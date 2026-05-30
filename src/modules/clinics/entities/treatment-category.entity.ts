import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
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

    // Self-reference: a null parentId means this is a top-level category;
    // a set parentId means this row is a subcategory of `parent`. Limited to
    // two levels (a subcategory cannot itself have children) — enforced in the service.
    @Column({ nullable: true })
    parentId: string;

    @ManyToOne(() => TreatmentCategory, (cat) => cat.children, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent: TreatmentCategory;

    @OneToMany(() => TreatmentCategory, (cat) => cat.parent)
    children: TreatmentCategory[];

    @Column({ default: 0 })
    sortOrder: number;

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
