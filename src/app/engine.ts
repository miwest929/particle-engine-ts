let canvas:HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let ctx:CanvasRenderingContext2D = canvas.getContext('2d');

interface Array<T> {
    sample(): T;
}

Array.prototype.sample = function () {
  const randIdx = Math.floor(Math.random() * this.length);
  return this[randIdx];
};

// Note: https://stackoverflow.com/a/55906256
class Vector {
    public readonly x: number;
    public readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(v: Vector): Vector {
      return new Vector(this.x + v.x, this.y + v.y);
    }

    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    static empty(): Vector {
        return new Vector(0, 0);
    }
}

class Particle {
    private STARTING_AGE: number = 256;

    private location: Vector;
    private velocity: Vector;
    private acceleration: Vector;
    private decayRate: number; // how quickly this particle will age
    private lifespan: number = this.STARTING_AGE;
    private color: string; // rgb string

    constructor(initialLocation: Vector, acceleration: Vector, velocity: Vector, color: string, decayRate: number) {
        this.location = initialLocation.clone();
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.decayRate = decayRate;
        this.color = color;
    }

    public update = () => {
        if (!this.isDead()) {
            this.velocity = this.velocity.add(this.acceleration);
            this.location = this.location.add(this.velocity);
            this.lifespan -= this.decayRate;
        }
    }

    public render = (ctx: CanvasRenderingContext2D) => {
        if (!this.isDead()) {
            ctx.globalAlpha = this.computeAlphaValue();
            ctx.fillStyle = this.color;
            //rgb(89, 89, 89)
            ctx.beginPath();
            // x, y, radiusX, radiusY, rotation, startAngle, endAngle [, anticlockwise]
            ctx.arc(this.location.x, this.location.y, 3, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    }

    public isDead = () => {
        return this.lifespan < 0;
    }

    private computeAlphaValue = (): number => {
        return this.lifespan / this.STARTING_AGE;
    }
}

type PVectorAttrEmitFn = (seq: number) => Vector;
type PStringAttrEmitFn = (seq: number) => string;
type PNumberAttrEmitFn = (seq: number) => number;
class ParticleEmitter {
  public baseLocation: Vector;

  private velocityEmitter: PVectorAttrEmitFn;
  private locationEmitter: PVectorAttrEmitFn;
  private accelerationEmitter: PVectorAttrEmitFn;
  private decayRateEmitter: PNumberAttrEmitFn;
  private colorEmitter: PStringAttrEmitFn;

  constructor(baseLocation: Vector) {
    this.baseLocation = baseLocation;
    this.velocityEmitter = this.accelerationEmitter = this.colorEmitter = null;

    // By default the particle starts at the base location of its emitter
    this.locationEmitter = (_sec: number) => { return this.baseLocation.clone(); };
  }

  public setVelocityEmitter(emitter: PVectorAttrEmitFn) {
    this.velocityEmitter = emitter;
  }

  public setLocationEmitter(emitter: PVectorAttrEmitFn) {
    this.locationEmitter = emitter;
  }

  public setDecayRateEmitter(emitter: PNumberAttrEmitFn) {
    this.decayRateEmitter = emitter;
  }

  public setAccelerationEmitter(emitter: PVectorAttrEmitFn) {
    this.accelerationEmitter = emitter;
  }

  public setColorEmitter(emitter: PStringAttrEmitFn) {
    this.colorEmitter = emitter;
  }

  public emitParticle(seq: number): Particle {
      return new Particle(
        this.locationEmitter(seq),
        this.accelerationEmitter(seq),
        this.velocityEmitter(seq),
        this.colorEmitter(seq),
        this.decayRateEmitter(seq)
      );
  }
}

const GravityParticleEmitter = new ParticleEmitter(new Vector(canvas.width / 2, 20));
GravityParticleEmitter.setVelocityEmitter((seq: number): Vector => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].sample();
    const x = Math.random() * 6 - 3;
    const y = a * Math.pow(x, 2);
    return new Vector(x, y);
});
GravityParticleEmitter.setAccelerationEmitter((_seq: number): Vector => { return new Vector(0.0, 0.0); });
GravityParticleEmitter.setColorEmitter((_seq: number): string => {
    const color = ["rgb(255,127,80)", "rgb(255,99,71)", "rgb(255,140,0)", "rgb(255,165,0)"].sample();
    return color;
});
GravityParticleEmitter.setDecayRateEmitter((_seq: number): number => {
  return [1, 2, 3, 4, 5].sample();
});

interface ParticleEngineOptions {
    targetParticleCount: number;
    emitter: ParticleEmitter;
}

class ParticleEngine {
    private emitter: ParticleEmitter;
    private particles: Particle[];
    private targetParticleCount: number;

    constructor(options: ParticleEngineOptions) {
        this.emitter = options.emitter;
        this.targetParticleCount = options.targetParticleCount;

        this.particles = [];
        this.createParticles(this.targetParticleCount);
    }

    public update = () => {
        // cull all dead particles
        this.particles = this.particles.filter((p) => !p.isDead());
        //console.log(`need-to-create-cnt = ${this.targetParticleCount - this.particles.length}`);
        this.createParticles(this.targetParticleCount - this.particles.length);

        for (const p of this.particles) {
            p.update();
        }
    }

    public render = (ctx: CanvasRenderingContext2D) => {
        for (const p of this.particles) {
            p.render(ctx);
        }
    }

    private createParticles(createCount: number) {
        for (let i = 0; i < createCount; i++) {
            this.createRandomParticle();
        }
    }

    private createRandomParticle() {
        const particle = this.emitter.emitParticle(0);
        this.particles.push(particle);
    }
}

const engine: ParticleEngine = new ParticleEngine({
    targetParticleCount: 1000,
    emitter: GravityParticleEmitter
});

function render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    engine.render(ctx);
}

function gameLoop() {
    render(ctx);
    engine.update();
    window.requestAnimationFrame(gameLoop);
}

gameLoop();