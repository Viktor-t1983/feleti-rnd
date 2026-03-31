/**
 * DeepSeek LLM Provider
 *
 * OpenAI-compatible API for DeepSeek models
 */

import OpenAI from 'openai';
import {
  LLMMessage,
  LLMProvider,
  LLMProviderConfig,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from './llm-provider.interface';

export class DeepSeekProvider implements LLMProvider {
  private client: OpenAI;
  private defaultModel: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor(config: LLMProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.deepseek.com',
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 300000,
    });
    this.defaultModel = config.defaultModel || 'deepseek-chat';
    this.defaultTemperature = config.defaultTemperature || 0.7;
    this.defaultMaxTokens = config.defaultMaxTokens || 4096;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: request.temperature || this.defaultTemperature,
        max_tokens: request.max_tokens || this.defaultMaxTokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: request.tools as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tool_choice: request.tool_choice as any,
        stream: false,
      });

      return this.mapResponse(response);
    } catch (error) {
      return this.mapError(error as Error);
    }
  }

  async chatStream(
    request: LLMRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: request.temperature || this.defaultTemperature,
        max_tokens: request.max_tokens || this.defaultMaxTokens,
        top_p: request.top_p,
        frequency_penalty: request.frequency_penalty,
        presence_penalty: request.presence_penalty,
        stream: true,
      });

      for await (const chunk of stream) {
        onChunk(this.mapStreamChunk(chunk));
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return 'DeepSeek';
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  getSupportedModels(): string[] {
    return ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
  }

  private mapResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: any
  ): LLMResponse {
    return {
      id: response.id,
      model: response.model,
      created: response.created,
      choices: response.choices.map(
        (choice: { index: number; message: LLMMessage; finish_reason: string | null }) => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content || '',
          },
          finish_reason: choice.finish_reason,
        })
      ),
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  private mapStreamChunk(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunk: any
  ): LLMStreamChunk {
    return {
      id: chunk.id,
      model: chunk.model,
      created: chunk.created,
      choices: chunk.choices.map(
        (choice: { index: number; delta: Partial<LLMMessage>; finish_reason: string | null }) => ({
          index: choice.index,
          delta: choice.delta,
          finish_reason: choice.finish_reason,
        })
      ),
    };
  }

  private mapError(error: Error): LLMResponse {
    return {
      id: 'error',
      model: this.defaultModel,
      created: Math.floor(Date.now() / 1000),
      choices: [],
      error: {
        message: error.message,
        type: 'provider_error',
      },
    };
  }
}

/**
 * Factory function to create DeepSeek provider
 */
export function createDeepSeekProvider(config: LLMProviderConfig): LLMProvider {
  return new DeepSeekProvider(config);
}
