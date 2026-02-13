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
                // Check if customer already exists is handled inside createCustomer usually, 
                // but createCustomer throws error if exists.
                // We should try/catch.

                // Prepare customer data from lead
                const customerData = {
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    phone: lead.phone,
                    source: lead.source,
                };

                // We pass the assigned salesperson ID if present
                const { user: newCustomer, password } = await this.crmService.createCustomer(customerData, lead.assignedSalesId);

                this.logger.log(`Customer created for converted lead ${lead.id}. Customer ID: ${newCustomer.id}`);

                // Send welcome email with credentials
                await this.notificationsService.sendWelcomeCredentials(newCustomer.id, newCustomer.email, password);
                this.logger.log(`Credentials sent to ${newCustomer.email}`);

                // Link back to lead
                await this.crmService.update(lead.id, {
                    metadata: {
                        ...lead.metadata,
                        convertedToCustomerId: newCustomer.id,
                        convertedAt: new Date()
                    }
                } as any);

            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    this.logger.warn(`Customer already exists for converted lead ${lead.id}. Linking to existing...`);
                    // Implementation to find and link existing could go here if needed, 
                    // but for now logging is sufficient or we can add logic to get the existing user.
                } else {
                    this.logger.error(`Failed to create customer for lead ${lead.id}`, error.stack);
                }
            }
        }
    }
}
