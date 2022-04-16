'use strict';

const Service = require('egg').Service;

class HandlerService extends Service {
  async message(ws, message) {
    const {
      ctx: {
        logger,
        service: { websocket, manager },
        app: { sign, config: { agentKey, agentSplitter } },
      },
    } = this;

    try {
      message = JSON.parse(message);
    } catch (err) {
      return logger.error(`parse message failed: ${err}, raw message: ${message}`);
    }

    // check appId / clientId
    const { traceId, appId, clientId } = message;
    if (!appId || !clientId) {
      return websocket.shutdown('appId & clientId can\'t be empty', ws, traceId);
    }

    // check signature
    const { secret, code } = await manager.getAppSecret(appId);
    if (!secret) {
      if (code !== 'HTTPREQUESTFAILED') {
        return websocket.shutdown('appId not exists', ws, traceId);
      }
      return;
    }
    const { signature, timestamp } = message;
    if (!timestamp || Date.now() - timestamp > 5 * 60 * 1000) {
      return logger.error(`[${traceId}] timestamp expired`);
    }
    delete message.signature;
    if (signature !== sign(message, secret)) {
      return websocket.shutdown('sign error', ws, traceId);
    }

    const { agentId, type } = message;
    const clientIdentity = [appId, agentId, clientId].join(agentSplitter);

    // handle heartbeat
    if (type === 'heartbeat') {
      ws[agentKey] = clientIdentity;
      await manager.updateClient(appId, agentId, clientId, timestamp);
      websocket.setClient(clientIdentity, ws);
      return;
    }

    // handle response
    if (type === 'response') {
      const { data } = message;
      websocket.emit(traceId, data);
      return;
    }

    // handle logs
    if (type === 'log') {
      const { data } = message;
      await manager.sendLog(appId, agentId, data);
      return;
    }

    // handle actions
    if (type === 'action') {
      const { filePath } = message.data;
      await manager.updateActionStatus(appId, agentId, filePath);
      return;
    }
  }

  async close(ws) {
    const { ctx: {
      logger,
      service: { websocket, manager },
      app: { config: { agentKey } },
    } } = this;

    const clinetIdentity = ws[agentKey];
    const extra = websocket.getClientInfo(clinetIdentity);
    logger.error(`${extra} has been closed.`);
    websocket.deleteClient(clinetIdentity);
    await manager.removeClient(clinetIdentity);
  }
}

module.exports = HandlerService;
