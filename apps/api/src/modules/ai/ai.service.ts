import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiChatInput } from '@finpilot/shared';
import { AiToolsService } from './ai-tools.service';
import { LlmService } from './llm.service';

const SYSTEM_PROMPT = `You are FinPilot AI, a personal CFO assistant. You help users understand their finances.
Be concise, actionable, and friendly. Use numbers from the provided data.
Never invent account balances or transactions not in the context.
Format currency appropriately. If data is missing, say so clearly.`;

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private toolsService: AiToolsService,
    private llmService: LlmService,
  ) {}

  getStatus() {
    return this.llmService.getStatus();
  }

  async listConversations(userId: string, limit = 20) {
    return this.prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });
  }

  async getConversation(userId: string, id: string) {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async chat(userId: string, input: AiChatInput) {
    let conversationId = input.conversationId;

    if (conversationId) {
      const existing = await this.prisma.aIConversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!existing) throw new NotFoundException('Conversation not found');
    } else {
      const title = input.message.slice(0, 60);
      const conversation = await this.prisma.aIConversation.create({
        data: { userId, title },
      });
      conversationId = conversation.id;
    }

    const toolResults = await this.toolsService.runRelevantTools(userId, input.message);
    const context = this.toolsService.formatToolContext(toolResults);

    await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: input.message,
      },
    });

    const reply = await this.llmService.chat(SYSTEM_PROMPT, input.message, context);

    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: reply,
        toolCalls: toolResults.map((t) => ({ tool: t.tool })),
      },
    });

    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId,
      message: assistantMessage,
      toolsUsed: toolResults.map((t) => t.tool),
    };
  }
}
