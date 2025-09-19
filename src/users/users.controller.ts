import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UsePipes,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  CreateUserSchema,
  ListUsersQuery,
  ListUsersQuerySchema,
} from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserSchema } from './dto/update-user.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  create(createUserDto: CreateUserDto, req: any) {
    return this.usersService.create(createUserDto, req.user.uid);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(ListUsersQuerySchema)) query: ListUsersQuery,
  ) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMyProfile(req: any) {
    return this.usersService.getMyProfile(req.user.uid);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  updateMyProfile(updateUserDto: UpdateUserDto, req: any) {
    return this.usersService.updateMyProfile(req.user.uid, updateUserDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  update(@Param('id') id: string, updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Get('by-tag/:tag')
  findByTag(@Param('tag') tag: string) {
    return this.usersService.findByTag(tag);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
