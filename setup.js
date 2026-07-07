module.exports = async function () {
  globalThis.btoa = require('btoa');
  globalThis.fetch = require('jest-fetch-mock');
  fetch.enableMocks();
  globalThis.RetryError = class RetryError extends Error {
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
    }
  };
  globalThis.Segment = {
    track() {},
    identify() {},
    page() {},
    group() {},
    screen() {},
    set() {}
  };
};
