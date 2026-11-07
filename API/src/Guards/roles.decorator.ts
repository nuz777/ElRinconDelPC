import { SetMetadata } from '@nestjs/common';
import { Role } from '../Auth/Domain/Entities/roles.enum.js';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: (Role | `${Role}`)[]) =>
  SetMetadata(ROLES_KEY, roles);
