export class Store<V> {
  // eslint-disable-next-line no-useless-constructor
  constructor (private db: {
    [key: string]: V;
  } = {}) { }

  set (key: string, value: V): void {
    this.db[key] = value
  }

  has (key: string) {
    return Object.keys(this.db).includes(key)
  }

  get (key: string): V {
    if (!this.has(key)) {
      throw new Error(`${key} is not defined`)
    }
    return this.db[key]
  }
}
