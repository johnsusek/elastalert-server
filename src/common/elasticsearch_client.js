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

  if (config.get('es_ssl')) {
    scheme = 'https';
  }

  let auth = '';

  if (config.get('es_username') && config.get('es_password')) {
    auth = `${config.get('es_username')}:${config.get('es_password')}@`;
  }
  
  var client = new elasticsearch.Client({
    hosts: [ `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`]
  });

  return client;
}
