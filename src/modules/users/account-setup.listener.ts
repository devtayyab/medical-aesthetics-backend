import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AccountLinksService } from './account-links.service';

export const USER_CREATED_BY_STAFF_EVENT = 'user.created_by_staff';

export interface UserCreatedByStaffPayload {
  userId: string;
  /** Must be explicitly true (e.g. staff checked "Send Invitation to Customer" or client self-booked). */
  explicitlyRequested?: boolean;
  appointmentDate?: string;
  clinicName?: string;
  clinicPhone?: string;
  disableNotifications?: boolean;
}

/**
 * Sends the one-time Greek "Set your password" invitation link ONLY when explicitly requested
 * (never automatically when staff creates a customer account during manual booking).
 */
@Injectable()
export class AccountSetupListener {
  private readonly logger = new Logger(AccountSetupListener.name);

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly accountLinks: AccountLinksService,
  ) {}

  @OnEvent(USER_CREATED_BY_STAFF_EVENT, { async: true })
  async handle(payload: UserCreatedByStaffPayload) {
    try {
      if (!payload?.explicitlyRequested) return;
      if (payload.disableNotifications) return;

      const user = await this.usersRepository.findOne({ where: { id: payload.userId } });
      if (!user?.email || !user.isActive) return;

      await this.accountLinks.sendSetPasswordLink(user, 'client', {
        appointmentDate: payload.appointmentDate,
        clinicName: payload.clinicName,
        clinicPhone: payload.clinicPhone,
        disableNotifications: payload.disableNotifications,
      });
    } catch (err: any) {
      this.logger.error(`Failed to send set-password link for user ${payload?.userId}: ${err?.message}`);
    }
  }
}
