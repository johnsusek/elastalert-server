import { getClient } from '../../common/elasticsearch_client';

export default async function indicesHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  
  try {
    const client = await getClient();

    client.cat.indices({
      h: ['index']
    }, (err, {body}) => {
      if (err)  {
        response.send({
          error: err
        });
      } else {
        let indices = body.trim().split('\n');
        response.send(indices);
      }
    });
  } catch (error) {
    console.log(error);
  }

}
