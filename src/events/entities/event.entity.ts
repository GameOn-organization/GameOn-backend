export type EventLocation = {
  latitude: number;
  longitude: number;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  // Campo combinado para retrocompatibilidade
  address?: string;
}

export type Event = {
  id: string;
  title: string;
  description: string;
  price: string;
  rating: number;
  distance?: string;
  image?: string;
  imagePlaceholderText?: string;
  imagePlaceholderSubtext?: string;
  location: EventLocation;
  eventType: 'physical' | 'digital';
  category: string;
  date: Date;
  endDate?: Date;
  maxParticipants?: number;
  participants: string[];
  creatorId: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  markerColor?: string;
}