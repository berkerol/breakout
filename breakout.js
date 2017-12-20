let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let lives = 10;
let totalHit = 0;

let ball = {
  x: canvas.width / 2 - 10,
  y: canvas.height - 20,
  radius: 10,
  color: "#0095DD",
  angle: 60,
  speed: 10,
  speedX: 0,
  speedY: -10
};

let brick = {
  rows: 5,
  width: 80,
  height: 20,
  arc: 10,
  paddingX: 50,
  paddingY: 50,
  marginX: 50,
  marginY: 50,
  colors: ["#7FFF00", "#6495ED", "#FF8C00", "#FF4500"]
};

let meteor = {
  innerRadius: 10,
  outerRadius: 20,
  spikes: 10,
  color: "#FF4500",
  highestSpeed: 150,
  lowestSpeed: 100,
  probability: 0.005
};

let paddle = {
  x: (canvas.width - 150) / 2,
  y: canvas.height - 20,
  width: 150,
  height: 20,
  arc: 10,
  color: "#0095DD",
  speed: 20,
  speedX: 0
};

let particle = {
  alpha: 0.5,
  decrease: 0.05,
  highestRadius: 5,
  highestSpeedX: 5,
  highestSpeedY: 5,
  lowestRadius: 2,
  lowestSpeedX: -5,
  lowestSpeedY: -5,
  total: 50
};

let label = {
  font: "24px Arial",
  color: "#0095DD",
  margin: 20
};

let bricks = [];
let meteors = [];
let particles = [];

brick.cols = Math.floor((canvas.width - brick.marginX) / (brick.width + brick.paddingX));
brick.paddingX = (canvas.width - brick.marginX - brick.cols * brick.width) / brick.cols;
for (let i = 0; i < brick.cols; i++) {
  for (let j = 0; j < brick.rows; j++) {
    let status = Math.floor(Math.random() * brick.colors.length);
    bricks.push({
      x: (i * (brick.width + brick.paddingX)) + brick.marginX,
      y: (j * (brick.height + brick.paddingY)) + brick.marginY,
      status
    });
    totalHit += +status + 1;
  }
}
draw();
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);
window.addEventListener("resize", resizeHandler);

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCircle(ball);
  for (let b of bricks) {
    drawRoundRect(b, brick.width, brick.height, brick.arc, brick.colors[b.status]);
  }
  for (let m of meteors) {
    drawMeteor(m);
  }
  drawRoundRect(paddle, paddle.width, paddle.height, paddle.arc, paddle.color);
  for (let p of particles) {
    drawCircle(p);
  }
  drawLabel("Score: " + score, 10);
  drawLabel("Lives: " + lives, canvas.width - 110);
  processBall();
  processBricks();
  processParticles();
  createMeteors();
  removeMeteors();
  requestAnimationFrame(draw);
}

function drawCircle(c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
  fill(c.color);
}

function drawRoundRect(r, width, height, arc, color) {
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
  fill(color);
}

