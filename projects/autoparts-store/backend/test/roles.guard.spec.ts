import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('RolesGuard', () => {
  const context = (role?: Role) => ({
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  }) as unknown as ExecutionContext;

  it('allows matching roles', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context(Role.ADMIN))).toBe(true);
  });

  it('blocks a user role from admin endpoints', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context(Role.USER))).toBe(false);
  });
});
