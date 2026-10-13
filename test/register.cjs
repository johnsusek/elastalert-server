// Require hook for node --test: loads the ESM source of this repo through
// Babel, the same way index.js does at runtime (scripts/start.sh).
const path = require('path');

const root = path.join(__dirname, '..');
const registerModule = require('@babel/register');
const register = typeof registerModule === 'function' ? registerModule : registerModule.default;

register({
  cwd: root,
  root: root,
  cache: false,
  extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts']
});
