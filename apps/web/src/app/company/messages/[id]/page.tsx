'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MOCK_MESSAGES = [
  { id: 'm1', senderId: 'me',    content: 'Hi Arjun! I saw your profile and I\'m impressed by your RAG pipeline work. We\'re looking for someone to build a similar system for our document intelligence platform.', time: '10:30 AM' },
  { id: 'm2', senderId: 'other', content: 'Thanks! I\'d love to hear more about the project. What\'s the scale you\'re working with?', time: '10:45 AM' },
  { id: 'm3', senderId: 'me',    content: 'We have about 500K documents. Query volume is around 10K/day initially. We need sub-500ms response times.', time: '11:02 AM' },
  { id: 'm4', senderId: 'other', content: 'That\'s very doable. I\'d recommend a hybrid search approach. Would you be open to a quick call to discuss the architecture?', time: '11:15 AM' },
];

const MOCK_CONVERSATION = {
  otherUser: { name: 'Arjun Sharma', initials: 'AS', color: '#F59E0B', role: 'engineer' },
};

export default function CompanyConversationPage({ params }: { params: { id: string } }) {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState(MOCK_MESSAGES);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `m${Date.now()}`, senderId: 'me', content: message.trim(), time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setMessage('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const { otherUser } = MOCK_CONVERSATION;

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-bg-surface shrink-0">
        <Link href="/company/messages" className="text-text-muted hover:text-text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4l-6 6 6 6"/></svg>
        </Link>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0" style={{ background: otherUser.color }} aria-hidden="true">{otherUser.initials}</div>
        <div>
          <p className="text-sm font-medium text-text-primary">{otherUser.name}</p>
          <p className="text-xs text-text-muted capitalize">{otherUser.role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4" role="log" aria-live="polite">
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-[10px] shrink-0 mr-2 mt-1" style={{ background: otherUser.color }} aria-hidden="true">{otherUser.initials}</div>
              )}
              <div className={cn('max-w-[70%] space-y-1', isMe && 'items-end flex flex-col')}>
                <div className={cn('px-4 py-2.5 rounded-2xl text-sm leading-relaxed', isMe ? 'bg-accent-violet text-white rounded-br-sm' : 'bg-bg-elevated text-text-primary rounded-bl-sm border border-[rgba(255,255,255,0.06)]')}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-text-muted font-mono px-1">{msg.time}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 md:px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-bg-surface shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(123,94,167,0.4)] resize-none transition-all"
            style={{ maxHeight: '120px' }}
          />
          <Button size="md" onClick={handleSend} disabled={!message.trim()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2L2 7l5 3 2 5 5-13z"/></svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
