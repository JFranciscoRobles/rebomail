// The addresses an email carries back to the server, each signed with its
// secret: the picture that counts its opening, each link on its way to where it
// goes (counting the click), and the page that stops the emails. Whom each is
// of goes in it as a token: the recipient's id and the mark that the server
// made it. A link changed on its way, or made by anyone else, is not followed.

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TrackerOptions {
  /** Long, random, the same in every process: what the addresses are signed with. */
  secret: string;
  /** Where the server is seen from outside: `https://example.com`. */
  base: string;
  /** The path its routes are under. */
  prefix?: string;
}

export interface Tracker {
  /** The token of a recipient: their id, and the mark that it is ours. */
  token(recipient: string): string;
  /** Whose a token is; none if it is not one of ours. */
  read(token: string): string | null;
  /** A link through the server, counting its click. */
  click(recipient: string, url: string): string;
  /** Whether a link through the server is as it was made. */
  isClick(token: string, url: string, mark: string): boolean;
  /** The picture that counts the opening. */
  pixel(recipient: string): string;
  /** The page that stops the emails, and the address an inbox posts to in one click (`List-Unsubscribe`). */
  unsubscribe(recipient: string): string;
  readonly prefix: string;
}

const mark = (secret: string, value: string) => createHmac('sha256', secret).update(value).digest('base64url').slice(0, 27);
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function createTracker({ secret, base, prefix = '/mail' }: TrackerOptions): Tracker {
  if (secret.length < 16) throw new Error('The secret of the tracker is at least 16 characters: long and random.');
  const root = `${base.replace(/\/$/, '')}${prefix}`;
  const token = (recipient: string) => {
    const id = Buffer.from(recipient).toString('base64url');
    return `${id}.${mark(secret, `r:${id}`)}`;
  };
  return {
    prefix,
    token,
    read: (t) => {
      const [id, m] = t.split('.');
      if (!id || !m || !same(m, mark(secret, `r:${id}`))) return null;
      return Buffer.from(id, 'base64url').toString();
    },
    click: (recipient, url) => {
      const t = token(recipient);
      return `${root}/c/${t}?u=${encodeURIComponent(url)}&s=${mark(secret, `c:${t}:${url}`)}`;
    },
    isClick: (t, url, m) => same(m, mark(secret, `c:${t}:${url}`)),
    pixel: (recipient) => `${root}/o/${token(recipient)}.gif`,
    unsubscribe: (recipient) => `${root}/u/${token(recipient)}`,
  };
}
