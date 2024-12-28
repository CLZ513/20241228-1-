let player1, player2;
let p1Sprites = {};
let p2Sprites = {};
let bgImage;

// 在檔案開頭添加地面高度常數
const GROUND_Y = window.innerHeight / 1.25;
const SCALE_FACTOR = 2.2; // 整體放大倍數

// 在檔案開頭添加物理相關常數
const GRAVITY = 0.8;
const JUMP_FORCE = -20;
const MOVE_SPEED = 8;

// 添加新的常數
const MAX_HP = 100;
const SCREEN_PADDING = 50; // 螢幕邊界padding

// 在檔案開頭添加新常數
const PROJECTILE_SPEED = 15;
const PROJECTILE_DAMAGE = 10;

// 添加背景粒子系統
let particles = [];

// 角色類別
class Fighter {
  constructor(x, y, sprites, config, isPlayer1) {
    this.x = x;
    this.y = y;
    this.sprites = sprites;
    this.config = config;
    this.currentAnimation = 'idle';
    this.frame = 0;
    this.frameCounter = 0;
    this.direction = 1;
    this.scale = SCALE_FACTOR;
    
    // 添加物理相關屬性
    this.velocityY = 0;
    this.isJumping = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.hp = MAX_HP;
    this.isPlayer1 = isPlayer1;
    this.isAttacking = false;
    this.attackBox = {
      width: 60,
      height: 50
    };
    this.projectiles = [];
  }

  update() {
    // 處理跳躍物理
    if (this.isJumping) {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;

      // 著地檢測
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.isJumping = false;
        if (!this.moveLeft && !this.moveRight) {
          this.currentAnimation = 'idle';
        }
      }
    }

    // 處理左右移動
    if (this.moveLeft) {
      const nextX = this.x - MOVE_SPEED;
      if (nextX > SCREEN_PADDING) {  // 檢查左邊界
        this.x = nextX;
      }
      this.direction = -1;
      if (!this.isJumping) this.currentAnimation = 'idle';
    }
    if (this.moveRight) {
      const nextX = this.x + MOVE_SPEED;
      if (nextX < windowWidth - SCREEN_PADDING) {  // 檢查右邊界
        this.x = nextX;
      }
      this.direction = 1;
      if (!this.isJumping) this.currentAnimation = 'idle';
    }

    // 檢查攻擊碰撞
    if (this.isAttacking) {
      this.checkAttackHit();
    }

    // 更新所有投射物
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update();
      
