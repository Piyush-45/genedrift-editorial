"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAndSanitizeDocument = renderAndSanitizeDocument;
exports.validateDocumentChecksum = validateDocumentChecksum;
exports.contentHashForHandoff = contentHashForHandoff;
exports.buildPublishedDocument = buildPublishedDocument;
exports.validateMediaReferences = validateMediaReferences;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const errors_1 = require("./errors");
const security_1 = require("./security");
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
function renderMarks(text, marks) {
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
function renderChildren(node, mediaById) {
    return (node.content ?? []).map((child) => renderNode(child, mediaById)).join("");
}
function renderNode(node, mediaById) {
    if (node.type === "text")
        return renderMarks(node.text ?? "", node.marks);
    if (node.type === "hardBreak")
        return "<br>";
    if (node.type === "horizontalRule")
        return "<hr>";
    if (node.type === "paragraph")
        return `<p>${renderChildren(node, mediaById)}</p>`;
    if (node.type === "blockquote")
        return `<blockquote>${renderChildren(node, mediaById)}</blockquote>`;
    if (node.type === "bulletList")
        return `<ul>${renderChildren(node, mediaById)}</ul>`;
    if (node.type === "orderedList")
        return `<ol>${renderChildren(node, mediaById)}</ol>`;
    if (node.type === "listItem")
        return `<li>${renderChildren(node, mediaById)}</li>`;
    if (node.type === "heading") {
        const level = Math.min(6, Math.max(2, Number(node.attrs?.level ?? 2)));
        return `<h${level}>${renderChildren(node, mediaById)}</h${level}>`;
    }
    if (node.type === "mediaImage") {
        const mediaId = typeof node.attrs?.mediaId === "string" ? node.attrs.mediaId : "";
        const asset = mediaById.get(mediaId);
        if (!asset) {
            throw new errors_1.PublicationError(`Published media mapping is missing for ${mediaId || "an inline image"}`, "MEDIA_MAPPING_MISSING", false, 422);
        }
        const size = ["small", "medium", "large", "full"].includes(String(node.attrs?.displaySize)) ? node.attrs?.displaySize : "large";
        const alignment = ["left", "center", "right"].includes(String(node.attrs?.alignment)) ? node.attrs?.alignment : "center";
        const caption = asset.caption ? escapeHtml(asset.caption) : "";
        return `<figure data-media-id="${escapeHtml(mediaId)}" data-size="${escapeHtml(size)}" data-alignment="${escapeHtml(alignment)}"><img src="${escapeHtml(asset.publishedUrl)}" alt="${escapeHtml(asset.altText)}" loading="lazy">${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
    }
    return renderChildren(node, mediaById);
}
function renderAndSanitizeDocument(handoff, media) {
    const mediaById = new Map(media.map((asset) => [asset.mediaId, asset]));
    const rendered = renderChildren(handoff.revision.editorDocument, mediaById);
    return (0, sanitize_html_1.default)(rendered, {
        allowedTags: ["p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "em", "u", "s", "code", "blockquote", "ul", "ol", "li", "a", "figure", "img", "figcaption"],
        allowedAttributes: {
            a: ["href", "rel"],
            figure: ["data-media-id", "data-size", "data-alignment"],
            img: ["src", "alt", "loading"]
        },
        allowedSchemes: ["https"],
        allowProtocolRelative: false,
        transformTags: {
            a: sanitize_html_1.default.simpleTransform("a", { rel: "noopener noreferrer" }, true)
        }
    });
}
function validateDocumentChecksum(handoff) {
    const serializedChecksum = (0, security_1.sha256Hex)(JSON.stringify(handoff.revision.editorDocument));
    const canonicalChecksum = (0, security_1.sha256Hex)((0, security_1.stableJson)(handoff.revision.editorDocument));
    const supplied = handoff.revision.documentChecksum.toLowerCase();
    if (supplied !== serializedChecksum && supplied !== canonicalChecksum) {
        throw new errors_1.PublicationError("Editor document checksum does not match the approved snapshot", "DOCUMENT_CHECKSUM_MISMATCH", false, 422);
    }
}
function contentHashForHandoff(handoff) {
    return (0, security_1.sha256Hex)((0, security_1.stableJson)(handoff));
}
function buildPublishedDocument(handoff, publicationId, contentHash, publishedAt, media) {
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
function validateMediaReferences(handoff) {
    const mediaIds = new Set(handoff.media.map((asset) => asset.mediaId));
    const visit = (node) => {
        if (node.type === "mediaImage") {
            const mediaId = typeof node.attrs?.mediaId === "string" ? node.attrs.mediaId : "";
            if (!mediaId || !mediaIds.has(mediaId)) {
                throw new errors_1.PublicationError(`Approved media source is missing for ${mediaId || "an inline image"}`, "MEDIA_SOURCE_MISSING", false, 422);
            }
        }
        (node.content ?? []).forEach(visit);
    };
    visit(handoff.revision.editorDocument);
}
//# sourceMappingURL=snapshot.js.map