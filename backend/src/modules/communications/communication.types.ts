export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
