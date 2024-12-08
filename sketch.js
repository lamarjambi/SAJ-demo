// Author: Lamar Jambi
// Context: Rini is an adventurious 19-year-old, and she stumbles across this junkyard where an enity 
// called Queen Garbo live, and doesn't neccerily accept outsiders
// The game is just a 2D platformer---Rini will face obstacles while running away from Queen Garbo!
// Obstacles: bunch of trash/pieces or piles of trash/pieces all over 
// If there's time, junk people!! like brown mushrooms on mario
// Screens: intro, story, manual, settings
// intro = menu page with "start", "manual", and "settings"
// gameStory = a little story/context before the game level 
// startGame = the actual game level using WAS keys for movements 
// manual = just a text for instructions for the player
// settings = brightness and volume settings
// ===============================================

// sounds
let bgMusic;
let riniSound;
let entitySound;

let player;
let groundY;
let cameraX = 0;
let goalX = 8000; 
let gameWon = false;
let gameState = "intro"; // possible screens: "intro", "story", "game", "manual", "settings"

// fonts
let playFont;
let dokdoFont;

// buttons
let playButton;
let manualButton;

// intro animations
let animationTimer = 0;
let scaleFactorRini = 1;
let scaleFactorEntity = 1;
const ANIMATION_PERIOD = 120; 

// rini animations
let riniSprites = [];
let currentRiniFrame = 0;
let frameDelay = 8; // Controls animation speed
let frameCounter = 0;
let facingLeft = false;

// garbo animations
let garbo = {
  x: 0,
  y: 0,
  width: 80,
  height: 120,
  active: false,
  speed: 5,
  appearTimer: 0,
  appearInterval: 180, // Reduced from 300 for more frequent appearances
  chaseTime: 280,
  currentChaseTime: 0,
  sprites: [],
  idleThreshold: 240  // 4 seconds (60 frames * 4)
};

let playerIdleTime = 0;

// settings
let brightness = 100;
let volume = 100;

// story
let storyTimer = 0;
let storyDuration = 180; // ~3 seconds at 60fps

// intro page
let introRini;
let introEntity;
let introBG;
let storyBG;

// background layers
let bg;
let columns;
let floor;
let infopost;
let rail;
let train;
let wires;

// game
let gameOver = false;  
let gatewayCar;
// Add with other global variables at the top
let gameOverCause = ""; // Can be "garbo", "box", "tires", or ""

// obstacles
let box;
let tires;
let obstacles = [];
const OBSTACLE_SPACING = 400;

class Obstacle {
  constructor(x, type) {
    this.worldX = x;
    this.y = groundY;
    this.type = type;
    if (type === 'box') {
      this.width = 60;
      this.height = 60;
    } else {
      this.width = 80;
      this.height = 40;
    }
  }

  draw() {
    push();
    translate(-cameraX, 0);
    if (this.type === 'box') {
      image(box, this.worldX, this.y - this.height, this.width, this.height);
    } else {
      image(tires, this.worldX, this.y - this.height, this.width, this.height);
    }
    pop();
  }

  checkCollision(player) {
    let playerWorldX = player.worldX;
    let collisionMargin = 10;
    
    return (
      playerWorldX + player.width - collisionMargin > this.worldX &&
      playerWorldX + collisionMargin < this.worldX + this.width &&
      player.y + player.height > this.y - this.height
    );
  }
}

function preload() {
  // font
  playFont = loadFont("Libraries/PressStart2P-Regular.ttf");
  dokdoFont = loadFont("Libraries/Dokdo-Regular.ttf");

  // buttons
  playButton = loadImage("assets/button-play.png");
  manualButton = loadImage("assets/button-manual.png");

  // intro page
  introRini = loadImage("assets/intro-rini.png");
  introEntity = loadImage("assets/intro-entity.png");
  introBG = loadImage("assets/intro-background.png");

  // story page
  storyBG = loadImage("assets/postapocalypse3.png");

  // rini animation
  for (let i = 1; i <= 4; i++) {
    riniSprites.push(loadImage(`assets/rini-walking-${i}.png`));
  }

  // garbo animation
  for (let i = 1; i <= 2; i++) {
    garbo.sprites.push(loadImage(`assets/garbo-walking-${i}.png`));
  }

  // background elements
  bg = loadImage("assets/Bright/bg.png");
  columns = loadImage("assets/Bright/columns&floor.png");
  floor = loadImage("assets/Bright/floor&underfloor.png");
  infopost = loadImage("assets/Bright/infopost&wires.png");
  rail = loadImage("assets/Bright/rail&wall.png");
  train = loadImage("assets/Bright/train.png");
  wires = loadImage("assets/Bright/wires.png");

  // obstacles
  box = loadImage("assets/obstacles/objects/trash/16.png");
  tires = loadImage("assets/obstacles/objects/tires/3.png");

  // game 
  gatewayCar = loadImage("assets/obstacles/objects/cars/1.png")

}

