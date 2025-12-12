import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto, ListNotificationsQuery } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Notification } from './entities/notification.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  constructor(@Inject(FIRESTORE) private readonly db: any) {}

  /**
   * Converte Timestamps do Firestore para Date ou ISO string
   */
  private convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return new Date();
  }

  /**
   * Converte um documento do Firestore para Notification, convertendo Timestamps
   */
  private convertDocumentToNotification(data: any): Notification {
    return {
      ...data,
      createdAt: this.convertTimestamp(data.createdAt),
      updatedAt: this.convertTimestamp(data.updatedAt),
    } as Notification;
  }

  /**
   * Remove campos undefined de um objeto para evitar erros no Firestore
   */
  private removeUndefinedFields(obj: any): any {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned;
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const now = new Date();
    const notification: any = {
      id: '', // definido pelo FIRESTORE
      userId: createNotificationDto.userId,
      fromUserId: createNotificationDto.fromUserId,
      fromUsername: createNotificationDto.fromUsername,
      action: createNotificationDto.action,
      category: createNotificationDto.category,
      read: false,
      createdAt: now,
      updatedAt: now,
    };

    // Adicionar campos opcionais apenas se estiverem definidos
    if (createNotificationDto.fromUserAvatar) {
      notification.fromUserAvatar = createNotificationDto.fromUserAvatar;
    }
    if (createNotificationDto.thumbnail) {
      notification.thumbnail = createNotificationDto.thumbnail;
    }
    if (createNotificationDto.relatedPostId) {
      notification.relatedPostId = createNotificationDto.relatedPostId;
    }
    if (createNotificationDto.relatedCommentId) {
      notification.relatedCommentId = createNotificationDto.relatedCommentId;
    }

    // Remover campos undefined antes de salvar no Firestore
    const cleanedNotification = this.removeUndefinedFields(notification);

    const docRef = await this.db.collection('notifications').add(cleanedNotification);
    const createdNotification = { ...cleanedNotification, id: docRef.id };

    await docRef.update({ id: docRef.id });

    // Buscar o documento criado para garantir que os Timestamps sejam convertidos corretamente
    const createdDoc = await docRef.get();
    const data = createdDoc.data();
    return this.convertDocumentToNotification(data);
  }

  async findAll(query?: ListNotificationsQuery): Promise<Notification[]> {
    try {
      console.log('🔍 [NOTIFICATIONS SERVICE] ========== INÍCIO findAll ==========');
      console.log('🔍 [NOTIFICATIONS SERVICE] Query recebida:', JSON.stringify(query, null, 2));
      console.log('🔍 [NOTIFICATIONS SERVICE] query?.category:', query?.category);
      console.log('🔍 [NOTIFICATIONS SERVICE] typeof query?.category:', typeof query?.category);
      console.log('🔍 [NOTIFICATIONS SERVICE] query?.category === "MATCH":', query?.category === 'MATCH');
      console.log('🔍 [NOTIFICATIONS SERVICE] query?.category === "Equipes":', query?.category === 'Equipes');

      let ref: admin.firestore.Query = this.db.collection('notifications');

      // Aplicar filtros
      if (query?.userId) {
        ref = ref.where('userId', '==', query.userId);
        console.log('✅ [NOTIFICATIONS SERVICE] Filtro userId aplicado:', query.userId);
      }
      
      // Aplicar filtro de categoria apenas se fornecida e válida
      const category = query?.category;
      console.log('🔍 [NOTIFICATIONS SERVICE] Variável category:', category);
      console.log('🔍 [NOTIFICATIONS SERVICE] category existe?', !!category);
      console.log('🔍 [NOTIFICATIONS SERVICE] category é string?', typeof category === 'string');
      
      if (category) {
        console.log('🔍 [NOTIFICATIONS SERVICE] Verificando se category é válida...');
        const isValidCategory = category === 'MATCH' || category === 'Equipes' || category === 'Eventos' || category === 'Comunidade';
        console.log('🔍 [NOTIFICATIONS SERVICE] category é válida?', isValidCategory);
        
        if (isValidCategory) {
          ref = ref.where('category', '==', category);
          console.log('✅ [NOTIFICATIONS SERVICE] Filtro category APLICADO no Firestore:', category);
        } else {
          console.warn('⚠️ [NOTIFICATIONS SERVICE] Category inválida, não aplicando filtro:', category);
        }
      } else {
        console.log('⚠️ [NOTIFICATIONS SERVICE] Filtro category NÃO aplicado - category é:', category);
      }
      
      if (query?.read !== undefined) {
        ref = ref.where('read', '==', query.read);
        console.log('✅ [NOTIFICATIONS SERVICE] Filtro read aplicado:', query.read);
      }

      // IMPORTANTE: A ordem dos filtros importa no Firestore!
      // Se houver múltiplos where + orderBy, pode precisar de índice composto
      
      // Aplicar ordenação (mais recentes primeiro)
      ref = ref.orderBy('createdAt', 'desc');
      console.log('🔍 [NOTIFICATIONS SERVICE] orderBy aplicado: createdAt desc');

      // Aplicar paginação (Firestore não suporta offset diretamente, então usamos apenas limit)
      const limit = query?.limit || 50;
      ref = ref.limit(limit);
      console.log('🔍 [NOTIFICATIONS SERVICE] limit aplicado:', limit);

      console.log('🔍 [NOTIFICATIONS SERVICE] Executando query do Firestore...');
      console.log('🔍 [NOTIFICATIONS SERVICE] Query summary - userId:', query?.userId, 'category:', query?.category, 'read:', query?.read);
      
      const snap = await ref.get();
      console.log('🔍 [NOTIFICATIONS SERVICE] ✅ Query executada com sucesso');
      console.log('🔍 [NOTIFICATIONS SERVICE] Documentos encontrados pelo Firestore:', snap.size);
      
      if (snap.size === 0) {
        console.warn('⚠️ [NOTIFICATIONS SERVICE] ATENÇÃO: Nenhum documento encontrado!');
        console.warn('⚠️ [NOTIFICATIONS SERVICE] Verifique se:');
        console.warn('⚠️ [NOTIFICATIONS SERVICE] 1. O userId está correto:', query?.userId);
        console.warn('⚠️ [NOTIFICATIONS SERVICE] 2. A category está correta:', query?.category);
        console.warn('⚠️ [NOTIFICATIONS SERVICE] 3. Existem notificações no Firestore com essa combinação');
      }
      
      // Converter Timestamps do Firestore para Date
      const results = snap.docs.map((d) => {
        const data = d.data();
        const notification = this.convertDocumentToNotification(data);
        console.log('📄 [NOTIFICATIONS SERVICE] Doc:', {
          id: notification.id,
          category: notification.category,
          userId: notification.userId,
          action: notification.action.substring(0, 30) + '...'
        });
        return notification;
      });
      
      console.log('🔍 [NOTIFICATIONS SERVICE] ========== FIM findAll ==========');
      console.log('🔍 [NOTIFICATIONS SERVICE] Total de resultados retornados:', results.length);
      if (results.length > 0) {
        const categories = results.map(r => r.category);
        const uniqueCategories = [...new Set(categories)];
        console.log('🔍 [NOTIFICATIONS SERVICE] Categorias únicas encontradas:', uniqueCategories);
        console.log('🔍 [NOTIFICATIONS SERVICE] Contagem por categoria:', 
          uniqueCategories.map(cat => `${cat}: ${categories.filter(c => c === cat).length}`).join(', ')
        );
      }
      
      return results;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS SERVICE] Erro ao buscar notificações:', error);
      console.error('❌ [NOTIFICATIONS SERVICE] Código do erro:', error.code);
      console.error('❌ [NOTIFICATIONS SERVICE] Mensagem:', error.message);
      console.error('❌ [NOTIFICATIONS SERVICE] Query que causou o erro:', JSON.stringify(query, null, 2));
      
      // Se o erro for relacionado a índice faltando, tentar sem orderBy
      if (error.code === 9 || error.message?.includes('index') || error.message?.includes('requires an index')) {
        console.warn('⚠️ [NOTIFICATIONS SERVICE] Índice composto faltando, tentando sem orderBy...');
        try {
          let ref: admin.firestore.Query = this.db.collection('notifications');
          
          // Aplicar os mesmos filtros, mas sem orderBy
          if (query?.userId) {
            ref = ref.where('userId', '==', query.userId);
            console.log('✅ [NOTIFICATIONS SERVICE] (Fallback) Filtro userId aplicado:', query.userId);
          }
          
          // Aplicar filtro de categoria
          const category = query?.category;
          if (category && (category === 'MATCH' || category === 'Equipes' || category === 'Eventos' || category === 'Comunidade')) {
            ref = ref.where('category', '==', category);
            console.log('✅ [NOTIFICATIONS SERVICE] (Fallback) Filtro category aplicado:', category);
          }
          
          if (query?.read !== undefined) {
            ref = ref.where('read', '==', query.read);
            console.log('✅ [NOTIFICATIONS SERVICE] (Fallback) Filtro read aplicado:', query.read);
          }
          
          const limit = query?.limit || 50;
          ref = ref.limit(limit);
          
          const snap = await ref.get();
          console.log('✅ [NOTIFICATIONS SERVICE] (Fallback) Documentos encontrados:', snap.size);
          
          const results = snap.docs.map((d) => this.convertDocumentToNotification(d.data()));
          
          // Ordenar manualmente por createdAt
          return results.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return dateB - dateA; // Descendente
          });
        } catch (fallbackError: any) {
          console.error('❌ [NOTIFICATIONS SERVICE] Fallback também falhou:', fallbackError.message);
          throw fallbackError;
        }
      }
      throw error;
    }
  }

  async findByUser(userId: string, query?: ListNotificationsQuery): Promise<Notification[]> {
    console.log('🔍 [NOTIFICATIONS SERVICE] ========== INÍCIO findByUser ==========');
    console.log('🔍 [NOTIFICATIONS SERVICE] userId recebido:', userId);
    console.log('🔍 [NOTIFICATIONS SERVICE] query recebida:', JSON.stringify(query, null, 2));
    console.log('🔍 [NOTIFICATIONS SERVICE] query?.category:', query?.category);
    console.log('🔍 [NOTIFICATIONS SERVICE] query?.category type:', typeof query?.category);
    console.log('🔍 [NOTIFICATIONS SERVICE] query tem category?', query && 'category' in query);
    
    // Criar query com userId, mas preservar category apenas se existir explicitamente
    const queryWithUser: ListNotificationsQuery = {
      userId, // Sempre incluir userId para filtrar por usuário
      limit: query?.limit ?? 50,
      offset: query?.offset ?? 0,
    };
    
    // Apenas incluir category se estiver definida explicitamente na query
    if (query && 'category' in query && query.category !== undefined) {
      queryWithUser.category = query.category;
      console.log('✅ [NOTIFICATIONS SERVICE] Category incluída na query:', query.category);
    } else {
      console.log('⚠️ [NOTIFICATIONS SERVICE] Category NÃO incluída na query (retornando todas as categorias)');
    }
    
    // Apenas incluir read se estiver definido explicitamente
    if (query && 'read' in query && query.read !== undefined) {
      queryWithUser.read = query.read;
      console.log('✅ [NOTIFICATIONS SERVICE] Read incluído na query:', query.read);
    }
    
    console.log('🔍 [NOTIFICATIONS SERVICE] queryWithUser que será passada para findAll:', JSON.stringify(queryWithUser, null, 2));
    console.log('🔍 [NOTIFICATIONS SERVICE] queryWithUser.category:', queryWithUser.category);
    console.log('🔍 [NOTIFICATIONS SERVICE] queryWithUser.userId:', queryWithUser.userId);
    console.log('🔍 [NOTIFICATIONS SERVICE] queryWithUser tem category?', 'category' in queryWithUser);

    return this.findAll(queryWithUser);
  }

  async findOne(id: string): Promise<Notification> {
    const doc = await this.db.collection('notifications').doc(id).get();
    if (!doc.exists) throw new NotFoundException('Notification not found');
    return this.convertDocumentToNotification(doc.data());
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const ref = this.db.collection('notifications').doc(id);
    const doc = await ref.get();

    if (!doc.exists) throw new NotFoundException('Notification not found');

    const updateData = {
      ...updateNotificationDto,
      updatedAt: new Date(),
    };

    await ref.update(updateData as Record<string, unknown>);
    const updated = await ref.get();
    return this.convertDocumentToNotification(updated.data());
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.findByUser(userId, { read: false });
    const batch = this.db.batch();

    notifications.forEach((notification) => {
      const ref = this.db.collection('notifications').doc(notification.id);
      batch.update(ref, { read: true, updatedAt: new Date() });
    });

    await batch.commit();
  }

  async remove(id: string): Promise<void> {
    const ref = this.db.collection('notifications').doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Notification not found');
    await ref.delete();
  }

  async cleanupEmptyIds(): Promise<{
    message: string;
    deleted: number;
    details: string[];
  }> {
    try {
      console.log('🧹 Iniciando limpeza de notificações com ID vazio...');

      // Buscar todas as notificações
      const snapshot = await this.db.collection('notifications').get();
      const emptyIdDocs: any[] = [];

      // Identificar documentos com ID vazio ou ausente
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (!data.id || data.id === '') {
          emptyIdDocs.push({
            docId: doc.id,
            data: data,
          });
        }
      });

      console.log(`🔍 Encontradas ${emptyIdDocs.length} notificações com ID vazio`);

      if (emptyIdDocs.length === 0) {
        return {
          message: 'Nenhuma notificação com ID vazio encontrada',
          deleted: 0,
          details: [],
        };
      }

      // Deletar notificações com ID vazio
      const deletionPromises = emptyIdDocs.map((doc) =>
        this.db.collection('notifications').doc(doc.docId).delete(),
      );

      await Promise.all(deletionPromises);

      const details = emptyIdDocs.map((doc) => 
        `Deletado: ${doc.data.action} para usuário ${doc.data.userId}`
      );

      console.log(`✅ ${emptyIdDocs.length} notificações deletadas`);

      return {
        message: `Limpeza concluída: ${emptyIdDocs.length} notificações deletadas`,
        deleted: emptyIdDocs.length,
        details: details,
      };
    } catch (error: any) {
      console.error('Erro na limpeza de notificações:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const ref = this.db
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false);

    const snap = await ref.get();
    return snap.size;
  }
}

