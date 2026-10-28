const babelRegister = require('@babel/register');
(babelRegister.default ?? babelRegister)({
  ignore: [/node_modules/],
  extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts'],
});
require('src');
