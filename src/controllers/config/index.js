import { join as joinPath } from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import FileSystem from '../../common/file_system';
import config from '../../common/config';

export default class ConfigController {
  constructor() {
    this._fileSystemController = new FileSystem();
  }

  getConfig() {
    let yamlConfig = this._getConfig();

    return new Promise(function(resolve, reject) {
      let doc = yaml.safeLoad(yamlConfig);
      resolve({
        runEvery: doc.run_every,
        bufferTime: doc.buffer_time
      });
    }).catch((error) => {
      reject(error);
    });
  }

  _getConfig() {
    const path = joinPath(config.get('elastalertPath'), 'config.yaml');
    return fs.readFileSync(path);
  } 
}
