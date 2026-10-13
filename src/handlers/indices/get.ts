import { getClient, getClientVersion } from '../../common/elasticsearch_client';

export default async function indicesHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  try {
    const client = await getClient();
    const es_version = await getClientVersion();

    if (es_version >= 8) {
      try {
        const result = await client.cat.indices({
          h: ['index']
        });
        let indices = result.trim().split('\n');
        response.send(indices);
      } catch (err) {
        response.send({
          error: err
        });
      }
    } else {
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
    }
  } catch (error) {
    console.log(error);
  }

}
