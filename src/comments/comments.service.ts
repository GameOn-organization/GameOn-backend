import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FIRESTORE } from '../firebase/firebase.providers'
import { Comment } from './entities/comment.entity'

@Injectable()
export class CommentsService {
  constructor(@Inject(FIRESTORE) private readonly db: any) { }

  async create(createCommentDto: CreateCommentDto, uid: string, authorName: string): Promise<Comment> {
    const now = new Date()
    const comment: Comment = {
      id: '', // definido pelo FIRESTORE
      postId: createCommentDto.postId,
      content: createCommentDto.content,
      authorId: uid,
      authorName: authorName,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      likedBy: [],
    };

    // Verificar se o post existe
    const postRef = this.db.collection('posts').doc(createCommentDto.postId)
    const postDoc = await postRef.get()
    if (!postDoc.exists) {
      throw new NotFoundException('Post not found')
    }

    // Criar comentário
    const docRef = await this.db.collection('comments').add(comment)
    const createdComment = { ...comment, id: docRef.id };
    await docRef.update({ id: docRef.id })

    // Incrementar contador de comentários no post
    const post = postDoc.data()
    await postRef.update({
      comments: (post.comments || 0) + 1,
      updatedAt: now
    })

    return createdComment;
  }

  async findByPost(postId: string): Promise<Comment[]> {
    const snap = await this.db
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'desc')
      .get()
    
    return snap.docs.map((d) => d.data() as Comment)
  }

  async findOne(id: string): Promise<Comment> {
    const doc = await this.db.collection('comments').doc(id).get()
    if (!doc.exists) throw new NotFoundException('Comment not found')
    return doc.data() as Comment
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, uid: string): Promise<Comment> {
    const ref = this.db.collection('comments').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Comment not found')

    const comment = doc.data() as Comment
    if (comment.authorId !== uid) {
      throw new ForbiddenException('You can only update your own comments')
    }

    const updateData = {
      ...updateCommentDto,
      updatedAt: new Date(),
    }

    await ref.update(updateData as Record<string, unknown>)
    const updated = await ref.get()
    return updated.data() as Comment;
  }

  async remove(id: string, uid: string): Promise<void> {
    const ref = this.db.collection('comments').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Comment not found')

    const comment = doc.data() as Comment
    if (comment.authorId !== uid) {
      throw new ForbiddenException('You can only delete your own comments')
    }

    // Decrementar contador de comentários no post
    const postRef = this.db.collection('posts').doc(comment.postId)
    const postDoc = await postRef.get()
    if (postDoc.exists) {
      const post = postDoc.data()
      await postRef.update({
        comments: Math.max((post.comments || 1) - 1, 0),
        updatedAt: new Date()
      })
    }

    await ref.delete()
  }

  async likeComment(id: string, uid: string): Promise<Comment> {
    const ref = this.db.collection('comments').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new NotFoundException('Comment not found')

    const comment = doc.data() as Comment
    const likedBy = comment.likedBy || []

    if (likedBy.includes(uid)) {
      // remove o like se já tiver dado like 
      const newLikedBy = likedBy.filter(userId => userId !== uid)
      await ref.update({
        likedBy: newLikedBy,
        likes: newLikedBy.length,
        updatedAt: new Date(),
      })
    } else {
      //adiciona o like se não tiver
      const newLikedBy = [...likedBy, uid]
      await ref.update({
        likedBy: newLikedBy,
        likes: newLikedBy.length,
        updatedAt: new Date(),
      })
    }

    const updated = await ref.get()
    return updated.data() as Comment
  }
}

