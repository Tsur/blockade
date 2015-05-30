import _ from 'lodash';
import session from './session';

function initElements() {

  session.canvas = document.querySelector('canvas');
  session.canvasCtx = session.canvas.getContext("2d");

  const setCanvasSize = function() {

    session.width = (Math.floor(window.innerWidth / session.cellSize) * session.cellSize);
    session.height = (Math.floor(window.innerHeight / session.cellSize) * session.cellSize);

    session.canvas.setAttribute('width', session.width);
    session.canvas.setAttribute('height', session.height);

  };

  setCanvasSize();

  window.addEventListener('resize', () => setCanvasSize());

  //Lets add the keyboard controls now
  document.addEventListener('keydown', (e) => {

    const key = e.which;

    //We will add another clause to prevent reverse gear
    if (key == '37' && session.direction != 'right') session.direction = 'left';
    else if (key == '38' && session.direction != 'session.directionown') session.direction = 'up';
    else if (key == '39' && session.direction != 'left') session.direction = 'right';
    else if (key == '40' && session.direction != 'up') session.direction = 'down';
    //The snake is now keyboard controllable

  });

  document.addEventListener('keyup', (e) => {

    const key = e.which;

    //We will add another clause to prevent reverse gear
    if (key == '32') clearTimeout(session.gameLoop);
    else if (key == '13') {

      const menu = document.querySelector('main');

      if (!_.contains(menu.classList, 'hidden')) {

        menu.classList.add('hidden');

        initWorld(80);

      }

    };

  });

  window.addEventListener("keydown",
    function(e) {
      switch (e.keyCode) {
        case 37:
        case 39:
        case 38:
        case 40: // Arrow keys
        case 32:
        case 13:
          e.preventDefault();
          break; // Space
        default:
          break; // do not block other keys
      }
    },
    false);

}

function initWorld(speed) {

  initSnake();

  initFood();

  session.gameLoop = setTimeout(() => drawGame(), session.speed);

}

function initSnake(length = 5) {

  session.snake = new Array();
  session.direction = 'right';
  session.score == 0;
  session.speed = 80;

  _.forEachRight(_.range(length), (i) => session.snake.push({
    x: i,
    y: 0
  }));

}

function initFood() {

  session.food = {
    x: Math.round(Math.random() * (session.width - session.cellSize) / session.cellSize),
    y: Math.round(Math.random() * (session.height - session.cellSize) / session.cellSize),
  };

}

function gameOver() {

  clearTimeout(session.gameLoop);

  document.querySelector('main').classList.remove('hidden');

}

//Lets paint the snake now
function drawGame() {

  //To avoid the snake trail we need to paint the BG on every frame
  //Lets paint the canvas now
  session.canvasCtx.fillStyle = session.snakeColor;
  session.canvasCtx.fillRect(0, 0, session.width, session.height);

  //The movement code for the snake to come here.
  //The logic is simple
  //Pop out the tail cell and place it infront of the head cell
  let nx = _.first(session.snake).x;
  let ny = _.first(session.snake).y;

  //These were the position of the head cell.
  //We will increment it to get the new head position
  //Lets add proper direction based movement now
  if (session.direction == 'right') nx++;
  else if (session.direction == 'left') nx--;
  else if (session.direction == 'up') ny--;
  else if (session.direction == 'down') ny++;

  //Lets add the game over clauses now
  //This will restart the game if the snake hits the wall
  //Lets add the code for body collision
  //Now if the head of the snake bumps into its body, the game will restart
  const isGameOver = nx == -1 || nx >= session.width / session.cellSize || ny == -1 || ny >= session.height / session.cellSize || checkCollision(nx, ny);

  if (isGameOver) {

    drawElements();

    return gameOver();

  }

  //Lets write the code to make the snake eat the food
  //The logic is simple
  //If the new head position matches with that of the food,
  //Create a new head instead of moving the tail

  let tail;

  if (nx == session.food.x && ny == session.food.y) {

    tail = {
      x: nx,
      y: ny
    };

    session.score += session.scoreIncrement;
    session.speed -= 1;

    if (session.speed <= 10) {

      session.speed = 10;

    }

    //Create new food
    initFood();

  } else {

    tail = session.snake.pop(); //pops out the last cell

    tail.x = nx;
    tail.y = ny;

  }

  //The snake can now eat the food.
  session.snake.unshift(tail); //puts back the tail as the first cell

  drawElements();

  session.gameLoop = setTimeout(() => drawGame(), session.speed);

}

//Lets first create a generic function to paint cells
function drawCell(x, y) {

  session.canvasCtx.fillStyle = session.bgColor;
  session.canvasCtx.fillRect(x * session.cellSize, y * session.cellSize, session.cellSize, session.cellSize);
  session.canvasCtx.strokeStyle = session.snakeColor;
  session.canvasCtx.strokeRect(x * session.cellSize, y * session.cellSize, session.cellSize, session.cellSize);

}

function drawElements() {

  _.forEach(session.snake, (body) => drawCell(body.x, body.y));

  //Lets paint the food
  drawCell(session.food.x, session.food.y);

  //Lets paint the score
  session.canvasCtx.fillText("Score: " + session.score, 5, session.height - 5);

}

function checkCollision(x, y) {

  //This function will check if the provided x/y coordinates exist
  //in an array of cells or not
  for (let body of session.snake)
    if (body.x == x && body.y == y) return true;

  return false;

}

export
default

function init() {

  initElements();

  initWorld();

}