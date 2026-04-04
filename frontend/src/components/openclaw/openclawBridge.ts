export interface OpenClawComposeDetail {
  prompt: string;
  source?: string;
  title?: string;
}

export const OPENCLAW_COMPOSE_EVENT = 'openclaw:compose';

export function composeOpenClaw(detail: OpenClawComposeDetail) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<OpenClawComposeDetail>(OPENCLAW_COMPOSE_EVENT, { detail }));
}

