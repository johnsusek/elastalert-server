import { getClient, getClientVersion } from '../../common/elasticsearch_client';

export default async function mappingHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  try {
    const client = await getClient();
    const es_version = await getClientVersion();

    if (es_version >= 8) {
      try {
        const result = await client.indices.getMapping({
          index: request.params.index
        });
        response.send(result);
      } catch (err) {
        response.send({
          error: err
        });
      }
    } else {
      client.indices.getMapping({
        index: request.params.index
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
