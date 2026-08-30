# Editorial Editor Specification

Status: Draft

## Product Direction

Build a focused, premium editorial experience using TipTap's open-source React
editor foundation and custom product UI. The interface should feel calm and
purpose-built for professional publishing rather than like a generic office
document toolbar.

The canonical document format is structured JSON. Sanitized HTML and a plain-text
representation are generated for publication, search, feeds, and migration.

## Layout

- Compact top bar with navigation, document status, autosave state, preview, and
  the primary workflow action
- Wide, centered writing canvas with comfortable editorial measure
- Collapsible right inspector for article, SEO, taxonomy, media, and workflow data
- Contextual text-selection menu instead of a permanently crowded toolbar
- Block handle for moving, duplicating, transforming, and deleting blocks
- Slash command menu for keyboard-first block insertion
- Focus mode that hides secondary panels without changing the document

## Text Features

- Paragraphs and headings H2 through H4
- Bold, italic, underline, strikethrough, superscript, and subscript
- Inline links with validation and internal-link search
- Bulleted, numbered, and nested lists
- Block quotations and pull quotes
- Text alignment where the selected block permits it
- Controlled highlight and text colors from the design system only
- Clear formatting
- Undo and redo

H1 is reserved for the article title and cannot be inserted into the body.

## Content Blocks

- Image with alt text, caption, credit, alignment, and display size
- Image gallery
- Table with accessible header controls and responsive rendering
- Approved-provider video embed
- Downloadable file or resource
- Callout in information, warning, success, and key-point variants
- Configurable CTA block
- Divider
- Citation and footnote
- FAQ group
- Related-content embed
- Optional automatic table of contents derived from headings

Code blocks are intentionally excluded from the first release.

## Writing Experience

- Autosave with visible saved/saving/error states
- Keyboard shortcuts and command search
- Drag-and-drop block ordering
- Paste cleanup for Word, Google Docs, and web content
- Image drag/drop and paste upload
- Word count, character count, and estimated reading time
- Find and replace
- Full-screen preview for desktop, tablet, and mobile
- Unsaved-change protection
- Graceful offline/error recovery for locally pending edits

## Publishing Assistance

- Required-field checklist
- Slug uniqueness and format validation
- SEO title and description length guidance
- Featured image and social image validation
- Missing image-alt-text detection
- Broken or unsafe link detection
- Heading-order validation
- Duplicate title warning
- Schedule date validation in Asia/Kolkata
- Review comments and assignment context without leaving the editor

## Accessibility and Output Rules

- Keyboard-operable controls and menus
- Visible focus states and semantic button labels
- No arbitrary font sizes, fonts, or unsupported colors in article content
- Responsive tables and media
- Sanitized links and embeds
- Deterministic JSON-to-HTML rendering shared with the public website

## Deferred Capabilities

- Real-time multiplayer editing
- Public comments
- AI-generated article content
- Code blocks
- Multilingual content variants
- Paid TipTap collaboration or UI packages unless separately approved

