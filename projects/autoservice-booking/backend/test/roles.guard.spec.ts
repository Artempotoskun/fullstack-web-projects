import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('RolesGuard', () => {
  it('denies a USER when an ADMIN role is required', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]) } as unknown as Reflector;
    const context = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => ({ user: { role: Role.USER } }) }) } as unknown as ExecutionContext;
    expect(new RolesGuard(reflector).canActivate(context)).toBe(false);
  });
});
