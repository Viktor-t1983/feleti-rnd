/**
 * Settings Service
 * Управление системными настройками с поддержкой шифрования
 */

import { prisma } from '../../lib/prisma';
import { SettingValueType, SystemSetting as PrismaSystemSetting } from '@prisma/client';
import crypto from 'crypto';

// Prisma SystemSetting type
type SystemSettingDB = PrismaSystemSetting;

// Encryption configuration
const ENCRYPTION_KEY =
  process.env['SETTINGS_ENCRYPTION_KEY'] || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

// System setting interface
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  valueType: SettingValueType;
  category: string;
  label: string;
  description: string | null;
  isEncrypted: boolean;
  updatedAt: Date;
  createdAt: Date;
}

// DTOs
export interface CreateSettingDto {
  key: string;
  value: string;
  valueType?: SettingValueType;
  category?: string;
  label: string;
  description?: string;
  isEncrypted?: boolean;
}

export interface UpdateSettingDto {
  value?: string;
  label?: string;
  description?: string;
}

/**
 * Encrypt a value using AES-256-GCM
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted format
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value using AES-256-GCM
 */
function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Get all settings (with decrypted values for encrypted settings)
 */
export async function getAllSettings(): Promise<SystemSetting[]> {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { category: 'asc' },
  });

  return (settings as SystemSettingDB[]).map((setting) => {
    if (setting.isEncrypted && setting.value) {
      try {
        return {
          ...setting,
          value: decrypt(setting.value),
        };
      } catch (error) {
        console.error(`Failed to decrypt setting ${setting.key}:`, error);
        return { ...setting, value: '***decryption-error***' };
      }
    }
    return setting as SystemSetting;
  });
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(category: string): Promise<SystemSetting[]> {
  const settings = await prisma.systemSetting.findMany({
    where: { category },
    orderBy: { label: 'asc' },
  });

  return (settings as SystemSettingDB[]).map((setting) => {
    if (setting.isEncrypted && setting.value) {
      try {
        return {
          ...setting,
          value: decrypt(setting.value),
        };
      } catch (error) {
        console.error(`Failed to decrypt setting ${setting.key}:`, error);
        return { ...setting, value: '***decryption-error***' };
      }
    }
    return setting as SystemSetting;
  });
}

/**
 * Get a single setting by key
 */
export async function getSettingByKey(key: string): Promise<SystemSetting | null> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });

  if (!setting) return null;

  if (setting.isEncrypted && setting.value) {
    try {
      return {
        ...setting,
        value: decrypt(setting.value),
      };
    } catch (error) {
      console.error(`Failed to decrypt setting ${setting.key}:`, error);
      return { ...setting, value: '***decryption-error***' };
    }
  }

  return setting as SystemSetting;
}

/**
 * Create a new setting
 */
export async function createSetting(dto: CreateSettingDto, userId: string): Promise<SystemSetting> {
  let value = dto.value;

  // Encrypt value if needed
  if (dto.isEncrypted && value) {
    value = encrypt(value);
  }

  const setting = await prisma.systemSetting.create({
    data: {
      key: dto.key,
      value,
      valueType: dto.valueType || 'STRING',
      category: dto.category || 'general',
      label: dto.label,
      description: dto.description,
      isEncrypted: dto.isEncrypted || false,
      updatedById: userId,
    },
  });

  return { ...setting, value: dto.value } as SystemSetting;
}

/**
 * Update a setting
 */
export async function updateSetting(
  key: string,
  dto: UpdateSettingDto,
  userId: string
): Promise<SystemSetting | null> {
  const existing = await prisma.systemSetting.findUnique({
    where: { key },
  });

  if (!existing) return null;

  let value = dto.value ?? existing.value;

  // Encrypt new value if setting is encrypted
  if (dto.value && existing.isEncrypted) {
    value = encrypt(dto.value);
  }

  const setting = await prisma.systemSetting.update({
    where: { key },
    data: {
      value,
      label: dto.label ?? existing.label,
      description: dto.description ?? existing.description,
      updatedById: userId,
    },
  });

  return {
    ...setting,
    value: existing.isEncrypted ? dto.value || '***encrypted***' : value,
  } as SystemSetting;
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<boolean> {
  try {
    await prisma.systemSetting.delete({
      where: { key },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get AI API keys (for internal use)
 */
export async function getAIApiKeys(): Promise<Record<string, string>> {
  const aiSettings = await prisma.systemSetting.findMany({
    where: {
      category: 'ai',
      key: { endsWith: 'api_key' },
    },
  });

  const keys: Record<string, string> = {};

  for (const setting of aiSettings) {
    if (setting.value) {
      try {
        const decryptedValue = setting.isEncrypted ? decrypt(setting.value) : setting.value;

        // Extract provider name from key (e.g., "ai.openai.api_key" -> "openai")
        const provider = setting.key.split('.')[1];
        if (provider) {
          keys[provider] = decryptedValue;
        }
      } catch (error) {
        console.error(`Failed to decrypt AI key ${setting.key}:`, error);
      }
    }
  }

  return keys;
}
