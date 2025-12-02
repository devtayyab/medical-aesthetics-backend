import { Entity, PrimaryGeneratedColumn, Column, Index, Unique } from 'typeorm';

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
}
