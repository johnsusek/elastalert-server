import { join as joinPath } from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import Logger from '../../common/logger';
import FileSystem from '../../common/file_system';
import config from '../../common/config';

let logger = new Logger('ConfigController');

export default class ConfigController {
  constructor() {
    this._fileSystemController = new FileSystem();
  }

  getConfig() {
    let yamlConfig = this._getConfig();

    return new Promise(function(resolve) {
      let doc = yaml.safeLoad(yamlConfig);
      resolve({
        runEvery: doc.run_every,
        bufferTime: doc.buffer_time
      });
    }).catch((error) => {
      logger.error('Failed to getConfig error:', error);
    });
  }

  _getConfig() {
    const path = joinPath(config.get('elastalertPath'), 'config.yaml');
    return fs.readFileSync(path);
  } 
}
