'use strict';

const fs = require('fs');
const path = require('path');

const baseConfig = require('./config.default')();
baseConfig.env = 'local';

const envFile = path.join(__dirname, 'env');
if (!fs.existsSync(envFile)) {
  module.exports = baseConfig;
  return;
}

const env = fs.readFileSync(envFile, 'utf8').trim();
const envConfigFile = path.join(__dirname, `config.${env}.js`);
if (!fs.existsSync(envConfigFile)) {
  module.exports = baseConfig;
  return;
}

module.exports = Object.assign(baseConfig, require(envConfigFile)(), { env });
