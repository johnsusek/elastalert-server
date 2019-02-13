import elasticsearch from 'elasticsearch';
import config from './config';

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