      // 檢查是否擊中對手
      const opponent = this.isPlayer1 ? player2 : player1;
      if (projectile.checkHit(opponent)) {
        opponent.takeDamage(PROJECTILE_DAMAGE);
        projectile.active = false;
        
        // 擊退效果
        const knockbackForce = 10;
        opponent.x += knockbackForce * projectile.direction;
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
      
      // 移除無效的投射物
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkAttackHit() {
    const opponent = this.isPlayer1 ? player2 : player1;
    
    // 計算當前角色的碰撞箱
    const myBox = {
      x: this.x - (this.config[this.currentAnimation].width * this.scale) / 2,
      y: this.y - this.config[this.currentAnimation].height * this.scale,
      width: this.config[this.currentAnimation].width * this.scale,
      height: this.config[this.currentAnimation].height * this.scale
    };

    // 計算對手的碰撞箱
    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    // 檢查碰撞
    if (this.checkCollision(myBox, opponentBox)) {
      if (!opponent.isHit && this.isAttacking) {
        opponent.takeDamage(10);
        opponent.isHit = true;
        
        // 擊退效果
        const knockbackForce = 20;
        const direction = this.direction;
        opponent.x += knockbackForce * direction;
        
        // 確保擊退不會超出螢幕邊界
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
    }
  }

  // 添加碰撞檢測輔助方法
  checkCollision(box1, box2) {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }

  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    
    // 受傷閃爍效果
    this.isHit = true;
    setTimeout(() => {
      this.isHit = false;
    }, 200);

    // 如果血量歸零
    if (this.hp <= 0) {
      this.handleDeath();
    }
  }

  attack() {
    if (!this.isAttacking) {
      this.currentAnimation = 'attack';
      this.isAttacking = true;
      this.frame = 0;
      
      // 修改發射位置的計算，根據方向調整
      const projectileX = this.x + (this.direction === 1 ? 50 : -50);
      const projectileY = this.y - 50;
      this.projectiles.push(new Projectile(projectileX, projectileY, this.direction, this.isPlayer1));
      
      // 重置攻擊狀態
      setTimeout(() => {
        this.isAttacking = false;
        if (!this.isJumping) {
          this.currentAnimation = 'idle';
        }
      }, 500);
    }
  }

  drawHP() {
    push();
    const hpBarWidth = 200;
    const hpBarHeight = 15;
    const x = this.x - hpBarWidth/2;
    const y = this.y - this.config[this.currentAnimation].height * this.scale - 40;
    
    // HP條背景
    fill(0, 0, 0, 0.7);
    stroke(UI_COLORS.border);
    rect(x, y, hpBarWidth, hpBarHeight, 8);
    
    // HP條
    const hpWidth = (this.hp / MAX_HP) * (hpBarWidth - 4);
    const hpColor = this.isPlayer1 ? UI_COLORS.primary : UI_COLORS.secondary;
    
    // 發光效果
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = hpColor;
    
    noStroke();
    fill(hpColor);
    rect(x + 2, y + 2, hpWidth, hpBarHeight - 4, 6);
    
    // HP數值
    textFont('Orbitron');
    textSize(12);
    textAlign(CENTER);
    fill(255);
    text(`${this.hp}%`, x + hpBarWidth/2, y - 5);
    pop();
  }

  jump() {
    if (!this.isJumping) {
      this.velocityY = JUMP_FORCE;
      this.isJumping = true;
      this.currentAnimation = 'jump';
    }
  }

  animate() {
    const currentConfig = this.config[this.currentAnimation];
    this.frameCounter++;
    
    if (this.frameCounter >= currentConfig.frameDelay) {
      this.frame = (this.frame + 1) % currentConfig.frames;
      this.frameCounter = 0;
    }

    push();
    translate(this.x, this.y);
    
    // 修改受傷閃爍效果
    if (this.isHit) {
      // 改為暗紅色調
      tint(139, 0, 0, 200);  // RGB(139, 0, 0) 是暗紅色，200是透明度
    }
    
    scale(this.direction * this.scale, this.scale);
    
    const frameWidth = this.sprites[this.currentAnimation].width / currentConfig.frames;
    const offsetY = currentConfig.offsetY || 0;
    
    image(
      this.sprites[this.currentAnimation],
      -currentConfig.width/2,
      -currentConfig.height + offsetY,
      currentConfig.width,
      currentConfig.height,
      frameWidth * this.frame,
      0,
      frameWidth,
      this.sprites[this.currentAnimation].height
    );
    pop();

    // 繪製所有投射物
    this.projectiles.forEach(projectile => {
      projectile.draw();
    });
  }

  // 添加死亡處理方法
  handleDeath() {
    // 遊戲結束，顯示獲勝者
    const winner = this.isPlayer1 ? "Player 2" : "Player 1";
    this.showGameOver(winner);
  }

  // 添加遊戲結束顯示方法
  showGameOver(winner) {
    push();
    textAlign(CENTER, CENTER);
    textSize(64);
    fill(255);
    text(winner + " Wins!", windowWidth/2, windowHeight/2);
    
    textSize(32);
    text("Press R to restart", windowWidth/2, windowHeight/2 + 50);
    pop();
    
    noLoop(); // 停止遊戲循環
  }
}

class Projectile {
  constructor(x, y, direction, isPlayer1) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.width = 30;
    this.height = 20;
    this.isPlayer1 = isPlayer1;
    this.active = true;
    this.angle = 0;  // 添加角度屬性用於旋轉效果
    this.particles = [];  // 添加粒子陣列
  }

