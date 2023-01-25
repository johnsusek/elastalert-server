import elasticsearch5 from 'es5';
import elasticsearch6 from 'es6';
import elasticsearch7 from 'es7';
import opensearch from '@opensearch-project/opensearch';
import elasticsearch8 from 'es8';

import fs from 'fs';
import config from './config';
import axios from 'axios';

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

export async function getClientVersion() {

  try {
    // OpenSearch 1.x
    if (config.get('opensearch_flg') && config.get('opensearch2_flg') === false) {
      return 7;
    }

    // OpenSearch 2.x
    if (config.get('opensearch_flg') === false && config.get('opensearch2_flg')) {
      return 8;
    }

    let scheme = 'http';

    if (config.get('es_ssl')) {
      scheme = 'https';
    }

    let auth = '';
    
    if (config.get('es_username') && config.get('es_password')) {
      auth = `${config.get('es_username')}:${config.get('es_password')}@`;
    }

    const agent  = {};

    if (config.get('es_ssl')) {
      agent.rejectUnauthorized = config.get('ea_verify_certs');

      if (config.get('es_ca_certs')) {
        agent.ca = fs.readFileSync(config.get('es_ca_certs'));
      }
      if (config.get('es_client_cert')) {
        agent.cert = fs.readFileSync(config.get('es_client_cert'));
      }
      if (config.get('es_client_key')) {
        agent.key = fs.readFileSync(config.get('es_client_key'));
      }
    }

    const https = require('https');
    const httpsAgent = new https.Agent(agent);
    const result = 
      await axios.get(
        `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`, 
        {httpsAgent}
      );
    return parseInt(result.data.version['number'].split('.')[0], 10);
  } catch (error) {
    console.log(error);
  }

}

export async function clientSearch(index, type, qs, request, response) {

  try {
    const es_version = await getClientVersion();
    const client = await getClient();

    if (es_version >= 7) {
      type = undefined;
    }

    if (es_version >= 8) {
      try {
        const result = await client.search({
          index: index,
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
        });
        result.hits.hits = result.hits.hits.map(h => h._source);
        response.send(result.hits);
      } catch (err) {
        response.send({
          error: err
        });
      }
    } else {
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
                }
              ]
            }
          },
          sort: [{ '@timestamp': { order: 'desc' } }]
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
    }
  } catch (error) {
    console.log(error);
  }

}

export async function getClient() {

  try {
    const es_version = await getClientVersion();

    let scheme = 'http';
    let ssl_body = {};

    if (config.get('es_ssl')) {
      scheme = 'https';
      ssl_body.rejectUnauthorized = config.get('ea_verify_certs');

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

    if (config.get('opensearch_flg') || config.get('opensearch2_flg')) {

      // OpenSearch
      const client_opensearch = new opensearch.Client({
        node: [ `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`],
        ssl: ssl_body
      });
      return client_opensearch;    
    }

    if (es_version === 5) {

      // Elasticsearch 5.x
      const client5 = new elasticsearch5.Client({
        node: [ `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`],
        ssl: ssl_body
      });
      return client5;
    } else if (es_version == 6) {
      
      // Elasticsearch 6.x
      const client6 = new elasticsearch6.Client({
        node: [ `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`],
        ssl: ssl_body
      });
      return client6;
    } else if (es_version == 7) {      
      
      // Elasticsearch 7.x
      const client7 = new elasticsearch7.Client({
        node: [ `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`],
        ssl: ssl_body
      });
      return client7;
    } else if (es_version == 8) {
      
      // Elasticsearch 8.x
      const client8 = new elasticsearch8.Client({
        node: [ `${scheme}://${auth}${config.get('es_host')}:${config.get('es_port')}`],
        tls: ssl_body
      });
      return client8;
    }
  } catch (error) {
    console.log(error);
  }

}

