/* Delivery adapter is also exported for offline tests; no credentials are used. */
(function (root) {
  'use strict';
  const limits = { name: 100, email: 254, company: 150, topic: 100, message: 5000 };
  function validateContact(values) {
    const errors = {};
    for (const name of ['name', 'email', 'topic', 'message']) {
      if (!String(values[name] || '').trim()) errors[name] = `${name === 'topic' ? 'Choose a topic' : `Enter your ${name}`}.`;
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
    if (values.message && values.message.trim().length < 10) errors.message = 'Please add at least 10 characters of detail.';
    for (const [name, max] of Object.entries(limits)) if (String(values[name] || '').length > max) errors[name] = `Use ${max} characters or fewer.`;
    return errors;
  }
  async function deliverMessage(endpoint, values, fetcher = fetch, timeout = 15000) {
    if (!endpoint || new URL(endpoint).protocol !== 'https:') throw new Error('Contact delivery is not configured. Please use the email link.');
    if (Object.keys(validateContact(values)).length) throw new Error('Please complete the required fields.');
    if (values._honey) throw new Error('Couldn’t send this message. Please use one of the contact links.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values), signal: controller.signal
      });
      const result = await response.json();
      if (/activat|confirm your email|verify your email/i.test(String(result.message || ''))) {
        return { state: 'activation', message: 'Email delivery is awaiting activation by the site owner. Please use the email or social links below.' };
      }
      if (!response.ok || !(result.success === true || result.success === 'true')) throw new Error('The message service did not accept your message. Please try again or use the contact links.');
      return { state: 'success', message: 'Message sent ✓ Thanks — I’ll get back to you as soon as I can.' };
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Couldn’t confirm delivery. Check your connection and try again, or contact me using the links below.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  function initializeContact(document) {
    const form = document.querySelector('#contact-form');
    if (!form) return;
    const status = document.querySelector('#form-status'), button = form.querySelector('[type=submit]');
    const fields = ['name', 'email', 'topic', 'message'];
    let busy = false;
    form.noValidate = true;
    function clearError(name) {
      form.elements[name].removeAttribute('aria-invalid');
      form.elements[name].removeAttribute('aria-describedby');
      document.getElementById(`${name}-error`).textContent = '';
    }
    form.addEventListener('input', event => {
      if (fields.includes(event.target.name)) clearError(event.target.name);
      if (!busy && button.textContent === 'Sent ✓') button.textContent = 'Send message →';
    });
    form.elements.topic.addEventListener('change', () => document.dispatchEvent(new CustomEvent('portfolio:sound', { detail: 'select' })));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      const values = Object.fromEntries(new FormData(form));
      for (const name of Object.keys(limits)) values[name] = String(values[name] || '').trim();
      fields.forEach(clearError);
      const errors = validateContact(values);
      if (Object.keys(errors).length) {
        for (const [name, message] of Object.entries(errors)) {
          const input = form.elements[name], output = document.getElementById(`${name}-error`);
          if (input && output) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', `${name}-error`); output.textContent = message; }
        }
        status.dataset.state = 'error'; status.textContent = 'Please check the highlighted fields.';
        form.elements[Object.keys(errors)[0]].focus(); return;
      }
      busy = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
      button.textContent = 'Sending…'; status.textContent = 'Sending your message…'; status.dataset.state = 'sending';
      document.dispatchEvent(new CustomEvent('portfolio:sound', { detail: 'click' }));
      try {
        const result = await deliverMessage(form.dataset.endpoint, values);
        status.dataset.state = result.state; status.textContent = result.message;
        if (result.state === 'success') {
          form.reset(); button.textContent = 'Sent ✓';
          document.dispatchEvent(new CustomEvent('portfolio:sound', { detail: 'success' }));
        } else { button.textContent = 'Send message →'; }
      } catch (error) {
        status.dataset.state = 'error'; status.textContent = `Couldn’t send message. ${error.message}`; button.textContent = 'Try again →';
      } finally {
        busy = false; button.disabled = false; form.removeAttribute('aria-busy'); status.focus({ preventScroll: true });
      }
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { validateContact, deliverMessage, initializeContact };
  else initializeContact(root.document);
})(typeof window === 'undefined' ? globalThis : window);
