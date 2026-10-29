// The blocks there are to put, by what they are for: each dragged onto the
// email, or put with a click after the block chosen.

import { useMail } from './state';

export function MailPalette({ className }: { className?: string }) {
  const { palette, words, drag, add } = useMail();
  const groups = [...new Set(palette.map((p) => p.group))];
  return (
    <div className={`rm-palette${className ? ` ${className}` : ''}`}>
      <p className="rm-help">{words.paletteHelp}</p>
      {groups.map((group) => (
        <div key={group} className="rm-palette-group">
          <p className="rm-label">{group}</p>
          {palette
            .filter((p) => p.group === group)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', p.id);
                  e.dataTransfer.effectAllowed = 'copy';
                  drag({ entry: p.id, type: p.type });
                }}
                onDragEnd={() => drag(null)}
                onClick={() => add(p.id)}
                className="rm-palette-item"
              >
                {p.icon}
                {p.label}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
