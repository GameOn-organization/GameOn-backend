import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto, ListPostsQuery } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FIRESTORE } from '../firebase/firebase.providers'
import { Post } from './entities/post.entity'
import * as admin from 'firebase-admin'

@Injectable()
export class PostsService {
  constructor(@Inject(FIRESTORE) private readonly db: any) { }

  async create(createPostDto: CreatePostDto, uid: string, authorName: string): Promise<Post> {
    const now = new Date()
    const post: Post = {
      id: '', //definido pelo FIRESTORE
      content: createPostDto.content,
      authorId: uid,
      authorName: authorName,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      likedBy: [],
      comments: 0,
      shares: 0,
    };

    const docRef = await this.db.collection('posts').add(post)
    const createdPost = { ...post, id: docRef.id };

    await docRef.update({ id: docRef.id })

    return createdPost;
  }

  async findAll(query?: ListPostsQuery): Promise<Post[]> {
    let ref: admin.firestore.Query = this.db.collection('posts')

    const filters = [
      () => query?.authorId && ref.where('authorId', '==', query.authorId),
      () => query?.minDate && ref.where('createdAt', '>=', query.minDate),
      () => query?.maxDate && ref.where('createdAt', '<=', query.maxDate),
    ]

    ref = filters.reduce((acc, filter) => filter() || acc, ref)

    //aplicar ordenação
    const orderBy = query?.orderBy || 'createdAt'
    const orderDirection = query?.orderDirection || 'desc'
    ref = ref.orderBy(orderBy, orderDirection)

    //aplicar paginação
    const limit = query?.limit || 20
    const offset = query?.offset || 0
    ref = ref.limit(limit).offset(offset)

    const snap = await ref.get()
    return snap.docs.map((d) => d.data() as Post)
  }

  async findOne(id: string): Promise<Post> {
    const doc = await this.db.collection('posts').doc(id).get()
    if (!doc.exists) throw new NotFoundException('Post not found')
    return doc.data() as Post
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const ref = this.db.collection('posts').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Post not found')

    const updateData = {
      ...updatePostDto,
      updatedAt: new Date(),
    }

    await ref.update(updateData as Record<string, unknown>)
    const updated = await ref.get()
    return updated.data() as Post;
  }

  async remove(id: string): Promise<void> {
    const ref = this.db.collection('posts').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new NotFoundException('Post not found')
    await this.db.collection('posts').doc(id).delete()

  }

  async likePost(id: string, uid: string): Promise<Post> {
    const ref = this.db.collection('posts').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new NotFoundException('Post not found')

    const post = doc.data() as Post
    const likedBy = post.likedBy || []

    if (likedBy.includes(uid)) {
      // remove o like se já tiver dado like 
      const newLikedBy = likedBy.filter(userId => userId !== uid)
      await ref.update({
        likedBy: newLikedBy,
        likes: newLikedBy.length,
        updatedAt: new Date(),
      })
    } else {
      //adiciona o like se Não tiver
      const newLikedBy = [...likedBy, uid]
      await ref.update({
        likedBy: newLikedBy,
        likes: newLikedBy.length,
        updatedAt: new Date(),
      })
    }

    const updated = await ref.get()
    return updated.data() as Post
  }

  async getMyPosts(uid: string, query?: ListPostsQuery): Promise<Post[]> {
    const queryWithAuthor: ListPostsQuery = query
      ? { ...query, authorId: uid }
      : {
        authorId: uid,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 20,
        offset: 0
      }

    return this.findAll(queryWithAuthor)
  }

  async removeMyPost(id: string, uid: string): Promise<void> {
    const ref = this.db.collection('posts').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Post not found')

    const post = doc.data() as Post
    if (post.authorId !== uid) {
      throw new ForbiddenException('You can only delete your own posts')
    }

    await ref.delete()
  }

}
