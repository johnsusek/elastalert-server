import {join as joinPath } from 'path';
import FileSystem from '../../common/file_system';
import config from '../../common/config';

export default class TemplatesController {
  constructor() {
    this._fileSystemController = new FileSystem();
    this.templatesFolder = this._getTemplatesFolder();
    this.rulesFolder = this._getRulesFolder();
  }

  create(type, path) {
    return this._createFolder(type, path);
  }

  delete(type, path) {
    return this._deleteFolder(type, path);
  }

  _deleteFolder(type, path) {
    let folder;

    if (type === 'templates') {
      folder = this.templatesFolder;
    }
    else if (type === 'rules') {
      folder = this.rulesFolder;
    }
    else {
      return this._getErrorPromise(new Error(':type should be "rules" or "templates"'));
    }

    const folderPath = joinPath(folder, path);
    return this._fileSystemController.deleteDirectory(folderPath);
  }

  _createFolder(type, path) {
    let folder;

    if (type === 'templates') {
      folder = this.templatesFolder;
    }
    else if (type === 'rules') {
      folder = this.rulesFolder;
    }
    else {
      return this._getErrorPromise(new Error(':type should be "rules" or "templates"'));
    }

    const folderPath = joinPath(folder, path);
    return this._fileSystemController.createDirectoryIfNotExists(folderPath);
  }

  _getErrorPromise(error) {
    return new Promise(function (resolve, reject) {
      reject(error);
    }).catch((error) => {
      reject(error);
    });
  }

  _getTemplatesFolder() {
    const templateFolderSettings = config.get('templatesPath');

    if (templateFolderSettings.relative) {
      return joinPath(config.get('elastalertPath'), templateFolderSettings.path);
    } else {
      return templateFolderSettings.path;
    }
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