function setup() {
  createCanvas(windowWidth, windowHeight);
  groundY = height - 100;
  setupObstacles();

  player = {
    x: width / 4,
    worldX: width / 4,
    y: height - 160,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    speed: 5
  };
}

function draw() {
  background(20);
  
  console.log("window: ", windowWidth, windowHeight)

  // brightness filter on everything
  push();
  if (brightness < 100) {
    background(0, 0, 0, map(brightness, 0, 100, 200, 0));
  }

  switch (gameState) {
    case "intro":
      drawStartingPage();
      break;
    case "story":
      drawGameStory();
      break;
      case "game":
        if (!gameWon && !gameOver) {
          updatePlayer();
          cameraX = player.worldX - player.x;
          drawLayers();
          
          // Draw and check obstacles
          for (let obstacle of obstacles) {
            obstacle.draw();
            if (obstacle.checkCollision(player)) {
              gameOver = true;
              gameOverCause = obstacle.type; // "box" or "tires"
            }
          }
          
          drawPlayer();
          updateAndDrawGarbo();
          drawGoal();
          checkGoal();
        } else if (gameOver) {
          displayGameOverScreen();
        } else {
          displayWinScreen();
        }
        break;
    case "manual":
      drawManual();
      break;
    case "settings":
      drawSettings();
      break;
  }
  pop();
}

function drawStartingPage() {
  image(introBG, 0, 0, width, height);

  // animation timer
  animationTimer = (animationTimer + 1) % ANIMATION_PERIOD;

  const baseScale = 1;

  const riniFloatHeight = -20;  // Rini goes up
  const entityFloatHeight = 20;  // Garbo goes down

  const normalizedTime = (animationTimer % ANIMATION_PERIOD) / ANIMATION_PERIOD;
  const triangleWave = normalizedTime < 0.5 
      ? normalizedTime * 2          
      : 2 - (normalizedTime * 2);   

  const riniYOffset = triangleWave * riniFloatHeight;
  const entityYOffset = triangleWave * entityFloatHeight;

  scaleFactorRini = baseScale;
  scaleFactorEntity = baseScale;

  // draw Rini
  push();
    imageMode(CENTER);
    translate(220, 305 + riniYOffset);
    scale(scaleFactorRini);
    image(introRini, 0, 0, 450, 550);
  pop();

  // draw Entity
  push();
    imageMode(CENTER);
    translate(1060, 250 + entityYOffset);
    scale(scaleFactorEntity);
    image(introEntity, 0, 0, 450, 550);
  pop();


  push();
    textAlign(CENTER, CENTER);
    textSize(63);
    textFont(dokdoFont);
    
    // text stroke
    fill('#f84465');
    text("Super Adrenaline Junkies", width/2 - 2, 80); // left
    text("Super Adrenaline Junkies", width/2 + 2, 80); // right
    text("Super Adrenaline Junkies", width/2, 80 - 2); // top
    text("Super Adrenaline Junkies", width/2, 80 + 2); // bottom
    
    // main title
    fill(0);
    text("Super Adrenaline Junkies", width/2, 80);
  pop();

  const buttonWidth = 160;
  const buttonHeight = 244;
  const buttonSpacing = 60;
  let buttonY = height * 0.35;

  // play button
  const playY = buttonY;
  const playHovered = isButtonHovered(mouseX, mouseY, buttonY, { x: -80, y: -80 });
  const playScale = playHovered ? 1.1 : 1;  

  // manual button
  const manualY = buttonY + buttonSpacing;
  const manualHovered = isButtonHovered(mouseX, mouseY, buttonY + buttonSpacing, { x: -210, y: -40 });
  const manualScale = manualHovered ? 1.1 : 1; 

  const settingsX = width / 2 - buttonWidth / 2;
  const settingsY = buttonY + buttonSpacing * 2;
  const settingsHovered = mouseX > settingsX && mouseX < settingsX + buttonWidth &&
                        mouseY > settingsY - buttonHeight / 2 && mouseY < settingsY + buttonHeight / 2;

  // draw play button
  push();
  translate(width / 2, playY);
  rotate(10);
  scale(playScale);

  // shadow
  drawingContext.shadowOffsetX = 8;
  drawingContext.shadowOffsetY = 8;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  image(playButton, -50, -100, buttonWidth, buttonHeight);

  // reset shadow
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  pop();

  // draw manual button
  push();
  translate(width / 2, manualY);
  rotate(10);
  scale(manualScale);

  // shadow
  drawingContext.shadowOffsetX = 8;
  drawingContext.shadowOffsetY = 8;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  image(manualButton, -230, -20, buttonWidth, buttonHeight);

  // reset shadow
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  pop();

  // Draw Settings Button (keeping the original text-based style)
  // push();
  // translate(width / 2, settingsY);
  // scale(settingsHovered ? 1.1 : 1);
  // fill(100, settingsHovered ? 255 : 200);
  // rect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
  // fill(255);
  // textSize(24);
  // text("Settings", 0, 0);
  // pop();

  // Handle clicks
  if (mouseIsPressed) {
      if (playHovered) {
          handleButtonClick("Play");
      } else if (manualHovered) {
          handleButtonClick("Manual");
      } 
      // else if (settingsHovered) {
      //     handleButtonClick("Settings");
      // }
  }
}

