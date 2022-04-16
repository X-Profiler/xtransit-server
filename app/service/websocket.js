'use strict';

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const Service = require('egg').Service;

const clients = new Map();
const event = new EventEmitter();

class WebSocketService extends Service {
  setClient(clientId, client) {
    clients.set(clientId, client);
  }

  deleteClient(clientId) {
    clients.delete(clientId);
  }

  getClient(clientId) {
    return clients.get(clientId);
  }

  getClientInfo(clientIdentity) {
    const { ctx: { app: { config: { agentSplitter } } } } = this;
    let info = 'client';
    if (clientIdentity) {
      info = `client [${clientIdentity.split(agentSplitter).join(', ')}]`;
    }
    return info;
  }

  emit(traceId, data) {
    event.emit(traceId, data);
  }

  shutdown(message, socket, traceId) {
    if (!socket) {
      return;
    }

    traceId = traceId || uuidv4();
    const { ctx: { logger, app: { config: { agentKey } } } } = this;
    const extra = this.getClientInfo(socket[agentKey]);
    logger.error(`${extra} shutdown: ${message}`);
    const data = { traceId, type: 'shutdown' };
    socket.send(JSON.stringify(data));
  }

  send(type, data, socket, traceId) {
    traceId = traceId || uuidv4();
    const body = { traceId, type, data };
    socket.send(JSON.stringify(body));

    // get response
    const { expiredTime } = data;
    return Promise.race([
      new Promise(resolve => event.once(traceId, resolve)),
      new Promise(resolve => setTimeout(() => resolve({ ok: false, message: `request: ${data} timeout` }), expiredTime)),
    ]);
  }
}

module.exports = WebSocketService;
