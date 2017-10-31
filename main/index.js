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
const addr = {
  local: `ws://127.0.0.1:3001`,
  network: `ws://192.168.0.92:3001`
}

class LifeGameClient {
  constructor(address, token, reconnection=false, reconnectionAttempts=Infinity) {
    this.token = token;
    this.gameInstance = null;
    this.firstConnection = true;

    this.socket = io.connect(address, {
      transports: ['websocket'],
      path: `/`,
      query: {token: this.token},
      reconnection,
      reconnectionAttempts
    });
    this.bindListeners(this.socket, this.token);
  }

  executeScenario(msg) {
    switch (msg.type) {
      case 'INITIALIZE':
        this.initializeGame(msg.data);
        break;
      case 'UPDATE_STATE':
        this.updateGameState(msg.data);
        break;
      default:
        throw new Error(`Message type error: invalid message type ${msg.type}`);
    }
  }

  initializeGame(data) {
    if (!data) {
      throw new Error('No data was provided for initialization');
    }
    if (this.gameInstance) {
      return console.log('Game is already initialized');
    }
    this.gameInstance = new LifeGame(data.user, data.settings);
    this.gameInstance.init();
    this.gameInstance.setState(data.state);
    this.gameInstance.send = data => {
      this.socket.emit('message', {type: 'ADD_POINT', data});
    };
  }

  updateGameState(data) {
    if (!data) {
      throw new Error('No data was provided for update');
    }
    if (!this.gameInstance) {
      throw new Error("Game isn't initialized yet. Initialize game before state update");
    }
    this.gameInstance.setState(data);
  }

  bindListeners(socket, token) {
    socket.on('connect', () => {
      if(this.firstConnection) {
        console.log(`Successfully connected. Token: ${token}`);
      }
    });
    socket.on('reconnecting', attempt => {
      this.firstConnection = false;
      const logmsgattempt = (attempt > 1) ? `(${attempt-1})` : '';
      console.log(`Reconnecting... ${logmsgattempt}`);
    });
    socket.on('reconnect', attempts => console.log(`Successfully reconnected after ${attempts} attempts. Token: ${token}`));
    socket.on('reconnect_failed', () => {
      const reloadAfter = 15000;
      console.log(`All reconnection attempts failed. Page will be reloaded after ${reloadAfter/1000} seconds\nCheck "Persist Logs" if you want to keep console messages.`);
      setTimeout(() => {
        location.reload();
      }, reloadAfter);
    });
    socket.on('message', msg => {
      try {
        this.executeScenario(msg);
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    });
    socket.on('error', e => console.log(`Socket error: ${e}`));
    socket.on('disconnect', e => console.log(`Disconnected. Reason: ${e}`));
    socket.on('connect_error', e => console.log(`Connection error: ${e.message}`));
    socket.on('connect_timeout', () => console.log('Connection timeout.'));
  }
}

App.onToken = token => new LifeGameClient(addr.local, token, true, 4);
