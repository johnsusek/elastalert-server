import elasticsearch from 'elasticsearch';
import config from './config';

export function escapeLuceneSyntax(str) {
  return [].map
    .call(str, char => {
      if (
        char === '/' ||
        char === '+' ||
        char === '-' ||
        char === '&' ||
        char === '|' ||
        char === '!' ||
        char === '(' ||
        char === ')' ||
        char === '{' ||
        char === '}' ||
        char === '[' ||
        char === ']' ||
        char === '^' ||
        char === '"' ||
        char === '~' ||
        char === '*' ||
        char === '?' ||
        char === ':' ||
        char === '\\'
      ) {
        return `\\${char}`;
      }
      return char;
    })
    .join('');
}

export function getClientVersion(response) {
  let client = getClient();

  return client.info().then(function (resp) {
    return parseInt(resp.version.number.split('.')[0], 10);
  }, function (err) {
    response.send({
      error: err
    });
  });
}

export function clientSearch(index, type, qs, request, response) {
  let client = getClient();

  client.search({
    index,
    type,
    body: {
      from: request.query.from || 0,
      size: request.query.size || 100,
      query: {
        bool: {
          must: [
            {
              query_string: { query: qs }
            }
          ]
        }
      },
      sort: [{ '@timestamp': { order: 'desc' } }]
    }
  }).then(function (resp) {
    resp.hits.hits = resp.hits.hits.map(h => h._source);
    response.send(resp.hits);
  }, function (err) {
    response.send({
      error: err
    });
  });
}

export function getClient() {
  let scheme = 'http';
  let ssl_body = {};

  if (config.get('es_ssl')) {
    scheme = 'https';
    ssl_body.rejectUnauthorized = true;

    if (config.get('es_ca_certs')) {
      ssl_body.ca = fs.readFileSync(config.get('es_ca_certs'));
    }
    if (config.get('es_client_cert')) {
      ssl_body.cert = fs.readFileSync(config.get('es_client_cert'));
    }
    if (config.get('es_client_key')) {
      ssl_body.key = fs.readFileSync(config.get('es_client_key'));
    }
  }

  let auth = '';

  if (config.get('es_username') && config.get('es_password')) {
    auth = `${config.get('es_username')}:${config.get('es_password')}@`;
  }

  var client = new elasticsearch.Client({
    hosts: [ `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`],
    ssl: ssl_body
  });

  return client;
}
