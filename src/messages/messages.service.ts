import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { message } from './entities/message.entity';
import { FIRESTORE } from '../firebase/firebase.providers';

@Injectable()
export class MessagesService {
  constructor(@Inject(FIRESTORE) private readonly db: any) {}

  async create(createMessageDto: CreateMessageDto): Promise<message> {
    const now = new Date();
    
    const newMessage: message = {
      id: '', // será definido pelo Firestore
      conversationId: createMessageDto.conversationId,
      senderId: createMessageDto.senderId,
      text: createMessageDto.text,
      timeStamp: createMessageDto.timeStamp || now,
      read: createMessageDto.read || false
    };

    // Salvar no Firestore
    const docRef = await this.db.collection('messages').add(newMessage);
    const createdMessage = { ...newMessage, id: docRef.id };
    
    // Atualizar documento com o ID
    await docRef.update({ id: docRef.id });

    // Atualizar lastMessage na conversa
    try {
      await this.db.collection('conversations').doc(createMessageDto.conversationId).update({
        lastMessage: {
          text: createMessageDto.text,
          senderId: createMessageDto.senderId,
          timestamp: now
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar lastMessage da conversa:', error);
    }

    return createdMessage;
  }

  async findAll(): Promise<message[]> {
    const snapshot = await this.db.collection('messages').get();
    return snapshot.docs.map(doc => doc.data() as message);
  }

  async findOne(id: string): Promise<message> {
    const doc = await this.db.collection('messages').doc(id).get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    return doc.data() as message;
  }

  async findByConversation(conversationId: string): Promise<message[]> {
    const snapshot = await this.db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .get();
    
    // Ordenar no servidor após buscar
    const messages = snapshot.docs.map(doc => doc.data() as message);
    return messages.sort((a, b) => {
      const timeA = a.timeStamp instanceof Date ? a.timeStamp.getTime() : new Date(a.timeStamp).getTime();
      const timeB = b.timeStamp instanceof Date ? b.timeStamp.getTime() : new Date(b.timeStamp).getTime();
      return timeA - timeB; // asc
    });
  }

  async findBySender(senderId: string): Promise<message[]> {
    const snapshot = await this.db
      .collection('messages')
      .where('senderId', '==', senderId)
      .get();
    
    // Ordenar no servidor após buscar
    const messages = snapshot.docs.map(doc => doc.data() as message);
    return messages.sort((a, b) => {
      const timeA = a.timeStamp instanceof Date ? a.timeStamp.getTime() : new Date(a.timeStamp).getTime();
      const timeB = b.timeStamp instanceof Date ? b.timeStamp.getTime() : new Date(b.timeStamp).getTime();
      return timeB - timeA; // desc
    });
  }

  async markAsRead(id: string): Promise<message> {
    const ref = this.db.collection('messages').doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    await ref.update({ read: true });
    
    const updated = await ref.get();
    return updated.data() as message;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto): Promise<message> {
    const ref = this.db.collection('messages').doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    const updateData: any = {};
    
    if (updateMessageDto.text) {
      updateData.text = updateMessageDto.text;
    }
    
    if (updateMessageDto.read !== undefined) {
      updateData.read = updateMessageDto.read;
    }

    await ref.update(updateData as Record<string, unknown>);
    
    const updated = await ref.get();
    return updated.data() as message;
  }

  async remove(id: string): Promise<void> {
    const ref = this.db.collection('messages').doc(id);
    const doc = await ref.get();
    
    if (!doc.exists) {
      throw new NotFoundException(`Mensagem com ID ${id} não encontrada`);
    }

    await ref.delete();
  }
}
