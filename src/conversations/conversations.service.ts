import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { conversation } from './entities/conversation.entity';

@Injectable()
export class ConversationsService {
  private conversations: conversation[] = [];
  private idCounter = 1;

  private generateId(): string {
    return `conv_${Date.now()}_${this.idCounter++}`;
  }

  async create(createConversationDto: CreateConversationDto): Promise<conversation> {
    const newConversation: conversation = {
      id: this.generateId(),
      participants: createConversationDto.participantes,
      lastMessage: createConversationDto.lastMessage,
      createdAt: createConversationDto.createdAt || new Date()
    };

    this.conversations.push(newConversation);
    return newConversation;
  }

  async findAll(): Promise<conversation[]> {
    return this.conversations;
  }

  async findOne(id: string): Promise<conversation> {
    const conversation = this.conversations.find(conv => conv.id === id);
    
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    return conversation;
  }

  async findByParticipant(participantId: string): Promise<conversation[]> {
    return this.conversations.filter(conv => 
      conv.participants.includes(participantId)
    );
  }

  async update(id: string, updateConversationDto: UpdateConversationDto): Promise<conversation> {
    const conversationIndex = this.conversations.findIndex(conv => conv.id === id);
    
    if (conversationIndex === -1) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    const updatedConversation: conversation = {
      ...this.conversations[conversationIndex],
      ...(updateConversationDto.participantes && { participants: updateConversationDto.participantes }),
      ...(updateConversationDto.lastMessage && { lastMessage: updateConversationDto.lastMessage }),
    };

    this.conversations[conversationIndex] = updatedConversation;
    return updatedConversation;
  }

  async remove(id: string): Promise<void> {
    const conversationIndex = this.conversations.findIndex(conv => conv.id === id);
    
    if (conversationIndex === -1) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    this.conversations.splice(conversationIndex, 1);
  }
}
