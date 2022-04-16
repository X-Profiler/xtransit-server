'use strict';

module.exports = app => {
  const { router, config: { secure } } = app;
  const {
    checkSign,
  } = app.middleware.security(secure, app);

  router.post('/xapi/shutdown', checkSign, 'manager.shutdown');
  router.post('/xapi/check_client_alive', checkSign, 'manager.checkClientAlive');
  router.post('/xapi/exec_command', checkSign, 'manager.execCommand');
};
