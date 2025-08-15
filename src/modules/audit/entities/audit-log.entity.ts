import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['resource', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: string; // 'CREATE', 'UPDATE', 'DELETE', etc.

  @Column()
  resource: string; // 'leads', 'appointments', 'users', etc.

  @Column({ nullable: true })
  resourceId: string;

  @Column('json', { nullable: true })
  data: any; // Request/response data

  @Column('json', { nullable: true })
  changes: any; // Before/after for updates

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}