# Shannalei Ogriman — Portfolio

A lightweight, responsive portfolio built with plain HTML, CSS, and JavaScript. No build step or runtime dependencies. Compatible with GitHub Pages.

## Files
- `index.html`: personal content, projects, navigation, and contact form.
- `styles.css`: responsive layout, design system, and reduced-motion support.
- `script.js`: navigation, reveals, current year, and form handling.
- `favicon.svg`: SO monogram.
- `Mypic.jpg`: original portrait, preserved.

## Preview and deployment
Serve this directory with any static web server (for example VS Code Live Server). For GitHub Pages, publish the repository root from your selected branch. All local asset paths are relative and case-correct.

## Enable contact delivery
The form does not send messages until configured. Email links already work.
1. Create and verify a form endpoint with a static-form provider that supports cross-origin POST requests, FormData, and JSON responses.
2. Set `data-endpoint=""` on `#contact-form` in `index.html` to the provider's HTTPS submission URL.
3. Confirm the provider maps `name`, `email`, and `message` fields and delivers to your inbox.
4. Test real delivery and provider error handling after deployment.
Use only a public submission URL. Never put secret keys or credentials in client-side code. The script reports success only after an HTTP success response; failures preserve the entered message.

## Content to review
Original projects and statuses are retained. The original NeuroComm Board description describes defensive log analysis, although its name suggests a different purpose. Retrievo's description overlaps DialyCare. Original informal role notes (`sakto lang` and `Madalas lutang`) are preserved rather than replaced with invented roles. Please clarify these before publishing if they are placeholders. No project-specific repository links or screenshots were present; DialyCare links accurately to the GitHub profile.

Tool and social icons are lightweight text symbols, not third-party image dependencies.

## Verification
Local page and favicon returned HTTP 200. JavaScript syntax, fragment targets, local asset paths, unique IDs, preserved projects, external link attributes, menu toggle, validation, unconfigured form behavior, and mocked provider success/failure states passed. No live messages were sent. Browser visual and responsive QA could not run because no connected browser was available.

