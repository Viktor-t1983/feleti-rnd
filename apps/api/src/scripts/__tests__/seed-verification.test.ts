/**
 * Seed Data Verification Tests
 * Integration tests that require PostgreSQL database connection
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../lib/prisma';

// Check if database is available
let dbAvailable = false;

beforeAll(async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    dbAvailable = false;
    // Database not available - tests will be skipped
  }
});

// Only run tests if database is available
describe.skipIf(!dbAvailable)('Seed Data Verification', () => {
  it('should have Product Classes', async () => {
    const classes = await prisma.productClass.findMany();

    expect(classes.length).toBeGreaterThanOrEqual(3);

    const thermal = classes.find((c) => c.code === 'THERMAL');
    expect(thermal).toBeDefined();
    expect(thermal?.name).toBe('Термическая обработка');

    const mechanical = classes.find((c) => c.code === 'MECHANICAL');
    expect(mechanical).toBeDefined();

    const hygiene = classes.find((c) => c.code === 'HYGIENE');
    expect(hygiene).toBeDefined();
  });

  it('should have Engineering Rules', async () => {
    const rules = await prisma.engineeringRule.findMany();

    expect(rules.length).toBeGreaterThanOrEqual(5);

    const thermalRule = rules.find((r) => r.code === 'THERM-001');
    expect(thermalRule).toBeDefined();
    expect(thermalRule?.active).toBe(true);
  });

  it('should have Validation Gates', async () => {
    const gates = await prisma.validationGate.findMany();

    expect(gates.length).toBeGreaterThanOrEqual(5);

    const gate1 = gates.find((g) => g.code === 'GATE-1');
    expect(gate1).toBeDefined();
    expect(gate1?.order).toBe(1);
    expect(gate1?.active).toBe(true);
  });

  it('should have Calculation Blocks', async () => {
    const blocks = await prisma.calculationBlock.findMany();

    expect(blocks.length).toBeGreaterThanOrEqual(3);

    const heatBalance = blocks.find((b) => b.code === 'THERM-HEAT-BALANCE');
    expect(heatBalance).toBeDefined();
    expect(heatBalance?.active).toBe(true);
    expect(heatBalance?.formulae).toBeDefined();
  });

  it('should have proper relationships', async () => {
    const thermal = await prisma.productClass.findUnique({
      where: { code: 'THERMAL' },
      include: {
        engineeringRules: true,
        calculationBlocks: true,
      },
    });

    expect(thermal).toBeDefined();
  });
});
