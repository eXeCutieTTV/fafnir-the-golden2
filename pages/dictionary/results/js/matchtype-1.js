console.log('hello world')
import * as oop from '/pages/dictionary/dictionary-oop.js'
import { DIALECTS } from "https://draconicconlang.github.io/APIs/dialects/DialectLoader.js";
globalThis.dictionaryReady = DIALECTS.load("dr_dr").then(DR => {
  Object.assign(globalThis, DR);
  // init code

  oop.searching.setup(document.getElementById('search_field'), document.getElementById('search_button'));

  const initObj = JSON.parse(sessionStorage.getItem('initObj'));
  const verbFormsHeader = document.getElementById('verbFormsHeader');
  console.log({
    DICTIONARY,
    initObj
  });
  const state = {
    colIndex: 0
  }

  function normalizeResult(result) { return result?.form?.length > 0 ? result.result : result; }

  function isVerbLike(entry) { //bool
    return entry?.type === IDS.WORDS.V
      || Array.isArray(entry?.vforms)
      || typeof entry?.splitForms === 'function';
  }

  function getVerbFormsHtml(entry, matchedForm = []) { //html
    if (!isVerbLike(entry)) return '<td>...</td>';

    const forms = Array.isArray(entry?.vforms) && entry.vforms.length > 0
      ? entry.vforms
      : typeof entry?.splitForms === 'function'
        ? entry.splitForms().filter(Boolean)
        : [];

    const parts = [];
    if (forms.length > 0) parts.push(forms.join(' | '));
    if (matchedForm.length > 0) parts.push(`<div style="cursor: help;" title="aspect: ${matchedForm[0]}\ntense: ${matchedForm[1]}">${matchedForm.join(', ')}</div>`);

    return `<td>${parts.join('<br>') || '...'}</td>`;
  }

  const hasVerbFormsColumn = initObj.results.matchtype1 //bool
    .some(result => isVerbLike(normalizeResult(result)));

  displayMorphCol(hasVerbFormsColumn);
  function displayMorphCol(conditional) {
    if (conditional) verbFormsHeader.style.display = '';
  }

  for (const result of initObj.results.matchtype1) {
    const normalizedResult = result?.form?.length > 0 ? result : { result, form: [] };
    const entry = normalizedResult.result;

    const isADJorADV = [IDS.WORDS.ADJ, IDS.WORDS.ADV].includes(entry.type);
    displayMorphCol(isADJorADV);

    function renderRow(result) {
      console.log({ result })

      const id = `${initObj.keyword}_${result.type}_${result?.declension}`.trim();

      oop.htmlEditing.insertTr(
        document.getElementById('tableTbody'), `
      <td>${initObj.keyword} (${(result.type + ' ' + (result?.declension || '')).trim()})</td>
      <td>${result.type === IDS.WORDS.N
        ? Object.entries(result.genders)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')
        : result.definition}</td>
      <td>${result.usage_notes || '...'}</td>
      ${hasVerbFormsColumn ? getVerbFormsHtml(result, normalizedResult.form || []) : ''}
      ${isADJorADV ? `<td><div style="cursor: help;" title="form: ${normalizedResult.form.join(', ')}">${normalizedResult.form.join(', ')}</div></td>` : ''}
      <td data-defrow="true"
          data-wordclass="${result.type}"
          data-colindex="${state.colIndex++}"
          id="${id}"
          style="user-select:none; cursor: pointer;">temp</td>`
      );

      oop.htmlEditing.tables.pressableLoadTableButtons({
        el: document.getElementById(id),
        word: initObj.keyword,
        ...(result?.declension && { declension: result.declension }),
        ...(oop.searching.isMD(result.text) && { MDEntry: result })
      });
    }

    renderRow(entry);
  }
});
//verb tables include a single table, that displays forms?
