// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('core', {
  entries: { index: 'src/index.ts' },
  exports: { '.': 'index' },
  keywords: ['email', 'newsletter', 'html-email', 'templates', 'blocks'],
  homepage: 'https://github.com/JFranciscoRobles/rebomail#readme',
});
