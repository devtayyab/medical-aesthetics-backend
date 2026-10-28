import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AccountLinksService } from './account-links.service';

export const USER_CREATED_BY_STAFF_EVENT = 'user.created_by_staff';

export interface UserCreatedByStaffPayload {
  userId: string;
}

/**
 * A salesperson, doctor or admin created a client with the client's REAL email (item 18).
 * Send exactly one set-password link; the client later logs in (or "registers" with the same
 * email, which claims this account instead of creating a second one).
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
      const user = await this.usersRepository.findOne({ where: { id: payload.userId } });
      if (!user?.email || !user.accountSetupPending || !user.isActive) return;
      await this.accountLinks.sendSetPasswordLink(user, 'client');
    } catch (err: any) {
      this.logger.error(`Failed to send set-password link for user ${payload.userId}: ${err?.message}`);
    }
  }
}
