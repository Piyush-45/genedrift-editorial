import { createElement, useEffect, useRef, type ImgHTMLAttributes } from 'react'

const CREATOR_IMAGE_SCHEME = 'genedrift-creator-image:'

export function creatorImageSource(sourceUrl: string): string {
  return `${CREATOR_IMAGE_SCHEME}${encodeURIComponent(sourceUrl)}`
}

export function isCreatorImageSource(sourceUrl: string): boolean {
  return sourceUrl.startsWith(CREATOR_IMAGE_SCHEME)
}

function creatorSourceUrl(sourceUrl: string): string {
  if (!isCreatorImageSource(sourceUrl)) return ''
  try {
    return decodeURIComponent(sourceUrl.slice(CREATOR_IMAGE_SCHEME.length))
  } catch {
    return ''
  }
}

/**
 * Creator's protected file API must populate the image element that will remain
 * in the DOM. Copying the temporary URL it produces to another element makes
 * that second element fail after an editor re-render or reload.
 */
export function applyImageSource(image: HTMLImageElement, sourceUrl: string): void {
  if (image.dataset.genedriftSource === sourceUrl) return
  image.dataset.genedriftSource = sourceUrl
  const protectedSource = creatorSourceUrl(sourceUrl)
  image.removeAttribute('src')
  if (!protectedSource) {
    if (sourceUrl) image.src = sourceUrl
    return
  }
  const setImageData = window.ZOHO?.CREATOR?.UTIL.setImageData
  if (!setImageData) return
  const sdkSource = /^(?:api\/v2(?:\.1)?\/|publishapi\/v2\/)/.test(protectedSource)
    ? `/${protectedSource}`
    : protectedSource
  // Creator documents the callback as optional, but its current V2 runtime
  // invokes it on some protected-image failures without checking its type.
  setImageData(image, sdkSource, () => undefined)
}

type CreatorImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string }

export function CreatorImage({ src, ...props }: CreatorImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (imageRef.current) applyImageSource(imageRef.current, src)
  }, [src])
  return createElement('img', { ref: imageRef, ...props })
}
