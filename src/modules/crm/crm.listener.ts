import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CrmService } from './crm.service';
import { Lead } from './entities/lead.entity';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Injectable()
export class CrmListener {
    private readonly logger = new Logger(CrmListener.name);

    constructor(
        private readonly crmService: CrmService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @OnEvent('lead.status.changed')
    async handleLeadStatusChange(payload: { lead: Lead; oldStatus: string; newStatus: string }) {
        const { lead, newStatus } = payload;

        if (newStatus === LeadStatus.CONVERTED) {
            this.logger.log(`Lead ${lead.id} converted. Attempting to create customer account...`);

            try {
                const customerData = {
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    phone: lead.phone,
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
                    if (passwordToEmail) {
                        await this.notificationsService.sendWelcomeCredentials(convertedUser.id, convertedUser.email, passwordToEmail);
                    }
                    await this.crmService.update(lead.id, {
                        metadata: {
                            ...lead.metadata,
                            convertedToCustomerId: convertedUser.id,
                            convertedAt: new Date()
                        }
                    } as any);
                }
            } catch (error) {
                this.logger.error(`Failed to handle lead conversion for ${lead.id}`, error.stack);
            }
        }
    }

    @OnEvent('appointment.executed')
    async handleAppointmentExecuted(appointment: any) {
        this.logger.log(`Appointment ${appointment.id} executed in clinic. Generating follow-up...`);

        try {
            // 1. Find assigned salesperson (representative) or fallback to owner of lead
            const representativeId = appointment.representativeId || appointment.bookedById;
            
            if (representativeId) {
                // 2. Create a "Satisfaction Check" follow-up task as per workflow
                const therapyName = appointment.service?.treatment?.name || 'Treatment';
                
                await this.crmService.createAction({
                  customerId: appointment.clientId,
                  salespersonId: representativeId,
                  actionType: 'satisfaction_check',
                  title: `Satisfaction Check: ${therapyName}`,
                  description: `Post-Treatment Follow-up: ${therapyName} executed on ${appointment.executedAt || new Date().toISOString()}. Check patient results and upsell potential.`,
                  priority: 'medium',
                  dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days after execution
                  reminderDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) // 2 days after execution
                });

                // Notify the specific salesperson
                await this.notificationsService.create(
                    representativeId,
                    NotificationType.PUSH,
                    'Appointment Executed',
                    `${appointment.client?.firstName || 'Client'} has completed their ${therapyName} at ${appointment.clinic?.name}.`,
                    { appointmentId: appointment.id, type: 'execution' }
                );

                // Notify Platform Admins (Logic in service now restricts to Admins only)
                await this.notificationsService.notifyPlatformStaff(
                    'Appointment Executed',
                    `${appointment.client?.firstName || 'Client'} has completed their ${therapyName} at ${appointment.clinic?.name}.`,
                    { appointmentId: appointment.id, type: 'execution' }
                );

                this.logger.log(`Follow-up task created and platform staff notified for salesperson ${representativeId}`);
            }
        } catch (error) {
            this.logger.error(`Failed to handle appointment execution follow-up for ${appointment.id}`, error.stack);
        }
    }
}
