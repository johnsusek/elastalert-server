import config from '../../common/config';
import { getClient, escapeLuceneSyntax, clientSearch, getClientVersion } from '../../common/elasticsearch_client';

export function metadataElastalertPastHandler(request, response) {
  getClientVersion(response).then(function (es_version) {
    let index;

    if (es_version > 5) {
      index = config.get('writeback_index') + '_past';
    } else {
      index = config.get('writeback_index');
    }

    let qs = '*:*';

    if (request.query.rule_name) {
      qs = `rule_name:"${escapeLuceneSyntax(request.query.rule_name)}"`;
    }

    clientSearch(index, es_version > 5 ? undefined : 'past_elastalert', qs, request, response);
  });
}

export function metadataElastalertErrorHandler(request, response) {
  getClientVersion(response).then(function (es_version) {
    let index;

    if (es_version > 5) {
      index = config.get('writeback_index') + '_error';
    } else {
      index = config.get('writeback_index');
    }

    clientSearch(index, es_version > 5 ? undefined : 'elastalert_error', '*:*', request, response);
  });
}

export function metadataElastalertSilenceHandler(request, response) {
  getClientVersion(response).then(function (es_version) {
    let index;

    if (es_version > 5) {
      index = config.get('writeback_index') + '_silence';
    } else {
      index = config.get('writeback_index');
    }

    let qs = '*:*';

    if (request.query.rule_name) {
      qs = `rule_name:"${escapeLuceneSyntax(request.query.rule_name)}" OR "${escapeLuceneSyntax(request.query.rule_name + '._silence')}"`;
    }

    clientSearch(index, es_version > 5 ? undefined : 'silence', qs, request, response);
  });
}

export function metadataElastalertStatusHandler(request, response) {
  getClientVersion(response).then(function (es_version) {
    let index;

    if (es_version > 5) {
      index = config.get('writeback_index') + '_status';
    } else {
      index = config.get('writeback_index');
    }

    let qs = '*:*';

    if (request.query.rule_name) {
      qs = `rule_name:"${escapeLuceneSyntax(request.query.rule_name)}"`;
    }

    clientSearch(index, es_version > 5 ? undefined : 'elastalert_status', qs, request, response);
  });
}

export function metadataElastalertHandler(request, response) {
  let client = getClient();
  let index = config.get('writeback_index');
  let qs;

  if (request.query.rule_name) {
    qs = `rule_name:"${escapeLuceneSyntax(request.query.rule_name)}"`;
  }
  else if (request.query.noagg) {
    qs = 'NOT aggregate_id:*';
  }
  else {
    qs = '*:*';
  }

  getClientVersion(response).then(function (es_version) {
    let type = 'elastalert';

    if (es_version >= 7) {
      type = undefined;
    }

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
              },
              {
                range: {
                  'alert_time': {
                    lte: 'now',
                  }
                }
              }
            ]
          }
        },
        sort: [{ 'alert_time': { order: 'desc' } }]
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
