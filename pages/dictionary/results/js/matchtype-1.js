console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  oop.searching.setup(document.getElementById('search_field'), document.getElementById('search_button'));

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  console.log({
    DICTIONARY,
    initObj
  });
  const temp = {
    colIndex: 0
  }

  for (const result of initObj.results.matchtype1) {
    console.log({ result })

    const id = `${result.text}_${result.type}_${result?.declension}`.trim();

    oop.htmlEditing.insertTr(
      document.getElementById('tableTbody'), `
      <td>${result.text} (${(result.type + ' ' + (result?.declension || '')).trim()})</td>
      <td>${result.type === IDS.WORDS.N
      ? Object.entries(result.genders)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')
      : result.definition}</td>
      <td>${result.usage_notes || '...'}</td>
      <td data-defrow="true"
          data-wordclass="${result.type}"
          data-colindex="${temp.colIndex++}"
          id="${id}"
          style="user-select:none; cursor: pointer;">temp</td>`
    );

    oop.htmlEditing.tables.pressableLoadTableButtons({
      el: document.getElementById(id),
      word: result.text,
      ...(result?.declension && { declension: result.declension })
    });
  }
});