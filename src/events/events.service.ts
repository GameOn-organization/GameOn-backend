import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto, ListEventsQuery, UpdateEventDto } from './dto/create-event.dto';
import { FIRESTORE } from '../firebase/firebase.providers'
import { Event } from './entities/event.entity'
import * as admin from 'firebase-admin'

@Injectable()
export class EventsService {
  constructor(@Inject(FIRESTORE) private readonly db: any) { }

  async create(createEventDto: CreateEventDto, uid: string, creatorName: string): Promise<Event> {
    const now = new Date()

    // Criar objeto base sem campos undefined
    const event: Record<string, unknown> = {
      id: '',
      title: createEventDto.title,
      description: createEventDto.description,
      price: createEventDto.price,
      rating: 0,
      location: createEventDto.location,
      eventType: createEventDto.eventType || 'physical',
      category: createEventDto.category || 'Geral',
      date: createEventDto.date,
      participants: [],
      creatorId: uid,
      creatorName: creatorName,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      markerColor: createEventDto.markerColor || (createEventDto.eventType === 'digital' ? '#8E44AD' : '#E67E22'),
    };

    // Adicionar campos opcionais apenas se definidos
    if (createEventDto.image !== undefined) event.image = createEventDto.image;
    if (createEventDto.imagePlaceholderText !== undefined) event.imagePlaceholderText = createEventDto.imagePlaceholderText;
    if (createEventDto.imagePlaceholderSubtext !== undefined) event.imagePlaceholderSubtext = createEventDto.imagePlaceholderSubtext;
    if (createEventDto.endDate !== undefined) event.endDate = createEventDto.endDate;
    if (createEventDto.maxParticipants !== undefined) event.maxParticipants = createEventDto.maxParticipants;

    const docRef = await this.db.collection('events').add(event)
    const createdEvent = { ...event, id: docRef.id } as Event;

    await docRef.update({ id: docRef.id })

    return createdEvent;
  }

  async findAll(query?: ListEventsQuery): Promise<Event[]> {
    let ref: admin.firestore.Query = this.db.collection('events')

    // Apply filters
    if (query?.creatorId) {
      ref = ref.where('creatorId', '==', query.creatorId)
    }
    if (query?.eventType) {
      ref = ref.where('eventType', '==', query.eventType)
    }
    if (query?.category) {
      ref = ref.where('category', '==', query.category)
    }
    if (query?.isActive !== undefined) {
      ref = ref.where('isActive', '==', query.isActive)
    }
    if (query?.minDate) {
      ref = ref.where('date', '>=', query.minDate)
    }
    if (query?.maxDate) {
      ref = ref.where('date', '<=', query.maxDate)
    }

    // Apply ordering
    const orderBy = query?.orderBy || 'date'
    const orderDirection = query?.orderDirection || 'asc'
    ref = ref.orderBy(orderBy, orderDirection)

    // Apply pagination
    const limit = query?.limit || 20
    const offset = query?.offset || 0
    ref = ref.limit(limit).offset(offset)

    const snap = await ref.get()
    let events = snap.docs.map((d) => d.data() as Event)

    // Filter by location if lat, lng, and radius are provided
    if (query?.lat !== undefined && query?.lng !== undefined && query?.radius) {
      events = events.filter(event => {
        if (!event.location?.latitude || !event.location?.longitude) return false
        const distance = this.calculateDistance(
          query.lat!,
          query.lng!,
          event.location.latitude,
          event.location.longitude
        )
        return distance <= query.radius!
      })
    }

    return events
  }

  async findOne(id: string): Promise<Event> {
    const doc = await this.db.collection('events').doc(id).get()
    if (!doc.exists) throw new NotFoundException('Evento não encontrado')
    return doc.data() as Event
  }

  async update(id: string, updateEventDto: UpdateEventDto, uid: string): Promise<Event> {
    const ref = this.db.collection('events').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Evento não encontrado')

    const event = doc.data() as Event
    if (event.creatorId !== uid) {
      throw new ForbiddenException('Você só pode editar eventos que você criou')
    }

    const updateData = {
      ...updateEventDto,
      updatedAt: new Date(),
    }

    await ref.update(updateData as Record<string, unknown>)
    const updated = await ref.get()
    return updated.data() as Event;
  }

  async remove(id: string, uid: string): Promise<void> {
    const ref = this.db.collection('events').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Evento não encontrado')

    const event = doc.data() as Event
    if (event.creatorId !== uid) {
      throw new ForbiddenException('Você só pode deletar eventos que você criou')
    }

    await ref.delete()
  }

  async subscribe(id: string, uid: string): Promise<Event> {
    const ref = this.db.collection('events').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Evento não encontrado')

    const event = doc.data() as Event
    const participants = event.participants || []

    if (participants.includes(uid)) {
      throw new ForbiddenException('Você já está inscrito neste evento')
    }

    if (event.maxParticipants && participants.length >= event.maxParticipants) {
      throw new ForbiddenException('Este evento já está com capacidade máxima')
    }

    const newParticipants = [...participants, uid]
    await ref.update({
      participants: newParticipants,
      updatedAt: new Date(),
    })

    const updated = await ref.get()
    return updated.data() as Event
  }

  async unsubscribe(id: string, uid: string): Promise<Event> {
    const ref = this.db.collection('events').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Evento não encontrado')

    const event = doc.data() as Event
    const participants = event.participants || []

    if (!participants.includes(uid)) {
      throw new ForbiddenException('Você não está inscrito neste evento')
    }

    const newParticipants = participants.filter(p => p !== uid)
    await ref.update({
      participants: newParticipants,
      updatedAt: new Date(),
    })

    const updated = await ref.get()
    return updated.data() as Event
  }

  async getMyEvents(uid: string, query?: ListEventsQuery): Promise<Event[]> {
    const queryWithCreator: ListEventsQuery = query
      ? { ...query, creatorId: uid }
      : {
        creatorId: uid,
        orderBy: 'date',
        orderDirection: 'asc',
        limit: 20,
        offset: 0
      }

    return this.findAll(queryWithCreator)
  }

  async getSubscribedEvents(uid: string): Promise<Event[]> {
    const snap = await this.db.collection('events')
      .where('participants', 'array-contains', uid)
      .where('isActive', '==', true)
      .orderBy('date', 'asc')
      .get()

    return snap.docs.map((d: any) => d.data() as Event)
  }

  async rateEvent(id: string, uid: string, rating: number): Promise<Event> {
    if (rating < 0 || rating > 5) {
      throw new ForbiddenException('A avaliação deve ser entre 0 e 5')
    }

    const ref = this.db.collection('events').doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new NotFoundException('Evento não encontrado')

    const event = doc.data() as Event

    // Check if user participated in the event
    if (!event.participants.includes(uid)) {
      throw new ForbiddenException('Você precisa estar inscrito no evento para avaliá-lo')
    }

    // For simplicity, we'll just update the rating (in production, you'd want a separate ratings collection)
    await ref.update({
      rating: rating,
      updatedAt: new Date(),
    })

    const updated = await ref.get()
    return updated.data() as Event
  }

  // Haversine formula to calculate distance between two points
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}