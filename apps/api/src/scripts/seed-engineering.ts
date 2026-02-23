import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProductClasses() {
  // eslint-disable-next-line no-console
  console.log('🏭 Создание Product Classes...');

  const classes = [
    {
      code: 'THERMAL',
      name: 'Термическая обработка',
      description: 'Оборудование для термической обработки продуктов (копчение, варка, сушка)',
      icon: '🔥',
      category: 'processing',
      typicalRequirements: [
        {
          id: 'REQ-THERM-001',
          code: 'THERM-TEMP-RANGE',
          category: 'performance',
          title: 'Диапазон температур',
          description: 'Оборудование должно обеспечивать температурный диапазон 20-120°C',
          priority: 'HIGH',
          verifiable: true,
          acceptance_criteria: ['Измерение термопарами', 'Точность ±2°C'],
        },
        {
          id: 'REQ-THERM-002',
          code: 'THERM-UNIFORMITY',
          category: 'quality',
          title: 'Равномерность нагрева',
          description: 'Отклонение температуры в объёме не более ±3°C',
          priority: 'CRITICAL',
          verifiable: true,
          acceptance_criteria: ['Тест в 9 точках объёма'],
        },
        {
          id: 'REQ-THERM-003',
          code: 'THERM-HYGIENE',
          category: 'hygiene',
          title: 'Гигиеничность',
          description: 'Все поверхности контакта - нержавеющая сталь AISI 304 или выше',
          priority: 'CRITICAL',
          verifiable: true,
          acceptance_criteria: ['Сертификаты материалов'],
        },
      ],
      calculationBlockRefs: [
        { blockCode: 'THERM-HEAT-BALANCE', required: true, order: 1 },
        { blockCode: 'THERM-POWER-CALC', required: true, order: 2 },
        { blockCode: 'AERO-CIRCULATION', required: false, order: 3 },
      ],
      kpiMetrics: [
        {
          code: 'energy_efficiency',
          name: 'Энергоэффективность',
          unit: 'kWh/kg',
          target: 0.5,
          direction: 'MINIMIZE',
        },
        {
          code: 'productivity',
          name: 'Производительность',
          unit: 'kg/h',
          target: 100,
          direction: 'MAXIMIZE',
        },
      ],
    },
    {
      code: 'MECHANICAL',
      name: 'Механическая обработка',
      description: 'Оборудование для механической обработки (куттеры, мешалки, измельчители)',
      icon: '⚙️',
      category: 'processing',
      typicalRequirements: [
        {
          id: 'REQ-MECH-001',
          code: 'MECH-CAPACITY',
          category: 'performance',
          title: 'Загрузка',
          description: 'Минимальная загрузка не менее 50 кг',
          priority: 'HIGH',
          verifiable: true,
          acceptance_criteria: ['Тест с фактической загрузкой'],
        },
        {
          id: 'REQ-MECH-002',
          code: 'MECH-SAFETY',
          category: 'safety',
          title: 'Безопасность',
          description: 'Блокировка работы при открытой крышке',
          priority: 'CRITICAL',
          verifiable: true,
          acceptance_criteria: ['Тест аварийного останова'],
        },
      ],
      calculationBlockRefs: [
        { blockCode: 'MECH-TORQUE-CALC', required: true, order: 1 },
        { blockCode: 'MECH-POWER-CALC', required: true, order: 2 },
      ],
      kpiMetrics: [
        {
          code: 'processing_time',
          name: 'Время обработки',
          unit: 'min',
          target: 5,
          direction: 'MINIMIZE',
        },
      ],
    },
    {
      code: 'HYGIENE',
      name: 'Гигиенические системы',
      description: 'Системы гигиены (санпропускники, мойки, дезинфекция)',
      icon: '🧼',
      category: 'systems',
      typicalRequirements: [
        {
          id: 'REQ-HYG-001',
          code: 'HYG-WATER-TEMP',
          category: 'performance',
          title: 'Температура воды',
          description: 'Горячая вода не менее 60°C',
          priority: 'HIGH',
          verifiable: true,
          acceptance_criteria: ['Измерение в точках выхода'],
        },
      ],
      calculationBlockRefs: [{ blockCode: 'HYG-WATER-CONSUMPTION', required: true, order: 1 }],
      kpiMetrics: [
        {
          code: 'water_efficiency',
          name: 'Расход воды',
          unit: 'L/cycle',
          target: 50,
          direction: 'MINIMIZE',
        },
      ],
    },
  ];

  for (const classData of classes) {
    await prisma.productClass.upsert({
      where: { code: classData.code },
      update: classData,
      create: classData,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Создано ${classes.length} Product Classes`);
}

async function seedEngineeringRules() {
  // eslint-disable-next-line no-console
  console.log('📏 Создание Engineering Rules...');

  const rules = [
    {
      code: 'THERM-001',
      category: 'THERMAL',
      name: 'Проверка мощности нагрева',
      description: 'Удельная мощность нагрева должна быть не менее 2.5 кВт/м³',
      rationale: 'Недостаточная мощность приведёт к долгому выходу на режим',
      condition: {
        operator: 'AND',
        conditions: [
          {
            operator: 'AND',
            comparison: {
              field: 'heatingPower',
              operator: '>',
              value: 0,
            },
          },
          {
            operator: 'AND',
            comparison: {
              field: 'volume',
              operator: '>',
              value: 0,
            },
          },
          {
            operator: 'AND',
            comparison: {
              field: 'specificPower',
              operator: '<',
              value: 2.5,
            },
          },
        ],
      },
      parameters: [
        { name: 'heatingPower', type: 'number', unit: 'kW', description: 'Мощность нагрева' },
        { name: 'volume', type: 'number', unit: 'm³', description: 'Объём камеры' },
        { name: 'specificPower', type: 'number', unit: 'kW/m³', description: 'Удельная мощность' },
      ],
      riskLevel: 'HIGH',
      action: 'WARN',
      message: 'Удельная мощность нагрева ниже рекомендуемой (2.5 кВт/м³)',
      recommendation: 'Увеличьте мощность ТЭНов или уменьшите объём камеры',
      scope: 'CALCULATION',
      active: true,
      version: '1.0',
      tags: ['thermal', 'heating', 'power'],
    },
    {
      code: 'THERM-002',
      category: 'THERMAL',
      name: 'Проверка загрузки',
      description: 'Высокая загрузка требует многозонного нагрева',
      condition: {
        operator: 'AND',
        conditions: [
          {
            operator: 'AND',
            comparison: {
              field: 'loading',
              operator: '>',
              value: 250,
            },
          },
          {
            operator: 'AND',
            comparison: {
              field: 'heatingZones',
              operator: '<',
              value: 3,
            },
          },
        ],
      },
      riskLevel: 'HIGH',
      action: 'BLOCK',
      message: 'Загрузка >250 кг требует минимум 3 зоны нагрева',
      recommendation: 'Добавьте зоны нагрева или снизьте максимальную загрузку',
      scope: 'PROJECT',
      active: true,
      version: '1.0',
      tags: ['thermal', 'loading', 'zones'],
    },
    {
      code: 'AERO-001',
      category: 'AERODYNAMIC',
      name: 'Скорость воздуха',
      description: 'Скорость воздуха должна быть в диапазоне 0.5-3.0 м/с',
      condition: {
        operator: 'OR',
        conditions: [
          {
            operator: 'AND',
            comparison: {
              field: 'airSpeed',
              operator: '<',
              value: 0.5,
            },
          },
          {
            operator: 'AND',
            comparison: {
              field: 'airSpeed',
              operator: '>',
              value: 3.0,
            },
          },
        ],
      },
      riskLevel: 'MEDIUM',
      action: 'WARN',
      message: 'Скорость воздуха вне оптимального диапазона (0.5-3.0 м/с)',
      recommendation: 'Скорректируйте мощность вентиляторов',
      scope: 'CALCULATION',
      active: true,
      version: '1.0',
      tags: ['aerodynamic', 'airflow'],
    },
    {
      code: 'MECH-001',
      category: 'MECHANICAL',
      name: 'Коэффициент запаса прочности',
      description: 'Коэффициент запаса должен быть не менее 1.5',
      condition: {
        operator: 'AND',
        comparison: {
          field: 'safetyFactor',
          operator: '<',
          value: 1.5,
        },
      },
      riskLevel: 'CRITICAL',
      action: 'BLOCK',
      message: 'Коэффициент запаса прочности < 1.5 недопустим',
      recommendation: 'Увеличьте прочность конструкции',
      scope: 'CALCULATION',
      active: true,
      version: '1.0',
      tags: ['mechanical', 'safety', 'strength'],
    },
    {
      code: 'HYG-001',
      category: 'HYGIENE',
      name: 'Уклон для отвода воды',
      description: 'Уклон дна должен быть не менее 1.5°',
      condition: {
        operator: 'AND',
        comparison: {
          field: 'floorSlope',
          operator: '<',
          value: 1.5,
        },
      },
      riskLevel: 'HIGH',
      action: 'WARN',
      message: 'Уклон дна < 1.5° приведёт к застою воды',
      recommendation: 'Увеличьте уклон до минимум 1.5°',
      scope: 'PROJECT',
      active: true,
      version: '1.0',
      tags: ['hygiene', 'drainage'],
    },
  ];

  for (const rule of rules) {
    await prisma.engineeringRule.upsert({
      where: { code: rule.code },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: rule as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: rule as any,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Создано ${rules.length} Engineering Rules`);
}

async function seedValidationGates() {
  // eslint-disable-next-line no-console
  console.log('🚪 Создание Validation Gates...');

  const gates = [
    {
      code: 'GATE-1',
      name: 'Определение продукта',
      description: 'Паспорт изделия заполнен и утверждён',
      order: 1,
      phase: 'PLANNING',
      criteria: [
        {
          id: 'G1-C1',
          type: 'DOCUMENT_EXISTS',
          description: 'Паспорт изделия загружен',
          weight: 0.4,
          required: true,
          config: { requiredCount: 1 },
        },
        {
          id: 'G1-C2',
          type: 'CUSTOM',
          description: 'Определён целевой рынок',
          weight: 0.3,
          required: true,
        },
        {
          id: 'G1-C3',
          type: 'CUSTOM',
          description: 'Определён Product Class',
          weight: 0.3,
          required: true,
        },
      ],
      passingScore: 0.8,
      blockOnFail: true,
      allowWaiver: false,
      requiresApproval: false,
      active: true,
    },
    {
      code: 'GATE-2',
      name: 'Требования определены',
      description: 'Все требования сформулированы и проверены',
      order: 2,
      phase: 'PLANNING',
      criteria: [
        {
          id: 'G2-C1',
          type: 'CUSTOM',
          description: 'Минимум 10 требований',
          weight: 0.4,
          required: true,
        },
        {
          id: 'G2-C2',
          type: 'RULE_CHECK',
          description: 'Нет конфликтов требований',
          weight: 0.6,
          required: true,
        },
      ],
      passingScore: 0.8,
      blockOnFail: true,
      allowWaiver: false,
      requiresApproval: false,
      active: true,
    },
    {
      code: 'GATE-3',
      name: 'Архитектура утверждена',
      description: 'Архитектура изделия проверена и согласована',
      order: 3,
      phase: 'DESIGN',
      criteria: [
        {
          id: 'G3-C1',
          type: 'DOCUMENT_EXISTS',
          description: 'Архитектурная схема загружена',
          weight: 0.3,
          required: true,
          config: { requiredCount: 1 },
        },
        {
          id: 'G3-C2',
          type: 'RULE_CHECK',
          description: 'Архитектура соответствует правилам',
          weight: 0.4,
          required: true,
        },
        {
          id: 'G3-C3',
          type: 'CUSTOM',
          description: 'Определены подсистемы',
          weight: 0.3,
          required: true,
        },
      ],
      passingScore: 0.8,
      blockOnFail: true,
      allowWaiver: true,
      requiresApproval: true,
      active: true,
    },
    {
      code: 'GATE-4',
      name: 'Расчёты выполнены',
      description: 'Все критичные расчёты выполнены и проверены',
      order: 4,
      phase: 'VALIDATION',
      criteria: [
        {
          id: 'G4-C1',
          type: 'CALCULATION_COMPLETE',
          description: 'Минимум 3 расчёта выполнено',
          weight: 0.5,
          required: true,
          config: { requiredCount: 3 },
        },
        {
          id: 'G4-C2',
          type: 'RULE_CHECK',
          description: 'Результаты расчётов в норме',
          weight: 0.5,
          required: true,
        },
      ],
      passingScore: 0.9,
      blockOnFail: true,
      allowWaiver: true,
      requiresApproval: true,
      active: true,
    },
    {
      code: 'GATE-5',
      name: 'Готовность к производству',
      description: 'Проект готов для передачи в производство',
      order: 5,
      phase: 'RELEASE',
      criteria: [
        {
          id: 'G5-C1',
          type: 'DOCUMENT_EXISTS',
          description: 'Комплект КД загружен',
          weight: 0.4,
          required: true,
          config: { requiredCount: 5 },
        },
        {
          id: 'G5-C2',
          type: 'RULE_CHECK',
          description: 'Нет открытых нарушений',
          weight: 0.3,
          required: true,
        },
        {
          id: 'G5-C3',
          type: 'CUSTOM',
          description: 'Все Gates 1-4 пройдены',
          weight: 0.3,
          required: true,
        },
      ],
      passingScore: 1.0,
      blockOnFail: true,
      allowWaiver: false,
      requiresApproval: true,
      active: true,
    },
  ];

  for (const gate of gates) {
    await prisma.validationGate.upsert({
      where: { code: gate.code },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: gate as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: gate as any,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Создано ${gates.length} Validation Gates`);
}

async function seedCalculationBlocks() {
  // eslint-disable-next-line no-console
  console.log('🧮 Создание Calculation Blocks...');

  const blocks = [
    {
      code: 'THERM-HEAT-BALANCE',
      category: 'THERMAL',
      name: 'Тепловой баланс',
      description: 'Расчёт требуемой мощности нагрева',
      purpose: 'Определить минимальную мощность нагревательных элементов',
      inputSchema: [
        {
          name: 'volume',
          type: 'number',
          description: 'Объём камеры',
          unit: 'm³',
          required: true,
          min: 0.1,
          max: 100,
        },
        {
          name: 'targetTemp',
          type: 'number',
          description: 'Целевая температура',
          unit: '°C',
          required: true,
          min: 20,
          max: 150,
        },
        {
          name: 'ambientTemp',
          type: 'number',
          description: 'Температура окружающей среды',
          unit: '°C',
          required: true,
          default: 20,
          min: -20,
          max: 40,
        },
        {
          name: 'insulationThickness',
          type: 'number',
          description: 'Толщина изоляции',
          unit: 'mm',
          required: true,
          default: 100,
          min: 50,
          max: 200,
        },
      ],
      outputSchema: [
        {
          name: 'requiredPower',
          type: 'number',
          description: 'Требуемая мощность',
          unit: 'kW',
        },
        {
          name: 'heatLoss',
          type: 'number',
          description: 'Потери тепла',
          unit: 'kW',
        },
        {
          name: 'specificPower',
          type: 'number',
          description: 'Удельная мощность',
          unit: 'kW/m³',
        },
      ],
      formulae: {
        heatLoss: '(targetTemp - ambientTemp) * volume * 0.8 / (insulationThickness / 100)',
        requiredPower: 'heatLoss * 1.2',
        specificPower: 'requiredPower / volume',
      },
      algorithm: 'Упрощённый расчёт тепловых потерь через изоляцию с коэффициентом запаса 1.2',
      units: {
        volume: 'm³',
        temperature: '°C',
        power: 'kW',
      },
      accuracy: '±15%',
      active: true,
      version: '1.0',
    },
    {
      code: 'THERM-POWER-CALC',
      category: 'THERMAL',
      name: 'Расчёт мощности ТЭН',
      description: 'Расчёт количества и мощности ТЭНов',
      inputSchema: [
        {
          name: 'requiredPower',
          type: 'number',
          description: 'Требуемая мощность',
          unit: 'kW',
          required: true,
          min: 1,
          max: 100,
        },
        {
          name: 'tenPower',
          type: 'number',
          description: 'Мощность одного ТЭНа',
          unit: 'kW',
          required: true,
          default: 3,
          validation: {
            enum: [1.5, 2, 3, 4, 5, 6],
          },
        },
      ],
      outputSchema: [
        {
          name: 'tenCount',
          type: 'number',
          description: 'Количество ТЭНов',
          unit: 'шт',
        },
        {
          name: 'totalPower',
          type: 'number',
          description: 'Общая мощность',
          unit: 'kW',
        },
        {
          name: 'powerReserve',
          type: 'number',
          description: 'Запас мощности',
          unit: '%',
        },
      ],
      formulae: {
        tenCount: 'Math.ceil(requiredPower / tenPower)',
        totalPower: 'tenCount * tenPower',
        powerReserve: '((totalPower - requiredPower) / requiredPower) * 100',
      },
      active: true,
      version: '1.0',
    },
    {
      code: 'AERO-CIRCULATION',
      category: 'AERODYNAMIC',
      name: 'Расчёт циркуляции',
      description: 'Расчёт параметров системы циркуляции воздуха',
      inputSchema: [
        {
          name: 'volume',
          type: 'number',
          description: 'Объём камеры',
          unit: 'm³',
          required: true,
          min: 0.1,
          max: 100,
        },
        {
          name: 'airChangesPerHour',
          type: 'number',
          description: 'Кратность воздухообмена',
          unit: '1/h',
          required: true,
          default: 30,
          min: 10,
          max: 100,
        },
      ],
      outputSchema: [
        {
          name: 'airflow',
          type: 'number',
          description: 'Расход воздуха',
          unit: 'm³/h',
        },
        {
          name: 'ventilatorPower',
          type: 'number',
          description: 'Мощность вентилятора',
          unit: 'kW',
        },
      ],
      formulae: {
        airflow: 'volume * airChangesPerHour',
        ventilatorPower: 'airflow * 0.001',
      },
      active: true,
      version: '1.0',
    },
  ];

  for (const block of blocks) {
    await prisma.calculationBlock.upsert({
      where: { code: block.code },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: block as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: block as any,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Создано ${blocks.length} Calculation Blocks`);
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Начало seed процесса Engineering Platform...\n');

  try {
    await seedProductClasses();
    await seedEngineeringRules();
    await seedValidationGates();
    await seedCalculationBlocks();

    // eslint-disable-next-line no-console
    console.log('\n✅ Seed процесс завершён успешно!');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Ошибка при seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
