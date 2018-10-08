import indexHandler from '../handlers/';
import statusHandler from '../handlers/status';
import controlHandler from '../handlers/status/control';
import errorsHandler from '../handlers/status/errors';
import rulesHandler from '../handlers/rules';
import ruleGetHandler from '../handlers/rules/id/get';
import downloadRulesHandler from '../handlers/rules/id/download';
import rulePostHandler from '../handlers/rules/id/post';
import ruleDeleteHandler from '../handlers/rules/id/delete';
import templatesHandler from '../handlers/templates';
import templateGetHandler from '../handlers/templates/id/get';
import templatePostHandler from '../handlers/templates/id/post';
import templateDeleteHandler from '../handlers/templates/id/delete';
import folderPutHandler from '../handlers/folders/put';
import folderDeleteHandler from '../handlers/folders/delete';
import testPostHandler from '../handlers/test/post';
import configGetHandler from '../handlers/config/get';
import configPostHandler from '../handlers/config/post';
import metadataHandler from '../handlers/metadata/get';
import indicesHandler from '../handlers/indices/get';
import mappingHandler from '../handlers/mapping/get';
import searchHandler from '../handlers/search/get';

/**
 * A server route.
 * @typedef {Object} Route
 * @property {String} path The path to route (without '/' at the start).
 * @property {String|String[]} method The method to route. Can be any of the [Express routing methods](http://expressjs.com/en/4x/api.html#routing-methods).
 * @property {Function|Function[]} handler The handler function for this route. See the [Express documentation](http://expressjs.com/en/4x/api.html) for more info.
 *                                         If 'method' is an array, this property should be an equal length array too.
 */

/**
 * An overview
 * @type {Route[]}
 */
let routes = [
  {
    path: '',
    method: 'GET',
    handler: indexHandler
  }, {
    path: 'status',
    method: 'GET',
    handler: statusHandler
  }, {
    path: 'status/control/:action',
    method: 'GET',
    handler: controlHandler,
  }, {
    path: 'status/errors',
    method: 'GET',
    handler: errorsHandler
  }, {
    path: 'rules',
    method: 'GET',
    handler: rulesHandler
  }, {
    path: 'rules/:id*',
    method: ['GET', 'POST', 'DELETE'],
    handler: [ruleGetHandler, rulePostHandler, ruleDeleteHandler]
  }, {
    path: 'templates',
    method: 'GET',
    handler: templatesHandler
  }, {
    method: ['GET', 'POST', 'DELETE'],
    path: 'templates/:id*',
    handler: [templateGetHandler, templatePostHandler, templateDeleteHandler]
  }, 
  { 
    path: 'folders/:type/:path*',
    method: ['PUT', 'DELETE'],
    handler: [folderPutHandler, folderDeleteHandler]
  },
  {
    path: 'test',
    method: 'POST',
    handler: testPostHandler
  }, 
  {
    path: 'config',
    method: ['GET', 'POST'],
    handler: [configGetHandler, configPostHandler]
  },
  {
    path: 'download',
    method: ['POST'],
    handler: [downloadRulesHandler]
  },
  {
    path: 'metadata/:type',
    method: ['GET'],
    handler: [metadataHandler]
  },
  {
    path: 'indices',
    method: ['GET'],
    handler: [indicesHandler]
  },
  {
    path: 'mapping/:index',
    method: ['GET'],
    handler: [mappingHandler]
  },
  {
    path: 'search/:index',
    method: ['POST'],
    handler: [searchHandler]
  }
];

export default routes;
