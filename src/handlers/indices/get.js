import { getClient } from '../../common/elasticsearch_client';

export default function indicesHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  
  var client = getClient();

  client.cat.indices({
    h: ['index']
  }).then(function(resp) {
    let indices = resp.trim().split('\n');
    response.send(indices);
  }, function(err) {
    response.send({
      error: err
    });
  });

}
