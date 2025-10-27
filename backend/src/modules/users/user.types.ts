import { UserRole } from '../auth/auth.types';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}
