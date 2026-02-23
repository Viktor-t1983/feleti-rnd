import { VM } from 'vm2';

/**
 * Безопасный вычислитель формул с sandboxing
 * Использует vm2 для изоляции выполнения кода
 */
export class SafeFormulaEvaluator {
  /**
   * White-list разрешённых Math функций
   */
  private readonly ALLOWED_MATH_FUNCTIONS = {
    // Базовые
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    trunc: Math.trunc,
    sign: Math.sign,

    // Степени и корни
    pow: Math.pow,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,

    // Тригонометрия
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,

    // Логарифмы
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,
    log1p: Math.log1p,
    exp: Math.exp,
    expm1: Math.expm1,

    // Min/Max
    min: Math.min,
    max: Math.max,

    // Константы
    PI: Math.PI,
    E: Math.E,
    LN2: Math.LN2,
    LN10: Math.LN10,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
    SQRT1_2: Math.SQRT1_2,
    SQRT2: Math.SQRT2,
  };

  /**
   * White-list разрешённых глобальных функций
   */
  private readonly ALLOWED_GLOBALS = {
    // Только безопасные функции
    isFinite,
    isNaN,
    parseFloat,
    parseInt,
  };

  /**
   * Timeout для выполнения (мс)
   */
  private readonly EXECUTION_TIMEOUT = 1000; // 1 секунда

  /**
   * Создать VM с безопасным контекстом
   */
  private createSandbox(variables: Record<string, number>): VM {
    const vm = new VM({
      timeout: this.EXECUTION_TIMEOUT,
      sandbox: {
        // Переменные расчёта
        ...variables,

        // Math функции
        ...this.ALLOWED_MATH_FUNCTIONS,

        // Глобальные функции
        ...this.ALLOWED_GLOBALS,

        // Дополнительные утилиты
        clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
      },
    });

    return vm;
  }

  /**
   * Валидация формулы перед выполнением
   */
  private validateFormula(formula: string): {
    valid: boolean;
    error?: string;
  } {
    // Проверка на пустоту
    if (!formula || formula.trim().length === 0) {
      return {
        valid: false,
        error: 'Формула пустая',
      };
    }

    // Проверка на длину
    if (formula.length > 1000) {
      return {
        valid: false,
        error: 'Формула слишком длинная (max 1000 символов)',
      };
    }

    // Запрещённые паттерны
    const forbiddenPatterns = [
      /require\s*\(/, // require()
      /import\s+/, // import
      /export\s+/, // export
      /eval\s*\(/, // eval()
      /Function\s*\(/, // Function()
      /setTimeout\s*\(/, // setTimeout
      /setInterval\s*\(/, // setInterval
      /process\./, // process
      /global\./, // global
      /console\./, // console (опционально)
      /__dirname/, // __dirname
      /__filename/, // __filename
      /child_process/, // child_process
      /fs\./, // fs
      /net\./, // net
      /http\./, // http
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(formula)) {
        return {
          valid: false,
          error: `Недопустимая конструкция: ${pattern.source}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Вычислить формулу (основной метод)
   */
  evaluate(formula: string, variables: Record<string, number>): number {
    // Валидация формулы
    const validation = this.validateFormula(formula);
    if (!validation.valid) {
      throw new Error(`Недопустимая формула: ${validation.error}`);
    }

    // Валидация переменных
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value !== 'number' || !isFinite(value)) {
        throw new Error(`Недопустимое значение переменной "${key}": ${value}`);
      }
    }

    try {
      // Создаём sandbox
      const vm = this.createSandbox(variables);

      // Выполняем формулу в sandbox
      const result = vm.run(formula);

      // Проверяем результат
      if (typeof result !== 'number') {
        throw new Error(`Результат должен быть числом, получено: ${typeof result}`);
      }

      if (!isFinite(result)) {
        throw new Error(`Недопустимый результат: ${result}`);
      }

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Обработка timeout
      if (errorMessage.includes('timeout')) {
        throw new Error(`Timeout выполнения формулы (>${this.EXECUTION_TIMEOUT}ms)`);
      }

      // Обработка других ошибок
      throw new Error(`Ошибка выполнения формулы: ${errorMessage}`);
    }
  }

  /**
   * Вычислить несколько формул с зависимостями
   */
  evaluateMultiple(
    formulae: Record<string, string>,
    variables: Record<string, number>
  ): Record<string, number> {
    const results: Record<string, number> = {};

    // Копируем начальные переменные
    const allVars = { ...variables };

    // Вычисляем последовательно
    // Результаты предыдущих становятся доступны для следующих
    for (const [name, formula] of Object.entries(formulae)) {
      try {
        const result = this.evaluate(formula, allVars);
        results[name] = result;
        allVars[name] = result; // Добавляем результат в контекст
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Ошибка в формуле "${name}": ${errorMessage}`);
      }
    }

    return results;
  }

  /**
   * Проверка синтаксиса формулы (без выполнения)
   */
  validate(formula: string): {
    valid: boolean;
    error?: string;
  } {
    // Валидация паттернов
    const validation = this.validateFormula(formula);
    if (!validation.valid) {
      return validation;
    }

    // Проверка синтаксиса через dry-run
    try {
      const vm = this.createSandbox({});

      // Пробуем скомпилировать
      vm.run(`(() => { return ${formula}; })()`);

      return { valid: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Получить список доступных функций
   */
  getAvailableFunctions(): string[] {
    return [
      ...Object.keys(this.ALLOWED_MATH_FUNCTIONS),
      ...Object.keys(this.ALLOWED_GLOBALS),
      'clamp',
    ];
  }
}

// Singleton instance
export const safeFormulaEvaluator = new SafeFormulaEvaluator();
