/* global performance FPSMeter */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const getTime = typeof performance === 'function' ? performance.now : Date.now;
const FRAME_THRESHOLD = 300;
const FRAME_DURATION = 1000 / 58;
let then = getTime();
let acc = 0;
let animation;
const meter = new FPSMeter({
  left: canvas.width - 130 + 'px',
  top: 'auto',
  bottom: '12px',
  theme: 'colorful',
  heat: 1,
  graph: 1
});

let score = 0;
let lives = 10;
let totalHit = 0;
let lastBrick = -1;
let touchedPaddle = true;

const ball = {
  x: canvas.width / 2 - 10,
  y: canvas.height - 20,
  radius: 10,
  color: '#0095DD',
  angle: 60,
  speed: 10,
  speedX: 0,
  speedY: -10
};

const brick = {
  width: 100,
  height: 25,
  arc: 15,
  paddingX: 35,
  paddingY: 30,
  marginX: 30,
  marginY: 30,
  colors: ['#7FFF00', '#6495ED', '#FF8C00', '#FF4500']
};

const meteor = {
  innerRadius: 10,
  outerRadius: 20,
  spikes: 10,
  shadowBlur: 20,
  color: '#FF4500',
  highestSpeed: 150,
  lowestSpeed: 100,
  probability: 0.005
};

const paddle = {
  x: (canvas.width - 150) / 2,
  y: canvas.height - 20,
  width: 150,
  height: 20,
  arc: 10,
  color: '#0095DD',
  speed: 20,
  speedX: 0
};

const particle = {
  decrease: 0.05,
  highestAlpha: 0.8,
  highestRadius: 5,
  highestSpeedX: 5,
  highestSpeedY: 5,
  lowestAlpha: 0.4,
  lowestRadius: 2,
  lowestSpeedX: -5,
  lowestSpeedY: -5,
  total: 50
};

const label = {
  font: '24px Arial',
  color: '#0095DD',
  margin: 20,
  left: 10,
  right: canvas.width - 110
};

const bricks = [];
const meteors = [];
const particles = [];

brick.cols = Math.floor((canvas.width - 2 * brick.marginX + brick.paddingX) / (brick.width + brick.paddingX));
brick.rows = Math.floor((canvas.height / 2 - brick.marginY + brick.paddingY) / (brick.height + brick.paddingY));
brick.marginX = (canvas.width - brick.cols * (brick.width + brick.paddingX) + brick.paddingX) / 2;
brick.marginY = (canvas.height / 2 - brick.rows * (brick.height + brick.paddingY) + brick.paddingY);
for (let i = 0; i < brick.cols; i++) {
  for (let j = 0; j < brick.rows; j++) {
    const status = Math.floor(Math.random() * brick.colors.length);
    bricks.push({
      x: (i * (brick.width + brick.paddingX)) + brick.marginX,
      y: (j * (brick.height + brick.paddingY)) + brick.marginY,
      n: i * brick.rows + j,
      status
    });
    totalHit += +status + 1;
  }
}
draw();
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);
window.addEventListener('resize', resizeHandler);

function draw () {
  const now = getTime();
  let ms = now - then;
  let frames = 0;
  then = now;
  if (ms < FRAME_THRESHOLD) {
    acc += ms;
    while (acc >= FRAME_DURATION) {
      frames++;
      acc -= FRAME_DURATION;
    }
  } else {
    ms = 0;
  }
  meter.tick();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCircle(ball);
  drawRoundRect(paddle, paddle.width, paddle.height, paddle.arc, paddle.color);
  for (const b of bricks) {
    drawRoundRect(b, brick.width, brick.height, brick.arc, brick.colors[b.status]);
  }
  if (meteors.length > 0) {
    ctx.save();
    ctx.shadowBlur = meteor.shadowBlur;
    ctx.shadowColor = meteor.color;
    ctx.fillStyle = meteor.color;
    ctx.beginPath();
    for (const m of meteors) {
      drawMeteor(m);
    }
    ctx.fill();
    ctx.restore();
  }
  for (const p of particles) {
    drawCircle(p);
  }
  ctx.font = label.font;
  ctx.fillStyle = label.color;
  ctx.fillText('Score: ' + score, label.left, label.margin);
  ctx.fillText('Lives: ' + lives, label.right, label.margin);
  processBall(frames);
  processBricks();
  processParticles(frames);
  createMeteors();
  removeMeteors(frames);
  animation = window.requestAnimationFrame(draw);
}

function drawCircle (c) {
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
  ctx.fill();
}

function drawRoundRect (r, width, height, arc, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(r.x + arc, r.y);
  ctx.lineTo(r.x + width - arc, r.y);
  ctx.quadraticCurveTo(r.x + width, r.y, r.x + width, r.y + arc);
  ctx.lineTo(r.x + width, r.y + height - arc);
  ctx.quadraticCurveTo(r.x + width, r.y + height, r.x + width - arc, r.y + height);
  ctx.lineTo(r.x + arc, r.y + height);
  ctx.quadraticCurveTo(r.x, r.y + height, r.x, r.y + height - arc);
  ctx.lineTo(r.x, r.y + arc);
  ctx.quadraticCurveTo(r.x, r.y, r.x + arc, r.y);
  ctx.fill();
}

