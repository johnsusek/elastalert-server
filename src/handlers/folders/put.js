import RouteLogger from '../../routes/route_logger';
import {sendRequestError} from '../../common/errors/utils';

let logger = new RouteLogger('/folders/:type/:path', 'PUT');

export default function folderPostHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  let server = request.app.get('server');
  let path = request.params.path + request.params[0];

  server.foldersController.create(request.params.type, path)
    .then(function () {
      response.send({
        created: true,
        type: request.params.type,
        path: path
      });
      logger.sendSuccessful();
    })
    .catch(function (error) {
      console.error(error);
      logger.sendFailed(error);
      sendRequestError(response, error);
    });
}
