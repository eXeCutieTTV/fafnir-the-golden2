console.log('hello world');
import * as oop from '/pages/dictionary/dictionary-oop.js';
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";

globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);

  oop.htmlEditing.tables.glyphTable(document.getElementById('alphabet'));
});