/* eslint-disable @typescript-eslint/no-explicit-any -- Required for formula variables */
/**
 * Safe formula evaluator
 * Uses limited context for JS execution
 */

/**
 * @deprecated Использовать SafeFormulaEvaluator вместо этого
 * SECURITY WARNING: Этот класс небезопасен и будет удалён в v2.0
 *
 * Проблемы:
 * - Использует new Function() без sandboxing
 * - Позволяет выполнение произвольного JavaScript кода
 * - RCE уязвимость
 */
export class FormulaEvaluator {
  /**
   * Safe math functions
   */
  private readonly SAFE_MATH = {
    // Basic
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,

    // Powers and roots
    pow: Math.pow,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,

    // Trigonometry
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,

    // Logarithms
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,
    exp: Math.exp,

    // Min/Max
    min: Math.min,
    max: Math.max,

    // Constants
    PI: Math.PI,
    E: Math.E,
  };

  /**
   * Evaluate formula
   */
  evaluate(formula: string, variables: Record<string, number>): number {
    // Create safe context
    const context = {
      ...variables,
      ...this.SAFE_MATH,
    };

    try {
      // Create function with limited scope
      const fn = new Function(...Object.keys(context), `"use strict"; return (${formula});`);

      // Execute
      const result = fn(...Object.values(context));

      // Check result
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error(`Invalid result: ${result}`);
      }

      return result;
    } catch (error: any) {
      throw new Error(`Formula error "${formula}": ${error.message}`);
    }
  }

  /**
   * Validate formula (syntax check)
   */
  validate(formula: string): {
    valid: boolean;
    error?: string;
  } {
    try {
      // Try to create function
      new Function(`"use strict"; return (${formula});`);
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Evaluate multiple formulae
   */
  evaluateMultiple(
    formulae: Record<string, string>,
    variables: Record<string, number>
  ): Record<string, number> {
    const results: Record<string, number> = {};

    // Evaluate in dependency order
    // (simple implementation - sequentially)
    const allVars = { ...variables };

    for (const [name, formula] of Object.entries(formulae)) {
      try {
        const result = this.evaluate(formula, allVars);
        results[name] = result;
        allVars[name] = result; // Available for next
      } catch (error: any) {
        throw new Error(`Error in formula "${name}": ${error.message}`);
      }
    }

    return results;
  }
}

export const formulaEvaluator = new FormulaEvaluator();
