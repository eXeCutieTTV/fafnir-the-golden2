console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  console.log('initObj', initObj);
  const temp = {};
  for (const [stem, value] of Object.entries(initObj.results.matchtype2)) {
    for (const [wordclass, value2] of Object.entries(value)) {
      for (const entry of value2) {
        const dicEntry = DICTIONARY[oop.dictionaryBased.dicIdFromType(IDS.WORDS[entry.type.slice(0, 1)])].MAP[entry.stemReal]; //create const in the outermost loop so its not being redefined for no reason...
        console.log(entry);
        const affixNeutralAffixArray = Object.entries(entry)[1][1]
        console.log(affixNeutralAffixArray);

        for (const path of affixNeutralAffixArray.paths) {
          const pathStr = path.join(', ');
          const rowId = `${initObj.keyword}, ${pathStr}`;
          const defRowId = `${entry.stemReal}, ${pathStr}`;
          //console.log('pathStr', pathStr)
          console.log('dicEntry', dicEntry);
          //console.log('path', path);
          //console.log('entry', entry);

          // --- Main row ---
          oop.htmlEditing.insertTr(document.getElementById('tableTbody'), `
            <td>${initObj.keyword} (${entry.type})</td>
            <td>${path.map(el => `${el}`).join(', ')}</td>
            <td data-key="${entry.key.replace("-...", "")}" 
                id="${rowId}">temp</td>`);
          pressableLoadTableButtons(document.getElementById(rowId), initObj.keyword);

          // --- Definition row (only once per type) ---
          if (!temp[entry.type]) {
            const highlight = (str) =>
              str.replace(new RegExp(`${path[1]}.+;`), '<strong>$&</strong>');
            const definition =
              entry.type === 'Noun' || entry.type === 'Adjective'
                ? highlight(
                  Object.entries(dicEntry.genders)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('; ')
                )
                : highlight(dicEntry.definition);

            temp[entry.type] = `
              <td style="border-top:solid 1px black;">
                ${entry.stemReal} (${entry.type}):
              </td>
              <td style="border-top:solid 1px black; text-align:left;">
                ${definition}
              </td>
              <td style="border-top:solid 1px black;" 
                  data-key="${entry.type}" 
                  id="${defRowId}">temp</td>
            `;
            oop.htmlEditing.insertTr(document.getElementById('tableTbody'), temp[entry.type], false);
            pressableLoadTableButtons(document.getElementById(defRowId), entry.stemReal);
          }
        }
      }
    }
  }
  //for (const html of Object.values(temp)) {
  //  oop.htmlEditing.insertTr(document.getElementById('tableTbody'), html, false);
  //}


  function pressableLoadTableButtons(el, word, object = {}) {
    const wrapperWrapper = document.getElementById('loadableTable');
    function clearHtml() { for (const wrapper of wrapperWrapper.children) while (wrapper.firstChild) wrapper.firstChild.remove(); }
    let temp = {
      Verb: false,
      verbSuffix: false,
      other: false,
      Noun: false
    }
    //console.log(el, el.dataset.key)
    switch (el.dataset.key) {
      case 'Verb':
        el.addEventListener('click', () => {
          if (temp.Verb) {
            clearHtml();
            temp.Verb = false;
          } else {
            clearHtml();
            oop.htmlEditing.tables.verb(true, word, wrapperWrapper.children[0]);
            oop.htmlEditing.tables.verb(false, word, wrapperWrapper.children[1]);
            temp.Verb = true;
          }
          for (let key in temp) {
            if (key !== 'Verb') temp[key] = false;
          }
        });
        break;
      case 'verbSuffix':
        el.addEventListener('click', () => {
          if (temp.verbSuffix) {
            clearHtml();
            temp.verbSuffix = false;
          } else {
            clearHtml();
            oop.htmlEditing.tables.verb(true, word, wrapperWrapper.children[1]);
            temp.verbSuffix = true;
          }
          for (let key in temp) {
            if (key !== 'verbSuffix') temp[key] = false;
          }
        });
        break;
      case 'Noun':
        el.addEventListener('click', () => {
          if (temp.Noun) {
            clearHtml();
            temp.Noun = false;
          } else {
            clearHtml();
            oop.htmlEditing.tables.noun(1, 'Directive', wrapperWrapper.children[0], word);
            oop.htmlEditing.tables.noun(1, 'Recessive', wrapperWrapper.children[1], word);
            //oop.htmlEditing.tables.populate(word, wrapperWrapper.children[0]);
            //oop.htmlEditing.tables.populate(word, wrapperWrapper.children[1]);
            temp.Noun = true;
          }
          for (let key in temp) {
            if (key !== 'Noun') temp[key] = false;
          }
        });
        break;
      case 'nounSuffix':
        el.textContent = 'unavaliable';
        break;
    }
  }
});
//highlight the cell that shows the current declension (for stem case^^)