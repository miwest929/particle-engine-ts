let canvas:HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
let ctx:CanvasRenderingContext2D = canvas.getContext('2d');

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
    private DECAY_RATE: number = 2;

    private location: Vector;
    private velocity: Vector;
    private acceleration: Vector;
    private lifespan: number = this.STARTING_AGE;

    constructor(initialLocation: Vector, acceleration: Vector) {
        this.location = initialLocation.clone();
        this.velocity = Vector.empty();
        this.acceleration = acceleration;
    }

    public update = () => {
        if (!this.isDead()) {
            this.velocity = this.velocity.add(this.acceleration);
            this.location = this.location.add(this.velocity);
            this.lifespan -= this.DECAY_RATE;
        }
    }

    public render = (ctx: CanvasRenderingContext2D) => {
        if (!this.isDead()) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            // x, y, radiusX, radiusY, rotation, startAngle, endAngle [, anticlockwise]
            ctx.ellipse(this.location.x, this.location.y, 3, 3, Math.PI * .25, 0, Math.PI * 1.5);
            ctx.fill();
        }
    }

    public isDead = () => {
        return this.lifespan <= 0;
    }
}

interface ParticleEngineOptions {
    particleCount: number;
    baseLocation: Vector;
}
class ParticleEngine {
    private particles: Particle[];
    private baseLocation: Vector;

    constructor(options: ParticleEngineOptions) {
        this.baseLocation = options.baseLocation;
        this.createParticles(options.particleCount);
    }

    public update = () => {
        for (const p of this.particles) {
            p.update();
        }
    }

    public render = (ctx: CanvasRenderingContext2D) => {
        for (const p of this.particles) {
            p.render(ctx);
        }
    }

    private createParticles(particleCnt: number) {
        this.particles = [];
        for (let i = 0; i < particleCnt; i++) {
            this.particles.push(this.createRandomParticle());
        }
    }

    private createRandomParticle() {
      const randomIntialLocation: Vector = new Vector(
        this.baseLocation.x + (10 * Math.random() - 5), // random offset between -5 and 5
        this.baseLocation.y + (10 * Math.random() - 5) // random offset between -5 and 5
      );

      const randomAcceleration: Vector = new Vector(
        Math.random() / 50,
        Math.random() / 50,
      );

      return new Particle(
        randomIntialLocation, // initial location
        randomAcceleration // acceleration
      );
    }
}

const engine: ParticleEngine = new ParticleEngine({
    particleCount: 20,
    baseLocation: new Vector(100, 150)
});

function render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    engine.render(ctx);
}

function gameLoop() {
    engine.update();
    render(ctx);
    window.requestAnimationFrame(gameLoop);
}

gameLoop();