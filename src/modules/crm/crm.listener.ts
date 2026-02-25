import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CrmService } from './crm.service';
import { Lead } from './entities/lead.entity';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

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
}
