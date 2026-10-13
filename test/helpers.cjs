// Shared helpers for the node --test suite.
const http = require('http');

const config = require('../src/common/config/index.js').default;

// The config singleton loads config/config.json asynchronously on import.
// Poll until the validated config is in place before reading it.
function waitForConfig() {
  return new Promise(function (resolve, reject) {
    const started = Date.now();
    const timer = setInterval(function () {
      if (config._jsonConfig) {
        clearInterval(timer);
        resolve(config._jsonConfig);
      } else if (Date.now() - started > 5000) {
        clearInterval(timer);
        reject(new Error('config did not finish loading'));
      }
    }, 25);
  });
}

// Starts a stub HTTP server that answers like an Elasticsearch node and
// reports the given version number. Returns the port and the requests seen.
function startEsStub(version) {
  const requests = [];
  const server = http.createServer(function (req, res) {
    requests.push({
      method: req.method,
      url: req.url,
      auth: req.headers.authorization || null
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ name: 'stub-es', version: { number: version } }));
  });

  return new Promise(function (resolve) {
    server.listen(0, '127.0.0.1', function () {
      resolve({
        server: server,
        requests: requests,
        port: server.address().port
      });
    });
  });
}

// Points the config singleton at a stub server for the duration of fn, then
// restores it. The underscore field is the validated config the singleton
// keeps internally; there is no public setter.
async function withConfig(overrides, fn) {
  const previous = config._jsonConfig;
  config._jsonConfig = Object.assign({}, previous, overrides);
  try {
    return await fn();
  } finally {
    config._jsonConfig = previous;
  }
}

module.exports = {
  config: config,
  waitForConfig: waitForConfig,
  startEsStub: startEsStub,
  withConfig: withConfig
};
