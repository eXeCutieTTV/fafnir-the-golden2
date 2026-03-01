class Utils {
  constructor() {
    this.wrap = {}
  }

  add(name, entry) {
    if (this.wrap[name]) alert(`${this.wrap[name]} is being overwritten`)
    this.wrap[name] = entry;
  }

  addNested(obj, target = this.wrap) {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === "function") {
        target[key] = value;

      } else if (typeof value === "object" && value !== null) {
        target[key] = {}; this.addNested(value, target[key]);
      }
    }
  }

  view(name) {
    if (!this.wrap[name]) throw new Error(`Function "${name}" does not exist`);
    return this.wrap[name];
  }

  [Symbol.iterator]() {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(name => typeof this[name] === "function" && name !== "constructor");
    let index = 0;
    return {
      next: () => {
        if (index < methods.length) {
          const name = methods[index++];
          return {
            value: [
              name,
              this[name]
            ],
            done: false
          };
        }
        return {
          done: true
        };
      }
    };
  }

  help() {
    const temp = {};
    for (const [key, value] of this) temp[key] = value;
    return temp;
  }
}

class Functions extends Utils {
  constructor() {
    super();
  }

  run(path, ...args) {
    const parts = path.split(".");
    let current = this.wrap;
    for (const part of parts) {
      current = current[part];
      if (!current) throw new Error(`Function "${path}" not found`);
    }
    if (typeof current !== "function") throw new Error(`"${path}" is not a function`)
    return current(...args);
  }

  list() {

  }
}
class Regex extends Utils {
  constructor() {
    super();
  }
}
export const helperFunctions = new Functions();
//console.log(Utils)
console.log(helperFunctions)

