let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ball = {
  x: canvas.width / 2 - 10,
  y: canvas.height - 20,
  dx: 0,
  dy: -10,
  radius: 10,
  angle: 60,
  speed: 10,
  color: "#0095DD"
};

let paddle = {
  x: (canvas.width - 150) / 2,
  y: canvas.height - 20,
  dx: 0,
  width: 150,
  height: 20,
  arc: 10,
  speed: 20,
  color: "#0095DD"
};

function resetBall() {
  alert("START AGAIN!");
  ball.x = canvas.width / 2 - ball.radius;
  ball.y = canvas.height - 2 * ball.radius;
  ball.dx = 0;
  ball.dy = -ball.speed;
  paddle.x = (canvas.width - paddle.width) / 2;
}

let meteor = {
  probability: 0.005,
  speed: 100,
  speedVariance: 50,
  outerRadius: 20,
  innerRadius: 10,
  spikes: 10,
  color: "#FF4500"
};

let brick = {
  rows: 5,
  cols: 8,
  width: 80,
  height: 20,
  arc: 10,
  paddingX: 50,
  paddingY: 50,
  marginX: 50,
  marginY: 50
};

let label = {
  font: "16px Arial",
  color: "#0095DD",
  size: 20
};

let score = 0;
let health = 10;

let meteors = [];
let bricks = [];
let total_hit = 0;
let colors = ["#7FFF00", "#6495ED", "#FF8C00", "#FF4500"];

brick.cols = Math.floor((canvas.width - brick.marginX) / (brick.width + brick.paddingX));
brick.paddingX = (canvas.width - brick.cols * brick.width - brick.marginX) / brick.cols;
for (c = 0; c < brick.cols; c++) {
  bricks[c] = [];
  for (r = 0; r < brick.rows; r++) {
    let status = Math.floor(Math.random() * colors.length + 1);
    bricks[c][r] = {
      x: 0,
      y: 0,
      status: status
    };
    total_hit += +status;
  }
}
draw();
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);

function drawStar(x_, y_, outerRadius, innerRadius, spikes) {
  let x = x_,
    y = y_;
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / spikes;
  ctx.moveTo(x_, y_ - outerRadius);
  for (i = 0; i < spikes; i++) {
    x = x_ + Math.cos(rot) * outerRadius;
    y = y_ + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    x = x_ + Math.cos(rot) * innerRadius;
    y = y_ + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(x_, y_ - outerRadius);
}

function drawRoundRect(x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function fill(color) {
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
  fill(ball.color);
}

function drawPaddle() {
  ctx.beginPath();
  drawRoundRect(paddle.x, paddle.y, paddle.width, paddle.height, paddle.arc);
  fill(paddle.color);
}

function drawMeteor(m) {
  ctx.beginPath();
  drawStar(m.x, m.y, meteor.outerRadius, meteor.innerRadius, meteor.spikes);
  fill(meteor.color);
}

function drawBrick(brick_) {
  ctx.beginPath();
  drawRoundRect(brick_.x, brick_.y, brick.width, brick.height, brick.arc);
  fill(colors[brick_.status - 1]);
}

function drawBricks() {
  for (c = 0; c < brick.cols; c++) {
    for (r = 0; r < brick.rows; r++) {
      let b = bricks[c][r];
      if (b.status > 0) {
        b.x = (c * (brick.width + brick.paddingX)) + brick.marginX;
        b.y = (r * (brick.height + brick.paddingY)) + brick.marginY;
        drawBrick(b);
      }
    }
  }
}

function drawLabel(message, number, position) {
  ctx.font = label.font;
  ctx.fillStyle = label.color;
  ctx.fillText(message + number, position, label.size);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  drawPaddle();
  drawBricks();
  drawLabel("Score: ", score, 10);
  drawLabel("Lives: ", health, canvas.width - 80);
  createMeteors();
  removeMeteors();
  drawMeteors();
  controlBall();
  controlBricks();
  ball.x += ball.dx;
  ball.y += ball.dy;
  paddle.x += paddle.dx;
  requestAnimationFrame(draw);
}

function createMeteors() {
  if (Math.random() < meteor.probability) {
    let x = Math.random() * canvas.width;
    let y = 0;
    let s = Math.floor(Math.random() * meteor.speedVariance + meteor.speed);
    meteors.push({
      x,
      y,
      dy: canvas.height / s
    });
  }
}

function removeMeteors() {
  for (let i = meteors.length - 1; i >= 0; i--) {
    let m = meteors[i];
    if (m.y + m.dy > canvas.height - meteor.outerRadius) {
      meteors.splice(i, 1);
    }
    if (intersects(m.x, m.y, meteor.outerRadius, meteor.outerRadius, paddle.x, paddle.y, paddle.width, paddle.height)) {
      meteors.splice(i, 1);
      die();
      break;
    }
  }
}

function drawMeteors() {
  for (let meteor of meteors) {
    meteor.y += meteor.dy;
    drawMeteor(meteor);
  }
}

function controlBall() {
  if (ball.x + ball.dx < ball.radius || ball.x + ball.dx > canvas.width - ball.radius) {
    ball.dx = -ball.dx;
  }
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy;
  } else if (ball.y + ball.dy > canvas.height - ball.radius) {
    if (intersects(ball.x, ball.y, 2 * ball.radius, 2 * ball.radius, paddle.x, paddle.y, paddle.width, paddle.height)) {
      let x = (paddle.x + paddle.width / 2.0 - ball.x - ball.radius) / (paddle.width / 2.0);
      ball.dy = -ball.speed * Math.cos(x * ball.angle * Math.PI / 180);
      ball.dx = -ball.speed * Math.sin(x * ball.angle * Math.PI / 180);
    } else {
      die();
    }
  }
}

function controlBricks() {
  for (c = 0; c < brick.cols; c++) {
    for (r = 0; r < brick.rows; r++) {
      let b = bricks[c][r];
      if (b.status > 0 && intersects(ball.x, ball.y, 2 * ball.radius, 2 * ball.radius, b.x, b.y, brick.width, brick.height)) {
        ball.dy = -ball.dy;
        if (ball.y < b.y) {
          ball.y = b.y - 2 * ball.radius;
        } else {
          ball.y = b.y + brick.height;
        }
        b.status--;
        score++;
        if (score === total_hit) {
          end("YOU WIN, CONGRATULATIONS!");
        }
      }
    }
  }
}

function intersects(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function die() {
  health--;
  if (health === 0) {
    end("GAME OVER");
  } else {
    resetBall();
  }
}

function end(message) {
  alert(message);
  document.location.reload();
}

function keyDownHandler(e) {
  if (e.keyCode === 39) {
    paddle.dx = paddle.speed;
  } else if (e.keyCode === 37) {
    paddle.dx = -paddle.speed;
  }
}

function keyUpHandler(e) {
  if (e.keyCode === 39) {
    paddle.dx = 0;
  } else if (e.keyCode === 37) {
    paddle.dx = 0;
  }
}

function mouseMoveHandler(e) {
  paddle.x = e.clientX - canvas.offsetLeft - paddle.width / 2;
}
