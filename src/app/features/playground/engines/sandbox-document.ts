/**
 * Builds the document executed inside the sandboxed iframe and validates the messages it sends back.
 * Pure functions, unit-tested separately from the DOM.
 */

/** Content Security Policy applied inside the frame: no navigation targets, no forms, no nested frames. */
export const SANDBOX_CSP =
  "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https:; style-src 'unsafe-inline' https:; img-src data: blob: https:; font-src data: https:; media-src data: blob: https:; connect-src https:; worker-src blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";

export const MAX_CONSOLE_MESSAGES = 500;
export const MAX_MESSAGE_LENGTH = 10000;

const CSS_SAMPLE_PAGE = `<h1>Sample heading</h1>
<p>This sample page exists so your CSS has something to style. It has a <a href="#">link</a>, <strong>bold text</strong> and <code>inline code</code>.</p>
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
<div class="card">
  <h2>Card title</h2>
  <p>A card element with the class <code>card</code>.</p>
  <button type="button">Button</button>
</div>`;

function bootstrapScript(nonce: string): string {
  return `<script>(function(){
var NONCE=${JSON.stringify(nonce)};var MAX=${MAX_CONSOLE_MESSAGES};var count=0;
function send(type,payload){try{parent.postMessage(Object.assign({v:1,nonce:NONCE,type:type},payload||{}),'*');}catch(e){}}
function fmt(a){try{if(typeof a==='string')return a;if(a instanceof Error)return a.name+': '+a.message;if(typeof a==='function')return a.toString();if(a===undefined)return 'undefined';var s=JSON.stringify(a,null,2);return s===undefined?String(a):s;}catch(e){return String(a);}}
['log','info','warn','error','debug'].forEach(function(level){var orig=console[level];console[level]=function(){if(count++<MAX){send('console',{level:level==='debug'?'log':level,text:Array.prototype.map.call(arguments,fmt).join(' ').slice(0,${MAX_MESSAGE_LENGTH})});}if(orig)orig.apply(console,arguments);};});
window.addEventListener('error',function(e){send('error',{message:(e.message||'Error')+(e.lineno?' (line '+e.lineno+')':'')});});
window.addEventListener('unhandledrejection',function(e){send('error',{message:'Unhandled promise rejection: '+fmt(e.reason)});});
window.alert=function(m){send('console',{level:'info',text:'alert: '+fmt(m)});};
window.confirm=function(){return true;};window.prompt=function(){return null;};
window.addEventListener('load',function(){send('ready',{});});
})();</script>`;
}

/** Wraps learner code in a full document according to the playground language. */
export function createSandboxDocument(language: string, code: string, nonce: string): string {
  const head = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}">${bootstrapScript(nonce)}`;
  switch (language) {
    case 'javascript':
    case 'js':
      return `<!doctype html><html><head>${head}</head><body><script>\n${code}\n</script></body></html>`;
    case 'css':
      return `<!doctype html><html><head>${head}<style>body{font-family:system-ui,sans-serif;padding:1rem;color:#172033}</style><style>\n${code}\n</style></head><body>${CSS_SAMPLE_PAGE}</body></html>`;
    default: {
      // Full HTML documents: inject the policy and bootstrap as early as possible.
      if (/<head[^>]*>/i.test(code)) return code.replace(/<head[^>]*>/i, (match) => `${match}${head}`);
      if (/<html[^>]*>/i.test(code)) return code.replace(/<html[^>]*>/i, (match) => `${match}<head>${head}</head>`);
      return `<!doctype html><html><head>${head}</head><body>${code}</body></html>`;
    }
  }
}

export interface SandboxMessage {
  v: 1;
  nonce: string;
  type: 'console' | 'error' | 'ready';
  level?: string;
  text?: string;
  message?: string;
}

/** Accepts a message only if it comes from the current frame, with the opaque origin and the current nonce. */
export function isTrustedSandboxMessage(
  event: { source: unknown; origin: string; data: unknown },
  frameWindow: unknown,
  nonce: string,
): event is { source: unknown; origin: string; data: SandboxMessage } {
  if (event.source !== frameWindow || event.origin !== 'null') return false;
  const data = event.data as Partial<SandboxMessage> | null;
  return !!data && typeof data === 'object' && data.v === 1 && data.nonce === nonce && typeof data.type === 'string';
}