helperFunctions.add("test", (word) => console.log(word));
helperFunctions.addNested({
  math: {
    add: (a, b) => a + b,
    mul: (a, b) => a * b
  },
  text: {
    upper: (str) => str.toUpperCase(),
    lower: (str) => str.toLowerCase()
  }
});
helperFunctions.addNested({
  matchtype2: {
    affixChecker: (word, map, isPrefix = false) => {
      let tempArray = [];
      //decide if applied or unapplied suffix is used
      function appliedOrUnapplied(applied, unapplied, affixType) {
        let affixUsed = '';

        if (affixType === 'suffix') {
          if (applied && unapplied) {
            if (word.endsWith(applied)) {
              affixUsed = applied;
            }
            else if (word.endsWith(unapplied)) {
              affixUsed = unapplied;
            }
            else {
              return null;
            }
          }
          else if (applied) {
            affixUsed = applied;
          }
          else if (unapplied) {
            affixUsed = unapplied;
          }
          if (!affixUsed) {
            return null;
          }
          else {
            return affixUsed;
          }
        } else if (affixType === 'prefix') {
          if (applied && unapplied) {
            if (word.startsWith(applied)) {
              affixUsed = applied;
            }
            else if (word.startsWith(unapplied)) {
              affixUsed = unapplied;
            }
            else {
              return null;
            }
          }
          else if (applied) {
            affixUsed = applied;
          }
          else if (unapplied) {
            affixUsed = unapplied;
          }
          if (!affixUsed) {
            return null;
          }
          else {
            return affixUsed;
          }
        }
      }

      let arrayPrefixes;
      let arraySuffixes;
      let wordclass;
      if (isPrefix) {
        arrayPrefixes = AFFIXES.PREFIXES.match(word, map, true);
        wordclass = arrayPrefixes === null ? 'error' : arrayPrefixes[0].type; //when i search. look at l259 in other js. it does each thing. but it dies
        //console.log(arrayPrefixes);
      } else {// ⟅(^‿^)⟆ - Shelf the elf
        arraySuffixes = AFFIXES.SUFFIXES.match(word, map, true);
        wordclass = arraySuffixes === null ? 'error' : arraySuffixes[0].type;
        //console.log(arraySuffixes);
      }
      if (wordclass === 'error') return
      //console.log(wordclass);
      switch (wordclass) {
        case 'v':
          if (isPrefix) {
            for (const entries of arrayPrefixes) {
              const paths = entries.paths;
              const prefix = appliedOrUnapplied(entries.variants[0], entries.variants[1] || "doesn't distinguish", 'prefix');
              const { slice1: usedPrefix, slice2: stem } = helperFunctions.standard.sliceKeywordPositive(word, prefix.length);

              for (const path of paths) {
                //console.log('path |', path);
                const result = {
                  path: {
                    person: path[0],
                    number: path[1],
                    gender: path[2],
                  },
                  stem: stem,
                  prefix: prefix,
                  affixState: 'prefix',
                  wordclass: 'v',
                  short_path: helperFunctions.formatting.shorten_path('v', { number: path[1], person: path[0], gender: path[2] })
                }
                tempArray[stem] ? null : tempArray[stem] = [];
                tempArray[stem].push(result);
              }
            }
          } else {
            for (const entries of arraySuffixes) {
              const paths = entries.paths;
              const suffix = appliedOrUnapplied(entries.variants[0], entries.variants[1] || "doesn't distinguish", 'suffix');
              const { slice1: stem, slice2: usedSuffix } = helperFunctions.standard.sliceKeywordNegative(word, suffix.length);

              for (const path of paths) {
                //console.log('path |', path);
                const result = {
                  path: {
                    person: path[0],
                    number: path[1],
                    gender: path[2],
                  },
                  stem: stem,
                  suffix: suffix,
                  affixState: 'suffix',
                  wordclass: 'v',
                  short_path: helperFunctions.formatting.shorten_path('v', { number: path[1], person: path[0], gender: path[2] })
                }
                tempArray[stem] ? null : tempArray[stem] = [];
                tempArray[stem].push(result);
              }
            }
          }
          break;
        case 'n':
          for (const entries of arraySuffixes) {
            const paths = entries.paths;
            const suffix = appliedOrUnapplied(entries.variants[0], entries.variants[1] || "doesn't distinguish", 'suffix');
            const { slice1: stem, slice2: usedSuffix } = helperFunctions.standard.sliceKeywordNegative(word, suffix.length);

            for (const path of paths) {
              //console.log('path |', path);
              const result = {
                stem: stem,
                path: {
                  case: path[0],
                  gender: path[1],
                  number: path[2],
                  declension: path[3],
                },
                suffix: suffix,
                affixState: 'suffix',
                wordclass: 'n',
                short_path: helperFunctions.formatting.shorten_path('n', { declension: path[3], number: path[2], gender: path[1], Case: path[0] })
              }
              tempArray[stem] ? null : tempArray[stem] = [];
              tempArray[stem].push(result);
            }
          }
          break;
        case 'adj':
          for (const entries of arraySuffixes) {
            const paths = entries.paths;
            const suffix = appliedOrUnapplied(entries.variants[0], entries.variants[1] || "doesn't distinguish", 'suffix');
            const { slice1: stem, slice2: usedSuffix } = helperFunctions.standard.sliceKeywordNegative(word, suffix.length);

            for (const path of paths) {
              //console.log('path |', path);
              const result = {
                stem: stem,
                path: {
                  case: path[0],
                  gender: path[1],
                  number: path[2],
                  declension: path[3],
                },
                suffix: suffix,
                affixState: 'suffix',
                wordclass: 'adj',
                short_path: helperFunctions.formatting.shorten_path('adj', { declension: path[3], number: path[2], gender: path[1], Case: path[0] })
              }
              tempArray[stem] ? null : tempArray[stem] = [];
              tempArray[stem].push(result);
            }
          }
          break;
        case 'pp':
          for (const entries of Object.values(arrayPrefixes)) {
            const prefix = entries.word;
            const { slice1: usedPrefix, slice2: stem } = helperFunctions.standard.sliceKeywordPositive(word, prefix.length);

            const result = {
              stem: stem,
              prefix: prefix,
              affixState: 'prefix',
              wordclass: 'pp',
              short_path: 'pp' + "." + prefix
            }
            tempArray[stem] ? null : tempArray[stem] = [];
            tempArray[stem].push(result);
          }
          break;
        case 'part':
          if (isPrefix) {
            for (const entries of Object.values(arrayPrefixes)) {
              const prefix = entries.word;
              const { slice1: usedPrefix, slice2: stem } = helperFunctions.standard.sliceKeywordPositive(word, prefix.length);

              const result = {
                stem: stem,
                prefix: prefix,
                affixState: 'prefix',
                wordclass: 'part',
                short_path: 'part' + "." + prefix
              }
              tempArray[stem] ? null : tempArray[stem] = [];
              tempArray[stem].push(result);
            }
          } else {
            for (const entries of Object.values(arraySuffixes)) {
              const suffix = entries.word;
              const { slice1: stem, slice2: usedSuffix } = helperFunctions.standard.sliceKeywordNegative(word, suffix.length);

              const result = {
                stem: stem,
                suffix: suffix,
                affixState: 'suffix',
                wordclass: 'part',
                short_path: 'part' + "." + suffix
              }
              tempArray[stem] ? null : tempArray[stem] = [];
              tempArray[stem].push(result);
            }
          }
          break;
        case 'det':
          for (const entries of Object.values(arraySuffixes)) {
            const suffix = entries.affix;
            const paths = entries.paths;
            console.log(entries, suffix);
            const { slice1: stem, slice2: usedSuffix } = helperFunctions.standard.sliceKeywordNegative(word, suffix.length);
            for (const path of paths) {
              const result = {
                stem: stem,
                path: {
                  gender: path[0]
                },
                suffix: suffix,
                affixState: 'suffix',
                wordclass: 'det',
                short_path: helperFunctions.formatting.shorten_path('det', { gender: path[0] }),
              }
              tempArray[stem] ? null : tempArray[stem] = [];
              tempArray[stem].push(result);
            }
          }
          break;
        default: console.warn(`${wordclass} is not a valid wordclass`);
      }
      let count = 0;
      for (arr in tempArray) {
        count++;
        tempArray['arrayLength'] = count;
      }
      return tempArray;
    }
  }
});

export const helperRegex = new Regex();
helperRegex.add("isVowel", /^[iīeēæyuūoōaāúûóôáâIĪEĒÆYUŪOŌAĀÚÛÓÔÁÂ]$/);
helperRegex.add("isConsonant", /^[tkqq̇'cfdszgχhlrɾmnŋTKQQ̇'CFDSZGΧHLRɾMNŊ]$/);