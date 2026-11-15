import RouteLogger from '../../../routes/route_logger';
import {sendRequestError} from '../../../common/errors/utils';
import {RuleYamlNotSentError} from '../../../common/errors/rule_request_errors';

let logger = new RouteLogger('/rules/:id', 'POST');

export default function rulePostHandler(request, response) {
  /**
   * @type {ElastalertServer}
   */
  let server = request.app.get('server');
  let body = request.body ? request.body.yaml : undefined;
  let path = request.params.id.join('/');

  if (typeof body !== 'string') {
    let error = new RuleYamlNotSentError();
    logger.sendFailed(error);
    return sendRequestError(response, error);
  }

  server.rulesController.rule(path)
    .then(function (rule) {
      rule.edit(body)
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
      if (error.error === 'ruleNotFound') {
        server.rulesController.createRule(path, body)
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
