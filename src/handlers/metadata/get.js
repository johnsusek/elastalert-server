import config from '../../common/config';
import { getClient } from '../../common/elasticsearch_client';


function escapeLuceneSyntax(str) {
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

function getQueryString(request) {
  if (request.params.type === 'elastalert_error' || !request.query.rule_name) {
    return '*:*';
  }
  else if (request.params.type === 'silence') {
    return `rule_name:"${escapeLuceneSyntax(request.query.rule_name)}" OR "${escapeLuceneSyntax(request.query.rule_name + '._silence')}"`;
  }
  else {
    return `rule_name:"${escapeLuceneSyntax(request.query.rule_name)}"`;
  }
}

export default function metadataHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  var client = getClient();
  var index;

  client.info().then(function (resp) {
    return parseInt(resp.version.number.split('.')[0], 10);
  }, function (err) {
    response.send({
      error: err
    });
  }).then(function (es_version) {
    if (es_version > 5) {
      switch (request.params.type) {
        case 'elastalert':
          index = config.get('writeback_index');
          break;
        case 'elastalert_status':
          index = config.get('writeback_index') + '_status';
          break;
        case 'silence':
          index = config.get('writeback_index') + '_silence';
          break;
        case 'elastalert_error':
          index = config.get('writeback_index') + '_error';
          break;
        case 'past_elastalert':
          index = config.get('writeback_index') + '_past';
          break;
        default:
        // code block
      }
    } else {
      index = config.get('writeback_index');
    }
    client.search({
      index: index,
      type: request.params.type,
      body: {
        from: request.query.from || 0,
        size: request.query.size || 100,
        query: {
          query_string: {
            query: getQueryString(request)
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
  });
}