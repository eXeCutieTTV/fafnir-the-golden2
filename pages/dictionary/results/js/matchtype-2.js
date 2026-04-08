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
        const typeKey =
          IDS.WORDS[entry.type.slice(0, 3).toUpperCase()] ??
          IDS.WORDS[entry.type.slice(0, 1).toUpperCase()];

        const dicEntry = DICTIONARY[typeKey]?.MAP?.[entry.stemReal]; //create const in the outermost loop so its not being redefined for no reason...
        const affixesStr = oop.htmlEditing.affixesStr(entry.affixes);
        const pathStrs = oop.htmlEditing.pathStr(entry.affixes);
        for (const pathStr of pathStrs) {
          const ids = {
            row: `${initObj.keyword}, ${pathStr.text}`,
            defRow: `${entry.stemReal}`
          }
          console.log({
            pathStrs,
            pathStr,
            affixesStr,
            ids,
            dicEntry,
            entry,
            typeKey
          });


          // --- Main rows ---
          oop.htmlEditing.insertTr(
            document.getElementById('tableTbody'), `
            <td>${initObj.keyword} (${entry.type})</td>
            <td>${affixesStr.html}</td>
            <td>${pathStr.html}</td>
            <td data-key="${entry.key.replace("-...", "")}"
                data-wordclass="${dicEntry.type}"
                id="${entry.key.replace("-...", "")}"
                style="user-select: none; cursor: pointer;">temp</td>`
          );
          pressableLoadTableButtons({
            el: document.getElementById(entry.key.replace("-...", "")),
            word: initObj.keyword,
            affixesStrValues: affixesStr.values,
            stem: entry.stemReal,
            ...(dicEntry.declension && { declension: dicEntry.declension })
          });

          // --- Definition row (only once per type) ---

          temp[stem] ??= {};

          if (!temp[stem][wordclass]) {
            const highlight = (str) =>
              str.replace(new RegExp(`${entry.stem}.+;`), '<strong>$&</strong>');

            const definition =
              wordclass === IDS.WORDS.N
                ? highlight(
                  Object.entries(dicEntry.genders)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('; ')
                )
                : highlight(dicEntry.definition);

            const border = temp.first ? 'border-top:solid 1px black;' : '';
            temp.first = false;

            temp[stem][wordclass] = `
                  <td style="${border}">${entry.stemReal} (${wordclass}):</td>
                  <td colspan="2" style="${border} text-align:left;">${definition}</td>
                  <td style="${border} user-select:none; cursor: pointer;" 
                      data-key="${wordclass}"
                      data-wordclass="${dicEntry.type}"
                      data-defrow="true"
                      id="${ids.defRow}">stem</td>
                `;

            oop.htmlEditing.insertTr(
              document.getElementById('tableTbody'),
              temp[stem][wordclass],
              false
            );

            pressableLoadTableButtons({
              el: document.getElementById(ids.defRow),
              word: entry.stemReal,
              ...(dicEntry.declension && { declension: dicEntry.declension })
            });

          }
          /*
          
          const affixesCheckMap = {
            prefix: entry.affixes.prefix?.paths ?? [[]],
            suffix: entry.affixes.suffix?.paths ?? [[]]
          }
          //console.log(affixesCheckMap)
          for (const prefixPaths of affixesCheckMap.prefix) {
            for (const suffixPaths of affixesCheckMap.suffix) {
              const pathStr = `${prefixPaths.join(', ')} | ${suffixPaths.join(', ')}`.trim(); //pathStr()
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
                  <td>${initObj.keyword} (${entry.type})</td>
                  <td>${pathStr}</td>
                  <td data-key="${entry.key.replace("-...", "")}" 
                      id="${ids.row}"
                      style="user-select: none; cursor: pointer;">temp</td>`
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
                  <td style="${border} user-select:none; cursor: pointer;" 
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
          */
        }
      }
    }
  }
  //for (const html of Object.values(temp)) {
  //  oop.htmlEditing.insertTr(document.getElementById('tableTbody'), html, false);
  //}


  function pressableLoadTableButtons({ el, word, affixesStrValues = [], declension = 1, stem = word }) {
    const wrapperWrapper = document.getElementById('loadableTable').children;
    console.log(affixesStrValues)

    const wordClass = el.dataset.wordclass;
    const hasPrefix = affixesStrValues[2] !== 'ø';
    const hasSuffix = affixesStrValues[4] !== 'ø';

    const referenceMap = {
      consts: {},
      functions: {
        tables: {
          [IDS.WORDS.N]: () => {//same indexing for oop.htmlEditin.tables[i] etc
            referenceMap.functions.misc.clearHtml();
            oop.htmlEditing.tables.noun(declension, 'Directive', wrapperWrapper[0], word, stem);
            oop.htmlEditing.tables.noun(declension, 'Recessive', wrapperWrapper[1], word, stem);
          },
          [IDS.WORDS.V]: (hasPrefix = true, hasSuffix = true) => {
            referenceMap.functions.misc.clearHtml();
            hasPrefix ? oop.htmlEditing.tables.verb(true, word, wrapperWrapper[0]) : null;
            hasSuffix ? oop.htmlEditing.tables.verb(false, word, wrapperWrapper[1]) : null;
          },
          [IDS.WORDS.DET]: () => {
            referenceMap.functions.misc.clearHtml();
            oop.htmlEditing.tables.determiner(wrapperWrapper[0], word);
          },
          [IDS.WORDS.ADJ]: () => {
            referenceMap.functions.misc.clearHtml();
            oop.htmlEditing.tables.adjective(declension, 'Directive', wrapperWrapper[0], word, stem);
            oop.htmlEditing.tables.adjective(declension, 'Recessive', wrapperWrapper[1], word, stem);
          }
        },
        misc: {
          clearHtml: () => { for (const wrapper of wrapperWrapper) while (wrapper.firstChild) wrapper.firstChild.remove(); }
        }
      }
    }

    if (el.dataset.defrow) {
      switch (wordClass) {
        case IDS.WORDS.N:
          el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.N](); });
          break;
        case IDS.WORDS.V:
          el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.V](); });
          break;
        case IDS.WORDS.DET:
          el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.DET](); });
          break;
        case IDS.WORDS.ADJ:
          el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.ADJ](); });
          break;
        case IDS.WORDS.AUX:
          el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.V](true, false); });
          break;
        case IDS.WORDS.PP:
        case IDS.WORDS.ADV:
        case IDS.WORDS.CON:
        case IDS.WORDS.PART:
          el.textContent = 'tables unavailable';
          break;
        default: break;
      }
      return;
    }

    // both prefix + suffix
    if (hasPrefix && hasSuffix) {
      el.textContent = 'tables unavailable';
    }

    // prefix only
    else if (hasPrefix && !hasSuffix) {
      if (wordClass === IDS.WORDS.V) {
        el.textContent = 'verb suffix table';
        el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.V](false, true); });
      } else {
        el.textContent = 'tables unavailable';
      }
      return;
    }

    // suffix only
    else if (!hasPrefix && hasSuffix) {
      if (wordClass === IDS.WORDS.V) {
        el.textContent = 'verb prefix table';
        el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.V](true, false); });
      } else {
        el.textContent = 'tables unavailable';
      }
    }

    // no affixes
    else if (!hasPrefix && !hasSuffix) {
      switch (wordClass) {
        case IDS.WORDS.N:
          el.textContent = 'noun tables';
          el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.N](); });
          break;

        case IDS.WORDS.V:
          el.textContent = 'verb tables';
          el.addEventListener('click', () => { referenceMap.functions.tables[IDS.WORDS.V](); });
          break;

        default:
          el.textContent = 'tables unavailable';
      }
    }


    /*
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
          const isEmpty = !Array.from(wrapperWrapper.children).some(child => child.innerHTML.trim().length > 0);
          clearHtml();
          if (isEmpty) {
            oop.htmlEditing.tables.noun(1, 'Directive', wrapperWrapper.children[0], word);
            oop.htmlEditing.tables.noun(1, 'Recessive', wrapperWrapper.children[1], word);
          }
        });
        break;
      case 'nounSuffix':
      case 'verbPrefix-verbSuffix':
      default:
        el.textContent = 'unavaliable';
        el.style.cursor = 'default';
        break;
        */


  }
});
//highlight the cell that shows the current declension (for stem case^^)
//need def of particles and pp also