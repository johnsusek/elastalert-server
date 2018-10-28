import RouteLogger from '../../routes/route_logger';
import sendRequestError from '../../common/errors/utils';

let logger = new RouteLogger('/config');

export default function configGetHandler(request, response) {
  let server = request.app.get('server');

  server.configController.getConfig()
    .then(function (config) {
      response.send(config);
      logger.sendSuccessful();
    })
    .catch(function (error) {
      sendRequestError(error);
    });

  logger.sendSuccessful();
}
