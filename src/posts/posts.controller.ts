import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, CreatePostSchema, ListPostsQuery, ListPostsQuerySchema } from './dto/create-post.dto';
import { UpdatePostDto, UpdatePostSchema } from './dto/update-post.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(CreatePostSchema))
  async create(@Body() createPostDto: CreatePostDto, @Request() req: any) {
    const authorName = req.user.name || 'Usuário'
    return this.postsService.create(createPostDto, req.user.uid, authorName)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(ListPostsQuerySchema)) query: ListPostsQuery) {
    return this.postsService.findAll(query)
  }

  @Get('my-posts')
  @UseGuards(AuthGuard)
  getMyPosts(
    @Request() req: any,
    @Query(new ZodValidationPipe(ListPostsQuerySchema)) query: ListPostsQuery,
  ) {
    return this.postsService.getMyPosts(req.user.uid, query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updatePostDto: any) {
    const validationResult = UpdatePostSchema.safeParse(updatePostDto)
    if (!validationResult.success) {
      const flat = validationResult.error.flatten()
      throw new BadRequestException({
        message: 'Validation failed',
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
      })
    }

    return this.postsService.update(id, validationResult.data)
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.postsService.remove(id)
  }

  @Delete('my-posts/:id')
  @UseGuards(AuthGuard)
  removeMyPost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.removeMyPost(id, req.user.uid)
  }
}
