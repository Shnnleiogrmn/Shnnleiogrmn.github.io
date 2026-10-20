# Shannalei Ogriman — Portfolio

A responsive monochrome portfolio using HTML, CSS and JavaScript. No runtime dependencies or build step. GitHub Pages can publish the repository root.

## Files
- `index.html`: portfolio content, education, projects and contact form.
- `styles.css`: design tokens, responsive layouts, themes and reduced-motion support.
- `script.js`: navigation, spotlight, theme, optional sound, volume, commands and email copy.
- `contact.js`: validated form submission, provider response handling and loading/error/success states.
- `Mypic.jpg`: unchanged original portrait. Light mode uses original colors; dark mode applies a CSS grayscale/contrast filter.
- `icon.svg`: SO favicon.
- `tests/contact.test.cjs`: offline delivery and submission tests.

## Preview
Serve the repository root with a static HTTP server. No package installation is required. Use relative public asset paths for GitHub Pages.

## Contact delivery — activated and tested
The form uses FormSubmit, a third-party delivery service, with the existing email `shannaleiogrmn@gmail.com`. No private credentials are embedded in the site.

FormSubmit was activated by the owner during this revision. A clearly labeled, owner-authorized delivery test received an explicit success response, and the owner confirmed that the message arrived on 2026-10-20. Recheck delivery from the hosted GitHub Pages URL after deployment, since this test used the local preview. Provider activation guidance: https://formsubmit.co/help.

The `action` on `#contact-form` supplies the native no-JavaScript submission endpoint; `data-endpoint` supplies the AJAX endpoint. If replacing the provider, update both URLs and adapt the explicit success-response contract in `contact.js`. Do not use private API keys in either URL. The form discloses that the service processes visitors' contact details and messages.

Validation, a honeypot, submission locking and a request timeout are included. Failed or pending-activation requests preserve the entered message. The interface reports success only after an explicit accepted response; it cannot verify inbox delivery. Network failures are never retried automatically to avoid duplicate messages. Only the owner-authorized activation/setup and post-activation delivery test were sent during implementation.

## Content provenance
Education and the descriptions of Retrievo and NeuroComm Board follow the supplied revision. Retrievo and GovAssistPH are proposed projects, grouped separately. Retrievo's stack is undecided. GovAssistPH's existing technologies are labeled proposed. NeuroComm's old log-analysis text and associated technologies were removed because they were attached to incorrect project content; no replacement stack was invented.

The spotlight contains DialyCare, the solar-powered irrigation project and NeuroComm Board. It labels DialyCare as a capstone in development, irrigation as a research proposal, and NeuroComm as an embedded-system project / proposal. NeuroComm's buttons are a labeled visual illustration, not the project application, and produce no speech audio. Existing skills, DialyCare role, additional skills, portrait and social links are preserved. No project screenshots, certificates, resume or project-specific repository URLs were supplied.

## Controls
- Theme button: System → Light → Dark. Initial preference is applied before stylesheet loading, and System tracks operating-system changes.
- Sound: off by default; saved opt-in and volume. Synthesized clicks occur only after deliberate actions. No sounds while hovering or typing. Volume is available in the command palette.
- Commands: Ctrl/Cmd+K, desktop navigation or footer button. Search grouped navigation/actions/social links; use arrows, Enter and Escape. `/about` reveals a small terminal-style message.
- Projects: buttons, selectors, keyboard arrows or touch swipe; no automatic rotation. Mobile hides overlapping inactive cards.
- Email: copy feedback resets after about two seconds, with visible fallback if clipboard access is denied.
- Reduced motion: disables transitions and reveals, while retaining every control.

## Verification
Run:

```text
node --check script.js
node --check contact.js
node --test tests/contact.test.cjs
```

The seven offline tests cover field validation, submitted fields, explicit success, provider/HTTP/malformed-response failures, activation, honeypot, insecure endpoint rejection, network/timeout behavior, duplicate locking, retry and preserved input. No network requests are made by tests.

Browser QA covers approximately 390, 768, 1024 and 1440 CSS px, with no horizontal overflow; original-color/light and grayscale/dark portrait; theme reload persistence; system following the current dark OS preference; project content and NeuroComm illustration; field errors/focus; grouped command keyboard navigation; persisted sound volume; and console health. Physical swipes, OS preference changes and audible loudness on a user's speakers are not simulated. Instagram/Facebook URLs match the supplied links; external fetching could not verify their destinations. Live delivery was verified with FormSubmit success and owner-confirmed inbox receipt.

## October 21 content and visual update
The authoritative project source for this revision is the supplied brief. The irrigation entry is a COERES research proposal for eggplant farming, without a final ESP32/controller claim. NeuroComm Board Converter is an embedded-system proposal with the supplied Arduino Uno R3 / DFPlayer / EEPROM architecture. Optional hardware is separate from the proposed core components. No field photographs or application screenshots were supplied, so visual previews use labeled workflows rather than fabricated assets.

Three static case studies are available at `/projects/dialycare/`, `/projects/solar-irrigation/`, and `/projects/neurocomm-board/`. They reuse shared styles and controls with no framework or build-system migration. Homepage articles supply spotlight metadata and previews. Inactive cards are positioned outside layout; the stage follows the active card's content height. The student status is now **4th Year Computer Engineering Student** throughout the website.

