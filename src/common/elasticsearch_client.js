import elasticsearch from 'elasticsearch';
import config from './config';

export function getClient() {
  let scheme = 'http';

  if (config.get('es_ssl')) {
    scheme = 'https';
  }
  
  var client = new elasticsearch.Client({
    hosts: [ `${scheme}://${config.get('es_host')}:${config.get('es_port')}`]
  });
  return client;
}