function drawMeteor (m) {
  let x = m.x;
  let y = m.y;
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / meteor.spikes;
  ctx.moveTo(m.x, m.y - meteor.outerRadius);
  for (let i = 0; i < meteor.spikes; i++) {
    x = m.x + Math.cos(rot) * meteor.outerRadius;
    y = m.y + Math.sin(rot) * meteor.outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    x = m.x + Math.cos(rot) * meteor.innerRadius;
    y = m.y + Math.sin(rot) * meteor.innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(m.x, m.y - meteor.outerRadius);
}

function processBall (frames) {
  if ((ball.x < ball.radius && ball.speedX < 0) || (ball.x > canvas.width - ball.radius && ball.speedX > 0)) {
    ball.speedX = -ball.speedX;
  }
  if (ball.y < ball.radius && ball.speedY < 0) {
    ball.speedY = -ball.speedY;
    touchedPaddle = true;
  } else if (ball.y > canvas.height - ball.radius && ball.speedY > 0) {
    die();
  } else if (ball.y > canvas.height - paddle.height - ball.radius && ball.speedY > 0 && intersects(paddle, paddle.width, paddle.height, ball, ball.radius)) {
    const x = (paddle.x + paddle.width / 2 - ball.x - ball.radius) / (paddle.width / 2);
    ball.speedX = -ball.speed * Math.sin(x * ball.angle * Math.PI / 180);
    ball.speedY = -ball.speed * Math.cos(x * ball.angle * Math.PI / 180);
    touchedPaddle = true;
  }
  ball.x += ball.speedX * frames;
  ball.y += ball.speedY * frames;
  paddle.x += paddle.speedX * frames;
}

function processBricks () {
  for (let i = bricks.length - 1; i >= 0; i--) {
    const b = bricks[i];
    if ((touchedPaddle || lastBrick !== b.n) && intersects(b, brick.width, brick.height, ball, ball.radius)) {
      ball.speedY = -ball.speedY;
      touchedPaddle = false;
      lastBrick = b.n;
      b.status--;
      score++;
      for (let i = 0; i < particle.total; i++) {
        const c = generateRandomRgbColor();
        const alpha = particle.lowestAlpha + Math.random() * (particle.highestAlpha - particle.lowestAlpha);
        particles.push({
          x: ball.x,
          y: ball.y,
          radius: particle.lowestRadius + Math.random() * (particle.highestRadius - particle.lowestRadius),
          color: `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`,
          speedX: particle.lowestSpeedX + Math.random() * (particle.highestSpeedX - particle.lowestSpeedX),
          speedY: particle.lowestSpeedY + Math.random() * (particle.highestSpeedY - particle.lowestSpeedY)
        });
      }
      if (score === totalHit) {
        end('CONGRATULATIONS, YOU WON!');
      }
      if (b.status < 0) {
        bricks.splice(i, 1);
      }
    }
  }
}

function processParticles (frames) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.speedX * frames;
    p.y += p.speedY * frames;
    p.radius -= particle.decrease;
    if (p.radius <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      particles.splice(i, 1);
    }
  }
}

function createMeteors () {
  if (Math.random() < meteor.probability) {
    meteors.push({
      x: Math.floor(Math.random() * canvas.width),
      y: 0,
      speedY: canvas.height / (meteor.lowestSpeed + Math.random() * (meteor.highestSpeed - meteor.lowestSpeed))
    });
  }
}

function removeMeteors (frames) {
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.speedY * frames;
    if (m.y > canvas.height - meteor.outerRadius) {
      meteors.splice(i, 1);
    }
    if (intersects(paddle, paddle.width, paddle.height, m, meteor.outerRadius)) {
      meteors.splice(i, 1);
      die();
      break;
    }
  }
}

function generateRandomRgbColor () {
  return [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
}

function intersects (r, width, height, c, radius) {
  const distX = Math.abs(c.x - r.x - width / 2);
  const distY = Math.abs(c.y - r.y - height / 2);
  if (distX > (width / 2 + radius) || distY > (height / 2 + radius)) {
    return false;
  }
  if (distX <= (width / 2) || distY <= (height / 2)) {
    return true;
  }
  const dX = distX - width / 2;
  const dY = distY - height / 2;
  return dX ** 2 + dY ** 2 <= radius ** 2;
}

function die () {
  if (--lives === 0) {
    end('GAME OVER!');
  } else if (lives > 0) {
    window.alert('START AGAIN!');
    ball.x = canvas.width / 2 - ball.radius;
    ball.y = canvas.height - paddle.height;
    ball.speedX = 0;
    ball.speedY = -ball.speed;
    paddle.x = (canvas.width - paddle.width) / 2;
    touchedPaddle = true;
  }
}

function end (message) {
  window.alert(message);
  window.location.reload(false);
}

function keyDownHandler (e) {
  if (animation !== undefined) {
    if (e.keyCode === 39) {
      paddle.speedX = paddle.speed;
    }
    if (e.keyCode === 37) {
      paddle.speedX = -paddle.speed;
    }
  }
}

function keyUpHandler (e) {
  if (animation !== undefined) {
    if (e.keyCode === 39 || e.keyCode === 37) {
      paddle.speedX = 0;
    }
  }
  if (e.keyCode === 80) {
    if (animation === undefined) {
      animation = window.requestAnimationFrame(draw);
    } else {
      window.cancelAnimationFrame(animation);
      animation = undefined;
    }
  }
}

function mouseMoveHandler (e) {
  if (animation !== undefined) {
    paddle.x = e.clientX - canvas.offsetLeft - paddle.width / 2;
  }
}

function resizeHandler () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  paddle.y = canvas.height - paddle.height;
}
