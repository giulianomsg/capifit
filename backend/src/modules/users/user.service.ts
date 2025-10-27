import { v4 as uuid } from 'uuid';
import { UserProfile } from './user.types';

const users: UserProfile[] = [];

export class UserService {
  list(): UserProfile[] {
    return users;
  }

  findById(id: string): UserProfile | undefined {
    return users.find((user) => user.id === id);
  }

  create(data: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile {
    const user: UserProfile = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString()
    };
    users.push(user);
    return user;
  }

  update(id: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, updates);
    return user;
  }
}

export const userService = new UserService();
