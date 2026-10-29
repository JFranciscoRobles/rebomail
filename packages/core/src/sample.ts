// An email to start from and to try things with: a cover, a text, a section
// with two columns, a quote, a coupon, a rating and the links at the foot, in
// English or Spanish.

import { blankEmail, newId } from './blocks';
import type { Email } from './model';
import type { Locale } from './render';

export function sampleEmail(locale: Locale = 'en'): Email {
  const es = locale === 'es';
  const id = newId;
  return {
    ...blankEmail({ name: es ? 'Estudio Rebo' : 'Rebo Studio' }),
    subject: es ? '{name}, esto es lo nuevo de este mes' : "{name}, here is what's new this month",
    preheader: es ? 'Tres cosas que te pueden servir, en dos minutos.' : 'Three things you may find useful, in two minutes.',
    blocks: [
      {
        id: id(),
        type: 'hero',
        src: '',
        title: es ? 'Hola {name}, empezamos algo nuevo' : 'Hi {name}, we started something new',
        text: es ? 'Te contamos en **dos minutos** qué cambió y qué viene.' : "In **two minutes**, what changed and what's next.",
        label: es ? 'Ver más' : 'See more',
        url: 'https://example.com',
      },
      {
        id: id(),
        type: 'section',
        look: 'gray',
        blocks: [
          { id: id(), type: 'heading', text: es ? 'Lo nuevo' : "What's new" },
          {
            id: id(),
            type: 'columns',
            widths: '1-1',
            columns: [
              [{ id: id(), type: 'text', text: es ? '**Más rápido.** Todo carga en la mitad del tiempo.' : '**Faster.** Everything loads in half the time.' }],
              [{ id: id(), type: 'text', text: es ? '**Más claro.** Una sola pantalla para lo de todos los días.' : '**Clearer.** One screen for everyday work.' }],
            ],
          },
        ],
      },
      { id: id(), type: 'quote', text: es ? 'Lo usamos desde el primer día y no hemos vuelto atrás.' : "We've used it since day one and never looked back.", author: es ? 'Un cliente' : 'A customer' },
      {
        id: id(),
        type: 'coupon',
        code: 'HELLO20',
        text: es ? 'Por estar desde el principio: **20%** en tu siguiente mes.' : 'For being here from the start: **20% off** your next month.',
        note: es ? 'Hasta el 30 de noviembre.' : 'Until November 30.',
      },
      { id: id(), type: 'rating', text: es ? '¿Qué te pareció este correo?' : 'How was this email?', url: 'https://example.com/survey?score={score}' },
      { id: id(), type: 'social', links: { website: 'https://example.com' } },
    ],
  };
}
