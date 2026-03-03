console.log('hello world')
import * as oop from './dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code
});

function tests() {
  console.log(oop);
  console.log(oop.helperFunctions.view("test"))
  oop.helperFunctions.run("test", 'hi')
  console.log(oop.helperFunctions.help())
  console.log(oop.helperFunctions.run("math.add", 2, 3))
  console.log(oop.helperRegex.view("isVowel"))
  console.log(DIALECTS)
} //tests();

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
    results: []
  }

  console.log('keyword |', initObj.keyword);
  if (searchFLD && searchFLD.value.trim() !== '') { //clear searchFLD
    searchFLD.value = '';
    searchFLD.blur();
    // for type2
    const type2AffixesMap = {
      verbPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.VERBS.PREFIXES.MATCHES, true) || [],
      ppPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.PREPOSITIONS.MAP, true) || [],
      verbSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.VERBS.SUFFIXES.MATCHES, false) || [],
      nounSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.NOUNS.SUFFIXES.MATCHES, false) || [],
      adjSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.ADJECTIVES.SUFFIXES.MATCHES, false) || [],
      pPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.PARTICLES.MAP, true) || [],
      pSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.PARTICLES.MAP, false) || [],
      auxPrefix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.VERBS.PREFIXES.MATCHES, true) || [],
      detSuffix: oop.matchtype2.affixChecker(initObj.keyword, DICTIONARY.DETERMINERS.SUFFIXES.MATCHES, false) || []
    }
    console.log(type2AffixesMap);
  } //make it such, that this part of the search function doesnt create or manipulate ANY html - it just evaluates which results are available based on the input string.
  if (DICTIONARY.ALL_WORDS.MAP[initObj.keyword]?.word?.length > 0) { // type 1
    initObj.matchType = 1;
    console.log('-----type1-----');
    const resultMap = DICTIONARY.ALL_WORDS.MAP[initObj.keyword];
    console.log('resultMap|', resultMap);

    const temp = ['NOUNS', 'VERBS', 'AUXILIARIES', 'ADJECTIVES', 'ADVERBS', 'DETERMINERS', 'PARTICLES', 'PREPOSITIONS', 'CONJUNCTIONS']//IDS.WORDS need conjs etc
    for (const wordclass of temp) {
      const classMap = DICTIONARY[wordclass]?.MAP;
      classMap?.[initObj.keyword]//'thox'
        ? initObj.results.push(classMap[initObj.keyword])
        : console.log('err for', wordclass)
    }
    console.log(initObj);
    //history.pushState(initObj, '', '/pages/dictionary/results/matchtype-1.html');//or use sessionStorage
    //const a = document.createElement('a');
    //a.href = '/pages/dictionary/results/matchtype-1.html';
    //a.click();
    //alert('hi')
  }
}

searchBTN.addEventListener('click', () => {
  search();
});



/*
for (const a of Object.values(DICTIONARY.VERBS.MAP)) oop.helperFunctions.run('fix', a.word)
for (const a of Object.values(DICTIONARY.ADJECTIVES.MAP)) oop.helperFunctions.run('fix', a.word, 'adj')
for (const a of Object.values(DICTIONARY.ADVERBS.MAP)) oop.helperFunctions.run('fix', a.word, 'adv')
*/
