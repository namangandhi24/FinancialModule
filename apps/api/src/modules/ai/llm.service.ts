import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private configService: ConfigService) {}

  async getStatus() {
    const openaiKey = this.configService.get<string>('openai.apiKey');
    const ollamaUrl = this.configService.get<string>('ollama.baseUrl');

    let ollamaAvailable = false;
    let ollamaModels: string[] = [];

    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = (await res.json()) as { models?: { name: string }[] };
        ollamaAvailable = true;
        ollamaModels = data.models?.map((m) => m.name) || [];
      }
    } catch {
      ollamaAvailable = false;
    }

    return {
      openaiConfigured: !!openaiKey,
      ollamaAvailable,
      ollamaModels,
      preferredProvider: openaiKey ? 'openai' : ollamaAvailable ? 'ollama' : 'none',
    };
  }

  async chat(systemPrompt: string, userMessage: string, context: string): Promise<string> {
    const openaiKey = this.configService.get<string>('openai.apiKey');
    const ollamaUrl = this.configService.get<string>('ollama.baseUrl');
    const ollamaModel = this.configService.get<string>('ollamaModel');

    const fullSystem = `${systemPrompt}\n\nUser financial data (use this to answer accurately):\n${context}`;

    if (openaiKey) {
      return this.chatOpenAI(openaiKey, fullSystem, userMessage);
    }

    try {
      return await this.chatOllama(ollamaUrl!, ollamaModel!, fullSystem, userMessage);
    } catch (err) {
      this.logger.warn(`Ollama unavailable: ${err}`);
      return this.fallbackResponse(userMessage, context);
    }
  }

  private async chatOpenAI(apiKey: string, system: string, user: string) {
    const model = this.configService.get<string>('openai.model');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message?.content || 'No response generated.';
  }

  private async chatOllama(baseUrl: string, model: string, system: string, user: string) {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.statusText}`);
    }

    const data = (await res.json()) as { message?: { content: string } };
    return data.message?.content || 'No response generated.';
  }

  private fallbackResponse(message: string, context: string) {
    const lower = message.toLowerCase();
    if (/net worth|wealth/.test(lower)) {
      const match = context.match(/"netWorth":\s*([\d.]+)/);
      if (match) {
        return `Based on your accounts, your current net worth is approximately ${match[1]}. Configure OpenAI or start Ollama for detailed AI analysis.`;
      }
    }
    if (/budget/.test(lower)) {
      return 'I can see your budget data in context. For personalized advice, enable OpenAI (OPENAI_API_KEY) or run Ollama locally (docker compose --profile ai up).';
    }
    return 'AI providers are not configured. Set OPENAI_API_KEY or run Ollama locally. I still loaded your financial data — ask about accounts, budgets, goals, or investments.';
  }
}
