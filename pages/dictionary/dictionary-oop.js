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
            'detSuffix-ppPrefix': matchtype2.affixChecker(entry.tempStem, DICTIONARY.PREPOSITIONS.MAP, true)
          }
          const tempResults = {
            'detSuffix-ppPrefix': [],
            'detSuffix': []
          }
          if (tempAffixChecker["detSuffix-ppPrefix"]) {
            for (const affix of tempAffixChecker["detSuffix-ppPrefix"]) {
              if (!DICTIONARY.DETERMINERS.MAP[affix.tempStem]) continue;
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
            //if (!DICTIONARY.DETERMINERS.MAP[entry.tempStem]) continue;
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
                adjSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.ADJECTIVES.SUFFIXES.MATCHES, false),
                nounSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.NOUNS.SUFFIXES.MATCHES, false),
                partPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.PARTICLES.MAP, true)//,
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
                  partPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY.PARTICLES.MAP, true),
                  ppPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY.PREPOSITIONS.MAP, true)
                };
                console.log('tempMap.newerEntry |', tempMap.newerEntry)
                if (tempMap.newerEntry.partPrefix) {
                  for (const affix2 of Object.values(tempMap.newerEntry.partPrefix)) {
                    if (!DICTIONARY.ADJECTIVES.MAP[affix2.tempStem]) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY.ADJECTIVES.MAP[affix2.tempStem].declension;
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
                    if (!DICTIONARY.ADJECTIVES.MAP[affix2.tempStem]) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY.ADJECTIVES.MAP[affix2.tempStem].declension;
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
                  if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;
                  {
                    const targetDeclension = DICTIONARY.ADJECTIVES.MAP[affix.tempStem].declension;
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
                  partPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY.PARTICLES.MAP, true),
                  ppPrefix: matchtype2.affixChecker(tempObj.tempStem, DICTIONARY.PREPOSITIONS.MAP, true)
                };
                console.log('tempMap.newerEntry |', tempMap.newerEntry)
                if (tempMap.newerEntry.partPrefix) {
                  for (const affix2 of Object.values(tempMap.newerEntry.partPrefix)) {
                    if (!DICTIONARY.NOUNS.MAP[affix2.tempStem]) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY.NOUNS.MAP[affix2.tempStem].declension;
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
                    if (!DICTIONARY.NOUNS.MAP[affix2.tempStem]) continue;
                    {//just to keep the const out of scope.
                      const targetDeclension = DICTIONARY.NOUNS.MAP[affix2.tempStem].declension;
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
                  if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;
                  {
                    const targetDeclension = DICTIONARY.NOUNS.MAP[affix.tempStem].declension;
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
                if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;

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
              adjSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.ADJECTIVES.SUFFIXES.MATCHES, false),
              nounSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.NOUNS.SUFFIXES.MATCHES, false)
            }
            const tempResults = {
              'partPrefix-nounSuffix': [],
              'partPrefix-adjSuffix': [],
              'partPrefix': []
            }
            if (tempAffixChecker.nounSuffix) {
              for (const affix of tempAffixChecker.nounSuffix) {
                if (!DICTIONARY.NOUNS.MAP[affix.tempStem]) continue;
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
                  path[3] === DICTIONARY.NOUNS.MAP[affix.tempStem].declension
                    ? tempResults['partPrefix-nounSuffix'].push(result) //checks if path declension is 'legal' //only pushes result if legal.
                    : null
                });
              }
            }
            if (tempAffixChecker.adjSuffix) {
              for (const affix of tempAffixChecker.adjSuffix) {
                if (!DICTIONARY.ADJECTIVES.MAP[affix.tempStem]) continue;
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
                  path[3] === DICTIONARY.ADJECTIVES.MAP[affix.tempStem].declension
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
          const tempResultsVerb = {
            'verbPrefix': [],
            'verbPrefix-verbSuffix': []
          }
          if (isPrefix) {
            tempMap.newEntry = matchtype2.affixChecker(entry.tempStem, DICTIONARY.VERBS.SUFFIXES.MATCHES, false)
              ? matchtype2.affixChecker(entry.tempStem, DICTIONARY.VERBS.SUFFIXES.MATCHES, false)
              : [];
            for (const affix of tempMap.newEntry) {
              if (!DICTIONARY.VERBS.MAP[affix.tempStem]) continue;
              const result = {
                raws: {
                  'pre-declensionFinder()-entry': entry,
                  'post-declensionFinder()-entry': tempMap.newEntry
                },
                suffix: {
                  suffix: affix.affix,
                  paths: affix.paths
                },
                prefix: {
                  prefix: entry.affix,
                  paths: entry.paths
                },
                stem: affix.tempStem,
                type: DICTIONARY.ALL_WORDS.MAP[affix.tempStem].type
              };
              DICTIONARY.VERBS.MAP[result.stem]
                ? tempResultsVerb['verbPrefix-verbSuffix'].push(result)
                : null
            }
            {
              const result = {
                raws: {
                  'pre-declensionFinder()-entry': entry,
                },
                prefix: {
                  prefix: entry.affix,
                  paths: entry.paths
                },
                stem: entry.tempStem,
                type: DICTIONARY.ALL_WORDS.MAP[entry.tempStem].type
              };
              if (!(DICTIONARY.VERBS.MAP[result.stem] || DICTIONARY.AUXILIARIES.MAP[result.stem])) continue;
              tempResultsVerb.verbPrefix.push(result)
            }
            tempMap.results.push(tempResultsVerb);
          }
          else {
            {
              if (!DICTIONARY.VERBS.MAP[entry.tempStem]) continue;
              const result = {
                raws: {
                  'pre-declensionFinder()-entry': entry
                },
                suffix: {
                  suffix: entry.affix,
                  paths: entry.paths
                },
                stem: entry.tempStem,
                type: DICTIONARY.ALL_WORDS.MAP[entry.tempStem].type
              };
              tempMap.results.push(result)
            }
            //tempMap.results.push(tempResultsVerb);
          }
          break;
        case IDS.WORDS.N:
          tempMap.newEntry = matchtype2.affixChecker(entry.tempStem, DICTIONARY.PREPOSITIONS.MAP, true)
            ? matchtype2.affixChecker(entry.tempStem, DICTIONARY.PREPOSITIONS.MAP, true)
            : null
          const result = {
            suffix: {
              suffix: entry.affix,
              paths: entry.paths
            },
            stem: tempMap.newEntry
              ? tempMap.newEntry.length === 1
                ? tempMap.newEntry[0].tempStem
                : tempMap.newEntry.map(e => e.tempStem) //later will just have to check if this is an array - if yes, then x, if no, then y.
              : entry.tempStem,
            type: entry.type,
            raw: tempMap.newEntry === null
              ? {
                'pre-declensionFinder()-entry': entry
              }
              : {
                'pre-declensionFinder()-entry': entry,
                'post-declensionFinder()-entry': tempMap.newEntry
              },
            ...(tempMap.newEntry !== null && {
              pp: tempMap.newEntry.length === 1
                ? tempMap.newEntry[0].affix
                : tempMap.newEntry.map(e => e.affix)
            })
          }
          if (!DICTIONARY.NOUNS.MAP[result.stem]) continue;
          entry.paths.map(path => path[3] === DICTIONARY.NOUNS.MAP[result.stem].declension
            ? tempMap.results.push(result) //checks if path declension is 'legal' //only pushes result if legal.
            : null
          );
          break;
        case IDS.WORDS.PP:
          const tempResult = {
            'irregular': [],
            'regular': []
          }
          if (!(irregulars.determiner(entry.tempStem).length > 0 || DICTIONARY.NOUNS.MAP[entry.tempStem] || DICTIONARY.DETERMINERS.MAP[entry.tempStem] || DICTIONARY.ADJECTIVES.MAP[entry.tempStem])) continue;
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
            const tempAffixChecker = matchtype2.affixChecker(entry.tempStem, DICTIONARY.PARTICLES.MAP, false)
              ? matchtype2.affixChecker(entry.tempStem, DICTIONARY.PARTICLES.MAP, false)
              : null;

            if (tempAffixChecker) {
              for (const affix of tempAffixChecker) {
                if (!DICTIONARY.ADJECTIVES.MAP[affix.tempStem]) continue;
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
                result.suffix.paths.map(path => {
                  path[3] === DICTIONARY.ADJECTIVES.MAP[affix.tempStem].declension
                    ? tempResultsAdj['adjSuffix-partSuffix'].push(result) //checks if path declension is 'legal' //only pushes result if legal.
                    : null
                });
              }
            }
            else {
              if (!DICTIONARY.ADJECTIVES.MAP[entry.tempStem]) continue;
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
              result.suffix.paths.map(path => {
                path[3] === DICTIONARY.ADJECTIVES.MAP[entry.tempStem].declension
                  ? tempResultsAdj.adjSuffix.push(result) //checks if path declension is 'legal' //only pushes result if legal.
                  : null
              });
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
        case 'verbSuffix':
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
    for (const [genderKey, genderMap] of Object.entries(DICTIONARY.DETERMINERS.IRREGULARS.MAP)) {
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

export const text = {
}
export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}
