import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto, ListCommentsQuery, UpdateCommentDto } from './dto/comment.dto';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Comment } from './entities/comment.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class CommentsService {
  constructor(@Inject(FIRESTORE) private readonly db: any) {}

  async create(
    createCommentDto: CreateCommentDto,
    uid: string,
    authorName: string,
  ): Promise<Comment> {
    const now = new Date();

    // Verifica se o post existe
    const postRef = this.db.collection('posts').doc(createCommentDto.postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      throw new NotFoundException('Post não encontrado');
    }

    const comment: Comment = {
      id: '',
      postId: createCommentDto.postId,
      content: createCommentDto.content,
      authorId: uid,
      authorName: authorName,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      likedBy: [],
    };

    const docRef = await this.db.collection('comments').add(comment);
    const createdComment = { ...comment, id: docRef.id };

    await docRef.update({ id: docRef.id });

    // Incrementa o contador de comentários no post
    const postData = postDoc.data();
    await postRef.update({
      comments: (postData.comments || 0) + 1,
      updatedAt: now,
    });

    return createdComment;
  }

  async findAll(query?: ListCommentsQuery): Promise<Comment[]> {
    let ref: admin.firestore.Query = this.db.collection('comments');

    if (query?.postId) {
      ref = ref.where('postId', '==', query.postId);
    }

    if (query?.authorId) {
      ref = ref.where('authorId', '==', query.authorId);
    }

    // Ordenação por data de criação (mais recente primeiro)
    ref = ref.orderBy('createdAt', 'desc');

    // Paginação
    const limit = query?.limit || 50;
    const offset = query?.offset || 0;
    ref = ref.limit(limit).offset(offset);

    const snap = await ref.get();
    return snap.docs.map((d) => d.data() as Comment);
  }

  async findOne(id: string): Promise<Comment> {
    const doc = await this.db.collection('comments').doc(id).get();
    if (!doc.exists) throw new NotFoundException('Comentário não encontrado');
    return doc.data() as Comment;
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    uid: string,
  ): Promise<Comment> {
    const ref = this.db.collection('comments').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new NotFoundException('Comentário não encontrado');
    }

    const comment = doc.data() as Comment;

    if (comment.authorId !== uid) {
      throw new ForbiddenException('Você só pode atualizar seus próprios comentários');
    }

    const updateData = {
      content: updateCommentDto.content,
      updatedAt: new Date(),
    };

    await ref.update(updateData as Record<string, unknown>);
    const updated = await ref.get();
    return updated.data() as Comment;
  }

  async remove(id: string, uid: string): Promise<void> {
    const ref = this.db.collection('comments').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new NotFoundException('Comentário não encontrado');
    }

    const comment = doc.data() as Comment;

    if (comment.authorId !== uid) {
      throw new ForbiddenException('Você só pode deletar seus próprios comentários');
    }

    // Decrementa o contador de comentários no post
    const postRef = this.db.collection('posts').doc(comment.postId);
    const postDoc = await postRef.get();

    if (postDoc.exists) {
      const postData = postDoc.data();
      await postRef.update({
        comments: Math.max(0, (postData.comments || 0) - 1),
        updatedAt: new Date(),
      });
    }

    await ref.delete();
  }

  async likeComment(id: string, uid: string): Promise<Comment> {
    const ref = this.db.collection('comments').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new NotFoundException('Comentário não encontrado');
    }

    const comment = doc.data() as Comment;
    const likedBy = comment.likedBy || [];

    if (likedBy.includes(uid)) {
      // Remove o like se já tiver dado like
      const newLikedBy = likedBy.filter((userId) => userId !== uid);
      await ref.update({
        likedBy: newLikedBy,
        likes: newLikedBy.length,
        updatedAt: new Date(),
      });
    } else {
      // Adiciona o like se não tiver
      const newLikedBy = [...likedBy, uid];
      await ref.update({
        likedBy: newLikedBy,
        likes: newLikedBy.length,
        updatedAt: new Date(),
      });
    }

    const updated = await ref.get();
    return updated.data() as Comment;
  }
}
