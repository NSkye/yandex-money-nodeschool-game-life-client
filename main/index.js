'use strict';

//
// YOUR CODE GOES HERE...
//
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░░░▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄░░░░░░░░░░░
// ░░░░░░░░▄▀░░░░░░░░░░░░▄░░░░░░░▀▄░░░░░░░░
// ░░░░░░░░█░░▄░░░░▄░░░░░░░░░░░░░░█░░░░░░░░
// ░░░░░░░░█░░░░░░░░░░░░▄█▄▄░░▄░░░█░▄▄▄░░░░
// ░▄▄▄▄▄░░█░░░░░░▀░░░░▀█░░▀▄░░░░░█▀▀░██░░░
// ░██▄▀██▄█░░░▄░░░░░░░██░░░░▀▀▀▀▀░░░░██░░░
// ░░▀██▄▀██░░░░░░░░▀░██▀░░░░░░░░░░░░░▀██░░
// ░░░░▀████░▀░░░░▄░░░██░░░▄█░░░░▄░▄█░░██░░
// ░░░░░░░▀█░░░░▄░░░░░██░░░░▄░░░▄░░▄░░░██░░
// ░░░░░░░▄█▄░░░░░░░░░░░▀▄░░▀▀▀▀▀▀▀▀░░▄▀░░░
// ░░░░░░█▀▀█████████▀▀▀▀████████████▀░░░░░░
// ░░░░░░████▀░░███▀░░░░░░▀███░░▀██▀░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
//
// Nyan cat lies here...
//
let gameInstance = null;

const addr = {
  local: `ws://localhost:3001`,
  network: `ws://192.168.0.92:3001`,
  remote: `ws://ws.rudenko.tech/life/api`
}

const initializeGame = (data, socket) => {
  gameInstance = new LifeGame(data.user, data.settings);
  gameInstance.init();
  gameInstance.setState(data.state);
  gameInstance.send = data => {
    socket.emit('message', {type: 'ADD_POINT', data});
  };
}
const updateGameState = (gameInstance, data) => {
  if(!data)
    throw new Error(`Message data error. No data`);
  gameInstance.setState(data);
}

App.onToken = (token) => {
  const socket = io.connect(addr.local, {
    transports: ['websocket'],
    path: `/`,
    query: {token},
    reconnection: true,
    reconnectionAttempts: 10
  });
  let disableLogOfFirstSuccessfullConnection = false;
  const executeScenario = (message, socket) => {
    const allowedTypes = ['INITIALIZE', 'UPDATE_STATE'];
    const type = message.type;
    const data = message.data;
    switch (type) {
      case 'INITIALIZE':
        if (!gameInstance) { //инициализируем только если ещё не инициализировано, при повторной инициализации появится второе поле и вообще не нужно это
          initializeGame(data, socket);
        }
        break;
      case 'UPDATE_STATE':
        updateGameState(gameInstance, data);
        break;
      default:
        throw new Error(`Message type error: expected one of types ${allowedTypes}; got: ${type}`);
    }
  }
  const handleMessage = message => {
    try {
      executeScenario(message, socket);
    } catch (e) {
      console.log(e.message);
    }
  }
  const handleConnection = () => {
    if (!disableLogOfFirstSuccessfullConnection) {
      console.log(`Connected with token ${token}`);
    }
  }
  const handleReconnectionStart = attempt => console.log(`Reconnecting... (Attempt #${attempt})`)
  const handleReconnection = attempts => console.log(`Successfully reconnected with token ${token} after ${attempts} attempts`);
  const handleFailedReconnection = () => {
    const reloadAfter = 15000;
    console.log(`All reconnection attempts failed. Page will be reloaded after ${reloadAfter/1000} seconds\nCheck "Persist Logs" if you want to keep console messages.`);
    setTimeout(() => {
      location.reload();
    }, reloadAfter);
  }
  const handleError = (error) => console.log(`Socket error occured:`, error);
  const handleDisconnection = reason => {
    console.log(`Disconnected. Reason: ${reason}`);
  };
  const handleConnectionError = error => {
    console.log(`Connection error: ${error.message}`);
    disableLogOfFirstSuccessfullConnection = true; //Если мы переподключаемся, то нам уже и так будут выводиться логи из handleReconnection
  };
  const handleConnectionTimeout = () => {
    console.log(`Connection timeout.`);
  };

  socket.on('connect', handleConnection);
  socket.on('reconnecting', handleReconnectionStart);
  socket.on('reconnect', handleReconnection);
  socket.on('reconnect_failed', handleFailedReconnection);
  socket.on('message', handleMessage);
  socket.on('error', handleError);
  socket.on('disconnect', handleDisconnection);
  socket.on('connect_error', handleConnectionError);
  socket.on('connect_timeout', handleConnectionTimeout);
};