function isButtonHovered(mouseX, mouseY, buttonY, buttonOffset) {
  const buttonWidth = 160;
  const buttonHeight = 244;
  const angle = 10; // degrees
  const rad = angle * Math.PI / 180;
  
  // center after trasnlation
  const buttonCenterX = width/2;
  const buttonCenterY = buttonY;
  
  // find position
  const adjustedButtonX = buttonCenterX + buttonOffset.x;
  const adjustedButtonY = buttonCenterY + buttonOffset.y;
  
  // mouse coordinates
  const relativeX = mouseX - adjustedButtonX;
  const relativeY = mouseY - adjustedButtonY;
  
  // Rotate the mouse coordinates in the opposite direction of the button's rotation
  // to check against an unrotated rectangle
  const rotatedX = relativeX * Math.cos(-rad) - relativeY * Math.sin(-rad);
  const rotatedY = relativeX * Math.sin(-rad) + relativeY * Math.cos(-rad);
  
  // check if within the button boundaries
  return (
    rotatedX >= -buttonWidth/2 &&
    rotatedX <= buttonWidth/2 &&
    rotatedY >= -buttonHeight/2 &&
    rotatedY <= buttonHeight/2
  );
}

function handleButtonClick(button) {
  switch (button) {
    case "Play":
      gameState = "story";
      storyTimer = 0;
      break;
    case "Manual":
      gameState = "manual";
      break;
    case "Settings":
      gameState = "settings";
      break;
  }
}

function drawGameStory() {
  tint(255, 126); 
  image(storyBG, 0, 0, width, height);
  
  textAlign(CENTER, CENTER);
  textSize(36);
  textFont(dokdoFont);
  
  let storyText = "In a world overrun by mysterious entities,\nRini must navigate through dangerous subway tunnels\nto reach the last safe haven...";
  
  // strokes
  fill(0);
  text(storyText, width/2 - 2, height/2);
  text(storyText, width/2 + 2, height/2);
  text(storyText, width/2, height/2 - 2);
  text(storyText, width/2, height/2 + 2);

  text(storyText, width/2 - 2, height/2 - 2);
  text(storyText, width/2 + 2, height/2 - 2);
  text(storyText, width/2 - 2, height/2 + 2);
  text(storyText, width/2 + 2, height/2 + 2);
  
  // main text 
  fill(255);
  text(storyText, width/2, height/2);

  storyTimer++;
  
  // show "press SPACE" after ~2 seconds for cool affect
  if (storyTimer > 80) {
    textSize(24);
    
    // stroke 
    let spaceText = "Press SPACE to continue";
    
    fill(0);
    text(spaceText, width/2 - 1, height * 0.75);
    text(spaceText, width/2 + 1, height * 0.75);
    text(spaceText, width/2, height * 0.75 - 1);
    text(spaceText, width/2, height * 0.75 + 1);
    
    // main text 
    fill(255);
    text(spaceText, width/2, height * 0.75);
    
    if (keyIsDown(32)) { 
      gameState = "game";
    }
  }
} 

// obstacles
function setupObstacles() {
  obstacles = [];
  let currentX = width * 2; // Start after initial screen
  
  while (currentX < goalX - width) {
    // Create first obstacle
    let type1 = random() > 0.5 ? 'box' : 'tires';
    obstacles.push(new Obstacle(currentX, type1));
    
    // 50% chance to add a second obstacle
    if (random() > 0.5) {
      let type2 = random() > 0.5 ? 'box' : 'tires';
      obstacles.push(new Obstacle(currentX + 150, type2));
    }
    
    // 30% chance to add a third obstacle
    if (random() > 0.7) {
      let type3 = random() > 0.5 ? 'box' : 'tires';
      obstacles.push(new Obstacle(currentX + 300, type3));
    }
    
    // Move to next position
    currentX += OBSTACLE_SPACING + random(200, 400);
  }
}

