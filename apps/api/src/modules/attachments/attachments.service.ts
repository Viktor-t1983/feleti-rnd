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

  // ═══ МЕТОДЫ ДЛЯ БАЗЫ ЗНАНИЙ ═══

  /**
   * Определить провайдера по URL
   */
  private detectLinkProvider(url: string): string {
    if (!url) return 'other';
    const u = url.toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('vimeo.com')) return 'vimeo';
    if (u.includes('drive.google.com')) return 'google_drive';
    if (u.includes('disk.yandex') || u.includes('yadi.sk')) return 'yandex_disk';
    if (u.includes('sharepoint.com')) return 'sharepoint';
    if (u.includes('onedrive.live.com') || u.includes('1drv.ms')) return 'onedrive';
    if (u.startsWith('\\\\') || u.startsWith('//')) return 'network_path';
    return 'other';
  }

  /**
   * Определить mediaType по mimeType
   */
  private detectMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (
      mimeType === 'application/zip' ||
      mimeType === 'application/x-rar-compressed' ||
      mimeType === 'application/x-7z-compressed'
    )
      return 'archive';
    if (mimeType === 'image/vnd.dwg' || mimeType === 'image/vnd.dxf') return 'cad';
    return 'document';
  }

  /**
   * Загрузить файл к сущности базы знаний
   */
  async uploadToEntity(data: {
    entityType: string;
    entityId: string;
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    buffer: Buffer;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    version?: string;
    accessLevel?: string;
    validUntil?: Date;
    dataYear?: number;
  }) {
    // Валидация типа
    if (!['equipment', 'market', 'competitor'].includes(data.entityType)) {
      throw new Error(`Неверный тип сущности: ${data.entityType}`);
    }

    // Сохранить файл на диск
    const uploadDir = join(UPLOAD_DIR, data.entityType, data.entityId);
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, data.filename);
    await writeFile(filePath, data.buffer);

    const mediaType = this.detectMediaType(data.mimeType);
    const relativePath = join(data.entityType, data.entityId, data.filename);

    return prisma.attachment.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        path: relativePath,
        uploadedById: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        sourceType: 'upload',
        mediaType,
        category: data.category || 'other',
        title: data.title || data.originalName,
        description: data.description,
        tags: data.tags || [],
        version: data.version || '1.0',
        isLatest: true,
        accessLevel: data.accessLevel || 'internal',
        validUntil: data.validUntil,
        dataYear: data.dataYear,
      },
      include: {
        uploadedBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });
  }

  /**
   * Создать внешнюю ссылку (YouTube, NAS, сетевая папка)
   */
  async createExternalLink(data: {
    entityType: string;
    entityId: string;
    userId: string;
    externalUrl: string;
    sourceType: 'external_url' | 'file_link' | 'folder_link';
    mediaType: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    accessLevel?: string;
    validUntil?: Date;
    dataYear?: number;
  }) {
    if (!['equipment', 'market', 'competitor'].includes(data.entityType)) {
      throw new Error(`Неверный тип сущности: ${data.entityType}`);
    }

    const linkProvider = this.detectLinkProvider(data.externalUrl);

    return prisma.attachment.create({
      data: {
        filename: `link_${Date.now()}`,
        originalName: data.title,
        mimeType: 'application/octet-stream',
        size: 0,
        path: '',
        uploadedById: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        sourceType: data.sourceType,
        externalUrl: data.externalUrl,
        linkProvider,
        mediaType: data.mediaType,
        category: data.category || 'other',
        title: data.title,
        description: data.description,
        tags: data.tags || [],
        version: '1.0',
        isLatest: true,
        accessLevel: data.accessLevel || 'internal',
        validUntil: data.validUntil,
        dataYear: data.dataYear,
      },
      include: {
        uploadedBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });
  }

  /**
   * Получить все медиа по сущности
   */
  async getByEntity(
    entityType: string,
    entityId: string,
    filters?: {
      mediaType?: string;
      category?: string;
      onlyLatest?: boolean;
    }
  ) {
    return prisma.attachment.findMany({
      where: {
        entityType,
        entityId,
        ...(filters?.mediaType && { mediaType: filters.mediaType }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.onlyLatest !== false && { isLatest: true }),
      },
      include: {
        uploadedBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
      orderBy: [{ mediaType: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Удалить медиа базы знаний
   */
  async deleteKnowledgeAttachment(id: string, userId: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new Error('Файл не найден');

    // Проверяем права на удаление
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });
    const isAdmin = user?.role?.name === 'Admin';
    const isOwner = attachment.uploadedById === userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Нет прав для удаления');
    }

    // Удалить физический файл если это upload
    if (attachment.sourceType === 'upload' && attachment.path) {
      const fullPath = join(UPLOAD_DIR, attachment.path);
      try {
        await unlink(fullPath);
      } catch {
        console.warn('Файл не найден на диске при удалении:', fullPath);
      }
    }

    await prisma.attachment.delete({ where: { id } });
  }
}
