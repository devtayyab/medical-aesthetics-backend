import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Clinic } from './entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';
import { Lead } from '../crm/entities/lead.entity';
import { CustomerRecord } from '../crm/entities/customer-record.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { phoneKeySql, phoneMatchKey } from '../../common/utils/phone.util';

const CLINIC_ROLES = [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT];
const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

/** Profile keys on a client account that tie it to clinics without an appointment yet. */
const OWN_CLIENT_KEY = 'ownerClinicIds'; // doctor's own client (created by the clinic)
const LINKED_CLIENT_KEY = 'clinicPatientOf'; // BeautyDoctors client added to a clinic's list

export interface PatientInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  clinicId?: string;
}

/**
 * Clinic-scoped patient data for the clinic portal (owner, doctor, secretariat).
 * A clinic only sees patients with appointments at its own clinic(s), plus the
 * clients it added itself. A clinic account without an assigned clinic sees
 * nothing. BeautyDoctors CRM data (leads, salesperson notes, calls) never leaves
 * through these endpoints.
 */
@Injectable()
export class ClinicPatientsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Clinic)
    private readonly clinicsRepository: Repository<Clinic>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(ClinicOwnership)
    private readonly clinicOwnershipRepository: Repository<ClinicOwnership>,
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(CustomerRecord)
    private readonly customerRecordsRepository: Repository<CustomerRecord>,
  ) {}

  private isAdmin(role: string): boolean {
    return ADMIN_ROLES.some((r) => r.toLowerCase() === String(role || '').toLowerCase());
  }

  private isClinicRole(role: string): boolean {
    return CLINIC_ROLES.some((r) => r.toLowerCase() === String(role || '').toLowerCase());
  }

  /**
   * Clinic ids the user works for, or null for admins (all clinics).
   * Clinic owners: owned clinics; doctors/secretariat: their assigned clinic.
   * Salesperson clinic grants (agent_clinic_access) do not apply here.
   */
  async resolveClinicIds(userId: string, role: string): Promise<string[] | null> {
    if (this.isAdmin(role)) return null;
    if (!this.isClinicRole(role)) {
      throw new ForbiddenException('Clinic data is only available to clinic accounts');
    }
    const ids = new Set<string>();
    const user = await this.usersRepository.findOne({ where: { id: userId }, select: ['id', 'assignedClinicId'] });
    if (!user) throw new NotFoundException('User not found');
    if (user.assignedClinicId) ids.add(user.assignedClinicId);

    if (String(role).toLowerCase() === UserRole.CLINIC_OWNER) {
      const owned = await this.clinicsRepository.find({ where: { ownerId: userId }, select: ['id'] });
      owned.forEach((c) => ids.add(c.id));
      const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: userId } });
      ownerships.forEach((o) => ids.add(o.clinicId));
    }
    return [...ids];
  }

  /** Throws unless a clinic account works for this clinic. Other roles are not limited here. */
  async assertClinicAccess(userId: string, role: string, clinicId?: string | null): Promise<void> {
    if (!this.isClinicRole(role)) return;
    const allowed = await this.resolveClinicIds(userId, role);
    if (!clinicId || !allowed || !allowed.includes(String(clinicId))) {
      throw new ForbiddenException('You do not have access to this clinic');
    }
  }

  /** Clinic ids to use for a request: the requested one (if allowed) or all of the user's clinics. */
  private async scopeClinicIds(userId: string, role: string, requestedClinicId?: string): Promise<string[] | null> {
    const allowed = await this.resolveClinicIds(userId, role);
    if (requestedClinicId) {
      if (allowed && !allowed.includes(requestedClinicId)) {
        throw new ForbiddenException('You do not have access to this clinic');
      }
      return [requestedClinicId];
    }
    return allowed;
  }

  async getAccessibleClinics(userId: string, role: string): Promise<Clinic[]> {
    const ids = await this.resolveClinicIds(userId, role);
    const select: (keyof Clinic)[] = ['id', 'name', 'address', 'phone', 'email', 'timezone'];
    if (ids === null) {
      return this.clinicsRepository.find({ where: { isActive: true }, select, order: { name: 'ASC' } });
    }
    if (ids.length === 0) return [];
    const clinics = await this.clinicsRepository.find({ where: { id: In(ids), isActive: true }, select });
    return clinics.sort((a, b) => (a.name || '').localeCompare(b.name || '', ['el', 'en'], { sensitivity: 'base' }));
  }

  /** SQL condition: the client account is tied to one of the clinics via its profile. */
  private profileClinicSql(alias: string): string {
    const arr = (key: string) =>
      `CASE WHEN jsonb_typeof(${alias}.profile::jsonb -> '${key}') = 'array' THEN ${alias}.profile::jsonb -> '${key}' ELSE '[]'::jsonb END`;
    return `EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(${arr(OWN_CLIENT_KEY)} || ${arr(LINKED_CLIENT_KEY)}) AS pc(clinic_id)
      WHERE pc.clinic_id = ANY(:clinicIds)
    )`;
  }

  /**
   * The clinic's patient list. Same row shape as GET /clinic/clients so the
   * existing clinic UI keeps working.
   */
  async listPatients(
    userId: string,
    role: string,
    query: { search?: string; clinicId?: string; limit?: number; offset?: number },
  ): Promise<{ clients: any[]; total: number; limit: number; offset: number }> {
    const clinicIds = await this.scopeClinicIds(userId, role, query.clinicId);
    if (clinicIds && clinicIds.length === 0) {
      return { clients: [], total: 0, limit: 0, offset: 0 };
    }

    const params: any[] = [];
    let aptScope = `a.status <> 'DELETED'`;
    let profileScope = 'FALSE';
    if (clinicIds) {
      params.push(clinicIds);
      aptScope += ` AND a."clinicId"::text = ANY($1::text[])`;
      profileScope = this.profileClinicSql('u').replace(/:clinicIds/g, () => '$1');
    }

    let searchSql = '';
    if (query.search && query.search.trim()) {
      params.push(`%${query.search.trim()}%`);
      const p = `$${params.length}`;
      searchSql = ` AND (CONCAT(u."firstName", ' ', u."lastName") ILIKE ${p} OR u.email ILIKE ${p} OR u.phone ILIKE ${p})`;
    }

    // Page in SQL (a search with a limit must not load every client, e.g. all clients for admins)
    const offset = Math.max(0, Number(query.offset || 0) || 0);
    const limit = query.limit ? Math.max(1, Number(query.limit) || 1) : null;
    let pageSql = '';
    if (limit !== null) {
      params.push(limit, offset);
      pageSql = ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const rows = await this.usersRepository.query(
      `SELECT u.id AS "appointment_clientId", u."firstName" AS firstname, u."lastName" AS lastname,
              COUNT(*) OVER() AS total_count,
              u.email AS clientemail, u.phone AS clientphone, u."createdAt" AS createdat,
              COUNT(a.id) AS totalvisits,
              COALESCE(SUM(CASE WHEN UPPER(a.status::text) IN ('COMPLETED', 'EXECUTED') THEN COALESCE(NULLIF(a."amountPaid", 0), a."totalAmount", 0) ELSE COALESCE(a."amountPaid", 0) END), 0) AS totalspent,
              MAX(a."startTime") AS lastvisit
         FROM users u
         LEFT JOIN appointments a ON a."clientId" = u.id AND ${aptScope}
        WHERE u.role = 'client'
          AND (a.id IS NOT NULL OR ${profileScope})${searchSql}
        GROUP BY u.id
        ORDER BY MAX(a."startTime") DESC NULLS LAST, u."createdAt" DESC${pageSql}`,
      params,
    );

    const total = rows.length ? Number(rows[0].total_count) : 0;
    const clients = rows.map(({ total_count, ...row }) => row);
    return { clients, total, limit: limit ?? clients.length, offset };
  }

  /**
   * Patient search for "New appointment" in the clinic portal:
   * - the clinic's own patients by name, phone or email;
   * - a BeautyDoctors client ONLY by the exact full phone number.
   */
  async searchPatients(userId: string, role: string, q: string, clinicId?: string): Promise<any[]> {
    const term = (q || '').trim();
    if (term.length < 2) return [];

    const own = await this.listPatients(userId, role, { search: term, clinicId, limit: 20 });
    const results: any[] = own.clients.map((c) => ({
      id: c.appointment_clientId,
      firstName: c.firstname,
      lastName: c.lastname,
      email: c.clientemail,
      phone: c.clientphone,
      isOwnPatient: true,
    }));

    const phoneKey = phoneMatchKey(term);
    if (phoneKey) {
      const seen = new Set(results.map((r) => r.id));
      const client = await this.usersRepository
        .createQueryBuilder('u')
        .where('u.role = :role', { role: UserRole.CLIENT })
        .andWhere(`${phoneKeySql('u.phone')} = :phoneKey`, { phoneKey })
        .orderBy('u.createdAt', 'ASC')
        .getOne();
      if (client && !seen.has(client.id)) {
        results.push({
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          email: client.email,
          isBeautyDoctorsClient: true,
        });
      } else if (!client) {
        // A BeautyDoctors lead without an account yet: booking it links to the lead
        const lead = await this.leadsRepository
          .createQueryBuilder('l')
          .where(`${phoneKeySql('l.phone')} = :phoneKey`, { phoneKey })
          .andWhere('l.status != :merged', { merged: LeadStatus.Merged })
          .orderBy('l.createdAt', 'ASC')
          .getOne();
        if (lead) {
          results.push({
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            phone: lead.phone,
            email: lead.email,
            isBeautyDoctorsClient: true,
          });
        }
      }
    }
    return results;
  }

  /** Throws unless the client is a patient of one of the user's clinics. */
  async assertOwnPatient(userId: string, role: string, clientId: string): Promise<string[] | null> {
    const clinicIds = await this.resolveClinicIds(userId, role);
    if (clinicIds === null) return null;
    if (clinicIds.length === 0) throw new ForbiddenException('No clinic is assigned to your account');

    const hasAppointment = await this.appointmentsRepository.count({
      where: { clientId, clinicId: In(clinicIds) },
    });
    if (hasAppointment > 0) return clinicIds;

    const tied = await this.usersRepository
      .createQueryBuilder('u')
      .where('u.id = :clientId', { clientId })
      .andWhere(this.profileClinicSql('u'), { clinicIds })
      .getCount();
    if (tied > 0) return clinicIds;
    throw new NotFoundException('Patient not found');
  }

  /**
   * "Add patient" with the phone rule:
   * - a phone BeautyDoctors already knows => link to that existing contact;
   * - a new phone => the doctor's own client (not a BD lead/customer).
   */
  async createPatient(userId: string, role: string, input: PatientInput): Promise<any> {
    const firstName = (input.firstName || '').trim();
    const phone = (input.phone || '').trim();
    if (!firstName) throw new BadRequestException('First name is required');
    const phoneKey = phoneMatchKey(phone);
    if (!phoneKey) throw new BadRequestException('A full mobile phone number is required');

    const allowed = await this.resolveClinicIds(userId, role);
    let clinicId = input.clinicId;
    if (allowed !== null) {
      if (allowed.length === 0) throw new ForbiddenException('No clinic is assigned to your account');
      if (clinicId && !allowed.includes(clinicId)) throw new ForbiddenException('You do not have access to this clinic');
      clinicId = clinicId || allowed[0];
    }
    if (!clinicId) throw new BadRequestException('clinicId is required');

    const email = input.email && input.email.trim() ? input.email.trim() : undefined;

    // 1. Existing client account (BeautyDoctors or another clinic) => link
    const existingQb = this.usersRepository
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.CLIENT })
      .andWhere(`${phoneKeySql('u.phone')} = :phoneKey`, { phoneKey });
    const existing = await existingQb.orderBy('u.createdAt', 'ASC').getOne();
    if (existing) {
      await this.tieClientToClinic(existing, LINKED_CLIENT_KEY, clinicId);
      const isBd = !!(await this.customerRecordsRepository.count({ where: { customerId: existing.id } }));
      return { patient: this.publicPatient(existing), linkedToExisting: true, isBeautyDoctorsClient: isBd };
    }

    // 2. BeautyDoctors lead with this phone => create its client account, linked to the lead
    const lead = await this.leadsRepository
      .createQueryBuilder('l')
      .where(`${phoneKeySql('l.phone')} = :phoneKey`, { phoneKey })
      .andWhere('l.status != :merged', { merged: LeadStatus.Merged })
      .orderBy('l.createdAt', 'ASC')
      .getOne();

    const password = Math.random().toString(36).slice(-10);
    // Real email only (no placeholders), and never one that belongs to another account
    const candidateEmail = email || (lead?.email && lead.email.trim() ? lead.email.trim() : undefined);
    const emailFree = candidateEmail
      ? !(await this.usersRepository.createQueryBuilder('u').where('LOWER(u.email) = LOWER(:email)', { email: candidateEmail }).getCount())
      : false;
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        firstName: lead?.firstName || firstName,
        lastName: lead?.lastName || (input.lastName || '').trim(),
        phone,
        email: emailFree ? candidateEmail : null,
        role: UserRole.CLIENT,
        isActive: true,
        passwordHash: password,
        profile: lead
          ? { [LINKED_CLIENT_KEY]: [clinicId] }
          : { clinicOwnClient: true, [OWN_CLIENT_KEY]: [clinicId], createdAsClinicClientAt: new Date().toISOString() },
      } as Partial<User>),
    );

    if (lead) {
      await this.customerRecordsRepository
        .save(this.customerRecordsRepository.create({ customerId: user.id, assignedSalespersonId: lead.assignedSalesId || null }))
        .catch(() => undefined);
      await this.leadsRepository.update(lead.id, {
        metadata: { ...(lead.metadata || {}), convertedToUserId: user.id },
      } as any);
      return { patient: this.publicPatient(user), linkedToExisting: true, isBeautyDoctorsClient: true };
    }
    return { patient: this.publicPatient(user), linkedToExisting: false, isBeautyDoctorsClient: false };
  }

  /** Doctor edits his own patient: the new details reach the account, appointments and the CRM card. */
  async updatePatient(userId: string, role: string, clientId: string, input: Partial<PatientInput>): Promise<any> {
    const clinicIds = await this.assertOwnPatient(userId, role, clientId);
    const client = await this.usersRepository.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Patient not found');

    const patch: Partial<User> = {};
    if (input.firstName && input.firstName.trim()) patch.firstName = input.firstName.trim();
    if (input.lastName !== undefined) patch.lastName = (input.lastName || '').trim();
    if (input.phone !== undefined) {
      if (!phoneMatchKey(input.phone)) throw new BadRequestException('A full mobile phone number is required');
      patch.phone = input.phone.trim();
    }
    if (input.email && input.email.trim() && input.email.trim().toLowerCase() !== (client.email || '').toLowerCase()) {
      const taken = await this.usersRepository
        .createQueryBuilder('u')
        .where('LOWER(u.email) = LOWER(:email)', { email: input.email.trim() })
        .andWhere('u.id != :id', { id: clientId })
        .getCount();
      if (taken) throw new BadRequestException('This email belongs to another account');
      // The email is the client's login: a clinic may only change it for its OWN clients. A BeautyDoctors
      // client (or one linked just by phone) would otherwise be taken over via a password reset.
      if (clinicIds !== null && !(await this.isClinicOwnClient(client, clinicIds))) {
        throw new ForbiddenException('Only BeautyDoctors can change the email of this client');
      }
      patch.email = input.email.trim();
    }
    if (Object.keys(patch).length === 0) return this.publicPatient(client);
    await this.usersRepository.update(clientId, patch);

    const updated = { ...client, ...patch } as User;
    const fullName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
    const appointments = await this.appointmentsRepository.find({ where: { clientId }, select: ['id', 'clientDetails'] });
    for (const apt of appointments) {
      if (!apt.clientDetails) continue;
      await this.appointmentsRepository.update(apt.id, {
        clientDetails: { ...apt.clientDetails, fullName: fullName || apt.clientDetails.fullName, phone: updated.phone, email: updated.email },
      });
    }

    // Keep the BeautyDoctors card (if this is a BD client) on the same details
    const leads = await this.leadsRepository
      .createQueryBuilder('l')
      .where(
        `(l.metadata::jsonb ->> 'convertedToUserId' = :uid OR l.metadata::jsonb ->> 'convertedToCustomerId' = :uid OR l.metadata::jsonb ->> 'existingCustomerId' = :uid)`,
        { uid: clientId },
      )
      .getMany();
    for (const lead of leads) {
      await this.leadsRepository.update(lead.id, {
        ...(patch.firstName ? { firstName: patch.firstName } : {}),
        ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
        ...(patch.phone ? { phone: patch.phone } : {}),
      });
    }
    return this.publicPatient(updated);
  }

  /**
   * Medical record of a patient for the PDF export: ONLY appointments at the
   * user's own clinic(s), with clinic notes. Never BeautyDoctors lead data,
   * salesperson notes or call history.
   */
  async getMedicalRecord(userId: string, role: string, clientId: string): Promise<any> {
    const clinicIds = await this.assertOwnPatient(userId, role, clientId);
    const client = await this.usersRepository.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Patient not found');

    const qb = this.appointmentsRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.clinic', 'clinic')
      .leftJoinAndSelect('a.service', 'service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('a.provider', 'provider')
      .where('a.clientId = :clientId', { clientId })
      .andWhere("a.status <> 'DELETED'");
    if (clinicIds) qb.andWhere('a.clinicId IN (:...clinicIds)', { clinicIds });
    const appointments = await qb.orderBy('a.startTime', 'DESC').getMany();

    const clinicNames = clinicIds
      ? (await this.clinicsRepository.find({ where: { id: In(clinicIds) }, select: ['id', 'name'] })).map((c) => c.name)
      : [...new Set(appointments.map((a) => a.clinic?.name).filter(Boolean))];

    return {
      generatedAt: new Date(),
      timezone: 'Europe/Athens',
      clinics: clinicNames,
      patient: this.publicPatient(client),
      appointments: appointments.map((a) => ({
        id: a.id,
        startTime: a.startTime,
        clinicName: a.clinic?.name || null,
        treatment: a.service?.treatment?.name || (a.service as any)?.name || 'Treatment',
        practitioner: a.provider ? `${a.provider.firstName || ''} ${a.provider.lastName || ''}`.trim() : null,
        price: a.totalAmount != null ? Number(a.totalAmount) : null,
        amountPaid: a.amountPaid != null ? Number(a.amountPaid) : null,
        status: String(a.status || '').toUpperCase(),
        clinicNotes: [a.clinicNotes, a.appointmentCompletionReport?.notes].filter((n) => n && String(n).trim()).join('\n') || null,
      })),
    };
  }

  /** The clinic's own client (created by one of these clinics) and not a BeautyDoctors customer. */
  private async isClinicOwnClient(client: User, clinicIds: string[]): Promise<boolean> {
    const own: string[] = Array.isArray((client.profile as any)?.[OWN_CLIENT_KEY]) ? (client.profile as any)[OWN_CLIENT_KEY] : [];
    if (!own.some((id) => clinicIds.includes(id))) return false;
    const isBd = await this.customerRecordsRepository.count({ where: { customerId: client.id } });
    return isBd === 0;
  }

  private async tieClientToClinic(client: User, key: string, clinicId: string): Promise<void> {
    const profile: any = client.profile && typeof client.profile === 'object' ? { ...client.profile } : {};
    const list: string[] = Array.isArray(profile[key]) ? profile[key] : [];
    if (list.includes(clinicId)) return;
    profile[key] = [...list, clinicId];
    await this.usersRepository.update(client.id, { profile });
  }

  private publicPatient(u: User) {
    return { id: u.id, firstName: u.firstName, lastName: u.lastName, phone: u.phone, email: u.email };
  }
}
