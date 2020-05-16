'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');
const config = require('../config');

const clients = {};

exports.sign = function(message, secret) {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }
  return crypto.createHmac('sha1', secret).update(message).digest('hex');
};

exports.setClient = function(clientId, client) {
  clients[clientId] = client;
};

exports.deleteClient = function(clientId) {
  delete clients[clientId];
};

exports.getClient = function(clientId) {
  return clients[clientId];
};

exports.getClientInfo = function(clientIdentity) {
  const { agentSplitter } = config;
  let info = 'client';
  if (clientIdentity) {
    info = `client [${clientIdentity.split(agentSplitter).join(', ')}]`;
  }
  return info;
};

exports.responseEvent = new EventEmitter();
