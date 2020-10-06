import { getClient } from '../../common/elasticsearch_client';

export default async function searchHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */

  try {
    const client = await getClient();

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
  } catch (error) {
    console.log(error);
  }

}
