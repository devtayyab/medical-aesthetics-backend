import AppDataSource from '../config/data-source';
import { Appointment } from '../modules/bookings/entities/appointment.entity';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { User } from '../modules/users/entities/user.entity';

async function check() {
    await AppDataSource.initialize();

    console.log('--- Clinics ---');
    const clinics = await AppDataSource.getRepository(Clinic).find({ relations: ['owner'] });
    clinics.forEach(c => console.log(`${c.id}: ${c.name} (Owner Email: ${c.owner?.email})`));

    console.log('--- Users with clinical roles ---');
    const clinicalUsers = await AppDataSource.getRepository(User).find({
        where: [
            { role: 'doctor' as any },
            { role: 'clinic_owner' as any },
            { role: 'secretariat' as any }
        ],
        relations: ['ownedClinics', 'assignedClinic']
    });
    clinicalUsers.forEach(u => {
        console.log(`${u.id}: ${u.firstName} ${u.lastName} (${u.role}) - Assigned Clinic: ${u.assignedClinic?.name || 'N/A'}, Owned Clinics Count: ${u.ownedClinics?.length || 0}`);
    });

    console.log('--- Appointments ---');
    const appointments = await AppDataSource.getRepository(Appointment).find({
        relations: ['clinic', 'provider', 'client', 'bookedBy']
    });
    appointments.forEach(a => {
        console.log(`${a.id}: Clinic: ${a.clinic?.name}, Status: ${a.status}, Amount: ${a.totalAmount}, Provider: ${a.provider?.email || 'NULL'}, Time: ${a.startTime}`);
    });

    await AppDataSource.destroy();
}

check().catch(console.error);
