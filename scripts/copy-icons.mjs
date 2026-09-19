// Copies node and credential icons into dist/, next to the compiled files that
// reference them (`icon: 'file:sapaid.svg'` resolves relative to the .js). The
// source prefix is preserved: credentials/sapaid.svg -> dist/credentials/sapaid.svg.
import { cpSync, existsSync, statSync } from 'node:fs';

const ICON = /\.(svg|png)$/i;

for (const dir of ['credentials', 'nodes']) {
  if (!existsSync(dir)) {
    continue;
  }
  cpSync(dir, `dist/${dir}`, {
    recursive: true,
    // A directory has to pass the filter or cpSync never walks into it, so the
    // extension test applies to files only.
    filter: (src) => statSync(src).isDirectory() || ICON.test(src),
  });
}
