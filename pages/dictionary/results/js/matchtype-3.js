console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code
  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  console.log(initObj)
  const results = initObj.results.matchtype3
  for (const pronoun of results.pronoun) {
    console.log(pronoun)
    oop.htmlEditing.insertTr(
      document.getElementById('tableTbody'),
      `
      <td>${pronoun.word}</td>
      <td style="cursor: help; user-select: none;" title="${(Object.entries(pronoun.path).join('\n')).replace(/,/g, ": ")}">${Object.values(pronoun.path).join(', ')}
      <td>${pronoun.type} pronoun</td>`,
      false
    );
  }
});