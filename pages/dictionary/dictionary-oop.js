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
          //tempMap.affix = (affixMatch.type === IDS.WORDS.PART || affixMatch.type === IDS.WORDS.PP) ? affixMatch.text : appliedOrUnapplied(affixMatch.variants[0], affixMatch.variants[1]);

          tempMap.affix = appliedOrUnapplied(affixMatch.variants[0], affixMatch.variants[1]);

          results.push({
            affix: tempMap.affix,
            tempStem: isPrefix
              ? word.slice(tempMap.affix.length)
              : word.slice(0, -tempMap.affix.length),
            type: affixMatch.type,
            paths: /*(affixMatch.type === IDS.WORDS.PART || affixMatch.type === IDS.WORDS.PP) ? 'indecl' : */affixMatch.paths
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
            paths: 'indecl'
          });
          break;
        default: console.warn('unhandled affix match type |', affixMatch.type);
      }
    }
    return results;
  },
  declensionFinder: (map, isPrefix) => {
    const localHelperMap = {
      results: [], //returned array
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
            state: irregular ? 'irregular' : 'regular',
            ...(irregular && { irregularObject: irregular })
          }
        },
        pushPossibilities: ({
          result,
          bucket,
          allowed = Object.values(IDS.WORDS),//all are allowed per default, unless else is specified
          isNorADJ = false,
          NorADJraw = 0
        }) => {

          function parse({ result, bucket, possibility, vForm = false, elative = false }) {
            result.stemReal = vForm ? searching.isVForm(result.stem).result.text : elative ? searching.isElative(result.stem).result.text : possibility.text;
            result.type = vForm ? IDS.WORDS.V : elative ? IDS.WORDS.ADJ : possibility.type;
            console.log({ result });
            elative
              ? result.raws[NorADJraw].type === IDS.WORDS.ADJ
                ? bucket.push(result)
                : null
              : bucket.push(result);
          }
          if (Object.values(searching.isVForm(result.stem)).length > 0) parse({ result, bucket, vForm: true });
          if (Object.values(searching.isElative(result.stem)).length > 0) parse({ result, bucket, elative: true })

          for (const possibility of dictionaryBased.findStemFromShort(result.stem)) {

            if (!allowed.includes(possibility.type)) continue;
            if (!DICTIONARY.ALL_WORDS.MAP[possibility.text]) continue;
            if (isNorADJ) {
              if (!(possibility.type === IDS.WORDS.N || possibility.type === IDS.WORDS.ADJ)) continue;
              //console.log(possibility)

              // Check declension legality
              const legal = result.raws[NorADJraw].paths.some(
                path => path[3] === possibility.declension
              );
              if (!legal) continue;
            }

            parse({ result, bucket, possibility });
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
                detSuffix: [], //loxtahyn
                'detSuffix-ppPrefix': [] //æzeloxtahyn
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
                'partPrefix-partSuffix-nounSuffix': [], //iæklūānrk
                'partPrefix-partSuffix-adjSuffix': [], //iæklôħānrk
                'partPrefix-nounSuffix': [], //iæklūrk
                'partPrefix-adjSuffix': [], //iæklôħrk
                'partPrefix-partSuffix': [], //iæklôħān
                'partPrefix': [], //iæklôħ
                'partSuffix': [] //æklôħān
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
          break;
        case IDS.WORDS.V:
          {
            const verbMap = {
              results: {
                verbPrefix: [], //
                verbSuffix: [], //
                'verbPrefix-verbSuffix': [] //
              },
              affixChecker: {
                verbSuffix: matchtype2.affixChecker(
                  entry.tempStem,
                  DICTIONARY[IDS.WORDS.V].SUFFIXES.MATCHES,
                  false
                ) || []
              }
            }

            //console.log({ verbMap })

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
              console.log(result)
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
                nounSuffix: [], //æklūrk
                'nounSuffix-ppPrefix': [], //æzeæklūrk
                'nounSuffix-partSuffix': [], //iæklūrk
                'nounSuffix-partSuffix-ppPrefix': [], //æzeæklūānrk
                'nounSuffix-partPrefix-ppPrefix': [], //æzeiæklūrk
                'nounSuffix-partPrefix-partSuffix-ppPrefix': [] //æzeiæklūānrk
              },
              affixChecker: {
                'nounSuffix-ppPrefix': matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PP].MAP, true) || [],
                'nounSuffix-partSuffix': matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || []
              }
            }
            if (nounMap.affixChecker['nounSuffix-ppPrefix'].length > 0) {
              for (const entry2 of nounMap.affixChecker['nounSuffix-ppPrefix']) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
                  affixes: {
                    suffix: {
                      paths: entry.paths,
                      suffix: entry.affix
                    },
                    preposition: {
                      paths: entry2.paths,
                      preposition: entry2.affix
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

                const innerNounMap = {
                  affixChecker: {
                    partSuffix: matchtype2.affixChecker(entry2.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || [],
                    partPrefix: matchtype2.affixChecker(entry2.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, true) || []
                  },
                  functions: {
                    localResultMaker: (isPrefix) => {
                      for (const entry3 of isPrefix ? innerNounMap.affixChecker.partPrefix : innerNounMap.affixChecker.partSuffix) {
                        const result = localHelperMap.functions.makeBaseResult({
                          raws: [entry, entry2, entry3],
                          affixes: {
                            suffix: {
                              paths: entry.paths,
                              suffix: entry.affix
                            },
                            preposition: {
                              paths: entry2.paths,
                              preposition: entry2.affix
                            },
                            particle: [{
                              paths: entry3.paths,
                              particle: entry3.affix,
                              state: isPrefix ? 'prefix' : 'suffix'
                            }]
                          },
                          stem: entry3.tempStem
                        });
                        localHelperMap.functions.pushPossibilities({
                          result,
                          bucket: isPrefix ? nounMap.results['nounSuffix-partPrefix-ppPrefix'] : nounMap.results['nounSuffix-partSuffix-ppPrefix'],
                          allowed: [IDS.WORDS.N],
                          isNorADJ: true
                        });
                        if (!isPrefix) continue;// only do it once, otherwise id get double result
                        const innerInnerNounMap = {
                          affixChecker: {
                            partSuffix: matchtype2.affixChecker(entry3.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || []
                          }
                        }
                        //console.log({ innerInnerNounMap }, entry3);
                        if (innerInnerNounMap.affixChecker.partSuffix.length > 0) {
                          for (const entry4 of innerInnerNounMap.affixChecker.partSuffix) {
                            const result = localHelperMap.functions.makeBaseResult({
                              raws: [entry, entry2, entry3, entry4],
                              affixes: {
                                suffix: {
                                  paths: entry.paths,
                                  suffix: entry.affix
                                },
                                preposition: {
                                  paths: entry2.paths,
                                  preposition: entry2.affix
                                },
                                particle: [{
                                  paths: entry4.paths,
                                  particle: entry4.affix,
                                  state: 'suffix'
                                }, {
                                  paths: entry3.paths,
                                  particle: entry3.affix,
                                  state: 'prefix'
                                }]
                              },
                              stem: entry4.tempStem
                            });
                            localHelperMap.functions.pushPossibilities({
                              result,
                              bucket: nounMap.results['nounSuffix-partPrefix-partSuffix-ppPrefix'],
                              allowed: [IDS.WORDS.N],
                              isNorADJ: true
                            });
                          }
                        }
                      }
                    }
                  }
                }
                if (innerNounMap.affixChecker.partSuffix) {
                  innerNounMap.functions.localResultMaker(false);
                }
                if (innerNounMap.affixChecker.partPrefix) {
                  innerNounMap.functions.localResultMaker(true);
                }
              }
            }
            {
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
            if (nounMap.affixChecker['nounSuffix-partSuffix'].length > 0) {
              for (const entry2 of nounMap.affixChecker['nounSuffix-partSuffix']) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
                  affixes: {
                    suffix: {
                      paths: entry2.paths,
                      suffix: entry2.affix
                    },
                    particle: {
                      paths: entry.paths,
                      particle: entry.affix,
                      state: 'suffix'
                    }
                  },
                  stem: entry2.tempStem
                });
                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: nounMap.results['nounSuffix-partSuffix'],
                  allowed: [IDS.WORDS.N],
                  isNorADJ: true
                });
              }
            }
            if (Object.values(nounMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(nounMap.results);
          }
          break;
        case IDS.WORDS.PP:
          {
            const ppMap = {
              results: {
                'ppPreifx-detRegular': [], //æzeloxtahyn
                detIrregular: [], //æzetōq̇ //search works; onpage logic doesnt handle irregulars yet
                [IDS.WORDS.N]: [], //æzeæklū
                [IDS.WORDS.ADJ]: [], //æzeæklôħ
                [IDS.WORDS.ADV]: [], //æzeax
                [IDS.WORDS.AUX]: [], //æzelinæ
                'ppPrefix-partSuffix': [], //æzeæklūān
                'ppPrefix-partPrefix': [], //æzeiæklū
                'ppPrefix-partPrefix-partSuffix': [], //æzeiæklūān
                'ppPrefix-auxprefix': [], //æzexenlinæ
                'ppPrefix-verbPrefix': [], //æzexenæf
                'ppPrefix-verbSuffix': [], //æzeæfur
                'ppPrefix-verbPrefix-verbSuffix': [] //æzexenæfur
              },
              stemChecker: {
                detRegular: DICTIONARY[IDS.WORDS.DET].MAP[entry.tempStem] || {},
                detIrregular: irregulars.determiner(entry.tempStem) || [],
                [IDS.WORDS.N]: DICTIONARY[IDS.WORDS.N].MAP[entry.tempStem] || {},
                [IDS.WORDS.ADJ]: DICTIONARY[IDS.WORDS.ADJ].MAP[entry.tempStem] || {},
                [IDS.WORDS.ADV]: DICTIONARY[IDS.WORDS.ADV].MAP[entry.tempStem] || {},
                [IDS.WORDS.AUX]: DICTIONARY[IDS.WORDS.AUX].MAP[entry.tempStem] || {}
              },
              affixChecker: {
                partSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || [],
                partPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, true) || [],
                auxPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.V].PREFIXES.MATCHES, true) || [],
                verbPrefix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.V].PREFIXES.MATCHES, true) || [],
                verbSuffix: matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.V].SUFFIXES.MATCHES, false) || []
              },
              functions: {
                makePPResult: (raws, irregular = null) => {
                  return localHelperMap.functions.makeBaseResult({
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
                },
                partResults: (isPrefix) => {
                  for (const entry2 of isPrefix ? ppMap.affixChecker.partPrefix : ppMap.affixChecker.partSuffix) {
                    const result = localHelperMap.functions.makeBaseResult({
                      raws: [entry, entry2],
                      affixes: {
                        preposition: {
                          paths: entry.paths,
                          preposition: entry.affix
                        },
                        particle: [{
                          paths: entry2.paths,
                          particle: entry2.affix,
                          state: isPrefix ? 'prefix' : 'suffix'
                        }]
                      },
                      stem: entry2.tempStem
                    });
                    localHelperMap.functions.pushPossibilities({
                      result,
                      bucket: isPrefix ? ppMap.results['ppPrefix-partPrefix'] : ppMap.results['ppPrefix-partSuffix']
                    });
                    //if (!isPrefix) continue;// only do it once, otherwise id get double result //cant do this. its only called once in dictionary.js
                    const innerPartMap = {
                      affixChecker: {
                        partSuffix: matchtype2.affixChecker(entry2.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || []
                      }
                    }
                    console.log({ innerPartMap })
                    if (innerPartMap.affixChecker.partSuffix.length > 0) {
                      for (const entry3 of innerPartMap.affixChecker.partSuffix) {
                        const result = localHelperMap.functions.makeBaseResult({
                          raws: [entry, entry2, entry3],
                          affixes: {
                            preposition: {
                              paths: entry.paths,
                              preposition: entry.affix
                            },
                            particle: [{
                              paths: entry2.paths,
                              particle: entry2.affix,
                              state: 'prefix'
                            }, {
                              paths: entry3.paths,
                              particle: entry3.affix,
                              state: 'suffix'
                            }]
                          },
                          stem: entry3.tempStem
                        });
                        localHelperMap.functions.pushPossibilities({
                          result,
                          bucket: ppMap.results['ppPrefix-partPrefix-partSuffix']
                        });
                      }
                    }
                  }
                },
                advOrAuxResults: (isAux) => {
                  const result = ppMap.functions.makePPResult([entry]);
                  localHelperMap.functions.pushPossibilities({
                    result,
                    bucket: isAux ? ppMap.results[IDS.WORDS.AUX] : ppMap.results[IDS.WORDS.ADV],
                    allowed: isAux ? [IDS.WORDS.AUX] : [IDS.WORDS.ADV]
                  });
                },
                verbResults: (isPrefix) => {
                  for (const entry2 of isPrefix ? ppMap.affixChecker.verbPrefix : ppMap.affixChecker.verbSuffix) {
                    const result = localHelperMap.functions.makeBaseResult({
                      raws: [entry, entry2],
                      affixes: {
                        preposition: {
                          paths: entry.paths,
                          preposition: entry.affix
                        },
                        ...(isPrefix && ({
                          prefix: {
                            paths: entry2.paths,
                            prefix: entry2.affix
                          }
                        })),
                        ...(!isPrefix && ({
                          suffix: {
                            paths: entry2.paths,
                            suffix: entry2.affix
                          }
                        }))
                      },
                      stem: entry2.tempStem
                    });

                    localHelperMap.functions.pushPossibilities({
                      result,
                      bucket: isPrefix ? ppMap.results['ppPrefix-verbPrefix'] : ppMap.results['ppPrefix-verbSuffix'],
                      allowed: [IDS.WORDS.V]
                    });
                    if (!isPrefix) continue;//to prevent double results
                    for (const entry3 of (matchtype2.affixChecker(entry2.tempStem, DICTIONARY[IDS.WORDS.V].SUFFIXES.MATCHES, false) || [])) {
                      const result = localHelperMap.functions.makeBaseResult({
                        raws: [entry, entry2, entry3],
                        affixes: {
                          preposition: {
                            paths: entry.paths,
                            preposition: entry.affix
                          },
                          prefix: {
                            paths: entry2.paths,
                            prefix: entry2.affix
                          },
                          suffix: {
                            paths: entry3.paths,
                            suffix: entry3.affix
                          }
                        },
                        stem: entry3.tempStem
                      });
                      localHelperMap.functions.pushPossibilities({
                        result,
                        bucket: ppMap.results['ppPrefix-verbPrefix-verbSuffix'],
                        allowed: [IDS.WORDS.V]
                      });
                    }
                  }
                }
              }
            }
            console.log({ ppMap });

            // --- Irregular determiners ---
            for (const entry2 of ppMap.stemChecker.detIrregular) {
              const result = localHelperMap.functions.makeBaseResult({
                raws: [entry, entry2],
                stem: entry.tempStem,
                affixes: {
                  preposition: {
                    preposition: entry.affix,
                    paths: entry.paths
                  },
                  irregular: {
                    path: entry2.path,
                    type: entry2.type
                  }
                }
              });
              result.type = IDS.WORDS.DET;
              result.stemReal = result.stem;
              ppMap.results.detIrregular.push(result);
            }

            // --- Noun + Adjective (shared logic) ---
            const hasValues = obj => Object.values(obj).length > 0;
            for (const type of [IDS.WORDS.N, IDS.WORDS.ADJ]) {
              if (!hasValues(ppMap.stemChecker[type])) continue;
              console.log([entry])
              const result = ppMap.functions.makePPResult([entry]);
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: ppMap.results[type],
                allowed: [type]
              });
            }

            // --- Regular determiners ---
            if (Object.values(ppMap.stemChecker.detRegular).length > 0) {
              const result = ppMap.functions.makePPResult([entry]);
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: ppMap.results['ppPreifx-detRegular'],
                allowed: [IDS.WORDS.DET]
              });
            }

            // part cases
            if (ppMap.affixChecker.partPrefix.length > 0) ppMap.functions.partResults(true);
            if (ppMap.affixChecker.partSuffix.length > 0) ppMap.functions.partResults(false);

            // aux prefix case
            if (ppMap.affixChecker.auxPrefix.length > 0) {
              for (const entry2 of ppMap.affixChecker.auxPrefix) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
                  affixes: {
                    preposition: {
                      paths: entry.paths,
                      preposition: entry.affix
                    },
                    prefix: {
                      paths: entry2.paths,
                      prefix: entry2.affix
                    }
                  },
                  stem: entry2.tempStem
                });
                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: ppMap.results['ppPrefix-auxprefix'],
                  allowed: [IDS.WORDS.AUX]
                });
              }
            }

            if (Object.values(ppMap.stemChecker[IDS.WORDS.ADV]).length > 0) ppMap.functions.advOrAuxResults(false);
            if (Object.values(ppMap.stemChecker[IDS.WORDS.AUX]).length > 0) ppMap.functions.advOrAuxResults(true);

            //verb cases
            if (ppMap.affixChecker.verbPrefix.length > 0) ppMap.functions.verbResults(true);
            if (ppMap.affixChecker.verbSuffix.length > 0) ppMap.functions.verbResults(false);


            if (Object.values(ppMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(ppMap.results);
          }
          break;
        case IDS.WORDS.ADJ:
          {
            const adjMap = {
              results: {
                adjSuffix: [], //æklôħrk
                'adjSuffix-ppPrefix': [], //æzeæklôħrk
                'adjSuffix-partSuffix': [], //æklôħānrk
                'adjSuffix-partSuffix-ppPrefix': [], //æzeæklôħānrk
                'adjSuffix-partPrefix-ppPrefix': [], //æzeiæklôħrk
                'adjSuffix-partPrefix-partSuffix-ppPrefix': [] //æzeiæklôħānrk
              },
              affixChecker: {
                'adjSuffix-ppPrefix': matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PP].MAP, true) || [],
                'adjSuffix-partSuffix': matchtype2.affixChecker(entry.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || []
              }
            }
            if (adjMap.affixChecker['adjSuffix-ppPrefix'].length > 0) {
              for (const entry2 of adjMap.affixChecker['adjSuffix-ppPrefix']) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
                  affixes: {
                    suffix: {
                      paths: entry.paths,
                      suffix: entry.affix
                    },
                    preposition: {
                      paths: entry2.paths,
                      preposition: entry2.affix
                    }
                  },
                  stem: entry2.tempStem
                });

                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: adjMap.results['adjSuffix-ppPrefix'],
                  allowed: [IDS.WORDS.ADJ],
                  isNorADJ: true
                });

                const innerAdjMap = {
                  affixChecker: {
                    partSuffix: matchtype2.affixChecker(entry2.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || [],
                    partPrefix: matchtype2.affixChecker(entry2.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, true) || []
                  },
                  functions: {
                    localResultMaker: (isPrefix) => {
                      for (const entry3 of isPrefix ? innerAdjMap.affixChecker.partPrefix : innerAdjMap.affixChecker.partSuffix) {
                        const result = localHelperMap.functions.makeBaseResult({
                          raws: [entry, entry2, entry3],
                          affixes: {
                            suffix: {
                              paths: entry.paths,
                              suffix: entry.affix
                            },
                            preposition: {
                              paths: entry2.paths,
                              preposition: entry2.affix
                            },
                            particle: [{
                              paths: entry3.paths,
                              particle: entry3.affix,
                              state: isPrefix ? 'prefix' : 'suffix'
                            }]
                          },
                          stem: entry3.tempStem
                        });
                        localHelperMap.functions.pushPossibilities({
                          result,
                          bucket: isPrefix ? adjMap.results['adjSuffix-partPrefix-ppPrefix'] : adjMap.results['adjSuffix-partSuffix-ppPrefix'],
                          allowed: [IDS.WORDS.ADJ],
                          isNorADJ: true
                        });
                        if (!isPrefix) continue;// only do it once, otherwise id get double result
                        const innerInnerAdjMap = {
                          affixChecker: {
                            partSuffix: matchtype2.affixChecker(entry3.tempStem, DICTIONARY[IDS.WORDS.PART].MAP, false) || []
                          }
                        }
                        if (innerInnerAdjMap.affixChecker.partSuffix.length > 0) {
                          for (const entry4 of innerInnerAdjMap.affixChecker.partSuffix) {
                            const result = localHelperMap.functions.makeBaseResult({
                              raws: [entry, entry2, entry3, entry4],
                              affixes: {
                                suffix: {
                                  paths: entry.paths,
                                  suffix: entry.affix
                                },
                                preposition: {
                                  paths: entry2.paths,
                                  preposition: entry2.affix
                                },
                                particle: [{
                                  paths: entry4.paths,
                                  particle: entry4.affix,
                                  state: 'suffix'
                                }, {
                                  paths: entry3.paths,
                                  particle: entry3.affix,
                                  state: 'prefix'
                                }]
                              },
                              stem: entry4.tempStem
                            });
                            localHelperMap.functions.pushPossibilities({
                              result,
                              bucket: adjMap.results['adjSuffix-partPrefix-partSuffix-ppPrefix'],
                              allowed: [IDS.WORDS.ADJ],
                              isNorADJ: true
                            });
                          }
                        }
                      }
                    }
                  }
                }
                if (innerAdjMap.affixChecker.partSuffix) {
                  innerAdjMap.functions.localResultMaker(false);
                }
                if (innerAdjMap.affixChecker.partPrefix) {
                  innerAdjMap.functions.localResultMaker(true);
                }
              }
            }
            {
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
              //console.log(result)
              //if (!result) continue;
              localHelperMap.functions.pushPossibilities({
                result,
                bucket: adjMap.results['adjSuffix'],
                allowed: [IDS.WORDS.ADJ],
                isNorADJ: true
              });
            }
            if (adjMap.affixChecker['adjSuffix-partSuffix'].length > 0) {
              for (const entry2 of adjMap.affixChecker['adjSuffix-partSuffix']) {
                const result = localHelperMap.functions.makeBaseResult({
                  raws: [entry, entry2],
                  affixes: {
                    suffix: {
                      paths: entry.paths,
                      suffix: entry.affix
                    },
                    particle: [{
                      paths: entry2.paths,
                      particle: entry2.affix,
                      state: 'suffix'
                    }]
                  },
                  stem: entry2.tempStem
                });
                localHelperMap.functions.pushPossibilities({
                  result,
                  bucket: adjMap.results['adjSuffix-partSuffix'],
                  allowed: [IDS.WORDS.ADJ],
                  isNorADJ: true
                });
              }
            }
            if (Object.values(adjMap.results).some(arr => arr.length > 0)) localHelperMap.results.push(adjMap.results);
          }
          break;
        default: console.warn('unhandled declensionFinder type |', entry.type);
      }
    }

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
              const result = {
                path: {
                  gender: genderKey,
                  number: numberKey,
                  person: personKey,
                  case: caseKey,
                },
                word: caseValue,
                type: 'personal'
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
      //console.log({ genderKey, genderMap })
      if (!genderMap) continue;
      if (genderKey === 'Negative-Article' && word === genderMap.text) {
        matches.push({
          path: {
            gender: 'unavailable',
            number: 'unavailable',
          },
          word: genderMap.text,
          type: 'Negative-Article'
        });
        continue;
      } else if (genderKey === 'Negative-Article') continue;
      for (const [typeKey, typeMap] of Object.entries(genderMap)) {
        //console.log([typeKey, typeMap], 1)
        for (const [numberKey, numberValue] of Object.entries(typeMap)) {
          //console.log([numberKey, numberValue], 2)
          if (numberValue.text === word) {
            const result = {
              path: {
                gender: genderKey,
                number: numberKey,
              },
              word: numberValue,
              type: typeKey
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
            const result = {
              path: {
                gender: genderKey,
                case: caseKey,
              },
              word: caseValue,
              type: typeKey
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
  },
  transcribe: (word, state) => {
    return !state
      ? CHARACTERS.entriesToGlyphs(CHARACTERS.textToEntriesByText(word))
      : CHARACTERS.entriesToText(CHARACTERS.textToEntriesByGlyph(word))
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
    pressableLoadTableButtons: ({ el, word, affixesStrValues = [], declension, stem = word, verbForms = [], MDEntry = {}, adjForms = [] }) => {
      const wrapperWrapper = document.getElementById('loadableTable').children;
      affixesStrValues.length > 0 ? console.log(affixesStrValues) : null
      //console.log(word, stem)
      const wordClass = el.dataset.wordclass;
      const hasPrefix = affixesStrValues[2] !== 'ø';
      const hasSuffix = affixesStrValues[4] !== 'ø';

      const referenceMap = {
        consts: {},
        functions: {
          tables: {
            [IDS.WORDS.N]: () => {
              htmlEditing.tables.noun({ declension, mood: 'Directive', wrapper: wrapperWrapper[0], keyword: word, stem, dicEntry: MDEntry });
              htmlEditing.tables.noun({ declension, mood: 'Recessive', wrapper: wrapperWrapper[1], keyword: word, stem, dicEntry: MDEntry });
              [...wrapperWrapper].forEach(el => htmlEditing.transcribe(el));
            },
            [IDS.WORDS.V]: (word, hasPrefix = true, hasSuffix = true) => {
              function loadTables(word, hasPrefix, hasSuffix) {
                hasPrefix ? htmlEditing.tables.verb(true, word, wrapperWrapper[1]) : null;
                hasSuffix ? htmlEditing.tables.verb(false, word, wrapperWrapper[2]) : null;
                [...wrapperWrapper].forEach(el => htmlEditing.transcribe(el));
              }

              htmlEditing.tables.verbForms(verbForms, wrapperWrapper[0]);
              loadTables(word, hasPrefix, hasSuffix);
              //console.log(verbForms)

              // Use event delegation on the parent to handle clicks on .verbForms elements
              const loadableTable = document.getElementById('loadableTable');
              loadableTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('verbForms')) {
                  referenceMap.functions.misc.clearHtml();
                  loadTables(e.target.textContent, hasPrefix, hasSuffix);
                  htmlEditing.tables.verbForms(verbForms, wrapperWrapper[0]);
                }
              });
            },
            [IDS.WORDS.DET]: () => {
              htmlEditing.tables.determiner(wrapperWrapper[0], word);
              [...wrapperWrapper].forEach(el => htmlEditing.transcribe(el));
            },
            [IDS.WORDS.ADJ]: () => {
              function loadTables(word) {
                htmlEditing.tables.adjective(declension, 'Directive', wrapperWrapper[1], word, stem);
                htmlEditing.tables.adjective(declension, 'Recessive', wrapperWrapper[2], word, stem);
                [...wrapperWrapper].forEach(el => htmlEditing.transcribe(el));
              }

              htmlEditing.tables.adjForms(adjForms, wrapperWrapper[0]);
              loadTables(word);

              // Use event delegation on the parent to handle clicks on .verbForms elements
              const loadableTable = document.getElementById('loadableTable');
              loadableTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('adjForms')) {
                  referenceMap.functions.misc.clearHtml();
                  loadTables(e.target.textContent);
                  htmlEditing.tables.adjForms(adjForms, wrapperWrapper[0]);
                }
              });
            }
          },
          misc: {
            clearHtml: () => { for (const wrapper of wrapperWrapper) while (wrapper.firstChild) wrapper.firstChild.remove(); },
            isEmpty: () => { return !Array.from(wrapperWrapper).some(child => child.innerHTML.trim().length > 0) },
            toggleLoad: (Fn) => {
              el.addEventListener('click', () => {
                if (sessionStorage.getItem('lastLoaded') === el.dataset.colindex && !referenceMap.functions.misc.isEmpty()) {
                  referenceMap.functions.misc.clearHtml();
                  sessionStorage.setItem('lastLoaded', null);
                  return;
                }
                referenceMap.functions.misc.clearHtml();
                sessionStorage.setItem('lastLoaded', el.dataset.colindex)
                Fn();
              });
            }
          }
        }
      }

      if (el.dataset.defrow) {
        switch (wordClass) {
          case IDS.WORDS.N:
            referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.N]());
            break;
          case IDS.WORDS.V:
            referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.V](word));
            break;
          case IDS.WORDS.DET:
            referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.DET]());
            break;
          case IDS.WORDS.ADJ:
            referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.ADJ]());
            break;
          case IDS.WORDS.AUX:
            referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.V](true, false));
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
          referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.V](word, false, true));
        } else {
          el.textContent = 'tables unavailable';
        }
        return;
      }

      // suffix only
      else if (!hasPrefix && hasSuffix) {
        if (wordClass === IDS.WORDS.V) {
          el.textContent = 'verb prefix table';
          referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.V](word, true, false));
        } else {
          el.textContent = 'tables unavailable';
        }
      }

      // no affixes
      else if (!hasPrefix && !hasSuffix) {
        switch (wordClass) {
          case IDS.WORDS.N:
            el.textContent = 'noun tables';
            referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.N]());
            break;

          case IDS.WORDS.V:
            el.textContent = 'verb tables';
            referenceMap.functions.misc.toggleLoad(() => referenceMap.functions.tables[IDS.WORDS.V](word));
            break;

          default:
            el.textContent = 'tables unavailable';
        }
      }

    },
    verb: (isPrefix, word, wrapper) => {
      const affixStateMap = {
        true: ['Prefix',],// ⟅(^‿^)⟆ - Shelf the elf
        false: ['Suffix', DICTIONARY[IDS.WORDS.V].SUFFIXES.MAP]
      } // ⟅(^‿^)⟆ - Shelf the elf

      function affixHandlerGenders(isPrefix, word, person, number, hasBorder = false) {
        let string = "";
        for (const gender of Object.values(IDS.GENDERS)) {
          string += `<td${hasBorder ? " style = 'border-bottom: 1px solid var(--border)' " : ''} class="fontable" data-font-state="false">${affixHandler(isPrefix, word, person, number, gender)}</td>\n`;
        }
        return string;
      }

      function affixHandler(isPrefix, word, person, number, gender) {// ⟅(^‿^)⟆ - Shelf the elf
        return isPrefix
          ? CHARACTERS.entriesToText(AFFIXES.connectSplit(DICTIONARY[IDS.WORDS.V].PREFIXES.MAP[person][number][gender], word, '')[0])
          : DICTIONARY[IDS.WORDS.V].SUFFIXES.MAP[person][number][gender];
      }

      const html = `
        <table id="Verb-Table-${isPrefix ? 'Prefix' : 'Suffix'}" style="margin-top: 10px;">
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
    noun: ({ declension, mood, wrapper, keyword, stem = keyword, dicEntry = {}/*for MD*/ }) => {
      const table = document.createElement('table');

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
      const entry = Object.values(dicEntry).length > 0 ? dicEntry : DICTIONARY[IDS.WORDS.N].MAP[stem];
      //console.log({ entry, dicEntry })
      for (const [gender, def] of Object.entries(entry.genders)) {
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
          td.classList.add('fontable');
          td.dataset.fontState = false;
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
      //console.log(keyword, stem)
      htmlEditing.tables.populate(keyword, table);
    },
    adjective: (declension, mood, wrapper, keyword, stem = keyword) => {
      const table = document.createElement('table');

      table.id = `Adjective-Table-${mood}`;
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
      for (const gender of Object.values(IDS.GENDERS)) {
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
          td.classList.add('fontable');
          td.dataset.fontState = false;
          //inner
          for (const [gndr, array] of Object.entries(DICTIONARY[IDS.WORDS.ADJ].SUFFIXES.MAP[mood])) {
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

      htmlEditing.tables.populate(keyword, table);
    },
    determiner(wrapper, keyword) {
      const map = DICTIONARY[IDS.WORDS.DET].SUFFIXES.MAP;
      const html = `
        <div style="margin-top:30px">
            <table id="Determiner-Table">
                <thead>
                    <tr>
                        <th class="infoCollum">Genders</th>
                        <th>Forms</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Exalted</th>
                        <td class="fontable" data-font-state="false">${map.Exalted}</td>
                    </tr>
                    <tr>
                        <th>Rational</th>
                        <td class="fontable" data-font-state="false">${map.Rational}</td>
                    </tr>
                    <tr>
                        <th>Monstrous</th>
                        <td class="fontable" data-font-state="false">${map.Monstrous}</td>
                    </tr>
                    <tr>
                        <th>Irrational</th>
                        <td class="fontable" data-font-state="false" style="border-bottom: black solid 1px">${map.Irrational}</td>
                    </tr>
                    <tr>
                        <th>Magical</th>
                        <td class="fontable" data-font-state="false">${map.Magical}</td>
                    </tr>
                    <tr>
                        <th>Mundane</th>
                        <td class="fontable" data-font-state="false">${map.Mundane}</td>
                    </tr>
                    <tr>
                        <th>Abstract</th>
                        <td class="fontable" data-font-state="false">${map.Abstract}</td>
                    </tr>
                </tbody>
            </table>
        </div>
      `;
      htmlEditing.createDivById('', wrapper, html);
      htmlEditing.tables.populate(keyword, wrapper);
    },
    verbForms: (formArr, wrapper) => {
      if (!formArr.length > 0) { console.warn('err'); return }
      const html = `
      <table>
        <thead>
          <tr>
            <th style="width: 150px;"></th>
            <th>${IDS.TENSE.NP}</th>
            <th>${IDS.TENSE.P}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>${IDS.ASPECT.E}</th>
            <td style="cursor: pointer; user-select:none" class="verbForms fontable" data-font-state="false">${formArr[0]}</td>
            <td style="cursor: pointer; user-select:none" class="verbForms fontable" data-font-state="false">${formArr[1]}</td>
          </tr>
          <tr>
            <th>${IDS.ASPECT.G}</th>
            <td style="cursor: pointer; user-select:none" class="verbForms fontable" data-font-state="false">${formArr[2]}</td>
            <td style="cursor: pointer; user-select:none" class="verbForms fontable" data-font-state="false">${formArr[3]}</td>
          </tr>
        </tbody>
      </table>`;
      const div = document.createElement('div');
      div.innerHTML = html;
      wrapper.appendChild(div);
    },
    adjForms: (formArr, wrapper) => {
      if (!formArr.length > 0) { console.warn('err'); return }
      const html = `
      <table style="margin-bottom:5px;">
        <thead>
          <tr>
            <th style="width: 150px;">${IDS.FORMS.R}</th>
            <th>${IDS.FORMS.E}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="cursor: pointer; user-select:none" class="adjForms fontable" data-font-state="false">${formArr[0]}</td>
            <td style="cursor: pointer; user-select:none" class="adjForms fontable" data-font-state="false">${formArr[1]}</td>
          </tr>
        </tbody>
      </table>`;
      const div = document.createElement('div');
      div.innerHTML = html;
      wrapper.appendChild(div);
    },
    corTable: (wrapper) => {
      const value = CORRELATIVES.MAP

      // Order of genders as they appear in your table
      const GENDERS = [
        IDS.GENDER_GROUPS.ANIM,
        IDS.GENDER_GROUPS.INANIM,
        IDS.GENDERS.E,
        IDS.GENDERS.R,
        IDS.GENDERS.MON,
        IDS.GENDERS.I,
        IDS.GENDERS.MAG,
        IDS.GENDERS.MUN,
        IDS.GENDERS.A
      ];

      // Correlative types in order
      const TYPES = [
        IDS.COR_TYPES.INT,
        IDS.COR_TYPES.R,
        IDS.COR_TYPES.COR,
        IDS.COR_TYPES.PDEM,
        IDS.COR_TYPES.DDEM
      ];

      // Cases in order
      const CASES = [
        IDS.CASE.S,
        IDS.CASE.O
      ];

      function generateCaseRow(type, caseId) {
        const isOblique = caseId === IDS.CASE.O;
        let border = isOblique ? `style="border-bottom:black solid 1px"` : "";

        return `
          <th>${caseId}</th>
          ${GENDERS.map((g, index) => {
          // RULE:
          // First 2 genders (ANIM, INANIM) do NOT have values
          // for the last 3 correlative types (COR, PDEM, DDEM)
          const isFirstTwoGenders = index < 2;
          const isUnavailableType =
            type === IDS.COR_TYPES.PDEM ||
            type === IDS.COR_TYPES.DDEM;

          const content =
            isFirstTwoGenders && isUnavailableType
              ? "..."
              : value[g]?.[type]?.[caseId] ?? "...";

          if (type === IDS.COR_TYPES.DDEM) border = ""; // no border on last row
          return `<td ${border}>${content}</td>`;
        }).join("")}
        `;
      }

      // Helper: generate the 2-row block for each correlative type
      function generateTypeBlock(type) {
        return `
          <tr>
            <th rowspan="2" style="width:calc(2 * (100% / 12))">${type}</th>
            ${generateCaseRow(type, CASES[0])}
          </tr>
          <tr>
            ${generateCaseRow(type, CASES[1])}
          </tr>
        `;
      }
      // Final render
      wrapper.innerHTML = `
        <table class="exampleTable">
          <thead>
            <tr>
              <th colspan="2">Correlatives</th>
              <th style="width: calc(100% / 12)">animates</th>
              <th style="width: calc(100% / 12)">inanimates</th>
              <th style="width: calc(100% / 12)">e.</th>
              <th style="width: calc(100% / 12)">r.</th>
              <th style="width: calc(100% / 12)">mon.</th>
              <th style="width: calc(100% / 12)">i.</th>
              <th style="width: calc(100% / 12)">mag.</th>
              <th style="width: calc(100% / 12)">mun.</th>
              <th style="width: calc(100% / 12)">a.</th>
            </tr>
          </thead>
          <tbody>
            ${TYPES.map(type => generateTypeBlock(type)).join("")}
          </tbody>
        </table>
      `;
    },
    proNTable: (wrapper) => {

      const value = PRONOUNS.MAP;

      // Ordered genders
      const GENDERS = [
        IDS.GENDERS.E,
        IDS.GENDERS.R,
        IDS.GENDERS.MON,
        IDS.GENDERS.I,
        IDS.GENDERS.MAG,
        IDS.GENDERS.MUN,
        IDS.GENDERS.A
      ];

      // Cases
      const CASES = [IDS.CASE.S, IDS.CASE.O];

      // Numbers
      const NUMBERS = [IDS.NUMBERS.S, IDS.NUMBERS.D, IDS.NUMBERS.P];

      // Persons
      const PERSON = [1, 2, 3];

      // Genders that DO NOT have dual (D)
      const GENDERS_WITHOUT_D = new Set([
        IDS.GENDERS.MAG,
        IDS.GENDERS.MUN,
        IDS.GENDERS.A
      ]);

      // Return correct number list per gender
      function numbersForGender(gender) {
        return GENDERS_WITHOUT_D.has(gender)
          ? [IDS.NUMBERS.S, IDS.NUMBERS.P] // no D
          : [IDS.NUMBERS.S, IDS.NUMBERS.D, IDS.NUMBERS.P];
      }

      // Build header cells
      function headerCells(gender) {
        const nums = numbersForGender(gender);

        if (nums.length === 2) {
          return `
      <th>${nums[0]}</th>
      <th colspan="2">${nums[1]}</th>
    `;
        }

        return nums.map(n => `<th>${n}</th>`).join("");
      }

      // Build row cells for S/O cases
      function rowCells(Case, person, gender) {
        const nums = numbersForGender(gender);

        const border =
          Case === IDS.CASE.O && person !== 3
            ? `style="border-bottom: 1px solid black;"`
            : "";

        if (nums.length === 2) {
          // S, P (P spans 2)
          return `
      <td ${border}>${value[gender][nums[0]][person][Case]}</td>
      <td ${border} colspan="2">${value[gender][nums[1]][person][Case]}</td>
    `;
        }

        // S, D, P
        return nums
          .map(n => `<td ${border}>${value[gender][n][person][Case]}</td>`)
          .join("");
      }

      // Build the 2-row block for each person
      function constructBlock(person, gender) {
        return `
    <tr>
      <th rowspan="2">${person}. Person</th>
      <th>${CASES[0]}</th>
      ${rowCells(IDS.CASE.S, person, gender)}
    </tr>
    <tr>
      <th>${CASES[1]}</th>
      ${rowCells(IDS.CASE.O, person, gender)}
    </tr>
  `;
      }

      // Append parsed <tr> nodes
      function appendBlock(tbody, html) {
        const temp = document.createElement("tbody");
        temp.innerHTML = html.trim();
        for (const tr of temp.querySelectorAll("tr")) {
          tbody.appendChild(tr);
        }
      }

      // MAIN RENDER LOOP
      for (const gender of GENDERS) {
        const div = document.createElement("div");
        div.style.flex = "0 0 calc(50% - 1rem)";

        div.innerHTML = `
    <table class="exampleTable">
    <colgroup>
      <col style="width:20%">
      <col style="width:20%">
      <col style="width:20%">
      <col style="width:20%">
      <col style="width:20%">
    </colgroup>
      <thead>
        <tr>
          <th colspan="2">${gender}</th>
          ${headerCells(gender)}
        </tr>
      </thead>
      <tbody id="PersonalPronoun${gender}"></tbody>
    </table>
  `;

        const tbody = div.querySelector(`#PersonalPronoun${gender}`);

        for (const person of PERSON) {
          appendBlock(tbody, constructBlock(person, gender));
        }

        wrapper.appendChild(div);
      }

    },
    detTable: (wrappers) => {

      const value = DICTIONARY[IDS.WORDS.DET].IRREGULARS.MAP;
      console.log(value)
      htmlEditing.insertTr(wrappers[0], `
        <th colspan="2">${IDS.DET_TYPES.NA}</th>
        <td style="border-bottom:solid 1px black" colspan="7">${value[IDS.DET_TYPES.NA].text}</td>  
      `);

      const GENDERS = [
        IDS.GENDERS.E,
        IDS.GENDERS.R,
        IDS.GENDERS.MON,
        IDS.GENDERS.I,
        IDS.GENDERS.MAG,
        IDS.GENDERS.MUN,
        IDS.GENDERS.A
      ];

      const TYPES = [
        IDS.DET_TYPES.DA,
        IDS.DET_TYPES.PDEM,
        IDS.DET_TYPES.DDEM
      ];

      function tdsLogic(type) {
        return [
          GENDERS.map(g => `<td>${value[g][type][IDS.NUMBERS.S].text}</td>`).join(""),
          GENDERS.map(g => `<td style="border-bottom:solid 1px black">${value[g][type][IDS.NUMBERS.P].text}</td>`).join("")
        ];
      }
      function insertBlock(type) {
        const tdsArr = tdsLogic(type);
        return `
          <tr>
            <th rowspan="2">${type}</th>
            <th>${IDS.NUMBERS.S}</th>
            ${tdsArr[0]}
          </tr>
          <tr>
            <th>${IDS.NUMBERS.P}</th>
            ${tdsArr[1]}
          </tr>
        `;
      }

      // Append parsed <tr> nodes
      function appendBlock(tbody, html) {
        const temp = document.createElement("tbody");
        temp.innerHTML = html.trim();
        for (const tr of temp.querySelectorAll("tr")) {
          tbody.appendChild(tr);
        }
      }
      for (const type of TYPES) {
        appendBlock(wrappers[0], insertBlock(type))
      }

      function regularTds() {
        return Object.values(DICTIONARY[IDS.WORDS.DET].SUFFIXES.MAP).map(v => `<td>${v}</td>`).join("");
      }
      htmlEditing.insertTr(wrappers[1], `
    <th colspan="2">Regular Suffixes</th>
    ${regularTds()} 
  `);
    }
  },
  affixesStr: (affixesObject) => {
    const affixes = {
      prefix: affixesObject.prefix ? affixesObject.prefix : null,
      suffix: affixesObject.suffix ? affixesObject.suffix : null,
      preposition: affixesObject.preposition ? affixesObject.preposition : null,
      particle: affixesObject.particle ? affixesObject.particle : null
    }

    const values = [
      affixes?.preposition?.preposition || 'ø',
      affixes?.particle?.find(p => p?.state === 'prefix')?.particle || 'ø',
      affixes?.prefix?.prefix || 'ø',
      affixes?.particle?.find(p => p?.state === 'suffix')?.particle || 'ø',
      affixes?.suffix?.suffix || 'ø'
    ]

    const rendered = values.map(value => value || 'ø');
    const titleText = {
      title: `preposition: ${values[0]}\nparticle: ${values[1]}\nprefix: ${values[2]}\nparticle: ${values[3]}\nsuffix: ${values[4]}`,
      text: `${rendered.join(' | ')} | `
    }

    return {
      text: titleText.text,
      html: `<span  style="cursor: help; width: 100%; display: block;" title="${titleText.title}">${titleText.text}</span>`,
      values
    };
  },
  pathStr: (affixesObject, wordclass, verbForms = [], adjForms = []) => {
    const { prefix, suffix, preposition, particle } = affixesObject;
    const tempMap = {
      functions: {
        title: (wordclass, path) => {
          let title = '';
          switch (wordclass) {
            case IDS.WORDS.N:
              title = `case: ${path[0] || 'ø'}\ngender: ${path[1] || 'ø'}\nnumber: ${path[2] || 'ø'}\ndeclension: ${path[3] || 'ø'}`;
              break;
            case IDS.WORDS.ADJ:
              title = `case: ${path[0] || 'ø'}\ngender: ${path[1] || 'ø'}\nnumber: ${path[2] || 'ø'}\ndeclension: ${path[3] || 'ø'}\nform: ${path[4] || 'ø'}`;
              break;
            case IDS.WORDS.AUX:
              title = `person: ${path[0] || 'ø'}\nnumber: ${path[1] || 'ø'}\ngender: ${path[2] || 'ø'}`;
              break;
            case IDS.WORDS.V:
              title = `person: ${path[0] || 'ø'}\nnumber: ${path[1] || 'ø'}\ngender: ${path[2] || 'ø'}\naspect: ${path[3] || 'ø'}\ntense: ${path[4] || 'ø'}`;
              break;
          }
          return title;
        }
      },
      paths: {
        prefix: prefix?.paths || null,
        suffix: suffix?.paths || null,
        preposition: preposition?.paths || 'ø',
        particle: particle
          ? Object.fromEntries(particle.map(({ state, paths }) => [state, paths]))
          : null
      },
      results: []
    }
    //console.log({ verbForms })
    for (const prefix1 of tempMap.paths.prefix || [[]]) {
      for (const suffix1 of tempMap.paths.suffix || [[]]) {
        const tempStrs = {
          preposition: tempMap.paths.preposition,
          particlePrefix: tempMap.paths.particle?.prefix || 'ø',
          prefix: (prefix1.length > 0 ? (prefix1.join(', ') + ', ' + verbForms.join(', ')) : 'ø').replace(/(?:,\s*)+$/, ''),
          particleSuffix: tempMap.paths.particle?.suffix || 'ø',
          suffix: (suffix1.length > 0 ? ((suffix1.join(', ') + ', ' + verbForms.join(', ')).replace(/(?:,\s*)+$/, '') + ', ' + adjForms.join(', ')) : 'ø').replace(/(?:,\s*)+$/, '')//regex removes trailing commas if they're there
        }

        const title = Object.entries(tempStrs)
          .map(([k, v]) => `${k.startsWith('particle') ? 'particle' : k}: ${v}`)
          .join('\n');

        const text = Object.values(tempStrs).join(' | ');

        const html = text
          .split(' | ')
          .map((part, i) => {
            if (i === 2 && prefix) return `<span style="cursor: help;" title="${tempMap.functions.title(wordclass, prefix1.concat(verbForms).concat(adjForms))}">${part}</span>`;
            if (i === 4 && suffix) return `<span style="cursor: help;" title="${tempMap.functions.title(wordclass, suffix1.concat(verbForms).concat(adjForms))}">${part}</span>`;
            return part;
          })
          .join(' | ');

        tempMap.results.push({
          text,
          html: `<span style="cursor: help; width: 100%; display: block;" title="${title}">${html}</span>`
        });
      }
    }
    return tempMap.results;
  },
  transcribe: (table) => {
    if (!table) return;
    Boolean(localStorage.getItem('fontState')) ? null : localStorage.setItem('fontState', false);
    const els = table.getElementsByClassName('fontable');

    function flip(el) {
      const prevText = el.textContent.split(' ');
      const state = prevText.some(entry => CHARACTERS.textToEntriesByGlyph(entry).length > 0);
      //const state = localStorage.getItem('fontState') === "true";
      const divs = [document.createElement('div'), document.createElement('div')];
      //console.log({ state, prevText })

      divs[0].textContent = dictionaryBased.transcribe(prevText[0], state);
      divs[1].textContent = ' ' + prevText.slice(1).join(' ');

      divs.forEach(div => {
        Object.assign(div.style, { display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' });
      });

      el.innerHTML = '';
      el.append(...divs);

      if (!state) {
        el.style.textAlign = 'center';
        Object.assign(divs[0].style, { fontFamily: 'Draconic', fontSize: '35px' });
      }
    }
    for (const el of els) {
      const state = el.dataset.fontState;
      const willFlip = state === localStorage.getItem('fontState')
      if (willFlip) {
        flip(el);
        el.dataset.fontState = String(el.dataset.fontState !== 'true');
      }
    }
  }
}

export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}

