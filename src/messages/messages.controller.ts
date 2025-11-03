import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto, createMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createMessageDto))
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  findAll(
    @Query('conversationId') conversationId?: string,
    @Query('senderId') senderId?: string
  ) {
    if (conversationId) {
      return this.messagesService.findByConversation(conversationId);
    }
    if (senderId) {
      return this.messagesService.findBySender(senderId);
    }
    return this.messagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.messagesService.markAsRead(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
