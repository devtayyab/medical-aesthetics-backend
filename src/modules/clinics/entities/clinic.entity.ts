import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
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

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

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

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.ownedClinics)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Service, (service) => service.clinic)
  services: Service[];

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  appointments: Appointment[];
}