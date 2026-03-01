let examples = [];
const ul = document.querySelector('.suggestions');
const searchFLD = document.getElementById('search_field');
let highlighted = -1;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDictionary(timeoutMs = 15000) {
  const start = Date.now();
  while (!(globalThis.DICTIONARY && DICTIONARY.ALL_WORDS && DICTIONARY.ALL_WORDS.MAP)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('DICTIONARY did not load in time');
    }
    await delay(50);
  }
}

function showSuggestions(items) {
  ul.innerHTML = '';
  if (!items.length) {
    ul.hidden = true;
    return;
  }
  let highlight_index = 0;
  for (const word of items) {
    const li = document.createElement('li');
    li.dataset['index'] = highlight_index;
    highlight_index++
    li.textContent = word;
    li.tabIndex = -1;
    li.setAttribute('role', 'option');
    li.style.padding = '6px 8px';
    li.style.cursor = 'pointer';
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectSuggestion(word);
    });
    li.addEventListener('mouseenter', () => {
      highlighted = Number(li.dataset.index);
      const allItems = ul.querySelectorAll('li');
      updateHighlight(allItems);
    });
    li.addEventListener('mouseleave', () => {
      const allItems = ul.querySelectorAll('li');
      updateHighlight(allItems);
    });
    ul.appendChild(li);
  }
  highlighted = -1;
  ul.hidden = false;
}

function selectSuggestion(text) {
  searchFLD.value = text;
  ul.hidden = true;
  searchFLD.focus();
}

function filterExamples(q) {
  if (!q) return examples.slice(0, 5000);
  const low = q.toLowerCase();
  return examples.filter((w) => w.toLowerCase().includes(low)).slice(0, 5000);
}

function updateHighlight(items) {
  items.forEach((li, i) => {
    if (i === highlighted) {
      li.style.background = 'var(--table1)';
      li.style.color = 'var(--text)';
      li.scrollIntoView({ block: 'nearest' });
    } else {
      li.style.background = '';
      li.style.color = '';
    }
  });
}

async function initSuggestions() {
  if (!ul || !searchFLD) return;

  await waitForDictionary();
  examples = Object.keys(DICTIONARY.ALL_WORDS.MAP);
  console.log('amount of words imported into autocorrect:', examples.length);

  searchFLD.addEventListener('input', () => {
    const list = filterExamples(searchFLD.value);
    showSuggestions(list);
  });

  searchFLD.addEventListener('keydown', (e) => {
    const items = ul.querySelectorAll('li');
    if (ul.hidden) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlighted = Math.min(highlighted + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlighted = Math.max(highlighted - 1, 0);
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      if (highlighted >= 0 && items[highlighted]) {
        e.preventDefault();
        selectSuggestion(items[highlighted].textContent);
      }
    } else if (e.key === 'Escape') {
      ul.hidden = true;
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.composedPath().includes(searchFLD) && !e.composedPath().includes(ul)) {
      ul.hidden = true;
    }
  });
}

initSuggestions().catch((err) => {
  console.error('Failed to initialize suggestions:', err);
});
