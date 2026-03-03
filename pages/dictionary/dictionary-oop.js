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
      console.log('affixMatch |', affixMatch);

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
        default:
          console.warn('unhandled affix match type |', affixMatch.type);
          break;
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
          const tempAffixChecker = {
            adjSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.ADJECTIVES.SUFFIXES.MATCHES, false),
            nounSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.NOUNS.SUFFIXES.MATCHES, false),
            partPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY.PARTICLES.MAP, true)
          }
          const tempResults = {
            'partSuffix-nounSuffix-partPrefix': [],
            'partSuffix-adjSuffix': [],
            'partSuffix-nounSuffix': [],
            'partSuffix-partPrefix': []
          }

          if (tempAffixChecker.nounSuffix && tempAffixChecker.partPrefix) {
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
              tempMap.newerEntry = matchtype2.affixChecker(tempObj.tempStem, DICTIONARY.PARTICLES.MAP, true);
              for (const affix2 of Object.values(tempMap.newerEntry)) {
                console.log(affix2)
                if (!DICTIONARY.ALL_WORDS.MAP[affix2.tempStem]) continue;

                tempResults['partSuffix-nounSuffix-partPrefix'].push({
                  raws: {
                    'pre-declensionFinder()-raws': tempObj.raws,
                    'post-declensionFinder()-entry': affix2
                  },
                  suffix: tempObj.suffix,
                  particleSuffix: tempObj.particle,
                  particlePreffix: affix2.affix,
                  stem: affix2.tempStem,
                  type: tempObj.type
                });
              }
            }
          } else if (tempAffixChecker.adjSuffix) {
            partSuffix_adj_and_noun(tempAffixChecker.adjSuffix, 'partSuffix-adjSuffix');
          } else if (tempAffixChecker.nounSuffix) {
            partSuffix_adj_and_noun(tempAffixChecker.nounSuffix, 'partSuffix-nounSuffix');
          } else if (tempAffixChecker.partPrefix) {
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
          function partSuffix_adj_and_noun(mapLocal, resultKey) {
            for (const affix of mapLocal) {
              if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;

              tempResults[resultKey].push({
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
          tempMap.results.push(tempResults);
          break;
        case IDS.WORDS.V:
          tempMap.newEntry = isPrefix
            ? matchtype2.affixChecker(entry.tempStem, DICTIONARY.VERBS.PREFIXES.MATCHES, true)
            : matchtype2.affixChecker(entry.tempStem, DICTIONARY.VERBS.SUFFIXES.MATCHES, false);
          for (const affix of tempMap.newEntry) {
            if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;

            tempMap.results.push({
              raws: {
                'pre-declensionFinder()-entry': entry,
                'post-declensionFinder()-entry': tempMap.newEntry
              },
              suffix: {
                suffix: isPrefix
                  ? entry.affix
                  : affix.affix,
                paths: isPrefix
                  ? entry.paths
                  : affix.paths
              },
              prefix: {
                prefix: isPrefix
                  ? affix.affix
                  : entry.affix,
                paths: isPrefix
                  ? affix.paths
                  : entry.paths
              },
              stem: affix.tempStem,
              type: affix.type
            });
          }
          break;
        default:
          console.warn('unhandled declensionFinder type |', entry.type);
          break;
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