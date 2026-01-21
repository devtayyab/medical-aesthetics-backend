import { Appointment } from '../entities/appointment.entity';

export class AppointmentResponseDto {
  id: string;
  clinicId: string;
  serviceId: string;
  providerId?: string;
  clientId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string;
  paymentMethod?: string;
  advancePaymentAmount?: number;
  totalAmount?: number;
  treatmentDetails?: any;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  clinic?: any;
  service?: any;
  provider?: any;
  client?: any;

  // Computed display fields
  displayName?: string;
  serviceName?: string;
  providerName?: string;

  static fromEntity(appointment: Appointment): AppointmentResponseDto {
    const dto = new AppointmentResponseDto();
    Object.assign(dto, appointment);

    // Format display name: "Service with Professional"
    const serviceName = appointment.service?.name || 'Appointment';
    const providerName = appointment.provider
      ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
      : 'Professional';

    dto.displayName = `${serviceName} with ${providerName}`;
    dto.serviceName = serviceName;
    dto.providerName = providerName;

    return dto;
  }

  static fromEntities(appointments: Appointment[]): AppointmentResponseDto[] {
    return appointments.map(apt => this.fromEntity(apt));
  }
}
