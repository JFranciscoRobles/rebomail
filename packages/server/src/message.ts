// An email made for whom it goes to: the email of Rebomail rendered with
// their values, each link through the tracker, the picture that counts its
// opening, the way to stop them in its foot and in its headers (as Gmail and
// Yahoo ask of whoever sends many); and a message as any transport sends it.

import { type CustomBlock, type Email, type Locale, renderEmail } from '@rebomail/core';
import type { Tracker } from './tracker';

/** A message as a transport sends it. */
export interface Message {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  /** More headers: `List-Unsubscribe`, those of one's own. */
  headers: Record<string, string>;
  /** Marks a provider keeps with it, to know it again in its events (Resend's tags). */
  tags?: Record<string, string>;
}

/** Whom an email goes to: an id of the application's (to know them again in the events), their address and their values. */
export interface Recipient {
  id: string;
  to: string;
  values?: Record<string, string>;
  /** Who answers them, if not the sender: their advisor, their account's owner. */
  replyTo?: string;
}

export interface PrepareOptions {
  from: string;
  replyTo?: string;
  /** Counts the openings and the clicks, and stops the emails; none: neither. */
  tracker?: Tracker;
  /** Whether the openings are counted (a picture in the email); and the clicks (each link through the server). Both, unless said. */
  track?: { opens?: boolean; clicks?: boolean };
  /** Words under the email: who sends it and why it comes. */
  footer?: string;
  /** Where `/…` addresses are, when the email has some. */
  base?: string;
  locale?: Locale;
  custom?: Record<string, CustomBlock>;
  /** Headers on every message. */
  headers?: Record<string, string>;
  tags?: Record<string, string>;
}

/** What may go in a header: one line, without what would start another. */
export const headerValue = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

/** The email made for one recipient, ready to send. */
export function prepare(email: Email, recipient: Recipient, options: PrepareOptions): Message {
  const { tracker } = options;
  const opens = tracker && options.track?.opens !== false;
  const clicks = tracker && options.track?.clicks !== false;
  const unsubscribe = tracker?.unsubscribe(recipient.id);
  const out = renderEmail(email, {
    values: recipient.values,
    base: options.base,
    link: clicks ? (url) => tracker.click(recipient.id, url) : undefined,
    pixel: opens ? tracker.pixel(recipient.id) : undefined,
    unsubscribe,
    footer: options.footer,
    locale: options.locale,
    custom: options.custom,
  });
  const headers: Record<string, string> = { ...options.headers };
  if (unsubscribe) {
    headers['List-Unsubscribe'] = `<${unsubscribe}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }
  return {
    from: headerValue(options.from),
    to: headerValue(recipient.to),
    replyTo: recipient.replyTo || options.replyTo ? headerValue((recipient.replyTo || options.replyTo)!) : undefined,
    subject: headerValue(out.subject),
    html: out.html,
    text: out.text,
    headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [headerValue(k), headerValue(v)])),
    tags: { ...options.tags, recipient: recipient.id },
  };
}
