/**
 * Market Research Module
 * B2B Intelligence System с учетом production-требований
 */

// Основной сервис
export * from './market-research.service';
export { default as marketResearchRoutes } from './market-research.routes';

// Парсеры (ядро системы)
export * from './parsers';

// Scoring (уже есть)
export * from './scoring/scoring.service';

// Answer Layer (уже есть)
export * from './answer/answer-layer.service';