## GitHub activity setup
The calendar uses real GitHub contribution data. The screenshot's count is not stored or copied. Until a valid data refresh exists, the page shows an unavailable message and a working profile link.

1. After these source changes are published to `main`, create a fine-grained personal access token with read access to public GitHub data only. No access to private repositories or write permissions is needed for this token.
2. In this repository's **Settings → Secrets and variables → Actions**, add the token as the repository secret **`GH_ACTIVITY_TOKEN`**. Enter its value directly in GitHub; do not put it in source, browser storage, workflow YAML, command arguments or chat.
3. Enable GitHub Actions if it is disabled. Open **Actions → Refresh public GitHub activity → Run workflow** on `main`.
4. A successful run creates or updates the `activity-data` branch with **only** `github-activity.json`. Confirm that the branch contains no token or source files and that the displayed total/dates agree with the GitHub profile for the same UTC date window.
5. The homepage reads that public file from GitHub's raw-content host. Its normal GitHub Pages publishing configuration does not change.

The refresh is scheduled daily at **08:15 Asia/Taipei** (00:15 UTC); GitHub can delay scheduled runs. Manual refresh is also available. GitHub may suspend schedules in inactive public repositories; re-enable the workflow and run it manually if needed. On token expiry, replace the repository secret and rerun. A failed refresh preserves the previously published snapshot; inspect the failed run's step summary/logs to resolve authentication, rate-limit, permission or validation errors. No secrets are printed by the scripts.

The workflow uses `GH_ACTIVITY_TOKEN` only for GitHub data reads. The separate, short-lived `GITHUB_TOKEN` receives `contents: write` to publish a data-only Git tree on `activity-data`, with `github-actions[bot]` as author. It never pushes the website's `main` branch, force-updates the data branch, or deploys the site.

The snapshot contract is versioned: `schemaVersion`, `username`, `generatedAt`, `windowStart`, `windowEnd`, `totalContributions`, 365 ordered `days` (`date`, `count`, `level`), and up to four public non-fork `repositories` (`name`, `url`, `description`, `language`, `updatedAt`). Dates follow GitHub's UTC calendar; the window includes today and the preceding 364 dates. Totals are checked against the daily counts. Padding cells are blank, not fabricated zero-contribution days. A public-only token does not expose private repository details.

The browser loads activity near the section, times out after eight seconds, and caches validated data for one hour in session storage, scoped to its source URL. A snapshot over 48 hours old is labeled stale. On request failure, usable cache remains visible with its timestamp and an offline notice. Missing or invalid data never becomes a synthetic contribution calendar.

Calendar keyboard interaction uses one tab stop: left/right move one week, up/down one day, Home/End the first/last date. The tooltip and accessible label provide the date and contribution count. Horizontal calendar scrolling stays inside its panel on small screens.

Additional checks:

```text
node --check github-activity.js
node --check scripts/refresh-github.cjs
node --check scripts/publish-activity.cjs
node --test tests/contact.test.cjs tests/github-activity.test.cjs
```

Calendar tests use synthetic fixtures only inside `tests/`. They are not referenced by the real site, refresh workflow output or public data branch. Offline tests cover date boundaries/leap years, padding, intensity levels, totals and invalid data, unsafe repository links, stale/cache/error/timeout states, GitHub response sanitization, first publication, existing-branch updates, bot identity and conflict handling. Browser QA uses a clearly labeled local-only fixture route to exercise rendering; that route is not part of the website files.

Remote activation and live GitHub calendar verification require the configured secret and first successful workflow run. This implementation does not push source, create a remote branch, set a secret or run the remote workflow.

The root `_config.yml` excludes `tests/`, `scripts/` and `README.md` from GitHub Pages output. It does not change the publishing branch or source folder. Shared public JavaScript, case-study HTML, styles and images remain available.

## Verification for the October 21 revision
- All **20** offline tests passed (seven contact tests and thirteen activity/data-publication tests), along with JavaScript syntax and whitespace checks.
- HTML nesting, unique IDs, local assets, fragment targets, case-study links and outdated education wording were checked across the homepage and three static case studies.
- Browser checks used actual CSS widths of **390, 768, 1024 and 1440px** for all three case studies and the homepage, with no page overflow. The calendar alone scrolls horizontally at smaller widths.
- The isolated calendar fixture rendered 365 dates with one keyboard tab stop. Home, End and week navigation updated its accessible tooltip correctly. The ordinary homepage was checked separately and displayed its honest unavailable state without fixture data.
- Light/dark/system controls, original-color versus grayscale portrait styling, cross-page command navigation, the eight-request NeuroComm visual interaction, active-card height changes and parsed reduced-motion rules were checked. No JavaScript console errors or warnings were observed. Physical swipes and an OS-level preference change were not simulated.
- Workflow publication logic was tested against mocked GitHub responses, including root-branch creation, existing updates and conflicts. The YAML was reviewed; a live GitHub run and real calendar comparison remain pending secret setup. No source was pushed and no additional contact email was sent.
