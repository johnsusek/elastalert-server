import RouteLogger from '../../../routes/route_logger';
import {sendRequestError} from '../../../common/errors/utils';

let logger = new RouteLogger('/templates/:id');

export default function templateGetHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  let server = request.app.get('server');
  let pathParts = request.originalUrl.split('/');
  let idIndex = pathParts.indexOf('templates') + 1;
  let path = pathParts.slice(idIndex).join('/');

  server.templatesController.template(path)
    .then(function (template) {
      template.get()
        .then(function (template) {
          response.send(template);
          logger.sendSuccessful();
        })
        .catch(function (error) {
          logger.sendFailed(error);
          sendRequestError(response, error);
        });
    })
    .catch(function (error) {
      sendRequestError(response, error);
    });
}
