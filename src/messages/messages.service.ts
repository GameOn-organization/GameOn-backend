import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  private messages: message[] = [];
  private idCounter = 1;

  private generateId(): string {
    return `msg_${Date.now()}_${this.idCounter++}`;
  }

  async create(createMessageDto: CreateMessageDto): Promise<message> {
    const newMessage: message = {
      id: this.generateId(),
      conversationId: createMessageDto.conversationId,
      senderId: createMessageDto.senderId,
      text: createMessageDto.text,
      timeStamp: createMessageDto.timeStamp || new Date(),
      read: createMessageDto.read || false
    };

    this.messages.push(newMessage);
    return newMessage;
  }

  async findAll(): Promise<message[]> {
    return this.messages;
  }

  async findOne(id: string): Promise<message> {
    const message = this.messages.find(msg => msg.id === id);
    
    if (!message) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    return message;
  }

  async findByConversation(conversationId: string): Promise<message[]> {
    return this.messages.filter(msg => msg.conversationId === conversationId);
  }

  async findBySender(senderId: string): Promise<message[]> {
    return this.messages.filter(msg => msg.senderId === senderId);
  }

  async markAsRead(id: string): Promise<message> {
    const messageIndex = this.messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    this.messages[messageIndex].read = true;
    return this.messages[messageIndex];
  }

  async update(id: string, updateMessageDto: UpdateMessageDto): Promise<message> {
    const messageIndex = this.messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    const updatedMessage: message = {
      ...this.messages[messageIndex],
      ...(updateMessageDto.text && { text: updateMessageDto.text }),
      ...(updateMessageDto.read !== undefined && { read: updateMessageDto.read }),
    };

    this.messages[messageIndex] = updatedMessage;
    return updatedMessage;
  }

  async remove(id: string): Promise<void> {
    const messageIndex = this.messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    this.messages.splice(messageIndex, 1);
  }
}
