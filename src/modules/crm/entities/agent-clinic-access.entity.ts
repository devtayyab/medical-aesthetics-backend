import { Entity, PrimaryGeneratedColumn, Column, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';

@Entity({ name: 'agent_clinic_access' })
@Unique(['agentUserId', 'clinicId'])
export class AgentClinicAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  agentUserId: string;

  @Index()
  @Column({ type: 'uuid' })
  clinicId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'agentUserId' })
  agent: User;

  @ManyToOne(() => Clinic, { eager: true })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;
}
