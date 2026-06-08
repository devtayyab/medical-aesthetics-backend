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
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';
import { TreatmentStatus } from './enums/treatment-status.enum';
import { Repository, DeepPartial, In, IsNull } from 'typeorm';
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
    @InjectRepository(ClinicOwnership)
    private readonly clinicOwnershipRepository: Repository<ClinicOwnership>,
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
    search_date?: string;
    search_time_window?: string;
    sortBy?: string;
  }): Promise<{ clinics: Clinic[]; treatments: any[]; total: number; totalClinics: number; totalTreatments: number; offset: number }> {
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

    if (params.search || params.category) {
      clinicQb.leftJoinAndSelect('treatment.categoryRef', 'categoryRef');
      clinicQb.leftJoin('categoryRef.parent', 'categoryParent');
    }

    const normalizeGreek = (str: string) => {
      if (!str) return '';
      return str.toLowerCase()
        .replace(/ά/g, 'α')
        .replace(/έ/g, 'ε')
        .replace(/ή/g, 'η')
        .replace(/ί/g, 'ι')
        .replace(/ό/g, 'ο')
        .replace(/ύ/g, 'υ')
        .replace(/ώ/g, 'ω')
        .replace(/ϊ/g, 'ι')
        .replace(/ϋ/g, 'υ')
        .replace(/ΐ/g, 'ι')
        .replace(/ΰ/g, 'υ');
    };

    const sqlTranslate = (field: string) => 
      `TRANSLATE(LOWER(${field}), 'άέήίόύώϊϋΐΰ', 'αεηιουωιυιυ')`;

    if (params.search) {
      const normalizedSearch = normalizeGreek(params.search);
      const searchTerm = `%${normalizedSearch}%`;
      const searchNoSpace = `%${normalizedSearch.replace(/\s+/g, '')}%`;
      clinicQb.andWhere(
        `(${sqlTranslate('clinic.name')} ILIKE :searchTerm OR ${sqlTranslate('treatment.name')} ILIKE :searchTerm OR ${sqlTranslate('treatment.category')} ILIKE :searchTerm OR ${sqlTranslate('categoryRef.name')} ILIKE :searchTerm OR REPLACE(${sqlTranslate('treatment.name')}, ' ', '') ILIKE :searchNoSpace OR REPLACE(${sqlTranslate('treatment.category')}, ' ', '') ILIKE :searchNoSpace OR REPLACE(${sqlTranslate('categoryRef.name')}, ' ', '') ILIKE :searchNoSpace)`,
        { searchTerm, searchNoSpace }
      );
    }

    if (params.category) {
      const normalizedCategory = normalizeGreek(params.category);
      const categoryParam = `%${normalizedCategory}%`;
      const categoryParamDash = `%${normalizedCategory.replace(/\s+/g, '-')}%`;
      clinicQb.andWhere(
        `(${sqlTranslate('treatment.category')} ILIKE :categoryParam OR ${sqlTranslate('categoryRef.name')} ILIKE :categoryParam OR ${sqlTranslate('categoryParent.name')} ILIKE :categoryParam OR REPLACE(${sqlTranslate('treatment.category')}, ' ', '-') ILIKE :categoryParamDash OR REPLACE(${sqlTranslate('categoryRef.name')}, ' ', '-') ILIKE :categoryParamDash OR REPLACE(${sqlTranslate('categoryParent.name')}, ' ', '-') ILIKE :categoryParamDash)`,
        { categoryParam, categoryParamDash }
      );
    }

    // --- Availability Filtering (Rule 2) ---
    if (params.search_date) {
      const searchDate = new Date(params.search_date);
      const dayName = searchDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // SQL to check if clinic is open on that day (JSON businessHours)
      clinicQb.andWhere(
        `CAST(clinic.businessHours->:dayName->>'isOpen' AS BOOLEAN) = true`,
        { dayName }
      );

      if (params.search_time_window) {
        // Simple logic: If they search morning/afternoon, we can optionally prioritize or strictly filter
        // For now, let's just ensure they are open during that window's likely hours
        let startLimit = '00:00';
        let endLimit = '23:59';
        
        if (params.search_time_window === 'morning') { startLimit = '08:00'; endLimit = '12:00'; }
        else if (params.search_time_window === 'afternoon') { startLimit = '12:00'; endLimit = '17:00'; }
        else if (params.search_time_window === 'evening') { startLimit = '17:00'; endLimit = '22:00'; }

        // Ensure clinic hours overlap with the requested window
        clinicQb.andWhere(
          `clinic.businessHours->:dayName->>'open' <= :endLimit AND clinic.businessHours->:dayName->>'close' >= :startLimit`,
          { dayName, startLimit, endLimit }
        );
      }
    }

    const lat = params.lat ? parseFloat(params.lat as any) : null;
    const lng = params.lng ? parseFloat(params.lng as any) : null;

    const serviceQb = this.servicesRepository.createQueryBuilder('service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('treatment.categoryRef', 'categoryRef')
      .leftJoin('categoryRef.parent', 'categoryParent')
      .leftJoinAndSelect('service.clinic', 'clinic')
      .where('service.isActive = :sActive AND clinic.isActive = :cActive', {
        sActive: true,
        cActive: true
      });

    if (params.search) {
      const normalizedSearch = normalizeGreek(params.search);
      const searchTerm = `%${normalizedSearch}%`;
      const searchNoSpace = `%${normalizedSearch.replace(/\s+/g, '')}%`;
      serviceQb.andWhere(
        `(${sqlTranslate('treatment.name')} ILIKE :searchTerm OR ${sqlTranslate('treatment.category')} ILIKE :searchTerm OR ${sqlTranslate('categoryRef.name')} ILIKE :searchTerm OR ${sqlTranslate('treatment.shortDescription')} ILIKE :searchTerm OR REPLACE(${sqlTranslate('treatment.name')}, ' ', '') ILIKE :searchNoSpace OR REPLACE(${sqlTranslate('treatment.category')}, ' ', '') ILIKE :searchNoSpace OR REPLACE(${sqlTranslate('categoryRef.name')}, ' ', '') ILIKE :searchNoSpace)`,
        { searchTerm, searchNoSpace }
      );
    }

    if (params.category) {
      const normalizedCategory = normalizeGreek(params.category);
      const categoryParam = `%${normalizedCategory}%`;
      const categoryParamDash = `%${normalizedCategory.replace(/\s+/g, '-')}%`;
      serviceQb.andWhere(
        `(${sqlTranslate('treatment.category')} ILIKE :categoryParam OR ${sqlTranslate('categoryRef.name')} ILIKE :categoryParam OR ${sqlTranslate('categoryParent.name')} ILIKE :categoryParam OR REPLACE(${sqlTranslate('treatment.category')}, ' ', '-') ILIKE :categoryParamDash OR REPLACE(${sqlTranslate('categoryRef.name')}, ' ', '-') ILIKE :categoryParamDash OR REPLACE(${sqlTranslate('categoryParent.name')}, ' ', '-') ILIKE :categoryParamDash)`,
        { categoryParam, categoryParamDash }
      );
    }

    if (params.location) {
      serviceQb.andWhere(
        '(clinic.address->>\'city\' ILIKE :location OR clinic.address->>\'state\' ILIKE :location)',
        { location: `%${params.location}%` }
      );
    }

    if (params.search_date) {
      const searchDate = new Date(params.search_date);
      const dayName = searchDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      serviceQb.andWhere(
        `CAST(clinic.businessHours->:dayName->>'isOpen' AS BOOLEAN) = true`,
        { dayName }
      );
    }

    if ((params as any).rating) {
      const minRating = parseFloat((params as any).rating.replace('-plus', ''));
      if (!isNaN(minRating)) {
        clinicQb.andWhere('clinic.rating >= :minRating', { minRating });
        serviceQb.andWhere('clinic.rating >= :minRating', { minRating });
      }
    }

    if (lat && lng) {
      const distanceSql = `(6371 * acos(cos(radians(:lat)) * cos(radians(clinic.latitude)) * cos(radians(clinic.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(clinic.latitude))))`;
      clinicQb.addSelect(distanceSql, 'clinic_distance');
      serviceQb.addSelect(distanceSql, 'clinic_distance');
      clinicQb.setParameter('lat', lat).setParameter('lng', lng);
      serviceQb.setParameter('lat', lat).setParameter('lng', lng);
    }

    // --- New Filters Logic ---
    if ((params as any).brand) {
      clinicQb.andWhere('clinic.description ILIKE :brand', { brand: `%${(params as any).brand}%` });
      serviceQb.andWhere('clinic.description ILIKE :brand', { brand: `%${(params as any).brand}%` });
    }

    if ((params as any).salon_type) {
      clinicQb.andWhere('clinic.type ILIKE :salonType', { salonType: `%${(params as any).salon_type}%` });
      serviceQb.andWhere('clinic.type ILIKE :salonType', { salonType: `%${(params as any).salon_type}%` });
    }

    if ((params as any).instant_offer) {
      clinicQb.andWhere('clinic.hasInstantOffer = :instantOffer', { instantOffer: true });
      serviceQb.andWhere('clinic.hasInstantOffer = :instantOffer', { instantOffer: true });
    }

    // Apply Sorting logic
    if (params.sortBy === 'distance' && lat && lng) {
      clinicQb.orderBy('clinic_distance', 'ASC');
      serviceQb.orderBy('clinic_distance', 'ASC');
    } else if (params.sortBy === 'price-asc') {
      serviceQb.orderBy('service.price', 'ASC');
    } else if (params.sortBy === 'price-desc') {
      serviceQb.orderBy('service.price', 'DESC');
    } else if (params.sortBy === 'rating') {
      clinicQb.orderBy('clinic.rating', 'DESC');
      serviceQb.orderBy('clinic.rating', 'DESC');
    } else {
      clinicQb.orderBy('clinic.createdAt', 'DESC');
      serviceQb.orderBy('service.createdAt', 'DESC');
    }

    try {
      const totalClinics = await clinicQb.getCount();
      const { entities: clinics, raw: rawResults } = await clinicQb
        .take(params.limit || 50)
        .skip(params.offset || 0)
        .getRawAndEntities();

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
      });

      const [services, totalTreatments] = await serviceQb
        .take(params.limit || 50)
        .skip(params.offset || 0)
        .getManyAndCount();

      // Transform services to Treatment Master records and DEDUPLICATE by master treatment ID.
      // Each unique treatment appears once, showing the lowest price across all clinics.
      const treatmentMap = new Map<string, any>();
      for (const s of services) {
        const masterId = s.treatment?.id || s.id;
        const existing = treatmentMap.get(masterId);
        const thisPrice = Number(s.price) || 0;

        if (!existing) {
          treatmentMap.set(masterId, {
            ...s.treatment,
            id: masterId,
            serviceId: s.id,
            masterTreatmentId: masterId,
            fromPrice: thisPrice,
            durationMinutes: s.durationMinutes,
            clinicId: s.clinicId,
            availableAt: [s.clinic?.name].filter(Boolean),
            clinicsCount: 1,
            singleClinicId: s.clinicId,
            singleServiceId: s.id,
            imageUrl: s.imageUrl || s.treatment?.imageUrl,
          });
        } else {
          // Merge: keep lowest price, accumulate clinic names & count
          if (thisPrice > 0 && (existing.fromPrice === 0 || thisPrice < existing.fromPrice)) {
            existing.fromPrice = thisPrice;
            existing.durationMinutes = s.durationMinutes;
            existing.clinicId = s.clinicId;
            existing.singleClinicId = s.clinicId;
            existing.singleServiceId = s.id;
          }
          const clinicName = s.clinic?.name;
          if (clinicName && !existing.availableAt.includes(clinicName)) {
            existing.availableAt.push(clinicName);
          }
          existing.clinicsCount = (existing.clinicsCount || 1) + 1;
        }
      }
      const processedTreatments = Array.from(treatmentMap.values());

      const deduplicatedCount = processedTreatments.length;
      return {
        clinics,
        treatments: processedTreatments,
        total: totalClinics + deduplicatedCount,
        totalClinics,
        totalTreatments: deduplicatedCount,
        offset: params.offset || 0,
      };
    } catch (error) {
      console.error('Error in ClinicsService.search:', error);
      throw error;
    }
  }

  async getTreatmentDetails(id: string): Promise<any> {
    // Basic UUID format check to avoid 500 errors from DB
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Invalid treatment ID format');
    }

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
        location: o.clinic.address
          ? `${o.clinic.address.city || ''}, ${o.clinic.address.state || ''}`.replace(/^,\s*|,\s*$/, '')
          : 'Location not specified',
        price: o.price,
        durationMinutes: o.durationMinutes,
        latitude: o.clinic.latitude,
        longitude: o.clinic.longitude,
        rating: o.clinic.rating,
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
      relations: ['services', 'owner', 'owners'],
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }
    return clinic;
  }

  async findServices(clinicId: string): Promise<any[]> {
    const services = await this.servicesRepository.find({
      where: { clinicId, isActive: true, treatment: { isActive: true } },
      relations: ['treatment'],
    });
    console.log(`[ClinicsService] Found ${services.length} active services for clinicId: ${clinicId}`);
    
    // Explicitly map name from treatment to service for UI consistency
    return services.map(s => ({
      ...s,
      name: s.treatment?.name || 'Unnamed Service'
    }));
  }

  // New clinic management methods
  async createClinic(createClinicDto: CreateClinicProfileDto & { ownerId?: string; ownerIds?: string[] }): Promise<Clinic> {
    const { ownerIds, ...baseData } = createClinicDto;
    
    // Determine the primary owner
    const allOwnerIds = ownerIds || [];
    const primaryOwnerId = createClinicDto.ownerId || allOwnerIds[0];
    
    if (!primaryOwnerId) {
      throw new BadRequestException('At least one owner is required');
    }

    const clinic = this.clinicsRepository.create({
      ...baseData,
      ownerId: primaryOwnerId,
    });
    const savedClinic = await this.clinicsRepository.save(clinic);
    
    // Automatically assign the owner as staff to their own clinic for better visibility
    await this.usersRepository.update(primaryOwnerId, {
      assignedClinicId: savedClinic.id
    });

    // Populate all owners in clinic_ownership mapping table
    const uniqueOwnerIds = Array.from(new Set([primaryOwnerId, ...allOwnerIds]));
    for (const oId of uniqueOwnerIds) {
      await this.clinicOwnershipRepository.save(
        this.clinicOwnershipRepository.create({
          clinicId: savedClinic.id,
          ownerUserId: oId,
          visibilityScope: 'shared',
        })
      );
    }
    
    const finalClinic = await this.clinicsRepository.findOne({
      where: { id: savedClinic.id },
      relations: ['services', 'owner', 'owners'],
    });
    return finalClinic;
  }

  async updateClinicById(
    clinicId: string,
    updateClinicDto: UpdateClinicProfileDto & { ownerIds?: string[] },
  ): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundException('Clinic not found');

    const { ownerIds, ...baseData } = updateClinicDto;

    if (ownerIds !== undefined) {
      if (ownerIds.length === 0) {
        throw new BadRequestException('At least one owner is required');
      }
      const primaryOwnerId = ownerIds[0];
      clinic.ownerId = primaryOwnerId;

      // Update mapping table
      await this.clinicOwnershipRepository.delete({ clinicId });
      for (const oId of ownerIds) {
        await this.clinicOwnershipRepository.save(
          this.clinicOwnershipRepository.create({
            clinicId,
            ownerUserId: oId,
            visibilityScope: 'shared',
          })
        );
      }

      // Automatically assign the primary owner as staff
      await this.usersRepository.update(primaryOwnerId, {
        assignedClinicId: clinicId
      });
    }

    // Strip relation fields so TypeORM save() does NOT overwrite
    // the clinic_ownership join table with stale frontend data
    const {
      owners,
      owner,
      services,
      appointments,
      staff,
      ...safeData
    } = baseData as any;

    Object.assign(clinic, safeData);
    // Ensure owners relation is NOT set on the entity before save
    // (prevents TypeORM @ManyToMany sync from reverting our inserts)
    delete (clinic as any).owners;

    const saved = await this.clinicsRepository.save(clinic);

    const finalClinic = await this.clinicsRepository.findOne({
      where: { id: saved.id },
      relations: ['services', 'owner', 'owners'],
    });
    return finalClinic;
  }

  async updateClinicOwnershipForOwner(ownerUserId: string, clinicIds: string[]): Promise<void> {
    await this.clinicOwnershipRepository.delete({ ownerUserId });
    for (const clinicId of clinicIds) {
      await this.clinicOwnershipRepository.save(
        this.clinicOwnershipRepository.create({
          clinicId,
          ownerUserId,
          visibilityScope: 'shared',
        })
      );
    }
  }

  async findByOwnerId(ownerId: string): Promise<Clinic> {
    // 1. Check if user owns a clinic
    const clinic = await this.clinicsRepository.findOne({
      where: { ownerId, isActive: true },
      relations: ['services', 'owner', 'owners'],
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

    // 4. Check mapping table
    const ownership = await this.clinicOwnershipRepository.findOne({
      where: { ownerUserId: ownerId },
    });

    if (ownership) {
      return this.findById(ownership.clinicId);
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

    // 4. Mapping table
    const ownerships = await this.clinicOwnershipRepository.find({
      where: { ownerUserId: ownerId },
    });

    for (const o of ownerships) {
      if (!all.find(c => c.id === o.clinicId)) {
        const c = await this.findById(o.clinicId);
        if (c) all.push(c);
      }
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
    let clinic = null;
    if (staffData.clinicId && (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER)) {
      clinic = await this.findById(staffData.clinicId);
    } else if (role === UserRole.CLINIC_OWNER || role === UserRole.DOCTOR || role === UserRole.SECRETARIAT) {
      clinic = await this.findByOwnerId(ownerId);
    }
    // If Admin/SuperAdmin/Manager doesn't provide clinicId, 'clinic' stays null and we proceed without assignment

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: staffData.email },
    });

    if (existingUser) {
      // If user exists, we update their assignment to the new clinic
      if (clinic) {
        existingUser.assignedClinicId = clinic.id;
        // Also ensure the role is updated if provided
        if (staffData.role) {
          existingUser.role = staffData.role;
        }
        return this.usersRepository.save(existingUser);
      } else if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
        // SuperAdmin might be updating a user's role without changing clinic
        if (staffData.role) {
          existingUser.role = staffData.role;
        }
        return this.usersRepository.save(existingUser);
      }
      
      if (clinic && existingUser.assignedClinicId === clinic.id) {
        throw new BadRequestException('User is already staff at this clinic');
      }
      return existingUser;
    }

    const newUser = this.usersRepository.create({
      ...staffData,
      role: staffData.role || UserRole.DOCTOR,
      assignedClinicId: clinic?.id,
      passwordHash: staffData.password || 'TemporaryPassword123!',
      isActive: true,
    } as any);

    const savedUser = await this.usersRepository.save(newUser);
    return savedUser as unknown as User;
  }

  async removeStaff(ownerId: string, role: string, staffId: string): Promise<void> {
    const clinic = await this.findByOwnerId(ownerId);
    return this.removeStaffById(staffId, clinic.id);
  }

  async removeStaffById(staffId: string, clinicId: string): Promise<void> {
    const staff = await this.usersRepository.findOne({
      where: { id: staffId, assignedClinicId: clinicId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found in this clinic');
    }

    staff.assignedClinicId = null;
    await this.usersRepository.save(staff);
  }

  async getClinicProviders(clinicId: string): Promise<any[]> {
    const uniqueProviders = new Map();

    // 1. Get all users who have the role of doctor, owner or secretariat and are assigned to this clinic
    const assignedStaff = await this.usersRepository.find({
      where: [
        { assignedClinicId: clinicId, role: UserRole.DOCTOR },
        { assignedClinicId: clinicId, role: UserRole.CLINIC_OWNER },
        { assignedClinicId: clinicId, role: UserRole.SECRETARIAT },
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
      imageUrl: serviceData.imageUrl,
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

  async deleteService(ownerId: string, role: string, serviceId: string, clinicId?: string): Promise<void> {
    let clinic;
    if (clinicId && (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER)) {
      clinic = await this.findById(clinicId);
    } else {
      clinic = await this.findByOwnerId(ownerId);
    }

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId, clinicId: clinic.id },
    });

    if (!service) {
      throw new NotFoundException('Service not found for this clinic');
    }

    // Check if there are ANY appointments for this service
    const appointmentCount = await this.appointmentsRepository.count({
      where: { serviceId },
    });

    if (appointmentCount > 0) {
      throw new BadRequestException('Cannot delete a service that has existing appointments. Please deactivate it (Hide) instead to maintain booking history.');
    }

    await this.servicesRepository.remove(service);

    this.eventEmitter.emit('audit.log', {
      userId: ownerId,
      action: 'SERVICE_DELETE',
      resource: 'services',
      resourceId: serviceId,
      data: { clinicId: clinic.id, serviceId },
    });
  }

  private validateServiceForPublishing(service: Service) {
    if (!service.treatment) {
      throw new BadRequestException('Service must be linked to a treatment master record to be active');
    }

    const t = service.treatment;
    const errors: string[] = [];

    // if (!t.categoryId && !t.category) errors.push('category');
    // if (!t.shortDescription) errors.push('short description');
    // if (!t.fullDescription) errors.push('full description');
    // if (!t.imageUrl) errors.push('photo');

    if (errors.length > 0) {
      throw new BadRequestException(
        `This service cannot be published (made active) because the underlying therapy record is incomplete. Missing: ${errors.join(', ')}.`
      );
    }

    // if (t.status !== TreatmentStatus.APPROVED) {
    //   throw new BadRequestException('This therapy is pending admin approval and cannot be published yet.');
    // }
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
    if (updateData.imageUrl !== undefined) service.imageUrl = updateData.imageUrl;
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
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createManualCategory(data: { name: string; description?: string }): Promise<TreatmentCategory> {
    const category = this.categoryRepository.create({
      ...data,
      status: TreatmentStatus.APPROVED,
      isActive: true,
    });
    return this.categoryRepository.save(category);
  }

  async getTreatmentsByCategory(categoryId: string): Promise<Treatment[]> {
    return this.treatmentsRepository.find({
      where: { categoryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Public, two-level category tree. Returns top-level (parentId IS NULL)
   * approved+active categories, each with its approved+active `children`
   * (subcategories) nested under it. When `includeInactive` is true (admin),
   * status/active filters are dropped so the catalog can manage everything.
   * When `withTreatments` is true, each node also gets a `treatments` array of
   * its own approved+active treatments (one extra query, no per-node fetch).
   */
  async getCategoryTree(includeInactive = false, withTreatments = false): Promise<TreatmentCategory[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
      where.status = TreatmentStatus.APPROVED;
    }
    const all = await this.categoryRepository.find({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    const byId = new Map<string, TreatmentCategory & { children: TreatmentCategory[] }>();
    all.forEach((c) => byId.set(c.id, Object.assign(c, { children: [], treatments: [] })));

    if (withTreatments) {
      const tWhere: any = {};
      if (!includeInactive) {
        tWhere.isActive = true;
        tWhere.status = TreatmentStatus.APPROVED;
      }
      const treatments = await this.treatmentsRepository.find({
        where: tWhere,
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
      treatments.forEach((t) => {
        if (t.categoryId && byId.has(t.categoryId)) {
          byId.get(t.categoryId)!.treatments.push(t);
        }
      });
    }

    const roots: TreatmentCategory[] = [];
    for (const cat of byId.values()) {
      if (cat.parentId) {
        // Only nest under a visible parent; drop orphans (parent hidden) rather
        // than promoting them to top-level and leaking a hidden subcategory.
        if (byId.has(cat.parentId)) byId.get(cat.parentId)!.children.push(cat);
      } else {
        roots.push(cat);
      }
    }
    return roots;
  }

  /**
   * Public: approved + active treatments for a category/subcategory node.
   * For a top-level category this also includes treatments that live in its
   * subcategories, so the parent surfaces everything beneath it.
   */
  async getPublicTreatmentsByCategory(categoryId: string): Promise<Treatment[]> {
    const children = await this.categoryRepository.find({ where: { parentId: categoryId }, select: ['id'] });
    const categoryIds = [categoryId, ...children.map((c) => c.id)];
    return this.treatmentsRepository.find({
      where: { categoryId: In(categoryIds), isActive: true, status: TreatmentStatus.APPROVED },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /** Public: super-admin-curated "Top Treatments". */
  async getFeaturedTreatments(limit = 12): Promise<Treatment[]> {
    return this.treatmentsRepository.find({
      where: { isFeatured: true, isActive: true, status: TreatmentStatus.APPROVED },
      relations: ['categoryRef'],
      order: { sortOrder: 'ASC', name: 'ASC' },
      take: limit,
    });
  }

  async createManualTreatment(data: {
    name: string;
    categoryId: string;
    shortDescription?: string;
    fullDescription?: string;
    imageUrl?: string;
  }): Promise<Treatment> {
    const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const treatment = this.treatmentsRepository.create({
      ...data,
      status: TreatmentStatus.APPROVED,
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

  /**
   * Validates a candidate parentId for a category. Enforces a strict two-level
   * tree: the parent must exist, must itself be top-level (no parentId), and a
   * category may not be its own parent. Returns the normalised parentId (null
   * clears it, making the category top-level).
   */
  private async resolveParentId(categoryId: string | null, parentId?: string | null): Promise<string | null> {
    if (parentId === undefined) return undefined as any; // caller didn't touch it
    if (!parentId) return null; // explicit clear -> top-level
    if (parentId === categoryId) {
      throw new BadRequestException('A category cannot be its own parent');
    }
    const parent = await this.categoryRepository.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent category not found');
    if (parent.parentId) {
      throw new BadRequestException('Categories can only be nested one level deep (a subcategory cannot have subcategories)');
    }
    return parentId;
  }

  async updateCategory(id: string, data: any): Promise<TreatmentCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    if ('parentId' in data) {
      const resolved = await this.resolveParentId(id, data.parentId);
      // If this category already has children, it cannot become a subcategory.
      if (resolved) {
        const childCount = await this.categoryRepository.count({ where: { parentId: id } });
        if (childCount > 0) {
          throw new BadRequestException('This category has subcategories and cannot be moved under another category');
        }
      }
      data.parentId = resolved;
    }

    const renamedFrom = data.name && data.name !== category.name ? category.name : null;

    Object.assign(category, data);
    const saved = await this.categoryRepository.save(category);

    // Keep the denormalised legacy `treatment.category` string in sync on rename,
    // otherwise treatments stay searchable only under the old name.
    if (renamedFrom) {
      await this.treatmentsRepository.update({ categoryId: id }, { category: saved.name });
    }

    return saved;
  }

  async deleteCategory(id: string): Promise<{ deleted: boolean; unmappedTreatments: number }> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    // Deleting a top-level category also removes its subcategories. Across the
    // whole subtree we detach connected treatments instead of blocking deletion:
    // they become uncategorised (FK `categoryId` and legacy `category` string
    // both cleared) so an admin can re-map them to another category afterwards.
    const children = await this.categoryRepository.find({ where: { parentId: id }, select: ['id'] });
    const subtreeIds = [id, ...children.map((c) => c.id)];

    return this.categoryRepository.manager.transaction(async (manager) => {
      const result = await manager.createQueryBuilder()
        .update(Treatment)
        .set({ categoryId: null, category: null })
        .where('categoryId IN (:...subtreeIds)', { subtreeIds })
        .execute();

      // Deleting the parent cascades to children via FK ON DELETE CASCADE, but we
      // delete the explicit list to keep the count deterministic regardless of order.
      await manager.createQueryBuilder()
        .delete()
        .from(TreatmentCategory)
        .where('id IN (:...subtreeIds)', { subtreeIds })
        .execute();

      return { deleted: true, unmappedTreatments: result.affected || 0 };
    });
  }

  async getAllTreatmentsMaster(query?: { search?: string; status?: TreatmentStatus; categoryId?: string; isFeatured?: boolean }): Promise<Treatment[]> {
    const qb = this.treatmentsRepository.createQueryBuilder('treatment')
      .leftJoinAndSelect('treatment.categoryRef', 'category')
      .leftJoinAndSelect('treatment.offerings', 'offerings')
      .leftJoinAndSelect('offerings.clinic', 'clinic');

    if (query?.search) {
      qb.andWhere('(treatment.name ILIKE :search OR treatment.shortDescription ILIKE :search)', { search: `%${query.search}%` });
    }
    if (query?.status) {
      qb.andWhere('treatment.status = :status', { status: query.status });
    }
    if (query?.categoryId) {
      qb.andWhere('treatment.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query?.isFeatured !== undefined) {
      qb.andWhere('treatment.isFeatured = :isFeatured', { isFeatured: query.isFeatured });
    }

    qb.orderBy('treatment.sortOrder', 'ASC').addOrderBy('treatment.name', 'ASC');
    return qb.getMany();
  }

  async updateTreatment(id: string, data: any): Promise<Treatment> {
    const treatment = await this.treatmentsRepository.findOne({ where: { id } });
    if (!treatment) throw new NotFoundException('Treatment not found');

    const { clinicIds, ...treatmentData } = data;

    if (treatmentData.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: treatmentData.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      treatment.category = category.name;
    }

    Object.assign(treatment, treatmentData);
    const savedTreatment = await this.treatmentsRepository.save(treatment);

    if (clinicIds !== undefined) {
      const existingServices = await this.servicesRepository.find({
        where: { treatmentId: id },
      });

      // 1. Create or reactivate services for new clinicIds
      for (const clinicId of clinicIds) {
        const existing = existingServices.find(s => s.clinicId === clinicId);
        if (!existing) {
          const newService = this.servicesRepository.create({
            clinicId,
            treatmentId: id,
            price: 0,
            durationMinutes: 30,
            isActive: true,
          });
          await this.servicesRepository.save(newService);
        } else if (!existing.isActive) {
          existing.isActive = true;
          await this.servicesRepository.save(existing);
        }
      }

      // 2. Remove or deactivate services not in the new list
      for (const existingService of existingServices) {
        if (!clinicIds.includes(existingService.clinicId)) {
          const appointmentCount = await this.appointmentsRepository.count({
            where: { serviceId: existingService.id },
          });

          if (appointmentCount > 0) {
            existingService.isActive = false;
            await this.servicesRepository.save(existingService);
          } else {
            await this.servicesRepository.remove(existingService);
          }
        }
      }
    }

    return savedTreatment;
  }

  async deleteTreatment(id: string): Promise<void> {
    const offerings = await this.servicesRepository.find({ where: { treatmentId: id } });
    
    if (offerings.length > 0) {
      const serviceIds = offerings.map(o => o.id);
      const appointmentCount = await this.appointmentsRepository.count({
        where: { serviceId: In(serviceIds) }
      });
      
      if (appointmentCount > 0) {
        // Safe archiving/soft-deletion to preserve medical/financial historical data
        await this.treatmentsRepository.update(id, { isActive: false });
        for (const offering of offerings) {
          offering.isActive = false;
          await this.servicesRepository.save(offering);
        }
        return;
      }
      
      // Safely delete associated offerings since they have no bookings
      await this.servicesRepository.remove(offerings);
    }
    
    await this.treatmentsRepository.delete(id);
  }

  async createMasterTreatment(data: any): Promise<Treatment> {
    const category = await this.categoryRepository.findOne({ where: { id: data.categoryId as any } });
    if (!category) throw new NotFoundException('Category not found');

    const { clinicIds, ...treatmentData } = data;

    const treatment = this.treatmentsRepository.create({
      ...treatmentData,
      status: TreatmentStatus.APPROVED,
      category: category.name,
      isActive: true,
    } as DeepPartial<Treatment>) as unknown as Treatment;
    
    const savedTreatment = await this.treatmentsRepository.save(treatment);

    if (clinicIds && clinicIds.length > 0) {
      for (const clinicId of clinicIds) {
        const service = this.servicesRepository.create({
          clinicId,
          treatmentId: savedTreatment.id,
          price: 0,
          durationMinutes: 30,
          isActive: true,
        });
        await this.servicesRepository.save(service);
      }
    }

    return savedTreatment;
  }

  async createMasterCategory(data: DeepPartial<TreatmentCategory>): Promise<TreatmentCategory> {
    const parentId = await this.resolveParentId(null, (data as any).parentId);
    const category = this.categoryRepository.create({
      ...data,
      parentId: parentId ?? null,
      status: TreatmentStatus.APPROVED,
      isActive: true,
    } as DeepPartial<TreatmentCategory>) as unknown as TreatmentCategory;
    return await this.categoryRepository.save(category);
  }


  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 1) return [];

    const searchTerm = `%${query}%`;

    try {
      // 1. Search in treatments that have active services
      const servicesWithTreatments = await this.servicesRepository
        .createQueryBuilder('s')
        .innerJoinAndSelect('s.treatment', 't')
        .leftJoinAndSelect('t.categoryRef', 'c')
        .where('s.isActive = :isActive', { isActive: true })
        .andWhere('(t.name ILIKE :term OR t.category ILIKE :term OR c.name ILIKE :term)', { term: searchTerm })
        .limit(20)
        .getMany();

      const combined = new Set<string>();

      servicesWithTreatments.forEach((s) => {
        if (s.treatment?.name) combined.add(s.treatment.name);
        if (s.treatment?.category) combined.add(s.treatment.category);
        if (s.treatment?.categoryRef?.name) combined.add(s.treatment.categoryRef.name);
      });

      // 2. Fallback search directly in treatments
      const directTreatments = await this.treatmentsRepository
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.categoryRef', 'c')
        .where('t.status = :status', { status: TreatmentStatus.APPROVED })
        .andWhere('(t.name ILIKE :term OR t.category ILIKE :term OR c.name ILIKE :term)', { term: searchTerm })
        .limit(10)
        .getMany();

      directTreatments.forEach((t) => {
        if (t.name) combined.add(t.name);
        if (t.category) combined.add(t.category);
        if (t.categoryRef?.name) combined.add(t.categoryRef.name);
      });

      return Array.from(combined).slice(0, 15);
    } catch (error) {
      console.error('getSuggestions error:', error);
      return [];
    }
  }
}