  update() {
    this.x += PROJECTILE_SPEED * this.direction;
    this.angle += 0.2;  // 更新旋轉角度
    
    // 產生尾跡粒子
    this.particles.push({
      x: this.x,
      y: this.y,
      size: random(5, 15),
      alpha: 1,
      speedX: random(-1, 1),
      speedY: random(-1, 1)
    });
    
    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha -= 0.05;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    if (this.x < 0 || this.x > windowWidth) {
      this.active = false;
    }
  }

  draw() {
    push();
    // 繪製尾跡粒子
    this.particles.forEach(p => {
      let color = this.isPlayer1 ? 
        `rgba(255, 50, 50, ${p.alpha})` : 
        `rgba(50, 50, 255, ${p.alpha})`;
      fill(color);
      noStroke();
      circle(p.x, p.y, p.size);
    });
    
    // 繪製主體
    translate(this.x, this.y);
    rotate(this.angle);
    
    // 發光效果
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = this.isPlayer1 ? 
      'rgba(255, 0, 0, 0.8)' : 
      'rgba(0, 0, 255, 0.8)';
    
    // 能量球效果
    for (let i = 0; i < 3; i++) {
      fill(this.isPlayer1 ? 
        `rgba(255, ${50 + i * 50}, ${50 + i * 50}, ${0.3 + i * 0.2})` : 
        `rgba(${50 + i * 50}, ${50 + i * 50}, 255, ${0.3 + i * 0.2})`);
      ellipse(0, 0, this.width - i * 5, this.height - i * 5);
    }
    pop();
  }

  checkHit(opponent) {
    if (!this.active) return false;
    
    // 計算對手的碰撞箱
    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    // 檢查碰撞
    if (this.x + this.width/2 > opponentBox.x &&
        this.x - this.width/2 < opponentBox.x + opponentBox.width &&
        this.y + this.height/2 > opponentBox.y &&
        this.y - this.height/2 < opponentBox.y + opponentBox.height) {
      return true;
    }
    return false;
  }
}

// 角色動作配置
const player1Config = {
  idle: {
    frames: 6,          // 動畫幀數
    frameDelay: 8,      // 動畫速度（數字越大越慢）
    width: 41.1,         // 顯示寬度
    height: 53,        // 顯示高度
  },
  attack: {
    frames: 6,
    frameDelay: 4,
    width: 41.1,
    height: 53
  },
  jump: {
    frames: 6,
    frameDelay: 6,
    width: 69,
    height: 55
  }
};

const player2Config = {
  idle: {
    frames: 6,
    frameDelay: 8,
    width: 50,
    height: 43,
    offsetY: 0
  },
  attack: {
    frames: 6,            // 改為7幀，根據實際精靈圖的幀數
    frameDelay: 4,
    width: 36,
    height: 48,
    offsetY: 0
  },
  jump: {
    frames: 6,
    frameDelay: 6,
    width: 36,
    height:46,
    offsetY: 0
  }
};

function preload() {
  // 載入背景圖片
  bgImage = loadImage('bg.png');
  
  // 載入角色1的圖片
  p1Sprites = {
    idle: loadImage('run1.png'),      // 水平排列的精靈圖
    attack: loadImage('attack1.png'),  // 水平排列的精靈圖
    jump: loadImage('jump1.png')       // 水平排列的精靈圖
  };
  
  // 載入角色2的圖片
  p2Sprites = {
    idle: loadImage('run.png'),    // 水平排列的精靈圖
    attack: loadImage('attack.png'), // 水平排列的精靈圖
    jump: loadImage('jump.png')     // 水平排列的精靈圖
  };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 創建背景粒子
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(2, 5),
      speedX: random(-0.5, 0.5),
      speedY: random(-0.5, 0.5),
      color: color(random(150, 255), random(150, 255), 255, 150)
    });
  }
  
  // 創建兩個角色實例，加入 isPlayer1 參數
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
}

