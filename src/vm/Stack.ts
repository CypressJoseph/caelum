export default class Stack<T> {
  constructor (public items: T[] = []) {
    console.log('New stack created: ' + this.items)
  }

  get top (): T {
    return this.items[this.count]
  }

  push (value: T): void {
    this.items[this.count + 1] = value
  }

  pop (): T {
    const popped = this.items.pop()
    if (popped) { return popped }
    throw new Error('Stack was empty')
  }

  get count (): number {
    return this.items.length - 1
  }
}
