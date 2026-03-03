export const matchtype2 = {
  affixChecker: (word, map, isPrefix = false) => {
    //console.log(word, map, isPrefix);
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
    const affixMatch = isPrefix ? AFFIXES.PREFIXES.match(word, map, true)[0]/*need [0] untill lirrox fixes it on his end*/ || 'no-matches' : AFFIXES.SUFFIXES.match(word, map, false) || 'no-matches';
    console.log('affixMatch |', affixMatch);
    if (affixMatch === 'no-matches') return;
    switch (affixMatch.type) {
      case 'v':
        console.log('verb affix match |', affixMatch);

    }
  }
}
export const text = {
  sliceKeywordNegative: (str, x) => {
    const slice1 = str.slice(0, -x);
    const slice2 = str.slice(-x);
    return { slice1, slice2 };

    // Example usage:
    //const { slice1, slice2 } = sliceKeyword("ækluu", 2);
    //console.log(slice1); // Output: ækl
    //console.log(slice2); // Output: uu
  },
  sliceKeywordPositive: (str, x) => {
    const slice1 = str.slice(0, x);
    const slice2 = str.slice(x);
    return { slice1, slice2 };

    // Example usage:
    //const { slice1, slice2 } = sliceKeyword("ækluu", 2);
    //console.log(slice1); // Output: ækl
    //console.log(slice2); // Output: uu
  }
}
export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}