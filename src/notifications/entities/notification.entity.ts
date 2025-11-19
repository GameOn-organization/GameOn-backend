export type Notification = {
  id: string;
  userId: string; // Usuário que recebe a notificação
  fromUserId: string; // Usuário que gerou a notificação
  fromUsername: string; // Nome do usuário que gerou a notificação
  fromUserAvatar?: string; // Avatar do usuário que gerou a notificação
  action: string; // Ação realizada (ex: "Curtiu sua publicação", "NOVO MATCH!", etc)
  category: string; // Categoria: "MATCH!", "Equipes", "Eventos", "Comunidade"
  thumbnail?: string; // URL da thumbnail (opcional)
  read: boolean; // Se a notificação foi lida
  createdAt: Date;
  updatedAt: Date;
  relatedPostId?: string; // ID do post relacionado (se aplicável)
  relatedCommentId?: string; // ID do comentário relacionado (se aplicável)
}

