import { In, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Service } from '../clinics/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Shared display data for appointment lists (clinic patient card, clinic diary,
 * CRM calendar, doctor views, medical record):
 * - every treatment of a multi-treatment appointment (QA #66), not only the first;
 * - the REAL doctor (QA #34): the provider only when that user is a doctor, else the
 *   doctor who performed it, else the clinic's doctor when the clinic has exactly one
 *   active doctor, else none ('-'). Owner, secretary or salesperson accounts are never
 *   shown as the practitioner.
 */
export interface AppointmentDisplayContext {
  servicesById: Map<string, Service>;
  singleDoctorByClinic: Map<string, User | null>;
}

export interface AppointmentDoctor {
  id: string;
  name: string;
}

export async function loadAppointmentDisplayContext(
  appointments: Array<Partial<Appointment>>,
  servicesRepository: Repository<Service>,
  usersRepository: Repository<User>,
): Promise<AppointmentDisplayContext> {
  const servicesById = new Map<string, Service>();
  const extraIds = Array.from(
    new Set(appointments.flatMap((a) => a.additionalServiceIds || []).filter((id) => !!id && UUID_REGEX.test(id))),
  );
  if (extraIds.length > 0) {
    const extra = await servicesRepository.find({ where: { id: In(extraIds) }, relations: ['treatment'] });
    for (const svc of extra) servicesById.set(svc.id, svc);
  }

  const singleDoctorByClinic = new Map<string, User | null>();
  const clinicIds = Array.from(new Set(appointments.map((a) => a.clinicId).filter(Boolean))) as string[];
  if (clinicIds.length > 0) {
    const doctors = await usersRepository.find({
      where: { assignedClinicId: In(clinicIds), role: UserRole.DOCTOR, isActive: true } as any,
      select: ['id', 'firstName', 'lastName', 'assignedClinicId'] as any,
    });
    for (const clinicId of clinicIds) {
      const own = doctors.filter((d) => d.assignedClinicId === clinicId);
      singleDoctorByClinic.set(clinicId, own.length === 1 ? own[0] : null);
    }
  }
  return { servicesById, singleDoctorByClinic };
}

const isDoctor = (u?: Partial<User> | null) => !!u && String(u.role || '').toLowerCase() === UserRole.DOCTOR;
const fullName = (u: Partial<User>) => `${u.firstName || ''} ${u.lastName || ''}`.trim();

export function appointmentDoctor(apt: Partial<Appointment>, _ctx: AppointmentDisplayContext): AppointmentDoctor | null {
  const provider = apt.provider as User | undefined;
  if (isDoctor(provider) && fullName(provider)) return { id: provider.id, name: fullName(provider) };
  const executedBy = (apt as any).executedBy as User | undefined;
  if (isDoctor(executedBy) && fullName(executedBy)) return { id: executedBy.id, name: fullName(executedBy) };
  return null;
}

export function appointmentTreatments(apt: Partial<Appointment>, ctx: AppointmentDisplayContext) {
  const additionalServices = (apt.additionalServiceIds || [])
    .filter((id) => id && id !== apt.serviceId && ctx.servicesById.has(id))
    .map((id) => {
      const svc: any = ctx.servicesById.get(id);
      return {
        id,
        name: svc?.treatment?.name || svc?.name || 'Treatment',
        price: Number(svc?.price || 0),
        durationMinutes: Number(svc?.durationMinutes || 0),
      };
    });
  const mainName = apt.service?.treatment?.name || (apt.service as any)?.name;
  const treatmentNames = [mainName, ...additionalServices.map((s) => s.name)].filter(Boolean) as string[];
  const start = apt.startTime ? new Date(apt.startTime).getTime() : NaN;
  const end = apt.endTime ? new Date(apt.endTime).getTime() : NaN;
  const durationMinutes = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.round((end - start) / 60000)) : null;
  return {
    additionalServices,
    treatmentNames,
    treatmentLabel: treatmentNames.join(' + '),
    durationMinutes,
  };
}
