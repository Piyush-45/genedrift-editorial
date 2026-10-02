import type { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  Underline,
  Undo2,
} from 'lucide-react'

type Props = {
  editor: Editor
  revision: number
  onInsertImage: () => void
  onEditImage: () => void
}

type ToolButtonProps = {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function ToolButton({ label, active, disabled, onClick, children }: ToolButtonProps) {
  return (
    <button
      className={`tool-button${active ? ' is-active' : ''}`}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor, revision, onInsertImage, onEditImage }: Props) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Enter a valid link URL', previous ?? 'https://')
    if (href === null) return
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <div className="toolbar-group toolbar-history">
        <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 />
        </ToolButton>
        <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 />
        </ToolButton>
      </div>

      <div className="toolbar-separator" />

      <label className="heading-control" title="Text style">
        <span className="sr-only">Text style</span>
        <select
          aria-label="Text style"
          value={
            editor.isActive('heading', { level: 2 })
              ? '2'
              : editor.isActive('heading', { level: 3 })
                ? '3'
                : editor.isActive('heading', { level: 4 })
                  ? '4'
                  : 'p'
          }
          onChange={(event) => {
            const level = event.target.value
            if (level === 'p') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().setHeading({ level: Number(level) as 2 | 3 | 4 }).run()
          }}
        >
          <option value="p">Paragraph</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
      </label>

      <div className="toolbar-group">
        <ToolButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold />
        </ToolButton>
        <ToolButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic />
        </ToolButton>
        <ToolButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline />
        </ToolButton>
        <ToolButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough />
        </ToolButton>
        <ToolButton label="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <Superscript />
        </ToolButton>
        <ToolButton label="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <Subscript />
        </ToolButton>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <ToolButton label="Add or edit link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 />
        </ToolButton>
        <ToolButton
          label={editor.isActive('mediaImage') ? 'Edit selected image' : 'Insert image'}
          active={editor.isActive('mediaImage')}
          onClick={editor.isActive('mediaImage') ? onEditImage : onInsertImage}
        >
          <ImagePlus />
        </ToolButton>
        <ToolButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter />
        </ToolButton>
        <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting />
        </ToolButton>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <ToolButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List />
        </ToolButton>
        <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered />
        </ToolButton>
        <ToolButton label="Block quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote />
        </ToolButton>
        <ToolButton label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table2 />
        </ToolButton>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <ToolButton label="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft />
        </ToolButton>
        <ToolButton label="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter />
        </ToolButton>
        <ToolButton label="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight />
        </ToolButton>
      </div>

      <span className="toolbar-revision">Revision {revision}</span>
    </div>
  )
}
