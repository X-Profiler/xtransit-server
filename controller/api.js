'use strict';

const { v4: uuidv4 } = require('uuid');
const { agentSplitter } = require('../config');
const utils = require('../lib/utils');
const { shutdown } = require('../lib/ws');

exports.shutdown = async function(ctx) {
  const { appId, agentId, oldClientId: clientId } = ctx.request.body;
  const clientIdentity = [appId, agentId, clientId].join(agentSplitter);
  const ws = utils.getClient(clientIdentity);
  shutdown(uuidv4(), 'new client connected, current client will be closed.', ws);
};
