import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log("requiredRoles", requiredRoles);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Super admins can bypass role checks
    const userRole = user?.role?.toString().toUpperCase();
    if (userRole === 'SUPER_ADMIN') {
      console.log(`RolesGuard: SUPER_ADMIN bypass granted for user ${user?.id}`);
      return true;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => {
      const targetRole = role?.toString().toLowerCase();
      const currentUserRole = user?.role?.toString().toLowerCase();
      return currentUserRole === targetRole;
    });

    console.log(`RolesGuard: userRole=${user?.role}, requiredRoles=${requiredRoles.join(',')}, hasRole=${hasRole}`);

    return hasRole;
  }
}