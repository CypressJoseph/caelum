import chalk from 'chalk'
import assertNever from 'assert-never'
import Stack from './Stack'
// eslint-disable-next-line no-unused-vars
import Program from '../cael-lang/cael/Program'
import { Store } from './Store'

export abstract class AObject {
  instanceMethods: Store<AFunction> = new Store()

  getInstanceMethod (methodName: string): AFunction {
    return this.instanceMethods.get(methodName)
  }

  hasInstanceMethod (method: string): boolean {
    if (this.instanceMethods.has(method)) { return true }
    return false
  }

  defineInstanceMethod (methodName: string, method: AFunction) {
    this.instanceMethods.set(methodName, method)
  }

  abstract pretty: string;
  abstract value: any;
}

class AFunction extends AObject {
  constructor (public name: string, public func: Function) {
    super()
    console.log('CREATE NEW METHOD ' + name)
  }

  get pretty () { return `[.${this.name} (method)]` }
  get value () { return this.func }
}

export class ANumber extends AObject {
  constructor (private val: number) {
    super()
    const add = new AFunction('add', (machine: Aer.Machine, other: ANumber) => {
      const result = val + other.value
      machine.log(`Numeric.add: ${val} + ${other.value} = ${result}`)
      return new ANumber(result)
    })
    this.defineInstanceMethod('add', add)
  }

  get pretty () { return String(this.val) }
  get value () { return Number(this.val) }
}

export class AString extends AObject {
  constructor (private val: string) { super() }
  get pretty () { return (this.val) }
  get value () { return (this.val) }
}
export class ASymbol extends AString {}
export class ANil extends AObject {
  pretty: string = 'nil'
  value: any = null
}

export class AKernel extends AObject {
  pretty: string = '(kernel)'
  value: any = 'kernel-instance'
  constructor () {
    super()
    const dbg = new AFunction('dbg', (machine: Aer.Machine, message: AString) => {
      const out = message.value
      machine.log(out)
      return new ANil()
    })
    this.defineInstanceMethod('dbg', dbg)
  }
}

export namespace Aer {
  const debug = { log: console.log }

  class InstructionPointer {
    constructor (public code: Program, public line: number = -1) {
      console.log('create new instruction pointer at ' + this.line)
    }

    advance () { this.line += 1 }
    get isExhausted () { return this.line < this.code.instructions.length - 1 }
  }

  export abstract class Machine {
    public abstract code: Program;
    public abstract stdout: String;
    protected abstract stack: Stack<AObject>;
    protected abstract ip: InstructionPointer;

    push (value: AObject) { this.stack.push(value) }
    pop (): AObject { return this.stack.pop() }
    get top () { return this.stack.top }
    get out () { return this.top.value }

    abstract fly (): void;
    abstract log (message: string): void;

    send (message: string, argCount: number) {
      debug.log(`send ${message} to top (${this.top.pretty}) with argCount ${argCount}`)
      const subject: AObject = this.pop()
      const args: AObject[] = []
      for (let i = 0; i < argCount; i++) { args.push(this.pop()) }
      this.call(subject, message, args)
    }

    private call (receiver: AObject, methodName: string, args: AObject[]) {
      if (receiver.hasInstanceMethod(methodName)) {
        debug.log(`call ${methodName} on receiver (${receiver.pretty}) with args [${args.map(a => a.pretty)}]`)
        const instanceMethod: AFunction = receiver.getInstanceMethod(methodName)
        const result = this.invoke(receiver, instanceMethod, args)
        this.push(result)
      } else {
        throw new Error(`Method missing for ${receiver}: ${methodName}`)
      }
    }

    private invoke (receiver: AObject, method: AFunction, args: AObject[]): AObject {
      debug.log(`invoke ${method.pretty} on receiver (${receiver.pretty}) with args [${args.map(a => a.pretty)}]`)
      const { func } = method
      return func.call(receiver, this, ...args) as AObject
    }
  }

  export class Dirigible extends Machine {
    public stdout: String = ''
    private instructionPointer: InstructionPointer
    private activeStack: Stack<AObject>

    constructor (public code: Program) {
      super()
      this.instructionPointer = new InstructionPointer(code)
      this.activeStack = new Stack()
    }

    protected get ip () { return this.instructionPointer }
    protected get stack () { return this.activeStack }

    public get pilot () { return new DirigiblePilot(this) }

    static globals: { [key: string]: AObject } = { Kernel: new AKernel() }

    fly (): Recording {
      const { ip, stack } = this
      const flightPlan: Frame = { ip, stack, ctx: new Store(Dirigible.globals) }
      const flightRecording: Recording = this.pilot.execute(flightPlan)
      return flightRecording
    }

    log (out: string): void {
      process.stdout.write(chalk.magenta(out))
      this.stdout += out
    }

    load (sym: ASymbol): void {
      console.log('manual machine load can only access globals!')
      this.push(Dirigible.globals[sym.value])
    }
  }

  type Frame = {
    ip: InstructionPointer
    stack: Stack<AObject>
    ctx: Store<AObject>
  }

  type Recording = {
    programName: string,
    commandsExecuted: number,
    wallClockTimeElapsed: number,
  }

  class DirigiblePilot {
    private frames: Stack<Frame> = new Stack<Frame>()

    constructor (private vessel: Dirigible) {
      console.log('New pilot created')
    }

    get frame () { return this.frames.top }
    get ip () { return this.frame.ip }

    execute ({ ip, stack, ctx }: Frame): Recording {
      debug.log('execute!')
      const recording: Recording = { programName: 'idk', commandsExecuted: -1, wallClockTimeElapsed: -1 }
      this.frames.push({ ip, stack, ctx })
      this.run()
      return recording
    }

    run () {
      debug.log('run!')
      let halted = false
      while (!halted) {
        if (this.canAdvance) {
          this.move()
        } else {
          // we ran off the edge...
          halted = true
        }
      }
      debug.log('run complete!')
    }

    private move () {
      debug.log('move!')
      this.advance()
      debug.log('current instruction!', this.instruction)
      switch (this.instruction.op) {
        case 'noop':
          break
        case 'store':
        case 'pop':
          throw new Error('Instruction not impl: ' + this.instruction.op)
        case 'push':
          this.instruction.subject && this.vessel.push(this.instruction.subject)
          break
        case 'send':
          this.instruction.subject instanceof AString &&
            this.vessel.send(this.instruction.subject.value, this.instruction.argCount || 0)
          break
        case 'load':
          this.instruction.subject instanceof AString &&
            this.vessel.push(
              this.frame.ctx.get(this.instruction.subject.value)
            )
          break
        default: assertNever(this.instruction.op)
      }
    }

    private advance () { this.frame.ip.advance() }
    private get canAdvance () { return this.frame.ip.isExhausted }
    private get instruction () { return this.instructions[this.ip.line] }
    private get instructions () { return this.vessel.code.instructions }
  }
}

export default Aer.Dirigible
