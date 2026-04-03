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

    const localHelperMap = {
      results: [],
      functions: {
        makeBaseResult: ({
          raws,
          affixes,
          stem,
          irregular = null }) => {
          return {
            raws,//oldest to newest
            affixes,
            stem,
            stemReal: 'temp',
            type: 'temp',
            state: 'regular',
            ...(irregular && { irregularObject: irregular })
          }
        },
        pushPossibilities: ({
          result,
          bucket,
          allowed = [IDS.WORDS.ADJ, IDS.WORDS.ADV, IDS.WORDS.AUX, IDS.WORDS.CON, IDS.WORDS.DET, IDS.WORDS.N, IDS.WORDS.PART, IDS.WORDS.PP, IDS.WORDS.V],//all are allowed per default, unless else is specified
          isNorADJ = false,
          NorADJraw = 0
        }) => {
          for (const possibility of dictionaryBased.findStemFromShort(result.stem)) {
            if (!allowed.includes(possibility.type)) continue;
            if (!DICTIONARY.ALL_WORDS.MAP[possibility.text]) continue;
            if (isNorADJ) {
              if (!(possibility.type === IDS.WORDS.N || possibility.type === IDS.WORDS.ADJ)) continue;
              //if (result.raws[0].paths === 'no-paths-for-this-type') continue;
              // Check declension legality
              const legal = result.raws[NorADJraw].paths.some(
                path => path[3] === possibility.declension
              );
              if (!legal) continue;
            }

            result.stemReal = possibility.text;
            result.type = possibility.type;
            bucket.push(result);
          }
        }
      }
    }
    for (const entry of map) {
      switch (entry.type) {
        case IDS.WORDS.AUX:
          //dont need, case verb will catch all since aux prefixes are just verb prefixes. it has proper .type so its fine
          break;
        case IDS.WORDS.DET:
          {
            const detMap = {
              results: {
                detSuffix: [],
                'detSuffix-ppPrefix': []
              },
              affixChecker: {
                'detSuffix-ppPrefix': matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PP].MAP, true) || []
              }
            }
            if (detMap.affixChecker['detSuffix-ppPrefix']) {
              for (const entry2 of detMap.affixChecker['detSuffix-ppPrefix']) {
                const result = localHelperMap.functions.makeBaseResult({
                  stem: entry2.tempStem,
                  affixes: {
                    suffix: {
                      suffix: entry.affix,
                      paths: entry.paths
                    },
                    preposition: {
                      preposition: entry2.affix,
                      paths: entry2.paths
                    }
                  },
                  raws: [entry, entry2]
                });
                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: detMap.results['detSuffix-ppPrefix'],
                  allowed: [IDS.WORDS.DET]
                });
              }
            }
            const result = localHelperMap.functions.makeBaseResult({
              raws: [entry],
              stem: entry.tempStem,
              affixes: {
                suffix: {
                  suffix: entry.affix,
                  paths: entry.paths
                }
              }
            });
            localHelperMap.functions.pushPossibilities({
              result,
              bucket: detMap.results.detSuffix,
              allowed: [IDS.WORDS.DET]
            });

            if (Object.values(detMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(detMap.results);
          }
          break;
        case IDS.WORDS.PART:
          {
            const partMap = {
              results: {
                'partPrefix-partSuffix-nounSuffix': [],//
                'partPrefix-partSuffix-adjSuffix': [],//
                // 'partPrefix-ppPrefix-nounSuffix': [],//order is pp-p-stem-suffix, so need to make it in either nounSuffix or pp cases
                //'partPrefix-ppPrefix-adjSuffix': [],//doesnt exist
                'partPrefix-nounSuffix': [],//
                'partPrefix-adjSuffix': [],//
                'partPrefix-partSuffix': [],//
                'partPrefix': [],
                'partSuffix': []

                //'partSuffix-nounSuffix-partPrefix': [],
                //'partSuffix-nounSuffix-ppPrefix': [],
                //'partSuffix-adjSuffix-partPrefix': [],
                //'partSuffix-adjSuffix-ppPrefix': [],
                //'partSuffix-adjSuffix': [],//move to adjSuffix case, as the particle is on the stem, not after the suffix.
                //'partSuffix-nounSuffix': [],//move to nounSuffix case, as the particle is on the stem, not after the suffix.
                //'partSuffix-partPrefix': [],
                //'partSuffix': []
              },
              affixChecker: {
                adjSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.ADJ].SUFFIXES.MATCHES, false),
                nounSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.N].SUFFIXES.MATCHES, false),
                partSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false)
              },
              functions: {
                NandADJChecker: ({ suffixList, baseBucket, comboBucket, allowedPOS }) => {
                  if (!suffixList) return;
                  if (!isPrefix) return;

                  for (const entry2 of suffixList) {
                    const baseResult = localHelperMap.functions.makeBaseResult({
                      raws: [entry, entry2],
                      affixes: {
                        suffix: {
                          suffix: entry2.affix,
                          paths: entry2.paths
                        },
                        particle: [{
                          particle: entry.affix,
                          paths: entry.paths,
                          state: 'prefix'
                        }]
                      },
                      stem: entry2.tempStem
                    });

                    localHelperMap.functions.pushPossibilities({
                      result: baseResult,
                      bucket: partMap.results[baseBucket],
                      allowed: [allowedPOS],
                      isNorADJ: true,
                      NorADJraw: 1
                    });

                    // inner partSuffix check
                    const partSuffixList = matchtype2.affixChecker(entry2.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || [];

                    for (const entry3 of partSuffixList) {
                      const comboResult = localHelperMap.functions.makeBaseResult({
                        raws: [entry, entry2, entry3],
                        affixes: {
                          suffix: {
                            suffix: entry2.affix,
                            paths: entry2.paths
                          },
                          particle: [
                            {
                              particle: entry.affix,
                              paths: entry.paths,
                              state: 'prefix'
                            },
                            {
                              particle: entry3.affix,
                              paths: entry3.paths,
                              state: 'suffix'
                            }
                          ]
                        },
                        stem: entry3.tempStem
                      });

                      localHelperMap.functions.pushPossibilities({
                        result: comboResult,
                        bucket: partMap.results[comboBucket],
                        allowed: [allowedPOS],
                        isNorADJ: true,
                        NorADJraw: 1
                      });
                    }
                  }
                }
              }
            }
            console.log({ partMap });
            // partPrefix-partSuffix-nounSuffix branch
            partMap.functions.NandADJChecker({
              suffixList: partMap.affixChecker.nounSuffix,
              baseBucket: 'partPrefix-nounSuffix',
              comboBucket: 'partPrefix-partSuffix-nounSuffix',
              allowedPOS: IDS.WORDS.N
            });

            // partPrefix-partSuffix-adjSuffix branch
            partMap.functions.NandADJChecker({
              suffixList: partMap.affixChecker.adjSuffix,
              baseBucket: 'partPrefix-adjSuffix',
              comboBucket: 'partPrefix-partSuffix-adjSuffix',
              allowedPOS: IDS.WORDS.ADJ
            });

            // partPrefix-partSuffix branch
            if (partMap.affixChecker['partSuffix'] && isPrefix) {
              for (const entry2 of partMap.affixChecker['partSuffix']) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
                  affixes: {
                    particle: [{
                      particle: entry.affix,
                      paths: entry.paths,
                      state: 'prefix'
                    }, {
                      particle: entry2.affix,
                      paths: entry2.paths,
                      state: 'suffix'
                    }]
                  },
                  stem: entry2.tempStem
                });
                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: partMap.results['partPrefix-partSuffix']
                });
              }
            }

            // partPrefix || partSuffix branch
            {
              const result = localHelperMap.functions.makeBaseResult({
                raws: [entry],
                affixes: {
                  particle: [{
                    particle: entry.affix,
                    paths: entry.paths,
                    state: isPrefix ? 'prefix' : 'suffix'
                  }]
                },
                stem: entry.tempStem
              });
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: isPrefix ? partMap.results['partPrefix'] : partMap.results['partSuffix']
              });
            }

            if (Object.values(partMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(partMap.results);
          }
          /*
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
          }*/
          break;
        case IDS.WORDS.V:
          {
            const verbMap = {
              results: {
                verbPrefix: [],
                verbSuffix: [],
                'verbPrefix-verbSuffix': []
              },
              affixChecker: {
                verbSuffix: matchtype2.affixChecker(
                  entry.tempStem,
                  DICTIONARY[IDS.WORDS.V].SUFFIXES.MATCHES,
                  false
                ) || []
              }
            }
            if (verbMap.affixChecker.verbSuffix.length > 0) {
              for (const entry2 of verbMap.affixChecker.verbSuffix) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
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
                  stem: entry2.tempStem
                });
                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: verbMap.results['verbPrefix-verbSuffix'],
                  allowed: [IDS.WORDS.V]
                });
              }
            }
            if (isPrefix) {
              const result = localHelperMap.functions.makeBaseResult({
                raws: [entry],
                affixes: {
                  prefix: {
                    paths: entry.paths,
                    prefix: entry.affix
                  }
                },
                stem: entry.tempStem
              });
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: verbMap.results['verbPrefix'],
                allowed: [IDS.WORDS.V, IDS.WORDS.AUX]
              });
            } else if (!isPrefix) {
              const result = localHelperMap.functions.makeBaseResult({
                raws: [entry],
                affixes: {
                  suffix: {
                    paths: entry.paths,
                    suffix: entry.affix
                  }
                },
                stem: entry.tempStem
              });
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: verbMap.results['verbSuffix'],
                allowed: [IDS.WORDS.V]
              });
            }
            if (Object.values(verbMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(verbMap.results);
          }
          break;
        case IDS.WORDS.N:
          {
            const nounMap = {
              results: {
                nounSuffix: [],
                'nounSuffix-ppPrefix': []
              },
              affixChecker: {
                'nounSuffix-ppPrefix': matchtype2.affixChecker(
                  entry.tempStem,
                  DICTIONARY[IDS.WORDS.PP].MAP,
                  true
                ) || []
              }
            }
            if (nounMap.affixChecker['nounSuffix-ppPrefix'].length > 0) {
              for (const entry2 of nounMap.affixChecker['nounSuffix-ppPrefix']) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
                  affixes: {
                    suffix: {
                      paths: entry2.paths,
                      suffix: entry2.affix
                    },
                    preposition: {
                      paths: entry.paths,
                      preposition: entry.affix
                    }
                  },
                  stem: entry2.tempStem
                });

                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: nounMap.results['nounSuffix-ppPrefix'],
                  allowed: [IDS.WORDS.N],
                  isNorADJ: true
                });
              }
            } else {
              const result = localHelperMap.functions.makeBaseResult({
                raws: [entry],
                affixes: {
                  suffix: {
                    paths: entry.paths,
                    suffix: entry.affix
                  }
                },
                stem: entry.tempStem
              });
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: nounMap.results['nounSuffix'],
                allowed: [IDS.WORDS.N],
                isNorADJ: true
              });
            }
            if (Object.values(nounMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(nounMap.results);
          }
          break;
        case IDS.WORDS.PP:
          {
            const ppMap = {
              results: {
                detRegular: [],
                detIrregular: [],
                [IDS.WORDS.N]: [],
                [IDS.WORDS.ADJ]: []
              },
              stemChecker: {
                detRegular: DICTIONARY[IDS.WORDS.DET].MAP[entry.tempStem] || {},
                detIrregular: irregulars.determiner(entry.tempStem) || [],
                [IDS.WORDS.N]: DICTIONARY[IDS.WORDS.N].MAP[entry.tempStem] || {},
                [IDS.WORDS.ADJ]: DICTIONARY[IDS.WORDS.ADJ].MAP[entry.tempStem] || {}
              }
            }
            const makePPResult = (raws, irregular = null) =>
              localHelperMap.functions.makeBaseResult({
                raws,
                affixes: {
                  preposition: {
                    paths: entry.paths,
                    preposition: entry.affix
                  }
                },
                stem: entry.tempStem,
                irregular
              });

            // --- Irregular determiners ---
            for (const entry2 of ppMap.stemChecker.detIrregular) {
              const result = makePPResult(
                [entry, entry2],
                {
                  stem: entry.tempStem,
                  path: entry2.path,
                  type: entry2.type
                }
              );
              result.state = 'irregular';
              ppMap.results.detIrregular.push(result);
            }

            // --- Noun + Adjective (shared logic) ---
            const hasValues = obj => Object.values(obj).length > 0;
            for (const type of [IDS.WORDS.N, IDS.WORDS.ADJ]) {
              if (!hasValues(ppMap.stemChecker[type])) continue;
              const result = makePPResult([entry]);
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: ppMap.results[type],
                allowed: [type]
              });
            }

            // --- Regular determiners ---
            if (Object.values(ppMap.stemChecker.detRegular).length > 0) {
              const result = makePPResult([entry]);
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: ppMap.results['detRegular'],
                allowed: [IDS.WORDS.DET]
              });
            }
            if (Object.values(ppMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(ppMap.results);
          }
          break;
        case IDS.WORDS.ADJ:
          {
            const adjMap = {
              results: {
                adjSuffix: []
              },
              affixChecker: {}
            }
            const result = localHelperMap.functions.makeBaseResult({
              raws: [entry],
              stem: entry.tempStem,
              affixes: {
                suffix: {
                  suffix: entry.affix,
                  paths: entry.paths
                }
              }
            });
            localHelperMap.functions.pushPossibilities({
              result,
              bucket: adjMap.results['adjSuffix'],
              allowed: [IDS.WORDS.ADJ],
              isNorADJ: true
            });
            if (Object.values(adjMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(adjMap.results);
          }
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
    return localHelperMap.results;
  },
  flatten: (map) => {
    const result = {};
    for (const [key, value] of Object.entries(map)) {
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
  },/*
  determiner: (word) => {
    const matches = [];
    for (const [genderKey, genderMap] of Object.entries(DICTIONARY[IDS.WORDS.DET].IRREGULARS.MAP)) {
      console.log([genderKey, genderMap])
      for (const [typeKey, typeMap] of Object.entries(genderMap)) {
        console.log([typeKey, typeMap])
        for (const [numberKey, numberValue] of Object.entries(typeMap)) {
          console.log([numberKey, numberValue])
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
  },*///lirox changed the map. fix later if he doesnt change it back
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
        th.style.width = '25%';//fix later. first th should be less wide than the other 3.
        headerRow.appendChild(th);
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

export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}
