import Logger from './logger';
import fs from 'fs';
import { join as joinPath } from 'path';
import readdirp from 'readdirp';

let logger = new Logger('FileSystem');

export default class FileSystem {
  constructor() { }

  readDirectoryRecursive(path) {
    return new Promise(function (resolve, reject) {
      let rules = [];
      let stream = readdirp(path, { type: 'all', alwaysStat: true });

      stream
        .on('warn', function (err) {
          reject(err);  
        })
        .on('error', function (err) { 
          reject(err);
        })
        .on('data', entry => {
          let path = entry.path.replace('.yaml', '');
          if (entry.stats.isDirectory()) {
            path += '/';
          }
          rules.push(path);
        }).on('end', () => {
          resolve(rules);
        });
    }).catch((error) => {
      logger.error(`Failed to readDirectoryRecursive(${path}) error:`, error);
    });
  }

  readDirectory(path) {
    const self = this;
    return new Promise(function (resolve, reject) {
      fs.readdir(path, function (error, elements) {
        if (error) {
          reject(error);
        } else {
          let statCount = 0;
          let directoryIndex = self.getEmptyDirectoryIndex();

          if (elements.length == 0) {
            resolve(directoryIndex);
          }

          elements.forEach(function (element) {
            fs.stat(joinPath(path, element), function (error, stats) {
              if (stats.isDirectory()) {
                directoryIndex.directories.push(element);
              } else if (stats.isFile()) {
                directoryIndex.files.push(element);
              }

              statCount++;
              if (statCount === elements.length) {
                resolve(directoryIndex);
              }
            });
          });
        }
      });
    }).catch((error) => {
      logger.error(`Failed to readDirectory(${path}) error:`, error);
    });
  }

  directoryExists(path) {
    return this._exists(path);
  }

  createDirectoryIfNotExists(pathToFolder) {
    let self = this;

    return new Promise(function (resolve, reject) {
      self.directoryExists(pathToFolder).then(function (exists) {
        if (!exists) {
          fs.mkdir(pathToFolder, { recursive: true }, function (error) {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    }).catch((error) => {
      logger.error(`Failed to createDirectoryIfNotExists(${pathToFolder}) error:`, error);
    });
  }

  deleteDirectory(path) {
    return new Promise(function (resolve, reject) {
      fs.rmdir(path, function (error) {
        error ? reject(error) : resolve();
      });
    }).catch((error) => {
      logger.error(`Failed to deleteDirectory(${path}) error:`, error);
    });
  }

  fileExists(path) {
    return this._exists(path);
  }

  readFile(path) {
    return new Promise(function (resolve, reject) {
      fs.readFile(path, 'utf8', function (error, content) {
        error ? reject(error) : resolve(content);
      });
    }).catch((error) => {
      logger.error(`Failed to readFile(${path}) error:`, error);
    });
  }

  writeFile(path, content = '') {
    return new Promise(function (resolve, reject) {
      fs.writeFile(path, content, function (error) {
        error ? reject(error) : resolve();
      });
    }).catch((error) => {
      logger.error(`Failed to writeFile(${path}) error:`, error);
    });
  }

  deleteFile(path) {
    return new Promise(function (resolve, reject) {
      fs.unlink(path, function (error) {
        error ? reject(error) : resolve();
      });
    }).catch((error) => {
      logger.error(`Failed to deleteFile(${path}) error:`, error);
    });
  }

  getEmptyDirectoryIndex() {
    return {
      directories: [],
      files: []
    };
  }

  _exists(path) {
    return new Promise(function (resolve) {
      fs.access(path, fs.F_OK, function (error) {
        error ? resolve(false) : resolve(true);
      });
    }).catch((error) => {
      logger.error(`Failed to _exists(${path}) error:`, error);
    });
  }
}
