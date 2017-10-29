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
const types = {
  "INITIALIZE": (data, socket) => {
    gameInstance = new LifeGame(data.user, data.settings);
    gameInstance.init();
    gameInstance.setState(data.state);
    gameInstance.send = data => {
      const type = 'ADD_POINT';
      socket.send(JSON.stringify({type, data}));
    };
  },
  "UPDATE_STATE": data => {
    gameInstance.setState(data);
  }
};

App.onToken = function (token) {
  const socket = new WebSocket(`ws://ws.rudenko.tech/life/api/?token=${token}`);
  socket.onopen = () => {
    console.log(`Connection established with token=${token}`);
  }
  socket.onmessage = (msg) => {
    try {
      const msgdata = JSON.parse(msg.data);
      if (!types[msgdata.type]) {
        throw new Error(`Message type error. Expected one of following types: ${Object.keys(types)}; got: ${msgdata.type}`);
      }
      types[msgdata.type](msgdata.data, socket);
    } catch (e) {
      return console.log(e.message);
    }
  }
  socket.onerror = error => {
    console.log('Socket error: ', error);
  }
  socket.onclose = event => {
    console.log(`
      Connection closed.
      Code: ${event.code},
      Reason: ${event.reason}`);
    gameInstance = null;
  }
}
