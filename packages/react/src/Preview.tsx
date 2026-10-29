// The email as an inbox shows it, made by the renderer: on a computer at its
// width (made smaller to fit, so its columns stay side by side) or on a phone
// at 375 pixels, where they go one under another.

import { renderEmail, type RenderOptions } from '@rebomail/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMail } from './state';

export interface MailPreviewProps {
  device?: 'desktop' | 'phone';
  /** What the renderer is given besides the custom blocks: the values of the variables, the footer, the base of the addresses. */
  options?: Omit<RenderOptions, 'custom' | 'locale'>;
  /** How tall it is, in pixels. */
  height?: number;
  className?: string;
}

export function MailPreview({ device = 'desktop', options, height = 720, className }: MailPreviewProps) {
  const { email, renderers, locale } = useMail();
  const html = useMemo(() => renderEmail(email, { ...options, custom: renderers, locale }).html, [email, options, renderers, locale]);
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const seen = new ResizeObserver(([entry]) => setRoom(entry.contentRect.width));
    seen.observe(el);
    return () => seen.disconnect();
  }, []);
  const width = device === 'phone' ? 375 : email.theme.width + 40;
  const scale = room ? Math.min(1, room / width) : 1;
  return (
    <div ref={box} className={`rm-preview${className ? ` ${className}` : ''}`} style={{ height, background: email.theme.background }}>
      <iframe title="Preview" srcDoc={html} sandbox="" style={{ width, height: height / scale, transform: `scale(${scale})`, transformOrigin: 'top center', border: 0, flex: 'none' }} />
    </div>
  );
}
