import pkg from '../package.json'
import cael from './Caelum'

describe(pkg.name, () => {
  it('works', () => {
    expect(cael.version).toBe('0.0.1-alpha')
  })
})
