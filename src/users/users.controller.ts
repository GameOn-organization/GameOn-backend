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
  Body,
  Request,
  BadRequestException,
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
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
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
  getMyProfile(@Request() req: any) {
    return this.usersService.getMyProfile(req.user.uid);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  updateMyProfile(@Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.updateMyProfile(req.user.uid, updateUserDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    // Validação manual usando o schema Zod
    const validationResult = UpdateUserSchema.safeParse(updateUserDto);
    if (!validationResult.success) {
      const flat = validationResult.error.flatten();
      throw new BadRequestException({
        message: 'Validation failed',
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
      });
    }
    
    return this.usersService.update(id, validationResult.data);
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

  @Get('debug/:id')
  async debugUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    console.log('Debug user data:', JSON.stringify(user, null, 2));
    return user;
  }
}
