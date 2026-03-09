import Phaser from "phaser";

const tileToPoint = (tile, size) => {
  const center = size / 2;
  const radius = size * 0.38;
  const angle = (Math.PI * 2 * (tile % 52)) / 52;
  return {
    x: center + Math.cos(angle - Math.PI / 2) * radius,
    y: center + Math.sin(angle - Math.PI / 2) * radius
  };
};

export class LudoScene extends Phaser.Scene {
  constructor() {
    super("LudoScene");
    this.tokens = {};
  }

  init(data) {
    this.onEmit = data.onEmit;
    this.getState = data.getState;
  }

  create() {
    const size = Math.min(this.scale.width, this.scale.height);
    this.size = size;
    this.add.rectangle(size / 2, size / 2, size - 8, size - 8, 0xf8fafc).setStrokeStyle(4, 0x334155);

    for (let i = 0; i < 52; i += 1) {
      const p = tileToPoint(i, size);
      this.add.circle(p.x, p.y, 8, i % 2 ? 0x93c5fd : 0xa7f3d0, 0.7);
    }

    this.dice = this.add.rectangle(size * 0.5, size * 0.5, 50, 50, 0xf59e0b).setStrokeStyle(2, 0x92400e);
    this.diceText = this.add.text(size * 0.5 - 6, size * 0.5 - 10, "-", { color: "#111827", fontSize: "20px" });

    this.renderState(this.getState());
  }

  renderState(state) {
    if (!state?.players) return;

    state.players.forEach((p, index) => {
      const color = index === 0 ? 0xef4444 : 0x2563eb;
      this.tokens[p.id] = this.tokens[p.id] || [];

      state.tokens[p.id].forEach((pos, tokenIndex) => {
        if (!this.tokens[p.id][tokenIndex]) {
          this.tokens[p.id][tokenIndex] = this.add.circle(this.size * 0.2 + tokenIndex * 20, this.size * (index ? 0.8 : 0.2), 10, color);
        }

        const sprite = this.tokens[p.id][tokenIndex];
        if (pos < 0) {
          const bx = this.size * (index ? 0.8 : 0.2);
          const by = this.size * (index ? 0.8 : 0.2);
          this.tweens.add({ targets: sprite, x: bx + tokenIndex * 16, y: by, duration: 250 });
          return;
        }

        const world = pos > 51 ? 51 : pos;
        const point = tileToPoint(world, this.size);
        this.tweens.add({ targets: sprite, x: point.x, y: point.y, duration: 300, ease: "Sine.easeInOut" });
      });
    });
  }

  animateDice(value) {
    this.tweens.add({
      targets: this.dice,
      angle: 360,
      yoyo: true,
      scale: 1.2,
      duration: 350,
      onComplete: () => {
        this.dice.setScale(1);
        this.dice.setAngle(0);
        this.diceText.setText(String(value));
      }
    });
  }
}

export const createGame = (parent, hooks) => {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 640,
    height: 640,
    backgroundColor: "#e2e8f0",
    scene: [class extends LudoScene {
      constructor() {
        super();
      }
      init() {
        super.init(hooks);
      }
    }]
  });
};