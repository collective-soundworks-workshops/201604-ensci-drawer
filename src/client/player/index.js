import * as soundworks from 'soundworks/client';
import PlayerExperience from './PlayerExperience';

window.addEventListener('load', () => {
  const socketIO = window.CONFIG && window.CONFIG.SOCKET_CONFIG;
  const appName = window.CONFIG && window.CONFIG.APP_NAME;

  // initialize `player`
  soundworks.client.init('player', { socketIO, appName });
  const experience = new PlayerExperience();
  soundworks.client.start();
});
