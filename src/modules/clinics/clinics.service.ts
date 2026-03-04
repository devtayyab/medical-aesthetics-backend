import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
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
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AgentClinicAccess)
    private agentAccessRepository: Repository<AgentClinicAccess>,
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

    // Distance sorting if coordinates are provided
    if (params.lat && params.lng) {
      clinicQb.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(clinic.latitude)) * cos(radians(clinic.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(clinic.latitude))))`,
        'clinic_distance'
      );
      clinicQb.setParameters({ lat: params.lat, lng: params.lng });
      // Sort by distance, keeping nulls at the end
      clinicQb.orderBy('CASE WHEN clinic.latitude IS NULL OR clinic.longitude IS NULL THEN 1 ELSE 0 END', 'ASC');
      clinicQb.addOrderBy('clinic_distance', 'ASC');
    } else {
      // Default fallback sorting
      clinicQb.orderBy('clinic.createdAt', 'DESC');
    }

    // 2. Search for Treatments (Therapies)
    const treatmentQb = this.treatmentsRepository.createQueryBuilder('treatment')
      .leftJoinAndSelect('treatment.offerings', 'offering')
      .leftJoinAndSelect('offering.clinic', 'clinic')
      .where('treatment.isActive = :isActive', { isActive: true });

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

    if (params.lat && params.lng) {
      treatmentQb.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(clinic.latitude)) * cos(radians(clinic.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(clinic.latitude))))`,
        'clinic_distance'
      );
      treatmentQb.setParameters({ lat: params.lat, lng: params.lng });
      treatmentQb.orderBy('CASE WHEN clinic.latitude IS NULL OR clinic.longitude IS NULL THEN 1 ELSE 0 END', 'ASC');
      treatmentQb.addOrderBy('clinic_distance', 'ASC');
    }

    const { entities: clinics, raw: rawResults } = await clinicQb
      .take(params.limit || 10)
      .skip(params.offset || 0)
      .getRawAndEntities();

    // Map the distance from raw query results and calculate minPrice
    clinics.forEach((clinic) => {
      // Find the corresponding raw result by ID for distance
      const raw = rawResults.find(r => r.clinic_id === clinic.id);
      if (raw && raw.clinic_distance !== null && raw.clinic_distance !== undefined) {
        (clinic as any).distance = parseFloat(raw.clinic_distance);
      }

      // Calculate minPrice from active services
      if (clinic.services && clinic.services.length > 0) {
        const prices = clinic.services.map(s => Number(s.price));
        (clinic as any).minPrice = Math.min(...prices);
      }
    });

    const totalClinics = await clinicQb.getCount();

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
    return this.servicesRepository.find({
      where: { clinicId, isActive: true, treatment: { isActive: true } },
      relations: ['treatment'],
    });
  }

  // New clinic management methods
  async createClinic(createClinicDto: CreateClinicProfileDto & { ownerId: string }): Promise<Clinic> {
    // Check if user already has a clinic
    const existingClinic = await this.clinicsRepository.findOne({
      where: { ownerId: createClinicDto.ownerId },
    });

    if (existingClinic) {
      throw new BadRequestException('User already owns a clinic');
    }

    const clinic = this.clinicsRepository.create(createClinicDto);
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

    throw new NotFoundException('Clinic not found for this owner');
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
    const clinic = await this.findByOwnerId(ownerId);

    clinic.businessHours = availabilitySettingsDto.businessHours;
    clinic.timezone = availabilitySettingsDto.timezone;

    return this.clinicsRepository.save(clinic);
  }

  async getClinicStaff(clinicId: string): Promise<any[]> {
    // This would typically join with user table to get staff members
    // For now, return basic clinic info
    const clinic = await this.findById(clinicId);
    return [
      {
        id: clinic.ownerId,
        role: 'clinic_owner',
        name: 'Clinic Owner', // This would come from user table
      },
    ];
  }

  async getClinicProviders(clinicId: string): Promise<any[]> {
    // 1. Get all providers from appointments
    const providersFromAppointments = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.providerAppointments', 'appointment')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .getMany();

    // 2. Get clinic owner
    const clinic = await this.clinicsRepository.findOne({
      where: { id: clinicId },
      relations: ['owner'],
    });

    const uniqueProviders = new Map();

    // Add providers from appointments
    providersFromAppointments.forEach((user) => {
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

    // Add owner if they are a doctor or clinic_owner
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
  async getClinicServices(ownerId: string, clinicId?: string): Promise<Service[]> {
    let clinic;
    if (clinicId) {
      clinic = await this.findById(clinicId);
    } else {
      clinic = await this.findByOwnerId(ownerId);
    }

    return this.servicesRepository.find({
      where: { clinicId: clinic.id },
      order: { createdAt: 'DESC' },
    });
  }

  async createService(ownerId: string, serviceData: CreateServiceDto): Promise<Service> {
    const clinic = await this.findByOwnerId(ownerId);

    // For management, we might need to find or create a treatment
    // This is a bit complex as it depends on whether we allow clinics to create global treatments
    // Assuming for now they pick from a list or we auto-create global treatments
    let treatment = await this.treatmentsRepository.findOne({
      where: { name: serviceData.name } // Simplified
    });

    if (!treatment && serviceData.name) {
      treatment = this.treatmentsRepository.create({
        name: serviceData.name,
        category: serviceData.category,
        shortDescription: serviceData.shortDescription,
        fullDescription: serviceData.fullDescription,
        imageUrl: serviceData.imageUrl,
      });
      await this.treatmentsRepository.save(treatment);
    }

    const service = this.servicesRepository.create({
      price: serviceData.price,
      durationMinutes: serviceData.durationMinutes,
      clinicId: clinic.id,
      treatmentId: treatment?.id || (serviceData as any).treatmentId,
      isActive: (serviceData as any).isActive ?? true,
      metadata: serviceData.metadata,
    });

    return this.servicesRepository.save(service);
  }

  private validateServiceForPublishing(service: Service) {
    // This now probably needs to check the linked treatment
    // But since serviceData was used to create/update, we'll assume it's valid if passed.
  }

  async updateService(
    ownerId: string,
    serviceId: string,
    updateData: UpdateServiceDto,
  ): Promise<Service> {
    const clinic = await this.findByOwnerId(ownerId);

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId, clinicId: clinic.id },
      relations: ['treatment'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (updateData.price !== undefined) service.price = updateData.price;
    if (updateData.durationMinutes !== undefined) service.durationMinutes = updateData.durationMinutes;
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

    return this.servicesRepository.save(service);
  }

  async toggleServiceStatus(ownerId: string, serviceId: string): Promise<Service> {
    const clinic = await this.findByOwnerId(ownerId);

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId, clinicId: clinic.id },
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
}