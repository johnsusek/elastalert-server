// Defines the config's Joi schema
import Joi from '@hapi/joi';

const schema = Joi.object().keys({
  'appName': Joi.string().default('elastalert-server'),
  'es_host': Joi.string().default('elastalert'),
  'es_port': Joi.number().default(9200),
  'writeback_index': Joi.string().default('elastalert_status'),
  'host': Joi.string().default('0.0.0.0'),
  'port': Joi.number().default(3030),
  'wshost': Joi.string().default('0.0.0.0'),
  'wsport': Joi.number().default(3333),
  'elastalertPath': Joi.string().default('/opt/elastalert'),
  'rulesPath': Joi.object().keys({
    'relative': Joi.boolean().default(true),
    'path': Joi.string().default('/rules')
  }).default(),
  'templatesPath': Joi.object().keys({
    'relative': Joi.boolean().default(true),
    'path': Joi.string().default('/rule_templates')
  }).default(),
  'dataPath': Joi.object().keys({
    'relative': Joi.boolean().default(true),
    'path': Joi.string().default('/server_data')
  }).default()
}).default();

export default schema;
