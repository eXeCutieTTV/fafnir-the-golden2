import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  const results = DICTIONARY.ALL_WORDS.fetchByDefinition(initObj.searched);


  //console.log(initObj, results)

  const tbody = document.getElementById('bodyHtml');
  for (const result of results) {
    //console.log(result.definition)
    oop.htmlEditing.insertTr(tbody, `
    <td>${result.text}</td>
    <td>${result.type + ([IDS.WORDS.N, IDS.WORDS.ADJ].includes(result.type) ? ` (${result.declension})` : '')}</td>
    <td>${result.definition.replace(initObj.searched, `<strong>${initObj.searched}</strong>`)}</td>
    <td>${result.forms || '...'}</td>
    <td>${result.usage_notes || '...'}</td>`)
  }
});