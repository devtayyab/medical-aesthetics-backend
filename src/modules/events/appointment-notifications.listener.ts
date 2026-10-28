import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { Appointment } from '../bookings/entities/appointment.entity';
import { Service } from '../clinics/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { PaymentRecord, PaymentType } from '../payments/entities/payment-record.entity';
import { athensDate, athensTime, athensDateTime, personName } from '../notifications/utils/notification-format.util';
import {
  APPOINTMENT_NOTIFY_EVENT,
  AppointmentNotifyPayload,
  PAYMENT_NOTIFY_EVENT,
  PaymentNotifyPayload,
} from './appointment-notify.event';

const WALK_IN_DUMMY_ID = '00000000-0000-0000-0000-000000000000';
const CLINIC_ROLES = [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT] as string[];
const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as string[];
const SALES_ROLES = [UserRole.SALESPERSON, UserRole.MANAGER] as string[];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Μετρητά',
  card: 'Κάρτα',
  pos: 'POS',
  bank_transfer: 'Τραπεζική μεταφορά',
  viva_wallet: 'Κάρτα (online)',
  online_deposit: 'Online προκαταβολή',
  gift_card: 'Δωροκάρτα',
};

function euro(amount: number | string | null | undefined): string {
  const n = Number(amount || 0);
  return `€${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/**
 * Sends appointment and payment notifications. Recipient rules (one notification per
 * person per event; the person who made the change is never notified about it):
 *  - booked / changed / cancelled: every admin and salesperson once, with client, clinic,
 *    treatments, date, time and who did it.
 *  - client cancels: clinic is told. Clinic cancels: client is told; if it was paid, admins
 *    get a "refund?" alert (only admins decide refunds).
 *  - changed: client gets "Appointment changed"; if the clinic changed, the OLD clinic gets a
 *    plain cancellation (not where the client moved) and the NEW clinic a new appointment.
 *  - no-show: admins and salespeople only, nothing to the client.
 *  - deleted: admins only.
 *  - payments / refunds: admins and the salesperson of that client only.
 */
@Injectable()
export class AppointmentNotificationsListener {
  private readonly logger = new Logger(AppointmentNotificationsListener.name);

  constructor(
    private notificationsService: NotificationsService,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PaymentRecord)
    private paymentsRepository: Repository<PaymentRecord>,
  ) { }

  @OnEvent(APPOINTMENT_NOTIFY_EVENT, { async: true })
  async handleAppointmentNotify(payload: AppointmentNotifyPayload) {
    try {
      await this.dispatch(payload);
    } catch (err: any) {
      // Notifications must never break the booking flow
      this.logger.error(`Appointment notification failed (${payload?.kind} ${payload?.appointmentId}): ${err?.message || err}`);
    }
  }

  @OnEvent(PAYMENT_NOTIFY_EVENT, { async: true })
  async handlePaymentNotify(payload: PaymentNotifyPayload) {
    try {
      await this.dispatchPayment(payload);
    } catch (err: any) {
      this.logger.error(`Payment notification failed (${payload?.paymentId}): ${err?.message || err}`);
    }
  }

  // ---------------------------------------------------------------------------

  private async loadAppointment(id: string): Promise<Appointment | null> {
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['clinic', 'service', 'service.treatment', 'client', 'provider', 'bookedBy', 'representative'],
    });
  }

  private async treatmentNames(apt: Appointment, serviceIdOverride?: string, additionalOverride?: string[]): Promise<string> {
    const ids = [serviceIdOverride ?? apt.serviceId, ...((additionalOverride ?? apt.additionalServiceIds) || [])].filter(Boolean);
    if (ids.length === 0) return 'Θεραπεία';
    const services = await this.servicesRepository.find({ where: { id: In(ids) }, relations: ['treatment'] });
    const byId = new Map(services.map((s) => [s.id, s.treatment?.name]));
    const names = ids.map((id) => byId.get(id)).filter(Boolean);
    return [...new Set(names)].join(' + ') || 'Θεραπεία';
  }

  private clientName(apt: Appointment): string {
    return personName(apt.client, apt.clientDetails?.fullName || 'Πελάτης');
  }

  private async describeActor(actorId?: string): Promise<{ user: User | null; label: string; isClient: boolean; isClinic: boolean; isAdmin: boolean }> {
    if (!actorId) return { user: null, label: 'σύστημα', isClient: false, isClinic: false, isAdmin: false };
    const user = await this.usersRepository.findOne({ where: { id: actorId } });
    const role = String(user?.role || '');
    const name = personName(user, '');
    let roleLabel = '';
    if (ADMIN_ROLES.includes(role)) roleLabel = 'διαχειριστής';
    else if (SALES_ROLES.includes(role)) roleLabel = 'πωλήσεις';
    else if (CLINIC_ROLES.includes(role)) roleLabel = 'κλινική';
    else if (role === UserRole.CLIENT) roleLabel = 'πελάτης';
    const label = name ? (roleLabel ? `${name} (${roleLabel})` : name) : (roleLabel || 'σύστημα');
    return {
      user,
      label,
      isClient: role === UserRole.CLIENT,
      isClinic: CLINIC_ROLES.includes(role),
      isAdmin: ADMIN_ROLES.includes(role),
    };
  }

  private hasRealClient(apt: Appointment): boolean {
    return !!apt.clientId && apt.clientId !== WALK_IN_DUMMY_ID && !!apt.client;
  }

  private clientContext(apt: Appointment, treatments: string) {
    const addr: any = apt.clinic?.address || {};
    const clinicAddress = [addr.street, addr.city].filter(Boolean).join(', ');
    return {
      customerName: apt.client?.firstName || apt.clientDetails?.fullName || '',
      serviceName: treatments,
      appointmentDate: athensDate(apt.startTime),
      appointmentTime: athensTime(apt.startTime),
      clinicName: apt.clinic?.name || '',
      clinicAddress,
      appointmentId: apt.id,
    };
  }

  private async notifyClient(apt: Appointment, trigger: NotificationTrigger, treatments: string) {
    if (!this.hasRealClient(apt)) return;
    await this.notificationsService.sendTriggeredNotification(trigger, apt.clientId, this.clientContext(apt, treatments));
  }

  /** Clinic owner gets the email copy of clinic notifications (in-app goes to all clinic staff). */
  private async emailClinicOwner(clinicOwnerId: string | undefined, trigger: NotificationTrigger, context: any, excludeIds: string[]) {
    if (!clinicOwnerId || excludeIds.includes(clinicOwnerId)) return;
    await this.notificationsService.sendTriggeredNotification(trigger, clinicOwnerId, context, { channels: [NotificationType.EMAIL] });
  }

  // ---------------------------------------------------------------------------

  private async dispatch(p: AppointmentNotifyPayload) {
    const apt = await this.loadAppointment(p.appointmentId);
    if (!apt) return;

    const actor = await this.describeActor(p.actorId);
    const exclude = p.actorId ? [p.actorId] : [];
    const treatments = await this.treatmentNames(apt);
    const client = this.clientName(apt);
    const clinicName = apt.clinic?.name || 'Κλινική';
    const when = athensDateTime(apt.startTime);
    const data = { appointmentId: apt.id, clinicId: apt.clinicId, type: `appointment_${p.kind}` };

    switch (p.kind) {
      case 'created': {
        await this.notificationsService.notifyAllStaff(
          'Νέο ραντεβού',
          `${client} · ${treatments} · ${clinicName} · ${when} · Καταχώρηση: ${actor.label}`,
          data,
          exclude,
        );
        if (apt.clinicId) {
          await this.notificationsService.notifyClinicStaff(
            apt.clinicId,
            'Νέο ραντεβού',
            `${client} · ${treatments} · ${when}`,
            data,
            [],
            exclude,
          );
          await this.emailClinicOwner(apt.clinic?.ownerId, NotificationTrigger.CLINIC_NEW_APPOINTMENT, this.clientContext(apt, treatments), exclude);
        }
        const confirmed = String(apt.status).toUpperCase() === AppointmentStatus.CONFIRMED;
        await this.notifyClient(apt, confirmed ? NotificationTrigger.APPOINTMENT_CONFIRMED : NotificationTrigger.APPOINTMENT_BOOKED, treatments);
        break;
      }

      case 'changed': {
        const prev = p.previous || {};
        const oldStart = prev.startTime ? new Date(prev.startTime) : null;
        const timeChanged = !!oldStart && oldStart.getTime() !== new Date(apt.startTime).getTime();
        const clinicChanged = !!prev.clinicId && prev.clinicId !== apt.clinicId;
        const treatmentChanged =
          (prev.serviceId !== undefined && prev.serviceId !== apt.serviceId) ||
          (prev.additionalServiceIds !== undefined &&
            JSON.stringify([...(prev.additionalServiceIds || [])].sort()) !== JSON.stringify([...(apt.additionalServiceIds || [])].sort()));
        const providerChanged = prev.providerId !== undefined && prev.providerId !== apt.providerId;
        const ownerChanged =
          (prev.bookedById !== undefined && prev.bookedById !== apt.bookedById) ||
          (prev.representativeId !== undefined && prev.representativeId !== apt.representativeId);

        if (!timeChanged && !clinicChanged && !treatmentChanged && !providerChanged && !ownerChanged) return;

        const oldClinicName = clinicChanged
          ? (await this.appointmentsRepository.manager.query('SELECT name FROM clinics WHERE id = $1', [prev.clinicId]))?.[0]?.name || 'προηγούμενη κλινική'
          : clinicName;
        const before = oldStart ? athensDateTime(oldStart) : when;
        const changes: string[] = [];
        if (timeChanged) changes.push(`ώρα: ${before} → ${when}`);
        if (clinicChanged) changes.push(`κλινική: ${oldClinicName} → ${clinicName}`);
        if (treatmentChanged) changes.push(`θεραπεία: ${treatments}`);
        if (providerChanged) changes.push(`γιατρός: ${personName(apt.provider, '-')}`);
        if (ownerChanged) changes.push(`υπεύθυνος: ${personName(apt.representative || apt.bookedBy, '-')}`);
        const pendingNote = p.isClientReschedule ? ' · Αναμένει επιβεβαίωση' : '';

        await this.notificationsService.notifyAllStaff(
          'Αλλαγή ραντεβού',
          `${client} · ${clinicName} · ${when} · ${changes.join(', ')} · Αλλαγή από: ${actor.label}${pendingNote}`,
          data,
          exclude,
        );

        // Client: every change that affects the visit (not internal owner changes)
        if ((timeChanged || clinicChanged || treatmentChanged || providerChanged) && apt.clientId !== p.actorId) {
          await this.notifyClient(apt, NotificationTrigger.APPOINTMENT_RESCHEDULED, treatments);
        }

        if (clinicChanged) {
          // Old clinic: plain cancellation, without learning where the client moved
          const oldDate = oldStart || apt.startTime;
          await this.notificationsService.notifyClinicStaff(
            prev.clinicId,
            'Ακύρωση ραντεβού',
            `Το ραντεβού ${athensDate(oldDate)} ${athensTime(oldDate)} (${client}) ακυρώθηκε.`,
            { appointmentId: apt.id, clinicId: prev.clinicId, type: 'appointment_cancelled' },
            [],
            exclude,
          );
          const oldClinicOwner = (await this.appointmentsRepository.manager.query('SELECT "ownerId" FROM clinics WHERE id = $1', [prev.clinicId]))?.[0]?.ownerId;
          await this.emailClinicOwner(oldClinicOwner, NotificationTrigger.CLINIC_APPOINTMENT_CANCELLED, {
            appointmentDate: athensDate(oldDate),
            appointmentTime: athensTime(oldDate),
            clinicName: oldClinicName,
          }, exclude);

          // New clinic: a new appointment
          await this.notificationsService.notifyClinicStaff(apt.clinicId, 'Νέο ραντεβού', `${client} · ${treatments} · ${when}`, data, [], exclude);
          await this.emailClinicOwner(apt.clinic?.ownerId, NotificationTrigger.CLINIC_NEW_APPOINTMENT, this.clientContext(apt, treatments), exclude);
        } else if (timeChanged || treatmentChanged || providerChanged) {
          await this.notificationsService.notifyClinicStaff(
            apt.clinicId,
            'Αλλαγή ραντεβού',
            `${client} · ${treatments} · ${changes.filter((c) => !c.startsWith('υπεύθυνος')).join(', ')}${pendingNote}`,
            data,
            [],
            exclude,
          );
        }
        break;
      }

      case 'cancelled': {
        const paid = Number(p.paidAmount || 0);
        await this.notificationsService.notifyAllStaff(
          'Ακύρωση ραντεβού',
          `${client} · ${treatments} · ${clinicName} · ${when} · Ακύρωση από: ${actor.label}${paid > 0 ? ` · Πληρωμένο ${euro(paid)}` : ''}`,
          data,
          exclude,
        );

        // Client cancels -> clinic is told; staff/clinic cancels -> client is told.
        if (!actor.isClinic && apt.clinicId) {
          await this.notificationsService.notifyClinicStaff(
            apt.clinicId,
            'Ακύρωση ραντεβού',
            `Το ραντεβού ${when} (${client}) ακυρώθηκε.`,
            data,
            [],
            exclude,
          );
          await this.emailClinicOwner(apt.clinic?.ownerId, NotificationTrigger.CLINIC_APPOINTMENT_CANCELLED, this.clientContext(apt, treatments), exclude);
        }
        if (!actor.isClient) {
          await this.notifyClient(apt, NotificationTrigger.APPOINTMENT_CANCELED, treatments);
        }

        // Paid appointment cancelled by anyone but an admin: admins decide about the refund.
        if (paid > 0 && !actor.isAdmin) {
          const title = 'Ακύρωση πληρωμένου ραντεβού: επιστροφή χρημάτων;';
          const message = `${client} · ${treatments} · ${clinicName} · ${when} · Πληρωμένο ${euro(paid)} · Ακύρωση από: ${actor.label}. Αποφασίστε αν θα γίνει επιστροφή.`;
          const adminIds = await this.notificationsService.getAdminIds();
          await this.notificationsService.notifyUsers(adminIds, title, message, { ...data, type: 'refund_decision', paidAmount: paid });
          for (const adminId of adminIds) {
            await this.notificationsService.sendTriggeredNotification(
              NotificationTrigger.ADMIN_ALERT,
              adminId,
              { title, message },
              { channels: [NotificationType.EMAIL] },
            );
          }
        }
        break;
      }

      case 'confirmed': {
        if (apt.clientId !== p.actorId) {
          await this.notifyClient(apt, NotificationTrigger.APPOINTMENT_CONFIRMED, treatments);
        }
        break;
      }

      case 'no_show': {
        await this.notificationsService.notifyAllStaff(
          'Μη εμφάνιση πελάτη',
          `${client} · ${treatments} · ${clinicName} · ${when} · Καταχώρηση από: ${actor.label}`,
          data,
          exclude,
        );
        break;
      }

      case 'completed': {
        // One review request per appointment, right after the visit.
        if (this.hasRealClient(apt) && (await this.notificationsService.claimDispatch(`review_request:${apt.id}`, 'review_request', apt.id))) {
          const base = (process.env.APP_FRONTEND_URL || process.env.FRONTEND_URL || 'https://beautydoctors.gr').replace(/\/$/, '');
          await this.notificationsService.sendTriggeredNotification(NotificationTrigger.REVIEW_REQUEST, apt.clientId, {
            ...this.clientContext(apt, treatments),
            reviewUrl: `${base}/reviews`,
          });
        }
        break;
      }

      case 'deleted': {
        await this.notificationsService.notifyAdmins(
          'Διαγραφή ραντεβού',
          `${client} · ${treatments} · ${clinicName} · ${when} · Διαγραφή από: ${actor.label}`,
          data,
          exclude,
        );
        break;
      }
    }
  }

  private async dispatchPayment(p: PaymentNotifyPayload) {
    const payment = await this.paymentsRepository.findOne({ where: { id: p.paymentId } });
    if (!payment) return;

    const actorId = p.actorId || payment.recordedById;
    const exclude = actorId ? [actorId] : [];
    const apt = payment.appointmentId ? await this.loadAppointment(payment.appointmentId) : null;
    const clientUser = apt?.client || (payment.clientId ? await this.usersRepository.findOne({ where: { id: payment.clientId } }) : null);
    const client = apt ? this.clientName(apt) : personName(clientUser, 'Πελάτης');
    const clinicName = apt?.clinic?.name || '';
    const method = PAYMENT_METHOD_LABELS[payment.method] || payment.method || '';

    // Only admins and the salesperson of this client/appointment: never other salespeople.
    const salesCandidates = [payment.salespersonId, apt?.representativeId, apt?.bookedById].filter(Boolean);
    const salesUsers = salesCandidates.length
      ? await this.usersRepository.find({ where: { id: In(salesCandidates) } })
      : [];
    const salesIds = salesUsers.filter((u) => SALES_ROLES.includes(String(u.role))).map((u) => u.id);
    const recipients = [...(await this.notificationsService.getAdminIds()), ...salesIds];
    const data = { paymentId: payment.id, appointmentId: payment.appointmentId, type: `payment_${payment.type}` };
    const where = [client, clinicName, apt ? athensDateTime(apt.startTime) : ''].filter(Boolean).join(' · ');

    if (payment.type === PaymentType.PAYMENT || payment.type === PaymentType.DEPOSIT) {
      await this.notificationsService.notifyUsers(
        recipients,
        payment.type === PaymentType.DEPOSIT ? 'Προκαταβολή' : 'Νέα πληρωμή',
        `${euro(payment.amount)} (${method}) · ${where}`,
        data,
        exclude,
      );
      if (apt?.clinicId) {
        await this.notificationsService.notifyClinicStaff(apt.clinicId, 'Νέα πληρωμή', `${euro(payment.amount)} (${method}) · ${client} · ${athensDateTime(apt.startTime)}`, data, [], exclude);
      }
      if (clientUser && clientUser.role === UserRole.CLIENT) {
        await this.notificationsService.sendTriggeredNotification(
          NotificationTrigger.PAYMENT_RECEIPT,
          clientUser.id,
          {
            ...(apt ? this.clientContext(apt, await this.treatmentNames(apt)) : { customerName: clientUser.firstName }),
            amount: euro(payment.amount),
            paymentMethod: method,
          },
          { channels: [NotificationType.EMAIL] },
        );
      }
    } else if (payment.type === PaymentType.REFUND) {
      // Automatic "refund" ledger rows written on cancel are bookkeeping only: the cancel
      // notification already covers them (and admins decide the real refund).
      if (String(payment.notes || '').startsWith('Auto-refund record')) return;
      await this.notificationsService.notifyUsers(recipients, 'Επιστροφή χρημάτων', `${euro(payment.amount)} · ${where}`, data, exclude);
      if (clientUser && clientUser.role === UserRole.CLIENT) {
        await this.notificationsService.sendTriggeredNotification(
          NotificationTrigger.REFUND_ISSUED,
          clientUser.id,
          {
            ...(apt ? this.clientContext(apt, await this.treatmentNames(apt)) : { customerName: clientUser.firstName }),
            amount: euro(payment.amount),
          },
          { channels: [NotificationType.EMAIL] },
        );
      }
    } else if (payment.type === PaymentType.VOID) {
      await this.notificationsService.notifyUsers(recipients, 'Ακύρωση πληρωμής', `${euro(payment.amount)} · ${where}`, data, exclude);
    }
  }
}