function drawManual() {
  background(50);
  textAlign(CENTER, TOP);
  textSize(36);
  textFont(playFont);
  fill(255);
  text("Game Manual", width/2, 50);
  
  textAlign(LEFT, TOP);
  textSize(24);
  textFont(dokdoFont);
  let instructions = [
    "Controls:",
    "- WASD",
    "- Arrow keys"
  ];
  
  let y = 150;
  for (let instruction of instructions) {
    text(instruction, width/4, y);
    y += 40;
  }
  
  drawBackButton();
}

function drawSettings() {
  background(50);
  textAlign(CENTER, TOP);
  textSize(36);
  fill(255);
  text("Settings", width/2, 50);
  
  // brightness slider
  textAlign(LEFT, CENTER);
  textSize(24);
  text("Brightness", width/4, height/3);
  drawSlider(width/2, height/3, brightness, (value) => brightness = value);
  
  // volume slider
  text("Volume", width/4, height/2);
  drawSlider(width/2, height/2, volume, (value) => volume = value);
  
  drawBackButton();
}

function drawSlider(x, y, value, onChange) {
  let sliderWidth = 200;
  let sliderHeight = 20;
  
  fill(100);
  rect(x, y - sliderHeight/2, sliderWidth, sliderHeight, 10);
  
  fill(200);
  let handleX = x + (value/100 * sliderWidth);
  ellipse(handleX, y, sliderHeight * 1.5);
  
  if (mouseIsPressed &&
      mouseX > x && mouseX < x + sliderWidth &&
      mouseY > y - sliderHeight && mouseY < y + sliderHeight) {
    let newValue = constrain(map(mouseX, x, x + sliderWidth, 0, 100), 0, 100);
    onChange(newValue);
  }
}

function drawBackButton() {
  let buttonX = width/2 - 100;
  let buttonY = height - 100;
  
  if (mouseX > buttonX && mouseX < buttonX + 200 &&
      mouseY > buttonY - 25 && mouseY < buttonY + 25) {
    fill(150);
    if (mouseIsPressed) {
      gameState = "intro";
    }
  } else {
    fill(100);
  }
  
  rect(buttonX, buttonY - 25, 200, 50, 10);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Back to Menu", width/2, buttonY);
}

function drawLayers() {
  let screenOffset = Math.floor(cameraX / width);

  // Increased range for better coverage
  for (let i = -2; i <= 4; i++) {
    let xOffset = (screenOffset + i) * width;

    // Background wall and rail
    push();
    translate(-cameraX * 0.5 + xOffset, 0);
    image(rail, 0, 0, width, height);
    pop();

    // Train
    push();
    translate(-cameraX * 0.6 + xOffset, 0);
    image(train, 0, 0, width, height);
    pop();

    // Columns
    push();
    translate(-cameraX * 0.7 + xOffset, 0);
    image(columns, 0, 0, width, height);
    pop();

    // Info post and wires
    push();
    translate(-cameraX * 0.8 + xOffset, 0);
    image(infopost, 0, 0, width, height);
    image(wires, 0, 0, width, height);
    pop();

    // Floor
    push();
    translate(-cameraX + xOffset, 0);
    image(floor, 0, 0, width, height);
    pop();
  }
}

// debatable goal!
function drawGoal() {
  push();
    translate(-cameraX, 0);
    image(gatewayCar, goalX, groundY - 120, 288, 118); 
  pop();
}

function checkGoal() {
  if (player.worldX > goalX) {
    gameWon = true;
  }
}

