import { createConnection, IsNull, Not } from 'typeorm';
import { Lead } from './src/modules/crm/entities/lead.entity';
import { CommunicationLog } from './src/modules/crm/entities/communication-log.entity';
import * as dotenv from 'dotenv';
dotenv.config();

createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [Lead, CommunicationLog],
}).then(async connection => {
    const leadRepo = connection.getRepository(Lead);
    const commRepo = connection.getRepository(CommunicationLog);
    
    // Find all leads where lastContactedAt is set
    const leads = await leadRepo.find({ where: { lastContactedAt: Not(IsNull()) } });
    console.log(`Found ${leads.length} leads with lastContactedAt set.`);
    
    let clearedCount = 0;
    
    for (const lead of leads) {
        // Check if there are any outbound communications for this lead
        const logs = await commRepo.find({
            where: [
                { relatedLeadId: lead.id }
            ]
        });
        
        // Filter out inbound form submission notes and sync logs
        const actualContacts = logs.filter(l => 
            l.metadata?.source !== 'hubspot_sync' && 
            l.metadata?.source !== 'web_form' &&
            l.direction !== 'incoming'
        );
        
        if (actualContacts.length === 0) {
            // No real contact happened, it was just the sync script
            lead.lastContactedAt = null as any;
            await leadRepo.save(lead);
            clearedCount++;
        } else {
            // Set to the latest actual contact
            const latestContact = actualContacts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
            lead.lastContactedAt = latestContact.createdAt;
            await leadRepo.save(lead);
        }
    }
    
    console.log(`Cleared lastContactedAt for ${clearedCount} leads (sync artifacts).`);
    process.exit(0);
}).catch(console.error);
