import { randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '../../lib/prisma';
import { activityLogService } from '../activity-log/activity-log.service';

// Разрешённые типы файлов
const ALLOWED_MIME_TYPES = [
  // Документы
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Изображения
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  // Архивы
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Текст
  'text/plain',
  'text/csv',
  // CAD
  'application/acad',
  'application/x-autocad',
  'image/vnd.dwg',
  'image/vnd.dxf',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const UPLOAD_DIR = '/app/uploads';

interface UploadData {
  projectId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

/**
 * AttachmentsService - сервис для работы с файлами проектов
 * Обеспечивает загрузку, получение и удаление файлов
 */
export class AttachmentsService {
  /**
   * Загрузить файл к проекту
   */
  async upload(data: UploadData) {
    // Валидация размера
    if (data.size > MAX_FILE_SIZE) {
      throw new Error(`Максимальный размер файла: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Валидация типа
    if (!ALLOWED_MIME_TYPES.includes(data.mimeType)) {
      throw new Error('Тип файла не разрешён. ' + 'Разрешены: PDF, DOC, XLS, изображения, архивы');
    }

    // Проверяем что проект существует
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error('Проект не найден');
    }

    // Генерируем уникальное имя файла
    const ext = data.originalName.split('.').pop();
    const uniqueName = `${randomBytes(16).toString('hex')}.${ext}`;
    const projectDir = join(UPLOAD_DIR, data.projectId);
    const filePath = join(projectDir, uniqueName);

    // Создаём директорию проекта
    await mkdir(projectDir, { recursive: true });

    // Сохраняем файл
    await writeFile(filePath, data.buffer);

    // Сохраняем в БД
    return prisma.attachment
      .create({
        data: {
          filename: uniqueName,
          originalName: data.originalName,
          mimeType: data.mimeType,
          size: data.size,
          path: filePath,
          projectId: data.projectId,
          uploadedById: data.userId,
        },
        include: {
          uploadedBy: {
            select: {
              fullName: true,
              username: true,
            },
          },
        },
      })
      .then((attachment) => {
        // Логируем загрузку файла
        activityLogService
          .log({
            action: 'FILE_UPLOADED',
            entityType: 'Attachment',
            entityId: attachment.id,
            entityName: data.originalName,
            userId: data.userId,
            projectId: data.projectId,
          })
          .catch(() => {
            // Игнорируем ошибки логирования
          });
        return attachment;
      });
  }

  /**
   * Получить все файлы проекта
   */
  async getByProject(projectId: string) {
    return prisma.attachment.findMany({
      where: { projectId },
      include: {
        uploadedBy: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получить файл по ID
   */
  async getById(id: string) {
    return prisma.attachment.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Удалить файл
   */
  async delete(id: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });

    if (!attachment) {
      throw new Error('Файл не найден');
    }

    // Удаляем файл с диска
    try {
      await unlink(attachment.path);
    } catch (err) {
      console.warn('File already deleted:', err);
    }

    // Удаляем из БД
    return prisma.attachment.delete({
      where: { id },
    });
  }

  /**
   * Получить количество файлов проекта
   */
  async getCount(projectId: string): Promise<number> {
    return prisma.attachment.count({
      where: { projectId },
    });
  }
}
