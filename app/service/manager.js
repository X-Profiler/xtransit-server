'use strict';

const address = require('address');
const Service = require('egg').Service;

class ManagerService extends Service {
  async request(url, data, func) {
    const { ctx, ctx: { logger, app: { sign, config:
      { xtransitManager, httpTimeout, secure: { secret } } } } } = this;

    let response;
    try {
      const options = {
        method: 'POST',
        data,
        timeout: data.expiredTime || httpTimeout,
        contentType: 'json',
      };
      const requestUrl = `${xtransitManager}${url}`;
      data.signature = sign(data, secret);
      const res = await ctx.curl(requestUrl, options);
      response = res.data.toString();
    } catch (err) {
      logger.error(`${func} http failed: ${err}, raw data: ${data}`);
      response = { code: 'HTTPREQUESTFAILED' };
      return response;
    }

    try {
      response = JSON.parse(response);
      if (response.ok) {
        response = response.data;
      } else {
        logger.error(`${func} message failed: ${response.message}`);
        response = {};
      }
    } catch (err) {
      logger.error(`${func} parse failed: ${err}, raw data: ${response}`);
      response = { code: 'HTTPREQUESTFAILED' };
    }
    return response;
  }

  async getAppSecret(appId) {
    return await this.request('/xtransit/app_secret', { appId }, 'getAppSecret');
  }

  async updateClient(appId, agentId, clientId, timestamp) {
    const { ctx: { app } } = this;
    const server = `${address.ip()}:${app.server.address().port}`;
    return await this.request('/xtransit/update_client', { appId, agentId, clientId, server, timestamp }, 'updateClient');
  }

  async removeClient(clinetIdentity) {
    if (!clinetIdentity) {
      return;
    }
    const { ctx: { app: { config: { agentSplitter } } } } = this;
    const [appId, agentId, clientId] = clinetIdentity.split(agentSplitter);
    return await this.request('/xtransit/remove_client', { appId, agentId, clientId }, 'removeClient');
  }

  async sendLog(appId, agentId, log) {
    return await this.request('/xtransit/log', { appId, agentId, log }, 'sendLog');
  }

  async updateActionStatus(appId, agentId, filePath) {
    return await this.request('/xtransit/update_action_status', { appId, agentId, filePath }, 'sendActionResult');
  }
}

module.exports = ManagerService;
