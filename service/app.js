'use strict';

const request = require('../proxy/request');
const logger = require('../proxy/logger');

module.exports = {
  async getAppSecret(appId) {
    let { data } = await request('/xtransit/app_secret', { appId });
    data = data.toString();
    try {
      data = JSON.parse(data);
      if (data.ok) {
        const { secret } = data.data;
        data = secret;
      } else {
        logger.error(`getAppSecret failed: ${data.message}`);
        data = null;
      }
    } catch (err) {
      logger.error(`getAppSecret failed: ${err}, raw data: ${data}`);
      data = null;
    }
    return data;
  },
};
