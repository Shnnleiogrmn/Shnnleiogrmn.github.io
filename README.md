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

The spotlight contains DialyCare, the solar-powered irrigation project and NeuroComm Board. It preserves the documented capstone and hardware labels without inventing completion or deployment status. NeuroComm's buttons are a labeled visual illustration, not the project application, and produce no speech audio. Existing skills, DialyCare role, additional skills, portrait and social links are preserved. No project screenshots, certificates, resume or project-specific repository URLs were supplied.

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
