import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, ListUsersQuery } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Profile } from './entities/user.entity';
import * as admin from 'firebase-admin';
import { ConversationsService } from '../conversations/conversations.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(FIRESTORE) private readonly db: any,
    private readonly conversationsService: ConversationsService,
    private readonly notificationsService: NotificationsService,
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
      tags: createUserDto.tags || [],
      // Inicializar campos de likes e matches
      likes: [],
      likedBy: [],
      matches: []
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

  async likeUser(
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ liked: boolean; match: boolean; conversation?: any }> {
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

    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();

    const currentUserLikes = currentUserData.likes || [];
    const targetUserLikedBy = targetUserData.likedBy || [];
    const targetUserLikes = targetUserData.likes || [];

    // Verificar se já deu like
    if (currentUserLikes.includes(targetUserId)) {
      return { liked: true, match: false };
    }

    // Adicionar like
    currentUserLikes.push(targetUserId);
    targetUserLikedBy.push(currentUserId);

    // Verificar match (quando o outro usuário também deu like)
    const isMatch = targetUserLikes.includes(currentUserId);

    let conversation;
    if (isMatch) {
      // Adicionar aos matches
      const currentUserMatches = currentUserData.matches || [];
      const targetUserMatches = targetUserData.matches || [];

      currentUserMatches.push(targetUserId);
      targetUserMatches.push(currentUserId);

      await Promise.all([
        currentUserRef.update({
          likes: currentUserLikes,
          matches: currentUserMatches,
        }),
        targetUserRef.update({
          likedBy: targetUserLikedBy,
          matches: targetUserMatches,
        }),
      ]);

      // Criar conversa
      conversation = await this.conversationsService.create({
        participantes: [currentUserId, targetUserId],
        lastMessage: {
          text: 'É um match! Iniciem uma conversa.',
          senderId: 'system',
          timestamp: new Date(),
        },
        createdAt: new Date(),
      });

      // Criar notificações para ambos
      await Promise.all([
        this.notificationsService.create({
          userId: targetUserId,
          fromUserId: currentUserId,
          fromUsername: currentUserData.name || 'Usuário',
          fromUserAvatar: currentUserData.image,
          action: `É um match! Você e ${currentUserData.name} deram like um no outro.`,
          category: 'MATCH',
        }),
        this.notificationsService.create({
          userId: currentUserId,
          fromUserId: targetUserId,
          fromUsername: targetUserData.name || 'Usuário',
          fromUserAvatar: targetUserData.image,
          action: `É um match! Você e ${targetUserData.name} deram like um no outro.`,
          category: 'MATCH',
        }),
      ]);
    } else {
      // Apenas atualizar likes sem match
      await Promise.all([
        currentUserRef.update({ likes: currentUserLikes }),
        targetUserRef.update({ likedBy: targetUserLikedBy }),
      ]);
    }

    return { liked: true, match: isMatch, conversation };
  }

  async getMyMatches(currentUserId: string): Promise<Profile[]> {
    const userDoc = await this.db
      .collection('profiles')
      .doc(currentUserId)
      .get();

    if (!userDoc.exists) {
      throw new NotFoundException('Seu perfil não foi encontrado');
    }

    const userData = userDoc.data();
    const matches = userData.matches || [];

    if (matches.length === 0) {
      return [];
    }

    const matchedProfiles: Profile[] = [];
    for (const matchId of matches) {
      try {
        const profile = await this.findOne(matchId);
        matchedProfiles.push(profile);
      } catch (error) {
        console.error(`Erro ao buscar match ${matchId}:`, error);
      }
    }

    return matchedProfiles;
  }

  async getMyLikes(currentUserId: string): Promise<Profile[]> {
    const userDoc = await this.db
      .collection('profiles')
      .doc(currentUserId)
      .get();

    if (!userDoc.exists) {
      throw new NotFoundException('Seu perfil não foi encontrado');
    }

    const userData = userDoc.data();
    const likes = userData.likes || [];

    if (likes.length === 0) {
      return [];
    }

    const likedProfiles: Profile[] = [];
    for (const likeId of likes) {
      try {
        const profile = await this.findOne(likeId);
        likedProfiles.push(profile);
      } catch (error) {
        console.error(`Erro ao buscar like ${likeId}:`, error);
      }
    }

    return likedProfiles;
  }
}
