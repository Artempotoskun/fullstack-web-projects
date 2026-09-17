import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('me') me(@CurrentUser() user: AuthUser) { return this.users.me(user.id); }
  @Patch('me') update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) { return this.users.update(user.id, dto); }
  @Roles(Role.ADMIN) @Get() list() { return this.users.list(); }
}
