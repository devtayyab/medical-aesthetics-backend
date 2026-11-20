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
    @OnEvent('appointment.created', { async: true })
    async syncConfirmationOnCreated(appointment: any) {
        try {
            await this.taskAutomationService.syncConfirmationTask(appointment?.id);
        } catch (err: any) {
            this.logger.error(`syncConfirmationOnCreated failed: ${err?.message || err}`);
        }
    }

    @OnEvent('appointment.rescheduled', { async: true })
    async syncConfirmationOnRescheduled(payload: any) {
        try {
            // Two emit shapes exist: the bare appointment and { appointment, oldStartTime, ... }
            await this.taskAutomationService.syncConfirmationTask(payload?.appointment?.id ?? payload?.id);
        } catch (err: any) {
            this.logger.error(`syncConfirmationOnRescheduled failed: ${err?.message || err}`);
        }
    }

    @OnEvent('appointment.status.changed', { async: true })
    async syncConfirmationOnStatusChanged(payload: any) {
        try {
            await this.taskAutomationService.syncConfirmationTask(payload?.appointment?.id);
        } catch (err: any) {
            this.logger.error(`syncConfirmationOnStatusChanged failed: ${err?.message || err}`);
        }
    }

    @OnEvent('appointment.calendar.dirty', { async: true })
    async syncConfirmationOnCalendarDirty(payload: any) {
        try {
            await this.taskAutomationService.syncConfirmationTask(payload?.appointmentId);
        } catch (err: any) {
            this.logger.error(`syncConfirmationOnCalendarDirty failed: ${err?.message || err}`);
        }
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
    async handleAppointmentExecuted(payload: any) {
        // Emitted as { appointment, performedBy }; completion notifications are sent once by
        // AppointmentNotificationsListener, so only the confirmation task is closed here.
        const appointmentId = payload?.appointment?.id ?? payload?.id;
        await this.taskAutomationService.syncConfirmationTask(appointmentId);
    }
}
