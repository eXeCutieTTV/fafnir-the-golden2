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
          oop.htmlEditing.tables.pressableLoadTableButtons({
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

            oop.htmlEditing.tables.pressableLoadTableButtons({
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
});
//highlight the cell that shows the current declension (for stem case^^)
//need def of particles and pp also