process.env['NODE_DEV'] = 'TEST';
const { onRequest } = require('./index.js');

jest.spyOn(global.console, 'log').mockImplementation();
jest.spyOn(global.console, 'error').mockImplementation();

describe('onRequest', () => {
  it('should call console.log twice', async () => {
    expect.assertions(1);
    await onRequest({}, {});
    expect(console.log).toHaveBeenCalledTimes(2);
  });
});
