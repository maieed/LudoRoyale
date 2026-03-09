import Phaser from "phaser";
import boardImage from "../assets/board.png";
import tokensImage from "../assets/tokens.png";
import diceImage from "../assets/dice.png";
import {
  SAFE_TILE_INDEXES,
  BOARD_PATH,
  getSeatForPlayer,
  getTokenGrid,
  gridToPixel,
  buildMovePath,
  getStackedOffsets
} from "./GameLogic";

const tokenFrameBySeat = {
  0: 0,
  1: 2,
  2: 1,
  3: 3
};

const playBeep = (freq = 420, dur = 80) => {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  setTimeout(() => {
    osc.stop();
    ctx.close();
  }, dur);
};

export default class LudoScene extends Phaser.Scene {
  constructor(externals = {}) {
    super({ key: "LudoScene" });
    this.externals = externals;
    this.tokenSprites = new Map();
    this.lastMoveSignature = null;
    this.boardRect = { x: 0, y: 0, size: 1 };
  }

  preload() {
    this.load.image("board", boardImage);
    this.load.spritesheet("tokens", tokensImage, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("dice", diceImage, { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.cameras.main.setBackgroundColor("#0b1020");

    this.boardSprite = this.add.image(0, 0, "board");
    this.safeGraphics = this.add.graphics();
    this.tokenContainer = this.add.container(0, 0);

    this.diceSprite = this.add.sprite(0, 0, "dice", 0);
    this.diceSprite.setScale(0.9);

    const spark = this.make.graphics({ x: 0, y: 0, add: false });
    spark.fillStyle(0xffffff, 1);
    spark.fillCircle(4, 4, 4);
    spark.generateTexture("spark", 8, 8);

    this.scale.on("resize", this.handleResize, this);
    this.handleResize({ width: this.scale.width, height: this.scale.height });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.cameras.resize(width, height);

    const boardSize = Math.min(width, height) * 0.94;
    this.boardSprite.setDisplaySize(boardSize, boardSize);
    this.boardSprite.setPosition(width * 0.5, height * 0.5);

    this.boardRect = {
      x: this.boardSprite.x - boardSize * 0.5,
      y: this.boardSprite.y - boardSize * 0.5,
      size: boardSize
    };

    this.diceSprite.setPosition(width - 60, 60);
    this.drawSafeTiles();

    if (this.latestState) {
      this.positionAllTokens(this.latestState, false);
    }
  }

  drawSafeTiles() {
    this.safeGraphics.clear();
    this.safeGraphics.fillStyle(0x22c55e, 0.35);
    SAFE_TILE_INDEXES.forEach((tile) => {
      const [gx, gy] = BOARD_PATH[tile];
      const p = gridToPixel(gx, gy, this.boardRect);
      this.safeGraphics.fillCircle(p.x, p.y, Math.max(6, this.boardRect.size / 70));
    });
  }

  setExternals(externals) {
    this.externals = externals;
  }

  syncState(state, options = {}) {
    if (!state) return;
    this.latestState = state;

    this.ensureTokenSprites(state);

    const { lastMove, highlightedTokenKeys = [] } = options;

    this.updateTokenHighlight(state, highlightedTokenKeys);

    if (lastMove && lastMove.move) {
      const signature = `${lastMove.playerId}:${lastMove.move.tokenIndex}:${lastMove.move.from}->${lastMove.move.to}:${lastMove.stateVersion || "x"}`;
      if (signature !== this.lastMoveSignature) {
        this.lastMoveSignature = signature;
        this.animateTokenMove(state, lastMove);
        return;
      }
    }

    this.positionAllTokens(state, true);
  }

  ensureTokenSprites(state) {
    state.players.forEach((player) => {
      const seat = getSeatForPlayer(state, player.id);
      const tokenCount = (state.tokens[player.id] || []).length;
      for (let i = 0; i < tokenCount; i += 1) {
        const key = `${player.id}_${i}`;
        if (this.tokenSprites.has(key)) continue;

        const sprite = this.add.sprite(0, 0, "tokens", tokenFrameBySeat[seat] ?? 0);
        sprite.setScale(0.5);
        sprite.setDepth(10);
        sprite.setInteractive({ useHandCursor: true });
        sprite.on("pointerdown", () => {
          if (this.externals?.onTokenClick) {
            this.externals.onTokenClick(player.id, i);
          }
        });

        this.tokenContainer.add(sprite);
        this.tokenSprites.set(key, sprite);
      }
    });
  }

  getTokenPixel(state, playerId, tokenIndex, overridePos = null) {
    const original = state.tokens[playerId][tokenIndex];
    if (overridePos !== null) {
      state.tokens[playerId][tokenIndex] = overridePos;
    }

    const tokenGrid = getTokenGrid(state, playerId, tokenIndex);
    const px = gridToPixel(tokenGrid.x, tokenGrid.y, this.boardRect);

    if (overridePos !== null) {
      state.tokens[playerId][tokenIndex] = original;
    }

    return { ...px, tileKey: tokenGrid.tileKey };
  }

  positionAllTokens(state, useTween = true) {
    const tileMap = new Map();

    state.players.forEach((player) => {
      const tokens = state.tokens[player.id] || [];
      tokens.forEach((_, tokenIndex) => {
        const key = `${player.id}_${tokenIndex}`;
        const sprite = this.tokenSprites.get(key);
        if (!sprite) return;

        const p = this.getTokenPixel(state, player.id, tokenIndex);
        if (!tileMap.has(p.tileKey)) tileMap.set(p.tileKey, []);
        tileMap.get(p.tileKey).push({ sprite, p });
      });
    });

    tileMap.forEach((entries) => {
      const offsets = getStackedOffsets(entries.length);
      entries.forEach((entry, idx) => {
        const targetX = entry.p.x + offsets[idx].x;
        const targetY = entry.p.y + offsets[idx].y;

        if (useTween) {
          this.tweens.add({ targets: entry.sprite, x: targetX, y: targetY, duration: 140, ease: "Sine.easeInOut" });
        } else {
          entry.sprite.setPosition(targetX, targetY);
        }
      });
    });
  }

  updateTokenHighlight(state, highlightedTokenKeys) {
    const highlightSet = new Set(highlightedTokenKeys || []);

    state.players.forEach((player) => {
      const tokens = state.tokens[player.id] || [];
      tokens.forEach((_, tokenIndex) => {
        const key = `${player.id}_${tokenIndex}`;
        const sprite = this.tokenSprites.get(key);
        if (!sprite) return;

        const active = highlightSet.has(key);
        sprite.setScale(active ? 0.62 : 0.5);
        sprite.setAlpha(active ? 1 : 0.72);
      });
    });
  }

  animateDice(value) {
    const frame = Math.max(0, Math.min(5, (value || 1) - 1));
    this.tweens.add({
      targets: this.diceSprite,
      angle: 360,
      scale: 1.12,
      duration: 350,
      yoyo: true,
      ease: "Sine.easeInOut",
      onStart: () => playBeep(320, 90),
      onComplete: () => {
        this.diceSprite.setFrame(frame);
        this.diceSprite.setAngle(0);
        playBeep(620, 70);
      }
    });
  }

  animateTokenMove(state, lastMove) {
    const { playerId, move, kill, winner } = lastMove;
    const key = `${playerId}_${move.tokenIndex}`;
    const sprite = this.tokenSprites.get(key);
    if (!sprite) {
      this.positionAllTokens(state, true);
      return;
    }

    const seat = getSeatForPlayer(state, playerId);
    const steps = buildMovePath(seat, move.from, move.to);

    const fromPixel = this.getTokenPixel(state, playerId, move.tokenIndex, move.from);
    sprite.setPosition(fromPixel.x, fromPixel.y);

    const points = steps.map((stepPos) => this.getTokenPixel(state, playerId, move.tokenIndex, stepPos));

    const timeline = this.tweens.createTimeline();
    points.forEach((pt) => {
      timeline.add({
        targets: sprite,
        x: pt.x,
        y: pt.y,
        duration: 170,
        ease: "Sine.easeInOut",
        onStart: () => playBeep(500, 30)
      });
    });

    timeline.setCallback("onComplete", () => {
      this.positionAllTokens(state, false);

      if (kill) {
        const at = this.getTokenPixel(state, playerId, move.tokenIndex, move.to);
        this.playKillFx(at.x, at.y);
      }

      if (winner) {
        this.playWinFx();
      }
    });

    timeline.play();
  }

  playKillFx(x, y) {
    const particles = this.add.particles(x, y, "spark", {
      speed: { min: 40, max: 220 },
      scale: { start: 1, end: 0 },
      lifespan: 450,
      tint: [0xff4d4f, 0xffec3d, 0xffffff],
      quantity: 18,
      blendMode: "ADD"
    });

    this.time.delayedCall(500, () => particles.destroy());
    playBeep(120, 180);
  }

  playWinFx() {
    const particles = this.add.particles(this.scale.width * 0.5, 10, "spark", {
      speedY: { min: 120, max: 250 },
      speedX: { min: -180, max: 180 },
      lifespan: 1800,
      quantity: 10,
      scale: { start: 1, end: 0 },
      tint: [0xff4d4f, 0x22c55e, 0xfacc15, 0x3b82f6]
    });

    const banner = this.add
      .text(this.scale.width * 0.5, this.scale.height * 0.5, "Victory!", {
        fontFamily: "Segoe UI",
        fontSize: `${Math.max(30, this.scale.width * 0.06)}px`,
        color: "#facc15",
        stroke: "#111827",
        strokeThickness: 6,
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: banner,
      scale: { from: 0.6, to: 1.05 },
      yoyo: true,
      duration: 600,
      repeat: 1,
      onComplete: () => banner.destroy()
    });

    this.time.delayedCall(2200, () => particles.destroy());
    playBeep(880, 180);
  }
}