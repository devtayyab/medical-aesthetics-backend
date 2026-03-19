import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CreateClinicProfileDto,
  UpdateClinicProfileDto,
  AvailabilitySettingsDto,
  CreateServiceDto,
  UpdateServiceDto,
} from './dto/clinic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { Service } from './entities/service.entity';
import { Treatment } from './entities/treatment.entity';
import { TreatmentCategory } from './entities/treatment-category.entity';
import { Review } from './entities/review.entity';
import { TreatmentStatus } from './enums/treatment-status.enum';
import { Repository, DeepPartial } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Appointment } from '../bookings/entities/appointment.entity';
import { ReviewStatus } from './enums/review-status.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

import { AgentClinicAccess } from '../crm/entities/agent-clinic-access.entity';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Treatment)
    private treatmentsRepository: Repository<Treatment>,
    @InjectRepository(TreatmentCategory)
    private categoryRepository: Repository<TreatmentCategory>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AgentClinicAccess)
    private agentAccessRepository: Repository<AgentClinicAccess>,
    private eventEmitter: EventEmitter2,
  ) { }

  async search(params: {
    location?: string;
    category?: string;
    search?: string;
    lat?: number;
    lng?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ clinics: Clinic[]; treatments: any[]; total: number; offset: number }> {
    // 1. Search for Clinics
    const clinicQb = this.clinicsRepository.createQueryBuilder('clinic')
      .innerJoinAndSelect('clinic.services', 'services', 'services.isActive = :sActive', { sActive: true })
      .leftJoinAndSelect('services.treatment', 'treatment')
      .where('clinic.isActive = :isActive', { isActive: true });

    if (params.location) {
      clinicQb.andWhere(
        '(clinic.address->>\'city\' ILIKE :location OR clinic.address->>\'state\' ILIKE :location)',
        { location: `%${params.location}%` }
      );
    }

    if (params.search) {
      clinicQb.andWhere(
        '(clinic.name ILIKE :search OR clinic.description ILIKE :search OR treatment.name ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    if (params.category) {
      clinicQb.andWhere('treatment.category = :category', { category: params.category });
    }

    const lat = params.lat ? parseFloat(params.lat as any) : null;
    const lng = params.lng ? parseFloat(params.lng as any) : null;

    if (lat && lng) {
      clinicQb.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(clinic.latitude)) * cos(radians(clinic.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(clinic.latitude))))`,
        'clinic_distance'
      );
      clinicQb.setParameters({ lat, lng });
      clinicQb.orderBy('CASE WHEN clinic.latitude IS NULL OR clinic.longitude IS NULL THEN 1 ELSE 0 END', 'ASC');
      clinicQb.addOrderBy('clinic_distance', 'ASC');
    } else {
      clinicQb.orderBy('clinic.createdAt', 'DESC');
    }

    const treatmentQb = this.treatmentsRepository.createQueryBuilder('treatment')
      .leftJoinAndSelect('treatment.offerings', 'offering')
      .leftJoinAndSelect('offering.clinic', 'clinic')
      .where('treatment.isActive = :isActive AND treatment.status = :status', {
        isActive: true,
        status: TreatmentStatus.APPROVED
      });

    if (params.search) {
      treatmentQb.andWhere(
        '(treatment.name ILIKE :search OR treatment.shortDescription ILIKE :search OR treatment.fullDescription ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    if (params.category) {
      treatmentQb.andWhere('treatment.category = :category', { category: params.category });
    }

    if (params.location) {
      treatmentQb.andWhere(
        '(clinic.address->>\'city\' ILIKE :location OR clinic.address->>\'state\' ILIKE :location)',
        { location: `%${params.location}%` }
      );
    }

    if (lat && lng) {
      treatmentQb.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(clinic.latitude)) * cos(radians(clinic.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(clinic.latitude))))`,
        'clinic_distance'
      );
      treatmentQb.setParameters({ lat, lng });
      treatmentQb.orderBy('CASE WHEN clinic.latitude IS NULL OR clinic.longitude IS NULL THEN 1 ELSE 0 END', 'ASC');
      treatmentQb.addOrderBy('clinic_distance', 'ASC');
    }

    try {
      const totalClinics = await clinicQb.getCount();
      const { entities: clinics, raw: rawResults } = await clinicQb
        .take(params.limit || 10)
        .skip(params.offset || 0)
        .getRawAndEntities();

      // Map the distance from raw query results and calculate minPrice
      clinics.forEach((clinic) => {
        // Calculate minPrice from active services
        if (clinic.services && clinic.services.length > 0) {
          const prices = clinic.services
            .filter(s => s.isActive)
            .map(s => Number(s.price))
            .filter(p => !isNaN(p));

          if (prices.length > 0) {
            (clinic as any).minPrice = Math.min(...prices);
          }
        }

        // Find the corresponding raw result by ID for distance
        const raw = rawResults.find(r => r.clinic_id === clinic.id || r.id === clinic.id || r.clinic_id_id === clinic.id);

        if (raw) {
          const distAttr = Object.keys(raw).find(k => k.toLowerCase().includes('distance'));
          if (distAttr && raw[distAttr] !== null) {
            (clinic as any).distance = parseFloat(raw[distAttr]);
          }
        }

        // Calculate minPrice from active services
        if (clinic.services && clinic.services.length > 0) {
          const prices = clinic.services.map(s => Number(s.price));
          (clinic as any).minPrice = Math.min(...prices);
        }
      });

      const [treatments, totalTreatments] = await treatmentQb
        .take(params.limit || 10)
        .skip(params.offset || 0)
        .getManyAndCount();

      // Process treatments to include aggregate data
      const processedTreatments = treatments.map(t => {
        const activeOfferings = t.offerings.filter(o => o.isActive && o.clinic?.isActive);
        const prices = activeOfferings.map(o => Number(o.price));
        const fromPrice = prices.length > 0 ? Math.min(...prices) : null;

        return {
          ...t,
          fromPrice,
          clinicsCount: activeOfferings.length,
          availableAt: activeOfferings.slice(0, 1).map(o => o.clinic.name), // Show at least one
          singleClinicId: activeOfferings.length === 1 ? activeOfferings[0].clinicId : undefined,
          singleServiceId: activeOfferings.length === 1 ? activeOfferings[0].id : undefined
        };
      });

      return {
        clinics,
        treatments: processedTreatments,
        total: totalClinics + totalTreatments,
        offset: params.offset || 0,
      };
    } catch (error) {
      console.error('Error in ClinicsService.search:', error);
      throw error;
    }
  }

  async getTreatmentDetails(id: string): Promise<any> {
    const treatment = await this.treatmentsRepository.findOne({
      where: { id },
      relations: ['offerings', 'offerings.clinic'],
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    const offerings = treatment.offerings
      .filter(o => o.isActive && o.clinic?.isActive)
      .map(o => ({
        id: o.id,
        clinicId: o.clinic.id,
        clinicName: o.clinic.name,
        location: `${o.clinic.address.city}, ${o.clinic.address.state}`,
        price: o.price,
        durationMinutes: o.durationMinutes,
      }));

    return {
      ...treatment,
      offerings,
    };
  }

  async getFeatured(): Promise<Clinic[]> {
    return this.clinicsRepository.find({
      where: { isActive: true },
      relations: ['services'],
      take: 6,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({
      where: { id, isActive: true },
      relations: ['services'],
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  async findServices(clinicId: string): Promise<Service[]> {
    const services = await this.servicesRepository.find({
      where: { clinicId, isActive: true, treatment: { isActive: true } },
      relations: ['treatment'],
    });
    console.log(`[ClinicsService] Found ${services.length} active services for clinicId: ${clinicId}`);
    if (services.length === 0) {
      const totalServices = await this.servicesRepository.count({ where: { clinicId } });
      console.log(`[ClinicsService] DEBUG: Total services for this clinic (including inactive): ${totalServices}`);
    }
    return services;
  }

  // New clinic management methods
  async createClinic(createClinicDto: CreateClinicProfileDto & { ownerId: string }): Promise<Clinic> {
    const clinic = this.clinicsRepository.create(createClinicDto);
    return this.clinicsRepository.save(clinic);
  }

  async updateClinicById(
    clinicId: string,
    updateClinicDto: UpdateClinicProfileDto,
  ): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundException('Clinic not found');

    Object.assign(clinic, updateClinicDto);
    return this.clinicsRepository.save(clinic);
  }

  async findByOwnerId(ownerId: string): Promise<Clinic> {
    // 1. Check if user owns a clinic
    const clinic = await this.clinicsRepository.findOne({
      where: { ownerId, isActive: true },
      relations: ['services'],
    });

    if (clinic) {
      return clinic;
    }

    // 2. Check if user is an agent for a clinic
    const agentAccess = await this.agentAccessRepository.findOne({
      where: { agentUserId: ownerId },
      relations: ['clinic'],
    });

    if (agentAccess && agentAccess.clinic) {
      return this.findById(agentAccess.clinic.id);
    }

    // 3. Check if user is staff for a clinic (assignedClinicId)
    const user = await this.usersRepository.findOne({ where: { id: ownerId } });
    if (user && user.assignedClinicId) {
      return this.findById(user.assignedClinicId);
    }

    throw new NotFoundException('Clinic not found for this user');
  }

  async findAllByOwner(ownerId: string): Promise<Clinic[]> {
    // 1. Get clinics directly owned
    const ownedClinics = await this.clinicsRepository.find({
      where: { ownerId, isActive: true }
    });

    // 2. Get clinics given agent access
    const agentClinics = await this.agentAccessRepository.find({
      where: { agentUserId: ownerId },
      relations: ['clinic']
    });

    const all = [...ownedClinics];
    agentClinics.forEach(ac => {
      if (ac.clinic && !all.find(c => c.id === ac.clinic.id)) {
        all.push(ac.clinic);
      }
    });

    // 3. Check if user is staff for a clinic
    const user = await this.usersRepository.findOne({ where: { id: ownerId } });
    if (user && user.assignedClinicId && !all.find(c => c.id === user.assignedClinicId)) {
      const staffClinic = await this.findById(user.assignedClinicId);
      if (staffClinic) all.push(staffClinic);
    }

    return all;
  }

  async updateClinicProfile(
    ownerId: string,
    updateClinicDto: UpdateClinicProfileDto,
  ): Promise<Clinic> {
    const clinic = await this.findByOwnerId(ownerId);

    Object.assign(clinic, updateClinicDto);
    return this.clinicsRepository.save(clinic);
  }

  async updateClinicAvailability(
    ownerId: string,
    availabilitySettingsDto: AvailabilitySettingsDto,
  ): Promise<Clinic> {
    let clinic;
    if (availabilitySettingsDto.clinicId) {
        clinic = await this.findById(availabilitySettingsDto.clinicId);
    } else {
        clinic = await this.findByOwnerId(ownerId);
    }

    clinic.businessHours = availabilitySettingsDto.businessHours;
    clinic.timezone = availabilitySettingsDto.timezone;

    return this.clinicsRepository.save(clinic);
  }

  async getClinicStaff(ownerId: string, role?: string, clinicId?: string): Promise<User[]> {
    let clinicIdToUse: string;

    if (clinicId && (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER)) {
      clinicIdToUse = clinicId;
    } else if (role === UserRole.DOCTOR || role === UserRole.SECRETARIAT) {
      // Find clinic they are assigned to
      const user = await this.usersRepository.findOne({
        where: { id: ownerId },
        select: ['id', 'assignedClinicId'],
      });
      if (!user || !user.assignedClinicId) {
        throw new NotFoundException('Clinic assignment not found');
      }
      clinicIdToUse = user.assignedClinicId;
    } else {
      const clinic = await this.findByOwnerId(ownerId);
      clinicIdToUse = clinic.id;
    }

    return this.usersRepository.find({
      where: { assignedClinicId: clinicIdToUse },
      order: { firstName: 'ASC' },
    });
  }

  async createClinicStaff(
    ownerId: string,
    role: string,
    staffData: any,
  ): Promise<User> {
    let clinic;
    if (staffData.clinicId && (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER)) {
      clinic = await this.findById(staffData.clinicId);
    } else {
      clinic = await this.findByOwnerId(ownerId);
    }

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: staffData.email },
    });

    if (existingUser) {
      if (existingUser.assignedClinicId === clinic.id) {
        throw new BadRequestException('User is already staff at this clinic');
      }
      // If they exist but not in this clinic, we might want to reassign or invite?
      // For now, let's treat as error or simple update
      existingUser.assignedClinicId = clinic.id;
      existingUser.role = staffData.role || UserRole.DOCTOR;
      return this.usersRepository.save(existingUser);
    }

    const newUser = this.usersRepository.create({
      ...staffData,
      role: staffData.role || UserRole.DOCTOR,
      assignedClinicId: clinic.id,
      passwordHash: staffData.password || 'TemporaryPassword123!',
      isActive: true,
    } as any);

    return this.usersRepository.save(newUser) as unknown as Promise<User>;
  }

  async removeStaff(ownerId: string, role: string, staffId: string): Promise<void> {
    const clinic = await this.findByOwnerId(ownerId);
    const staff = await this.usersRepository.findOne({
      where: { id: staffId, assignedClinicId: clinic.id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found in your clinic');
    }

    // Do NOT delete the user, just unbind from clinic and maybe deactivate?
    // User requested "bound to specific clinic", so unbinding is enough.
    staff.assignedClinicId = null;
    await this.usersRepository.save(staff);
  }

  async getClinicProviders(clinicId: string): Promise<any[]> {
    const uniqueProviders = new Map();

    // 1. Get all users who have the role of doctor and are assigned to this clinic
    const assignedStaff = await this.usersRepository.find({
      where: [
        { assignedClinicId: clinicId, role: UserRole.DOCTOR },
        { assignedClinicId: clinicId, role: UserRole.CLINIC_OWNER }
      ]
    });

    assignedStaff.forEach((user) => {
      uniqueProviders.set(user.id, {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
      });
    });

    // 2. Get clinic owner (just in case they aren't marked as assigned to their own clinic)
    const clinic = await this.clinicsRepository.findOne({
      where: { id: clinicId },
      relations: ['owner'],
    });

    if (clinic?.owner) {
      const owner = clinic.owner;
      if (
        (owner.role === UserRole.DOCTOR || owner.role === UserRole.CLINIC_OWNER) &&
        !uniqueProviders.has(owner.id)
      ) {
        uniqueProviders.set(owner.id, {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          fullName: `${owner.firstName} ${owner.lastName}`,
          email: owner.email,
          phone: owner.phone,
          role: owner.role,
          profilePictureUrl: owner.profilePictureUrl,
        });
      }
    }

    // 3. Get any other users who already have appointments at this clinic (legacy/fallback)
    const providersFromAppointments = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.providerAppointments', 'appointment')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .getMany();

    providersFromAppointments.forEach((user) => {
      if (!uniqueProviders.has(user.id)) {
        uniqueProviders.set(user.id, {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePictureUrl: user.profilePictureUrl,
        });
      }
    });

    return Array.from(uniqueProviders.values());
  }

  async getServiceProviders(clinicId: string, serviceId: string): Promise<any[]> {
    // Get providers who have appointments for this specific service
    const providers = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.providerAppointments', 'appointment')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.serviceId = :serviceId', { serviceId })
      .getMany();

    // Map to the desired format
    return providers.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePictureUrl: user.profilePictureUrl,
    }));
  }

  async getClinicAnalytics(clinicId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<any> {
    const clinic = await this.findById(clinicId);

    // This would typically aggregate data from appointments, payments, etc.
    // For now, return basic clinic stats
    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      totalAppointments: 0, // Would be calculated from appointments table
      totalRevenue: 0, // Would be calculated from payments
      activeClients: 0, // Would be calculated from unique clients
      period: dateRange || { startDate: new Date(), endDate: new Date() },
    };
  }

  // Service/Treatment Management
  async getClinicServices(ownerId: string, role?: string, clinicId?: string): Promise<Service[]> {
    let clinic;
    if (clinicId) {
      // Permission check: Admin/SuperAdmin/Manager can see any. Owner can only see if they own it.
      if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER) {
        clinic = await this.findById(clinicId);
      } else {
        const owned = await this.findAllByOwner(ownerId);
        clinic = owned.find(c => c.id === clinicId);
        if (!clinic) throw new ForbiddenException('Access denied to this clinic');
      }
    } else {
      clinic = await this.findByOwnerId(ownerId);
    }

    return this.servicesRepository.find({
      where: { clinicId: clinic.id },
      relations: ['treatment'],
      order: { createdAt: 'DESC' },
    });
  }

  async createService(ownerId: string, role: string, serviceData: CreateServiceDto & { clinicId?: string }): Promise<Service> {
    let clinic;
    if (serviceData.clinicId && (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER)) {
      clinic = await this.findById(serviceData.clinicId);
    } else {
      clinic = await this.findByOwnerId(ownerId);
    }

    let treatment;
    if (serviceData.treatmentId) {
      treatment = await this.treatmentsRepository.findOne({ where: { id: serviceData.treatmentId } });
    }

    // If no treatmentId is given, we MUST have a name to link or create a treatment
    if (!treatment && !serviceData.name) {
      throw new BadRequestException('A service name or treatmentId is required to create a service');
    }

    if (!treatment && serviceData.name) {
      treatment = await this.treatmentsRepository.findOne({
        where: { name: serviceData.name }
      });

      if (!treatment) {
        treatment = this.treatmentsRepository.create({
          name: serviceData.name,
          category: serviceData.category,
          shortDescription: serviceData.shortDescription,
          fullDescription: serviceData.fullDescription,
          imageUrl: serviceData.imageUrl,
          status: TreatmentStatus.APPROVED,
        });
        await this.treatmentsRepository.save(treatment);
      }
    }

    if (!treatment) {
      throw new NotFoundException('Treatment master record not found');
    }

    const service = this.servicesRepository.create({
      price: serviceData.price,
      durationMinutes: serviceData.durationMinutes,
      clinicId: clinic.id,
      treatmentId: treatment.id,
      isActive: (serviceData as any).isActive ?? true,
      metadata: serviceData.metadata,
    });

    // Validate but don't block creation if just metadata is missing
    if (service.isActive) {
      service.treatment = treatment;
      try {
        this.validateServiceForPublishing(service);
      } catch (error) {
        // Log the validation error but don't fail the request
        console.warn(`Service created with metadata warnings: ${error.message}`);
      }
    }

    return this.servicesRepository.save(service);
  }

  private validateServiceForPublishing(service: Service) {
    if (!service.treatment) {
      throw new BadRequestException('Service must be linked to a treatment master record to be active');
    }

    const t = service.treatment;
    const errors: string[] = [];

    if (!t.categoryId && !t.category) errors.push('category');
    if (!t.shortDescription && !t.fullDescription) errors.push('description');
    if (!t.imageUrl) errors.push('photo');

    if (errors.length > 0) {
      throw new BadRequestException(
        `This service cannot be published (made active) because the underlying therapy record is incomplete. Missing: ${errors.join(', ')}.`
      );
    }

    if (t.status !== TreatmentStatus.APPROVED) {
      throw new BadRequestException('This therapy is pending admin approval and cannot be published yet.');
    }
  }

  async updateService(
    ownerId: string,
    role: string,
    serviceId: string,
    updateData: UpdateServiceDto & { clinicId?: string },
  ): Promise<Service> {
    let clinic;
    if (updateData.clinicId && (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER)) {
      clinic = await this.findById(updateData.clinicId);
    } else {
      clinic = await this.findByOwnerId(ownerId);
    }

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId, clinicId: clinic.id },
      relations: ['treatment'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const before = {
      price: Number(service.price ?? 0),
      durationMinutes: service.durationMinutes,
      name: service.treatment?.name,
      isActive: service.isActive,
    };

    if (updateData.price !== undefined) service.price = updateData.price;
    if (updateData.durationMinutes !== undefined) service.durationMinutes = updateData.durationMinutes;
    if (updateData.treatmentId !== undefined) service.treatmentId = updateData.treatmentId;
    if (updateData.isActive !== undefined) service.isActive = updateData.isActive;
    if (updateData.metadata !== undefined) service.metadata = updateData.metadata;

    if (service.treatment) {
      let treatmentUpdated = false;
      if (updateData.name !== undefined) { service.treatment.name = updateData.name; treatmentUpdated = true; }
      if (updateData.shortDescription !== undefined) { service.treatment.shortDescription = updateData.shortDescription; treatmentUpdated = true; }
      if (updateData.fullDescription !== undefined) { service.treatment.fullDescription = updateData.fullDescription; treatmentUpdated = true; }
      if (updateData.category !== undefined) { service.treatment.category = updateData.category; treatmentUpdated = true; }
      if (updateData.imageUrl !== undefined) { service.treatment.imageUrl = updateData.imageUrl; treatmentUpdated = true; }

      if (treatmentUpdated) {
        await this.treatmentsRepository.save(service.treatment);
      }
    }

    // Validate if service is active (published)
    if (service.isActive) {
      this.validateServiceForPublishing(service);
    }

    const saved = await this.servicesRepository.save(service);
    const after = {
      price: Number(saved.price ?? 0),
      durationMinutes: saved.durationMinutes,
      name: saved.treatment?.name,
      isActive: saved.isActive,
    };

    if (before.price !== after.price || before.durationMinutes !== after.durationMinutes || before.name !== after.name || before.isActive !== after.isActive) {
      this.eventEmitter.emit('audit.log', {
        userId: ownerId,
        action: 'SERVICE_EDIT',
        resource: 'services',
        resourceId: serviceId,
        changes: { before, after },
        data: { clinicId: clinic.id, serviceName: after.name },
      });
    }

    return saved;
  }

  async toggleServiceStatus(ownerId: string, role: string, serviceId: string, clinicId?: string): Promise<Service> {
    let clinic;
    if (clinicId && (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER)) {
      clinic = await this.findById(clinicId);
    } else {
      clinic = await this.findByOwnerId(ownerId);
    }

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId, clinicId: clinic.id },
      relations: ['treatment'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.isActive = !service.isActive;

    // If trying to activate, validate
    if (service.isActive) {
      this.validateServiceForPublishing(service);
    }

    return this.servicesRepository.save(service);
  }

  async getPublicReviews(clinicId: string, query?: { limit?: number; offset?: number }): Promise<any> {
    const queryBuilder = this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.client', 'client')
      .where('review.clinicId = :clinicId AND review.status = :status', {
        clinicId,
        status: ReviewStatus.APPROVED,
      })
      .orderBy('review.createdAt', 'DESC');

    if (query?.limit) queryBuilder.limit(query.limit);
    if (query?.offset) queryBuilder.offset(query.offset);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      reviews,
      total,
      limit: query?.limit,
      offset: query?.offset || 0,
    };
  }

  // Review Management
  async getClinicReviews(ownerId: string, query?: { limit?: number; offset?: number }): Promise<any> {
    const clinic = await this.findByOwnerId(ownerId);

    const queryBuilder = this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.client', 'client')
      .leftJoinAndSelect('review.appointment', 'appointment')
      .where('review.clinicId = :clinicId', { clinicId: clinic.id })
      .orderBy('review.createdAt', 'DESC');

    if (query?.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query?.offset) {
      queryBuilder.offset(query.offset);
    }

    const reviews = await queryBuilder.getMany();
    const total = await queryBuilder.getCount();

    // Calculate average rating from approved reviews only
    const avgRating = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .where('review.clinicId = :clinicId AND review.status = :status', {
        clinicId: clinic.id,
        status: ReviewStatus.APPROVED,
      })
      .getRawOne();

    return {
      reviews,
      total,
      averageRating: parseFloat(avgRating?.avgRating || '0'),
      limit: query?.limit,
      offset: query?.offset || 0,
    };
  }

  async respondToReview(
    ownerId: string,
    reviewId: string,
    response: string,
  ): Promise<Review> {
    const clinic = await this.findByOwnerId(ownerId);

    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId, clinicId: clinic.id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.response = response;
    review.respondedAt = new Date();
    return this.reviewsRepository.save(review);
  }

  async moderateReview(
    adminUserId: string,
    reviewId: string,
    status: ReviewStatus,
    rejectReason?: string,
  ): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
      relations: ['clinic'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = status;
    if (status === ReviewStatus.APPROVED) {
      review.approvedById = adminUserId;
      review.approvedAt = new Date();
      review.rejectReason = null;
    } else if (status === ReviewStatus.REJECTED) {
      review.rejectReason = rejectReason;
      review.approvedById = null;
      review.approvedAt = null;
    }

    const savedReview = await this.reviewsRepository.save(review);

    // Recalculate clinic rating immediately
    await this.recalculateClinicRating(review.clinicId);

    return savedReview;
  }

  async toggleReviewVisibility(ownerId: string, reviewId: string): Promise<Review> {
    // 1. Find the clinic managed by this user (owner or agent)
    const clinic = await this.findByOwnerId(ownerId);
    if (!clinic) {
      throw new NotFoundException('Clinic not found for this user');
    }

    // 2. Find the review and ensure it belongs to this clinic
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
      relations: ['clinic'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.clinicId !== clinic.id) {
      throw new BadRequestException('Review does not belong to your clinic');
    }

    // 3. Toggle status
    if (review.status === ReviewStatus.APPROVED) {
      review.status = ReviewStatus.REJECTED;
      review.approvedById = null;
      review.approvedAt = null;
    } else {
      review.status = ReviewStatus.APPROVED;
      review.approvedById = ownerId;
      review.approvedAt = new Date();
      review.rejectReason = null;
    }

    const savedReview = await this.reviewsRepository.save(review);

    // 4. Recalculate clinic rating immediately
    await this.recalculateClinicRating(clinic.id);

    return savedReview;
  }


  async getPendingReviews(query?: { limit?: number; offset?: number }): Promise<any> {
    const queryBuilder = this.reviewsRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.client', 'client')
      .leftJoinAndSelect('review.clinic', 'clinic')
      .leftJoinAndSelect('review.appointment', 'appointment')
      .where('review.status = :status', { status: ReviewStatus.PENDING })
      .orderBy('review.createdAt', 'DESC');

    if (query?.limit) queryBuilder.limit(query.limit);
    if (query?.offset) queryBuilder.offset(query.offset);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      reviews,
      total,
      limit: query?.limit,
      offset: query?.offset || 0,
    };
  }

  async recalculateClinicRating(clinicId: string): Promise<void> {
    const stats = await this.reviewsRepository
      .createQueryBuilder('review')
      .select([
        'COUNT(review.id) as count',
        'AVG(review.rating) as avg',
      ])
      .where('review.clinicId = :clinicId AND review.status = :status', {
        clinicId,
        status: ReviewStatus.APPROVED,
      })
      .getRawOne();

    await this.clinicsRepository.update(clinicId, {
      rating: parseFloat(stats.avg || '0'),
      reviewCount: parseInt(stats.count || '0'),
    });
  }


  async getReviewStatistics(ownerId: string): Promise<any> {
    const clinic = await this.findByOwnerId(ownerId);

    const stats = await this.reviewsRepository
      .createQueryBuilder('review')
      .select([
        'COUNT(review.id) as totalReviews',
        'AVG(review.rating) as avgRating',
        'COUNT(CASE WHEN review.rating = 5 THEN 1 END) as fiveStars',
        'COUNT(CASE WHEN review.rating = 4 THEN 1 END) as fourStars',
        'COUNT(CASE WHEN review.rating = 3 THEN 1 END) as threeStars',
        'COUNT(CASE WHEN review.rating = 2 THEN 1 END) as twoStars',
        'COUNT(CASE WHEN review.rating = 1 THEN 1 END) as oneStar',
      ])
      .where('review.clinicId = :clinicId AND review.status = :status', {
        clinicId: clinic.id,
        status: ReviewStatus.APPROVED,
      })
      .getRawOne();

    return {
      totalReviews: parseInt(stats.totalReviews || '0'),
      averageRating: parseFloat(stats.avgRating || '0'),
      distribution: {
        5: parseInt(stats.fiveStars || '0'),
        4: parseInt(stats.fourStars || '0'),
        3: parseInt(stats.threeStars || '0'),
        2: parseInt(stats.twoStars || '0'),
        1: parseInt(stats.oneStar || '0'),
      },
    };
  }

  async createReview(
    clinicId: string,
    clientId: string,
    rating: number,
    comment?: string,
    appointmentId?: string,
  ): Promise<Review> {
    try {
      if (!clientId) throw new BadRequestException('User ID is required');
      if (!clinicId) throw new BadRequestException('Clinic ID is required');

      // 1. Check if Clinic exists
      const clinic = await this.clinicsRepository.findOne({ where: { id: clinicId } });
      if (!clinic) throw new NotFoundException('Clinic not found');

      // 2. Check if Appointment exists and belongs to this client and clinic, and is COMPLETED
      if (!appointmentId) {
        throw new BadRequestException('Review must be linked to a completed appointment');
      }

      const appointment = await this.appointmentsRepository.findOne({
        where: {
          id: appointmentId,
          clientId,
          clinicId,
          status: AppointmentStatus.COMPLETED
        }
      });

      if (!appointment) {
        throw new BadRequestException('You can only review clinics after a completed appointment');
      }

      // 3. Enforce one review per appointment
      const existingReview = await this.reviewsRepository.findOne({
        where: { appointmentId }
      });

      if (existingReview) {
        throw new BadRequestException('You have already reviewed this appointment');
      }

      const review = this.reviewsRepository.create({
        clinicId,
        clientId,
        rating,
        comment,
        appointmentId,
        status: ReviewStatus.PENDING,
      });

      return await this.reviewsRepository.save(review);
    } catch (error) {
      console.error('Error creating review:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  // Treatment Predefined Management
  async getCategories(): Promise<TreatmentCategory[]> {
    return this.categoryRepository.find({
      where: { isActive: true, status: TreatmentStatus.APPROVED },
      order: { name: 'ASC' },
    });
  }

  async createManualCategory(data: { name: string; description?: string }): Promise<TreatmentCategory> {
    const category = this.categoryRepository.create({
      ...data,
      status: TreatmentStatus.PENDING,
      isActive: true,
    });
    return this.categoryRepository.save(category);
  }

  async getTreatmentsByCategory(categoryId: string): Promise<Treatment[]> {
    return this.treatmentsRepository.find({
      where: { categoryId, status: TreatmentStatus.APPROVED, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createManualTreatment(data: {
    name: string;
    categoryId: string;
    shortDescription?: string;
    fullDescription?: string;
  }): Promise<Treatment> {
    const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const treatment = this.treatmentsRepository.create({
      ...data,
      status: TreatmentStatus.PENDING,
      isActive: true,
      category: category.name, // Support legacy
    });

    return this.treatmentsRepository.save(treatment);
  }

  async setTreatmentStatus(treatmentId: string, status: TreatmentStatus): Promise<Treatment> {
    const treatment = await this.treatmentsRepository.findOne({ where: { id: treatmentId } });
    if (!treatment) throw new NotFoundException('Treatment not found');

    treatment.status = status;
    return this.treatmentsRepository.save(treatment);
  }

  async getPendingTreatments(): Promise<Treatment[]> {
    return this.treatmentsRepository.find({
      where: { status: TreatmentStatus.PENDING },
      relations: ['categoryRef'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingCategories(): Promise<TreatmentCategory[]> {
    return this.categoryRepository.find({
      where: { status: TreatmentStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllCategories(query?: { search?: string; status?: TreatmentStatus }): Promise<TreatmentCategory[]> {
    const qb = this.categoryRepository.createQueryBuilder('category');
    if (query?.search) {
      qb.andWhere('category.name ILIKE :search', { search: `%${query.search}%` });
    }
    if (query?.status) {
      qb.andWhere('category.status = :status', { status: query.status });
    }
    qb.orderBy('category.name', 'ASC');
    return qb.getMany();
  }

  async updateCategory(id: string, data: any): Promise<TreatmentCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const treatmentsCount = await this.treatmentsRepository.count({ where: { categoryId: id } });
    if (treatmentsCount > 0) {
      throw new BadRequestException('Cannot delete category with associated treatments');
    }
    await this.categoryRepository.delete(id);
  }

  async getAllTreatmentsMaster(query?: { search?: string; status?: TreatmentStatus; categoryId?: string }): Promise<Treatment[]> {
    const qb = this.treatmentsRepository.createQueryBuilder('treatment')
      .leftJoinAndSelect('treatment.categoryRef', 'category');

    if (query?.search) {
      qb.andWhere('(treatment.name ILIKE :search OR treatment.shortDescription ILIKE :search)', { search: `%${query.search}%` });
    }
    if (query?.status) {
      qb.andWhere('treatment.status = :status', { status: query.status });
    }
    if (query?.categoryId) {
      qb.andWhere('treatment.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    qb.orderBy('treatment.name', 'ASC');
    return qb.getMany();
  }

  async updateTreatment(id: string, data: any): Promise<Treatment> {
    const treatment = await this.treatmentsRepository.findOne({ where: { id } });
    if (!treatment) throw new NotFoundException('Treatment not found');

    if (data.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      treatment.category = category.name;
    }

    Object.assign(treatment, data);
    return this.treatmentsRepository.save(treatment);
  }

  async deleteTreatment(id: string): Promise<void> {
    const offeringsCount = await this.servicesRepository.count({ where: { treatmentId: id } });
    if (offeringsCount > 0) {
      throw new BadRequestException('Cannot delete treatment with associated clinic offerings. Disable it instead.');
    }
    await this.treatmentsRepository.delete(id);
  }

  async createMasterTreatment(data: DeepPartial<Treatment>): Promise<Treatment> {
    const category = await this.categoryRepository.findOne({ where: { id: data.categoryId as any } });
    if (!category) throw new NotFoundException('Category not found');

    const treatment = this.treatmentsRepository.create({
      ...data,
      status: TreatmentStatus.APPROVED,
      category: category.name,
      isActive: true,
    } as DeepPartial<Treatment>) as unknown as Treatment;
    return await this.treatmentsRepository.save(treatment);
  }

  async createMasterCategory(data: DeepPartial<TreatmentCategory>): Promise<TreatmentCategory> {
    const category = this.categoryRepository.create({
      ...data,
      status: TreatmentStatus.APPROVED,
      isActive: true,
    } as DeepPartial<TreatmentCategory>) as unknown as TreatmentCategory;
    return await this.categoryRepository.save(category);
  }


}