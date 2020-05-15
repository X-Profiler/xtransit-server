'use strict';

module.exports = () => {
  const config = {};

  config.wsPort = 9090;

  config.webPort = 9091;

  config.httpTimeout = 15000;

  config.xtransitManager = '';

  config.security = {
    secret: 'easy-monitor::xprofiler',
  };

  return config;
};
