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
const handleToken = token => {
  const addr = {
    local: `ws://localhost:3001`,
    network: `ws://192.168.0.92:3001`,
    remote: `ws://ws.rudenko.tech/life/api`
  }

  const handleOpen = () => console.log(`Connection established. ${token}`);
  const handleMessage = msg => {
    const executeScenario = (msgdata, socket) => {
      const allowedTypes = ['INITIALIZE', 'UPDATE_STATE'];
      const type = msgdata.type;
      const data = msgdata.data;
      switch (type) {
        case 'INITIALIZE':
          gameInstance = new LifeGame(data.user, data.settings);
          gameInstance.init();
          gameInstance.setState(data.state);
          gameInstance.send = (data) => {
            const type = 'ADD_POINT';
            socket.send(JSON.stringify({type, data}));
          };
          break;
        case 'UPDATE_STATE':
          gameInstance.setState(data);
          break;
        default:
          throw new Error(`Message type error. Expected one of following types: ${allowedTypes}; got: ${type}`);
      }
    }
    try {
      executeScenario(JSON.parse(msg.data), socket);
    } catch (e) {
      return console.log(e.message);
    }
  }
  const handleError = error => {
    console.log('Socket error: ', error);
  }
  const handleClose = event => {
    console.log(`Connection closed.\nCode: ${event.code},\nReason: ${event.reason}`);
    gameInstance = null;
  }
  const createSocket = (url, params) => {
    const keys = Object.keys(params);
    const path = keys.map(key => `${key}=${params[key]}`).join('&');
    return new WebSocket(url+'/?'+path);
  }

  const socket = createSocket(addr.local, {token});
  socket.onopen = handleOpen;
  socket.onmessage = handleMessage;
  socket.onerror = handleError;
  socket.onclose = handleClose;
}

App.onToken = handleToken;
