'use strict';

const { v4: uuidv4 } = require('uuid');
const Service = require('egg').Service;

class IpcService extends Service {
  register() {
    const { ctx: { app,
      app: { messenger, config: { channelMessageToApp, errorCode } },
      service: { websocket },
    } } = this;

    const handledActions = new Map();

    messenger.on(channelMessageToApp, async params => {
      const { traceId, clients, identity, action, data } = params;

      // check duplicate action
      if (handledActions.get(traceId)) {
        return;
      }
      handledActions.set(traceId, true);

      const responseList = [];
      const broadcast = Array.isArray(clients);

      const identities = broadcast
        ? clients.map(({ appId, agentId, clientId }) => this.composeClientIdentity(appId, agentId, clientId))
        : [identity];

      for (const identity of identities) {
        if (!websocket.getClient(identity)) {
          responseList.push({
            ok: false,
            code: errorCode.noClient,
            message: broadcast ? undefined : `${websocket.getClientInfo(identity)} not connected`,
          });
          continue;
        }

        const { service: { actions } } = app.createAnonymousContext();
        try {
          const list = action.split('.');
          const property = list.pop();
          const instance = list.reduce((map, key) => map[key], actions);
          const result = await instance[property](identity, data);
          responseList.push({ ok: true, data: result });
        } catch (err) {
          responseList.push({ ok: false, message: err.stack });
        }
      }

      if (broadcast) {
        messenger.sendToApp(traceId, responseList);
      } else {
        messenger.sendToApp(traceId, responseList[0]);
      }

      handledActions.delete(traceId);
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

  waitForResponse(traceId, broadcast = false) {
    const { ctx: { app: { messenger, config: { errorCode }, options: { workers } } } } = this;

    return new Promise(resolve => {
      const responseList = [];
      let count = 0;

      const done = response => {
        resolve(response);
        messenger.removeAllListeners(traceId);
      };

      messenger.on(traceId, response => {
        if (broadcast) {
          responseList.push(response);
          if (++count === workers) {
            done(responseList);
          }
          return;
        }

        if (response.code === errorCode.noClient && ++count !== workers) {
          return;
        }
        done(response);
      });
    });
  }

  async request(client, action, data = {}) {
    const { ctx: { app: { messenger, config: { channelMessageToApp, httpTimeout } } } } = this;
    const { appId, agentId, clientId } = client;
    const identity = this.composeClientIdentity(appId, agentId, clientId);
    const traceId = uuidv4();
    // logger.info(`[ipc.request] [${traceId}] <${JSON.stringify(client)}> execute ${action} request: ${JSON.stringify({ action, data })}`);
    messenger.sendToApp(channelMessageToApp, { traceId, identity, action, data });

    const tasks = [];
    tasks.push(this.timeout(data.expiredTime || httpTimeout, action));
    tasks.push(this.waitForResponse(traceId));
    const response = await Promise.race(tasks);
    // logger.info(`[ipc.request] [${traceId}] <${JSON.stringify(client)}> execute ${action} response: ${JSON.stringify(response)}`);
    return response;
  }

  async broadcast(clients, action, data = {}) {
    const { ctx: { app: { messenger, config: { channelMessageToApp, httpTimeout } } } } = this;
    const traceId = uuidv4();
    messenger.sendToApp(channelMessageToApp, { traceId, clients, action, data });

    const tasks = [];
    tasks.push(this.timeout(data.expiredTime || httpTimeout, action));
    tasks.push(this.waitForResponse(traceId, true));
    const response = await Promise.race(tasks);
    return response;
  }
}

module.exports = IpcService;
