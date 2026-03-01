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