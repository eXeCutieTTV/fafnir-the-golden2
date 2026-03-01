console.log('hello world')
import * as oop from './dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";

DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  console.log(DR)

  
  console.log(oop);
  console.log(oop.helperFunctions.view("test"))
  oop.helperFunctions.run("test", 'hi')
  console.log(oop.helperFunctions.help())
  console.log(oop.helperFunctions.run("math.add", 2, 3))
  console.log(oop.helperRegex.view("isVowel"))



  console.log(DIALECTS)


  let searchBTN = document.getElementById('search_button');
  let searchFLD = document.getElementById('search_field');

  globalThis.search = function search(word = false) {
    let matchType = 3 //asume its type3, if its not then we change it - type3 detection is if(matchType === 3).
    let keyword = word
      ? word.trim().toLowerCase()
      : searchFLD && searchFLD.value
        ? searchFLD.value.trim().toLowerCase()
        : '';
    console.log('keyword |', keyword);
    //clear searchFLD
    if (searchFLD && searchFLD.value.trim() !== '') {
      searchFLD.value = '';
      searchFLD.blur();
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
});