import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { ConsoleLevel, ExecutionEngine, RunEvent, RunRequest } from './execution-engine';
import { createSandboxDocument, isTrustedSandboxMessage } from './sandbox-document';

const LOAD_TIMEOUT_MS = 10000;
const MAX_EVENTS = 1000;

/**
 * Runs HTML, CSS and JavaScript inside an <iframe sandbox="allow-scripts"> with an opaque origin:
 * the frame cannot read this site's cookies or storage, navigate the page, open popups or submit forms.
 * Console output and errors are relayed through postMessage with a per-run nonce.
 */
@Injectable({ providedIn: 'root' })
export class HtmlSandboxEngine implements ExecutionEngine {
  readonly id = 'html-sandbox';
  readonly languages = ['html', 'css', 'javascript'] as const;
  readonly capability = 'browser' as const;

  run(request: RunRequest): Observable<RunEvent> {
    return new Observable<RunEvent>((subscriber) => {
      const host = request.host;
      if (!host) {
        subscriber.next({
          type: 'error',
          message: 'The HTML runner needs an output panel to render into.',
        });
        subscriber.complete();
        return undefined;
      }
      const started = performance.now();
      const nonce = crypto.randomUUID();
      let events = 0;
      const frame = document.createElement('iframe');
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      frame.setAttribute(
        'allow',
        "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; fullscreen 'none'",
      );
      frame.setAttribute('title', 'Code output');
      frame.className = 'cma-sandbox-frame';

      const onMessage = (event: MessageEvent): void => {
        if (!isTrustedSandboxMessage(event, frame.contentWindow, nonce)) return;
        if (events++ > MAX_EVENTS) return;
        const data = event.data;
        if (data.type === 'ready') {
          subscriber.next({ type: 'done', durationMs: Math.round(performance.now() - started) });
          clearTimeout(loadTimer);
        } else if (data.type === 'console') {
          subscriber.next({ type: 'console', level: toLevel(data.level), text: data.text ?? '' });
        } else if (data.type === 'error') {
          subscriber.next({ type: 'error', message: data.message ?? 'Error' });
        }
      };
      window.addEventListener('message', onMessage);
      const loadTimer = setTimeout(() => {
        subscriber.next({
          type: 'error',
          message: 'The page did not finish loading within 10 seconds. Check for an infinite loop.',
        });
      }, LOAD_TIMEOUT_MS);

      host.replaceChildren(frame);
      // srcdoc is assigned as a DOM property, never through a template binding.
      frame.srcdoc = createSandboxDocument(request.language, request.code, nonce);
      subscriber.next({ type: 'status', message: 'Running in a sandboxed frame' });

      return () => {
        clearTimeout(loadTimer);
        window.removeEventListener('message', onMessage);
        frame.remove();
      };
    });
  }
}

function toLevel(level: string | undefined): ConsoleLevel {
  return level === 'info' || level === 'warn' || level === 'error' ? level : 'log';
}
