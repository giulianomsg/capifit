import path from 'path';
import fs from 'fs';
import type { Request } from 'express';
import multer, { diskStorage, MulterFile, FileFilterCallback } from 'multer';
import { v4 as uuid } from 'uuid';

const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = diskStorage({
  destination(_req: Request, _file: MulterFile, cb: (error: Error | null, destination: string) => void) {
    cb(null, uploadsDir);
  },
  filename(_req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuid()}${ext}`;
    cb(null, uniqueName);
  },
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req: Request, file: MulterFile, cb: FileFilterCallback) {
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error('Invalid file type. Allowed: jpeg, png, pdf'));
  },
});

export const uploadConfig = {
  uploadsDir,
};

export default upload;