function drawMeteor(m) {
  ctx.beginPath();
  let x = m.x;
  let y = m.y;
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / meteor.spikes;
  ctx.moveTo(m.x, m.y - meteor.outerRadius);
  for (i = 0; i < meteor.spikes; i++) {
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
  fill(meteor.color);
}

function drawLabel(text, x) {
  ctx.font = label.font;
  ctx.fillStyle = label.color;
  ctx.fillText(text, x, label.margin);
}

function fill(color) {
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

function processBall() {
  if (ball.x + ball.speedX < ball.radius || ball.x + ball.speedX > canvas.width - ball.radius) {
    ball.speedX = -ball.speedX;
  }
  if (ball.y + ball.speedY < ball.radius) {
    ball.speedY = -ball.speedY;
  } else if (ball.y + ball.speedY > canvas.height - ball.radius) {
    if (intersects(ball.x, ball.y, 2 * ball.radius, 2 * ball.radius, paddle.x, paddle.y, paddle.width, paddle.height)) {
      let x = (paddle.x + paddle.width / 2.0 - ball.x - ball.radius) / (paddle.width / 2.0);
      ball.speedY = -ball.speed * Math.cos(x * ball.angle * Math.PI / 180);
      ball.speedX = -ball.speed * Math.sin(x * ball.angle * Math.PI / 180);
    } else {
      die();
    }
  }
  ball.x += ball.speedX;
  ball.y += ball.speedY;
  paddle.x += paddle.speedX;
}

function processBricks() {
  for (let i = bricks.length - 1; i >= 0; i--) {
    let b = bricks[i];
    if (intersects(ball.x, ball.y, 2 * ball.radius, 2 * ball.radius, b.x, b.y, brick.width, brick.height)) {
      ball.speedY = -ball.speedY;
      if (ball.y < b.y && ball.speedY > 0) {
        ball.y = b.y - 2 * ball.radius;
      } else if (ball.y >= b.y && ball.speedY <= 0) {
        ball.y = b.y + brick.height;
      }
      b.status--;
      score++;
      for (let i = 0; i < particle.total; i++) {
        let c = generateRandomRgbColor();
        particles.push({
          x: ball.x,
          y: ball.y,
          radius: particle.lowestRadius + Math.random() * (particle.highestRadius - particle.lowestRadius),
          color: "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + particle.alpha + ")",
          speedX: particle.lowestSpeedX + Math.random() * (particle.highestSpeedX - particle.lowestSpeedX),
          speedY: particle.lowestSpeedY + Math.random() * (particle.highestSpeedY - particle.lowestSpeedY),
        });
      }
      if (score === totalHit) {
        end("YOU WIN, CONGRATULATIONS!");
      }
      if (b.status < 0) {
        bricks.splice(i, 1);
      }
    }
  }
}

function processParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.radius -= particle.decrease;
    if (p.radius <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      particles.splice(i, 1);
    }
  }
}

function createMeteors() {
  if (Math.random() < meteor.probability) {
    meteors.push({
      x: Math.floor(Math.random() * canvas.width),
      y: 0,
      speedY: canvas.height / (meteor.lowestSpeed + Math.random() * (meteor.highestSpeed - meteor.lowestSpeed))
    });
  }
}

function removeMeteors() {
  for (let i = meteors.length - 1; i >= 0; i--) {
    let m = meteors[i];
    m.y += m.speedY;
    if (m.y > canvas.height - meteor.outerRadius) {
      meteors.splice(i, 1);
    }
    if (intersects(m.x, m.y, meteor.outerRadius, meteor.outerRadius, paddle.x, paddle.y, paddle.width, paddle.height)) {
      meteors.splice(i, 1);
      die();
      break;
    }
  }
}

function generateRandomRgbColor() {
  return [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
}

function intersects(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function die() {
  if (--lives === 0) {
    end("GAME OVER!");
  } else {
    alert("START AGAIN!");
    ball.x = canvas.width / 2 - ball.radius;
    ball.y = canvas.height - 2 * ball.radius;
    ball.speedX = 0;
    ball.speedY = -ball.speed;
    paddle.x = (canvas.width - paddle.width) / 2;
  }
}

function end(message) {
  alert(message);
  document.location.reload();
}

function keyDownHandler(e) {
  if (e.keyCode === 39) {
    paddle.speedX = paddle.speed;
  }
  if (e.keyCode === 37) {
    paddle.speedX = -paddle.speed;
  }
}

function keyUpHandler(e) {
  if (e.keyCode === 39 || e.keyCode === 37) {
    paddle.speedX = 0;
  }
}

function mouseMoveHandler(e) {
  paddle.x = e.clientX - canvas.offsetLeft - paddle.width / 2;
}

function resizeHandler() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  paddle.y = canvas.height - paddle.height;
}
