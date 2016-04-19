import * as soundworks from 'soundworks/client';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

const colorMap = [
  '#44C7F1', '#37C000', '#F5D900', '#F39300',
  '#EC5D57', '#B36AE2', '#00FDFF', '#FF80BE',
  '#CAFA79', '#FFFF64', '#FF9EFF', '#007AFF'
];

class PathRenderer extends soundworks.Renderer {
  constructor(color) {
    super(0);

    this.color = color;
    this.currentPoint = [];
    this.lastPoint = [0, 0];
    this.hasChanged = false;
  }

  setPoint(x, y, opacity) {
    this.currentPoint[0] = x;
    this.currentPoint[1] = y;
    this.currentPoint[2] = opacity;
    this.hasChanged = true;
  }

  reset() {
    this.lastPoint[0] = 0;
    this.lastPoint[1] = 0;
  }

  render(ctx) {
    if (!this.hasChanged)
      return;

    const halfWidth = this.canvasWidth / 2;
    const halfHeight = this.canvasHeight / 2;
    const x = Math.tan(this.currentPoint[0]) * halfWidth;
    const y = Math.tan(this.currentPoint[1]) * halfHeight;

    ctx.save();
    ctx.translate(halfWidth, halfHeight);
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = this.currentPoint[2];
    ctx.moveTo(this.lastPoint[0], this.lastPoint[1]);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();

    this.lastPoint[0] = x;
    this.lastPoint[1] = y;
    this.hasChanged = false;
  }
}

export default class ScreenExperience extends soundworks.Experience {
  constructor() {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.network = this.require('network');

    this.renderPoint = this.renderPoint.bind(this);
    this.resetPoint = this.resetPoint.bind(this);
    this.renderers = {};
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `` };
    this.viewCtor = soundworks.CanvasView;
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    this.network.receive('draw:point', this.renderPoint);
    this.network.receive('reset:point', this.resetPoint);
  }

  renderPoint(clientIndex, xAngle, yAngle, opacity) {
    if (!this.renderers[clientIndex]) {
      const color = colorMap[clientIndex % colorMap.length];
      this.renderers[clientIndex] = new PathRenderer(color);
      this.view.addRenderer(this.renderers[clientIndex]);
    }

    this.renderers[clientIndex].setPoint(xAngle, yAngle, opacity);
  }

  resetPoint(clientIndex) {
    if (this.renderers[clientIndex])
      this.renderers[clientIndex].reset();
  }
}
