const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateContact, deliverMessage, initializeContact } = require('../contact.js');
const valid = { name: 'Visitor', email: 'visitor@example.com', company: '', topic: 'Project collaboration', message: 'A question about your engineering projects.', _honey: '' };
const endpoint = 'https://formsubmit.co/ajax/test@example.com';
const response = (success, message = '', ok = true) => ({ ok, json: async () => ({ success, message }) });

test('required fields and invalid email fail without delivery', () => {
  assert.deepEqual(validateContact(valid), {});
  assert.equal(Object.keys(validateContact({})).length, 4);
  assert.ok(validateContact({ ...valid, email: 'invalid@', message: '  ' }).email);
  assert.ok(validateContact({ ...valid, message: 'short' }).message);
});
test('submits the actual fields over HTTPS and accepts only explicit success', async () => {
  let request;
  const result = await deliverMessage(endpoint, valid, async (url, options) => {
    request = { url, options }; return response('true');
  });
  assert.equal(result.state, 'success');
  assert.equal(request.options.method, 'POST');
  assert.equal(JSON.parse(request.options.body).email, valid.email);
  assert.equal(JSON.parse(request.options.body).message, valid.message);
});
test('provider rejection, HTTP failure and malformed responses never report success', async () => {
  await assert.rejects(deliverMessage(endpoint, valid, async () => response('false')));
  await assert.rejects(deliverMessage(endpoint, valid, async () => response('true', '', false)));
  await assert.rejects(deliverMessage(endpoint, valid, async () => ({ ok: true, json: async () => { throw new SyntaxError('HTML response'); } })));
});
test('activation requirement remains distinct from a sent message', async () => {
  const result = await deliverMessage(endpoint, valid, async () => response('true', 'Please activate your form by email.'));
  assert.equal(result.state, 'activation');
});
test('honeypot and invalid configuration prevent network calls', async () => {
  let calls = 0; const fetcher = async () => { calls++; return response(true); };
  await assert.rejects(deliverMessage(endpoint, { ...valid, _honey: 'spam' }, fetcher));
  await assert.rejects(deliverMessage('http://insecure.test', valid, fetcher));
  assert.equal(calls, 0);
});
test('network failures and timeouts become actionable errors', async () => {
  await assert.rejects(deliverMessage(endpoint, valid, async () => { throw new TypeError('Network'); }), /connection/);
  await assert.rejects(deliverMessage(endpoint, valid, (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }), 5), /connection/);
});
function fixture() {
  const node = () => ({ textContent: '', dataset: {}, attrs: {}, disabled: false, setAttribute(k,v) { this.attrs[k]=v; }, removeAttribute(k) { delete this.attrs[k]; }, focus() { this.focused=true; }, addEventListener() {} });
  const status = node(), button = node(); const handlers = {};
  const form = { elements: {}, values: { ...valid }, dataset: { endpoint }, attrs: {}, querySelector: () => button, addEventListener: (k,f) => handlers[k]=f,
    setAttribute(k,v) { this.attrs[k]=v; }, removeAttribute(k) { delete this.attrs[k]; }, reset() { this.wasReset=true; } };
  ['name','email','company','topic','message'].forEach(name => form.elements[name] = node());
  const errors = Object.fromEntries(['name','email','topic','message'].map(name=>[`${name}-error`,node()]));
  const document = { querySelector: selector => selector === '#contact-form' ? form : status, getElementById: id => errors[id], dispatchEvent() {} };
  return { status, button, handlers, form, document };
}
test('loading blocks duplicate submissions; failures preserve input and enable retry', async () => {
  const originalFetch = global.fetch, originalData = global.FormData;
  const f = fixture(); let calls = 0, finish;
  global.FormData = class extends Map { constructor(form) { super(Object.entries(form.values)); } };
  global.fetch = async () => { calls++; return new Promise(resolve => finish=resolve); };
  try {
    initializeContact(f.document);
    const first = f.handlers.submit({ preventDefault() {} });
    assert.equal(f.button.disabled, true); assert.equal(f.form.attrs['aria-busy'],'true');
    await f.handlers.submit({ preventDefault() {} }); assert.equal(calls,1);
    finish(response(false)); await first;
    assert.equal(f.status.dataset.state,'error'); assert.equal(f.button.disabled,false); assert.equal(f.form.wasReset,undefined);
    assert.equal(f.form.values.message,valid.message);
    global.fetch = async () => response(true);
    await f.handlers.submit({ preventDefault() {} });
    assert.equal(f.status.dataset.state,'success'); assert.equal(f.form.wasReset,true); assert.equal(f.button.textContent,'Sent ✓');
  } finally { global.fetch = originalFetch; global.FormData = originalData; }
});
