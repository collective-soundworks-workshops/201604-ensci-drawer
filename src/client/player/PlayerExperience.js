import * as soundworks from 'soundworks/client';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const viewTemplate = `
  <div class="background">
    <canvas id="canvas-1"></canvas>
    <canvas id="canvas-2"></canvas>
    <canvas id="canvas-3"></canvas>
  </div>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

const descriptor = 'orientation';

export default class PlayerExperience extends soundworks.Experience {
  constructor(audioFiles) {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.network = this.require('network');
    this.motionInput = this.require('motion-input', {
      descriptors: [descriptor]
    });

    // this.processAccelerationStream = this.processAccelerationStream.bind(this);
    this.calibrateOrientationStream = this.calibrateOrientationStream.bind(this);
    this.processOrientationStream = this.processOrientationStream.bind(this);
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `Draw` };
    this.viewCtor = soundworks.CanvasView;
    this.view = this.createView();

    this.currentYPosition = 0;

    this.xStack = new Array(4);
    this.xStack.fill(0);

    this.yStack = new Array(4);
    this.yStack.fill(0);

    this.xPointer = 0;
    this.yPointer = 0;
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    this.surface = new soundworks.TouchSurface(this.view.$el);

    this.surface.addListener('touchstart', () => {
      if (this.motionInput.isAvailable(descriptor)) {
        switch (descriptor) {
          // case 'accelerationIncludingGravity':
          //   this.motionInput.addListener('accelerationIncludingGravity', this.processAccelerationStream);
          //   break;
          case 'orientation':
            this.motionInput.addListener('orientation', this.calibrateOrientationStream);
        }
      }
    });

    this.surface.addListener('touchmove', (id, x, y) => {
      this.currentYPosition = y;
    });

    this.surface.addListener('touchend', () => {
      if (this.motionInput.isAvailable(descriptor)) {
        switch (descriptor) {
          // case 'accelerationIncludingGravity':
          //   this.motionInput.removeListener('accelerationIncludingGravity', this.processAccelerationStream);
          //   break;
          case 'orientation':
            this.motionInput.removeListener('orientation', this.processOrientationStream);
            this.xStack.fill(0);
            this.yStack.fill(0);
            this.network.send('screen', 'reset:point', client.index);
        }
      }
    });
  }

  // orientation strategy
  calibrateOrientationStream(data) {
    this.xCalibration = data[0];
    this.yCalibration = data[1];
    this.lastX = this.orientationCalibration;
    this.motionInput.removeListener('orientation', this.calibrateOrientationStream);
    this.motionInput.addListener('orientation', this.processOrientationStream);
  }

  processOrientationStream(data) {
    let x = data[0] - this.xCalibration;

    if (x > 180)
      x -= 360;
    else if (x < -180)
      x += 360;

    let y = data[1] - this.yCalibration;

    // to radians
    x = (x / 360) * (Math.PI * 2);
    y = (y / 360) * (Math.PI * 2);
    // clip
    x = Math.min(Math.PI / 4, Math.max(x, -Math.PI / 4));
    y = Math.min(Math.PI / 4, Math.max(y, -Math.PI / 4));
    // moving average
    x = this.movingAverageX(x);
    y = this.movingAverageY(y);
    const opacity = this.currentYPosition; // from y position on the screen
    // message : client.index, x, y, opacity
    this.network.send('screen', 'draw:point', client.index, -x, -y, opacity);
  }

  // // acceleration including gravity
  // processAccelerationStream(data) {
  //   const g = 9.81;
  //   const x = data[0]; // -g...g
  //   const z = data[2]; // -g...g
  //   // clip between -1 and 1 to avoid NaN in `asin`
  //   const xNorm = Math.min(1, Math.max(x / g, -1)); // -1..1
  //   const zNorm = Math.min(1, Math.max(z / g, -1)); // -1..1
  //   const xAngle = Math.asin(xNorm);  // Math.PI * 180; // -90...90
  //   const zAngle = Math.asin(zNorm);  // Math.PI * 180; // -90...90
  //   // clip angle
  //   let xClippedAngle = Math.min(Math.PI / 4, Math.max(xAngle, -Math.PI / 4));
  //   let zClippedAngle = Math.min(Math.PI / 4, Math.max(zAngle, -Math.PI / 4));
  //   // low pass
  //   xClippedAngle = this.movingAverageX(xClippedAngle);
  //   zClippedAngle = this.movingAverageY(zClippedAngle);
  //   // console.log(xClippedAngle, zClippedAngle);
  //   const opacity = this.currentYPosition; // from y position on the screen
  //   // message : client.index, x, y, opacity
  //   this.network.send('screen', 'draw:point', client.index, xClippedAngle, zClippedAngle, opacity);
  // }

  //
  movingAverageX(val) {
    const average = this._movingAverage(val, this.xStack, this.xPointer);
    // update pointer
    this.xPointer = (this.xPointer + 1) % this.xStack.length;
    return average;
  }

  movingAverageY(val) {
    const average = this._movingAverage(val, this.yStack, this.yPointer);
    // update pointer
    this.yPointer = (this.yPointer + 1) % this.yStack.length;
    return average;
  }

  _movingAverage(val, stack, pointer) {
    const l = stack.length;
    let sum = 0;

    stack[pointer] = val;

    for (let i = 0; i < l; i++)
      sum += stack[i];

    return sum / l;
  }
}
