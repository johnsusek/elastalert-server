import Logger from '../../common/logger';
import { join as joinPath } from 'path';
import config from '../../common/config';
import {spawn} from 'child_process';

let logger = new Logger('TestController');

export default class TestController {
  constructor(server) {
    this._server = server;
    this._elastalertPath = config.get('elastalertPath');
    this.rulesFolder = this._getRulesFolder();
  }

  silenceRule(path, unit, duration) {
    const self = this;

    const fullPath = joinPath(self.rulesFolder, path + '.yaml');

    return new Promise(function (resolve, reject) {
      let processOptions = [];
      let outputLines = [];

      processOptions.push('--config', 'config.yaml', '--rule', fullPath, '--verbose', '--silence', `${unit}=${duration}`);

      try {
        let testProcess = spawn('elastalert', processOptions, {
          cwd: self._elastalertPath
        });

        testProcess.stdout.on('data', function (data) {
          outputLines.push(data.toString());
        });

        testProcess.stderr.on('data', function (data) {
          outputLines.push(data.toString());
        });

        testProcess.on('exit', function (statusCode) {
          if (statusCode === 0) {
            resolve(outputLines.join('\n'));
          } else {
            reject(outputLines.join('\n'));
            logger.error(outputLines.join('\n'));  
          }
        });
      } catch (error) {
        logger.error(`Failed to silence on ${path} with error:`, error);
        reject(error);
      }
    }).catch((error) => {
      logger.error('Failed to test rule with error:', error);
    });
  }

  _getRulesFolder() {
    const ruleFolderSettings = config.get('rulesPath');

    if (ruleFolderSettings.relative) {
      return joinPath(config.get('elastalertPath'), ruleFolderSettings.path);
    } else {
      return ruleFolderSettings.path;
    }
  }

}
