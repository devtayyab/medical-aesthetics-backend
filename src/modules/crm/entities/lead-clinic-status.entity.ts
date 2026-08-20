import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';

@Entity('lead_clinic_statuses')
export class LeadClinicStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    leadId: string;

    @Column()
    clinicId: string;

    @Column({ type: 'varchar', default: 'NEW' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Lead, (lead) => lead.clinicStatuses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'leadId' })
    lead: Lead;

    @ManyToOne(() => Clinic)
    @JoinColumn({ name: 'clinicId' })
    clinic: Clinic;
}
