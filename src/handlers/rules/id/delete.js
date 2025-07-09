import RouteLogger from '../../../routes/route_logger';
import {sendRequestError} from '../../../common/errors/utils';

let logger = new RouteLogger('/rules/:id', 'DELETE');

export default function ruleDeleteHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  let server = request.app.get('server');
  let pathParts = request.originalUrl.split('/');
  let idIndex = pathParts.indexOf('rules') + 1;
  let path = pathParts.slice(idIndex).join('/');

  server.rulesController.rule(path)
    .then(function (rule) {
      rule.delete()
        .then(function (rule) {
          response.send(rule);
          logger.sendSuccessful({
            deleted: true,
            id: request.params.id
          });
        })
        .catch(function (error) {
          logger.sendFailed(error);
          sendRequestError(response, error);
        });
    })
    .catch(function (error) {
      logger.sendFailed(error);
      sendRequestError(response, error);
    });
}
