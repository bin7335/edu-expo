// pdf-tidy 빌드: template.html + pdf-lib.min.js -> edu-expo/pdf-tidy/index.html
const fs = require('fs'), path = require('path');
const here = __dirname;
const lib = fs.readFileSync(path.join(here, 'package/dist/pdf-lib.min.js'), 'utf8')
  .replace(/\n?\/\/# sourceMappingURL=.*$/m, '');
const ver = JSON.parse(fs.readFileSync(path.join(here, 'package/package.json'), 'utf8')).version;
let html = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
html = html.replace('__PDFLIB_VERSION__', ver).split('__PDFLIB__').join(lib);
const outDir = path.resolve(here, '../../pdf-tidy');
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('written', html.length);
