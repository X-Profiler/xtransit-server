'use strict';

const { v4: uuidv4 } = require('uuid');
const Service = require('egg').Service;

class IpcService extends Service {
  register() {
    const { ctx: { app: { messenger, config: { channelMessageToApp } } } } = this;
    messenger.on(channelMessageToApp, async params => {
      console.log('params', params);
    });
  }

  composeClientIdentity(appId, agentId, clientId) {
    const { ctx: { app: { config: { agentSplitter } } } } = this;
    const identity = [appId, agentId, clientId].join(agentSplitter);
    return identity;
  }

  timeout(expired, action) {
    const { ctx: { app: { config: { errorCode } } } } = this;
    return new Promise(resolve => setTimeout(() => resolve({
      ok: false,
      code: errorCode.expired,
      message: `execute ${action} expired after ${expired}ms`,
    }), expired));
  }

  waitForResponse(traceId) {
    const { ctx: { app: { messenger, config: { errorCode }, options: { workers } } } } = this;

    return new Promise(resolve => {
      let count = 0;

      const done = response => {
        resolve(response);
        messenger.removeListener(traceId);
      };

      messenger.on(traceId, response => {
        if (response.code === errorCode.noClient && ++count !== workers) {
          return;
        }
        done(response);
      });
    });
  }

  async request(options, action, data) {
    const { ctx: { app: { messenger, config: { channelMessageToApp, httpTimeout } } } } = this;
    const { appId, agentId, clientId } = options;
    const identity = this.composeClientIdentity(appId, agentId, clientId);
    const traceId = uuidv4();
    messenger.sendToApp(channelMessageToApp, { traceId, identity, action, data });

    const tasks = [];
    tasks.push(this.timeout(data.expiredTime || httpTimeout, action));
    tasks.push(this.waitForResponse(traceId));
    const response = await Promise.race(tasks);
    return response;
  }
}

module.exports = IpcService;
