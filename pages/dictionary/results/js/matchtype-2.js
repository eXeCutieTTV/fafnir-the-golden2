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
        for (const path of entry.suffix.paths) {
          oop.htmlEditing.insertTr(document.getElementById('tableTbody'), `
            <td>${initObj.keyword} (${entry.type})</td>
            <td>${path.map(el => `${el}`).join(', ')}</td>
            <td data-key="${entry.key.replace("-...", "")}" class="pressToLoadTable">temp</td>`);
        }
        let firstPath = entry.suffix.paths[0];
        const dicEntry = DICTIONARY[oop.dictionaryBased.dicIdFromType(IDS.WORDS[entry.type.slice(0, 1)])].MAP[entry.stemReal];
        console.log('dicEntry', dicEntry);
        temp[entry.type] = `<td style="border-top:solid 1px black;">${entry.stemReal} (${entry.type}):</td>
        <td style="border-top:solid 1px black; text-align:left;">${entry.type === ('Noun' || 'Adjective')
            ? `${Object.entries(dicEntry.genders)[0][0]}: ${Object.entries(dicEntry.genders)[0][1]}; ${Object.entries(dicEntry.genders)[1][0]}: ${Object.entries(dicEntry.genders)[1][1]}`.replace(new RegExp(`${firstPath[1]}.+;`), '<strong>$&</strong>')
            : dicEntry.definition.replace(new RegExp(`${firstPath[1]}.+;`), '<strong>$&</strong>')

          }</td>
        <td style="border-top:solid 1px black;" data-key="${entry.type}" class="pressToLoadTable">temp</td>`;
        console.log(entry)
      }
    }
  }
  for (const html of Object.values(temp)) {
    oop.htmlEditing.insertTr(document.getElementById('tableTbody'), html, false);
  }


  function pressableLoadTableButtons() {
    const wrapperWrapper = document.getElementById('loadableTable');
    function clearHtml() { for (const wrapper of wrapperWrapper.children) while (wrapper.firstChild) wrapper.firstChild.remove(); }
    let temp = {
      Verb: false,
      verbSuffix: false,
      other: false,
      Noun: false
    }
    for (const el of document.querySelectorAll('.pressToLoadTable')) {
      //console.log(el, el.dataset.key)
      switch (el.dataset.key) {
        case 'Verb':
          el.addEventListener('click', () => {
            if (temp.Verb) {
              clearHtml();
              temp.Verb = false;
            } else {
              clearHtml();
              oop.htmlEditing.tables.verb(true, 'thox', wrapperWrapper.children[0]);
              oop.htmlEditing.tables.verb(false, 'thox', wrapperWrapper.children[1]);
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
              oop.htmlEditing.tables.verb(true, 'thox', wrapperWrapper.children[1]);
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
              oop.htmlEditing.tables.noun(1, 'Directive', wrapperWrapper.children[0], DICTIONARY.NOUNS.MAP['æklū'].genders);
              oop.htmlEditing.tables.noun(1, 'Recessive', wrapperWrapper.children[1], DICTIONARY.NOUNS.MAP['æklū'].genders);
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
  }
  pressableLoadTableButtons()
});
//highlight the cell that shows the current declension (for stem case^^)