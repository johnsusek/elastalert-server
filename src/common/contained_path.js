import { join, resolve, sep } from 'path';

export function containedPath(root, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.includes('\0')) {
    return null;
  }

  let rootPath = resolve(root);
  let fullPath = resolve(join(rootPath, relativePath));

  if (fullPath !== rootPath && !fullPath.startsWith(rootPath + sep)) {
    return null;
  }

  return fullPath;
}
