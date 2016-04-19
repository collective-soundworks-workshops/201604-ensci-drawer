import { Experience } from 'soundworks/server';

export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);

    this.checkin = this.require('checkin');
    this.network = this.require('network');
  }

  enter(client) {
    super.enter(client);
  }
}
