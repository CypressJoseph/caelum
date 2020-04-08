import Program from './Program'
describe('Program', () => {
  it('name', () => {
    const helloWorld = new Program('hello.cael')
    expect(helloWorld.path).toEqual('hello.cael')
    expect(helloWorld.name).toEqual('hello')
  })
})
