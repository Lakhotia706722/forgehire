'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = 160,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={cn('border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[rgba(255,255,255,0.06)] bg-bg-elevated flex-wrap">
        {[
          { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: 'Bold' },
          { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: 'Italic' },
          { label: 'S', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), title: 'Strikethrough' },
        ].map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={btn.action}
            title={btn.title}
            aria-label={btn.title}
            aria-pressed={btn.active}
            className={cn(
              'w-7 h-7 rounded text-xs font-semibold transition-colors',
              btn.active
                ? 'bg-accent-cyan text-bg-base'
                : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
            )}
          >
            {btn.label}
          </button>
        ))}

        <div className="w-px h-4 bg-[rgba(255,255,255,0.08)] mx-1" aria-hidden="true" />

        {[
          { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), title: 'Heading 2' },
          { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), title: 'Heading 3' },
        ].map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={btn.action}
            title={btn.title}
            aria-label={btn.title}
            aria-pressed={btn.active}
            className={cn(
              'px-2 h-7 rounded text-xs font-mono transition-colors',
              btn.active
                ? 'bg-accent-cyan text-bg-base'
                : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
            )}
          >
            {btn.label}
          </button>
        ))}

        <div className="w-px h-4 bg-[rgba(255,255,255,0.08)] mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
          aria-label="Bullet list"
          aria-pressed={editor.isActive('bulletList')}
          className={cn(
            'w-7 h-7 rounded text-xs transition-colors',
            editor.isActive('bulletList')
              ? 'bg-accent-cyan text-bg-base'
              : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
          )}
        >
          ≡
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
          aria-label="Numbered list"
          aria-pressed={editor.isActive('orderedList')}
          className={cn(
            'w-7 h-7 rounded text-xs transition-colors',
            editor.isActive('orderedList')
              ? 'bg-accent-cyan text-bg-base'
              : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
          )}
        >
          1.
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code block"
          aria-label="Code block"
          aria-pressed={editor.isActive('codeBlock')}
          className={cn(
            'w-7 h-7 rounded text-xs font-mono transition-colors',
            editor.isActive('codeBlock')
              ? 'bg-accent-cyan text-bg-base'
              : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
          )}
        >
          {'</>'}
        </button>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="bg-bg-surface px-4 py-3 text-text-primary text-sm"
        style={{ minHeight }}
      />
    </div>
  );
}
