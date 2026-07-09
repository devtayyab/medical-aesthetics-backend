import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO for a user editing their OWN profile.
 * Omits privileged fields (password, role, clinic assignment) so they can never be
 * mass-assigned via PATCH /users/me/profile. Combined with the global ValidationPipe
 * `whitelist: true`, any of these fields sent by a client are stripped before persistence.
 */
export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, [
    'password',
    'role',
    'assignedClinicId',
    'assignedClinicIds',
  ] as const),
) {}
