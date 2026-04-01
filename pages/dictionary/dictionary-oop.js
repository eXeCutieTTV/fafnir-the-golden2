export const matchtype2 = {
  affixChecker: (word, map, isPrefix = false) => {
    const results = [];
    function appliedOrUnapplied(applied, unapplied) {
      return isPrefix
        ? applied && unapplied
          ? word.startsWith(applied)
            ? applied
            : word.startsWith(unapplied)
              ? unapplied
              : null
          : applied
            ? applied
            : unapplied
              ? unapplied
              : null
        : applied && unapplied
          ? word.endsWith(applied)
            ? applied
            : word.endsWith(unapplied)
              ? unapplied
              : null
          : applied
            ? applied
            : unapplied
              ? unapplied
              : null;
    }
    const tempMap = {
      affixMatches: isPrefix
        ? AFFIXES.PREFIXES.match(word, map, true) === null
          ? 'no-matches'
          : AFFIXES.PREFIXES.match(word, map, true)
        : AFFIXES.SUFFIXES.match(word, map, true) === null
          ? 'no-matches'
          : AFFIXES.SUFFIXES.match(word, map, true),
      affix: ''
    }

    if (tempMap.affixMatches === 'no-matches') return;
    for (const affixMatch of tempMap.affixMatches) {
      //console.log('affixMatch |', affixMatch);

      switch (affixMatch.type) {
        case IDS.WORDS.ADJ:
        case IDS.WORDS.AUX:
        case IDS.WORDS.DET:
        case IDS.WORDS.N:
        case IDS.WORDS.V:
          tempMap.affix = appliedOrUnapplied(affixMatch.variants[0], affixMatch.variants[1]);

          results.push({
            affix: tempMap.affix,
            tempStem: isPrefix
              ? word.slice(tempMap.affix.length)
              : word.slice(0, -tempMap.affix.length),
            type: affixMatch.type,
            paths: affixMatch.paths
          });
          break;
        case IDS.WORDS.PART:
        case IDS.WORDS.PP:
          tempMap.affix = affixMatch.text;

          results.push({
            affix: tempMap.affix,
            tempStem: isPrefix
              ? word.slice(tempMap.affix.length)
              : word.slice(0, -tempMap.affix.length),
            type: affixMatch.type,
            paths: 'no-paths-for-this-type'
          });
          break;
        default: console.warn('unhandled affix match type |', affixMatch.type);
      }
    }
    return results;
  },
  declensionFinder: (map, isPrefix) => {
    const tempMap = {
      newEntry: [],
      newerEntry: [],
      results: [] //returned array
    }
    for (const entry of map) {
      switch (entry.type) {
        case IDS.WORDS.AUX:
          //dont need, case verb will catch all since aux prefixes are just verb prefixes. it has proper .type so its fine
          break;
        case IDS.WORDS.DET:
          const tempAffixChecker = {
            'detSuffix-ppPrefix': matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PP].MAP, true)
          }
          const tempResults = {
            'detSuffix-ppPrefix': [],
            'detSuffix': []
          }
          if (tempAffixChecker["detSuffix-ppPrefix"]) {
            for (const affix of tempAffixChecker["detSuffix-ppPrefix"]) {
              if (!dictionaryBased.findStemFromShort(affix.tempStem).length > 0) continue;
              const result = {
                raws: {
                  'pre-declensionFinder()-entry': entry,
                  'post-declensionFinder()-entry': affix
                },
                suffix: {
                  suffix: entry.affix,
                  paths: entry.paths
                },
                preposition: affix.affix,
                stem: affix.tempStem,
                type: DICTIONARY.ALL_WORDS.MAP[affix.tempStem].type
              }
              tempResults["detSuffix-ppPrefix"].push(result);
            }
          }
          {
            //if (!dictionaryBased.findStemFromShort(entry.tempStem).length > 0) continue;
            const result = {
              raws: {
                'pre-declensionFinder()-entry': entry
              },
              suffix: {
                suffix: entry.affix,
                paths: entry.paths
              },
              stem: entry.tempStem,
              type: ''//DICTIONARY.ALL_WORDS.MAP[entry.tempStem].type
            }
            DICTIONARY.ALL_WORDS.MAP[result.stem]
              ? (result.type = DICTIONARY.ALL_WORDS.MAP[entry.tempStem].type, tempResults["detSuffix"].push(result))
              : null
          }
          tempMap.results.push(tempResults);
          break;
        case IDS.WORDS.PART:
          if (!isPrefix) {
            const temp = {
              affixChecker: {
                adjSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.ADJ].SUFFIXES.MATCHES, false),
                nounSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.N].SUFFIXES.MATCHES, false),
                partPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, true)//,
                //ppPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.PREPOSITIONS.MAP, true)
              },
              results: {
                'partSuffix-nounSuffix-partPrefix': [],
                'partSuffix-nounSuffix-ppPrefix': [],//hm. can adjs also have partSuffix-pp/partPrefixes?
                'partSuffix-adjSuffix-partPrefix': [],
                'partSuffix-adjSuffix-ppPrefix': [],
                'partSuffix-adjSuffix': [],
                'partSuffix-nounSuffix': [],
                'partSuffix-partPrefix': [],
                'partSuffix': []
              }
            }
            if (temp.affixChecker.adjSuffix) {
              for (const affix of temp.affixChecker.adjSuffix) {
                const tempObj = {
                  raws: {
                    'pre-declensionFinder()-entry': entry,
                    'post-declensionFinder()-entry': affix
                  },
                  suffix: {
                    suffix: affix.affix,
                    paths: affix.paths
                  },
                  particle: entry.affix,
                  tempStem: affix.tempStem,
                  type: DICTIONARY.ALL_WORDS.MAP[affix.tempStem]
                    ? DICTIONARY.ALL_WORDS.MAP[affix.tempStem].type
                    : affix.type
                };
                tempMap.newerEntry = {
                  partPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, true),
                  ppPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY[IDS.WORDS.PP].MAP, true)
                };
                console.log('tempMap.newerEntry |', tempMap.newerEntry)
                if (tempMap.newerEntry.partPrefix) {
                  for (const affix2 of Object.values(tempMap.newerEntry.partPrefix)) {
                    if (!dictionaryBased.findStemFromShort(affix2.tempStem).length > 0) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY[IDS.WORDS.ADJ].MAP[affix2.tempStem].declension;
                      if (tempObj.suffix.paths.every(path => path[3] !== targetDeclension)) continue;
                    }
                    temp.results['partSuffix-adjSuffix-partPrefix'].push({
                      raws: {
                        'pre-declensionFinder()-raws': tempObj.raws,
                        'post-declensionFinder()-entry': affix2
                      },
                      suffix: tempObj.suffix,
                      particleSuffix: tempObj.particle,
                      particlePrefix: affix2.affix,
                      stem: affix2.tempStem,
                      type: tempObj.type
                    });
                  }
                }
                if (tempMap.newerEntry.ppPrefix) {
                  for (const affix2 of Object.values(tempMap.newerEntry.ppPrefix)) {
                    if (!dictionaryBased.findStemFromShort(affix2.tempStem).length > 0) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY[IDS.WORDS.ADJ].MAP[affix2.tempStem].declension;
                      if (tempObj.suffix.paths.every(path => path[3] !== targetDeclension)) continue;
                    }
                    temp.results['partSuffix-adjSuffix-ppPrefix'].push({
                      raws: {
                        'pre-declensionFinder()-raws': tempObj.raws,
                        'post-declensionFinder()-entry': affix2
                      },
                      suffix: tempObj.suffix,
                      particleSuffix: tempObj.particle,
                      prepositionPrefix: affix2.affix,
                      stem: affix2.tempStem,
                      type: tempObj.type
                    });
                  }
                }
                if (!(tempMap.newerEntry.partPrefix || tempMap.newerEntry.ppPrefix)) {
                  if (!dictionaryBased.findStemFromShort(affix.tempStem).length > 0) continue;
                  {
                    const targetDeclension = DICTIONARY[IDS.WORDS.ADJ].MAP[affix.tempStem].declension;
                    if (affix.paths.every(path => path[3] !== targetDeclension)) continue;
                  }
                  temp.results['partSuffix-adjSuffix'].push({
                    raws: {
                      'pre-declensionFinder()-entry': entry,
                      'post-declensionFinder()-entry': affix
                    },
                    suffix: {
                      suffix: affix.affix,
                      paths: affix.paths
                    },
                    particle: entry.affix,
                    stem: affix.tempStem,
                    type: affix.type
                  });
                }
              }
            }
            if (temp.affixChecker.nounSuffix) {
              for (const affix of temp.affixChecker.nounSuffix) {
                const tempObj = {
                  raws: {
                    'pre-declensionFinder()-entry': entry,
                    'post-declensionFinder()-entry': affix
                  },
                  suffix: {
                    suffix: affix.affix,
                    paths: affix.paths
                  },
                  particle: entry.affix,
                  tempStem: affix.tempStem,
                  type: DICTIONARY.ALL_WORDS.MAP[affix.tempStem]
                    ? DICTIONARY.ALL_WORDS.MAP[affix.tempStem].type
                    : affix.type
                };
                tempMap.newerEntry = {
                  partPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, true),
                  ppPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY[IDS.WORDS.PP].MAP, true)
                };
                console.log('tempMap.newerEntry |', tempMap.newerEntry)
                if (tempMap.newerEntry.partPrefix) {
                  for (const affix2 of Object.values(tempMap.newerEntry.partPrefix)) {
                    if (!dictionaryBased.findStemFromShort(affix2.tempStem).length > 0) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY[IDS.WORDS.N].MAP[affix2.tempStem].declension;
                      if (tempObj.suffix.paths.every(path => path[3] !== targetDeclension)) continue;
                    }
                    temp.results['partSuffix-nounSuffix-partPrefix'].push({
                      raws: {
                        'pre-declensionFinder()-raws': tempObj.raws,
                        'post-declensionFinder()-entry': affix2
                      },
                      suffix: tempObj.suffix,
                      particleSuffix: tempObj.particle,
                      particlePrefix: affix2.affix,
                      stem: affix2.tempStem,
                      type: tempObj.type
                    });
                  }
                }
                if (tempMap.newerEntry.ppPrefix) {
                  for (const affix2 of Object.values(tempMap.newerEntry.ppPrefix)) {
                    if (!dictionaryBased.findStemFromShort(affix2.tempStem).length > 0) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY[IDS.WORDS.N].MAP[affix2.tempStem].declension;
                      if (tempObj.suffix.paths.every(path => path[3] !== targetDeclension)) continue;
                    }
                    temp.results['partSuffix-nounSuffix-ppPrefix'].push({
                      raws: {
                        'pre-declensionFinder()-raws': tempObj.raws,
                        'post-declensionFinder()-entry': affix2
                      },
                      suffix: tempObj.suffix,
                      particleSuffix: tempObj.particle,
                      prepositionPrefix: affix2.affix,
                      stem: affix2.tempStem,
                      type: tempObj.type
                    });
                  }
                }
                if (!(tempMap.newerEntry.partPrefix || tempMap.newerEntry.ppPrefix)) {
                  if (!dictionaryBased.findStemFromShort(affix.tempStem).length > 0) continue;
                  {
                    const targetDeclension = DICTIONARY[IDS.WORDS.N].MAP[affix.tempStem].declension;
                    if (affix.paths.every(path => path[3] !== targetDeclension)) continue;
                  }
                  temp.results['partSuffix-nounSuffix'].push({
                    raws: {
                      'pre-declensionFinder()-entry': entry,
                      'post-declensionFinder()-entry': affix
                    },
                    suffix: {
                      suffix: affix.affix,
                      paths: affix.paths
                    },
                    particle: entry.affix,
                    stem: affix.tempStem,
                    type: affix.type
                  });
                }
              }
            }
            if (temp.affixChecker.partPrefix) {
              for (const affix of temp.affixChecker.partPrefix) {
                if (!dictionaryBased.findStemFromShort(affix.tempStem).length > 0) continue;

                temp.results['partSuffix-partPrefix'].push({
                  raws: {
                    'pre-declensionFinder()-entry': entry,
                    'post-declensionFinder()-entry': affix
                  },
                  particleSuffix: entry.affix,
                  particlePrefix: affix.affix,
                  stem: affix.tempStem,
                  type: DICTIONARY.ALL_WORDS.MAP[affix.tempStem].type
                });
              }
            }
            if (DICTIONARY.ALL_WORDS.MAP[entry.tempStem]) {
              temp.results['partSuffix'].push({
                raws: {
                  'pre-declensionFinder()-entry': entry
                },
                particleSuffix: entry.affix,
                stem: entry.tempStem,
                type: DICTIONARY.ALL_WORDS.MAP[entry.tempStem].type
              });
            }
            tempMap.results.push(temp.results);
          } else {
            const tempAffixChecker = {//partsuffix(needs to be in case part) 
              adjSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.ADJ].SUFFIXES.MATCHES, false),
              nounSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.N].SUFFIXES.MATCHES, false)
            }
            const tempResults = {
              'partPrefix-nounSuffix': [],
              'partPrefix-adjSuffix': [],
              'partPrefix': []
            }
            if (tempAffixChecker.nounSuffix) {
              for (const affix of tempAffixChecker.nounSuffix) {
                if (!dictionaryBased.findStemFromShort(affix.tempStem).length > 0) continue;
                const result = {
                  raws: {
                    'pre-declensionFinder()-entry': entry,
                    'post-declensionFinder()-entry': affix
                  },
                  suffix: {
                    suffix: affix.affix,
                    paths: affix.paths
                  },
                  particle: entry.affix,
                  stem: affix.tempStem,
                  type: DICTIONARY.ALL_WORDS.MAP[affix.tempStem].type
                }
                result.suffix.paths.map(path => {
                  path[3] === DICTIONARY[IDS.WORDS.N].MAP[affix.tempStem].declension
                    ? tempResults['partPrefix-nounSuffix'].push(result) //checks if path declension is 'legal' //only pushes result if legal.
                    : null
                });
              }
            }
            if (tempAffixChecker.adjSuffix) {
              for (const affix of tempAffixChecker.adjSuffix) {
                if (!dictionaryBased.findStemFromShort(affix.tempStem).length > 0) continue;
                const result = {
                  raws: {
                    'pre-declensionFinder()-entry': entry,
                    'post-declensionFinder()-entry': affix
                  },
                  suffix: {
                    suffix: affix.affix,
                    paths: affix.paths
                  },
                  particle: entry.affix,
                  stem: affix.tempStem,
                  type: DICTIONARY.ALL_WORDS.MAP[affix.tempStem].type
                }
                result.suffix.paths.map(path => {
                  path[3] === DICTIONARY[IDS.WORDS.ADJ].MAP[affix.tempStem].declension
                    ? tempResults['partPrefix-adjSuffix'].push(result) //checks if path declension is 'legal' //only pushes result if legal.
                    : null
                });
              }
            }
            if (DICTIONARY.ALL_WORDS.MAP[entry.tempStem]) {
              tempResults['partPrefix'].push({
                raws: {
                  'pre-declensionFinder()-entry': entry
                },
                particlePrefix: entry.affix,
                stem: entry.tempStem,
                type: DICTIONARY.ALL_WORDS.MAP[entry.tempStem].type
              });
            }
            tempMap.results.push(tempResults);
          }
          break;
        case IDS.WORDS.V:
          {
            //console.log('entry-top', entry)
            const results = {
              'verbPrefix': [],
              'verbSuffix': [],
              'verbPrefix-verbSuffix': []
            }
            const affixChecker = {
              'verbSuffix': matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.V].SUFFIXES.MATCHES, false) || []
            }
            if (affixChecker.verbSuffix.length > 0) {
              //console.log('hi')
              for (const entry2 of affixChecker.verbSuffix) {
                const result = {
                  raws: [entry, entry2],//oldest to newest
                  affixes: {
                    suffix: {
                      paths: entry2.paths,
                      suffix: entry2.affix
                    },
                    prefix: {
                      paths: entry.paths,
                      prefix: entry.affix
                    }
                  },
                  stem: entry2.tempStem,
                  stemReal: 'temp',
                  type: 'temp'
                }
                for (const possibility of dictionaryBased.findStemFromShort(entry2.tempStem)) {
                  if (possibility.type !== IDS.WORDS.V) continue;
                  result.stemReal = possibility.text;
                  result.type = possibility.type;
                  results['verbPrefix-verbSuffix'].push(result);
                }
              }
            }
            if (isPrefix) {
              const result = {
                raws: [entry],
                affixes: {
                  prefix: {
                    paths: entry.paths,
                    prefix: entry.affix
                  }
                },
                stem: entry.tempStem,
                stemReal: 'temp',
                type: 'temp'
              }
              for (const possibility of dictionaryBased.findStemFromShort(entry.tempStem)) {
                if (possibility.type !== IDS.WORDS.V) continue;
                result.stemReal = possibility.text;
                result.type = possibility.type;
                //console.log('result', result)
                results['verbPrefix'].push(result);
              }
            } else if (!isPrefix) {
              const result = {
                raws: [entry],
                affixes: {
                  suffix: {
                    paths: entry.paths,
                    suffix: entry.affix
                  }
                },
                stem: entry.tempStem,
                stemReal: 'temp',
                type: 'temp'
              }
              for (const possibility of dictionaryBased.findStemFromShort(entry.tempStem)) {
                if (possibility.type !== IDS.WORDS.V) continue;
                result.stemReal = possibility.text;
                result.type = possibility.type;
                //console.log('result', result)
                results['verbSuffix'].push(result);
              }
            }
            //console.log(results)
            tempMap.results.push(results);
          }
          break;
        case IDS.WORDS.N:
          tempMap.newEntry = matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PP].MAP, true)
          if (!tempMap.newEntry) {
            tempMap.newEntry = null;
          }

          const result = {
            suffix: {
              suffix: entry.affix,
              paths: entry.paths
            },
            stem: entry.tempStem,
            type: entry.type,
            raws: {
              'pre-declensionFinder()-entry': entry
            }
          }

          if (tempMap.newEntry) {
            if (tempMap.newEntry.length === 1) {
              result.stem = tempMap.newEntry[0].tempStem;
              result.pp = tempMap.newEntry[0].affix;
            }
            else {
              result.stem = tempMap.newEntry.map(e => e.tempStem); //later will just have to check if this is an array - if yes, then x, if no, then y.
              result.pp = tempMap.newEntry.map(e => e.affix);
            }

            result.raws = {
              'pre-declensionFinder()-entry': entry,
              'post-declensionFinder()-entry': tempMap.newEntry
            };
          }
          if (!dictionaryBased.findStemFromShort(result.stem).length > 0) continue;
          for (const entry2 of dictionaryBased.findStemFromShort(result.stem)) if (entry2.type === IDS.WORDS.N) {
            result.stemReal = entry2.text;
            entry.paths.map(path => path[3] === entry2.declension
              ? tempMap.results.push(result) //checks if path declension is 'legal' //only pushes result if legal.
              : null
            );
          }
          break;
        case IDS.WORDS.PP:
          const tempResult = {
            'irregular': [],
            'regular': []
          }
          if (!(irregulars.determiner(entry.tempStem).length > 0 || DICTIONARY[IDS.WORDS.N].MAP[entry.tempStem] || DICTIONARY[IDS.WORDS.DET].MAP[entry.tempStem] || DICTIONARY[IDS.WORDS.ADJ].MAP[entry.tempStem])) continue;
          if (irregulars.determiner(entry.tempStem).length > 0) {
            for (const el of irregulars.determiner(entry.tempStem)) {
              tempResult.irregular.push({
                raws: {
                  'pre-declensionFinder()-entry': entry,
                  'irregular-entry': el
                },
                preposition: entry.affix,
                stem: entry.tempStem,
                path: el.path,
                type: el.type
              });
            }
          } else {
            tempResult.regular.push({
              raws: {
                'pre-declensionFinder()-entry': entry,
              },
              preposition: entry.affix,
              stem: entry.tempStem,
              paths: entry.paths,
              type: DICTIONARY.ALL_WORDS.MAP[entry.tempStem].type
            });
          }
          tempMap.results.push(tempResult);
          break;
        case IDS.WORDS.ADJ:
          const tempResultsAdj = {
            'adjSuffix': [],
            'adjSuffix-partSuffix': []
          };
          {
            const tempAffixChecker = matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false)
              ? matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false)
              : null;

            if (tempAffixChecker) {
              for (const affix of tempAffixChecker) {
                if (!dictionaryBased.findStemFromShort(affix.tempStem).length > 0) continue;
                const result = {
                  raws: {
                    'pre-declensionFinder()-entry': entry,
                    'post-declensionFinder()-entry': affix
                  },
                  suffix: {
                    suffix: entry.affix,
                    paths: entry.paths
                  },
                  particle: affix.affix,
                  stem: affix.tempStem,
                  type: entry.type
                }
                for (const entry2 of dictionaryBased.findStemFromShort(affix.tempStem)) if (entry.type === IDS.WORDS.ADJ) {
                  entry.paths.map(path => path[3] === entry2.declension
                    ? tempResultsAdj['adjSuffix-partSuffix'].push(result) //checks if path declension is 'legal' //only pushes result if legal.
                    : null
                  );
                }
              }
            }
            else {
              if (!dictionaryBased.findStemFromShort(entry.tempStem).length > 0) continue;
              const result = {
                raws: {
                  'pre-declensionFinder()-entry': entry
                },
                suffix: {
                  suffix: entry.affix,
                  paths: entry.paths
                },
                stem: entry.tempStem,
                type: entry.type
              }
              for (const entry2 of dictionaryBased.findStemFromShort(result.stem)) if (entry2.type === IDS.WORDS.ADJ) {
                //console.log(entry2, entry)
                entry.paths.map(path => path[3] === entry2.declension
                  ? tempResultsAdj.adjSuffix.push(result) //checks if path declension is 'legal' //only pushes result if legal.
                  : null
                );
              }
            }
          }//vv trick such that empty maps arent pushed.
          let i = 0;
          for (const key in tempResultsAdj) {
            if (tempResultsAdj[key].length > 0) i++;
          }
          if (i !== 0) tempMap.results.push(tempResultsAdj);
          break;
        default: console.warn('unhandled declensionFinder type |', entry.type);
      }
      //detSuffix, auxPrefix, nounSuffixANDpPrefix, nounSuffixANDpSuffix, detppPrefix, detppPrefix_irr, detppPrefixANDSuffix
    }
    /*
    if (affixMatch.type === IDS.OTHER.ML) {
      for (const entry of affixMatch.variants) {
        affixFinder(word, entry, isPrefix)
      }
    } else affixFinder(word, affixMatch, isPrefix);
    */ //not even here yet tbh
    return tempMap.results;
  },
  flatten: (map) => {
    const result = {};
    for (const [key, value] of Object.entries(map)) {
      switch (key) {
        case 'partSuffix-...':
        case 'partPrefix-...':
        case 'ppPrefix-...':
        case 'verbPrefix-...':
        case 'verbSuffix':
        case 'adjSuffix-...':
          for (const entry of Object.values(value)) {
            for (const [key1, value1] of Object.entries(entry)) {
              if (!value1.length > 0) continue;
              for (const el of Object.values(value1)) {
                result[key1]
                  ? result[key1].push(el)
                  : (result[key1] = [], result[key1].push(el))
              }
            }
          }
          break;
        case 'nounSuffix-...':
        case 'detSuffix':
          for (const entry of value) {
            if (!Object.values(entry).length > 0) continue;
            result[key]
              ? result[key].push(entry)
              : (result[key] = [], result[key].push(entry))
          }
          break;
      }
    }
    return result;
  },
  sortByEntry: (map) => {
    const grouped = {};
    for (const [key, value] of Object.entries(map)) {
      for (const entry of value) {
        if (!grouped[entry.stem]) {
          grouped[entry.stem] = {};
        }
        if (!grouped[entry.stem][entry.type]) {
          grouped[entry.stem][entry.type] = [];
        }
        grouped[entry.stem][entry.type].push(entry);
        entry['key'] = key
      }
    }
    return grouped;
  }
}
export const irregulars = {
  pronoun: (word) => {
    const matches = [];
    for (const [genderKey, genderMap] of Object.entries(PRONOUNS.MAP)) {
      for (const [numberKey, numberMap] of Object.entries(genderMap)) {
        for (const [personKey, personMap] of Object.entries(numberMap)) {
          for (const [caseKey, caseValue] of Object.entries(personMap)) {
            if (caseValue === word) {
              function shortpath() {
                const temp = {
                  arr: [],
                  map: [IDS.NUMBERS, IDS.CASE]
                }
                for (const el of temp.map) {
                  for (const [short, long] of Object.entries(el)) {
                    if (caseKey === long) {
                      temp.arr.push(short);
                    }
                    if (numberKey === long) {
                      temp.arr.push(short);
                    }
                  }
                }
                for (const entry of Object.values(GENDERS.MAP)) {
                  if (entry.NAME === genderKey) {
                    temp.arr.push(entry.SHORT);
                  }
                }
                const result = `pers.${temp.arr[2]}.${temp.arr[1]}.${personKey}.${temp.arr[0]}`;//type.gender.number.person.case
                //console.log(tempArray);
                return result;
              }
              const result = {
                path: {
                  gender: genderKey,
                  number: numberKey,
                  person: personKey,
                  case: caseKey,
                },
                word: caseValue,
                type: 'personal',
                short_path: shortpath() || '',
              }
              matches.push(result);
            }
          }
        }
      }
    }
    return matches;
  },
  determiner: (word) => {
    const matches = [];
    for (const [genderKey, genderMap] of Object.entries(DICTIONARY[IDS.WORDS.DET].IRREGULARS.MAP)) {
      for (const [typeKey, typeMap] of Object.entries(genderMap)) {
        for (const [numberKey, numberValue] of Object.entries(typeMap)) {
          if (numberValue === word) {
            function shortpath() {
              const temp = {
                arr: [],
                map: [IDS.NUMBERS, IDS.DET_TYPES]
              }
              for (const el of temp.map) {
                for (const [short, long] of Object.entries(el)) {
                  if (numberKey === long) {
                    temp.arr.push(short);
                  }
                  if (typeKey === long) {
                    temp.arr.push(short);
                  }
                }
              }
              for (const entry of Object.values(GENDERS.MAP)) {
                if (entry.NAME === genderKey) {
                  temp.arr.push(entry.SHORT);
                }
              }
              const result = `${temp.arr[1]}.${temp.arr[0]}.${temp.arr[2]}`;//type.number.gender
              return result;
            }
            const result = {
              path: {
                gender: genderKey,
                number: numberKey,
              },
              word: numberValue,
              type: typeKey,
              short_path: shortpath() || '',
            }
            matches.push(result);
          }
        }
      }
    }
    return matches;
  },
  correlative: (word) => {
    const matches = [];
    for (const [genderKey, genderMap] of Object.entries(CORRELATIVES.MAP)) {
      for (const [typeKey, typeMap] of Object.entries(genderMap)) {
        for (const [caseKey, caseValue] of Object.entries(typeMap)) {
          if (caseValue === word) {
            function shortpath() {
              const temp = {
                arr: [],
                map: [IDS.CASE, IDS.COR_TYPES]
              }
              for (const el of temp.map) {
                for (const [short, long] of Object.entries(el)) {
                  if (caseKey === long) {
                    temp.arr.push(short);
                  }
                  if (typeKey === long) {
                    temp.arr.push(short);
                  }
                }
              }
              for (const entry of Object.values(GENDERS.MAP)) {
                if (entry.NAME === genderKey) {
                  temp.arr.push(entry.SHORT);
                }
              }
              const result = `${temp.arr[1]}.${temp.arr[0]}.${temp.arr[2]}`;//type.case.gender
              return result;
            }
            const result = {
              path: {
                gender: genderKey,
                case: caseKey,
              },
              word: caseValue,
              type: typeKey,
              short_path: shortpath() || '',
            }
            matches.push(result);
          }
        }
      }
    }
    return matches;
  },
  lur: (word) => {
    const matches = [];
    for (const [aspectKey, aspectMap] of Object.entries(LUR.MAP)) {
      for (const [tenseKey, tenseMap] of Object.entries(aspectMap)) {
        for (const [genderKey, genderMap] of Object.entries(tenseMap)) {
          for (const [personKey, personMap] of Object.entries(genderMap)) {
            for (const [numberKey, numberValue] of Object.entries(personMap)) {
              if (numberValue === word) {
                function shortpath() {
                  const temp = {
                    arr: [],
                    map: [IDS.ASPECT, IDS.NUMBERS, IDS.TENSE]
                  }
                  for (const el of temp.map) {
                    for (const [short, long] of Object.entries(el)) {
                      if (aspectKey === long) {
                        temp.arr.push(short);
                      }
                      if (tenseKey === long) {
                        temp.arr.push(short);
                      }
                      if (numberKey === long) {
                        temp.arr.push(short);
                      }
                    }
                  }
                  for (const entry of Object.values(GENDERS.MAP)) {
                    if (entry.NAME === genderKey) {
                      temp.arr.push(entry.SHORT);
                    }
                  }
                  const result = `${temp.arr[0]}.${temp.arr[3]}.${temp.arr[1]}.${personKey}.${temp.arr[2]}`;//aspect.gender.number.person.tense.
                  return result;
                }
                const result = {
                  form: {
                    aspect: aspectKey,
                    tense: tenseKey,
                  },
                  path: {
                    gender: genderKey,
                    person: personKey,
                    number: numberKey
                  },
                  short_path: shortpath() || '',
                  word: numberValue
                }
                matches.push(result);
              }
            }
          }
        }
      }
    }
    return matches;
  }
}
export const dictionaryBased = {
  findStemFromShort: (short_stem) => {
    const results = [];
    const matches = DICTIONARY.ALL_WORDS.fetch(short_stem);
    for (const result of matches) {
      if ((result.text.length === short_stem.length + 1)) {
        if (!result.text.slice(-1).match(regex.isVowel)) continue;
        results.push(result);
      } else if (result.text === short_stem) results.push(result);
    }
    return results;
  },
  dicIdFromType: (type) => {
    switch (type) {
      case IDS.WORDS.V: return 'VERBS'
      case IDS.WORDS.N: return 'NOUNS'
    }
  }
}
export const htmlEditing = {
  insertTr: (el, html, top = true) => {
    const tr = document.createElement('tr');
    tr.innerHTML = String(html);
    top
      ? el.insertBefore(tr, el.children[0])
      : el.appendChild(tr);
  },
  createDivById: (id, wrapper, html) => {
    let div = document.getElementById(id);
    if (!div) {
      div = document.createElement('div');
    }
    if (id.length > 0) {
      div.id = id;
    }
    div.innerHTML = html;

    const divwrapper = wrapper;

    if (!divwrapper) {
      console.error("no div wrapper");
      return;
    }

    divwrapper.appendChild(div);
  },
  tables: {
    populate: (keyword, table, isPrefix = false) => {
      if (!table) return;
      const tds = table.querySelectorAll("td");
      tds.forEach(td => {
        // prefer original stored raw suffix (data-raw) if present 
        const textInCell = (td.dataset.raw && td.dataset.raw.trim()) ? td.dataset.raw : td.textContent.trim();

        // process raw
        const entries = isPrefix
          ? AFFIXES.connectSplit(textInCell, keyword, "")
          : AFFIXES.connectSplit("", keyword, textInCell)
        td.innerHTML = `<strong>${CHARACTERS.entriesToText(entries[0])}</strong>${CHARACTERS.entriesToText(entries[1])}<strong>${CHARACTERS.entriesToText(entries[2])}</strong>`;
        // place keyword as prefix or suffix (you can change behavior per table)
      });
    },
    verb: (isPrefix, word, wrapper) => {

      const affixStateMap = {
        true: ['Prefix',],// ⟅(^‿^)⟆ - Shelf the elf
        false: ['Suffix', DICTIONARY[IDS.WORDS.V].SUFFIXES.MAP]
      } // ⟅(^‿^)⟆ - Shelf the elf

      function affixHandlerGenders(isPrefix, word, person, number, hasBorder = false) {
        let string = "";
        for (const gender of GENDERS.FLAT.NAME) {
          string += `<td${hasBorder ? " style = 'border-bottom: 1px solid var(--border)' " : ''}>${affixHandler(isPrefix, word, person, number, gender)}</td>\n`;
        }
        return string;
      }

      function affixHandler(isPrefix, word, person, number, gender) {// ⟅(^‿^)⟆ - Shelf the elf
        return isPrefix
          ? CHARACTERS.entriesToText(AFFIXES.connectSplit(DICTIONARY[IDS.WORDS.V].PREFIXES.MAP[person][number][gender], word, '')[0])
          : DICTIONARY[IDS.WORDS.V].SUFFIXES.MAP[person][number][gender];
      }

      const html = `
        <table id="Verb-Table-${isPrefix ? 'Prefix' : 'Suffix'}" style="margin-bottom: 10px;">
            <thead>
                <tr>
                    <th colSpan = 2>${affixStateMap[isPrefix][0]}</th>
                    <th>Exalted</th>
                    <th>Rational</th>
                    <th>Monstrous</th>
                    <th>Irrational</th>
                    <th>Magical</th>
                    <th>Mundane</th>
                    <th>Abstract</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th style = "width:86px" rowSpan = 3>Singular</th>
                    <th style = "width:14px">1.</th>
                    ${affixHandlerGenders(isPrefix, word, 1, IDS.NUMBERS.S)}
                </tr>
                <tr>
                    <th>2.</th>
                    ${affixHandlerGenders(isPrefix, word, 2, IDS.NUMBERS.S)} 
                </tr>
                <tr>
                    <th>3.</th>
                    ${affixHandlerGenders(isPrefix, word, 3, IDS.NUMBERS.S, true)} 
                </tr>
                <tr>
                    <th rowSpan = 3>Dual</th>
                    <th>1.</th>
                    ${affixHandlerGenders(isPrefix, word, 1, IDS.NUMBERS.D)}
                </tr>
                <tr>
                    <th>2.</th>
                    ${affixHandlerGenders(isPrefix, word, 2, IDS.NUMBERS.D)} 
                </tr>
                <tr>
                    <th>3.</th>
                    ${affixHandlerGenders(isPrefix, word, 3, IDS.NUMBERS.D, true)} 
                </tr>
                <tr>
                    <th rowSpan = 3>Plural</th>
                    <th>1.</th>
                    ${affixHandlerGenders(isPrefix, word, 1, IDS.NUMBERS.P)}
                </tr>
                <tr>
                    <th>2.</th>
                    ${affixHandlerGenders(isPrefix, word, 2, IDS.NUMBERS.P)} 
                </tr>
                <tr>
                    <th>3.</th>
                    ${affixHandlerGenders(isPrefix, word, 3, IDS.NUMBERS.P)} 
                </tr>
            </tbody>
        </table>
        `;
      htmlEditing.createDivById('', wrapper, html);
      htmlEditing.tables.populate(word, wrapper, isPrefix);
    },
    noun: (declension, mood, wrapper, keyword = '') => {
      const table = document.createElement('table');
      const combinedGendersObject = DICTIONARY[IDS.WORDS.N].MAP[keyword].genders;

      table.id = `Noun-Table-${mood}`;
      //th
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headers = [`${mood} (${declension})`, "Singular", "Dual", "Plural"];
      headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
        th.id = `neoSummaryHeader-${text}`;
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      //rows
      for (const [gender, def] of Object.entries(combinedGendersObject)) {
        const trd = document.createElement('tr');
        const rowth = document.createElement('th');
        rowth.textContent = gender;
        trd.appendChild(rowth);
        const map = {
          1: 'Singular',
          2: 'Dual',
          3: 'Plural'
        }

        for (let i = 0; i < (headers.length - 1); i++) {
          const td = document.createElement('td');
          td.textContent = 'placeholder';
          if (i === 0) {
            td.className = `neoSummarytd-${map[1]}`
          }
          else if (i === 1) {
            td.className = `neoSummarytd-${map[2]}`
          }
          else if (i === 2) {
            td.className = `neoSummarytd-${map[3]}`
          }
          //inner
          for (const [gndr, array] of Object.entries(DICTIONARY[IDS.WORDS.N].SUFFIXES.MAP[mood])) {
            if (gndr === gender) {
              const numberKey = map[i + 1];
              const cellValue = array[numberKey] && array[numberKey][declension];
              if (cellValue !== undefined) {
                td.textContent = cellValue;
              }
            }
          }
          trd.appendChild(td);

        }
        table.appendChild(trd);
      }

      table.style = "margin-bottom: 10px";

      const tbody = document.createElement('tbody');
      table.appendChild(tbody);

      wrapper.appendChild(table);

      htmlEditing.tables.populate(keyword, table)
    }
  }
}

export const text = {
}
export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}
