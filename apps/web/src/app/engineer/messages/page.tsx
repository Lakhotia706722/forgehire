'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  formatMessageTime,
  formatDateDivider,
  isSameDay,
  formatFileSize,
  detectOffPlatform,
  type Conversation,
  type Message,
} from '@/lib/hiring-data';
import { useConversations } from '@/lib/api-hooks';

type ConvTab = 'all' | 'project_rooms' | 'requests' | 'archived';

export default function MessagesPage() {
  const { data: apiConversations, isLoading: convsLoading } = useConversations();
  // Map API conversations to the existing Conversation type for UI compatibility
  const conversations: Conversation[] = (apiConversations ?? []).map(c => ({
    id: c.id,
    type: ((c as any).type === 'request' ? 'request' : 'direct') as 'direct' | 'project_room' | 'request',
    requestStatus: (c as any).requestStatus as any,
    name: c.otherUserName,
    initials: c.otherUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    avatarColor: '#00D4FF',
    lastMessage: c.lastMessage,
    lastMessageAt: new Date(c.lastMessageAt),
    unreadCount: c.unreadCount,
    otherUser: {
      id: c.otherUserId,
      name: c.otherUserName,
      initials: c.otherUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      color: '#00D4FF',
      role: c.otherUserRole as 'engineer' | 'company',
      company: '',
      isOnline: false,
    },
    messages: [],
  }));

  const [activeId, setActiveId] = React.useState<string>('');
  const [tab, setTab] = React.useState<ConvTab>('all');
  const [convSearch, setConvSearch] = React.useState('');
  const [messageInput, setMessageInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [showOffPlatformWarning, setShowOffPlatformWarning] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const CURRENT_USER_ID = 'eng-1';

  // Set first conversation as active when data loads
  React.useEffect(() => {
    if (conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  // Local state for optimistic message updates
  const [localConvs, setLocalConvs] = React.useState<Conversation[]>([]);
  const mergedConvs = localConvs.length > 0 ? localConvs : conversations;

  // Sync API conversations into local state once loaded
  React.useEffect(() => {
    if (conversations.length > 0 && localConvs.length === 0) {
      setLocalConvs(conversations);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  const activeConv = mergedConvs.find((c) => c.id === activeId)!;

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConv?.messages.length]);

  // Detect off-platform content
  React.useEffect(() => {
    setShowOffPlatformWarning(detectOffPlatform(messageInput));
  }, [messageInput]);

  // Simulate typing indicator
  React.useEffect(() => {
    if (activeId !== 'conv-1') return;
    const t = setTimeout(() => setIsTyping(true), 3000);
    const t2 = setTimeout(() => setIsTyping(false), 6000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [activeId]);

  function sendMessage() {
    if (!messageInput.trim()) return;
    const newMsg: Message = {
      id: crypto.randomUUID(),
      senderId: CURRENT_USER_ID,
      senderName: 'Arjun Sharma',
      senderInitials: 'AS',
      senderColor: '#F59E0B',
      content: messageInput,
      type: 'text',
      timestamp: new Date(),
      read: true,
    };
    setLocalConvs((prev) => prev.map((c) =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: messageInput, lastMessageAt: new Date() }
        : c
    ));
    setMessageInput('');
  }

  function handleFileUpload(file: File) {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) { clearInterval(interval); return null; }
        return prev + 20;
      });
    }, 200);

    setTimeout(() => {
      const newMsg: Message = {
        id: crypto.randomUUID(),
        senderId: CURRENT_USER_ID,
        senderName: 'Arjun Sharma',
        senderInitials: 'AS',
        senderColor: '#F59E0B',
        content: file.name,
        type: 'file',
        timestamp: new Date(),
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        read: true,
      };
      setLocalConvs((prev) => prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: `📎 ${file.name}`, lastMessageAt: new Date() }
          : c
      ));
      setUploadProgress(null);
    }, 1200);
  }

  function handleRequestAction(convId: string, action: 'accept' | 'decline') {
    setLocalConvs((prev) => prev.map((c) =>
      c.id === convId
        ? { ...c, requestStatus: action === 'accept' ? 'accepted' : 'declined', type: action === 'accept' ? 'direct' : c.type }
        : c
    ));
  }

  // Filter conversations
  const filteredConvs = mergedConvs.filter((c) => {
    if (convSearch && !c.name.toLowerCase().includes(convSearch.toLowerCase())) return false;
    if (tab === 'project_rooms') return c.type === 'project_room';
    if (tab === 'requests') return c.type === 'request';
    return true;
  });

  // Group messages by day
  function groupByDay(messages: Message[]) {
    const groups: { date: Date; messages: Message[] }[] = [];
    messages.forEach((msg) => {
      const last = groups[groups.length - 1];
      if (!last || !isSameDay(last.date, msg.timestamp)) {
        groups.push({ date: msg.timestamp, messages: [msg] });
      } else {
        last.messages.push(msg);
      }
    });
    return groups;
  }

  const messageGroups = groupByDay(activeConv?.messages ?? []);

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden" data-testid="messages-page">
      {/* ── Left panel: conversation list ─────────────── */}
      <div className="w-72 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-bg-surface flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h1 className="font-display font-bold text-text-primary text-base mb-3">Messages</h1>
          <input
            type="search"
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] transition-all"
            aria-label="Search conversations"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(255,255,255,0.06)]" role="tablist">
          {(['all', 'project_rooms', 'requests'] as ConvTab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 text-[10px] font-medium transition-colors',
                tab === t ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {t === 'all' ? 'All' : t === 'project_rooms' ? 'Rooms' : 'Requests'}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto" role="list" aria-label="Conversations">
          {filteredConvs.map((conv) => (
            <button
              key={conv.id}
              role="listitem"
              onClick={() => setActiveId(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3.5 border-b border-[rgba(255,255,255,0.04)] transition-colors relative',
                activeId === conv.id ? 'bg-bg-elevated' : 'hover:bg-[rgba(255,255,255,0.02)]',
                conv.unreadCount > 0 && 'border-l-2 border-l-accent-cyan'
              )}
              aria-current={activeId === conv.id}
              data-testid={`conv-item-${conv.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs shrink-0" style={{ background: conv.avatarColor }} aria-hidden="true">
                  {conv.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-text-primary truncate">{conv.name}</span>
                    <span className="text-[10px] text-text-muted font-mono shrink-0 ml-2">{formatMessageTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-text-muted truncate">{conv.lastMessage}</p>

                  {/* Request actions */}
                  {conv.type === 'request' && conv.requestStatus === 'pending' && (
                    <div className="flex gap-1.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRequestAction(conv.id, 'accept')}
                        className="text-[10px] px-2 py-0.5 rounded bg-accent-cyan text-bg-base font-semibold"
                        data-testid={`accept-request-${conv.id}`}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequestAction(conv.id, 'decline')}
                        className="text-[10px] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.1)] text-text-muted"
                        data-testid={`decline-request-${conv.id}`}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-accent-cyan text-bg-base text-[9px] font-bold flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Center panel: message thread ──────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Thread header */}
        <div className="px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)] bg-bg-surface flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-xs" style={{ background: activeConv?.avatarColor }} aria-hidden="true">
            {activeConv?.initials}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{activeConv?.name}</p>
            {activeConv?.contractId && <p className="text-[10px] text-text-muted">Project Room · Contract #{activeConv.contractId}</p>}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" role="log" aria-label="Message thread" aria-live="polite">
          {messageGroups.map((group, gi) => (
            <div key={gi}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
                <span className="text-[10px] text-text-muted font-mono">{formatDateDivider(group.date)}</span>
                <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" aria-hidden="true" />
              </div>

              {group.messages.map((msg) => {
                const isMine = msg.senderId === CURRENT_USER_ID;
                return (
                  <div key={msg.id} className={cn('flex gap-2.5 group', isMine && 'flex-row-reverse')} data-testid={`message-${msg.id}`}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-bg-base text-[9px] shrink-0 mt-1" style={{ background: msg.senderColor }} aria-hidden="true">
                        {msg.senderInitials}
                      </div>
                    )}
                    <div className={cn('max-w-[70%] space-y-1', isMine && 'items-end flex flex-col')}>
                      {/* Timestamp on hover */}
                      <span className="text-[9px] text-text-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {msg.type === 'file' ? (
                        <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', isMine ? 'bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.2)]' : 'bg-bg-elevated border-[rgba(255,255,255,0.06)]')}>
                          <div className="w-8 h-8 rounded-lg bg-bg-surface flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(0,212,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/><path d="M9 2v4h4"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{msg.fileName}</p>
                            {msg.fileSize && <p className="text-[10px] text-text-muted">{formatFileSize(msg.fileSize)}</p>}
                          </div>
                          <a href={msg.fileUrl} download={msg.fileName} className="text-[10px] text-accent-cyan hover:underline shrink-0" aria-label={`Download ${msg.fileName}`}>
                            ↓
                          </a>
                        </div>
                      ) : (
                        <div className={cn('px-4 py-2.5 rounded-2xl text-sm leading-relaxed', isMine ? 'bg-[rgba(0,212,255,0.12)] text-text-primary rounded-tr-sm' : 'bg-bg-elevated text-text-secondary rounded-tl-sm')}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2.5" data-testid="typing-indicator">
              <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center" aria-hidden="true" />
              <div className="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="px-5 py-2 border-t border-[rgba(255,255,255,0.06)]" data-testid="upload-progress">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">Uploading…</span>
              <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-cyan rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                />
              </div>
              <span className="text-xs font-mono text-accent-cyan">{uploadProgress}%</span>
            </div>
          </div>
        )}

        {/* Off-platform warning */}
        {showOffPlatformWarning && (
          <div
            className="mx-5 mb-2 px-4 py-2.5 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl flex items-center gap-2"
            role="alert"
            data-testid="off-platform-warning"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="#EF4444" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <p className="text-xs text-accent-red">
              Sharing contact info outside the platform is against NeuronHire&apos;s terms.
            </p>
          </div>
        )}

        {/* Message input */}
        <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.06)] bg-bg-surface">
          <div className="flex items-end gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-text-muted hover:text-text-secondary transition-colors p-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] shrink-0"
              aria-label="Attach file"
              data-testid="attach-file-btn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 8.5l-6 6a4 4 0 01-5.66-5.66l6.5-6.5a2.5 2.5 0 013.54 3.54L6.5 12.5a1 1 0 01-1.42-1.42L11 5"/>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" className="hidden" aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />

            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-all"
              style={{ maxHeight: 120 }}
              aria-label="Message input"
              data-testid="message-input"
            />

            <button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              className="w-9 h-9 rounded-xl bg-accent-cyan text-bg-base flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
              data-testid="send-message-btn"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2L2 8l5 2 2 5 5-13z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Right panel: context ───────────────────────── */}
      <div className="hidden xl:flex flex-col w-60 shrink-0 border-l border-[rgba(255,255,255,0.06)] bg-bg-surface">
        <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Context</p>
        </div>
        <div className="flex-1 px-4 py-4 space-y-4">
          {activeConv?.contractId && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted">Related Contract</p>
              <a href={`/engineer/contracts/${activeConv.contractId}`} className="flex items-center gap-2 p-2.5 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,255,0.2)] transition-colors group">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(0,212,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/><path d="M9 2v4h4"/>
                </svg>
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">View Contract</span>
              </a>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs text-text-muted">Quick Links</p>
            {[
              { label: 'View Profile', icon: '👤', href: `/engineer/${conversations[0]?.id ?? ""}` },
              { label: 'View Bounty',  icon: '🎯', href: '/engineer/bounties' },
            ].map((link) => (
              <a key={link.label} href={link.href} className="flex items-center gap-2 p-2.5 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,255,0.2)] transition-colors group">
                <span aria-hidden="true">{link.icon}</span>
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
