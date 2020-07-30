'use strict';

const address = require('address');
const { serverPort, agentSplitter } = require('../config');
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
    data = { code: 'HTTPREQUESTFAILED' };
  }
  return data;
}

module.exports = {
  async getAppSecret(appId) {
    return await manager('/xtransit/app_secret', { appId }, 'getAppSecret');
  },

  async updateClient(appId, agentId, clientId, timestamp) {
    const server = `${address.ip()}:${serverPort}`;
    return await manager('/xtransit/update_client', { appId, agentId, clientId, server, timestamp }, 'updateClient');
  },

  async removeClient(clinetIdentity) {
    if (!clinetIdentity) {
      return;
    }
    const [appId, agentId, clientId] = clinetIdentity.split(agentSplitter);
    return await manager('/xtransit/remove_client', { appId, agentId, clientId }, 'removeClient');
  },

  async sendLog(appId, agentId, log) {
    return await manager('/xtransit/log', { appId, agentId, log }, 'sendLog');
  },

  async updateActionStatus(appId, agentId, filePath) {
    return await manager('/xtransit/update_action_status', { appId, agentId, filePath }, 'sendActionResult');
  },
};
