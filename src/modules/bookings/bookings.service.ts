import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
    private eventEmitter: EventEmitter2,
  ) {}

  async holdSlot(holdSlotDto: HoldSlotDto): Promise<AppointmentHold> {
    const { clinicId, serviceId, providerId, startTime, endTime } = holdSlotDto;
    
    // Check for conflicts
    const conflictingAppointment = await this.appointmentsRepository.findOne({
      where: {
        providerId,
        startTime: Between(new Date(startTime), new Date(endTime)),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Time slot is already booked');
    }

    const conflictingHold = await this.holdsRepository.findOne({
      where: {
        providerId,
        startTime: Between(new Date(startTime), new Date(endTime)),
        expiresAt: new Date(),
      },
    });

    if (conflictingHold) {
      throw new ConflictException('Time slot is currently held');
    }

    const hold = this.holdsRepository.create({
      clinicId,
      serviceId,
      providerId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    });

    return this.holdsRepository.save(hold);
  }

  async createAppointment(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const appointmentData = {
      ...createAppointmentDto,
      startTime: new Date(createAppointmentDto.startTime),
      endTime: new Date(createAppointmentDto.endTime),
    };

    // If holdId provided, validate and remove hold
    if (createAppointmentDto.holdId) {
      const hold = await this.holdsRepository.findOne({
        where: { id: createAppointmentDto.holdId },
      });
      
      if (!hold || hold.expiresAt < new Date()) {
        throw new ConflictException('Hold has expired');
      }
      
      await this.holdsRepository.delete(hold.id);
    }

    const appointment = this.appointmentsRepository.create(appointmentData);
    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // Emit event for notifications
    this.eventEmitter.emit('appointment.created', savedAppointment);

    return this.findById(savedAppointment.id);
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['clinic', 'service', 'provider', 'client'],
    });
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return appointment;
  }

  async updateStatus(id: string, status: AppointmentStatus, data?: any): Promise<Appointment> {
    const appointment = await this.findById(id);
    
    const updateData: any = { status };
    
    if (status === AppointmentStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (data?.treatmentDetails) {
        updateData.treatmentDetails = data.treatmentDetails;
      }
      if (data?.totalAmount) {
        updateData.totalAmount = data.totalAmount;
      }
    }

    await this.appointmentsRepository.update(id, updateData);
    
    const updatedAppointment = await this.findById(id);
    
    // Emit events for different status changes
    this.eventEmitter.emit('appointment.status.changed', {
      appointment: updatedAppointment,
      oldStatus: appointment.status,
      newStatus: status,
    });

    return updatedAppointment;
  }

  async reschedule(id: string, newStartTime: Date, newEndTime: Date): Promise<Appointment> {
    await this.appointmentsRepository.update(id, {
      startTime: newStartTime,
      endTime: newEndTime,
    });
    
    const appointment = await this.findById(id);
    this.eventEmitter.emit('appointment.rescheduled', appointment);
    
    return appointment;
  }

  async findUserAppointments(userId: string, role: string): Promise<Appointment[]> {
    const queryBuilder = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.client', 'client');

    if (role === 'client') {
      queryBuilder.where('appointment.clientId = :userId', { userId });
    } else {
      queryBuilder.where('appointment.providerId = :userId', { userId });
    }

    return queryBuilder.orderBy('appointment.startTime', 'ASC').getMany();
  }

  async cleanupExpiredHolds(): Promise<void> {
    await this.holdsRepository.delete({
      expiresAt: new Date(),
    });
  }
}