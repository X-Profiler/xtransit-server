'use strict';

const Controller = require('egg').Controller;

class ManagerController extends Controller {
  async shutdown() {
    const { ctx, ctx: { service: { ipc } } } = this;
    const { appId, agentId, oldClientId: clientId } = ctx.request.body;
    const options = { appId, agentId, clientId };
    ctx.body = await ipc.request(options, 'manager.shutdown');
  }

  async checkClientAlive() {
    const { ctx, ctx: { service: { ipc } } } = this;
    const { clients } = ctx.request.body;
    if (!Array.isArray(clients)) {
      return (ctx.body = { ok: false, message: 'clients must be array' });
    }

    const data = {};
    for (let index = 0; index < clients.length; index++) {
      const response = await ipc.request(clients[index], 'manager.checkClientAlive');
      data[index] = response.ok;
    }

    ctx.body = { ok: true, data };
  }

  async execCommand() {
    const { ctx, ctx: { service: { ipc } } } = this;
    const { appId, agentId, clientId, command, expiredTime } = ctx.request.body;
    const options = { appId, agentId, clientId };
    ctx.body = await ipc.request(options, 'manager.execCommand', { command, expiredTime });
  }
}

module.exports = ManagerController;
