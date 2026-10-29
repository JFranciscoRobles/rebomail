// An email sent to many: made for each one (their values, their links, their
// way to stop them), given to the transport in batches, and what became of
// each said by the recipient's id, with the id its provider gave it to know
// it again in the provider's events. Who may be written to (not those who
// stopped them, nor those whose address bounced) is the application's to say:
// it gives only them.

import type { Email } from '@rebomail/core';
import { type PrepareOptions, prepare, type Recipient } from './message';
import type { Transport } from './transports';

export interface SendOptions extends PrepareOptions {
  transport: Transport;
  /** How many messages go to the transport at a time. */
  batch?: number;
  /** Told after each batch: how many have gone of how many. */
  onProgress?: (done: number, of: number) => void;
}

/** What became of an email to one recipient. */
export interface Delivery {
  recipient: string;
  to: string;
  /** The id its provider gave it: Resend's, the SMTP server's. */
  id?: string;
  error?: string;
}

/** Sends an email to each recipient, made for them; what became of each, in their order. */
export async function sendEmail(email: Email, recipients: Recipient[], options: SendOptions): Promise<Delivery[]> {
  const size = Math.max(1, options.batch ?? 100);
  const out: Delivery[] = [];
  for (let i = 0; i < recipients.length; i += size) {
    const batch = recipients.slice(i, i + size);
    const sent = await options.transport.send(batch.map((r) => prepare(email, r, options)));
    batch.forEach((r, j) => out.push({ recipient: r.id, to: r.to, id: sent[j]?.id, error: sent[j]?.error ?? (sent[j] ? undefined : 'The transport said nothing of it.') }));
    options.onProgress?.(out.length, recipients.length);
  }
  return out;
}
