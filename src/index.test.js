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
    expect(Segment.group).toHaveBeenCalledTimes(1);
    expect(Segment.page).toHaveBeenCalledTimes(1);
    expect(Segment.screen).toHaveBeenCalledTimes(1);
  });

  it('should throw RetryError on fetch connection error', async () => {
    fetch.mockRejectOnce(new Error('Network failure'));

    await expect(onRequest(baseRequest, baseSettings)).rejects.toThrow(
      'Network failure'
    );
  });

  it('should throw RetryError on 500 server error', async () => {
    fetch.mockResponseOnce('', { status: 500 });

    await expect(onRequest(baseRequest, baseSettings)).rejects.toThrow(
      'Failed with 500'
    );
  });

  it('should throw RetryError on 429 rate limit', async () => {
    fetch.mockResponseOnce('', { status: 429 });

    await expect(onRequest(baseRequest, baseSettings)).rejects.toThrow(
      'Failed with 429'
    );
  });
});
