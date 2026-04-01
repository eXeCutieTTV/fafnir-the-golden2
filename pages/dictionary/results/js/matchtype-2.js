console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  console.log('initObj', initObj);
  const temp = {
    first: true
  };
  for (const [stem, value] of Object.entries(initObj.results.matchtype2)) {
    for (const [wordclass, value2] of Object.entries(value)) {
      for (const entry of value2) {
        const dicEntry = DICTIONARY[IDS.WORDS[entry.type.slice(0, 1)]].MAP[entry.stemReal]; //create const in the outermost loop so its not being redefined for no reason...
        const affixesCheckMap = {
          prefix: entry.affixes.prefix?.paths ?? [[]],
          suffix: entry.affixes.suffix?.paths ?? [[]]
        }
        //console.log(affixesCheckMap)
        for (const prefixPaths of affixesCheckMap.prefix) {
          for (const suffixPaths of affixesCheckMap.suffix) {
            const pathStr = `${prefixPaths.join(', ')} | ${suffixPaths.join(', ')}`.trim();
            const ids = {
              row: `${initObj.keyword}, ${pathStr}`,
              defRow: `${entry.stemReal}`
            }
            console.log({
              affixPaths: [prefixPaths, suffixPaths],
              pathStr,
              dicEntry,
              ids,
              kv1: [stem, value],
              kv2: [wordclass, value2],
              entry
            });

            // --- Main row ---
            oop.htmlEditing.insertTr(
              document.getElementById('tableTbody'), `
                <td>${/*`${entry.affixes.prefix.prefix}<strong>${entry.stem}</strong>${entry.affixes.suffix.suffix}`*/initObj.keyword} (${entry.type})</td>
                <td>${pathStr}</td>
                <td data-key="${entry.key.replace("-...", "")}" 
                    id="${ids.row}">temp</td>`
            );
            pressableLoadTableButtons(
              document.getElementById(ids.row),
              initObj.keyword
            );

            // --- Definition row (only once per type) ---
            temp[stem] ??= {};


            if (!temp[stem][wordclass]) {
              const highlight = (str) =>
                str.replace(new RegExp(`${entry.stem}.+;`), '<strong>$&</strong>');

              const definition =
                wordclass === 'Noun' || wordclass === 'Adjective'
                  ? highlight(
                    Object.entries(dicEntry.genders)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('; ')
                  )
                  : highlight(dicEntry.definition);

              const border = temp.first ? 'border-top:solid 1px black;' : '';
              temp.first = false;

              temp[stem][wordclass] = `
                <td style="${border}">
                    ${entry.stemReal} (${wordclass}):
                </td>
                <td style="${border} text-align:left;">
                    ${definition}
                </td>
                <td style="${border}" 
                    data-key="${wordclass}" 
                    id="${ids.defRow}">temp</td>
              `;

              oop.htmlEditing.insertTr(
                document.getElementById('tableTbody'),
                temp[stem][wordclass],
                false
              );

              pressableLoadTableButtons(
                document.getElementById(ids.defRow),
                entry.stemReal
              );
            }

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

    switch (el.dataset.key) {
      case 'Verb':
        el.addEventListener('click', () => {
          const isEmpty = !Array.from(wrapperWrapper.children).some(child => child.innerHTML.trim().length > 0);
          clearHtml();
          if (isEmpty) {
            oop.htmlEditing.tables.verb(true, word, wrapperWrapper.children[0]);
            oop.htmlEditing.tables.verb(false, word, wrapperWrapper.children[1]);
            el.dataset.tableToggleState = true;//idk. fix later...
          }
        });
        break;
      case 'verbSuffix':
        el.addEventListener('click', () => {
          const isEmpty = !Array.from(wrapperWrapper.children).some(child => child.innerHTML.trim().length > 0);
          clearHtml();
          if (isEmpty) oop.htmlEditing.tables.verb(true, word, wrapperWrapper.children[1]);
        });
        break;
      case 'verbPrefix':
        el.addEventListener('click', () => {
          const isEmpty = !Array.from(wrapperWrapper.children).some(child => child.innerHTML.trim().length > 0);
          clearHtml();
          if (isEmpty) {
            oop.htmlEditing.tables.verb(false, word, wrapperWrapper.children[0]);
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
      case 'verbPrefix-verbSuffix':
        el.textContent = 'unavaliable';
        break;
    }
  }
});
//highlight the cell that shows the current declension (for stem case^^)