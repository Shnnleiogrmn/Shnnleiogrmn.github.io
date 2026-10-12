'use strict';
const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav-links');
const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
document.addEventListener('click', e => { if (!e.target.closest('.nav')) closeMenu(); });
const mobile = matchMedia('(max-width: 640px)');
mobile.addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();
if ('IntersectionObserver' in window) {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); reveal.unobserve(entry.target); } }), { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(el => { el.classList.add('is-pending'); reveal.observe(el); });
  }
  const links = [...nav.querySelectorAll('a')];
  const active = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) links.forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }), { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  links.forEach(link => active.observe(document.querySelector(link.hash)));
}
// Set data-endpoint in index.html to your configured HTTPS form-provider URL.
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const fields = [...form.querySelectorAll('input, textarea')];
const endpoint = form.dataset.endpoint.trim();
if (endpoint) document.querySelector('#form-note').textContent = 'All fields are required.';
function validate(field) {
  const empty = !field.value.trim();
  const error = empty ? `Please enter your ${field.name}.` : field.validity.typeMismatch ? 'Please enter a valid email address.' : !field.validity.valid ? 'Please check this field.' : '';
  field.setAttribute('aria-invalid', String(Boolean(error)));
  document.querySelector('#' + field.id + '-error').textContent = error;
  return !error;
}
fields.forEach(field => field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') validate(field); }));
form.addEventListener('submit', async e => {
  e.preventDefault();
  status.textContent = ''; status.removeAttribute('data-state');
  const results = fields.map(validate);
  if (results.includes(false)) { fields[results.indexOf(false)].focus(); return; }
  if (!endpoint) {
    status.dataset.state = 'error';
    status.textContent = 'Direct sending is not available yet. Please use the email link above. Your message has not been sent.';
    return;
  }
  const button = form.querySelector('button');
  button.disabled = true; button.textContent = 'Sending…'; form.setAttribute('aria-busy', 'true');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    if (!endpoint.startsWith('https://')) throw new Error('Invalid endpoint');
    const response = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error('Submission failed');
    status.dataset.state = 'success'; status.textContent = 'Thank you! Your message was sent successfully.';
    form.reset(); fields.forEach(field => field.removeAttribute('aria-invalid'));
  } catch {
    status.dataset.state = 'error'; status.textContent = 'Unable to confirm delivery. Please try again or contact me by email. Your message is still here.';
  } finally {
    clearTimeout(timeout); button.disabled = false; button.innerHTML = 'Send Message <span aria-hidden="true">↗</span>'; form.removeAttribute('aria-busy');
  }
});
