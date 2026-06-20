const babelRegister = require('@babel/register');
(babelRegister.default ?? babelRegister)({
  ignore: [/node_modules/],
});
require('src');
