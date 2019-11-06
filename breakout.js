/* global canvas ctx animation:writable gameLoop label loop paintCircle paintRoundRect isIntersectingRectangleWithCircle generateRandomNumber generateRandomInteger paintParticles createParticles processParticles */
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

const bricks = [];
const meteors = [];

brick.cols = Math.floor((canvas.width - 2 * brick.marginX + brick.paddingX) / (brick.width + brick.paddingX));
brick.rows = Math.floor((canvas.height / 2 - brick.marginY + brick.paddingY) / (brick.height + brick.paddingY));
brick.marginX = (canvas.width - brick.cols * (brick.width + brick.paddingX) + brick.paddingX) / 2;
brick.marginY = (canvas.height / 2 - brick.rows * (brick.height + brick.paddingY) + brick.paddingY);
for (let i = 0; i < brick.cols; i++) {
  for (let j = 0; j < brick.rows; j++) {
    const status = generateRandomInteger(brick.colors.length);
    bricks.push({
      x: (i * (brick.width + brick.paddingX)) + brick.marginX,
      y: (j * (brick.height + brick.paddingY)) + brick.marginY,
      n: i * brick.rows + j,
      status
    });
    totalHit += +status + 1;
  }
}
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('mousemove', mouseMoveHandler);
window.addEventListener('resize', resizeHandler);

loop(function (frames) {
  paintCircle(ball.x, ball.y, ball.radius, ball.color);
  paintRoundRect(paddle.x, paddle.y, paddle.width, paddle.height, paddle.arc, paddle.arc, paddle.color);
  for (const b of bricks) {
    paintRoundRect(b.x, b.y, brick.width, brick.height, brick.arc, brick.arc, brick.colors[b.status]);
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
  paintParticles();
  ctx.font = label.font;
  ctx.fillStyle = label.color;
  ctx.fillText('Score: ' + score, label.left, label.margin);
  ctx.fillText('Lives: ' + lives, label.right, label.margin);
  processBall(frames);
  processBricks();
  processParticles(frames);
  createMeteors();
  removeMeteors(frames);
});

function drawMeteor (m) {
  let x;
  let y;
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
  } else if (ball.y > canvas.height - paddle.height - ball.radius && ball.speedY > 0 && isIntersectingRectangleWithCircle(paddle, paddle.width, paddle.height, ball, ball.radius)) {
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
    if ((touchedPaddle || lastBrick !== b.n) && isIntersectingRectangleWithCircle(b, brick.width, brick.height, ball, ball.radius)) {
      ball.speedY = -ball.speedY;
      touchedPaddle = false;
      lastBrick = b.n;
      b.status--;
      score++;
      createParticles(ball.x, ball.y);
      if (score === totalHit) {
        end('CONGRATULATIONS, YOU WON!');
      }
      if (b.status < 0) {
        bricks.splice(i, 1);
      }
    }
  }
}

function createMeteors () {
  if (Math.random() < meteor.probability) {
    meteors.push({
      x: Math.random() * canvas.width,
      y: 0,
      speedY: canvas.height / generateRandomNumber(meteor.lowestSpeed, meteor.highestSpeed)
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
    if (isIntersectingRectangleWithCircle(paddle, paddle.width, paddle.height, m, meteor.outerRadius)) {
      meteors.splice(i, 1);
      die();
      break;
    }
  }
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
      animation = window.requestAnimationFrame(gameLoop);
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
