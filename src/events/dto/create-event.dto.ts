import { z } from 'zod'

const EventLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(500).optional(),
})

export const CreateEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título não deve passar de 200 caracteres'),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(2000, 'Descrição não deve passar de 2000 caracteres'),
  price: z
    .string()
    .min(1, 'Preço é obrigatório')
    .max(50, 'Preço não deve passar de 50 caracteres'),
  image: z.string().url().optional(),
  imagePlaceholderText: z.string().max(100).optional(),
  imagePlaceholderSubtext: z.string().max(100).optional(),
  location: EventLocationSchema,
  eventType: z.enum(['physical', 'digital']).default('physical'),
  category: z.string().min(1).max(100).default('Geral'),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  maxParticipants: z.number().int().positive().optional(),
  markerColor: z.string().max(20).optional(),
})

export type CreateEventDto = z.infer<typeof CreateEventSchema>

export const UpdateEventSchema = CreateEventSchema.partial()

export type UpdateEventDto = z.infer<typeof UpdateEventSchema>

export const ListEventsQuerySchema = z.object({
  creatorId: z.string().min(1).optional(),
  eventType: z.enum(['physical', 'digital']).optional(),
  category: z.string().optional(),
  minDate: z.coerce.date().optional(),
  maxDate: z.coerce.date().optional(),
  isActive: z.coerce.boolean().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().positive().optional(), // radius in km
  orderBy: z.enum(['createdAt', 'date', 'rating', 'participants']).default('date'),
  orderDirection: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>