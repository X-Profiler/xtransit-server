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
    const response = await ipc.broadcast(clients, 'manager.checkClientAlive');
    for (const list of response) {
      for (let index = 0; index < list.length; index++) {
        // status checked
        if (data[index]) {
          continue;
        }

        // set exist status
        data[index] = list[index].ok;
      }
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
