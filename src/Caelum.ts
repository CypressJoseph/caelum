import pkg from '../package.json'
namespace Caelum {
    class Driver {
      get version () { return pkg.version }
    }
    export const driver = new Driver()
}

export default Caelum.driver
