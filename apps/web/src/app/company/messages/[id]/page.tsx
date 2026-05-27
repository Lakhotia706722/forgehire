'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useConversations, useMessages } from '@/lib/api-hooks';
import { avatarToneClass } from '@/lib/avatar-tone';

export default function CompanyConversationPage({ params }: { params: { id: string } }) {
  const { data: conversations = [] } = useConversations();
  const { data: apiMessages = [], isLoading } = useMessages(params.id);
  const [message, setMessage] = React.useState('');
  const [localMessages, setLocalMessages] = React.useState<
    { id: string; senderId: string; content: string; time: string }[]
  >([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const conv = conversations.find((c) => c.id === params.id);
  const otherUser = conv
    ? {
        name: conv.otherUserName,
        initials: conv.otherUserName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        role: conv.otherUserRole,
      }
    : { name: 'Conversation', initials: '??', role: 'engineer' };

  React.useEffect(() => {
    if (!apiMessages.length) return;
    setLocalMessages(
      apiMessages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    );
  }, [apiMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages.length]);

  function handleSend() {
    if (!message.trim()) return;
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        senderId: 'company-1',
        content: message.trim(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setMessage('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const CURRENT_USER_ID = 'company-1';

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-bg-surface shrink-0">
        <Link href="/company/messages" className="text-text-muted hover:text-text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4l-6 6 6 6"/></svg>
        </Link>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0 ${avatarToneClass(otherUser.name)}`}
          aria-hidden="true"
        >
          {otherUser.initials}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{otherUser.name}</p>
          <p className="text-xs text-text-muted capitalize">{otherUser.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4" role="log" aria-live="polite">
        {isLoading && localMessages.length === 0 ? (
          <p className="text-text-muted text-sm text-center">Loading messages…</p>
        ) : localMessages.length === 0 ? (
          <p className="text-text-muted text-sm text-center">No messages yet. Say hello!</p>
        ) : (
          localMessages.map((msg) => {
            const isMe = msg.senderId === CURRENT_USER_ID;
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                {!isMe && (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-[10px] shrink-0 mr-2 mt-1 ${avatarToneClass(otherUser.name)}`}
                    aria-hidden="true"
                  >
                    {otherUser.initials}
                  </div>
                )}
                <div className={cn('max-w-[70%] space-y-1', isMe && 'items-end flex flex-col')}>
                  <div
                    className={cn(
                      'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isMe
                        ? 'bg-accent-violet text-white rounded-br-sm'
                        : 'bg-bg-elevated text-text-primary rounded-bl-sm border border-[rgba(255,255,255,0.06)]',
                    )}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-text-muted font-mono px-1">{msg.time}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 md:px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-bg-surface shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            aria-label="Message input"
            className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim()}
            aria-label="Send message"
            className="px-4 py-2.5 rounded-xl bg-accent-cyan text-bg-base text-sm font-medium hover:brightness-110 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
