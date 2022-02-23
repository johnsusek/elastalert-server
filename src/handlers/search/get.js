import { getClient, getClientVersion } from '../../common/elasticsearch_client';

export default async function searchHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  try {
    const client = await getClient();
    const es_version = await getClientVersion();
    
    // TODO: Removed body key from request. Elasticsearch 8 doesn't matter if the request has a body key. Obsolete in Elasticsearch 9
    if (es_version >= 8) {
      try {
        const result = await client.search({
          index: request.params.index,
          body: request.body
        });
        response.send(result);
      } catch (err) {
        response.send({
          error: err
        });
      }
    } else {
      client.search({
        index: request.params.index,
        body: request.body
      }, (err, {body}) => {
        if (err)  {
          response.send({
            error: err
          });
        } else {
          response.send(body);
        }
      });
    }
  } catch (error) {
    console.log(error);
  }

}
