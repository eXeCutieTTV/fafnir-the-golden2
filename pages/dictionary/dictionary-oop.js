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
        case IDS.WORDS.PART:
          const tempAffixChecker = {//partsuffix(needs to be in case part) 
            adjSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.ADJECTIVES.SUFFIXES.MATCHES, false),
            nounSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.NOUNS.SUFFIXES.MATCHES, false),
            partPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.PARTICLES.MAP, true)//,
            //ppPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.PREPOSITIONS.MAP, true)
          }
          const tempResults = {
            'partSuffix-nounSuffix-partPrefix': [],
            'partSuffix-nounSuffix-ppPrefix': [],//hm. can adjs also have partSuffix-pp/partPrefixes?
            'partSuffix-adjSuffix': [],
            'partSuffix-nounSuffix': [],
            'partSuffix-partPrefix': [],
            'partSuffix': []
          }
          if (tempAffixChecker.adjSuffix) {
            for (const affix of tempAffixChecker.adjSuffix) {
              if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;
              {
                const targetDeclension = DICTIONARY.NOUNS.MAP[affix.tempStem].declension;
                if (affix.paths.every(path => path[3] !== targetDeclension)) continue;
              }

              tempResults['partSuffix-adjSuffix'].push({
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
          if (tempAffixChecker.nounSuffix) {
            for (const affix of tempAffixChecker.nounSuffix) {
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
                type: affix.type
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
                  tempResults['partSuffix-nounSuffix-partPrefix'].push({
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
                  tempResults['partSuffix-nounSuffix-ppPrefix'].push({
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
                tempResults['partSuffix-nounSuffix'].push({
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
          if (tempAffixChecker.partPrefix) {
            for (const affix of tempAffixChecker.partPrefix) {
              if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;

              tempResults['partSuffix-partPrefix'].push({
                raws: {
                  'pre-declensionFinder()-entry': entry,
                  'post-declensionFinder()-entry': affix
                },
                particleSuffix: entry.affix,
                particlePrefix: affix.affix,
                stem: affix.tempStem,
                type: affix.type
              });
            }
          }
          if (!tempAffixChecker.adjSuffix && !tempAffixChecker.nounSuffix && !tempAffixChecker.partPrefix && !tempAffixChecker.ppPrefix) {
            tempResults['partSuffix'].push({
              raws: {
                'pre-declensionFinder()-entry': entry
              },
              particleSuffix: entry.affix,
              stem: entry.tempStem,
              type: entry.type
            });
          }
          tempMap.results.push(tempResults);
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
                type: affix.type
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
                type: entry.type
              };
              DICTIONARY.VERBS.MAP[result.stem]
                ? tempResultsVerb.verbPrefix.push(result)
                : null
            }
            tempMap.results.push(tempResultsVerb);
          }
          else {
            {
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
              };
              DICTIONARY.VERBS.MAP[result.stem]
                ? tempMap.results.push(result)//tempResultsVerb.verbSuffix.push(result)
                : null
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
            ? tempMap.results.push(entry) //checks if path declension is 'legal' //only pushes result if legal.
            : null
          );
          break;
        case IDS.WORDS.PP:
          tempMap.results.push({
            raws: {
              'pre-declensionFinder()-entry': entry
            },
            preposition: entry.affix,
            stem: entry.tempStem,
            paths: entry.paths
          });
          break;
        default: console.warn('unhandled declensionFinder type |', entry.type);
      }
    }
    /*
    if (affixMatch.type === IDS.OTHER.ML) {
      for (const entry of affixMatch.variants) {
        affixFinder(word, entry, isPrefix)
      }
    } else affixFinder(word, affixMatch, isPrefix);
    */ //not even here yet tbh
    return tempMap.results;
  }
}

export const text = {
}
export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}
