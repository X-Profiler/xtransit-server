'use strict';

const address = require('address');
const { webPort } = require('../config');
const request = require('../proxy/request');
const logger = require('../proxy/logger');

async function manager(url, body, func) {
  let data;
  try {
    const res = await request(url, body);
    data = res.data.toString();
  } catch (err) {
    logger.error(`${func} http failed: ${err}, raw data: ${data}`);
    data = { code: 'HTTPREQUESTFAILED' };
    return data;
  }

  try {
    data = JSON.parse(data);
    if (data.ok) {
      data = data.data;
    } else {
      logger.error(`${func} message failed: ${data.message}`);
      data = {};
    }
  } catch (err) {
    logger.error(`${func} parse failed: ${err}, raw data: ${data}`);
  }
  return data;
}

module.exports = {
  async getAppSecret(appId) {
    return await manager('/xtransit/app_secret', { appId }, 'getAppSecret');
  },

  async updateClient(appId, agentId, clientId, timestamp) {
    const server = `${address.ip()}::${webPort}`;
    return await manager('/xtransit/client_status', { appId, agentId, clientId, server, timestamp }, 'getAppSecret');
  },
};