function draw() {
  // 繪製背景圖片
  image(bgImage, 0, 0, windowWidth, windowHeight);

  // 更新和繪製背景粒子
  updateParticles();
  
  // 繪製地板光暈效果
  drawFloorGlow();
  
  // 繪製操作說明
  drawControls();
  
  // 更新和繪製角色
  player1.update();
  player2.update();
  player1.animate();
  player2.animate();
  
  // 繪製血條
  player1.drawHP();
  player2.drawHP();
  
  // 繪製裝飾性邊框
  drawBorder();
  
  // 繪製操作說明和標題
  drawTitle();
}

// 添加背景粒子更新函數
function updateParticles() {
  particles.forEach(p => {
    // 更新位置
    p.x += p.speedX;
    p.y += p.speedY;
    
    // 邊界檢查
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    // 繪製粒子
    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(p.color);
    fill(p.color);
    noStroke();
    circle(p.x, p.y, p.size);
    pop();
  });
}

// 添加地板光暈效果
function drawFloorGlow() {
  push();
  let floorGradient = drawingContext.createLinearGradient(0, GROUND_Y - 100, 0, GROUND_Y + 20);
  floorGradient.addColorStop(0, 'rgba(0, 255, 200, 0)');
  floorGradient.addColorStop(0.5, 'rgba(0, 255, 200, 0.2)');
  floorGradient.addColorStop(1, 'rgba(0, 255, 200, 0)');
  
  drawingContext.fillStyle = floorGradient;
  noStroke();
  rect(0, GROUND_Y - 100, width, 120);
  
  // 添加地板線條
  stroke(UI_COLORS.border);
  strokeWeight(2);
  line(0, GROUND_Y, width, GROUND_Y);
  
  // 添加網格效果
  stroke(UI_COLORS.border);
  strokeWeight(1);
  for(let x = 0; x < width; x += 50) {
    line(x, GROUND_Y, x + 30, GROUND_Y + 20);
  }
  pop();
}

// 添加裝飾性邊框
function drawBorder() {
  push();
  stroke(UI_COLORS.border);
  strokeWeight(2);
  noFill();
  
  // 角落裝飾
  const cornerSize = 80;
  
  // 左上角
  beginShape();
  vertex(0, cornerSize);
  vertex(0, cornerSize/2);
  vertex(cornerSize/2, 0);
  vertex(cornerSize, 0);
  endShape();
  
  // 右上角
  beginShape();
  vertex(width - cornerSize, 0);
  vertex(width - cornerSize/2, 0);
  vertex(width, cornerSize/2);
  vertex(width, cornerSize);
  endShape();
  
  // 左下角
  beginShape();
  vertex(0, height - cornerSize);
  vertex(0, height - cornerSize/2);
  vertex(cornerSize/2, height);
  vertex(cornerSize, height);
  endShape();
  
  // 右下角
  beginShape();
  vertex(width - cornerSize, height);
  vertex(width - cornerSize/2, height);
  vertex(width, height - cornerSize/2);
  vertex(width, height - cornerSize);
  endShape();
  
  pop();
}

// 修改繪製標題的函數
function drawTitle() {
  push();
  const title = 'TKUET';
  textAlign(CENTER, TOP);
  textFont('Orbitron');
  
  // 外發光效果
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = UI_COLORS.primary;
  
  // 主標題
  textSize(52);
  fill(UI_COLORS.primary);
  text(title, windowWidth/2, 30);
  pop();
}

// 修改操作說明位置和樣式
function drawControls() {
  push();
  const boxWidth = 180;
  const boxHeight = 130;
  
  // 玩家1控制說明 (左上角)
  drawControlBox(20, 20, boxWidth, boxHeight, 
                '玩家一 控制鍵', 
                [
                  'A / D - 移動',
                  'W - 跳躍',
                  'F - 攻擊'
                ],
                color(255, 100, 100, 80));
  
  // 玩家2控制說明 (右上角)
  drawControlBox(windowWidth - boxWidth - 20, 20, 
                boxWidth, boxHeight,
                '玩家二 控制鍵',
                [
                  '←/→ - 移動',
                  '↑ - 跳躍',
                  '/ - 攻擊'
                ],
                color(100, 100, 255, 80));
  pop();
}

