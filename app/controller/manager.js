'use strict';

const Controller = require('egg').Controller;

class ManagerController extends Controller {
  async shutdown() {
    const { ctx, ctx: { service: { ipc, websocket } } } = this;
    const { appId, agentId, oldClientId: clientId } = ctx.request.body;
    const clientIdentity = ipc.composeClientIdentity(appId, agentId, clientId);
    const ws = websocket.getClient(clientIdentity);
    websocket.shutdown('new client connected, current client will be closed.', ws);
    ctx.body = { ok: true };
  }

  async checkClientAlive() {
    const { ctx, ctx: { service: { ipc, websocket } } } = this;
    const { clients } = ctx.request.body;
    if (!Array.isArray(clients)) {
      return (ctx.body = { ok: false, message: 'clients must be array' });
    }

    const data = clients.reduce((res, { appId, agentId, clientId }, index) => {
      const clientIdentity = ipc.composeClientIdentity(appId, agentId, clientId);
      res[index] = !!websocket.getClient(clientIdentity);
      return res;
    }, {});

    ctx.body = { ok: true, data };
  }

  async execCommand() {
    const { ctx, ctx: { service: { ipc, websocket } } } = this;
    const { appId, agentId, clientId, command, expiredTime } = ctx.request.body;
    const clientIdentity = ipc.composeClientIdentity(appId, agentId, clientId);
    const client = websocket.getClient(clientIdentity);
    if (!client) {
      return (ctx.body = { ok: false, message: `${websocket.getClientInfo(clientIdentity)} not connected` });
    }
    const response = await websocket.send('exec_command', { command, expiredTime }, client);

    ctx.body = { ok: true, data: response };
  }
}

module.exports = ManagerController;
