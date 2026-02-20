import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingCustomer?: User;
  existingLead?: Lead;
  confidence: number; // 0-1, how confident we are this is a duplicate
  matchReason: string[];
}

export interface DuplicateMergeResult {
  success: boolean;
  mergedIntoCustomer?: User;
  mergedIntoLead?: Lead;
  createdNew: boolean;
  message: string;
}

@Injectable()
export class DuplicateDetectionService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(CustomerRecord)
    private customerRecordsRepository: Repository<CustomerRecord>,
  ) { }

  async checkForDuplicates(
    email?: string,
    phone?: string,
    firstName?: string,
    lastName?: string,
  ): Promise<DuplicateCheckResult> {
    const matchReasons: string[] = [];
    let confidence = 0;
    let existingCustomer: User | undefined;
    let existingLead: Lead | undefined;

    // Check for exact email match (highest confidence)
    if (email) {
      existingCustomer = await this.usersRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingCustomer) {
        matchReasons.push('Email match');
        confidence += 0.9;
      }
    }

    // Check for phone match
    if (phone && !existingCustomer) {
      existingCustomer = await this.usersRepository.findOne({
        where: { phone },
      });

      if (existingCustomer) {
        matchReasons.push('Phone match');
        confidence += 0.8;
      }
    }

    // Check for name similarity if no exact matches
    if (!existingCustomer && firstName && lastName) {
      const similarCustomers = await this.findSimilarCustomers(firstName, lastName);
      if (similarCustomers.length > 0) {
        existingCustomer = similarCustomers[0];
        matchReasons.push('Name similarity');
        confidence += 0.3;
      }
    }

    // Check for existing leads if no customer match
    if (!existingCustomer) {
      if (email) {
        existingLead = await this.leadsRepository.findOne({
          where: { email: email.toLowerCase() },
        });

        if (existingLead) {
          matchReasons.push('Lead email match');
          confidence += 0.7;
        }
      }

      if (phone && !existingLead) {
        existingLead = await this.leadsRepository.findOne({
          where: { phone },
        });

        if (existingLead) {
          matchReasons.push('Lead phone match');
          confidence += 0.6;
        }
      }
    }

    return {
      isDuplicate: confidence > 0.5,
      existingCustomer,
      existingLead,
      confidence,
      matchReason: matchReasons,
    };
  }

  async mergeLeadIntoCustomer(
    lead: Lead,
    existingCustomer: User,
  ): Promise<DuplicateMergeResult> {
    try {
      // Update customer record with lead information
      await this.customerRecordsRepository.update(
        { customerId: existingCustomer.id },
        {
          lastContactDate: new Date(),
          notes: `Merged lead from ${lead.source}: ${lead.notes || 'No notes'}`,
        },
      );

      // Update lead to mark as merged
      await this.leadsRepository.update(lead.id, {
        status: LeadStatus.Merged,
        metadata: {
          ...lead.metadata,
          mergedIntoCustomerId: existingCustomer.id,
          mergedAt: new Date(),
        },
      });

      return {
        success: true,
        mergedIntoCustomer: existingCustomer,
        createdNew: false,
        message: `Lead merged into existing customer ${existingCustomer.firstName} ${existingCustomer.lastName}`,
      };
    } catch (error) {
      throw new ConflictException(`Failed to merge lead: ${error.message}`);
    }
  }

  async createCustomerFromLead(lead: Lead): Promise<User> {
    // Create new user from lead data
    const newUser = this.usersRepository.create({
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      role: UserRole.CLIENT,
      isActive: true,
    });

    const savedUser = await this.usersRepository.save(newUser);

    // Create customer record
    const customerRecord = this.customerRecordsRepository.create({
      customerId: savedUser.id,
      assignedSalespersonId: lead.assignedSalesId,
      customerStatus: 'new',
      notes: `Created from ${lead.source} lead`,
    });

    await this.customerRecordsRepository.save(customerRecord);

    // Update lead to link to new customer
    await this.leadsRepository.update(lead.id, {
      status: LeadStatus.CONVERTED,
      metadata: {
        ...lead.metadata,
        convertedToCustomerId: savedUser.id,
        convertedAt: new Date(),
      },
    });

    return savedUser;
  }

  private async findSimilarCustomers(
    firstName: string,
    lastName: string,
  ): Promise<User[]> {
    // Use fuzzy matching for names
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.firstName ILIKE :firstNamePattern', {
        firstNamePattern: `%${firstName}%`,
      })
      .orWhere('user.lastName ILIKE :lastNamePattern', {
        lastNamePattern: `%${lastName}%`,
      })
      .orWhere('user.lastName ILIKE :lastNamePattern', {
        lastNamePattern: `%${lastName}%`,
      })
      .limit(5);

    return query.getMany();
  }

  async getDuplicateSuggestions(
    email?: string,
    phone?: string,
    firstName?: string,
    lastName?: string,
  ): Promise<Array<{ customer: User; confidence: number; reasons: string[] }>> {
    const suggestions: Array<{ customer: User; confidence: number; reasons: string[] }> = [];

    if (!email && !phone && (!firstName || !lastName)) {
      return suggestions;
    }

    // Get potential matches
    const query = this.usersRepository.createQueryBuilder('user');

    if (email) {
      query.orWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (phone) {
      query.orWhere('user.phone ILIKE :phone', { phone: `%${phone}%` });
    }

    if (firstName && lastName) {
      query.orWhere(
        '(user.firstName ILIKE :firstNamePattern AND user.lastName ILIKE :lastNamePattern)',
        {
          firstNamePattern: `%${firstName}%`,
          lastNamePattern: `%${lastName}%`,
        },
      );
    }

    const potentialMatches = await query.getMany();

    for (const customer of potentialMatches) {
      const reasons: string[] = [];
      let confidence = 0;

      if (email && customer.email.toLowerCase().includes(email.toLowerCase())) {
        reasons.push('Email similarity');
        confidence += 0.3;
      }

      if (phone && customer.phone?.includes(phone)) {
        reasons.push('Phone similarity');
        confidence += 0.3;
      }

      if (firstName && lastName) {
        if (
          customer.firstName.toLowerCase().includes(firstName.toLowerCase()) ||
          customer.lastName.toLowerCase().includes(lastName.toLowerCase())
        ) {
          reasons.push('Name similarity');
          confidence += 0.2;
        }
      }

      if (confidence > 0.1) {
        suggestions.push({ customer, confidence, reasons });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}