// 修改 drawControlBox 函數中的文字大小和間距
function drawControlBox(x, y, width, height, title, controls, boxColor) {
  push();
  
  // 半透明背景
  fill(UI_COLORS.background);
  stroke(UI_COLORS.border);
  strokeWeight(2);
  
  // 繪製斜邊裝飾
  beginShape();
  vertex(x, y + 20);
  vertex(x + 20, y);
  vertex(x + width - 20, y);
  vertex(x + width, y + 20);
  vertex(x + width, y + height - 20);
  vertex(x + width - 20, y + height);
  vertex(x + 20, y + height);
  vertex(x, y + height - 20);
  endShape(CLOSE);
  
  // 標題
  fill(boxColor);
  noStroke();
  textFont('Orbitron');
  textSize(16); // 稍微縮小標題字體
  textAlign(CENTER, CENTER);
  text(title, x + width/2, y + 25);
  
  // 控制說明
  textSize(13); // 縮小說明文字
  textAlign(LEFT, TOP);
  controls.forEach((control, index) => {
    const yPos = y + 55 + index * 25; // 調整垂直間距
    
    // 指令框
    fill(UI_COLORS.border);
    rect(x + 15, yPos, width - 30, 20, 5); // 調整框的大小和位置
    
    // 文字
    fill(255);
    text(control, x + 25, yPos + 3); // 調整文字位置
  });
  
  pop();
}

// 修改按鍵控制
function keyPressed() {
  // 角色1控制
  switch (keyCode) {
    case 65: // A
      player1.moveLeft = true;
      break;
    case 68: // D
      player1.moveRight = true;
      break;
    case 87: // W
      player1.jump();
      break;
    case 70: // F
      player1.attack();
      break;
  }
  
  // 角色2控制
  switch (keyCode) {
    case LEFT_ARROW:
      player2.moveLeft = true;
      break;
    case RIGHT_ARROW:
      player2.moveRight = true;
      break;
    case UP_ARROW:
      player2.jump();
      break;
    case 191: // /
      player2.attack();
      break;
  }

  // 重新開始遊戲
  if (keyCode === 82) { // R鍵
    resetGame();
  }
}

function keyReleased() {
  // 角色1控制
  switch (keyCode) {
    case 65: // A
      player1.moveLeft = false;
      if (!player1.moveRight && !player1.isJumping) player1.currentAnimation = 'idle';
      break;
    case 68: // D
      player1.moveRight = false;
      if (!player1.moveLeft && !player1.isJumping) player1.currentAnimation = 'idle';
      break;
    case 70: // F
      if (!player1.isJumping) player1.currentAnimation = 'idle';
      break;
  }
  
  // 角色2控制
  switch (keyCode) {
    case LEFT_ARROW:
      player2.moveLeft = false;
      if (!player2.moveRight && !player2.isJumping) player2.currentAnimation = 'idle';
      break;
    case RIGHT_ARROW:
      player2.moveRight = false;
      if (!player2.moveLeft && !player2.isJumping) player2.currentAnimation = 'idle';
      break;
    case 191: // /
      if (!player2.isJumping) player2.currentAnimation = 'idle';
      break;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 更新地面高度
  GROUND_Y = window.innerHeight / 1;
  // 更新角色位置
  player1.y = GROUND_Y;
  player2.y = GROUND_Y;
}

// 添加重置遊戲函數
function resetGame() {
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
  loop(); // 重新開始遊戲循環
}

// 修改常數配置
const UI_COLORS = {
  primary: '#00ff88',
  secondary: '#0088ff',
  accent: '#ff0088',
  background: 'rgba(0, 20, 40, 0.85)',
  border: 'rgba(0, 255, 200, 0.3)'
};
