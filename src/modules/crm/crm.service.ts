import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from '../../common/enums/lead-status.enum';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadsRepository.create(createLeadDto);
    const savedLead = await this.leadsRepository.save(lead);

    // Emit event for notifications and task creation
    this.eventEmitter.emit('lead.created', savedLead);

    return savedLead;
  }

  async findAll(filters: any = {}): Promise<Lead[]> {
    const queryBuilder = this.leadsRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedSales', 'sales')
      .leftJoinAndSelect('lead.tags', 'tags');

    if (filters.status) {
      queryBuilder.where('lead.status = :status', { status: filters.status });
    }

    if (filters.assignedSalesId) {
      queryBuilder.andWhere('lead.assignedSalesId = :assignedSalesId', {
        assignedSalesId: filters.assignedSalesId,
      });
    }

    if (filters.source) {
      queryBuilder.andWhere('lead.source = :source', { source: filters.source });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id },
      relations: ['assignedSales', 'tags', 'tasks'],
    });
    
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    
    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findById(id);
    
    // Check for status changes
    if (updateLeadDto.status && updateLeadDto.status !== lead.status) {
      if (updateLeadDto.status === LeadStatus.CONVERTED) {
        updateLeadDto['convertedAt'] = new Date();
      }
      
      this.eventEmitter.emit('lead.status.changed', {
        lead,
        oldStatus: lead.status,
        newStatus: updateLeadDto.status,
      });
    }

    await this.leadsRepository.update(id, updateLeadDto);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.leadsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Lead not found');
    }
  }

  async updateLastContacted(id: string): Promise<void> {
    await this.leadsRepository.update(id, { lastContactedAt: new Date() });
  }
}