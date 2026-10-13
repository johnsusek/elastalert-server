import RouteLogger from '../../routes/route_logger';
import sendRequestError from '../../common/errors/utils';

let logger = new RouteLogger('/templates');

export default function templatesHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  let server = request.app.get('server');

  let path = request.query.path || '';

  if (typeof request.query.all !== 'undefined') {
    server.templatesController.getTemplatesAll()
      .then(function (templates) {
        response.send(templates);
        logger.sendSuccessful();
      })
      .catch(function (error) {
        sendRequestError(error);
      });
  }
  else {
    server.templatesController.getTemplates(path)
      .then(function (templates) {
        response.send(templates);
        logger.sendSuccessful();
      })
      .catch(function (error) {
        sendRequestError(error);
      });
  }

}
