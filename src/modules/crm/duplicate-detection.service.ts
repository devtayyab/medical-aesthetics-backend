import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { phoneMatchKey, phoneKeySql } from '../../common/utils/phone.util';

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

  /**
   * Multi-tier duplicate detection scoring:
   * 1. Exact Email Match -> High confidence (+0.9).
   * 2. Phone Match -> Medium/High (+0.8), guarding against shared lines by verifying name overlap.
   * 3. Fuzzy Name Similarity -> Low confidence (+0.3).
   * 4. Lead-level matching if no existing customer match found.
   */
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
    const phoneKey = phoneMatchKey(phone);
    const cleanEmail = email && email.trim() ? email.trim() : '';

    // Only client accounts can be "the same customer"; staff/doctor accounts
    // must never absorb a lead.
    const clientQuery = () =>
      this.usersRepository.createQueryBuilder('u').where('u.role = :clientRole', { clientRole: UserRole.CLIENT });

    // Check for exact email match (highest confidence). Case-insensitive so a submission of
    // "jane@x.com" still matches a stored "Jane@X.com" (records are not lowercased on write).
    if (cleanEmail) {
      existingCustomer = await clientQuery()
        .andWhere('LOWER(u.email) = LOWER(:email)', { email: cleanEmail })
        .getOne() || undefined;

      if (existingCustomer) {
        matchReasons.push('Email match');
        confidence += 0.9;
      }
    }

    // A phone number can be shared (couples, families, office lines), so a
    // phone-only match with a clearly different name must not absorb the record
    const nameConflicts = (record: { firstName?: string; lastName?: string }): boolean => {
      if (!firstName || !record?.firstName) return false; // nothing to compare
      const a = `${firstName} ${lastName || ''}`.trim().toLowerCase();
      const b = `${record.firstName} ${record.lastName || ''}`.trim().toLowerCase();
      return a !== b && !a.includes(b) && !b.includes(a);
    };

    // Phone match on the normalised number ("+30 694..." == "694...")
    if (phoneKey && !existingCustomer) {
      const phoneCustomer = await clientQuery()
        .andWhere(`${phoneKeySql('u.phone')} = :phoneKey`, { phoneKey })
        .orderBy('u.createdAt', 'ASC')
        .getOne();

      if (phoneCustomer) {
        if (nameConflicts(phoneCustomer)) {
          matchReasons.push('Phone match (different name — not treated as duplicate)');
          confidence += 0.4;
        } else {
          existingCustomer = phoneCustomer;
          matchReasons.push('Phone match');
          confidence += 0.8;
        }
      }
    }

    // Name similarity alone is only a hint for the UI; it never makes a record
    // "the same person" (it used to hide the real lead match below).
    if (!existingCustomer && firstName && lastName) {
      const similarCustomers = await this.findSimilarCustomers(firstName, lastName);
      if (similarCustomers.length > 0) {
        matchReasons.push('Name similarity');
      }
    }

    // The lead (CRM card) is looked up even when a client account matched, so a
    // re-submission lands in the history of the existing card
    if (cleanEmail) {
      existingLead = await this.leadsRepository
        .createQueryBuilder('l')
        .where('LOWER(l.email) = LOWER(:email)', { email: cleanEmail })
        .andWhere('l.status != :merged', { merged: LeadStatus.Merged })
        .orderBy('COALESCE(l.lastMetaFormSubmittedAt, l.createdAt)', 'DESC')
        .getOne() || undefined;

      if (existingLead) {
        matchReasons.push('Lead email match');
        confidence += 0.7;
      }
    }

    if (phoneKey && !existingLead) {
      const phoneLead = await this.leadsRepository
        .createQueryBuilder('l')
        .where(`${phoneKeySql('l.phone')} = :phoneKey`, { phoneKey })
        .andWhere('l.status != :merged', { merged: LeadStatus.Merged })
        .orderBy('COALESCE(l.lastMetaFormSubmittedAt, l.createdAt)', 'DESC')
        .getOne();

      if (phoneLead) {
        if (nameConflicts(phoneLead)) {
          matchReasons.push('Lead phone match (different name — not treated as duplicate)');
          confidence += 0.4;
        } else {
          existingLead = phoneLead;
          matchReasons.push('Lead phone match');
          confidence += 0.6;
        }
      }
    }

    // A lead explicitly linked to the matched client account is the same card
    if (existingCustomer && !existingLead) {
      existingLead = await this.leadsRepository
        .createQueryBuilder('l')
        .where(
          `(l.metadata::jsonb ->> 'convertedToUserId' = :uid OR l.metadata::jsonb ->> 'convertedToCustomerId' = :uid OR l.metadata::jsonb ->> 'existingCustomerId' = :uid)`,
          { uid: existingCustomer.id },
        )
        .andWhere('l.status != :merged', { merged: LeadStatus.Merged })
        .orderBy('COALESCE(l.lastMetaFormSubmittedAt, l.createdAt)', 'DESC')
        .getOne() || undefined;
      if (existingLead) matchReasons.push('Lead linked to customer');
    }

    return {
      // A duplicate verdict must always carry the matched record — confidence
      // accumulated from rejected (name-conflicting) matches alone doesn't count
      isDuplicate: confidence > 0.5 && !!(existingCustomer || existingLead),
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
