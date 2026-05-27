'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { cn } from '@/lib/utils';
import { AriaToggleButton } from '@/components/ui/aria-tab-button';

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
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none',
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rich-editor-skeleton border border-[rgba(255,255,255,0.06)] rounded-xl bg-bg-surface animate-pulse',
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={cn('border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[rgba(255,255,255,0.06)] bg-bg-elevated flex-wrap">
        {[
          { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: 'Bold' },
          { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: 'Italic' },
          { label: 'S', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), title: 'Strikethrough' },
        ].map((btn) => (
          <AriaToggleButton
            key={btn.title}
            pressed={btn.active}
            onClick={btn.action}
            title={btn.title}
            aria-label={btn.title}
            className={cn(
              'w-7 h-7 rounded text-xs font-semibold transition-colors',
              btn.active
                ? 'bg-accent-cyan text-bg-base'
                : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
            )}
          >
            {btn.label}
          </AriaToggleButton>
        ))}

        <div className="w-px h-4 bg-[rgba(255,255,255,0.08)] mx-1" aria-hidden="true" />

        {[
          { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), title: 'Heading 2' },
          { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), title: 'Heading 3' },
        ].map((btn) => (
          <AriaToggleButton
            key={btn.title}
            pressed={btn.active}
            onClick={btn.action}
            title={btn.title}
            aria-label={btn.title}
            className={cn(
              'px-2 h-7 rounded text-xs font-mono transition-colors',
              btn.active
                ? 'bg-accent-cyan text-bg-base'
                : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
            )}
          >
            {btn.label}
          </AriaToggleButton>
        ))}

        <div className="w-px h-4 bg-[rgba(255,255,255,0.08)] mx-1" aria-hidden="true" />

        <AriaToggleButton
          pressed={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
          aria-label="Bullet list"
          className={cn(
            'w-7 h-7 rounded text-xs transition-colors',
            editor.isActive('bulletList')
              ? 'bg-accent-cyan text-bg-base'
              : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
          )}
        >
          ≡
        </AriaToggleButton>

        <AriaToggleButton
          pressed={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
          aria-label="Numbered list"
          className={cn(
            'w-7 h-7 rounded text-xs transition-colors',
            editor.isActive('orderedList')
              ? 'bg-accent-cyan text-bg-base'
              : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
          )}
        >
          1.
        </AriaToggleButton>

        <AriaToggleButton
          pressed={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code block"
          aria-label="Code block"
          className={cn(
            'w-7 h-7 rounded text-xs font-mono transition-colors',
            editor.isActive('codeBlock')
              ? 'bg-accent-cyan text-bg-base'
              : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]'
          )}
        >
          {'</>'}
        </AriaToggleButton>
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
