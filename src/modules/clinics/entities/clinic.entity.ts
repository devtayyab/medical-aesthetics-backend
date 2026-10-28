import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Service } from './service.entity';
import { Appointment } from '../../bookings/entities/appointment.entity';

@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('json')
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 1 })
  treatmentRooms: number;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  photoUrl: string;

  @Column('json', { nullable: true })
  businessHours: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column()
  ownerId: string;

  // --- Bank / Payout Details ---
  // Clinic IBAN: Viva payouts are transferred here after a payment.
  // select: false => never loaded by default; only the clinic owner, admins and the
  // payout flow load these columns explicitly (see CLINIC_BANK_FIELDS).
  @Column({ nullable: true, select: false })
  bankIban: string;

  @Column({ nullable: true, select: false })
  bankAccountHolder: string;

  @Column({ nullable: true, select: false })
  bankName: string;

  @Column({ nullable: true, select: false })
  bankBic: string; // SWIFT/BIC code

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.ownedClinics)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'clinic_ownership',
    joinColumn: { name: 'clinicId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ownerUserId', referencedColumnName: 'id' },
  })
  owners: User[];

  @OneToMany(() => Service, (service) => service.clinic)
  services: Service[];

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  appointments: Appointment[];

  @OneToMany(() => User, (user) => user.assignedClinic)
  staff: User[];
}