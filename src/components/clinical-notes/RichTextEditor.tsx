'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? 'Escribe la nota clínica aquí...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  })

  if (!editor) return null

  const toolbarBtn = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      )}
    >
      {children}
    </button>
  )

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="w-4 h-4" />)}
        {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="w-4 h-4" />)}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="w-4 h-4" />)}
        {toolbarBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="w-4 h-4" />)}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {toolbarBtn(false, () => editor.chain().focus().setHorizontalRule().run(), <Minus className="w-4 h-4" />)}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
