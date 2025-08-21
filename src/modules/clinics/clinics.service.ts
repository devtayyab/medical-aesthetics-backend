import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Clinic } from './entities/clinic.entity';
import { Service } from './entities/service.entity';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async search(params: {
    location?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ clinics: Clinic[]; total: number; offset: number }> {
    const queryBuilder = this.clinicsRepository.createQueryBuilder('clinic')
      .leftJoinAndSelect('clinic.services', 'services')
      .where('clinic.isActive = :isActive', { isActive: true });

    if (params.location) {
      queryBuilder.andWhere(
        '(clinic.address->>\'city\' ILIKE :location OR clinic.address->>\'state\' ILIKE :location)',
        { location: `%${params.location}%` }
      );
    }

    if (params.search) {
      queryBuilder.andWhere(
        '(clinic.name ILIKE :search OR clinic.description ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    if (params.category) {
      queryBuilder.andWhere('services.category = :category', { category: params.category });
    }

    const total = await queryBuilder.getCount();
    
    if (params.limit) {
      queryBuilder.limit(params.limit);
    }
    
    if (params.offset) {
      queryBuilder.offset(params.offset);
    }

    const clinics = await queryBuilder.getMany();

    return {
      clinics,
      total,
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
}