import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { JSONContent } from '@tiptap/react'
import { EditorToolbar } from './EditorToolbar'
import { MediaDialog } from './MediaDialog'
import { MediaImage } from '../extensions/MediaImage'
import type { MediaAsset, MediaMetadata } from '../domain'

type Props = {
  initialDocument: JSONContent
  revisionNumber: number
  preview: boolean
  onChange: (document: JSONContent) => void
  onCreateImage: (file: File, metadata: MediaMetadata) => Promise<MediaAsset>
  onUpdateImage: (asset: MediaAsset, metadata: MediaMetadata) => Promise<MediaAsset>
}

export function ArticleEditor({ initialDocument, revisionNumber, preview, onChange, onCreateImage, onUpdateImage }: Props) {
  const [, redraw] = useReducer((value) => value + 1, 0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<MediaAsset>()
  const [uploading, setUploading] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const readyForUserChanges = useRef(false)
  const lastDocument = useRef('')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
        link: {
          autolink: true,
          openOnClick: false,
          defaultProtocol: 'https',
          HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
        },
      }),
      Highlight,
      Superscript,
      Subscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableKit.configure({ table: { resizable: true } }),
      MediaImage,
    ],
    content: initialDocument,
    editable: !preview,
    editorProps: {
      attributes: {
        class: 'article-prose',
        'aria-label': 'Article body',
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      lastDocument.current = JSON.stringify(currentEditor.getJSON())
      window.requestAnimationFrame(() => {
        readyForUserChanges.current = true
      })
    },
    onUpdate: ({ editor: currentEditor }) => {
      const document = currentEditor.getJSON()
      const serialized = JSON.stringify(document)
      if (!readyForUserChanges.current) {
        lastDocument.current = serialized
        return
      }
      if (serialized !== lastDocument.current) {
        lastDocument.current = serialized
        onChangeRef.current(document)
      }
    },
    onSelectionUpdate: redraw,
    onTransaction: redraw,
  })

  useEffect(() => {
    editor?.setEditable(!preview)
  }, [editor, preview])

  useEffect(() => {
    if (!editor) return
    const serialized = JSON.stringify(initialDocument)
    if (serialized === lastDocument.current) return
    readyForUserChanges.current = false
    editor.commands.setContent(initialDocument, { emitUpdate: false })
    lastDocument.current = JSON.stringify(editor.getJSON())
    window.requestAnimationFrame(() => {
      readyForUserChanges.current = true
    })
  }, [editor, initialDocument])

  const openSelectedImageEditor = useCallback(() => {
    if (!editor) return
    const attrs = editor.getAttributes('mediaImage')
    if (!attrs.mediaId && !attrs.creatorRecordId) return
    setEditingAsset({
      id: String(attrs.creatorRecordId || attrs.mediaId || ''),
      uuid: String(attrs.mediaId || ''),
      originalFilename: '',
      mimeType: '',
      fileSizeBytes: 0,
      widthPixels: 0,
      heightPixels: 0,
      status: 'Draft',
      previewUrl: String(attrs.src || ''),
      altText: String(attrs.alt || ''),
      caption: String(attrs.caption || ''),
      credit: String(attrs.credit || ''),
    })
    setMediaError('')
    setDialogOpen(true)
  }, [editor])

  useEffect(() => {
    const editorElement = editor?.view.dom
    if (!editorElement) return
    const handleEditMedia = () => openSelectedImageEditor()
    editorElement.addEventListener('genedrift:edit-media', handleEditMedia)
    return () => editorElement.removeEventListener('genedrift:edit-media', handleEditMedia)
  }, [editor, openSelectedImageEditor])

  if (!editor) return <div className="editor-loading">Preparing editor…</div>

  return (
    <section className={`writing-surface${preview ? ' is-preview' : ''}`}>
      {!preview && (
        <EditorToolbar
          editor={editor}
          revision={revisionNumber}
          onInsertImage={() => {
            setEditingAsset(undefined)
            setMediaError('')
            setDialogOpen(true)
          }}
          onEditImage={() => {
            openSelectedImageEditor()
          }}
        />
      )}
      <div className="editor-page">
        <EditorContent editor={editor} />
      </div>
      <MediaDialog
        open={dialogOpen}
        mode="inline"
        asset={editingAsset}
        requireFile={!editingAsset}
        busy={uploading}
        error={mediaError}
        onClose={() => !uploading && setDialogOpen(false)}
        onSubmit={(file, metadata) => {
          setUploading(true)
          setMediaError('')
          const operation = editingAsset
            ? onUpdateImage(editingAsset, metadata)
            : onCreateImage(file as File, metadata)
          void operation.then((asset) => {
            if (editingAsset) {
              editor.chain().focus().updateAttributes('mediaImage', {
                alt: asset.altText,
                caption: asset.caption,
              }).run()
            } else {
              editor.chain().focus().insertContent({
                type: 'mediaImage',
                attrs: {
                  mediaId: asset.uuid,
                  creatorRecordId: asset.id,
                  src: asset.previewUrl,
                  alt: asset.altText,
                  caption: asset.caption,
                  displaySize: 'large',
                  alignment: 'center',
                },
              }).run()
            }
            setDialogOpen(false)
          }).catch((error) => {
            setMediaError(error instanceof Error ? error.message : 'The image could not be saved.')
          }).finally(() => setUploading(false))
        }}
      />
    </section>
  )
}
