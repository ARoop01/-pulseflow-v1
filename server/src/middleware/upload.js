import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

function isR2Configured() {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY &&
    process.env.R2_SECRET_KEY &&
    process.env.R2_BUCKET
  );
}

// Always use memory storage — we handle persistence ourselves in persistFile()
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Middleware that runs after upload.single() to persist the file
// either to Cloudflare R2 (production) or local disk (development)
export async function persistFile(req, res, next) {
  if (!req.file) return next();

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;

  try {
    if (isR2Configured()) {
      const r2 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY,
          secretAccessKey: process.env.R2_SECRET_KEY,
        },
      });

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: filename,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      // R2_PUBLIC_URL should be the Cloudflare public bucket domain
      req.file.fileUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;
    } else {
      // Fallback: save to local uploads directory
      const uploadsDir = path.join(__dirname, '../../../uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, filename), req.file.buffer);
      req.file.fileUrl = `/uploads/${filename}`;
    }

    next();
  } catch (err) {
    next(err);
  }
}
