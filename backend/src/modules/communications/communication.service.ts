import { v4 as uuid } from 'uuid';
import { Message, Notification } from './communication.types';

const messages: Message[] = [];
const notifications: Notification[] = [];

export class CommunicationService {
  listMessages(roomId: string): Message[] {
    return messages.filter((message) => message.roomId === roomId);
  }

  sendMessage(data: Omit<Message, 'id' | 'createdAt'>): Message {
    const message: Message = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString()
    };
    messages.push(message);
    return message;
  }

  listNotifications(userId: string): Notification[] {
    return notifications.filter((notification) => notification.userId === userId);
  }

  createNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const notification: Notification = {
      ...data,
      id: uuid(),
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(notification);
    return notification;
  }
}

export const communicationService = new CommunicationService();
