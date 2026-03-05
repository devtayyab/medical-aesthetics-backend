import { AppDataSource } from '../../ormconfig';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import { Treatment } from '../modules/clinics/entities/treatment.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

async function seed() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        console.log('Database connected');

        const usersRepo = AppDataSource.getRepository(User);
        const clinicsRepo = AppDataSource.getRepository(Clinic);
        const servicesRepo = AppDataSource.getRepository(Service);

        // Check if clinic exists
        const existingClinic = await clinicsRepo.findOne({ where: {} });
        if (existingClinic) {
            console.log(`Clinics already exist. Found: ${existingClinic.name} (ID: ${existingClinic.id})`);
            console.log(`Is Active: ${existingClinic.isActive}`);

            if (!existingClinic.isActive) {
                console.log('Clinic is inactive. Activating...');
                existingClinic.isActive = true;
                await clinicsRepo.save(existingClinic);
                console.log('Clinic activated.');
            }

            // List services for debugging
            const services = await servicesRepo.find({ where: { clinicId: existingClinic.id } });
            console.log(`Found ${services.length} services for clinic ${existingClinic.name}`);

            process.exit(0);
        }

        console.log('No clinics found. Seeding...');

        // Create Owner
        let owner = await usersRepo.findOne({ where: { email: 'clinic_owner@example.com' } });
        if (!owner) {
            owner = usersRepo.create({
                email: 'clinic_owner@example.com',
                passwordHash: '$2b$12$e/y.e/y.e/y.e/y.e/y.e/y.e/y.e/y.e/y.e/y.e/y.e/y.e/y.e/', // Dummy hash
                firstName: 'Clinic',
                lastName: 'Owner',
                role: UserRole.CLINIC_OWNER,
                isActive: true,
            });
            await usersRepo.save(owner);
            console.log('Created clinic owner:', owner.email);
        } else {
            console.log('Found existing owner:', owner.email);
        }

        // Create Clinic
        const clinic = clinicsRepo.create({
            name: 'Downtown Medical Aesthetics',
            description: 'Premier medical aesthetics clinic in the heart of downtown.',
            address: {
                street: '123 Main St',
                city: 'Metropolis',
                state: 'NY',
                zipCode: '10001',
                country: 'USA'
            },
            phone: '555-0123',
            email: 'contact@downtownclinic.com',
            ownerId: owner.id,
            businessHours: {
                monday: { open: '09:00', close: '17:00', isOpen: true },
                tuesday: { open: '09:00', close: '17:00', isOpen: true },
                wednesday: { open: '09:00', close: '17:00', isOpen: true },
                thursday: { open: '09:00', close: '17:00', isOpen: true },
                friday: { open: '09:00', close: '17:00', isOpen: true },
                saturday: { open: '10:00', close: '14:00', isOpen: true },
                sunday: { open: '00:00', close: '00:00', isOpen: false }
            },
            isActive: true
        });
        const savedClinic = await clinicsRepo.save(clinic);
        console.log('Created clinic:', savedClinic.name);

        // Create Treatments and Services
        const treatmentsRepo = AppDataSource.getRepository(Treatment);
        const treatmentData = [
            { name: 'Botox Injection', shortDescription: 'Anti-wrinkle treatment', fullDescription: 'Detailed anti-wrinkle treatment...', category: 'Injectables' },
            { name: 'Laser Hair Removal', shortDescription: 'Full leg laser hair removal', fullDescription: 'Detailed laser hair removal...', category: 'Laser' },
        ];

        for (const t of treatmentData) {
            const treatment = await treatmentsRepo.save(treatmentsRepo.create(t));
            console.log('Created treatment:', treatment.name);

            const service = servicesRepo.create({
                clinicId: savedClinic.id,
                treatmentId: treatment.id,
                price: t.name === 'Botox Injection' ? 299 : 199,
                durationMinutes: t.name === 'Botox Injection' ? 30 : 60,
                isActive: true
            });
            await servicesRepo.save(service);
            console.log('Created service for:', treatment.name);
        }

        console.log('Seeding complete');
        process.exit(0);

    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
