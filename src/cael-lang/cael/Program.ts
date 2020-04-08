// eslint-disable-next-line no-unused-vars
import { AObject } from '../../vm/Machine'

namespace Cael {
    type InstructionOp = 'noop'
                       | 'push'
                       | 'pop'
                       | 'send'
                       | 'load'
                       | 'store'
    // limit the valid subjects for instructions
    // type Subject = Entity
    type Instruction = {
      op: InstructionOp,
      label?: string,
      subject?: AObject,
      argCount?: number
    }
    export class Program {
      constructor (public path: string, public instructions: Array<Instruction> = []) {
        console.log('create new program at ' + path)
      }

      get name () {
        const filename = this.path.split('.')
        return filename[0]
      }
    }
}

export default Cael.Program
