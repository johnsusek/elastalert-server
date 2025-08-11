import RouteLogger from '../../routes/route_logger';
import {sendRequestError} from '../../common/errors/utils';

let logger = new RouteLogger('/folders/:type/:path', 'DELETE');

export default function folderDeleteHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  let server = request.app.get('server');
  let pathParts = request.originalUrl.split('/');
  let pathIndex = pathParts.indexOf(request.params.type) + 1;
  let path = pathParts.slice(pathIndex).join('/');

  server.foldersController.delete(request.params.type, path)
    .then(function () {
      response.send({
        deleted: true,
        type: request.params.type,
        path: path
      });
      logger.sendSuccessful();
    })
    .catch(function (error) {
      console.error(error);
      logger.sendFailed(error);
      sendRequestError(response, 'Could not delete folder.');
    });
}
