console.log('hello world')
import * as oop from './dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  console.log({
    oop,
    DIALECTS,
    DICTIONARY
  });

  oop.search({ input: document.getElementById('search_field'), button: document.getElementById('search_button') });

});

// make english vs draconic search based on a dropdown, instead of a default fallback.