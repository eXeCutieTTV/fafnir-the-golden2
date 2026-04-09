console.log('hello world')
import * as oop from './dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code
});

console.log({
  oop,
  DIALECTS
});

let searchBTN = document.getElementById('search_button');
let searchFLD = document.getElementById('search_field');

globalThis.search = function search(word = false) {
  if (!globalThis.DICTIONARY?.ALL_WORDS?.MAP) {
    console.warn('Dictionary not loaded yet.');
    return;
  }

  const initObj = {
    matchType: 3, //asume its type3, if its not then we change it - type3 detection is if(matchType === 3).
    keyword: word
      ? word.trim().toLowerCase()
      : searchFLD && searchFLD.value
        ? searchFLD.value.trim().toLowerCase()
        : '',
    results: {
      matchtype1: [],
      matchtype2: []
    }
  }

  console.log('keyword |', initObj.keyword);
  if (searchFLD && searchFLD.value.trim() !== '') { //clear searchFLD
    searchFLD.value = '';
    searchFLD.blur();
  }
  const typeMap = {
    irregulars: {
      correlative: oop.irregulars.correlative(initObj.keyword) || [],
      determiner: oop.irregulars.determiner(initObj.keyword) || [],
      lur: oop.irregulars.lur(initObj.keyword) || [],
      pronoun: oop.irregulars.pronoun(initObj.keyword) || []
    },
    type2: {
      adjSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.ADJ].SUFFIXES.MATCHES, false) || [],
      auxPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.V].PREFIXES.MATCHES, true) || [],
      detSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.DET].SUFFIXES.MATCHES, false) || [],
      nounSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.N].SUFFIXES.MATCHES, false) || [],
      partPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.PART].MAP, true) || [],
      partSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.PART].MAP, false) || [],
      ppPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.PP].MAP, true) || [],
      verbPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.V].PREFIXES.MATCHES, true) || [],
      verbSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY[IDS.WORDS.V].SUFFIXES.MATCHES, false) || []
    }
  }
  console.log('typeMap |', typeMap);//make it such, that this part of the search function doesnt create or manipulate ANY html - it just evaluates which results are available based on the input string.
  if (DICTIONARY.ALL_WORDS.MAP[initObj.keyword]?.word?.length > 0) { // type 1
    initObj.matchType = 1;
    console.log('-----type1-----');
    const resultMap = DICTIONARY.ALL_WORDS.MAP[initObj.keyword];
    console.log('resultMap|', resultMap);

    const temp = ['NOUNS', 'VERBS', 'AUXILIARIES', 'ADJECTIVES', 'ADVERBS', 'DETERMINERS', 'PARTICLES', 'PREPOSITIONS', 'CONJUNCTIONS']//IDS.WORDS need conjs etc
    for (const wordclass of temp) {
      const classMap = DICTIONARY[wordclass]?.MAP;
      classMap?.[initObj.keyword]//'thox'
        ? initObj.results.matchtype1.push(classMap[initObj.keyword])
        : console.log('err for', wordclass)
    }
    console.log(initObj);
    //history.pushState(initObj, '', '/pages/dictionary/results/matchtype-1.html');//or use sessionStorage
    //const a = document.createElement('a');
    //a.href = '/pages/dictionary/results/matchtype-1.html';
    //a.click();
    //alert('hi')
  } else if (//type 2
    Object.values(typeMap.type2).some(matches => matches.length > 0)
  ) {
    console.log('-----type2-----');
    initObj.matchType = 2;
    const checkerMap = {
      'partSuffix-...': oop.matchtype2.declensionFinder(typeMap.type2.partSuffix, false),
      'partPrefix': oop.matchtype2.declensionFinder(typeMap.type2.partPrefix, true),
      'nounSuffix-...': oop.matchtype2.declensionFinder(typeMap.type2.nounSuffix, true),
      'ppPrefix-...': oop.matchtype2.declensionFinder(typeMap.type2.ppPrefix, true),
      'verbSuffix': oop.matchtype2.declensionFinder(typeMap.type2.verbSuffix, false),
      'verbPrefix-...': oop.matchtype2.declensionFinder(typeMap.type2.verbPrefix, true),
      'adjSuffix-...': oop.matchtype2.declensionFinder(typeMap.type2.adjSuffix, false),
      'detSuffix': oop.matchtype2.declensionFinder(typeMap.type2.detSuffix, false)
    }
    console.log('checkerMap', checkerMap);
    initObj.results.matchtype2 = oop.matchtype2.sortByEntry(oop.matchtype2.flatten(checkerMap));
    console.log('initObj', initObj);
    console.log('results', initObj.results.matchtype2);
  }
  sessionStorage.setItem('initObj', JSON.stringify(initObj));
  initObj.results.matchtype1.length > 0
    ? window.location.href = './results/matchtype-1.html'
    : Object.values(initObj.results.matchtype2).length > 0
      ? window.location.href = './results/matchtype-2.html'
      : null
}

searchBTN.addEventListener('click', () => {
  search();
});
searchFLD.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    ev.preventDefault(); // prevent form submission
    search();
  }
});

// make english vs draconic search based on a dropdown, instead of a default fallback.