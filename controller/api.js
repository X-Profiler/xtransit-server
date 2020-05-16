'use strict';

const { v4: uuidv4 } = require('uuid');
const { agentSplitter } = require('../config');
const utils = require('../lib/utils');
const { shutdown, send } = require('../lib/ws');

exports.shutdown = async function(ctx) {
  const { appId, agentId, oldClientId: clientId } = ctx.request.body;
  const clientIdentity = [appId, agentId, clientId].join(agentSplitter);
  const ws = utils.getClient(clientIdentity);
  shutdown(uuidv4(), 'new client connected, current client will be closed.', ws);
  ctx.body = { ok: true };
};

exports.checkClientAlive = async function(ctx) {
  const { clients } = ctx.request.body;
  if (!Array.isArray(clients)) {
    return (ctx.body = { ok: false, message: 'clients must be array' });
  }

  const data = clients.reduce((res, { appId, agentId, clientId }, index) => {
    const clientIdentity = [appId, agentId, clientId].join(agentSplitter);
    res[index] = !!utils.getClient(clientIdentity);
    return res;
  }, {});

  ctx.body = { ok: true, data };
};

exports.execCommand = async function(ctx) {
  const { appId, agentId, clientId, command, expiredTime } = ctx.request.body;
  const clientIdentity = [appId, agentId, clientId].join(agentSplitter);
  const client = utils.getClient(clientIdentity);
  if (!client) {
    return (ctx.body = { ok: false, message: `${utils.getClientInfo(clientIdentity)} not connected` });
  }
  const response = await send('exec_command', { command, expiredTime }, client);

  ctx.body = { ok: true, data: response };
};
