class Env {
  constructor(parentEnv, symbols, values) {
    this.parentEnv = parentEnv;
    this.map = new Map();

    if (symbols && values) {
      symbols.forEach((s, i) => {
        this.map.set(s, values[i]);
      });
    }
  }

  set(key, value) {
    return this.map.set(key, value);
  }

  setFromObject(o) {
    Object.entries(o).forEach(([key, value]) => {
      this.map.set(key, value);
    });
  }

  get(symbol) {
    let localResult = this.map.get(symbol);

    if (localResult !== undefined) {
      return localResult;
    } else if (this.parentEnv !== undefined) {
      return this.parentEnv.get(symbol);
    } else {
      return undefined;
    }
  }
}

export { Env };
