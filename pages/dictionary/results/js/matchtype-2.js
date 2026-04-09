console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  console.log('initObj', initObj);
  const temp = {
    first: true,
    colIndex: 0
  }
  for (const [stem, value] of Object.entries(initObj.results.matchtype2)) {
    for (const [wordclass, value2] of Object.entries(value)) {
      for (const entry of value2) {
        const typeKey =
          IDS.WORDS[entry.type.slice(0, 3).toUpperCase()] ??
          IDS.WORDS[entry.type.slice(0, 1).toUpperCase()];

        const innerReferenceMap = {
          dicEntry: DICTIONARY[typeKey]?.MAP?.[entry.stemReal],
          affixesStr: oop.htmlEditing.affixesStr(entry.affixes),
          pathsStrs: oop.htmlEditing.pathStr(entry.affixes, wordclass),
          functions: {
            defRow: ({
              dicEntry,
              id
            }) => {
              temp[dicEntry.text] ??= {};

              if (!temp[dicEntry.text][dicEntry.type]) {
                const border = temp.first ? 'border-top:solid 1px black;' : '';
                temp.first = false;

                const html = `
                  <td style="${border}">${dicEntry.text} (${dicEntry.type}):</td>
                  <td colspan="2" style="${border} text-align:left;">${dicEntry.type === IDS.WORDS.N
                    ? Object.entries(dicEntry.genders)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('; ')
                    : dicEntry.definition}</td>
                  <td style="${border} user-select:none; cursor: pointer;"
                      data-wordclass="${dicEntry.type}"
                      data-defrow="true"
                      data-colindex="${temp.colIndex++}"
                      id="${id}">stem</td>`;

                temp[dicEntry.text][dicEntry.type] = html;

                oop.htmlEditing.insertTr(
                  document.getElementById('tableTbody'),
                  html,
                  false
                );

                oop.htmlEditing.tables.pressableLoadTableButtons({
                  el: document.getElementById(id),
                  word: entry.stemReal,
                  ...(dicEntry?.declension && { declension: dicEntry.declension })
                });
              }
            }
          }
        }
        for (const pathStr of innerReferenceMap.pathsStrs) {
          const ids = {
            row: `${initObj.keyword}, ${pathStr.text}`,
            defRow: `${entry.stemReal}`
          }
          console.log({
            pathStr,
            affixesStr: innerReferenceMap.affixesStr,
            ids,
            dicEntry: innerReferenceMap.dicEntry,
            entry,
            typeKey
          });


          // --- Main rows --- //make single function for addrow? and have param for isDefRow?
          oop.htmlEditing.insertTr(
            document.getElementById('tableTbody'), `
            <td>${initObj.keyword} (${entry.type})</td>
            <td>${innerReferenceMap.affixesStr.html}</td>
            <td>${pathStr.html}</td>
            <td data-key="${entry.key.replace("-...", "")}"
                data-wordclass="${innerReferenceMap.dicEntry.type}"
                data-colindex="${temp.colIndex++}"
                id="${entry.key.replace("-...", "")}"
                style="user-select: none; cursor: pointer;">temp</td>`
          );
          oop.htmlEditing.tables.pressableLoadTableButtons({
            el: document.getElementById(entry.key.replace("-...", "")),
            word: initObj.keyword,
            affixesStrValues: innerReferenceMap.affixesStr.values,
            stem: entry.stemReal,
            ...(innerReferenceMap.dicEntry.declension && { declension: innerReferenceMap.dicEntry.declension })
          });


          // --- Definition row (only once per type) ---
          innerReferenceMap.functions.defRow({
            dicEntry: DICTIONARY[wordclass].MAP[stem],
            id: stem,
          });

          if (entry.affixes?.preposition?.preposition || false) {
            innerReferenceMap.functions.defRow({
              dicEntry: DICTIONARY[IDS.WORDS.PP].MAP[entry.affixes?.preposition?.preposition],
              id: entry.affixes?.preposition?.preposition,
            });
          }

          for (const part of entry.affixes?.particle || [{}]) {
            if (!Object.values(part).length > 0) continue;
            innerReferenceMap.functions.defRow({
              dicEntry: DICTIONARY[IDS.WORDS.PART].MAP[part.particle],
              id: part.particle,
            });
          }
        }
      }
    }
  }
});
//highlight the cell that shows the current declension (for stem case^^)
//click cell in word col to search for that stem
//search frompage