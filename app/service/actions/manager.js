'use strict';

const Service = require('egg').Service;

class ManagerService extends Service {
  async shutdown(identity) {
    const { ctx: { service: { websocket } } } = this;
    const ws = websocket.getClient(identity);
    websocket.shutdown('new client connected, current client will be closed.', ws);
  }

  async checkClientAlive() {
    return { exists: true };
  }

  async execCommand(identity, data) {
    const { ctx: { service: { websocket } } } = this;
    const ws = websocket.getClient(identity);
    const response = await websocket.send('exec_command', data, ws);
    return response;
  }
}

module.exports = ManagerService;
