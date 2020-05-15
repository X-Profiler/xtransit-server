'use strict';

const config = require('../config');
const utils = require('../lib/utils');
const logger = require('../proxy/logger');
const manager = require('../service/manager');

const { agentKey } = config;

module.exports = async function closeHandler() {
  const { ws } = this;
  const clinetIdentity = ws[agentKey];
  const extra = utils.getClientInfo(clinetIdentity);
  logger.error(`${extra} has been closed.`);
  utils.deleteClient(clinetIdentity);
  await manager.removeClient(clinetIdentity);
};
