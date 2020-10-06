import config from '../../common/config';
import { getClient, escapeLuceneSyntax, clientSearch, getClientVersion } from '../../common/elasticsearch_client';

export async function metadataElastalertPastHandler(request, response) {
  
  try {
    const es_version = await getClientVersion();
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
  } catch (error) {
    console.log(error);
  }

}

export async function metadataElastalertErrorHandler(request, response) {

  try {
    const es_version = await getClientVersion();
    let index;

    if (es_version > 5) {
      index = config.get('writeback_index') + '_error';
    } else {
      index = config.get('writeback_index');
    }

    clientSearch(index, es_version > 5 ? undefined : 'elastalert_error', '*:*', request, response);  
  } catch (error) {
    console.log(error);
  }

}

export async function metadataElastalertSilenceHandler(request, response) {

  try {
    const es_version = await getClientVersion();
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
  } catch (error) {
    console.log(error);
  }

}

export async function metadataElastalertStatusHandler(request, response) {

  try {
    const es_version = await getClientVersion();
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
  } catch (error) {
    console.log(error);
  }

}

export async function metadataElastalertHandler(request, response) {

  try {
    const es_version = await getClientVersion();
    const client = await getClient();
    const index = config.get('writeback_index');
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

    let type = 'elastalert';

    if (es_version >= 7) {
      type = undefined;
    }

    client.search({
      index: index,
      type: type,
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
    }, (err, {body}) => {
      if (err) {
        response.send({
          error: err
        });
      } else {
        body.hits.hits = body.hits.hits.map(h => h._source);
        response.send(body.hits);
      }
    });    
  } catch (error) {
    console.log(error);
  }

}
