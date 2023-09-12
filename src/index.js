// Learn more about source functions API at
// https://segment.com/docs/connections/sources/source-functions

/**
 * Handle incoming HTTP request
 *
 * @param  {FunctionRequest} request
 * @param  {FunctionSettings} settings
 */
async function onRequest(request, settings) {
  const body = request.json();

  const endpoint = ''; // replace with your endpoint
  let response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(settings.apiKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    // Retry on connection error
    throw new RetryError(error.message);
  }

  if (response.status >= 500 || response.status === 429) {
    // Retry on 5xx (server errors) and 429s (rate limits)
    throw new RetryError(`Failed with ${response.status}`);
  }

  // See https://segment.com/docs/connections/spec/track/
  Segment.track({
    event: 'Test Event',
    userId: 'user_id',
    properties: {
      testProperty: 'testValue',
      testProperty2: response.propertyName
    }
  });

  // See https://segment.com/docs/connections/spec/identify/
  Segment.identify({
    userId: 'user_id',
    traits: {
      userName: 'Unicorn'
    }
  });

  // See https://segment.com/docs/connections/spec/group/
  Segment.group({
    groupId: 'group_id',
    userId: 'user_id',
    traits: {
      groupName: 'Unicorn'
    }
  });

  // See https://segment.com/docs/connections/spec/page/
  Segment.page({
    name: 'Home page',
    userId: 'user_id',
    properties: {
      url: 'https://mywebsite.com/about'
    }
  });

  // See https://segment.com/docs/connections/spec/screen/
  Segment.screen({
    name: 'Test Screen',
    userId: 'user_id',
    properties: {
      url: 'https://mywebsite.com/about'
    }
  });

  // See https://segment.com/docs/connections/sources/catalog/libraries/server/object-api/
  Segment.set({
    collection: 'users',
    id: 'user_id',
    properties: {
      userName: 'Unicorn'
    }
  });
}

/**
 * Exports for Testing Only
 */
try {
  if (process?.env['NODE_DEV'] === 'TEST') {
    module.exports = {
      onRequest
    };
  }
  // eslint-disable-next-line no-empty
} catch (e) {}
