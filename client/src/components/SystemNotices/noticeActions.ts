import type { NavigateFunction } from 'react-router';

export interface NoticeActionContext {
  navigate: NavigateFunction;
}
type NoticeActionHandler = (ctx: NoticeActionContext) => void | Promise<void>;

const actions = new Map<string, NoticeActionHandler>();

export function registerNoticeAction(id: string, handler: NoticeActionHandler): void {
  actions.set(id, handler);
}

export function runNoticeAction(id: string, ctx: NoticeActionContext): void {
  const handler = actions.get(id);
  if (!handler) {
    console.error(`[systemNotices] unknown action CTA id: "${id}". Register it via registerNoticeAction().`);
    return;
  }
  void handler(ctx);
}
