export type EventLocation = {
  latitude: number;
  longitude: number;
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