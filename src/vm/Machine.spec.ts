import Machine, { ANumber, ASymbol, AString } from './Machine'
import Program from '../cael-lang/cael/Program'

const noop = new Program('noop.aer')

const adds = new Program('2+2.aer', [
  { op: 'push', subject: new ANumber(2) },
  { op: 'push', subject: new ANumber(2) },
  { op: 'send', subject: new ASymbol('add'), argCount: 1 }
])
const hello = new Program('hello.aer', [
  { op: 'push', subject: new AString('hello world') },
  { op: 'load', subject: new ASymbol('Kernel') },
  { op: 'send', subject: new ASymbol('dbg'), argCount: 1 }
])
const missing = new Program('miss.aer', [
  { op: 'push', subject: new AString('hello world') },
  { op: 'load', subject: new ASymbol('Kernel') },
  { op: 'send', subject: new ASymbol('dbz'), argCount: 1 }
])

describe('Machine', () => {
  describe('manual operation', () => {
    it('adds ints', () => {
      const machine = new Machine(noop)
      const two = new ANumber(2)
      machine.push(two)
      machine.push(two)
      machine.send('add', 1)
      expect(machine.out).toEqual(4)
    })

    it('calls methods on globals', () => {
      const machine = new Machine(noop)
      machine.push(new AString('hi there'))
      machine.load(new ASymbol('Kernel'))
      machine.send('dbg', 1)
      expect(machine.stdout).toEqual('hi there')
    })
  })

  it('runs programs', () => {
    const machine = new Machine(adds)
    machine.fly()
    expect(machine.out).toEqual(4)
  })

  it('calls methods on global objects', () => {
    const greeter = new Machine(hello)
    greeter.fly()
    expect(greeter.stdout).toEqual('hello world')
  })

  it('method missing', () => {
    const miss = new Machine(missing)
    expect(() => miss.fly()).toThrow('Method missing on (kernel): dbz')
  })

  test.todo('calls used-defined functions')
})
