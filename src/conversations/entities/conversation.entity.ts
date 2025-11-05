export type conversation = {
  id: string,
  participants: string[],
  lastMessage: {
    text: string,
    senderId: string,
    timestamp: Date
  },
  createdAt: Date,
}
