import * as soundworks from 'soundworks/client';
import ScreenExperience from './ScreenExperience';

window.addEventListener('load', () => {
  const socketIO = window.CONFIG && window.CONFIG.SOCKET_CONFIG;
  const appName = window.CONFIG && window.CONFIG.APP_NAME;

  soundworks.client.init('screen', { socketIO, appName });
  const experience = new ScreenExperience();
  soundworks.client.start();
});
