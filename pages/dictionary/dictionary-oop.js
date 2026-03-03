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
    const results = [];
    const tempMap = {

    }
    for (const entry of map) {
      switch (entry.type) {
        case IDS.WORDS.V:
          const newEntry = isPrefix
            ? matchtype2.affixChecker(entry.tempStem, DICTIONARY.VERBS.PREFIXES.MATCHES, true)
            : matchtype2.affixChecker(entry.tempStem, DICTIONARY.VERBS.SUFFIXES.MATCHES, false);
          for (const affix of newEntry) {
            if (!DICTIONARY.ALL_WORDS.MAP[affix.tempStem]) continue;

            results.push({
              raws: {
                'pre-declensionFinder()-entry': entry,
                'post-declensionFinder()-entry': newEntry
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
      }
    }

    /*
    if (affixMatch.type === IDS.OTHER.ML) {
      for (const entry of affixMatch.variants) {
        affixFinder(word, entry, isPrefix)
      }
    } else affixFinder(word, affixMatch, isPrefix);
    */
    return results;
  }
}

export const text = {
}
export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}