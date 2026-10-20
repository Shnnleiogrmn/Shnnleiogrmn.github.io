# Shannalei Ogriman — Portfolio

A responsive, dependency-free portfolio built with HTML, CSS and JavaScript, compatible with GitHub Pages.

## Files
- `index.html`: existing identity, projects, education, skills and contact information.
- `styles.css`: responsive design tokens, light/dark themes and reduced-motion support.
- `script.js`: mobile navigation, active section, persisted theme and copy-email feedback.
- `icon.svg`: SO favicon.
- `Mypic.jpg`: original portrait.

## Preview
Serve the repository root with any static HTTP server. No installation or build is required. GitHub Pages can publish the root of the selected branch.

## Content notes
All five existing projects and their statuses are retained. No project screenshots, resume, certificates or project-specific repository URLs were supplied. DialyCare links to the actual GitHub profile. Informal role placeholders were omitted; the documented DialyCare role is retained. Retrievo overlaps DialyCare, and NeuroComm Board's existing description concerns defensive log analysis; these descriptions are preserved pending clarification. No experience, metrics or credentials were invented.

## Interactions
The theme button cycles System → Light → Dark and saves the selection when browser storage is available. The project disclosure and all links support keyboard use. Escape closes the mobile menu. Copy email uses the browser clipboard API with a visible fallback. The site works without JavaScript; on small screens the navigation uses a CSS fallback.

## Checks
Run `node --check script.js` for JavaScript syntax. This project has no configured build, lint, type-check or test runner.
