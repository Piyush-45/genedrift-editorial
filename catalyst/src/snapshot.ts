import sanitizeHtml from "sanitize-html";
import type { CanonicalPublishedDocument, PublicationHandoff, PublishedMediaAsset } from "./domain";
import { PublicationError } from "./errors";
import { sha256Hex, stableJson } from "./security";

type TipTapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  content?: TipTapNode[];
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarks(text: string, marks: TipTapNode["marks"]): string {
  return (marks ?? []).reduce((value, mark) => {
    switch (mark.type) {
      case "bold": return `<strong>${value}</strong>`;
      case "italic": return `<em>${value}</em>`;
      case "underline": return `<u>${value}</u>`;
      case "strike": return `<s>${value}</s>`;
      case "code": return `<code>${value}</code>`;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${value}</a>`;
      }
      default: return value;
    }
  }, escapeHtml(text));
}

function renderChildren(node: TipTapNode, mediaById: Map<string, PublishedMediaAsset>): string {
  return (node.content ?? []).map((child) => renderNode(child, mediaById)).join("");
}

function renderNode(node: TipTapNode, mediaById: Map<string, PublishedMediaAsset>): string {
  if (node.type === "text") return renderMarks(node.text ?? "", node.marks);
  if (node.type === "hardBreak") return "<br>";
  if (node.type === "horizontalRule") return "<hr>";
  if (node.type === "paragraph") return `<p>${renderChildren(node, mediaById)}</p>`;
  if (node.type === "blockquote") return `<blockquote>${renderChildren(node, mediaById)}</blockquote>`;
  if (node.type === "bulletList") return `<ul>${renderChildren(node, mediaById)}</ul>`;
  if (node.type === "orderedList") return `<ol>${renderChildren(node, mediaById)}</ol>`;
  if (node.type === "listItem") return `<li>${renderChildren(node, mediaById)}</li>`;
  if (node.type === "heading") {
    const level = Math.min(6, Math.max(2, Number(node.attrs?.level ?? 2)));
    return `<h${level}>${renderChildren(node, mediaById)}</h${level}>`;
  }
  if (node.type === "mediaImage") {
    const mediaId = typeof node.attrs?.mediaId === "string" ? node.attrs.mediaId : "";
    const asset = mediaById.get(mediaId);
    if (!asset) {
      throw new PublicationError(`Published media mapping is missing for ${mediaId || "an inline image"}`, "MEDIA_MAPPING_MISSING", false, 422);
    }
    const size = ["small", "medium", "large", "full"].includes(String(node.attrs?.displaySize)) ? node.attrs?.displaySize : "large";
    const alignment = ["left", "center", "right"].includes(String(node.attrs?.alignment)) ? node.attrs?.alignment : "center";
    const captionParts = [asset.caption, asset.credit].filter(Boolean).map(escapeHtml);
    return `<figure data-media-id="${escapeHtml(mediaId)}" data-size="${escapeHtml(size)}" data-alignment="${escapeHtml(alignment)}"><img src="${escapeHtml(asset.publishedUrl)}" alt="${escapeHtml(asset.altText)}" loading="lazy">${captionParts.length ? `<figcaption>${captionParts.join(" · ")}</figcaption>` : ""}</figure>`;
  }
  return renderChildren(node, mediaById);
}

export function renderAndSanitizeDocument(handoff: PublicationHandoff, media: PublishedMediaAsset[]): string {
  const mediaById = new Map(media.map((asset) => [asset.mediaId, asset]));
  const rendered = renderChildren(handoff.revision.editorDocument as TipTapNode, mediaById);
  return sanitizeHtml(rendered, {
    allowedTags: ["p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "em", "u", "s", "code", "blockquote", "ul", "ol", "li", "a", "figure", "img", "figcaption"],
    allowedAttributes: {
      a: ["href", "rel"],
      figure: ["data-media-id", "data-size", "data-alignment"],
      img: ["src", "alt", "loading"]
    },
    allowedSchemes: ["https"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true)
    }
  });
}

export function validateDocumentChecksum(handoff: PublicationHandoff): void {
  const serializedChecksum = sha256Hex(JSON.stringify(handoff.revision.editorDocument));
  const canonicalChecksum = sha256Hex(stableJson(handoff.revision.editorDocument));
  const supplied = handoff.revision.documentChecksum.toLowerCase();
  if (supplied !== serializedChecksum && supplied !== canonicalChecksum) {
    throw new PublicationError("Editor document checksum does not match the approved snapshot", "DOCUMENT_CHECKSUM_MISMATCH", false, 422);
  }
}

export function contentHashForHandoff(handoff: PublicationHandoff): string {
  return sha256Hex(stableJson(handoff));
}

export function buildPublishedDocument(
  handoff: PublicationHandoff,
  publicationId: string,
  contentHash: string,
  publishedAt: string,
  media: PublishedMediaAsset[]
): CanonicalPublishedDocument {
  validateDocumentChecksum(handoff);
  return {
    schemaVersion: 2,
    publicationId,
    contentHash,
    publishedAt,
    article: handoff.article,
    revision: handoff.revision,
    media,
    html: renderAndSanitizeDocument(handoff, media)
  };
}

export function validateMediaReferences(handoff: PublicationHandoff): void {
  const mediaIds = new Set(handoff.media.map((asset) => asset.mediaId));
  const visit = (node: TipTapNode): void => {
    if (node.type === "mediaImage") {
      const mediaId = typeof node.attrs?.mediaId === "string" ? node.attrs.mediaId : "";
      if (!mediaId || !mediaIds.has(mediaId)) {
        throw new PublicationError(`Approved media source is missing for ${mediaId || "an inline image"}`, "MEDIA_SOURCE_MISSING", false, 422);
      }
    }
    (node.content ?? []).forEach(visit);
  };
  visit(handoff.revision.editorDocument as TipTapNode);
}
