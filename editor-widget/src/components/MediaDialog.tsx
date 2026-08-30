import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import type { MediaAsset, MediaMetadata } from '../domain'

type Props = {
  open: boolean
  mode: 'cover' | 'inline'
  asset?: MediaAsset
  requireFile?: boolean
  busy?: boolean
  error?: string
  onClose: () => void
  onSubmit: (file: File | undefined, metadata: MediaMetadata) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024

export function MediaDialog({ open, mode, asset, requireFile = false, busy = false, error = '', onClose, onSubmit }: Props) {
  const inputId = useId()
  const [file, setFile] = useState<File>()
  const [previewUrl, setPreviewUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [credit, setCredit] = useState('')
  const [validation, setValidation] = useState('')

  useEffect(() => {
    if (!open) return
    setFile(undefined)
    setPreviewUrl(asset?.previewUrl ?? '')
    setAltText(asset?.altText ?? '')
    setCaption(asset?.caption ?? '')
    setCredit(asset?.credit ?? '')
    setValidation('')
  }, [asset, open])

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:') && previewUrl !== asset?.previewUrl) URL.revokeObjectURL(previewUrl)
  }, [asset?.previewUrl, open, previewUrl])

  if (!open) return null

  const canChooseFile = !asset

  const chooseFile = (next?: File) => {
    setValidation('')
    if (!next) return
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setValidation('Use a JPG, PNG, WebP, or GIF image.')
      return
    }
    if (next.size > MAX_SIZE) {
      setValidation('Images must be 10 MB or smaller.')
      return
    }
    if (previewUrl.startsWith('blob:') && previewUrl !== asset?.previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
  }

  const submit = () => {
    if (requireFile && !file) {
      setValidation('Choose an image first.')
      return
    }
    if (!altText.trim()) {
      setValidation('Alt text is required for accessible publishing.')
      return
    }
    onSubmit(file, { altText: altText.trim(), caption: caption.trim(), credit: credit.trim() })
  }

  return createPortal(
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="media-dialog" role="dialog" aria-modal="true" aria-labelledby={`${inputId}-title`}>
        <header>
          <div>
            <h2 id={`${inputId}-title`}>{asset ? 'Edit image details' : mode === 'cover' ? 'Add cover image' : 'Insert image'}</h2>
            <p>{mode === 'cover' ? 'Shown on article listings and at the top of the published article.' : 'Placed at the current cursor position.'}</p>
          </div>
          <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={busy} onClick={onClose}><X /></button>
        </header>

        <div className="media-dialog-body">
          <label className={`media-dropzone${previewUrl ? ' has-preview' : ''}${canChooseFile ? '' : ' is-readonly'}`} htmlFor={canChooseFile ? inputId : undefined}>
            {previewUrl ? <img src={previewUrl} alt="Selected preview" /> : <><ImagePlus /><strong>Choose image</strong><span>JPG, PNG, WebP or GIF · up to 10 MB</span></>}
          </label>
          {canChooseFile && <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseFile(event.target.files?.[0])} />}

          <div className="media-fields">
            <label className="field-label">Alt text <span className="required-mark">Required</span>
              <input value={altText} maxLength={250} placeholder="Describe what the image shows" onChange={(event) => setAltText(event.target.value)} />
            </label>
            <label className="field-label">Caption
              <textarea value={caption} maxLength={500} rows={3} onChange={(event) => setCaption(event.target.value)} />
            </label>
            <label className="field-label">Credit
              <input value={credit} maxLength={250} placeholder="Photographer, organization, or source" onChange={(event) => setCredit(event.target.value)} />
            </label>
            {asset && mode === 'cover' && <p className="media-edit-note">Use Replace to upload a different cover image.</p>}
          </div>
        </div>

        {(validation || error) && <div className="dialog-error" role="alert">{validation || error}</div>}
        <footer>
          <button className="secondary-command" type="button" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="save-command" type="button" disabled={busy} onClick={submit}>
            {busy ? <LoaderCircle className="spin-soft" /> : <ImagePlus />}
            {asset ? 'Save details' : mode === 'cover' ? 'Use as cover' : 'Insert image'}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
