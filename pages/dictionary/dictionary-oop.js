export const matchtype2 = {
  affixChecker: (word, map, isPrefix = false) => {
    console.log(word, map, isPrefix);
  },
  text: {
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
}
export const regex = {
  isVowel: /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/,
  isConsonant: /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/
}