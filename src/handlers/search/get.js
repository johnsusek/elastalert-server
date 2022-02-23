import { getClient, getClientVersion } from '../../common/elasticsearch_client';

export default async function searchHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  try {
    const client = await getClient();
    const es_version = await getClientVersion();
    
    if (es_version >= 8) {
      try {
        const result = await client.search({
          index: request.params.index,
          document: request.body
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
