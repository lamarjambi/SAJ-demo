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
// notes: small gameplay make it more in respect to the screen, more platforms to jump on, 
// make hearts bigger and when Rini loses a life -> color change and only loses when all 3 lives are taken


// sounds
let bgMusic;
let winSound;
let garboSound;
let loseSound;

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
let frameDelay = 8;
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
  appearInterval: 180, 
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
let gameOverCause = ""; // "garbo", "box", "tires", or ""
let lives = 3;
let maxLives = 3;
let heartsSprite; 
let deathScreenTimer = 0;
let showingDeathScreen = false;
let player;
let groundY;
let cameraX = 0;
let goalX = 8000; 
let gameWon = false;
let gameState = "intro"; // "intro", "story", "game", "manual", "settings"

// red flash light
let redFlashAlpha = 0;
const FLASH_DURATION = 30;

// obstacles
let box;
let tires;
let obstacles = [];
const OBSTACLE_SPACING = 400;

// platform
let platforms;
let tiles;

// confetti :P
let confetti = [];
const CONFETTI_COUNT = 100;
const CONFETTI_COLORS = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#98FB98'];

class Obstacle {
  constructor(x, type, yPos = null) {
    this.worldX = x;
    this.y = yPos || (groundY + 10); // Use provided y position or default
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

class Platform {
  constructor(x, y, width) {
    this.worldX = x;
    this.y = groundY - 40;
    this.width = 120;
    this.height = 30;
    this.isPlayerOn = false;
  }

  draw() {
    push();
    translate(-cameraX, 0);
    image(tiles, this.worldX, this.y - this.height, this.width, this.height);
    pop();
  }

  checkCollision(player) {
    let playerWorldX = player.worldX;
    let prevY = player.y;
    let collisionMargin = 10;
    
    // Check horizontal collision
    let horizontalCollision = 
      playerWorldX + player.width - collisionMargin > this.worldX &&
      playerWorldX + collisionMargin < this.worldX + this.width;
    
    // Check vertical collision
    let verticalPosition = player.y + player.height;
    let platformTop = this.y - this.height;
    
    // collision when:
    // player is falling (+ velocityY)
    // player is within a certain distance above the platform
    let validCollisionHeight = 
      verticalPosition >= platformTop - 10 && 
      verticalPosition <= platformTop + 10;
    
    if (horizontalCollision) {
      if (player.velocityY >= 0 && validCollisionHeight) {
        // landing on platform
        player.y = platformTop - player.height  -10;
        player.velocityY = 0;
        this.isPlayerOn = true;
        return true;

      } else if (verticalPosition > platformTop && prevY + player.height <= platformTop) {
        player.velocityY = 0;
        player.y = platformTop - player.height - 10;
      }
    }
    
    // if player moves off platform horizontally -> they're no longer on it
    if (!horizontalCollision) {
      this.isPlayerOn = false;
    }
    
    return false;
  }

  isOnPlatform(player) {
    return this.isPlayerOn;
  }
}

class Confetti {
  constructor() {
    this.reset();
    this.y = random(-height, 0); 
  }
  
  reset() {
    this.x = random(width);
    this.y = -10;
    this.speed = random(3, 8);
    this.size = random(4, 8);
    this.color = random(CONFETTI_COLORS);
    this.angle = random(TWO_PI);
    this.spinSpeed = random(-0.1, 0.1);
    this.swaySpeed = random(0.1, 0.5);
    this.swayAmount = random(2, 5);
  }
  
  update() {
    this.y += this.speed;
    this.x += sin(frameCount * this.swaySpeed) * this.swayAmount;
    this.angle += this.spinSpeed;
    
    // Reset when off screen
    if (this.y > height) {
      this.reset();
    }
  }
  
  show() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(this.color);
    noStroke();
    rect(-this.size/2, -this.size/2, this.size, this.size);
    pop();
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

  // tiles
  tiles = loadImage("assets/obstacles/tiles/Tile_54.png");

  // game 
  gatewayCar = loadImage("assets/obstacles/objects/cars/1.png");
  heartsSprite = loadImage("assets/heart.png");

  // sounds
  bgMusic = loadSound("assets/space-station.mp3");
  winSound = loadSound("assets/game-level.mp3");
  garboSound = loadSound("assets/zombie.mp3");
  loseSound = loadSound("assets/game-over.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  groundY = height - 100;
  setupObstacles();
  setupPlatforms();
  setupPlatformObstacles();

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
      
      for (let platform of platforms) {
        platform.draw();
        platform.checkCollision(player);
      }
      
      for (let obstacle of obstacles) {
        obstacle.draw();
        if (obstacle.checkCollision(player)) {
          if (!redFlashAlpha) {
            lives--;
            redFlashAlpha = 255;
            gameOverCause = obstacle.type;
            
            if (lives <= 0) {
              gameOver = true;
              break;
            }
          }
          break;
        }
      }
        
        drawPlayer();
        updateAndDrawGarbo();
        drawGoal();
        checkGoal();
        
        if (redFlashAlpha > 0) {
          push();
          fill(255, 0, 0, redFlashAlpha);
          noStroke();
          rect(0, 0, width, height);
          redFlashAlpha = max(0, redFlashAlpha - (255 / FLASH_DURATION));
          pop();
        }
        
        drawHearts();
      
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
  
  let storyText = "In a world overrun by mysterious entities,\nRini must navigate through the dangerous portal\nto reach the last gateway truck to a safer haven...";
  
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

function drawHearts() {
  push();
    translate(20, 20);
    
    let scale = 1.2;
    let singleHeartWidth = heartsSprite.width / 3 + 3; 
    let heartHeight = heartsSprite.height;
    
    for(let i = 0; i < maxLives; i++) {
      push();
      if(i < lives) {
        tint(255);
      } else {
        tint(128);
      }
      
      image(heartsSprite, 
            i * (singleHeartWidth * scale - 10), 0, 
            singleHeartWidth * scale, heartHeight * scale,  
            0, 0,  
            singleHeartWidth, heartHeight 
      );
      pop();
    }
  pop();
}

function displayDeathScreen() {
  background(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  fill("#f0df46");
  textFont(dokdoFont);

  switch(gameOverCause) {
    case "garbo":
      text("Queen Garbo caught you!! But you managed to escape!", width/2, height/2);
      break;
    case "box":
      text("Oh, shoot! You hit a mysterious box.. But you recovered!", width/2, height/2);
      break;
    case "tires":
      text("Ouch! Those magical tires got you.. But you got back up!", width/2, height/2);
      break;
  }
}

// obstacles
function setupObstacles() {
  obstacles = [];
  let currentX = width * 2; 
  
  while (currentX < goalX - width) {
    // initial obstacle
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
      // Increased spacing from 300 to 500
      obstacles.push(new Obstacle(currentX + 500, type3));
    }
    
    currentX += 800 + random(350, 500);
  }
}

function setupPlatforms() {
  platforms = []; 
  let currentX = width * 2;
  
  while (currentX < goalX - width) {
    if (random() > 0.4) {
      // initial platform
      platforms.push(new Platform(currentX, groundY, 120));
      
      // 80% chance to continue
      let platformLength = 1;
      while (random() > 0.2 && platformLength < 5) { 
        currentX += 120; // no gap between tiles
        platforms.push(new Platform(currentX, groundY, 120));
        platformLength++;
      }
    }
    
    // shorter gaps between tires
    currentX += 400 + random(100, 200);
  }
}

function setupPlatformObstacles() {
  for (let platform of platforms) {
    if (random() > 0.6) {
      console.log("platform obstacles!!!");
      let obstacleType = random() > 0.6 ? 'box' : 'tires';
    
      let obstacleY = platform.y - platform.height; 
      
      obstacles.push(new Obstacle(
        platform.worldX + platform.width/2, 
        obstacleType,
        obstacleY
      ));
    }
  }
}

function drawManual() {
  background(30);
  
  push();
    textAlign(CENTER, TOP);
    textSize(36);
    textFont(playFont);
    fill(255);
    text("Game Manual", width/2, 50);
    
    textAlign(LEFT, TOP);
    textSize(24);
    textFont(dokdoFont);
    let instructions = [
      "Help Rini escape the this junkyard realm!",
      "Controls (both work):",
      "- WASD keys",
      "- Arrow keys + Space to jump",

      "Gameplay:",
      "- Queen Garbo is chasing Rini! Run away from her!",
      "- Beware of the boxes and tires on the ground--they're booby traps!"
    ];
    
    let y = 150;
    for (let instruction of instructions) {
      text(instruction, width/4, y);
      y += 40;
    }
  pop();
    let buttonX = 20;
    let buttonY = 20;
    let buttonSize = 40;
    
    // check if mouse is over button
    let isHovered = mouseX > buttonX && 
                    mouseX < buttonX + buttonSize && 
                    mouseY > buttonY && 
                    mouseY < buttonY + buttonSize;
  push(); 
    // draw button background
    noStroke();
    fill(isHovered ? '#f84465' : 255);
    rect(buttonX, buttonY, buttonSize, buttonSize);

    fill(0); 
    textAlign(CENTER, CENTER); 
    textSize(32);
    textFont(playFont);

    text("X", buttonX + buttonSize/2 + 2, buttonY + buttonSize/2 + 1);
  pop(); 
  
  if (isHovered && mouseIsPressed) {
    gameState = "intro";
  }
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
  let buttonX = 100;
  let buttonY = 100;
  let buttonSize = 100;
  
  // Check if mouse is over the X button
  if (mouseX > buttonX - buttonSize/2 && mouseX < buttonX + buttonSize/2 &&
      mouseY > buttonY - buttonSize/2 && mouseY < buttonY + buttonSize/2) {
    fill('#f84465'); // Using the same pink color from the title for consistency
    if (mouseIsPressed) {
      gameState = "intro";
    }
  } else {
    fill(255); // White color for better visibility
  }
  
  // Draw X button
  textAlign(CENTER, CENTER);
  textSize(40); // Made text slightly larger
  textFont(dokdoFont); // Using the Dokdo font for consistency
  text("×", buttonX, buttonY);
}

function drawLayers() {
  let screenOffset = Math.floor(cameraX / width);

  for (let i = -2; i <= 4; i++) {
    let xOffset = (screenOffset + i) * width;

    // background wall and rail
    push();
      translate(-cameraX * 0.5 + xOffset, 0);
      image(rail, 0, 0, width, height);
    pop();

    // train
    push();
      translate(-cameraX * 0.6 + xOffset, 0);
      image(train, 0, 0, width, height);
    pop();

    // columns
    push();
      translate(-cameraX * 0.7 + xOffset, 0);
      image(columns, 0, 0, width, height);
    pop();

    // info post and wires
    push();
      translate(-cameraX * 0.8 + xOffset, 0);
      image(infopost, 0, 0, width, height);
      image(wires, 0, 0, width, height);
    pop();

    // floor
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

  // confetti initiation
  if (confetti.length === 0) {
    // initialize confetti if not already done
    for (let i = 0; i < CONFETTI_COUNT; i++) {
        confetti.push(new Confetti());
    }
  }

  for (let p of confetti) {
      p.update();
      p.show();
  }

  textSize(32);
  textAlign(CENTER, CENTER);
  fill(255);
  textFont(playFont);
  fill("#f0df46");
  text("You escaped Queen Garbo's shackles!!", width / 2, height / 2);
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
  gameOverCause = "";
  gameState = "intro";
  garbo.active = false;
  playerIdleTime = 0;
  lives = 3; 
  setupObstacles();
  setupPlatforms();
  setupPlatformObstacles();
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
  if ((keyIsDown(65) || keyIsDown(LEFT_ARROW)) && player.worldX > width/3) { 
    player.velocityX = -player.speed;
  } else if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {  // 'D' or right arrow
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
  if (nextWorldX >= width/3) { 
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
    let distanceToPlayer = player.worldX - garbo.x;
    if (distanceToPlayer > 0) { // only chase if Rini is ahead
      garbo.x += garbo.speed;
    }
    
    push();
      imageMode(CENTER);
      translate(-cameraX + garbo.x, garbo.y + garbo.height/2);
      
      if (garbo.currentChaseTime > garbo.chaseTime - 30) {
        if (frameCount % 4 < 2) {
          image(garbo.sprites[1], 0, 0, garbo.width, garbo.height);
        }
      } else {
        image(garbo.sprites[1], 0, 0, garbo.width, garbo.height);
      }
    pop();
    
    garbo.currentChaseTime--;
    if (garbo.currentChaseTime <= 0) {
      garbo.active = false;
    }
    
    // collision with player
    if (Math.abs(player.worldX - garbo.x) < (player.width + garbo.width) / 2 &&
    player.y + player.height > garbo.y) {
      lives--;
      if(lives <= 0) {
        gameOver = true;
      } else {
        showingDeathScreen = true;
      }

      gameOverCause = "garbo";
    }
  }
}

function displayGameOverScreen() {
  background(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  fill("#f0df46");
  textFont(playFont);

  text("Game Over!", width/2, height/2 - 60);
  
  textFont(dokdoFont);
  fill("#f0df46");
  switch(gameOverCause) {
    case "garbo":
      text("Queen Garbo caught you!! She'll throw you in the deepest pit!!", width/2, height/2);
      break;
    case "box":
      text("Oh, shoot! You stepped into Queen Garbo's mysterious box..", width/2, height/2);
      break;
    case "tires":
      text("Nooo!! You stumbled into a new realm inside the magical tires!!", width/2, height/2);
      break;
  }
  
  textFont(dokdoFont);
  fill("#f0df46");
  textSize(20);
  text("Press R to restart", width/2, height/2 + 80);

  if (keyIsPressed && key.toLowerCase() === 'r') {
    resetGame();
    gameOver = false;
    gameOverCause = ""; 
  }
}

function resetPlayerPosition() {
  player.x = width / 4;
  player.worldX = width / 4;
  player.y = height - 160;
  player.velocityX = 0;
  player.velocityY = 0;
  cameraX = 0;
  garbo.active = false;
  playerIdleTime = 0;
}

function keyPressed() {
  // W or SPACE, jump when on ground OR on platform
  if (keyCode === 87 || keyCode === 32) {

    // these checks are for jumping when the player is on the platform!
    // check if on ground
    let canJump = player.y + player.height >= groundY;
    
    // check if on any platform
    if (!canJump) {  // only check platforms if not on ground
      for (let platform of platforms) {
        if (platform.isPlayerOn) {
          canJump = true;
          break;
        }
      }
    }
    
    if (canJump) {
      player.velocityY = -15;
    }
  }
}