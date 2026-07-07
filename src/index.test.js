process.env['NODE_DEV'] = 'TEST';
const { onRequest } = require('./index.js');

jest.spyOn(global.console, 'log').mockImplementation();
jest.spyOn(global.console, 'error').mockImplementation();

/**
 * Spy on Segment Methods
 */
jest.spyOn(global.Segment, 'track').mockImplementation();
jest.spyOn(global.Segment, 'identify').mockImplementation();
jest.spyOn(global.Segment, 'page').mockImplementation();
jest.spyOn(global.Segment, 'group').mockImplementation();
jest.spyOn(global.Segment, 'screen').mockImplementation();
jest.spyOn(global.Segment, 'set').mockImplementation();

const baseRequest = {
  json: () => {}
};

const baseSettings = {};

describe('onRequest', () => {
  it('should call fetch & Segment.track', async () => {
    expect.assertions(2);

    /**
     * Call `onRequest`
     */
    await onRequest(baseRequest, baseSettings);

    /**
     * Expect `fetch` to have been called
     */
    expect(fetch.mock.calls).toHaveLength(1);

    /**
     * Expect `Segment.track` to have been called
     */
    expect(Segment.track).toHaveBeenCalledTimes(1);
  });

  it('should call remaining Segment methods', async () => {
    expect.assertions(4);

    /**
     * Call `onRequest`
     */
    await onRequest(baseRequest, baseSettings);

    /**
     * Expect `Segment` methods to have been called
     */
    expect(Segment.identify).toHaveBeenCalledTimes(1);
    expect(Segment.track).toHaveBeenCalledTimes(1);
    expect(Segment.track).toHaveBeenCalledTimes(1);
    expect(Segment.track).toHaveBeenCalledTimes(1);
  });

  it('should throw RetryError when fetch rejects (connection error)', async () => {
    expect.assertions(1);
    fetch.mockRejectOnce(new Error('connection reset'));

    await expect(onRequest(baseRequest, baseSettings)).rejects.toThrow(
      new RetryError('connection reset')
    );
  });

  it('should throw RetryError on a 5xx response', async () => {
    expect.assertions(1);
    fetch.mockResponseOnce('', { status: 500 });

    await expect(onRequest(baseRequest, baseSettings)).rejects.toThrow(
      new RetryError('Failed with 500')
    );
  });

  it('should throw RetryError on a 429 response', async () => {
    expect.assertions(1);
    fetch.mockResponseOnce('', { status: 429 });

    await expect(onRequest(baseRequest, baseSettings)).rejects.toThrow(
      new RetryError('Failed with 429')
    );
  });
});

describe('test-only exports guard', () => {
  it('should not export internals when NODE_DEV is not TEST', () => {
    expect.assertions(1);
    // The bottom-of-file guard only attaches module.exports when
    // NODE_DEV === 'TEST'. Set a non-TEST value so the guard's false path runs,
    // then restore to 'TEST' in a finally (this file sets it at module scope).
    process.env['NODE_DEV'] = 'NOT_TEST';

    let reloadedExports;
    try {
      jest.isolateModules(() => {
        reloadedExports = require('./index.js');
      });
    } finally {
      process.env['NODE_DEV'] = 'TEST';
    }

    expect(reloadedExports).toStrictEqual({});
  });
});
