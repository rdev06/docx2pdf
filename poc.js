import winax from 'winax';
import path from 'path';
const wordApp = new winax.Object('Word.Application');

const file = path.join(process.cwd(), '.temp/temp-M51lyg')

const doc = wordApp.Documents.Open(path.win32.normalize(file));

console.log(doc);
