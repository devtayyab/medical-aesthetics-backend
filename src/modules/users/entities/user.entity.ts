import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
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
import { CustomerRecord } from '../../crm/entities/customer-record.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';

export const normalizeEmail = (value: any) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const emailTransformer = {
  to: (value: any) => normalizeEmail(value),
  from: (value: any) => value,
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Emails are always stored lowercase (and compared lowercase) so the same address
  // can never exist twice with different casing.
  @Column({ unique: true, nullable: true, transformer: emailTransformer })
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

  @Column()
  phone: string;

  @Column({ type: 'json', nullable: true })
  profile: any;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlyTarget: number;

  @Column({ unique: true, nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredById: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpiry: Date;

  @Column({ default: false })
  isEmailVerified: boolean;

  // Brute-force protection: consecutive failed logins and the lock that follows.
  @Column({ type: 'int', default: 0 })
  @Exclude()
  failedLoginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  @Exclude()
  lockedUntil: Date | null;

  // 2-step login: hashed 6-digit email code for the pending login.
  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  loginCodeHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  @Exclude()
  loginCodeExpiresAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  @Exclude()
  loginCodeSentAt: Date | null;

  @Column({ type: 'int', default: 0 })
  @Exclude()
  loginCodeAttempts: number;

  // True for accounts created by staff (salesperson, doctor, admin) until the owner of the
  // email sets a password through the emailed link. Self-registration with the same email
  // claims this account instead of creating a second one.
  @Column({ default: false })
  accountSetupPending: boolean;

  @Column({ default: false })
  marketingEmailConsent: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  marketingEmailConsentDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.referrals)
  @JoinColumn({ name: 'referredById' })
  referredBy: User;

  @OneToMany(() => User, (user) => user.referredBy)
  referrals: User[];
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

  @OneToMany(() => CustomerRecord, (record) => record.customer)
  customerRecords: CustomerRecord[];

  @Column({ nullable: true })
  assignedClinicId: string;

  @ManyToOne(() => Clinic, { nullable: true })
  @JoinColumn({ name: 'assignedClinicId' })
  assignedClinic: Clinic;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Accept every bcrypt variant ($2a$, $2b$, $2y$): re-hashing an existing hash would make
    // the password unusable (seeded or imported users carry $2a$ hashes).
    if (this.passwordHash && !/^\$2[aby]\$\d{2}\$/.test(this.passwordHash)) {
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