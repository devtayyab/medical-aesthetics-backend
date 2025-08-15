import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Lead } from '../../crm/entities/lead.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Appointment } from '../../bookings/entities/appointment.entity';
import { LoyaltyLedger } from '../../loyalty/entities/loyalty-ledger.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'json', nullable: true })
  profile: any;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Lead, (lead) => lead.assignedSales)
  assignedLeads: Lead[];

  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  clientAppointments: Appointment[];

  @OneToMany(() => Appointment, (appointment) => appointment.provider)
  providerAppointments: Appointment[];

  @OneToMany(() => LoyaltyLedger, (ledger) => ledger.client)
  loyaltyRecords: LoyaltyLedger[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications: Notification[];

  @OneToMany(() => Clinic, (clinic) => clinic.owner)
  ownedClinics: Clinic[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}