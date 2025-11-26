import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { conversation } from './entities/conversation.entity';
import { FIRESTORE } from '../firebase/firebase.providers';

@Injectable()
export class ConversationsService {
  constructor(@Inject(FIRESTORE) private readonly db: any) {}

  async create(createConversationDto: CreateConversationDto): Promise<conversation> {
    const now = new Date();
    
    const newConversation: conversation = {
      id: '', // será definido pelo Firestore
      participants: createConversationDto.participants,
      lastMessage: createConversationDto.lastMessage || {
        text: '',
        senderId: '',
        timestamp: now
      },
      createdAt: createConversationDto.createdAt || now
    };

    // Salvar no Firestore
    const docRef = await this.db.collection('conversations').add(newConversation);
    const createdConversation = { ...newConversation, id: docRef.id };
    
    // Atualizar documento com o ID
    await docRef.update({ id: docRef.id });

    return createdConversation;
  }

  async findAll(): Promise<conversation[]> {
    const snapshot = await this.db.collection('conversations').get();
    return snapshot.docs.map(doc => doc.data() as conversation);
  }

  async findOne(id: string): Promise<conversation> {
    const doc = await this.db.collection('conversations').doc(id).get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    return doc.data() as conversation;
  }

  async findByParticipant(participantId: string): Promise<conversation[]> {
    const snapshot = await this.db
      .collection('conversations')
      .where('participants', 'array-contains', participantId)
      .get();
    
    // Ordenar no servidor após buscar
    const conversations = snapshot.docs.map(doc => doc.data() as conversation);
    return conversations.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA; // desc
    });
  }

  async update(id: string, updateConversationDto: UpdateConversationDto): Promise<conversation> {
    const ref = this.db.collection('conversations').doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    const updateData: any = {};
    
    if (updateConversationDto.participants) {
      updateData.participants = updateConversationDto.participants;
    }
    
    if (updateConversationDto.lastMessage) {
      updateData.lastMessage = updateConversationDto.lastMessage;
    }

    await ref.update(updateData as Record<string, unknown>);
    
    const updated = await ref.get();
    return updated.data() as conversation;
  }

  async remove(id: string): Promise<void> {
    const ref = this.db.collection('conversations').doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    await ref.delete();
  }
}
