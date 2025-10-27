export type UserRole = 'admin' | 'trainer' | 'student';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  id: string;
  role: UserRole;
}
