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
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  CreateCommentSchema,
  ListCommentsQuery,
  ListCommentsQuerySchema,
  UpdateCommentDto,
  UpdateCommentSchema,
} from './dto/comment.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(CreateCommentSchema))
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req: any) {
    const authorName = req.user.name || 'Usuário';
    return this.commentsService.create(
      createCommentDto,
      String(req.user.uid),
      authorName,
    );
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(ListCommentsQuerySchema))
    query: ListCommentsQuery,
  ) {
    return this.commentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: any,
    @Request() req: any,
  ) {
    const validationResult = UpdateCommentSchema.safeParse(updateCommentDto);
    if (!validationResult.success) {
      const flat = validationResult.error.flatten();
      throw new BadRequestException({
        message: 'Validation failed',
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
      });
    }

    return this.commentsService.update(
      id,
      validationResult.data,
      String(req.user.uid),
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.commentsService.remove(id, String(req.user.uid));
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  likeComment(@Param('id') id: string, @Request() req: any) {
    return this.commentsService.likeComment(id, String(req.user.uid));
  }
}
