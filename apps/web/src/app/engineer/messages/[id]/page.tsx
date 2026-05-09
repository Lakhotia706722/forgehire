'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/lib/api-hooks';

const COLORS = ['#00D4FF', '#F59E0B', '#7B5EA7', '#10B981'];
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { data: apiMessages, isLoading } = useMessages(params.id);
  const [message, setMessage] = React.useState('');
  const [localMessages, setLocalMessages] = React.useState<any[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const CURRENT_USER_ID = 'me';

  const messages = [...(apiMessages ?? []), ...localMessages];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    if (!message.trim()) return;
    setLocalMessages(prev => [...prev, {
      id: `local-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      content: message.trim(),
      createdAt: new Date().toISOString(),
      readAt: null,
      fileUrl: null,
      fileName: null,
    }]);
    setMessage('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-bg-surface shrink-0">
        <Link href="/engineer/messages" className="text-text-muted hover:text-text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4l-6 6 6 6"/>
          </svg>
        </Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0 bg-accent-cyan" aria-hidden="true">
          {params.id.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Conversation</p>
          <p className="text-xs text-text-muted">{params.id}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4" role="log" aria-label="Conversation messages" aria-live="polite">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
              <Skeleton className="h-12 w-64 rounded-2xl" />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === CURRENT_USER_ID;
            const time = new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[70%] space-y-1', isMe && 'items-end flex flex-col')}>
                  <div className={cn(
                    'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isMe
                      ? 'bg-accent-cyan text-bg-base rounded-br-sm'
                      : 'bg-bg-elevated text-text-primary rounded-bl-sm border border-[rgba(255,255,255,0.06)]'
                  )}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-text-muted font-mono px-1">{time}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-bg-surface shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
            style={{ maxHeight: '120px' }}
            aria-label="Message input"
            data-testid="message-input"
          />
          <Button size="md" onClick={handleSend} disabled={!message.trim()} aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2L2 7l5 3 2 5 5-13z"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
