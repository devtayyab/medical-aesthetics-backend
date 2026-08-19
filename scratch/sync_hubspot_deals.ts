import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Lead } from '../src/modules/crm/entities/lead.entity';
import { Appointment } from '../src/modules/bookings/entities/appointment.entity';
import { Clinic } from '../src/modules/clinics/entities/clinic.entity';
import { User } from '../src/modules/users/entities/user.entity';
import axios from 'axios';

const HUBSPOT_TOKEN = process.env.HUBSPOT_API_TOKEN;
const BASE_URL = 'https://api.hubapi.com/crm/v3';

async function syncDeals() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const leadRepo = app.get(getRepositoryToken(Lead));
  const appointmentRepo = app.get(getRepositoryToken(Appointment));
  const clinicRepo = app.get(getRepositoryToken(Clinic));
  const userRepo = app.get(getRepositoryToken(User));

  console.log('Starting HubSpot Deals Sync...');

  // 1. Ensure Default Clinic Exists
  let defaultClinic = await clinicRepo.findOne({ where: { name: 'Default HubSpot Clinic' } });
  if (!defaultClinic) {
    const adminUser = await userRepo.findOne({ where: { role: 'super_admin' } });
    if (!adminUser) {
        console.error('Cannot create Default HubSpot Clinic because no super_admin exists. Please assign deals to an existing clinic.');
        return;
    }
    defaultClinic = clinicRepo.create({
      name: 'Default HubSpot Clinic',
      location: 'HubSpot Sync',
      address: 'HubSpot Virtual Address',
      contactNumber: 'N/A',
      phone: 'N/A',
      email: 'hubspot@sync.com',
      ownerId: adminUser.id,
      description: 'System generated clinic for HubSpot imported bookings.'
    });
    await clinicRepo.save(defaultClinic);
    console.log('Created Default HubSpot Clinic');
  }

  // 2. Fetch Deals from HubSpot
  console.log('Fetching Deals from HubSpot...');
  let hasMore = true;
  let after = undefined;
  const allDeals = [];

  while (hasMore) {
    const url = `${BASE_URL}/objects/deals?properties=dealname,amount,dealstage,pipeline,createdate,closedate&limit=100&associations=contacts${after ? `&after=${after}` : ''}`;
    try {
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` } });
      allDeals.push(...res.data.results);
      if (res.data.paging && res.data.paging.next) {
        after = res.data.paging.next.after;
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error('Error fetching deals', e.response?.data || e.message);
      break;
    }
  }

  console.log(`Fetched ${allDeals.length} Deals.`);

  // 3. Process Deals
  let importedCount = 0;
  for (const deal of allDeals) {
    const contactAssoc = deal.associations?.contacts?.results?.[0];
    if (!contactAssoc) continue; // Skip deals without contacts

    try {
      // Fetch contact details
      const contactRes = await axios.get(`${BASE_URL}/objects/contacts/${contactAssoc.id}?properties=email,phone`, {
        headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` }
      });
      const email = contactRes.data.properties.email;
      const phone = contactRes.data.properties.phone;

      if (!email && !phone) continue;

      // Find local lead
      const localLead = await leadRepo.findOne({
        where: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      });

      if (!localLead) continue; // Skip if lead not in our DB

      // Map Deal Stage to Appointment Status
      let status = 'PENDING';
      const ds = deal.properties.dealstage;
      if (ds === 'closedwon') status = 'COMPLETED';
      else if (ds === 'appointmentscheduled') status = 'CONFIRMED';
      else if (ds === 'closedlost') status = 'CANCELLED';

      // Check if already exists by external ID? We can store HubSpot ID in notes or create a new column, 
      // but for now let's just create it. To avoid duplicates, let's check if an appointment for this lead with same date exists.
      const date = new Date(deal.properties.createdate);
      
      const existing = await appointmentRepo.findOne({
        where: { customerId: localLead.id, clinicId: defaultClinic.id, startTime: date }
      });

      if (!existing) {
        const apt = appointmentRepo.create({
          customerId: localLead.id,
          clinicId: defaultClinic.id,
          serviceName: deal.properties.dealname || 'HubSpot Deal',
          status: status as any,
          startTime: date,
          endTime: new Date(date.getTime() + 60 * 60 * 1000), // +1 hour
          source: 'hubspot',
          notes: `Deal Stage: ${ds} | Amount: ${deal.properties.amount || '0'} | Pipeline: ${deal.properties.pipeline}`
        });
        await appointmentRepo.save(apt);
        importedCount++;
        console.log(`Imported deal as appointment for ${email || phone}`);
      }
    } catch (e) {
      console.error(`Failed to process deal ${deal.id}: ${e.message}`);
    }
  }

  console.log(`\n✅ Sync Complete! Imported ${importedCount} deals as appointments.`);
  await app.close();
}

syncDeals();
