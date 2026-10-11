const path = require('node:path');
const fs = require('node:fs');
const webpack = require('webpack');
const root = path.resolve(__dirname, '..');
webpack({
  mode: 'production', entry: path.join(__dirname, 'index.tsx'),
  output: { path: path.join(__dirname, 'dist'), filename: 'app.js' },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: { rules: [{ test: /\.tsx?$/, use: { loader: require.resolve('ts-loader'), options: { transpileOnly: true } }, exclude: /node_modules/ }] },
  performance: { hints: false },
}, (error, stats) => {
  if (error || stats.hasErrors()) { console.error(error || stats.toString({ all: false, errors: true })); process.exitCode = 1; return; }
  const css = ['CmsUploadDemo.css', 'IntegrationLab.css'].map(file => fs.readFileSync(path.join(root, 'CmsUploadDemo/css', file), 'utf8')).join('\n');
  const js = fs.readFileSync(path.join(__dirname, 'dist/app.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
  fs.writeFileSync(path.join(__dirname, 'dist/index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>XCL Profile Photo — Demo</title><style>html,body{margin:0;min-height:100%;background:#f4f5f7}#root>.xp-app{min-height:100vh}${css}</style></head><body><div id="root"></div><script type="application/json" id="demo-output">{}</script><script>${js}</script></body></html>`);
  console.log('Preview built: preview/dist/index.html');
});
