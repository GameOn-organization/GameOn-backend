import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, ListUsersQuery } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Profile } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@Inject(FIRESTORE) private readonly db: any) {}

  async create(createUserDto: CreateUserDto, uid: string): Promise<Profile> {
    const profile: Profile = { id: uid, ...createUserDto } as Profile;
    await this.db.collection('profiles').doc(uid).set(profile);
    return profile;
  }

  async findAll(query?: ListUsersQuery): Promise<Profile[]> {
    let ref: FirebaseFirestore.Query = this.db.collection('profiles');

    const filters = [
      () => query?.tag && ref.where('tags', 'array-contains', query.tag),
      () => query?.tagsAny && ref.where('tags', 'array-contains-any', 
        (Array.isArray(query.tagsAny) ? query.tagsAny : [query.tagsAny]).slice(0, 10)),
      () => query?.minAge !== undefined && ref.where('age', '>=', query.minAge),
      () => query?.maxAge !== undefined && ref.where('age', '<=', query.maxAge),
      () => query?.name && ref.where('name', '==', query.name),
    ];

    ref = filters.reduce((acc, filter) => filter() || acc, ref);

    const snap = await ref.get();
    return snap.docs.map((d) => d.data() as Profile);
  }

  async findOne(id: string): Promise<Profile> {
    const doc = await this.db.collection('profiles').doc(id).get();
    if (!doc.exists) throw new NotFoundException('Profile not found');
    return doc.data() as Profile;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Profile> {
    const ref = this.db.collection('profiles').doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Profile not found');
    await ref.update(updateUserDto as Record<string, unknown>);
    const updated = await ref.get();
    return updated.data() as Profile;
  }

  async findByTag(tag: string): Promise<Profile[]> {
    const snap = await this.db
      .collection('profiles')
      .where('tags', 'array-contains', tag)
      .get();
    return snap.docs.map((d) => d.data() as Profile);
  }

  async remove(id: string): Promise<void> {
    await this.db.collection('profiles').doc(id).delete();
  }

  async getMyProfile(uid: string): Promise<Profile> {
    return this.findOne(uid);
  }

  async updateMyProfile(uid: string, updateUserDto: UpdateUserDto): Promise<Profile> {
    return this.update(uid, updateUserDto);
  }
}
