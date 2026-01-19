import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateClinicProfileDto,
  UpdateClinicProfileDto,
  AvailabilitySettingsDto,
} from './dto/clinic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { Service } from './entities/service.entity';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) { }

  async search(params: {
    location?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ clinics: Clinic[]; services: Service[]; total: number; offset: number }> {
    // 1. Search for Clinics
    const clinicQb = this.clinicsRepository.createQueryBuilder('clinic')
      .leftJoinAndSelect('clinic.services', 'services')
      .where('clinic.isActive = :isActive', { isActive: true });

    if (params.location) {
      clinicQb.andWhere(
        '(clinic.address->>\'city\' ILIKE :location OR clinic.address->>\'state\' ILIKE :location)',
        { location: `%${params.location}%` }
      );
    }

    if (params.search) {
      clinicQb.andWhere(
        '(clinic.name ILIKE :search OR clinic.description ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    if (params.category) {
      clinicQb.andWhere('services.category = :category', { category: params.category });
    }

    // 2. Search for Services (Treatments)
    const serviceQb = this.servicesRepository.createQueryBuilder('service')
      .leftJoinAndSelect('service.clinic', 'clinic')
      .where('service.isActive = :isActive', { isActive: true })
      .andWhere('clinic.isActive = :clinicActive', { clinicActive: true });

    if (params.search) {
      serviceQb.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    if (params.category) {
      serviceQb.andWhere('service.category = :category', { category: params.category });
    }

    if (params.location) {
      serviceQb.andWhere(
        '(clinic.address->>\'city\' ILIKE :location OR clinic.address->>\'state\' ILIKE :location)',
        { location: `%${params.location}%` }
      );
    }

    const [clinics, totalClinics] = await clinicQb
      .take(params.limit || 10)
      .skip(params.offset || 0)
      .getManyAndCount();

    const [services, totalServices] = await serviceQb
      .take(params.limit || 10)
      .skip(params.offset || 0)
      .getManyAndCount();

    return {
      clinics,
      services,
      total: totalClinics + totalServices,
      offset: params.offset || 0,
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
      where: { id },
      relations: ['services'],
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  async findServices(clinicId: string): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { clinicId, isActive: true },
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
    const clinic = await this.clinicsRepository.findOne({
      where: { ownerId, isActive: true },
      relations: ['services'],
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found for this owner');
    }

    return clinic;
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
  async getClinicServices(ownerId: string): Promise<Service[]> {
    const clinic = await this.findByOwnerId(ownerId);
    return this.servicesRepository.find({
      where: { clinicId: clinic.id },
      order: { createdAt: 'DESC' },
    });
  }

  async createService(ownerId: string, serviceData: Partial<Service>): Promise<Service> {
    const clinic = await this.findByOwnerId(ownerId);

    const service = this.servicesRepository.create({
      ...serviceData,
      clinicId: clinic.id,
    });

    return this.servicesRepository.save(service);
  }

  async updateService(
    ownerId: string,
    serviceId: string,
    updateData: Partial<Service>,
  ): Promise<Service> {
    const clinic = await this.findByOwnerId(ownerId);

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId, clinicId: clinic.id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    Object.assign(service, updateData);
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
    return this.servicesRepository.save(service);
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

    // Calculate average rating
    const avgRating = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .where('review.clinicId = :clinicId AND review.isVisible = :isVisible', {
        clinicId: clinic.id,
        isVisible: true,
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

  async toggleReviewVisibility(
    ownerId: string,
    reviewId: string,
  ): Promise<Review> {
    const clinic = await this.findByOwnerId(ownerId);

    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId, clinicId: clinic.id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = !review.isVisible;
    return this.reviewsRepository.save(review);
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
      .where('review.clinicId = :clinicId AND review.isVisible = :isVisible', {
        clinicId: clinic.id,
        isVisible: true,
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
}