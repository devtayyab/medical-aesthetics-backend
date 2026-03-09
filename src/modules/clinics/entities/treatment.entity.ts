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
import { Service } from './service.entity';
import { TreatmentCategory } from './treatment-category.entity';
import { TreatmentStatus } from '../enums/treatment-status.enum';

@Entity('treatments')
export class Treatment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('text', { nullable: true })
    shortDescription: string;

    @Column('text', { nullable: true })
    fullDescription: string;

    @Column({ nullable: true })
    category: string; // Legacy / Fallback

    @Column({ nullable: true })
    categoryId: string;

    @ManyToOne(() => TreatmentCategory, (cat) => cat.treatments)
    @JoinColumn({ name: 'categoryId' })
    categoryRef: TreatmentCategory;

    @Column({
        type: 'enum',
        enum: TreatmentStatus,
        default: TreatmentStatus.APPROVED,
    })
    status: TreatmentStatus;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Service, (service) => service.treatment)
    offerings: Service[];
}
