'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const Logger = require('mini-logger');
const config = require('../config');

let customLogDir;
if (config.env !== 'production') {
  customLogDir = path.join(__dirname, '../logs');
} else {
  customLogDir = path.join(os.homedir(), 'logs/xtransit-server');
}

if (!fs.existsSync(customLogDir)) {
  fs.mkdirSync(customLogDir, { recursive: true });
}

module.exports = Logger({
  dir: customLogDir,
  format: 'YYYY-MM-DD[.log]',
  timestamp: 'YYYY-MM-DD HH:mm:ss.SSS',
  stdout: true,
});
