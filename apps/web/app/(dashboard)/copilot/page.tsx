'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAiStatus, useAiChat } from '@/hooks/use-api';
import { Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
}

export default function CopilotPage() {
  const { data: status, isLoading: statusLoading } = useAiStatus();
  const chat = useAiChat();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    const result = await chat.mutateAsync({
      message: userMsg,
      conversationId,
    });

    setConversationId(result.conversationId);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: result.message.content,
        toolsUsed: result.toolsUsed,
      },
    ]);
  };

  return (
    <DashboardShell title="AI Copilot">
      <div className="mx-auto max-w-3xl space-y-4">
        {statusLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={status?.preferredProvider !== 'none' ? 'secondary' : 'outline'}>
              {status?.preferredProvider === 'openai'
                ? 'OpenAI'
                : status?.preferredProvider === 'ollama'
                  ? 'Ollama'
                  : 'Fallback mode'}
            </Badge>
            {status?.ollamaAvailable && (
              <span className="text-xs text-muted-foreground">
                Models: {status.ollamaModels.slice(0, 2).join(', ') || 'available'}
              </span>
            )}
          </div>
        )}

        <Card className="min-h-[480px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Personal CFO
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px]">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Ask about your accounts, budgets, goals, investments, or net worth.
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'ml-12 bg-primary text-primary-foreground'
                      : 'mr-12 bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.toolsUsed?.length ? (
                    <p className="mt-2 text-xs opacity-70">
                      Tools: {msg.toolsUsed.join(', ')}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask your financial question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <Button onClick={handleSend} disabled={chat.isPending || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
