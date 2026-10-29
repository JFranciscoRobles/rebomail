// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('react', {
  entries: { index: 'src/index.ts' },
  exports: { '.': 'index' },
  assets: { './styles.css': 'src/styles.css' },
  client: ['index'],
  keywords: ['email', 'newsletter', 'editor', 'react', 'drag-and-drop', 'html-email'],
  homepage: 'https://github.com/JFranciscoRobles/rebomail#readme',
});
