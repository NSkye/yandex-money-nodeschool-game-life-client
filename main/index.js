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
let initialized = false;

const addr = {
  local: `ws://localhost:3001`,
  network: `ws://192.168.0.92:3001`,
  remote: `ws://ws.rudenko.tech/life/api`
}

App.onToken = (token) => {
  const socket = io.connect(addr.local, {
    transports: ['websocket'],
    path: `/`,
    query: {token},
    reconnection: true
  });
  let disableLogOfFirstSuccessfullConnection = false;
  const executeScenario = (message, socket) => {
    const allowedTypes = ['INITIALIZE', 'UPDATE_STATE'];
    const type = message.type;
    const data = message.data;
    switch (type) {
      case 'INITIALIZE':
        if (!initialized) {
          gameInstance = new LifeGame(data.user, data.settings);
          gameInstance.init();
          gameInstance.setState(data.state);
          gameInstance.send = data => {
            socket.emit('message', {type: 'ADD_POINT', data});
          };
          initialized = true;
        }
        break;
      case 'UPDATE_STATE':
        gameInstance.setState(data);
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
  const handleReconnection = attempts => console.log(`Successfully reconnected with token ${token} after ${attempts} attempts`);
  const handleError = (error) => console.log(`Socket error occured:`, error);
  const handleDisconnection = event => {
    console.log(`Disconnected. Reason: ${event}\nStarting reconnection...`);
  };
  const handleConnectionError = error => {
    console.log(`Connection error:`, error, `\nStarting reconnection...`);
    disableLogOfFirstSuccessfullConnection = true; //Если мы переподключаемся, то нам уже и так будут выводиться логи из handleReconnection
  };
  const handleConnectionTimeout = () => {
    console.log(`Connection timeout.` `\nStarting reconnection...`);
  };

  socket.on('connect', handleConnection);
  socket.on('reconnect', handleReconnection);
  socket.on('message', handleMessage);
  socket.on('error', handleError);
  socket.on('disconnect', handleDisconnection);
  socket.on('connect_error', handleConnectionError);
  socket.on('connect_timeout', handleConnectionTimeout);
};
