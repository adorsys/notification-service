const { Given, When, Then } = require('cucumber');
const got = require('got');
const assert = require('assert');

When(/^send ([^"]*) request to "([^"]*)", the data is$/, async function (method, url, docString) {
    await got[method](url, parseJsonData(docString));
});

When(/^send ([^"]*) request to "([^"]*)", the raw response is "([^"]*)"$/, async function (method, url, response) {
    await got[method](url, response);
});

When(/^send ([^"]*) request to "([^"]*)", with authorization and data$/, async function (method, url, docString) {
    const instance = addAuthTokenToRequest();

    try {
        this.response = await instance[method](url, parseJsonData(docString));
    } catch (error) {
        this.error = error;
    }
});

When(/^send ([^"]*) request to "([^"]*)", access should be forbidden$/, async function (method, url) {
    try {
        const respnose = await got[method](url, parseJsonData());
    } catch(error) {
        assert.equal(error.statusCode, 401);
    }

    assert.equal('undefined', typeof response);
});

Then(/^error should be equal "([^"]*)"$/, async function (errorMessage) {
    assert.equal('object', typeof this.error);
    assert.equal(this.error.message, errorMessage);
    this.error = undefined;
});

Then(/^response should be empty$/, async function () {
    assert.equal('object', typeof this.response);
    assert.equal(this.response.body.length, 0);
    this.response = undefined;
});

function parseJsonData(docString = "{}") {
    return {
        headers: { 'Content-Type': 'application/json' },
        json: true,
        body: JSON.parse(docString)
    }
}

function addAuthTokenToRequest(params, query) {
    const authToken = process.env['AUTH_TOKEN'];
    return got.extend({
        hooks: {
            beforeRequest: [
                options => {
                    options.headers['X-AUTH-TOKEN'] = authToken;
                }
            ]
        }
    });
}
