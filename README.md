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

## Project spotlight and commands
Three featured projects reuse content from the complete collection. DialyCare is selected first. Browse with previous/next buttons, selectors, arrow keys while focused inside the carousel, or a horizontal touch swipe. There is no automatic rotation or scroll hijacking. On mobile, inactive cards are hidden and the stage sizes to the longest card.

Open the command palette with Ctrl/Cmd+K, the desktop navigation button, or the footer Commands button. Search commands, use Tab or arrow keys, Enter to run, and Escape to close. Try `/about` for a small terminal-style easter egg.

UI sound starts muted. Opt in with the sound control; preference persists locally. Short, low-volume ticks are synthesized with Web Audio only after an interaction, throttled to avoid repeated clicks. No audio files, autoplay, credentials, APIs or dependencies are required.

Theme preference initializes before the stylesheet loads and tracks OS changes in System mode. Section entrances, card transitions and hover motion respect reduced-motion settings.

## Redesign verification
Browser checks covered 390, 768, 1024 and 1440 px widths with no stable horizontal overflow, project switching, keyboard navigation, mobile menu and Escape, theme persistence across reload, sound preference persistence, command search and the `/about` command. The original portrait loaded and no console errors or warnings were recorded. Local structure, fragment and asset checks and JavaScript syntax also passed. System preference and reduced-motion branches are implemented using media queries; OS-level changes and physical touch swipes were not simulated.
