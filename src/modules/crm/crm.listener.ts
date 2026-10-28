import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CrmService } from './crm.service';
import { Lead } from './entities/lead.entity';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { TaskAutomationService } from './task-automation.service';

@Injectable()
export class CrmListener {
    private readonly logger = new Logger(CrmListener.name);

    constructor(
        private readonly crmService: CrmService,
        private readonly notificationsService: NotificationsService,
        private readonly taskAutomationService: TaskAutomationService,
    ) { }

    // The one automatic task per booking (confirmation call) follows the appointment:
    // created on booking, moved on reschedule, closed on cancel/no-show/complete/delete.
    @OnEvent('appointment.created')
    async syncConfirmationOnCreated(appointment: any) {
        await this.taskAutomationService.syncConfirmationTask(appointment?.id);
    }

    @OnEvent('appointment.rescheduled')
    async syncConfirmationOnRescheduled(payload: any) {
        // Two emit shapes exist: the bare appointment and { appointment, oldStartTime, ... }
        await this.taskAutomationService.syncConfirmationTask(payload?.appointment?.id ?? payload?.id);
    }

    @OnEvent('appointment.status.changed')
    async syncConfirmationOnStatusChanged(payload: any) {
        await this.taskAutomationService.syncConfirmationTask(payload?.appointment?.id);
    }

    @OnEvent('appointment.calendar.dirty')
    async syncConfirmationOnCalendarDirty(payload: any) {
        await this.taskAutomationService.syncConfirmationTask(payload?.appointmentId);
    }

    @OnEvent('lead.status.changed')
    async handleLeadStatusChange(payload: { lead: Lead; oldStatus: string; newStatus: string }) {
        const { lead, newStatus } = payload;

        if (newStatus === LeadStatus.CONVERTED) {
            this.logger.log(`Lead ${lead.id} converted. Attempting to create customer account...`);

            try {
                const customerData = {
                    firstName: lead.firstName || 'Client',
                    lastName: lead.lastName || '',
                    email: lead.email,
                    phone: lead.phone || '',
                    source: lead.source,
                };

                let convertedUser: any = null;
                let passwordToEmail: string | undefined = undefined;

                try {
                    const result = await this.crmService.createCustomer(customerData, lead.assignedSalesId);
                    convertedUser = result.user;
                    passwordToEmail = result.password;
                    this.logger.log(`Customer created for lead ${lead.id}: ${convertedUser.id}`);
                } catch (error) {
                    if (error.message && error.message.includes('already exists')) {
                        this.logger.warn(`User already exists for lead ${lead.id}. Linking...`);
                        convertedUser = await this.crmService.findUserByEmail(lead.email);
                    } else {
                        throw error;
                    }
                }

                if (convertedUser) {
                    if (passwordToEmail && convertedUser.email) {
                        await this.notificationsService.sendWelcomeCredentials(
                            convertedUser.id,
                            convertedUser.email,
                            passwordToEmail,
                            convertedUser.firstName || lead.firstName
                        );
                    }
                    await this.crmService.update(lead.id, {
                        metadata: {
                            ...lead.metadata,
                            convertedToCustomerId: convertedUser.id,
                            convertedAt: new Date()
                        }
                    } as any);

                    // Add an activity log
                    await this.crmService.logCommunication({
                        customerId: convertedUser.id,
                        salespersonId: lead.assignedSalesId || null,
                        type: 'note',
                        status: 'completed',
                        direction: 'outgoing',
                        notes: `Lead successfully converted into an active Customer.`,
                    });
                }
            } catch (error) {
                this.logger.error(`Failed to handle lead conversion for ${lead.id}`, error.stack);
            }
        }
    }

    @OnEvent('appointment.executed')
    async handleAppointmentExecuted(appointment: any) {
        // No follow-up task here: the only automatic task is the confirmation call (closed by the sync below).
        await this.taskAutomationService.syncConfirmationTask(appointment?.id);

        try {
            const representativeId = appointment.representativeId || appointment.bookedById;
            if (representativeId) {
                const therapyName = appointment.service?.treatment?.name || 'Treatment';

                // Notify the specific salesperson
                await this.notificationsService.create(
                    representativeId,
                    NotificationType.PUSH,
                    'Appointment Executed',
                    `${appointment.client?.firstName || 'Client'} has completed their ${therapyName} at ${appointment.clinic?.name}.`,
                    { appointmentId: appointment.id, type: 'execution' }
                );

                // Notify Platform Admins (Logic in service now restricts to Admins only)
                await this.notificationsService.sendToPlatformAdmins(
                    'Appointment Executed',
                    `${appointment.client?.firstName || 'Client'} has completed their ${therapyName} at ${appointment.clinic?.name}.`,
                    { appointmentId: appointment.id, type: 'execution' }
                );
            }
        } catch (error) {
            this.logger.error(`Failed to handle appointment execution notifications for ${appointment?.id}`, error.stack);
        }
    }
}
