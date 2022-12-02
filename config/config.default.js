'use strict';

module.exports = appInfo => {
  const config = {};

  config.keys = appInfo.name + '_1588763650298_5886';

  config.agentKey = Symbol('XTRANSIT::ID');

  config.agentSplitter = '\u0000';

  config.httpTimeout = 15000;

  config.wsValidTime = 75 * 1000;

  config.channelMessageToApp = 'XPROFILER::CHANNEL_MESSAGE_TO_APP';

  config.errorCode = {
    expired: 'XPROFILER_EXPIRED',
    noClient: 'XPROFILER_NO_CLIENT',
  };

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

  // user config
  const userConfig = {};

  userConfig.xtransitManager = 'http://127.0.0.1:8543';

  userConfig.checkValid = true;

  return {
    ...config,
    ...userConfig,
  };
};
