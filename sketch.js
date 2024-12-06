// Author: Lamar Jambi
// Screens:
// intro = menu page with "start", "manual", and "settings"
// gameStory = a little story/context before the game level 
// startGame = the actual game level using WAS keys for movements 
// manual = just a text for instructions for the player
// settings = brightness and volume settings

// sounds
let bgMusic;
let riniSound;
let entitySound;

// Add goal variable to globals
let player;
let groundY;
let cameraX = 0;
let goalX = 5000; // Distance to goal
let gameWon = false;
let gameState = "intro"; // possible states: "intro", "story", "game", "manual", "settings"

// fonts
let playFont;
let dokdoFont;

// buttons
let playButton;
let manualButton;

// Add these variables at the top with your other global variables:
let animationTimer = 0;
let scaleFactorRini = 1;
let scaleFactorEntity = 1;
const ANIMATION_PERIOD = 120; // 2 seconds at 60fps

// Settings variables
let brightness = 100;
let volume = 100;

// Story variables
let storyTimer = 0;
let storyDuration = 180; // 3 seconds at 60fps

// intro page
let introRini;
let introEntity;
let introBG;
let storyBG;

// Background layers
let bg;
let columns;
let floor;
let infopost;
let rail;
let train;
let wires;

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
  storyBG = loadImage("assets/postapocalypse3.png")

  // background elements
  bg = loadImage("assets/Bright/bg.png");
  columns = loadImage("assets/Bright/columns&floor.png");
  floor = loadImage("assets/Bright/floor&underfloor.png");
  infopost = loadImage("assets/Bright/infopost&wires.png");
  rail = loadImage("assets/Bright/rail&wall.png");
  train = loadImage("assets/Bright/train.png");
  wires = loadImage("assets/Bright/wires.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  groundY = height - 100;

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

  // Apply brightness filter to everything
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
      if (!gameWon) {
        updatePlayer();
        cameraX = player.worldX - player.x;
        drawLayers();
        drawPlayer();
        drawGoal();
        checkGoal();
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

buttons = [
  { x: width / 2, y: height * 0.35, width: 160, height: 244, angle: 10, image: playButton },
  { x: width / 2, y: height * 0.35 + 60, width: 160, height: 244, angle: 10, image: manualButton },
  { x: width / 2, y: height * 0.35 + 120, width: 160, height: 244, angle: 0, image: null }
];

function drawStartingPage() {
  image(introBG, 0, 0, width, height);

  // Update animation timer
  animationTimer = (animationTimer + 1) % ANIMATION_PERIOD;

  // Calculate smoother scale factors and offsets
  const baseScale = 1;

  // Modified vertical movement parameters
  const floatSpeed = 0.1; // Controls how fast the characters float
  const riniFloatHeight = -20;  // Rini floats downward
  const entityFloatHeight = 20;  // Entity floats upward

  // Create sawtooth wave pattern for reversing animation
  const normalizedTime = (animationTimer % ANIMATION_PERIOD) / ANIMATION_PERIOD;
  const triangleWave = normalizedTime < 0.5 
      ? normalizedTime * 2          // First half: 0 to 1
      : 2 - (normalizedTime * 2);   // Second half: 1 to 0

  // Calculate vertical positions using the triangle wave pattern
  const riniYOffset = triangleWave * riniFloatHeight;
  const entityYOffset = triangleWave * entityFloatHeight;

  // Calculate scale without the bouncing effect
  scaleFactorRini = baseScale;
  scaleFactorEntity = baseScale;

  // Draw Rini with downward floating movement
  push();
  imageMode(CENTER);
  translate(220, 305 + riniYOffset);
  scale(scaleFactorRini);
  image(introRini, 0, 0, 450, 550);
  pop();

  // Draw Entity with upward floating movement
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
    
    // Draw the white border/stroke
    fill('#f84465');
    text("Super Adrenaline Junkies", width/2 - 2, 80); // left
    text("Super Adrenaline Junkies", width/2 + 2, 80); // right
    text("Super Adrenaline Junkies", width/2, 80 - 2); // top
    text("Super Adrenaline Junkies", width/2, 80 + 2); // bottom
    
    // Draw the main black text on top
    fill(0);
    text("Super Adrenaline Junkies", width/2, 80);
  pop();

  // First add these measurements right after your animation code:
  // Button measurements and positions
  const buttonWidth = 160;
  const buttonHeight = 244;
  const buttonSpacing = 60;
  let buttonY = height * 0.35;

  // Play Button
  const playX = width / 2 - buttonWidth / 2;
  const playY = buttonY;
  const playHovered = isButtonHovered(mouseX, mouseY, buttonY, { x: -80, y: -80 });
  const playScale = playHovered ? 1.1 : 1;  // Add this line

  // Manual Button
  const manualX = width / 2 - buttonWidth / 2;
  const manualY = buttonY + buttonSpacing;
  const manualHovered = isButtonHovered(mouseX, mouseY, buttonY + buttonSpacing, { x: -210, y: -40 });
  const manualScale = manualHovered ? 1.1 : 1;  // Add this line

  // Settings Button remains as text-based button
  const settingsX = width / 2 - buttonWidth / 2;
  const settingsY = buttonY + buttonSpacing * 2;
  const settingsHovered = mouseX > settingsX && mouseX < settingsX + buttonWidth &&
                        mouseY > settingsY - buttonHeight / 2 && mouseY < settingsY + buttonHeight / 2;

  // Draw Play Button
  push();
  translate(width / 2, playY);
  rotate(10);
  scale(playScale);
  // Add shadow
  drawingContext.shadowOffsetX = 8;
  drawingContext.shadowOffsetY = 8;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  image(playButton, -50, -100, buttonWidth, buttonHeight);
  // Reset shadow
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  pop();

  // Draw Manual Button
  push();
  translate(width / 2, manualY);
  rotate(10);
  scale(manualScale);
  // Add shadow
  drawingContext.shadowOffsetX = 8;
  drawingContext.shadowOffsetY = 8;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  image(manualButton, -230, -20, buttonWidth, buttonHeight);
  // Reset shadow
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
  
  // Calculate the button's center position after translation
  const buttonCenterX = width/2;
  const buttonCenterY = buttonY;
  
  // Apply the button's offset to find its actual position
  const adjustedButtonX = buttonCenterX + buttonOffset.x;
  const adjustedButtonY = buttonCenterY + buttonOffset.y;
  
  // Get mouse coordinates relative to the button's center
  const relativeX = mouseX - adjustedButtonX;
  const relativeY = mouseY - adjustedButtonY;
  
  // Rotate the mouse coordinates in the opposite direction of the button's rotation
  // to check against an unrotated rectangle
  const rotatedX = relativeX * Math.cos(-rad) - relativeY * Math.sin(-rad);
  const rotatedY = relativeX * Math.sin(-rad) + relativeY * Math.cos(-rad);
  
  // Check if the rotated point is within the button boundaries
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
  // Draw story background
  tint(255, 126);  // 50% transparent white tint
  image(storyBG, 0, 0, width, height);
  
  textAlign(CENTER, CENTER);
  textSize(36);
  textFont(dokdoFont);
  
  // Story text with stroke effect
  let storyText = "In a world overrun by mysterious entities,\nRini must navigate through dangerous subway tunnels\nto reach the last safe haven...";
  
  // Draw the black stroke/outline
  fill(0);
  text(storyText, width/2 - 2, height/2);
  text(storyText, width/2 + 2, height/2);
  text(storyText, width/2, height/2 - 2);
  text(storyText, width/2, height/2 + 2);
  // Add diagonals for better coverage
  text(storyText, width/2 - 2, height/2 - 2);
  text(storyText, width/2 + 2, height/2 - 2);
  text(storyText, width/2 - 2, height/2 + 2);
  text(storyText, width/2 + 2, height/2 + 2);
  
  // Draw the main text in white on top
  fill(255);
  text(storyText, width/2, height/2);
  
  // Update story timer
  storyTimer++;
  
  // Show "Press SPACE to continue" after 2 seconds
  if (storyTimer > 80) {
    textSize(24);
    
    // Add stroke to "Press SPACE" text too
    let spaceText = "Press SPACE to continue";
    
    // Draw the black stroke
    fill(0);
    text(spaceText, width/2 - 1, height * 0.75);
    text(spaceText, width/2 + 1, height * 0.75);
    text(spaceText, width/2, height * 0.75 - 1);
    text(spaceText, width/2, height * 0.75 + 1);
    
    // Draw the main text in white
    fill(255);
    text(spaceText, width/2, height * 0.75);
    
    if (keyIsDown(32)) { // Space key
      gameState = "game";
    }
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
  
  // Brightness slider
  textAlign(LEFT, CENTER);
  textSize(24);
  text("Brightness", width/4, height/3);
  drawSlider(width/2, height/3, brightness, (value) => brightness = value);
  
  // Volume slider
  text("Volume", width/4, height/2);
  drawSlider(width/2, height/2, volume, (value) => volume = value);
  
  drawBackButton();
}

function drawSlider(x, y, value, onChange) {
  let sliderWidth = 200;
  let sliderHeight = 20;
  
  // Draw slider background
  fill(100);
  rect(x, y - sliderHeight/2, sliderWidth, sliderHeight, 10);
  
  // Draw slider handle
  fill(200);
  let handleX = x + (value/100 * sliderWidth);
  ellipse(handleX, y, sliderHeight * 1.5);
  
  // Handle interaction
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
  // Calculate how many times we need to repeat each layer
  let screenOffset = Math.floor(cameraX / width);

  // For each layer, draw multiple instances to create infinite scroll
  for (let i = -1; i <= 2; i++) {
    let xOffset = (screenOffset + i) * width;

    // Background wall and rail (slowest)
    push();
    translate(-cameraX * 0.2 + xOffset, 0);
    image(rail, 0, 0, width, height);
    pop();

    // Train
    push();
    translate(-cameraX * 0.4 + xOffset, 0);
    image(train, 0, 0, width, height);
    pop();

    // Columns
    push();
    translate(-cameraX * 0.6 + xOffset, 0);
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

function drawGoal() {
  // Draw goal post
  push();
  translate(-cameraX, 0);
  fill(255, 215, 0); // Gold color
  rect(goalX, groundY - 100, 50, 100);
  // Draw flag
  fill(255, 0, 0);
  triangle(goalX, groundY - 100, goalX + 50, groundY - 80, goalX, groundY - 60);
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

function resetGame() {
  player.worldX = width / 4;
  player.x = width / 4;
  player.y = height - 160;
  player.velocityX = 0;
  player.velocityY = 0;
  cameraX = 0;
  gameWon = false;
  gameState = "intro";
}

function drawPlayer() {
  fill(200, 50, 50);
  rect(player.x, player.y, player.width, player.height);
}

function updatePlayer() {
  // Move player - check for both arrow keys and A/D
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) {  // 'A' key or left arrow
    player.velocityX = -player.speed;
  } else if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {  // 'D' key or right arrow
    player.velocityX = player.speed;
  } else {
    player.velocityX *= 0.8;
  }

  player.worldX += player.velocityX;
  player.x = width / 3;

  player.velocityY += 0.8;
  player.y += player.velocityY;

  if (player.y + player.height > groundY) {
    player.y = groundY - player.height;
    player.velocityY = 0;
  }
}

function keyPressed() {
  // Jump when either W or SPACE is pressed
  if ((keyCode === 87 || keyCode === 32) && player.y + player.height >= groundY) {  // 'W' key or SPACE
    player.velocityY = -15;
  }
}