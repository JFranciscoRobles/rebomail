// A message as it goes by SMTP: its headers (the words that are not ASCII
// written as RFC 2047 says) and its two parts, the text and the HTML, each in
// base64 lines of 76.

import { randomBytes } from 'node:crypto';
import type { Message } from './message';

/** The address in `Name <address>`, or the whole if it is only one. */
export const addressOf = (from: string) => (from.match(/<([^<>\s]+@[^<>\s]+)>/)?.[1] ?? from).trim();

/**
 * A header's words, in UTF-8 when they are not all ASCII: in pieces of at most 45 bytes (75 characters once encoded, as
 * RFC 2047 asks), never a character cut between two, on lines of their own.
 */
export function word(value: string) {
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  const pieces: string[] = [];
  let piece = '';
  for (const char of value) {
    if (Buffer.byteLength(piece + char) > 45) {
      pieces.push(piece);
      piece = '';
    }
    piece += char;
  }
  if (piece) pieces.push(piece);
  return pieces.map((p) => `=?UTF-8?B?${Buffer.from(p).toString('base64')}?=`).join('\r\n ');
}

/** A `Name <address>`, its name written as a header's words. */
const mailbox = (value: string) => {
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^<>]+)>\s*$/);
  return m?.[1] ? `${word(m[1])} <${m[2]}>` : value;
};

const lines76 = (text: string) =>
  Buffer.from(text)
    .toString('base64')
    .replace(/.{76}(?=.)/g, '$&\r\n');

/** The message whole, as the DATA of SMTP takes it (its lines ended by CRLF). */
export function toMime(message: Message, now = new Date()): string {
  const boundary = `rm-${randomBytes(12).toString('hex')}`;
  const domain = addressOf(message.from).split('@')[1] ?? 'localhost';
  const headers: [string, string][] = [
    ['From', mailbox(message.from)],
    ['To', mailbox(message.to)],
    ...(message.replyTo ? ([['Reply-To', mailbox(message.replyTo)]] as [string, string][]) : []),
    ['Subject', word(message.subject)],
    ['Date', now.toUTCString().replace('GMT', '+0000')],
    ['Message-ID', `<${randomBytes(16).toString('hex')}@${domain}>`],
    ['MIME-Version', '1.0'],
    ...Object.entries(message.headers),
    ['Content-Type', `multipart/alternative; boundary="${boundary}"`],
  ];
  return [
    ...headers.map(([k, v]) => `${k}: ${v}`),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    lines76(message.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    lines76(message.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}
