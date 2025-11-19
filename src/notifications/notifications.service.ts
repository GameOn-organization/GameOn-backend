import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto, ListNotificationsQuery } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FIRESTORE } from '../firebase/firebase.providers';
import { Notification } from './entities/notification.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  constructor(@Inject(FIRESTORE) private readonly db: any) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const now = new Date();
    const notification: Notification = {
      id: '', // definido pelo FIRESTORE
      userId: createNotificationDto.userId,
      fromUserId: createNotificationDto.fromUserId,
      fromUsername: createNotificationDto.fromUsername,
      fromUserAvatar: createNotificationDto.fromUserAvatar,
      action: createNotificationDto.action,
      category: createNotificationDto.category,
      thumbnail: createNotificationDto.thumbnail,
      read: false,
      createdAt: now,
      updatedAt: now,
      relatedPostId: createNotificationDto.relatedPostId,
      relatedCommentId: createNotificationDto.relatedCommentId,
    };

    const docRef = await this.db.collection('notifications').add(notification);
    const createdNotification = { ...notification, id: docRef.id };

    await docRef.update({ id: docRef.id });

    return createdNotification;
  }

  async findAll(query?: ListNotificationsQuery): Promise<Notification[]> {
    let ref: admin.firestore.Query = this.db.collection('notifications');

    // Aplicar filtros
    if (query?.userId) {
      ref = ref.where('userId', '==', query.userId);
    }
    if (query?.category) {
      ref = ref.where('category', '==', query.category);
    }
    if (query?.read !== undefined) {
      ref = ref.where('read', '==', query.read);
    }

    // Aplicar ordenação (mais recentes primeiro)
    ref = ref.orderBy('createdAt', 'desc');

    // Aplicar paginação (Firestore não suporta offset diretamente, então usamos apenas limit)
    const limit = query?.limit || 50;
    ref = ref.limit(limit);

    const snap = await ref.get();
    return snap.docs.map((d) => d.data() as Notification);
  }

  async findByUser(userId: string, query?: ListNotificationsQuery): Promise<Notification[]> {
    const queryWithUser: ListNotificationsQuery = query
      ? { ...query, userId }
      : {
          userId,
          limit: 50,
          offset: 0,
        };

    return this.findAll(queryWithUser);
  }

  async findOne(id: string): Promise<Notification> {
    const doc = await this.db.collection('notifications').doc(id).get();
    if (!doc.exists) throw new NotFoundException('Notification not found');
    return doc.data() as Notification;
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
    return updated.data() as Notification;
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

  async getUnreadCount(userId: string): Promise<number> {
    const ref = this.db
      .collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false);

    const snap = await ref.get();
    return snap.size;
  }
}

