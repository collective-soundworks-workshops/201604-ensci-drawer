import 'source-map-support/register';
import * as soundworks from 'soundworks/server';
import PlayerExperience from './PlayerExperience';

soundworks.server.init({ appName: 'Drawer' });
const experience = new PlayerExperience(['player', 'screen']);
soundworks.server.start();
