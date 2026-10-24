import { failOp, type BookOpsContext } from '../book-ops-core';
import type { BookDocument, BookPageSetup, BookSpread } from '../book.schema';
import { applyDecoratedTemplate } from './template-apply';
import type { BookDecoratedTemplate } from './template-format';
import { bookTemplateWords, type BookTemplateWordSource } from './template-words';

/**
 * The page operation `layout` with a decorated template: the same apply the
 * Studio's templates panel runs, given the words and the figures the book
 * engine knows, so a page the assistant lays out on a template is the page a
 * person would get by clicking it.
 */

interface DecoratedLayoutEnv {
  doc: BookDocument;
  page: BookPageSetup;
  ctx: BookOpsContext;
  newId: (prefix: string) => string;
  opIndex: number;
}

/** What the engine knows of the journey's words: the journal entries with the dates the travel figures carry. */
function templateWordSourceOf(doc: BookDocument, ctx: BookOpsContext): BookTemplateWordSource {
  const travel = ctx.travel?.entries ?? [];
  const dates = new Map(travel.map((e) => [e.id, e.date]));
  const entries = (ctx.journey?.entries ?? travel).map((e) => ({
    id: e.id,
    title: e.title ?? null,
    story: e.story ?? null,
    location: e.location ?? null,
    // A date is set in the book's language, which only the travel context knows.
    date: ctx.travel ? (dates.get(e.id) ?? null) : null,
  }));
  return {
    bookTitle: doc.title.trim() || ctx.journey?.title || '',
    subtitle: ctx.journey?.subtitle ?? null,
    locale: ctx.travel?.locale ?? 'en',
    entries,
  };
}

/** The spread laid out on a decorated template, refused when the template is for the other kind of page. */
export function opDecoratedLayout(spread: BookSpread, tpl: BookDecoratedTemplate, env: DecoratedLayoutEnv): BookSpread {
  const single = spread.role !== 'inner';
  if ((tpl.kind === 'single') !== single) {
    throw failOp(
      'layout_role',
      `${tpl.id} is a ${tpl.kind === 'single' ? 'single-page (cover) template' : 'double-spread template'}; this page is ${single ? 'a single page' : 'a double spread'}`,
      env.opIndex,
    );
  }
  return applyDecoratedTemplate(spread, tpl, env.page, {
    theme: env.doc.theme ?? null,
    words: bookTemplateWords(spread, templateWordSourceOf(env.doc, env.ctx)),
    travel: env.ctx.travel ?? null,
    ...(env.ctx.travel ? { locale: env.ctx.travel.locale } : {}),
    newId: env.newId,
  });
}
