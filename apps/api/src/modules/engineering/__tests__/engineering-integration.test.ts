/**
 * Engineering Platform Integration Tests
 * Uses vitest (as configured in the project)
 */

import { describe, expect, it } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { calculationsService } from '../calculations/calculations.service';
import { productClassesService } from '../product-classes/product-classes.service';
import { rulesEngineService } from '../rules/rules-engine.service';
import { validationGatesService } from '../validation/validation-gates.service';

describe('Engineering Platform Integration Tests', () => {
  describe('Product Classes', () => {
    it('should have seed data', async () => {
      const classes = await prisma.productClass.findMany();
      expect(classes.length).toBeGreaterThan(0);
    });

    it('should get product classes', async () => {
      const classes = await productClassesService.getAll();
      expect(classes).toBeDefined();
      expect(Array.isArray(classes)).toBe(true);
    });

    it('should get product class by id', async () => {
      const classes = await prisma.productClass.findMany();
      if (classes.length > 0) {
        const cls = await productClassesService.getById(classes[0].id);
        expect(cls).toBeDefined();
        expect(cls.code).toBeDefined();
      }
    });
  });

  describe('Engineering Rules', () => {
    it('should have seed rules', async () => {
      const rules = await prisma.engineeringRule.findMany();
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should evaluate rules', async () => {
      const project = await prisma.project.findFirst();
      if (project) {
        const results = await rulesEngineService.evaluateRules({
          projectId: project.id,
          params: {
            heatingPower: 10,
            volume: 5,
            specificPower: 1.5,
          },
        });

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      }
    });

    it('should check blockers', async () => {
      const project = await prisma.project.findFirst();
      if (project) {
        const result = await rulesEngineService.checkBlockers(project.id);
        expect(result).toBeDefined();
        expect(result.blocked).toBeDefined();
        expect(Array.isArray(result.blockers)).toBe(true);
      }
    });
  });

  describe('Validation Gates', () => {
    it('should have seed gates', async () => {
      const gates = await prisma.validationGate.findMany();
      expect(gates.length).toBeGreaterThan(0);
    });

    it('should get gates', async () => {
      const gates = await validationGatesService.getGates();
      expect(gates).toBeDefined();
      expect(Array.isArray(gates)).toBe(true);
    });

    it('should get project gates status', async () => {
      const project = await prisma.project.findFirst();
      if (project) {
        const status = await validationGatesService.getProjectGatesStatus(project.id);

        expect(status).toBeDefined();
        expect(status.projectId).toBe(project.id);
        expect(status.gates).toBeDefined();
        expect(status.overallProgress).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Calculation Blocks', () => {
    it('should have seed blocks', async () => {
      const blocks = await prisma.calculationBlock.findMany();
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should get blocks', async () => {
      const blocks = await calculationsService.getBlocks();
      expect(blocks).toBeDefined();
      expect(Array.isArray(blocks)).toBe(true);
    });

    it('should execute thermal calculation', async () => {
      const project = await prisma.project.findFirst();
      const user = await prisma.user.findFirst();

      if (project && user) {
        const result = await calculationsService.execute({
          projectId: project.id,
          blockCode: 'THERM-HEAT-BALANCE',
          inputs: {
            volume: 5,
            targetTemp: 80,
            ambientTemp: 20,
            insulationThickness: 100,
          },
          executedBy: user.id,
        });

        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(['SUCCESS', 'WARNING', 'FAILED']).toContain(result.status);

        if (result.status === 'SUCCESS') {
          expect(result.outputs).toBeDefined();
          expect(result.outputs?.requiredPower).toBeGreaterThan(0);
        }
      }
    });
  });
});
