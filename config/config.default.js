'use strict';

module.exports = appInfo => {
  const config = {};

  config.keys = appInfo.name + '_1588763650298_5886';

  config.xtransitManager = '';

  config.agentKey = Symbol('XTRANSIT::ID');

  config.agentSplitter = '\u0000';

  config.serverPort = 9090;

  config.httpTimeout = 15000;

  config.secure = {
    secret: 'easy-monitor::xprofiler',
  };

  config.security = {
    csrf: {
      ignore: [
        '/xapi',
      ],
    },
  };

  return config;
};
