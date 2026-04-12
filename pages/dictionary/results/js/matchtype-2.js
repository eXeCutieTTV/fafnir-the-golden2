console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  oop.searching.setup(document.getElementById('search_field'), document.getElementById('search_button'));

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  console.log('initObj', initObj);
  const temp = {
    first: true,
    colIndex: 0
  }

  function getPathVariants({ affixes, wordclass, verbForms = [] }) {
    const renderedPaths = oop.htmlEditing.pathStr(affixes, wordclass, verbForms);
    const prefixPaths = affixes?.prefix?.paths || [[]];
    const suffixPaths = affixes?.suffix?.paths || [[]];
    const variants = [];
    let renderedIndex = 0;

    for (const prefixPath of prefixPaths) {
      for (const suffixPath of suffixPaths) {
        variants.push({
          ...renderedPaths[renderedIndex++],
          prefixPath,
          suffixPath
        });
      }
    }

    return variants;
  }

  function expandDictionaryEntries(dicEntry) {
    if (!dicEntry) return [];
    if (dicEntry?.type === IDS.OTHER.MD || dicEntry?.values) return Object.values(dicEntry.values || {});
    return [dicEntry];
  }

  function resolveDictionaryEntries({ stemReal, wordclass, pathVariant, fallbackEntry }) {
    if (fallbackEntry?.affixes?.irregular) return [fallbackEntry.raws[1].word];

    const typeKey =
      IDS.WORDS[wordclass?.slice(0, 3).toUpperCase()] ??
      IDS.WORDS[wordclass?.slice(0, 1).toUpperCase()];
    const candidateEntries = expandDictionaryEntries(
      DICTIONARY[typeKey]?.MAP?.[stemReal]
    );

    if (!(wordclass === IDS.WORDS.N || wordclass === IDS.WORDS.ADJ)) {
      return candidateEntries.length > 0 ? candidateEntries : expandDictionaryEntries(fallbackEntry);
    }

    const suffixDeclension = pathVariant?.suffixPath?.[3];
    const matchingEntries = suffixDeclension
      ? candidateEntries.filter(candidate => candidate?.declension === suffixDeclension)
      : candidateEntries;

    if (matchingEntries.length > 0) return matchingEntries;
    if (candidateEntries.length > 0) return candidateEntries;
    return expandDictionaryEntries(fallbackEntry);
  }

  for (const [stem, value] of Object.entries(initObj.results.matchtype2)) {
    for (const [wordclass, value2] of Object.entries(value)) {
      for (const entry of value2) {
        const typeKey =
          IDS.WORDS[entry.type.slice(0, 3).toUpperCase()] ??
          IDS.WORDS[entry.type.slice(0, 1).toUpperCase()];

        const innerReferenceMap = {
          verbForms: oop.searching.isVForm(entry.stem),
          MD: oop.searching.isMD(entry.stem),
          dicEntry: entry?.affixes?.irregular ? entry.raws[1].word : DICTIONARY[typeKey]?.MAP?.[entry.stemReal],
          affixesStr: oop.htmlEditing.affixesStr(entry.affixes),
          pathVariants: getPathVariants({
            affixes: entry.affixes,
            wordclass,
            verbForms: oop.searching.isVForm(entry.stem).form
          }),
          functions: {
            defRow: ({
              dicEntry,
              id,
              isIrregular = false,
              MDEntry = {}
            }) => {
              if (isIrregular) {
                console.log('hey')
                const border = temp.first ? 'border-top:solid 1px black;' : '';
                temp.first = false;

                const html = `
                  <td class="${id}" style="${border}">${dicEntry.text} (${dicEntry.type}):</td>
                  <td style="${border} text-align:left;">${dicEntry.definition.split(', ')[0]}</td>
                  <td style="${border} text-align:left;">${dicEntry.definition.split(', ')[1] + ', ' + dicEntry.definition.split(', ')[2]}</td>
                  <td style="${border} user-select:none; cursor: pointer;"
                      data-wordclass="${dicEntry.type}"
                      data-defrow="true"
                      data-colindex="${temp.colIndex++}"
                      class="${id}">stem</td>`;

                oop.htmlEditing.insertTr(
                  document.getElementById('tableTbody'),
                  html,
                  false
                );
                return;
              }
              temp[dicEntry.text] ??= {};

              const entryKey = [dicEntry.type, dicEntry.declension || 'nodecl'].join('__');
              if (!temp[dicEntry.text][entryKey]) {
                const border = temp.first ? 'border-top:solid 1px black;' : '';
                temp.first = false;

                const html = `
                  <td class="${id}" style="${border}">${dicEntry.text} (${(dicEntry.type + ' ' + dicEntry?.declension || '').trim()}):</td>
                  <td style="${border} text-align:left;">${dicEntry.type === IDS.WORDS.N
                    ? Object.entries(dicEntry.genders)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('; ')
                    : dicEntry.definition}</td>
                  <td style="${border} text-align:left;">${dicEntry.usage_notes || '...'}</td>
                  <td style="${border} user-select:none; cursor: pointer;"
                      data-wordclass="${dicEntry.type}"
                      data-defrow="true"
                      data-colindex="${temp.colIndex++}"
                      class="${id}">stem</td>`;

                temp[dicEntry.text][entryKey] = html;

                oop.htmlEditing.insertTr(
                  document.getElementById('tableTbody'),
                  html,
                  false
                );

                oop.htmlEditing.tables.pressableLoadTableButtons({
                  el: document.getElementsByClassName(id)[1],
                  word: entry.stemReal,
                  ...(dicEntry?.declension && { declension: dicEntry.declension }),
                  verbForms: innerReferenceMap.verbForms.length > 0 ? innerReferenceMap.dicEntry.splitForms() : [],
                  ...(innerReferenceMap.MD.length > 0 && { MDEntry })
                });

                document.getElementsByClassName(id)[0].addEventListener('click', () => {
                  oop.searching.search({ word: dicEntry.text });
                });
              }
            }
          }
        }
        for (const pathVariant of innerReferenceMap.pathVariants) {
          const resolvedEntries = resolveDictionaryEntries({
            stemReal: entry.stemReal,
            wordclass,
            pathVariant,
            fallbackEntry: innerReferenceMap.dicEntry
          });

          for (const resolvedEntry of resolvedEntries) {
            const ids = {
              row: `${initObj.keyword}, ${pathVariant.text}, ${resolvedEntry.declension || 'nodecl'}, ${temp.colIndex}`,
              defRow: `${entry.stemReal}`
            }
            console.log({
              pathVariant,
              affixesStr: innerReferenceMap.affixesStr,
              ids,
              dicEntry: resolvedEntry,
              entry,
              typeKey,
              innerReferenceMap,
              resolvedEntry,
              resolvedEntries
            });


            // --- Main rows --- //make single function for addrow? and have param for isDefRow?
            innerReferenceMap.functions.defRow({
              dicEntry: resolvedEntry,
              id: `${stem}-${resolvedEntry.declension || 'nodecl'}`,
              isIrregular: Boolean(entry?.affixes?.irregular),
              MDEntry: resolvedEntry
            });

            oop.htmlEditing.insertTr(
              document.getElementById('tableTbody'), `
                <td class="${ids.row}">${initObj.keyword} (${[entry.type, resolvedEntry.declension].filter(Boolean).join(' ')})</td>
                <td>${innerReferenceMap.affixesStr.html}</td>
                <td>${pathVariant.html}</td>
                <td data-key="${entry.key.replace("-...", "")}"
                    data-wordclass="${resolvedEntry.type}"
                    data-colindex="${temp.colIndex++}"
                    class="${ids.row}"
                    style="user-select: none; cursor: pointer;">temp</td>`
            );
            oop.htmlEditing.tables.pressableLoadTableButtons({
              el: document.getElementsByClassName(ids.row)[1],
              word: initObj.keyword,
              affixesStrValues: innerReferenceMap.affixesStr.values,
              stem: entry.stemReal,
              ...(resolvedEntry.declension && { declension: resolvedEntry.declension }),
              verbForms: innerReferenceMap.verbForms.length > 0 ? resolvedEntry.splitForms() : []
            });

            document.getElementsByClassName(ids.row)[0].addEventListener('click', () => {
              //oop.searching.search({ word: initObj.keyword });
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
  }
});
//forms for adj and adv
//pron/lur etc
