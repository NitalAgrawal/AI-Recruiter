import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex gap-2 p-2 border-b border-white/[0.04] bg-white/[0.02] rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('bold') ? 'bg-white/10 text-gold' : 'text-text-secondary'}`}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('italic') ? 'bg-white/10 text-gold' : 'text-text-secondary'}`}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('bulletList') ? 'bg-white/10 text-gold' : 'text-text-secondary'}`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive('orderedList') ? 'bg-white/10 text-gold' : 'text-text-secondary'}`}
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[150px] p-4 focus:outline-none text-sm text-white'
      }
    }
  });

  return (
    <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden focus-within:border-gold/50 transition-colors">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
