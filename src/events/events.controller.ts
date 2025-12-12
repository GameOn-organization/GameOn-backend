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
import { EventsService } from './events.service';
import {
  CreateEventDto,
  CreateEventSchema,
  ListEventsQuery,
  ListEventsQuerySchema,
  UpdateEventSchema
} from './dto/create-event.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(CreateEventSchema))
  async create(@Body() createEventDto: CreateEventDto, @Request() req: any) {
    const creatorName = req.user.name || 'Usuário'
    return this.eventsService.create(createEventDto, String(req.user.uid), creatorName)
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(ListEventsQuerySchema)) query: ListEventsQuery) {
    return this.eventsService.findAll(query)
  }

  @Get('my-events')
  @UseGuards(AuthGuard)
  getMyEvents(
    @Request() req: any,
    @Query(new ZodValidationPipe(ListEventsQuerySchema)) query: ListEventsQuery,
  ) {
    return this.eventsService.getMyEvents(String(req.user.uid), query)
  }

  @Get('subscribed')
  @UseGuards(AuthGuard)
  getSubscribedEvents(@Request() req: any) {
    return this.eventsService.getSubscribedEvents(String(req.user.uid))
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateEventDto: any, @Request() req: any) {
    const validationResult = UpdateEventSchema.safeParse(updateEventDto)
    if (!validationResult.success) {
      const flat = validationResult.error.flatten()
      throw new BadRequestException({
        message: 'Validation failed',
        fieldErrors: flat.fieldErrors,
        formErrors: flat.formErrors,
      })
    }

    return this.eventsService.update(id, validationResult.data, String(req.user.uid))
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.remove(id, String(req.user.uid))
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard)
  subscribe(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.subscribe(id, String(req.user.uid))
  }

  @Post(':id/unsubscribe')
  @UseGuards(AuthGuard)
  unsubscribe(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.unsubscribe(id, String(req.user.uid))
  }

  @Post(':id/rate')
  @UseGuards(AuthGuard)
  rateEvent(@Param('id') id: string, @Body('rating') rating: number, @Request() req: any) {
    return this.eventsService.rateEvent(id, String(req.user.uid), rating)
  }
}