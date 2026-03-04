/**
 * ReportsService Tests
 * TDD tests for PDF generation
 */

import { describe, expect, it } from 'vitest';
import { ReportsService } from '../reports.service';

describe('ReportsService', () => {
  describe('generateProjectPDF', () => {
    it('should generate PDF buffer for project', async () => {
      const service = new ReportsService();
      const mockProject = {
        id: 'test-id',
        code: 'K-200',
        name: 'Куттер K-200',
        description: 'Тестовый проект',
        stage: 'DESIGN',
        status: 'ACTIVE',
        budget: 5000000,
        spent: 1200000,
        startDate: new Date('2024-01-01'),
        targetDate: new Date('2025-01-01'),
        creator: { fullName: 'Администратор' },
        members: [],
      };

      const buffer = await service.generateProjectPDF(mockProject);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should include project name in PDF', async () => {
      const service = new ReportsService();
      const buffer = await service.generateProjectPDF({
        id: 'test',
        code: 'TEST-1',
        name: 'Тестовый проект',
        description: 'Описание',
        stage: 'DESIGN',
        status: 'ACTIVE',
        budget: 1000000,
        spent: 500000,
        startDate: new Date(),
        targetDate: new Date(),
        creator: { fullName: 'Тест' },
        members: [],
      });

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(100);
    });
  });

  describe('generateDashboardPDF', () => {
    it('should generate dashboard PDF', async () => {
      const service = new ReportsService();
      const mockStats = {
        totalProjects: 5,
        activeProjects: 3,
        totalBudget: 22000000,
        totalSpent: 14800000,
        budgetUtilization: 67.3,
        projectsByStage: [
          { stage: 'DESIGN', _count: 1 },
          { stage: 'TESTING', _count: 1 },
        ],
      };

      const buffer = await service.generateDashboardPDF(mockStats);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
