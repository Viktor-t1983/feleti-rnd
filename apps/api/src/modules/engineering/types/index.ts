/**
 * FELETI Engineering Platform
 * Core Domain Types & Interfaces
 */

// ==========================================
// PRODUCT CLASSES
// ==========================================

export interface ProductClassDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  category: 'processing' | 'infrastructure' | 'systems';
  metadata?: Record<string, unknown>;

  typicalRequirements?: RequirementTemplate[];
  calculationBlockRefs?: CalculationBlockReference[];
  validationCriteria?: ValidationCriterion[];
  kpiMetrics?: KPIMetric[];

  parentId?: string;

  active: boolean;
  version: string;
}

export interface RequirementTemplate {
  id: string;
  code: string;
  category: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  verifiable: boolean;
  acceptanceCriteria?: string[];
}

export interface CalculationBlockReference {
  blockCode: string;
  required: boolean;
  order: number;
  stage?: string;
}

export interface ValidationCriterion {
  id: string;
  type: 'RULE_CHECK' | 'CALCULATION' | 'DOCUMENT' | 'CUSTOM';
  description: string;
  weight: number;
  required: boolean;
}

export interface KPIMetric {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  target?: number;
  formula?: string;
  direction: 'MAXIMIZE' | 'MINIMIZE' | 'TARGET';
}

// ==========================================
// KNOWLEDGE GRAPH
// ==========================================

export type KnowledgeNodeType =
  | 'REQUIREMENT'
  | 'SOLUTION'
  | 'PROBLEM'
  | 'DECISION'
  | 'RISK'
  | 'COMPONENT'
  | 'PRINCIPLE'
  | 'CONSTRAINT'
  | 'LESSON_LEARNED';

