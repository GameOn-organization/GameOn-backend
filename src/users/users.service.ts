import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { CreateUserDto, ListUsersQuery } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Profile } from './entities/user.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(
    @Inject(FIRESTORE) private readonly db: any,
  ) { }

  async create(createUserDto: CreateUserDto, uid: string): Promise<Profile> {
    // Se images[] foi fornecido, usar ele; caso contrário, usar image (compatibilidade retroativa)
    const imagesArray = createUserDto.images && createUserDto.images.length > 0
      ? createUserDto.images
      : (createUserDto.image ? [createUserDto.image] : []);

    const profile: Profile = {
      id: uid,
      name: createUserDto.name,
      age: createUserDto.age,
      phone: createUserDto.phone,
      email: createUserDto.email,
      // Manter image para compatibilidade retroativa (primeira imagem do array ou image antigo)
      image: imagesArray[0] || createUserDto.image || null,
      // Novo campo: array de imagens
      images: imagesArray,
      // Novo campo: descrição
      descricao: createUserDto.descricao,
      // Novo campo: sexo/gênero
      sexo: createUserDto.sexo,
      // Novo campo: localização
      localizacao: createUserDto.localizacao,
      // Novo campo: wallpaper
      wallpaper: createUserDto.wallpaper || null,
      tags: createUserDto.tags || []
    } as Profile;

    console.log('DEBUG - Profile sendo salvo no Firestore:', JSON.stringify(profile, null, 2));
    await this.db.collection('profiles').doc(uid).set(profile);

    // Verificar o que foi salvo
    const savedDoc = await this.db.collection('profiles').doc(uid).get();
    const savedData = savedDoc.data();
    console.log('DEBUG - Dados recuperados do Firestore:', JSON.stringify(savedData, null, 2));

    return profile;
  }

  async findAll(query?: ListUsersQuery): Promise<Profile[]> {
    let ref: admin.firestore.Query = this.db.collection('profiles');

    const filters = [
      () => query?.tag && ref.where('tags', 'array-contains', query.tag),
      () =>
        query?.tagsAny &&
        ref.where(
          'tags',
          'array-contains-any',
          (Array.isArray(query.tagsAny)
            ? query.tagsAny
            : [query.tagsAny]
          ).slice(0, 10),
        ),
      () => query?.minAge !== undefined && ref.where('age', '>=', query.minAge),
      () => query?.maxAge !== undefined && ref.where('age', '<=', query.maxAge),
      () => query?.name && ref.where('name', '==', query.name),
    ];

    ref = filters.reduce((acc, filter) => filter() || acc, ref);

    const snap = await ref.get();
    return snap.docs.map((d) => {
      const data = d.data();
      console.log('DEBUG - Dados brutos do Firestore:', JSON.stringify(data, null, 2));
      console.log('DEBUG - Tipo do age:', typeof data.age, 'Valor:', data.age);

      const profile = {
        id: data.id,
        name: data.name,
        age: data.age || 0,
        email: data.email,
        phone: data.phone || undefined,
        image: data.image || null,
        images: data.images || (data.image ? [data.image] : []),
        descricao: data.descricao || undefined,
        sexo: data.sexo || undefined,
        localizacao: data.localizacao || undefined,
        wallpaper: data.wallpaper || null,
        tags: data.tags || [],
      };

      console.log('DEBUG - Profile final:', JSON.stringify(profile, null, 2));
      return profile as Profile;
    });
  }

  async findOne(id: string): Promise<Profile> {
    const doc = await this.db.collection('profiles').doc(id).get();
    if (!doc.exists) throw new NotFoundException('Profile not found');
    const data = doc.data();
    const profile = {
      id: data.id,
      name: data.name,
      age: data.age || 0,
      email: data.email,
      phone: data.phone || undefined,
      image: data.image || null,
      images: data.images || (data.image ? [data.image] : []),
      descricao: data.descricao || undefined,
      sexo: data.sexo || undefined,
      localizacao: data.localizacao || undefined,
      wallpaper: data.wallpaper || null,
      tags: data.tags || [],
    };

    return profile as Profile;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Profile> {
    const ref = this.db.collection('profiles').doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Profile not found');

    // Se images[] foi fornecido, atualizar também o campo image (compatibilidade)
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.images && updateUserDto.images.length > 0) {
      updateData.image = updateUserDto.images[0] || null;
    }

    await ref.update(updateData as Record<string, unknown>);
    const updated = await ref.get();
    const data = updated.data();
    const profile = {
      id: data.id,
      name: data.name,
      age: data.age || 0,
      email: data.email,
      phone: data.phone || undefined,
      image: data.image || null,
      images: data.images || (data.image ? [data.image] : []),
      descricao: data.descricao || undefined,
      sexo: data.sexo || undefined,
      localizacao: data.localizacao || undefined,
      wallpaper: data.wallpaper || null,
      tags: data.tags || [],
    };

    return profile as Profile;
  }

  async findByTag(tag: string): Promise<Profile[]> {
    const snap = await this.db
      .collection('profiles')
      .where('tags', 'array-contains', tag)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      const profile = {
        id: data.id,
        name: data.name,
        age: data.age || 0,
        email: data.email,
        phone: data.phone || undefined,
        image: data.image || null,
        images: data.images || (data.image ? [data.image] : []),
        descricao: data.descricao || undefined,
        sexo: data.sexo || undefined,
        localizacao: data.localizacao || undefined,
        wallpaper: data.wallpaper || null,
        tags: data.tags || [],
      };

      return profile as Profile;
    });
  }

  async remove(id: string): Promise<void> {
    try {
      // 1. Deletar do Firestore
      await this.db.collection('profiles').doc(id).delete();
      console.log(`Perfil ${id} deletado do Firestore`);

      // 2. Deletar do Firebase Authentication
      try {
        await admin.auth().deleteUser(id);
        console.log(`Usuário ${id} deletado do Firebase Auth`);
      } catch (authError: any) {
        // Se o usuário não existir no Auth, apenas logamos
        if (authError.code === 'auth/user-not-found') {
          console.log(`Usuário ${id} não encontrado no Firebase Auth (já foi deletado)`);
        } else {
          console.error(`Erro ao deletar do Firebase Auth:`, authError);
          throw authError;
        }
      }
    } catch (error) {
      console.error(`Erro ao deletar usuário ${id}:`, error);
      throw error;
    }
  }

  async getMyProfile(uid: string): Promise<Profile> {
    return this.findOne(uid);
  }

  async updateMyProfile(
    uid: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Profile> {
    return this.update(uid, updateUserDto);
  }

  async cleanupOrphanUsers(): Promise<{
    message: string;
    orphansFound: number;
    deleted: number;
    errors: number;
    orphanUsers: Array<{ uid: string; email: string }>;
  }> {
    try {
      console.log(' Iniciando limpeza de usuários órfãos...');

      // 1. Buscar todos os usuários do Firebase Auth
      const listUsersResult = await admin.auth().listUsers(1000);
      const authUsers = listUsersResult.users;
      console.log(`Encontrados ${authUsers.length} usuários no Firebase Auth`);

      // 2. Buscar todos os perfis do Firestore
      const profilesSnapshot = await this.db.collection('profiles').get();
      const firestoreUids = new Set(profilesSnapshot.docs.map((doc: any) => doc.id));
      console.log(`Encontrados ${firestoreUids.size} perfis no Firestore`);

      // 3. Identificar usuários órfãos (existem no Auth mas não no Firestore)
      const orphanUsers = authUsers.filter(user => !firestoreUids.has(user.uid));

      if (orphanUsers.length === 0) {
        return {
          message: 'Nenhum usuário órfão encontrado',
          orphansFound: 0,
          deleted: 0,
          errors: 0,
          orphanUsers: []
        };
      }

      console.log(`Encontrados ${orphanUsers.length} usuários órfãos`);

      // 4. Deletar usuários órfãos
      let deletedCount = 0;
      let errorCount = 0;
      const orphansList: Array<any> = [];

      for (const user of orphanUsers) {
        try {
          await admin.auth().deleteUser(user.uid);
          console.log(`Deletado do Auth: ${user.email || 'Sem email'} (${user.uid})`);
          deletedCount++;
          orphansList.push({
            uid: user.uid,
            email: user.email || 'Sem email',
            deleted: true
          });
        } catch (error: any) {
          console.error(`Erro ao deletar ${user.email}: ${error.message}`);
          errorCount++;
          orphansList.push({
            uid: user.uid,
            email: user.email || 'Sem email',
            deleted: false,
            error: error.message
          });
        }
      }

      return {
        message: `Limpeza concluída: ${deletedCount} usuários deletados, ${errorCount} erros`,
        orphansFound: orphanUsers.length,
        deleted: deletedCount,
        errors: errorCount,
        orphanUsers: orphansList
      };
    } catch (error: any) {
      console.error('Erro na limpeza de usuários órfãos:', error);
      throw error;
    }
  }

  /**
   * Sistema de likes/matches (tipo Tinder)
   */

  /**
   * Usuário dá like em outro usuário e verifica se é match
   */
  async likeUser(currentUserId: string, targetUserId: string): Promise<{
    liked: boolean;
    match: boolean;
    conversation?: any;
  }> {
    if (currentUserId === targetUserId) {
      throw new Error('Você não pode dar like em si mesmo');
    }

    // Buscar perfis
    const currentUserRef = this.db.collection('profiles').doc(currentUserId);
    const targetUserRef = this.db.collection('profiles').doc(targetUserId);

    const [currentUserDoc, targetUserDoc] = await Promise.all([
      currentUserRef.get(),
      targetUserRef.get(),
    ]);

    if (!currentUserDoc.exists) {
      throw new NotFoundException('Seu perfil não foi encontrado');
    }
    if (!targetUserDoc.exists) {
      throw new NotFoundException('Usuário alvo não encontrado');
    }

    const currentUserData = currentUserDoc.data() as Profile;
    const targetUserData = targetUserDoc.data() as Profile;

    // Inicializar arrays de likes se não existirem
    const currentUserLiked = currentUserData.likedUsers || [];
    const targetUserLikedBy = targetUserData.likedByUsers || [];
    const currentUserMatches = currentUserData.matches || [];
    const targetUserMatches = targetUserData.matches || [];

    // Verificar se já deu like
    if (currentUserLiked.includes(targetUserId)) {
      console.log('⚠️ [LIKE] Usuário já deu like anteriormente');
      const alreadyMatched = currentUserMatches.includes(targetUserId);
      
      // Se já é um match, buscar a conversa existente
      if (alreadyMatched) {
        console.log('💚 [LIKE] Já é um match, buscando conversa...');
        try {
          const convSnapshot = await this.db
            .collection('conversations')
            .where('participants', 'array-contains', currentUserId)
            .get();
          
          let foundConversation: any = null;
          for (const doc of convSnapshot.docs) {
            const data = doc.data();
            if (data.participants.includes(targetUserId)) {
              foundConversation = {
                id: doc.id,
                participants: data.participants,
                lastMessage: data.lastMessage ? {
                  text: data.lastMessage.text,
                  senderId: data.lastMessage.senderId,
                  timestamp: data.lastMessage.timestamp?.toDate?.()?.toISOString?.() || data.lastMessage.timestamp
                } : undefined,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt
              };
              console.log('✅ [LIKE] Conversa encontrada:', doc.id);
              break;
            }
          }
          
          if (foundConversation) {
            return {
              liked: true,
              match: true,
              conversation: foundConversation,
            };
          }
        } catch (error) {
          console.error('❌ [LIKE] Erro ao buscar conversa:', error);
        }
      }
      
      return {
        liked: true,
        match: alreadyMatched,
      };
    }

    // Adicionar like
    currentUserLiked.push(targetUserId);
    targetUserLikedBy.push(currentUserId);

    // Verificar se o outro usuário também deu like (MATCH!)
    const targetUserLiked = targetUserData.likedUsers || [];
    const isMatch = targetUserLiked.includes(currentUserId);
    
    console.log('🔍 [MATCH CHECK] targetUserLiked:', targetUserLiked);
    console.log('🔍 [MATCH CHECK] currentUserId:', currentUserId);
    console.log('🔍 [MATCH CHECK] isMatch:', isMatch);

    let conversation: any = null;

    if (isMatch) {
      console.log('🎯 [MATCH] ENTROU NO BLOCO IF (isMatch)');

      // É MATCH! Adicionar aos matches mútuos
      if (!currentUserMatches.includes(targetUserId)) {
        currentUserMatches.push(targetUserId);
      }
      if (!targetUserMatches.includes(currentUserId)) {
        targetUserMatches.push(currentUserId);
      }

      // Criar conversa automaticamente
      try {
        console.log('🔵 [MATCH] Verificando se já existe conversa...');
        console.log('🔵 [MATCH] currentUserId:', currentUserId);
        console.log('🔵 [MATCH] targetUserId:', targetUserId);
        // Verificar se já existe uma conversa
        const existingConversations = await this.db
          .collection('conversations')
          .where('participants', 'array-contains', currentUserId)
          .get();
        
        console.log('🔵 [MATCH] Conversas encontradas:', existingConversations.size);

        let existingConversation: any = null;
        for (const doc of existingConversations.docs) {
          const data = doc.data();
          if (data.participants.includes(targetUserId)) {
            // Converter timestamps do Firestore para Date
            existingConversation = {
              id: doc.id,
              participants: data.participants,
              lastMessage: data.lastMessage ? {
                text: data.lastMessage.text,
                senderId: data.lastMessage.senderId,
                timestamp: data.lastMessage.timestamp?.toDate?.() || data.lastMessage.timestamp || new Date()
              } : undefined,
              createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
            };
            console.log('✅ [MATCH] Conversa existente encontrada:', doc.id);
            console.log('📊 [MATCH] Conversa convertida:', JSON.stringify(existingConversation));
            break;
          }
        }

        if (!existingConversation) {
          console.log('🔵 [MATCH] Criando nova conversa...');
          const now = new Date();
          const newConversation = {
            id: '',
            participants: [currentUserId, targetUserId],
            lastMessage: {
              text: 'Vocês deram match! Comece a conversar 🎉',
              senderId: 'system',
              timestamp: now,
            },
            createdAt: now,
          };

          const convRef = await this.db.collection('conversations').add(newConversation);
          await convRef.update({ id: convRef.id });
          conversation = { ...newConversation, id: convRef.id };
          console.log('✅ [MATCH] Nova conversa criada:', convRef.id);
        } else {
          conversation = existingConversation;
          console.log('✅ [MATCH] Usando conversa existente');
        }
        
        console.log('📊 [MATCH] Conversation final:', JSON.stringify(conversation));
        console.log('📊 [MATCH] Conversation é null?', conversation === null);
        console.log('📊 [MATCH] Conversation tem ID?', conversation?.id);
      } catch (error) {
        console.error('❌ [MATCH] Erro ao criar conversa:', error);
        // Ainda assim, tentar criar uma conversa básica
        const now = new Date();
        const convRef = await this.db.collection('conversations').add({
          participants: [currentUserId, targetUserId],
          lastMessage: {
            text: 'Vocês deram match! Comece a conversar 🎉',
            senderId: 'system',
            timestamp: now,
          },
          createdAt: now,
        });
        await convRef.update({ id: convRef.id });
        conversation = {
          id: convRef.id,
          participants: [currentUserId, targetUserId],
          lastMessage: {
            text: 'Vocês deram match! Comece a conversar 🎉',
            senderId: 'system',
            timestamp: now,
          },
          createdAt: now,
        };
        console.log('✅ [MATCH] Conversa criada após erro:', convRef.id);
      }

      // Enviar notificações para ambos os usuários
      try {
        const now = new Date();

        // Notificação para o usuário atual - gerar ID primeiro
        const notif1Ref = this.db.collection('notifications').doc();
        const notif1Id = notif1Ref.id;
        const notification1Data = {
          id: notif1Id,
          userId: currentUserId,
          fromUserId: targetUserId,
          fromUsername: targetUserData.name,
          fromUserAvatar: targetUserData.image || targetUserData.images?.[0] || null,
          action: `Vocês deram match! 💚`,
          category: 'match',
          read: false,
          createdAt: now,
          updatedAt: now,
        };
        await notif1Ref.set(notification1Data);

        // Notificação para o outro usuário - gerar ID primeiro
        const notif2Ref = this.db.collection('notifications').doc();
        const notif2Id = notif2Ref.id;
        const notification2Data = {
          id: notif2Id,
          userId: targetUserId,
          fromUserId: currentUserId,
          fromUsername: currentUserData.name,
          fromUserAvatar: currentUserData.image || currentUserData.images?.[0] || null,
          action: `Vocês deram match! 💚`,
          category: 'match',
          read: false,
          createdAt: now,
          updatedAt: now,
        };
        await notif2Ref.set(notification2Data);

        console.log('✅ Notificações de match enviadas com IDs:', notif1Id, notif2Id);
      } catch (error) {
        console.error('Erro ao enviar notificações de match:', error);
      }
    }

    // Atualizar perfis no Firestore
    await Promise.all([
      currentUserRef.update({
        likedUsers: currentUserLiked,
        matches: currentUserMatches,
      }),
      targetUserRef.update({
        likedByUsers: targetUserLikedBy,
        matches: targetUserMatches,
      }),
    ]);

    console.log(`✅ Like registrado: ${currentUserId} → ${targetUserId}`);
    if (isMatch) {
      console.log(`💚 MATCH! ${currentUserId} ↔ ${targetUserId}`);
      console.log(`📊 [RETURN] Conversation ID que será retornado:`, conversation?.id);
      console.log(`📊 [RETURN] Conversation completa:`, JSON.stringify(conversation));
      
      // TESTE: Retornar conversation hardcoded para debug
      console.log('🔥 [TEST] Retornando conversation hardcoded para teste');
      return {
        liked: true,
        match: true,
        conversation: {
          id: "HARDCODED_TEST",
          participants: [currentUserId, targetUserId],
          lastMessage: {
            text: "Test",
            senderId: "system",
            timestamp: new Date().toISOString()
          },
          createdAt: new Date().toISOString()
        }
      };
      
      // Se não temos conversation, buscar novamente do banco
      if (!conversation || !conversation.id) {
        console.log('⚠️ [RETURN] Conversation não encontrada no cache, buscando do banco...');
        try {
          const convSnapshot = await this.db
            .collection('conversations')
            .where('participants', 'array-contains', currentUserId)
            .get();
          
          for (const doc of convSnapshot.docs) {
            const data = doc.data();
            if (data.participants.includes(targetUserId)) {
              // Converter timestamps do Firestore para Date
              conversation = {
                id: doc.id,
                participants: data.participants,
                lastMessage: data.lastMessage ? {
                  text: data.lastMessage.text,
                  senderId: data.lastMessage.senderId,
                  timestamp: data.lastMessage.timestamp?.toDate?.() || data.lastMessage.timestamp || new Date()
                } : undefined,
                createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
              };
              console.log('✅ [RETURN] Conversa encontrada no banco:', doc.id);
              console.log('✅ [RETURN] Conversa do banco (serializada):', JSON.stringify(conversation));
              break;
            }
          }
        } catch (error) {
          console.error('❌ [RETURN] Erro ao buscar conversa do banco:', error);
        }
      }
      
      // Garantir que a conversa tenha dados serializáveis
      if (conversation && conversation.id) {
        // Converter timestamps do Firestore para strings ISO
        const conversationToReturn = {
          id: conversation.id,
          participants: conversation.participants,
          lastMessage: conversation.lastMessage ? {
            text: conversation.lastMessage.text,
            senderId: conversation.lastMessage.senderId,
            timestamp: conversation.lastMessage.timestamp instanceof Date 
              ? conversation.lastMessage.timestamp.toISOString()
              : conversation.lastMessage.timestamp?.toDate?.()?.toISOString?.() || conversation.lastMessage.timestamp
          } : undefined,
          createdAt: conversation.createdAt instanceof Date
            ? conversation.createdAt.toISOString()
            : conversation.createdAt?.toDate?.()?.toISOString?.() || conversation.createdAt
        };
        
        console.log('📤 [RETURN] Conversation serializada:', JSON.stringify(conversationToReturn));
        
        return {
          liked: true,
          match: true,
          conversation: conversationToReturn,
        };
      } else {
        console.error('❌ [RETURN] ERRO: Match detectado mas conversa não encontrada!');
      }
    }

    const result = {
      liked: true,
      match: isMatch,
    };
    
    console.log('📤 [RETURN] Resultado final:', JSON.stringify(result));
    
    return result;
  }

  /**
   * Retorna os matches do usuário
   */
  async getMatches(userId: string): Promise<Profile[]> {
    const userDoc = await this.db.collection('profiles').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userData = userDoc.data() as Profile;
    const matches = userData.matches || [];

    if (matches.length === 0) {
      return [];
    }

    // Buscar perfis dos matches
    const matchProfiles = await Promise.all(
      matches.map(async (matchId) => {
        try {
          return await this.findOne(matchId);
        } catch (error) {
          console.error(`Erro ao buscar match ${matchId}:`, error);
          return null;
        }
      }),
    );

    return matchProfiles.filter((profile) => profile !== null) as Profile[];
  }

  /**
   * Retorna os usuários que o usuário deu like
   */
  async getLikes(userId: string): Promise<Profile[]> {
    const userDoc = await this.db.collection('profiles').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userData = userDoc.data() as Profile;
    const likedUsers = userData.likedUsers || [];

    if (likedUsers.length === 0) {
      return [];
    }

    // Buscar perfis dos usuários que receberam like
    const likedProfiles = await Promise.all(
      likedUsers.map(async (likedUserId) => {
        try {
          return await this.findOne(likedUserId);
        } catch (error) {
          console.error(`Erro ao buscar usuário ${likedUserId}:`, error);
          return null;
        }
      }),
    );

    return likedProfiles.filter((profile) => profile !== null) as Profile[];
  }
}
