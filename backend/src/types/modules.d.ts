// src/types/modules.d.ts

declare module 'express' {
  import { IncomingHttpHeaders } from 'http';

  export interface Request {
    body: any;
    params: Record<string, string>;
    query: Record<string, string | string[]>;
    headers: IncomingHttpHeaders & { authorization?: string };
    user?: { id: string; role: string };
  }

  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body?: any): Response;
  }

  export type NextFunction = (err?: unknown) => void;

  export interface Router {
    use(...handlers: any[]): Router;
    get(path: string, ...handlers: any[]): Router;
    post(path: string, ...handlers: any[]): Router;
    put(path: string, ...handlers: any[]): Router;
    delete(path: string, ...handlers: any[]): Router;
  }

  export interface Application extends Router {
    listen(port: number, callback?: () => void): Application;
  }

  export interface ExpressStatic {
    (): Application;
    Router(): Router;
    json(): any;
    urlencoded(options: any): any;
  }

  export function Router(): Router;

  const express: ExpressStatic;
  export default express;
  export { Application, Request, Response, NextFunction };
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: string };
  }
}

declare module 'cors' {
  import { Request, Response, NextFunction } from 'express';

  export interface CorsOptions {
    origin?: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials?: boolean;
  }

  export default function cors(options?: CorsOptions): (req: Request, res: Response, next: NextFunction) => void;
}

declare module 'helmet' {
  import { Request, Response, NextFunction } from 'express';
  export default function helmet(): (req: Request, res: Response, next: NextFunction) => void;
}

declare module 'morgan' {
  import { Request, Response } from 'express';
  type Handler = (req: Request, res: Response, next: () => void) => void;
  interface MorganStatic {
    (format: string): Handler;
  }
  const morgan: MorganStatic;
  export default morgan;
}

declare module 'express-validator' {
  import { Request, Response, NextFunction } from 'express';
  export type ValidationChain = (req: Request, res: Response, next: NextFunction) => void;
  export function body(field: string): {
    isEmail(): ValidationChain;
    isLength(options: { min?: number }): ValidationChain;
    isIn(values: string[]): ValidationChain;
    notEmpty(): ValidationChain;
  };
  export function validationResult(req: Request): {
    isEmpty(): boolean;
    array(): Array<{ msg: string; param: string }>;
  };
}

declare module 'bcrypt' {
  export function hash(value: string, rounds: number): Promise<string>;
  export function compare(value: string, hash: string): Promise<boolean>;
}

declare module 'jsonwebtoken' {
  export type Secret = string;
  export interface SignOptions {
    expiresIn?: string | number;
  }
  export interface VerifyOptions {
    algorithms?: string[];
  }
  export interface JwtPayload {
    [key: string]: any;
  }
  export function sign(payload: string | object | Buffer, secret: Secret, options?: SignOptions): string;
  export function verify(token: string, secret: Secret, options?: VerifyOptions): string | JwtPayload;
  const _default: {
    sign: typeof sign;
    verify: typeof verify;
  };
  export default _default;
}

declare module 'uuid' {
  export function v4(): string;
}

declare module 'dotenv' {
  export function config(): void;
}

declare module 'dotenv/config';
