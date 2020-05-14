'use strict';

const crypto = require('crypto');

exports.sign = function(message, secret) {
  message = JSON.stringify(message);
  return crypto.createHmac('sha1', secret).update(message).digest('hex');
};