function displayWinScreen() {
  background(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  fill(255);
  text("You reached the goal!", width / 2, height / 2);
  textSize(20);
  text("Press R to restart", width / 2, height / 2 + 50);

  if (keyIsPressed && key.toLowerCase() === "r") {
    resetGame();
  }
}

function resetObstacles() {
  setupObstacles();
}

function resetGame() {
  player.worldX = width / 4;
  player.x = width / 4;
  player.y = height - 160;
  player.velocityX = 0;
  player.velocityY = 0;
  cameraX = 0;
  gameWon = false;
  gameOver = false;
  gameOverCause = ""; // Add this line
  gameState = "intro";
  garbo.active = false;
  playerIdleTime = 0;
  setupObstacles();
}

function drawPlayer() {
  push();
  imageMode(CENTER);
  
  // update animation frame
  if (Math.abs(player.velocityX) > 0.1) {
    frameCounter++;
    if (frameCounter >= frameDelay) {
      currentRiniFrame = (currentRiniFrame + 1) % riniSprites.length;
      frameCounter = 0;
    }
  } else {
    currentRiniFrame = 0; // reset
  }

  if (player.velocityX < 0) {
    facingLeft = true;
  } else if (player.velocityX > 0) {
    facingLeft = false;
  }

  push();
  translate(player.x + player.width/2, player.y + player.height/2);
  scale(facingLeft ? -1 : 1, 1);
  
  image(
    riniSprites[currentRiniFrame],
    0,
    0,
    player.width * 1.5, 
    player.height * 1.5
  );
  pop();
  
  pop();
}

function updatePlayer() {
  // Rini movements
  if ((keyIsDown(65) || keyIsDown(LEFT_ARROW)) && player.worldX > width/3) {  // Add minimum position check
    player.velocityX = -player.speed;
  } else if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {  // 'D' key or right arrow
    player.velocityX = player.speed;
  } else {
    player.velocityX *= 0.8;
  }

  if (Math.abs(player.velocityX) < 0.1) {
    player.velocityX = 0;
    currentRiniFrame = 0;
    frameCounter = 0;
  }

  // bounds checking before updating worldX
  const nextWorldX = player.worldX + player.velocityX;
  if (nextWorldX >= width/3) { // Only update if not going too far left
    player.worldX = nextWorldX;
  } else {
    player.worldX = width/3; 
  }
  
  player.x = width / 3;

  player.velocityY += 0.8;
  player.y += player.velocityY;

  if (player.y + player.height > groundY) {
    player.y = groundY - player.height;
    player.velocityY = 0;
  }
}

function updateAndDrawGarbo() {
  // Update idle time counter
  if (Math.abs(player.velocityX) < 0.1) {
    playerIdleTime++;
  } else {
      playerIdleTime = 0;
  }

  if (!garbo.active) {
      garbo.appearTimer++;
      
      if ((playerIdleTime > garbo.idleThreshold) || 
          (garbo.appearTimer > garbo.appearInterval && random(1) < 0.3)) {
          
          console.log("Garbo appearing!");
          garbo.active = true;
          garbo.x = player.worldX - width/2;
          garbo.y = groundY - garbo.height;
          garbo.currentChaseTime = garbo.chaseTime;
          garbo.appearTimer = 0;
          playerIdleTime = 0;
      }
  } else {
    // Update Garbo's position (chase logic)
    let distanceToPlayer = player.worldX - garbo.x;
    if (distanceToPlayer > 0) { // Only chase if Rini is ahead
      garbo.x += garbo.speed;
    }
    
    // Draw Garbo - removed flicker effect during chase
    push();
    imageMode(CENTER);
    translate(-cameraX + garbo.x, garbo.y + garbo.height/2);
    
    // Only flicker when first appearing
    if (garbo.currentChaseTime > garbo.chaseTime - 30) {
      if (frameCount % 4 < 2) {
        image(garbo.sprites[1], 0, 0, garbo.width, garbo.height);
      }
    } else {
      image(garbo.sprites[1], 0, 0, garbo.width, garbo.height);
    }
    pop();
    
    // Update chase timer
    garbo.currentChaseTime--;
    if (garbo.currentChaseTime <= 0) {
      garbo.active = false;
    }
    
    // Check for collision with player
    let adjustedGarboX = garbo.x - cameraX;
    // Check for collision with player
    if (Math.abs(player.worldX - garbo.x) < (player.width + garbo.width) / 2 &&
      player.y + player.height > garbo.y) {
      gameOver = true;
      gameOverCause = "garbo";
    }
  }
}

function displayGameOverScreen() {
  background(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  fill(255);
  
  text("Game Over!", width/2, height/2 - 60);
  
  // Different messages based on cause
  switch(gameOverCause) {
    case "garbo":
      text("Queen Garbo caught you!", width/2, height/2);
      break;
    case "box":
      text("You crashed into a box!", width/2, height/2);
      break;
    case "tires":
      text("You tripped over the tires!", width/2, height/2);
      break;
  }
  
  textSize(20);
  text("Press R to restart", width/2, height/2 + 80);

  if (keyIsPressed && key.toLowerCase() === 'r') {
    resetGame();
    gameOver = false;
    gameOverCause = ""; // Reset the cause
  }
}

function keyPressed() {
  // W or SPACE, jump
  if ((keyCode === 87 || keyCode === 32) && player.y + player.height >= groundY) {  // 'W' key or SPACE
    player.velocityY = -15;
  }
}