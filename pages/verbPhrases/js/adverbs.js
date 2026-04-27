console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code
  for (const entry of Object.values(DICTIONARY[IDS.WORDS.ADV].MAP)) {
    const html = `
      <td><italic>${entry.text || '...'}</italic></td>
      <td>${entry.definition || '...'}</td>
      <td><italic>${(entry.forms === 'nan' ? 'defective' : entry.forms) || 'defective'}</italic></td>
      <td>${entry.usage_notes || '...'}</td>
    `;
    oop.htmlEditing.insertTr(document.getElementById('adverbsTableTbody'), html, false)

  }
});