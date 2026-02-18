import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttachmentsService } from '../attachments.service';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    attachment: {
      create: vi.fn().mockResolvedValue({
        id: 'att-1',
        filename: 'test.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        projectId: 'proj-1',
        uploadedById: 'user-1',
        createdAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'att-1',
          filename: 'test.pdf',
          originalName: 'document.pdf',
          size: 1024,
          uploadedBy: {
            fullName: 'Тест Пользователь',
          },
        },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'att-1',
        path: '/uploads/test.pdf',
        originalName: 'document.pdf',
        uploadedById: 'user-1',
        project: { id: 'proj-1', name: 'Test Project' },
      }),
      delete: vi.fn().mockResolvedValue({
        id: 'att-1',
      }),
      count: vi.fn().mockResolvedValue(2),
    },
    project: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'proj-1',
        name: 'Test Project',
      }),
    },
  },
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  beforeEach(() => {
    service = new AttachmentsService();
    vi.clearAllMocks();
  });

  it('should upload file', async () => {
    const result = await service.upload({
      projectId: 'proj-1',
      userId: 'user-1',
      filename: 'test.pdf',
      originalName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test'),
    });

    expect(result).toHaveProperty('id');
    expect(result.filename).toBe('test.pdf');
  });

  it('should get project attachments', async () => {
    const files = await service.getByProject('proj-1');
    expect(Array.isArray(files)).toBe(true);
    expect(files[0]).toHaveProperty('originalName');
  });

  it('should validate file size - throw error for large file', async () => {
    const largeFile = {
      projectId: 'proj-1',
      userId: 'user-1',
      filename: 'huge.pdf',
      originalName: 'huge.pdf',
      mimeType: 'application/pdf',
      size: 50 * 1024 * 1024, // 50MB
      buffer: Buffer.from('test'),
    };

    await expect(service.upload(largeFile)).rejects.toThrow('Максимальный размер');
  });

  it('should validate file type - throw error for disallowed type', async () => {
    const execFile = {
      projectId: 'proj-1',
      userId: 'user-1',
      filename: 'virus.exe',
      originalName: 'virus.exe',
      mimeType: 'application/x-msdownload',
      size: 1024,
      buffer: Buffer.from('test'),
    };

    await expect(service.upload(execFile)).rejects.toThrow('Тип файла не разрешён');
  });

  it('should delete attachment', async () => {
    const result = await service.delete('att-1');
    expect(result).toBeDefined();
  });

  it('should get attachment by id', async () => {
    const attachment = await service.getById('att-1');
    expect(attachment).toBeDefined();
    expect(attachment?.id).toBe('att-1');
  });

  it('should get attachment count for project', async () => {
    const count = await service.getCount('proj-1');
    expect(count).toBe(2);
  });

  it('should throw error when project not found', async () => {
    const { prisma } = await import('../../../lib/prisma');
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(null);

    await expect(
      service.upload({
        projectId: 'invalid-proj',
        userId: 'user-1',
        filename: 'test.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
      })
    ).rejects.toThrow('Проект не найден');
  });

  it('should throw error when attachment not found for delete', async () => {
    const { prisma } = await import('../../../lib/prisma');
    vi.mocked(prisma.attachment.findUnique).mockResolvedValueOnce(null);

    await expect(service.delete('invalid-att')).rejects.toThrow('Файл не найден');
  });
});
