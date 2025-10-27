import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { env } from '../../config/env';
import { AuthCredentials, AuthTokenPayload, UserRole } from './auth.types';

interface InMemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
}

const users: InMemoryUser[] = [];

export class AuthService {
  async register(credentials: AuthCredentials & { role: UserRole; name: string }): Promise<{ id: string; token: string }> {
    const existing = users.find((user) => user.email === credentials.email);
    if (existing) {
      throw new Error('E-mail already registered');
    }

    const passwordHash = await bcrypt.hash(credentials.password, 10);
    const id = uuid();
    users.push({
      id,
      email: credentials.email,
      passwordHash,
      role: credentials.role,
      name: credentials.name
    });

    const token = this.generateToken({ id, role: credentials.role });

    return { id, token };
  }

  async login(credentials: AuthCredentials): Promise<{ token: string; role: UserRole }> {
    const user = users.find((item) => item.email === credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({ id: user.id, role: user.role });
    return { token, role: user.role };
  }

  private generateToken(payload: AuthTokenPayload) {
    const secret: Secret = env.JWT_SECRET;
    const options: SignOptions = { expiresIn: env.JWT_EXPIRATION };
    return jwt.sign(payload, secret, options);
  }
}

export const authService = new AuthService();
