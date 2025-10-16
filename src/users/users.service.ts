import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, ListUsersQuery } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Profile } from './entities/user.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(@Inject(FIRESTORE) private readonly db: any) { }

  async create(createUserDto: CreateUserDto, uid: string): Promise<Profile> {
    const profile: Profile = {
      id: uid,
      name: createUserDto.name,
      age: createUserDto.age,
      phone: createUserDto.phone,
      email: createUserDto.email,
      image: createUserDto.image || null,
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
      tags: data.tags || [],
    };

    return profile as Profile;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Profile> {
    const ref = this.db.collection('profiles').doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Profile not found');
    await ref.update(updateUserDto as Record<string, unknown>);
    const updated = await ref.get();
    const data = updated.data();
    const profile = {
      id: data.id,
      name: data.name,
      age: data.age || 0,
      email: data.email,
      phone: data.phone || undefined,
      image: data.image || null,
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
      console.log('🔍 Iniciando limpeza de usuários órfãos...');

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
}