export const searching = {
  search: ({ word = false, input = false, button }) => {
    if (!globalThis.DICTIONARY?.ALL_WORDS?.MAP) {
      console.warn('Dictionary not loaded yet.');
      return;
    }

    const initObj = {
      matchType: 3, //asume its type3, if its not then we change it - type3 detection is if(matchType === 3).
      keyword: word
        ? word.trim().toLowerCase()
        : input && input.value
          ? input.value.trim().toLowerCase()
          : '',
      results: {
        matchtype1: [],
        matchtype2: {},
        matchtype3: []
      }
    }

    if (input && input.value.trim() !== '') { //clear searchFLD
      input.value = '';
      input.blur();
    }
    const typeMap = {
      irregulars: {
        correlative: irregulars.correlative(initObj.keyword) || [],
        determiner: irregulars.determiner(initObj.keyword) || [],
        lur: irregulars.lur(initObj.keyword) || [],
        pronoun: irregulars.pronoun(initObj.keyword) || []
      },
      type2: {
        adjSuffix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.ADJ].SUFFIXES.MATCHES, false) || [],
        auxPrefix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.V].PREFIXES.MATCHES, true) || [],
        detSuffix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.DET].SUFFIXES.MATCHES, false) || [],
        nounSuffix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.N].SUFFIXES.MATCHES, false) || [],
        partPrefix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.PART].MAP, true) || [],
        partSuffix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.PART].MAP, false) || [],
        ppPrefix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.PP].MAP, true) || [],
        verbPrefix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.V].PREFIXES.MATCHES, true) || [],
        verbSuffix: matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.V].SUFFIXES.MATCHES, false) || []
      }
    }

    initObj.results.matchtype3 = typeMap.irregulars;

    if (DICTIONARY.ALL_WORDS.MAP[initObj.keyword]?.available?.length > 0 || Object.values(searching.isVForm(initObj.keyword)).length > 0 || Object.values(searching.isElative(initObj.keyword)).length > 0) searching.types.matchtype1(initObj)// type 1
    else if (Object.values(typeMap.type2).some(matches => matches.length > 0)) searching.types.matchtype2(initObj, typeMap);//type 2

    console.log({ typeMap, initObj });//make it such, that this part of the search function doesnt create or manipulate ANY html - it just evaluates which results are available based on the input string.

    sessionStorage.setItem('initObj', JSON.stringify(initObj));

    searching.redirect(initObj);
  },
  types: {//make each type a seperate entry in the export?
    matchtype1: (initObj) => {
      initObj.matchType = 1;
      console.log('-----type1-----');

      if (Object.values(searching.isVForm(initObj.keyword)).length > 0) { // verb forms checker
        initObj.results.matchtype1.push(searching.isVForm(initObj.keyword));
      }
      if (Object.values(searching.isElative(initObj.keyword)).length > 0) { // elative checker
        initObj.results.matchtype1.push(searching.isElative(initObj.keyword));
      }
      for (const entry of searching.isMD(initObj.keyword)) initObj.results.matchtype1.push(entry);
      if (DICTIONARY[IDS.WORDS.N].MAP[initObj.keyword]?.type === IDS.OTHER.MD) {
        for (const value of Object.values(DICTIONARY[IDS.WORDS.N].MAP[initObj.keyword].values)) {
          initObj.results.matchtype1.push(value);
        }
      }


      for (const wordclass of Object.values(IDS.WORDS)) {
        if ([IDS.WORDS.ADJ, IDS.WORDS.ADV, IDS.WORDS.V].includes(wordclass)) continue;

        const isMD = DICTIONARY[IDS.WORDS.N]?.MAP[initObj.keyword] ? Object.keys(DICTIONARY[IDS.WORDS.N]?.MAP[initObj.keyword]) : [];
        if (isMD.includes('values')) continue;
        DICTIONARY[wordclass]?.MAP?.[initObj.keyword]//'thox' //'axa'
          ? initObj.results.matchtype1.push(DICTIONARY[wordclass]?.MAP?.[initObj.keyword])
          : null//console.log('err for', wordclass)
      }
      console.log(initObj);
    },
    matchtype2: (initObj, typeMap) => {
      console.log('-----type2-----');
      initObj.matchType = 2;
      const checkerMap = {
        'partSuffix-...': matchtype2.declensionFinder(typeMap.type2.partSuffix, false),
        'partPrefix': matchtype2.declensionFinder(typeMap.type2.partPrefix, true),
        'nounSuffix-...': matchtype2.declensionFinder(typeMap.type2.nounSuffix, true),
        'ppPrefix-...': matchtype2.declensionFinder(typeMap.type2.ppPrefix, true),
        'verbSuffix': matchtype2.declensionFinder(typeMap.type2.verbSuffix, false),
        'verbPrefix-...': matchtype2.declensionFinder(typeMap.type2.verbPrefix, true),
        'adjSuffix-...': matchtype2.declensionFinder(typeMap.type2.adjSuffix, false),
        'detSuffix': matchtype2.declensionFinder(typeMap.type2.detSuffix, false)
      }
      initObj.results.matchtype2 = matchtype2.sortByEntry(matchtype2.flatten(checkerMap));

      console.log({ checkerMap, initObj });
    },
    matchtype3: () => { }
  },
  setup: (input, button, select) => {

    function event(isDraconic, isEnglish) {
      if (isDraconic) searching.search({ input });
      else if (isEnglish) {
        sessionStorage.setItem('initObj', JSON.stringify({
          searched: input.value
        }));
        window.location.href = "/pages/dictionary/results/matchtype-4.html";
      } else console.warn('err');
    }


    button.addEventListener('click', () => event(!select || select.value === 'Draconic', select?.value === 'English'));
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        event(!select || select.value === 'Draconic', select?.value === 'English');
      }
    });

    //for ribbon
    const transcribeBtn = document.getElementById('transcribeBtn');
    if (!transcribeBtn) return;
    transcribeBtn.addEventListener('click', () => {
      const current = localStorage.getItem('fontState') === 'true';
      localStorage.setItem('fontState', (!current).toString());
      htmlEditing.transcribe(document);
    });
  },
  redirect: (initObj) => {
    initObj.results.matchtype1.length > 0
      ? window.location.href = '/pages/dictionary/results/matchtype-1.html'
      : Object.values(initObj.results.matchtype2).length > 0
        ? window.location.href = '/pages/dictionary/results/matchtype-2.html'
        : Object.values(initObj.results.matchtype3).some(p => p.length > 0)
          ? window.location.href = '/pages/dictionary/results/matchtype-3.html'
          : console.warn('err')
  },
  isVForm: (word) => {
    for (const result of DICTIONARY.fuzzyFetchByWord(word)) {
      if (result.type !== IDS.WORDS.V) continue;
      if (result.text === 'lur') continue;
      const forms = result.splitForms() ?? [];
      if (forms[0] === word) return { result, form: [IDS.ASPECT.E, IDS.TENSE.NP] }
      if (forms[1] === word) return { result, form: [IDS.ASPECT.E, IDS.TENSE.P] }
      if (forms[2] === word) return { result, form: [IDS.ASPECT.G, IDS.TENSE.NP] }
      if (forms[3] === word) return { result, form: [IDS.ASPECT.G, IDS.TENSE.P] }
    }
    return {};
  },
  isMD: (word) => {
    const results = []
    if (DICTIONARY.ALL_WORDS.MAP[word]?.type === IDS.OTHER.MD) {
      for (const entry of Object.values(DICTIONARY.ALL_WORDS.MAP[word].values)) {
        results.push(entry);
      }
    }
    return results || []
  },//move vForm and MD into dictioanrybased
  isElative: (word) => {
    for (const result of DICTIONARY.fuzzyFetchByWord(word)) {
      if (!([IDS.WORDS.ADJ, IDS.WORDS.ADV].includes(result.type))) continue;
      const forms = result.splitForms() ?? [];
      //console.log(forms);
      if (forms[0] === word) return { result, form: [IDS.FORMS.R] }
      if (forms[1] === word) return { result, form: [IDS.FORMS.E] }
    }
    return {};
  },
  manualNavigationSetup: (initObj, currentType) => {
    const ths = document.getElementsByClassName('typenavigation');
    //console.log(ths)
    const results = initObj.results
    if (results.matchtype1.length > 0 && currentType != 1) ths[0].style.display = 'block';
    if (Object.values(results.matchtype2).length > 0 && currentType != 2) ths[1].style.display = 'block';
    if (Object.values(results.matchtype3).some(p => p.length > 0) && currentType != 3) ths[2].style.display = 'block';
  }
}