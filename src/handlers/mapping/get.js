import { getClient } from '../../common/elasticsearch_client';

export default async function mappingHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */

  try {
    const client = await getClient();

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
  } catch (error) {
    console.log(error);
  }

}
