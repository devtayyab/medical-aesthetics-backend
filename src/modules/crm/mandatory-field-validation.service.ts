import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities/crm-action.entity';

export interface RequiredFields {
  clinic: boolean;
  proposedTreatment: boolean;
  cost: boolean;
  callOutcome: boolean;
  notes?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

@Injectable()
export class MandatoryFieldValidationService {
  constructor(
    @InjectRepository(CommunicationLog)
    private communicationLogsRepository: Repository<CommunicationLog>,
    @InjectRepository(CrmAction)
    private crmActionsRepository: Repository<CrmAction>,
  ) {}

  validateCommunicationFields(
    customerId: string,
    communicationData: Partial<CommunicationLog>,
  ): ValidationResult {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // For call communications, these fields are mandatory
    if (communicationData.type === 'call') {
      if (!communicationData.metadata?.clinic) {
        missingFields.push('clinic');
      }

      if (!communicationData.metadata?.proposedTreatment) {
        missingFields.push('proposedTreatment');
      }

      if (!communicationData.metadata?.cost && communicationData.metadata?.cost !== 0) {
        missingFields.push('cost');
      }

      if (!communicationData.metadata?.callOutcome) {
        missingFields.push('callOutcome');
      }

      // Warnings for incomplete data
      if (!communicationData.durationSeconds) {
        warnings.push('Call duration not recorded');
      }

      if (!communicationData.notes || communicationData.notes.trim().length < 10) {
        warnings.push('Call notes are too brief or missing');
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  validateActionFields(
    customerId: string,
    actionData: Partial<CrmAction>,
  ): ValidationResult {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // For phone call actions, ensure required fields are present
    if (actionData.actionType === 'phone_call') {
      if (!actionData.metadata?.clinic) {
        missingFields.push('clinic');
      }

      if (!actionData.metadata?.proposedTreatment) {
        missingFields.push('proposedTreatment');
      }

      if (!actionData.metadata?.callOutcome) {
        missingFields.push('callOutcome');
      }

      // Warnings for missing optional but recommended fields
      if (!actionData.metadata?.cost && actionData.metadata?.cost !== 0) {
        warnings.push('Cost information missing');
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  async validateCustomerCardCompletion(customerId: string): Promise<ValidationResult> {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Get recent communications and actions for this customer
    const recentCommunications = await this.communicationLogsRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentActions = await this.crmActionsRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Check if there are any incomplete call records
    const incompleteCalls = recentCommunications.filter(
      (comm) =>
        comm.type === 'call' &&
        (!comm.metadata?.callOutcome ||
         !comm.metadata?.clinic ||
         !comm.metadata?.proposedTreatment),
    );

    if (incompleteCalls.length > 0) {
      missingFields.push('incompleteCallRecords');
      warnings.push(`${incompleteCalls.length} recent calls have missing required information`);
    }

    // Check for pending actions without proper follow-up
    const pendingActions = recentActions.filter(
      (action) =>
        action.status === 'pending' &&
        action.actionType === 'follow_up' &&
        (!action.metadata?.clinic || !action.metadata?.proposedTreatment),
    );

    if (pendingActions.length > 0) {
      missingFields.push('pendingActionsIncomplete');
      warnings.push(`${pendingActions.length} pending actions have missing required information`);
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  async enforceFieldCompletion(
    customerId: string,
    communicationData: Partial<CommunicationLog>,
  ): Promise<void> {
    const validation = this.validateCommunicationFields(customerId, communicationData);

    if (!validation.isValid) {
      throw new BadRequestException(
        `Cannot save communication: Missing required fields: ${validation.missingFields.join(', ')}. ${validation.warnings.join('. ')}`,
      );
    }

    if (validation.warnings.length > 0) {
      // Log warnings but don't prevent saving
      console.warn(`Communication saved with warnings for customer ${customerId}:`, validation.warnings);
    }
  }

  async enforceActionCompletion(
    customerId: string,
    actionData: Partial<CrmAction>,
  ): Promise<void> {
    const validation = this.validateActionFields(customerId, actionData);

    if (!validation.isValid) {
      throw new BadRequestException(
        `Cannot save action: Missing required fields: ${validation.missingFields.join(', ')}. ${validation.warnings.join('. ')}`,
      );
    }

    if (validation.warnings.length > 0) {
      // Log warnings but don't prevent saving
      console.warn(`Action saved with warnings for customer ${customerId}:`, validation.warnings);
    }
  }

  getRequiredFieldsForCall(): RequiredFields {
    return {
      clinic: true,
      proposedTreatment: true,
      cost: true,
      callOutcome: true,
      notes: false, // Optional but recommended
    };
  }

  getRequiredFieldsForAction(actionType: string): RequiredFields {
    switch (actionType) {
      case 'phone_call':
        return {
          clinic: true,
          proposedTreatment: true,
          cost: false, // Optional for actions
          callOutcome: true,
          notes: false,
        };
      case 'follow_up':
        return {
          clinic: false,
          proposedTreatment: false,
          cost: false,
          callOutcome: false,
          notes: true,
        };
      default:
        return {
          clinic: false,
          proposedTreatment: false,
          cost: false,
          callOutcome: false,
          notes: false,
        };
    }
  }
}
