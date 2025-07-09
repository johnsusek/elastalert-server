import indexHandler from '../handlers/';
import statusHandler from '../handlers/status';
import errorsHandler from '../handlers/status/errors';
import rulesHandler from '../handlers/rules';
import ruleGetHandler from '../handlers/rules/id/get';
import rulePostHandler from '../handlers/rules/id/post';
import ruleDeleteHandler from '../handlers/rules/id/delete';
import templatesHandler from '../handlers/templates';
import templateGetHandler from '../handlers/templates/id/get';
import templatePostHandler from '../handlers/templates/id/post';
import templateDeleteHandler from '../handlers/templates/id/delete';
import folderPutHandler from '../handlers/folders/put';
import folderDeleteHandler from '../handlers/folders/delete';
import testPostHandler from '../handlers/test/post';
import silencePostHandler from '../handlers/silence/post';
import configGetHandler from '../handlers/config/get';
import configPostHandler from '../handlers/config/post';
import {
  metadataElastalertHandler,
  metadataElastalertStatusHandler,
  metadataElastalertSilenceHandler,
  metadataElastalertErrorHandler,
  metadataElastalertPastHandler
} from '../handlers/metadata/get';
import indicesHandler from '../handlers/indices/get';
import mappingHandler from '../handlers/mapping/get';
import searchHandler from '../handlers/search/get';
import configHandler from '../handlers/config/get';

/**
 * A server route.
 * @typedef {Object} Route
 * @property {String} path The path to route (without '/' at the start).
 * @property {String|String[]} method The method to route. Can be any of the [Express routing methods](http://expressjs.com/en/5x/api.html#routing-methods).
 * @property {Function|Function[]} handler The handler function for this route. See the [Express documentation](http://expressjs.com/en/5x/api.html) for more info.
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
    path: 'status/errors',
    method: 'GET',
    handler: errorsHandler
  }, {
    path: 'rules',
    method: 'GET',
    handler: rulesHandler
  }, {
    path: 'rules/:id',
    method: ['GET', 'POST', 'DELETE'],
    handler: [ruleGetHandler, rulePostHandler, ruleDeleteHandler]
  }, {
    path: 'templates',
    method: 'GET',
    handler: templatesHandler
  }, {
    method: ['GET', 'POST', 'DELETE'],
    path: 'templates/:id',
    handler: [templateGetHandler, templatePostHandler, templateDeleteHandler]
  }, 
  { 
    path: 'folders/:type/:path',
    method: ['PUT', 'DELETE'],
    handler: [folderPutHandler, folderDeleteHandler]
  },
  {
    path: 'test',
    method: 'POST',
    handler: testPostHandler
  }, 
  {
    path: 'silence/:path',
    method: 'POST',
    handler: silencePostHandler
  }, 
  {
    path: 'config',
    method: ['GET', 'POST'],
    handler: [configGetHandler, configPostHandler]
  },
  {
    path: 'metadata/elastalert',
    method: ['GET'],
    handler: [metadataElastalertHandler]
  },
  {
    path: 'metadata/elastalert_status',
    method: ['GET'],
    handler: [metadataElastalertStatusHandler]
  },
  {
    path: 'metadata/silence',
    method: ['GET'],
    handler: [metadataElastalertSilenceHandler]
  },
  {
    path: 'metadata/elastalert_error',
    method: ['GET'],
    handler: [metadataElastalertErrorHandler]
  },
  {
    path: 'metadata/past_elastalert',
    method: ['GET'],
    handler: [metadataElastalertPastHandler]
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
  },
  {
    path: 'config',
    method: ['GET'],
    handler: [configHandler]
  }
];

export default routes;