export type RelationType =
  | 'CAUSES'
  | 'SOLVES'
  | 'REQUIRES'
  | 'VALIDATES'
  | 'DEPENDS_ON'
  | 'CONFLICTS_WITH'
  | 'IMPLEMENTS'
  | 'DERIVES_FROM'
  | 'RELATES_TO';

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  confidence: number;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  productClassId?: string;
  projectId?: string;

  version: number;
  supersededById?: string;

  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeRelation {
  id: string;
  type: RelationType;
  fromNodeId: string;
  toNodeId: string;
  strength: number;
  confidence: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeGraphQuery {
  startNodeId: string;
  relationTypes?: RelationType[];
  maxDepth?: number;
  direction?: 'FORWARD' | 'BACKWARD' | 'BOTH';
  filters?: {
    nodeTypes?: KnowledgeNodeType[];
    tags?: string[];
    minConfidence?: number;
  };
}

export interface KnowledgeGraphResult {
  nodes: KnowledgeNode[];
  relations: KnowledgeRelation[];
  paths?: {
    from: string;
    to: string;
    path: string[];
    weight: number;
  }[];
}

// ==========================================
// RULES ENGINE
// ==========================================

export type RuleCategory =
  | 'THERMAL'
  | 'AERODYNAMIC'
  | 'MECHANICAL'
  | 'HYGIENE'
  | 'SAFETY'
  | 'ELECTRICAL'
  | 'PROCESS'
  | 'QUALITY'
  | 'CUSTOM';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RuleAction = 'WARN' | 'BLOCK' | 'LOG' | 'NOTIFY';

export interface RuleCondition {
  operator: 'AND' | 'OR' | 'NOT';
  conditions?: RuleCondition[];
  comparison?: {
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'IN' | 'NOT_IN';
    value: number | string | boolean | unknown[];
  };
}

export interface EngineeringRuleDefinition {
  id?: string;
  code: string;
  category: RuleCategory;
  name: string;
  description: string;
  rationale?: string;

  condition: RuleCondition;
  parameters?: {
    name: string;
    type: 'number' | 'string' | 'boolean';
    unit?: string;
    description?: string;
  }[];

  riskLevel: RiskLevel;
  action: RuleAction;
  message: string;
  recommendation?: string;

  productClassId?: string;
  scope: 'PROJECT' | 'GATE' | 'CALCULATION';

  active: boolean;
  version: string;

  tags?: string[];
  references?: {
    type: 'STANDARD' | 'DOCUMENT' | 'URL';
    reference: string;
  }[];
}

export interface RuleEvaluationContext {
  projectId: string;
  params: Record<string, unknown>;
  productClassId?: string;
  scope?: 'PROJECT' | 'GATE' | 'CALCULATION';
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  category: RuleCategory;
  triggered: boolean;
  severity: RiskLevel;
  message: string;
  recommendation?: string;
  blocksProgress: boolean;

  context: {
    params: Record<string, unknown>;
    evaluatedAt: Date;
  };
}

export type ViolationStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'WAIVED';

export interface RuleViolationDetails {
  id: string;
  ruleCode: string;
  projectId: string;

  triggered: boolean;
  severity: RiskLevel;
  calculatedRisk?: number;

  status: ViolationStatus;

  acknowledgedAt?: Date;
  acknowledgedBy?: string;

  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;

  waived: boolean;
  waiverReason?: string;
  waivedBy?: string;

  createdAt: Date;
}

// ==========================================
// VALIDATION GATES
// ==========================================

export interface GateDefinition {
  id?: string;
  code: string;
  name: string;
  description: string;
  order: number;
  phase: 'PLANNING' | 'DESIGN' | 'VALIDATION' | 'RELEASE';

  criteria: GateCriterion[];
  passingScore: number;

  productClassId?: string;

  blockOnFail: boolean;
  allowWaiver: boolean;
  requiresApproval: boolean;

  active: boolean;
}

export interface GateCriterion {
  id: string;
  type: 'RULE_CHECK' | 'CALCULATION_COMPLETE' | 'DOCUMENT_EXISTS' | 'CUSTOM';
  description: string;
  weight: number;
  required: boolean;
  config?: Record<string, unknown>;
}

export interface GateValidationRequest {
  projectId: string;
  gateCode: string;
  validatedBy: string;
  force?: boolean;
}

export interface GateValidationResponse {
  gateCode: string;
  passed: boolean;
  score: number;

  results: {
    criterionId: string;
    type: string;
    passed: boolean;
    score: number;
    details?: unknown;
    message?: string;
  }[];

  blockers?: string[];
  warnings?: string[];

  waived: boolean;
  waiverReason?: string;

  validatedAt: Date;
  validatedBy: string;
}

export interface ProjectGatesStatus {
  projectId: string;
  gates: {
    code: string;
    name: string;
    order: number;
    phase: string;

    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'WAIVED';

    latestValidation?: {
      passed: boolean;
      score: number;
      validatedAt: Date;
    };

    canValidate: boolean;
    blockers?: string[];
  }[];

  currentGate?: string;
  overallProgress: number;
}

// ==========================================
// CALCULATION BLOCKS
// ==========================================

export type CalculationCategory =
  | 'THERMAL'
  | 'AERODYNAMIC'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'HYDRAULIC'
  | 'ECONOMIC'
  | 'CUSTOM';

export interface CalculationInput {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  description: string;
  unit?: string;
  required: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  validation?: {
    pattern?: string;
    enum?: unknown[];
    custom?: string;
  };
}

export interface CalculationOutput {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  description: string;
  unit?: string;
}

export interface CalculationBlockDefinition {
  id?: string;
  code: string;
  category: CalculationCategory;
  name: string;
  description: string;
  purpose?: string;

  inputSchema: CalculationInput[];
  outputSchema: CalculationOutput[];

  formulae: Record<string, string>;

  algorithm?: string;
  validationRules?: RuleCondition[];

  productClassId?: string;

  units?: Record<string, string>;
  references?: {
    type: string;
    reference: string;
  }[];
  accuracy?: string;

  active: boolean;
  version: string;
}

export type CalculationStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'WARNING';

export interface CalculationRequest {
  projectId: string;
  blockCode: string;
  inputs: Record<string, unknown>;
  executedBy: string;
  metadata?: Record<string, unknown>;
}

export interface CalculationResponse {
  id: string;
  blockCode: string;
  status: CalculationStatus;

  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;

  errors?: {
    field?: string;
    message: string;
    code?: string;
  }[];

  warnings?: {
    field?: string;
    message: string;
    code?: string;
  }[];

  validated: boolean;
  validationResults?: {
    passed: boolean;
    violations: RuleEvaluationResult[];
  };

  executionTime?: number;

  createdAt: Date;
  completedAt?: Date;
}

// ==========================================
// AI AGENTS
// ==========================================

export type AgentType =
  | 'PORTFOLIO'
  | 'PRODUCT_DEFINITION'
  | 'REQUIREMENTS'
  | 'ARCHITECTURE'
  | 'VALIDATION'
  | 'CALCULATION'
  | 'OPTIMIZATION'
  | 'RISK_ANALYSIS';

export interface AgentContext {
  projectId?: string;
  userId?: string;
  productClassId?: string;
  stage?: string;

  previousInteractions?: AgentInteraction[];
  decisions?: AgentDecision[];
  learnings?: AgentLearning[];

  sessionId?: string;
}

export interface AgentInteraction {
  timestamp: Date;
  input: string;
  output: string;
  type: 'QUERY' | 'ANALYSIS' | 'RECOMMENDATION' | 'VALIDATION';
  confidence?: number;
}

export interface AgentDecision {
  timestamp: Date;
  type: string;
  decision: string;
  rationale: string;
  confidence: number;
  parameters?: Record<string, unknown>;
}

export interface AgentLearning {
  timestamp: Date;
  topic: string;
  insight: string;
  source: 'INTERACTION' | 'FEEDBACK' | 'OUTCOME';
  importance: number;
}

export interface AgentRequest {
  agentType: AgentType;
  context: AgentContext;
  query: string;
  parameters?: Record<string, unknown>;
  options?: {
    includeRationale?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface AgentResponse {
  agentType: AgentType;
  response: string;

  decisions?: AgentDecision[];
  recommendations?: {
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    rationale: string;
  }[];

  nextSteps?: string[];
  warnings?: string[];

  confidence: number;

  memoryUpdated: boolean;

  metadata?: {
    tokensUsed?: number;
    executionTime?: number;
    model?: string;
  };
}

// ==========================================
// COMMON TYPES
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: Date;
}

export interface SuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: Date;
}
