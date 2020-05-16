'use strict';

const apiController = require('./controller/api');

module.exports = router => {
  router.post('/xapi/shutdown', apiController.shutdown);
  router.post('/xapi/check_client_alive', apiController.checkClientAlive);
  router.post('/xapi/exec_command', apiController.execCommand);
};
