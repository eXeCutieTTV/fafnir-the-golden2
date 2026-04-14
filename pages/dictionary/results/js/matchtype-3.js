console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  oop.searching.setup(document.getElementById('search_field'), document.getElementById('search_button'));

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  console.log(initObj)
  const results = initObj.results.matchtype3
  for (const pronoun of results.pronoun) { //pronouns
    //console.log(pronoun)
    oop.htmlEditing.insertTr(
      document.getElementById('tableTbody'),
      `
      <td class="fontable" data-font-state="false">${pronoun.word}</td>
      <td style="cursor: help; user-select: none;" title="${(Object.entries(pronoun.path).join('\n')).replace(/,/g, ": ")}">${Object.values(pronoun.path).join(', ')}
      <td>${pronoun.type} pronoun</td>`,
      false
    );
  }
  for (const correlative of results.correlative) { //correlatives
    //console.log(correlative)
    oop.htmlEditing.insertTr(
      document.getElementById('tableTbody'),
      `
      <td class="fontable" data-font-state="false">${correlative.word}</td>
      <td style="cursor: help; user-select: none;" title="${(Object.entries(correlative.path).join('\n')).replace(/,/g, ": ")}">${Object.values(correlative.path).join(', ')}
      <td>${correlative.type}</td>`,
      false
    );
  }
  for (const determiner of results.determiner) {
    console.log(determiner)
    oop.htmlEditing.insertTr(
      document.getElementById('tableTbody'),
      `
      <td class="fontable" data-font-state="false">${determiner.word.text}</td>
      <td style="cursor: help; user-select: none;" title="${(Object.entries(determiner.path).join('\n')).replace(/,/g, ": ")}">${Object.values(determiner.path).join(', ')}
      <td>${determiner.type}</td>`,
      false
    );
  }
  for (const lur of results.lur) {
    console.log(lur)
    const path = Object.assign(lur.form, lur.path)
    oop.htmlEditing.insertTr(
      document.getElementById('tableTbody'),
      `
      <td class="fontable" data-font-state="false">${lur.word}</td>
      <td style="cursor: help; user-select: none;" title="${(Object.entries(path).join('\n')).replace(/,/g, ": ")}">${Object.values(path).join(', ')}
      <td>${'to be (copula)'}</td>`,
      false
    );
  }
  if (Object.values(results.lur).length > 0) document.getElementById('loadableTable').style.display = 'block';
  oop.searching.manualNavigationSetup(initObj, 3);
  oop.htmlEditing.transcribe(document.getElementById("resultTable"));
});