export type Post = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  likedBy: string[]
  comments: number;
  shares: number;
}
