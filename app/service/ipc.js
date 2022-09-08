'use strict';

const { v4: uuidv4 } = require('uuid');
const Service = require('egg').Service;

class IpcService extends Service {
  register() {
    const { ctx: { app,
      app: { messenger, config: { channelMessageToApp, errorCode } },
      service: { websocket },
    } } = this;
    messenger.on(channelMessageToApp, async params => {
      const { traceId, identity, action, data } = params;
      if (!websocket.getClient(identity)) {
        return messenger.sendToApp(traceId, {
          ok: false,
          code: errorCode.noClient,
          message: `${websocket.getClientInfo(identity)} not connected`,
        });
      }

      const { service: { actions } } = app.createAnonymousContext();
      try {
        const list = action.split('.');
        const property = list.pop();
        const instance = list.reduce((map, key) => map[key], actions);
        const result = await instance[property](identity, data);
        messenger.sendToApp(traceId, { ok: true, data: result });
      } catch (err) {
        messenger.sendToApp(traceId, { ok: false, message: err.stack });
      }
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
        messenger.removeAllListeners(traceId);
      };

      messenger.on(traceId, response => {
        if (response.code === errorCode.noClient && ++count !== workers) {
          return;
        }
        done(response);
      });
    });
  }

  async request(options, action, data = {}) {
    const { ctx: { logger, app: { messenger, config: { channelMessageToApp, httpTimeout } } } } = this;
    const { appId, agentId, clientId } = options;
    const identity = this.composeClientIdentity(appId, agentId, clientId);
    const traceId = uuidv4();
    // logger.info(`[ipc.request] [${traceId}] <${JSON.stringify(options)}> execute ${action} request: ${JSON.stringify({ action, data })}`);
    messenger.sendToApp(channelMessageToApp, { traceId, identity, action, data });

    const tasks = [];
    tasks.push(this.timeout(data.expiredTime || httpTimeout, action));
    tasks.push(this.waitForResponse(traceId));
    const response = await Promise.race(tasks);
    // logger.info(`[ipc.request] [${traceId}] <${JSON.stringify(options)}> execute ${action} response: ${JSON.stringify(response)}`);
    return response;
  }
}

module.exports = IpcService;
