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
      case "highlight": return `<mark>${value}</mark>`;
      case "subscript": return `<sub>${value}</sub>`;
      case "superscript": return `<sup>${value}</sup>`;
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

const TEXT_ALIGNMENTS = new Set(["center", "right", "justify"]);

// TipTap's TextAlign extension stores alignment as attrs.textAlign. Left is the
// default reading direction, so only non-default values are carried as a data
// attribute that the website styles. No inline styles reach the public HTML.
function alignAttribute(node: TipTapNode): string {
  const value = String(node.attrs?.textAlign ?? "");
  return TEXT_ALIGNMENTS.has(value) ? ` data-align="${value}"` : "";
}

function spanAttributes(node: TipTapNode): string {
  const colspan = Number(node.attrs?.colspan ?? 1);
  const rowspan = Number(node.attrs?.rowspan ?? 1);
  let attributes = "";
  if (Number.isInteger(colspan) && colspan > 1 && colspan <= 50) attributes += ` colspan="${colspan}"`;
  if (Number.isInteger(rowspan) && rowspan > 1 && rowspan <= 200) attributes += ` rowspan="${rowspan}"`;
  return attributes;
}

function renderTable(node: TipTapNode, mediaById: Map<string, PublishedMediaAsset>): string {
  const rows = (node.content ?? []).filter((row) => row.type === "tableRow");
  if (rows.length === 0) return "";
  const isHeaderRow = (row: TipTapNode) => (row.content ?? []).length > 0 && (row.content ?? []).every((cell) => cell.type === "tableHeader");
  const renderRow = (row: TipTapNode) => `<tr>${(row.content ?? []).map((cell) => {
    const tag = cell.type === "tableHeader" ? "th" : "td";
    return `<${tag}${spanAttributes(cell)}>${renderChildren(cell, mediaById)}</${tag}>`;
  }).join("")}</tr>`;
  const head = isHeaderRow(rows[0]) ? `<thead>${renderRow(rows[0])}</thead>` : "";
  const bodyRows = head ? rows.slice(1) : rows;
  return `<table>${head}<tbody>${bodyRows.map(renderRow).join("")}</tbody></table>`;
}

function renderNode(node: TipTapNode, mediaById: Map<string, PublishedMediaAsset>): string {
  if (node.type === "text") return renderMarks(node.text ?? "", node.marks);
  if (node.type === "hardBreak") return "<br>";
  if (node.type === "horizontalRule") return "<hr>";
  if (node.type === "paragraph") return `<p${alignAttribute(node)}>${renderChildren(node, mediaById)}</p>`;
  if (node.type === "table") return renderTable(node, mediaById);
  if (node.type === "blockquote") return `<blockquote>${renderChildren(node, mediaById)}</blockquote>`;
  if (node.type === "bulletList") return `<ul>${renderChildren(node, mediaById)}</ul>`;
  if (node.type === "orderedList") return `<ol>${renderChildren(node, mediaById)}</ol>`;
  if (node.type === "listItem") return `<li>${renderChildren(node, mediaById)}</li>`;
  if (node.type === "heading") {
    const level = Math.min(6, Math.max(2, Number(node.attrs?.level ?? 2)));
    return `<h${level}${alignAttribute(node)}>${renderChildren(node, mediaById)}</h${level}>`;
  }
  if (node.type === "mediaImage") {
    const mediaId = typeof node.attrs?.mediaId === "string" ? node.attrs.mediaId : "";
    const asset = mediaById.get(mediaId);
    if (!asset) {
      throw new PublicationError(`Published media mapping is missing for ${mediaId || "an inline image"}`, "MEDIA_MAPPING_MISSING", false, 422);
    }
    const size = ["small", "medium", "large", "full"].includes(String(node.attrs?.displaySize)) ? node.attrs?.displaySize : "large";
    const alignment = ["left", "center", "right"].includes(String(node.attrs?.alignment)) ? node.attrs?.alignment : "center";
    const caption = asset.caption ? escapeHtml(asset.caption) : "";
    const figcaption = caption ? `<figcaption>${caption}</figcaption>` : "";
    return `<figure data-media-id="${escapeHtml(mediaId)}" data-size="${escapeHtml(size)}" data-alignment="${escapeHtml(alignment)}"><img src="${escapeHtml(asset.publishedUrl)}" alt="${escapeHtml(asset.altText)}" loading="lazy" width="${asset.widthPixels}" height="${asset.heightPixels}">${figcaption}</figure>`;
  }
  return renderChildren(node, mediaById);
}

export function renderAndSanitizeDocument(handoff: PublicationHandoff, media: PublishedMediaAsset[]): string {
  const mediaById = new Map(media.map((asset) => [asset.mediaId, asset]));
  const rendered = renderChildren(handoff.revision.editorDocument as TipTapNode, mediaById);
  return sanitizeHtml(rendered, {
    allowedTags: ["p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "em", "u", "s", "code", "mark", "sub", "sup", "blockquote", "ul", "ol", "li", "a", "figure", "img", "figcaption", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: {
      a: ["href", "rel"],
      p: ["data-align"],
      h2: ["data-align"],
      h3: ["data-align"],
      h4: ["data-align"],
      h5: ["data-align"],
      h6: ["data-align"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      figure: ["data-media-id", "data-size", "data-alignment"],
      img: ["src", "alt", "loading", "width", "height"]
    },
    allowedSchemes: ["https"],
    allowedSchemesByTag: { a: ["https", "mailto"] },
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
