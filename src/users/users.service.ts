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
    await this.db.collection('profiles').doc(id).delete();
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
}
