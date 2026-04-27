const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const isWatch = process.argv.includes('--watch');

// Ensure dist dir exists
if (!fs.existsSync('dist')) fs.mkdirSync('dist');

// Concatenate webview CSS files to dist
const stylesContent = fs.readFileSync(path.join('src', 'ui', 'webview', 'styles.css'), 'utf8');
const aiBarContent = fs.readFileSync(path.join('src', 'ui', 'webview', 'ai-bar.css'), 'utf8');
fs.writeFileSync(
  path.join('dist', 'webview.css'),
  stylesContent + '\n\n' + aiBarContent
);
fs.copyFileSync(
  path.join('src', 'ui', 'webview', 'ai-bar.css'),
  path.join('dist', 'ai-bar.css')
);

const baseConfig = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  external: ['vscode'],
  logLevel: 'info',
  platform: 'node',
};

async function build() {
  // Extension host bundle
  const extensionCtx = await esbuild.context({
    ...baseConfig,
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
    format: 'cjs',
  });

  // Webview bundle (runs in browser context)
  const webviewCtx = await esbuild.context({
    ...baseConfig,
    entryPoints: ['src/ui/webview/main.ts'],
    outfile: 'dist/webview.js',
    format: 'iife',
    platform: 'browser',
    external: [],
  });

  if (isWatch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
    console.log('Watching for changes...');
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    await extensionCtx.dispose();
    await webviewCtx.dispose();
    console.log('Build complete.');
  }
}

build().catch(e => { console.error(e); process.exit(1); });