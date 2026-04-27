console.log('hello world');
import * as oop from '/pages/dictionary/dictionary-oop.js';
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";

globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);

  const value = CHARACTERS.MAP;
  const rows = [
    ["toru", "c\u00E1ll", "k\u00FB", "qath", "q\u0307os", "ax"],
    ["tr\u014D", "s\u0113l", "kx\u00E6\u014B", "q\u03C7\u0113", "q\u0127\u00E1n", "q\u0307\u0127\u00F3n"],
    ["od", "\u0113z", "\u0101g", "fe", "thyn", "ll\u012B"],
    ["x\u00E6", "\u03C7y", "har", "\u03C7\u0127\u00E1th", "\u0127\u00E2", "rox"],
    ["lel", "e\u03C7", "\u00E6fu", "y\u00B4", "a\u00B4", "o\u00B4"],
    ["u\u00B4", "i\u00B4", "\u0113\u00B4", "\u0101\u00B4", "\u014D\u00B4", "\u016B\u00B4"],
    ["\u012B\u00B4", "m\u00E1", "na\u03C7", "y\u014B", "q\u0307\u0127\u00F3ll", "sele\u014B"],
    ["q\u0307em", "", "", "", "", ""]
  ];

  const renderCell = key => key ? `
      <th>${value[key].name}</th>
    ` : `
      <th></th>
    `;

  const renderGlyph = key => key ? `
      <td>${value[key].letter_glyph}</td>
    ` : `
      <td></td>
    `;

  document.getElementById('alphabet').innerHTML = `
    <table id="alphabetTable">
      ${rows.map(row => `
        <tbody class="alphabetSection">
          <tr class="alphabetLabels">
            ${row.map(renderCell).join("")}
          </tr>
          <tr class="alphabetGlyphs">
            ${row.map(renderGlyph).join("")}
          </tr>
        </tbody>
      `).join("")}
    </table>
  `;
});
