/**
 * LLM Provider Interface
 *
 * Abstract interface for different LLM providers
 * Supports OpenAI, DeepSeek, Anthropic, etc.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface LLMFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
        required?: boolean;
      }
    >;
    required?: string[];
  };
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  tools?: LLMFunction[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  stream?: boolean;
}

export interface LLMResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: LLMMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface LLMStreamChunk {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    delta: Partial<LLMMessage>;
    finish_reason: 'stop' | 'length' | 'tool_calls' | null;
  }[];
}

export interface LLMProvider {
  /**
   * Send a chat completion request
   */
  chat(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Send a streaming chat completion request
   */
  chatStream(
    request: LLMRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    onError?: (error: Error) => void
  ): Promise<void>;

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the provider name
   */
  getProviderName(): string;

  /**
   * Get the default model
   */
  getDefaultModel(): string;

  /**
   * Get supported models
   */
  getSupportedModels(): string[];
}

/**
 * Factory for creating LLM providers
 */
export interface LLMProviderFactory {
  create(config: LLMProviderConfig): LLMProvider;
}

export interface LLMProviderConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

/**
 * Supported LLM providers
 */
export type LLMProviderType = 'openai' | 'deepseek' | 'anthropic' | 'azure';

/**
 * Provider registry for dynamic provider selection
 */
export class LLMProviderRegistry {
  private static providers: Map<LLMProviderType, LLMProviderFactory> = new Map();

  static register(type: LLMProviderType, factory: LLMProviderFactory): void {
    LLMProviderRegistry.providers.set(type, factory);
    return undefined;
  }

  static create(type: LLMProviderType, config: LLMProviderConfig): LLMProvider {
    const factory = LLMProviderRegistry.providers.get(type);
    if (!factory) {
      throw new Error(`Unknown LLM provider type: ${type}`);
    }
    return factory.create(config);
  }

  static isSupported(type: LLMProviderType): boolean {
    return LLMProviderRegistry.providers.has(type);
  }

  static getSupportedProviders(): LLMProviderType[] {
    return Array.from(LLMProviderRegistry.providers.keys());
  }
}
