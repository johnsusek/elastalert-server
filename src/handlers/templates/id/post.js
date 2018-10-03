import RouteLogger from '../../../routes/route_logger';
import {sendRequestError} from '../../../common/errors/utils';

let logger = new RouteLogger('/templates/:id', 'POST');

export default function templatePostHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  let server = request.app.get('server');
  let body = request.body ? request.body.yaml : undefined;
  let path = request.params.id + request.params[0];

  server.templatesController.template(path)
    .then(function (template) {
      template.edit(body)
        .then(function () {
          response.send({
            created: true,
            id: path
          });
          logger.sendSuccessful();
        })
        .catch(function (error) {
          logger.sendFailed(error);
          sendRequestError(response, error);
        });
    })
    .catch(function (error) {
      if (error.error === 'templateNotFound') {
        server.templatesController.createTemplate(path, body)
          .then(function () {
            logger.sendSuccessful();
            response.send({
              created: true,
              id: path
            });
          })
          .catch(function (error) {
            logger.sendFailed(error);
            sendRequestError(response, error);
          });
      } else {
        logger.sendFailed(error);
        sendRequestError(response, error);
      }
    });
}
