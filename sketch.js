let backgroundImg;
let bulletImg, explosionImg, hitImg;  // 子彈圖片、爆炸圖片、命中圖片

let sprites = {
  xiaozhi: {
    move: {  // 移动动作
      img: null,
      width: 50,
      height: 43,
      frames: 6,
      path: 'run.png'  // 可指定图片位置
    },
    jump: {  // 跳跃动作
      img: null,
      width: 36,
      height: 46,
      frames: 6,
      path: 'jump.png'
    },
    attack: {  // 攻击动作
      img: null,
      width: 36,
      height: 48,
      frames: 6,
      path: 'attack.png'
    }
  },
  xiaomei: {
    move: {
      img: null,
      width: 41.1,
      height: 53,
      frames: 6,
      path: 'run1.png'
    },
    jump: {
      img: null,
      width: 69,
      height: 55,
      frames: 6,
      path: 'jump1.png'
    },
    attack: {
      img: null,
      width: 41.1,
      height: 53,
      frames: 6,
      path: 'attack1.png'
    }
  }
};

let players = {
  p1: {
    type: 'xiaozhi',
    x: 200,
    y: 300,
    currentFrame: 0,
    currentAction: 'move',  // 改为新的动作名称
    direction: 1,
    isJumping: false,
    isAttacking: false,
    speedY: 0,
    bullets: [],
    health: 100
  },
  p2: {
    type: 'xiaomei',
    x: 600,
    y: 300,
    currentFrame: 0,
    currentAction: 'move',  // 改为新的动作名称
    direction: -1,
    isJumping: false,
    isAttacking: false,
    speedY: 0,
    bullets: [],
    health: 100
  }
};

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const MOVE_SPEED = 5;
const GROUND_Y = 300;

function preload() {
  // 載入背景圖片
  backgroundImg = loadImage('bg.png', 
    () => console.log('背景載入成功'),
    () => console.error('背景載入失敗')
  );
  
  // 載入小智的所有動作圖片
  for (let action in sprites.xiaozhi) {
    sprites.xiaozhi[action].img = loadImage('./assets/xiaozhi/' + sprites.xiaozhi[action].path,
      () => console.log(`小智 ${action} 載入成功`),
      () => console.error(`小智 ${action} 載入失敗`)
    );
  }
  
  // 載入小美的所有動作圖片
  for (let action in sprites.xiaomei) {
    sprites.xiaomei[action].img = loadImage('./assets/xiaomei/' + sprites.xiaomei[action].path,
      () => console.log(`小美 ${action} 載入成功`),
      () => console.error(`小美 ${action} 載入失敗`)
    );
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
}

function draw() {
  // 繪製背景
  if (backgroundImg) {
    // 使用背景圖片填滿畫面
    image(backgroundImg, 0, 0, windowWidth, windowHeight);
  } else {
    // 如果背景圖片載入失敗，使用純色背景
    background(0);  // 使用黑色背景作為備用
  }
  
  // 更新和繪製玩家
  updatePlayer(players.p1);
  updatePlayer(players.p2);
  drawPlayer(players.p1);
  drawPlayer(players.p2);
  
  // 繪製血量條
  drawHealthBar(players.p1);
  drawHealthBar(players.p2);
  
  // 繪製子彈
  drawBullets(players.p1);
  drawBullets(players.p2);
}

function updatePlayer(player) {
  // 重力和跳躍
  if (player.isJumping) {
    player.speedY += GRAVITY;
    player.y += player.speedY;
    
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.isJumping = false;
      player.speedY = 0;
      player.currentAction = 'move';
    }
  }
  
  // 玩家1（小智）控制
  if (player === players.p1) {
    let isMoving = false;
    
    if (keyIsDown(65)) { // A鍵向左移動
      player.x -= MOVE_SPEED;
      player.direction = -1;
      player.currentAction = 'move';
      isMoving = true;
    }
    if (keyIsDown(68)) { // D鍵向右移動
      player.x += MOVE_SPEED;
      player.direction = 1;
      player.currentAction = 'move';
      isMoving = true;
    }
    
    // 如果沒有移動且在地面上，切換到站立動作
    if (!isMoving && !player.isJumping && !player.isAttacking) {
      player.currentAction = 'move';
      player.currentFrame = 0;  // 使用���一幀作為站立姿勢
    }
    
    // W鍵跳躍
    if (keyIsDown(87) && !player.isJumping) {
      player.isJumping = true;
      player.speedY = JUMP_FORCE;
      player.currentAction = 'jump';
    }
    
    // F鍵發射子彈
    if (keyIsDown(70) && !player.isAttacking) {
      shoot(player);
      player.currentAction = 'attack';
      player.isAttacking = true;
    }
  }
  
  // 玩家2（小美）控制
  if (player === players.p2) {
    let isMoving = false;
    
    if (keyIsDown(LEFT_ARROW)) {
      player.x -= MOVE_SPEED;
      player.direction = -1;
      player.currentAction = 'move';
      isMoving = true;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      player.x += MOVE_SPEED;
      player.direction = 1;
      player.currentAction = 'move';
      isMoving = true;
    }
    
    // 如果沒有移動且在地面上，切換到站立動作
    if (!isMoving && !player.isJumping && !player.isAttacking) {
      player.currentAction = 'move';
      player.currentFrame = 0;  // 使用第一幀作為站立姿勢
    }
    
    // 上箭頭跳躍
    if (keyIsDown(UP_ARROW) && !player.isJumping) {
      player.isJumping = true;
      player.speedY = JUMP_FORCE;
      player.currentAction = 'jump';
    }
    
    // /鍵發射子彈
    if (keyIsDown(191) && !player.isAttacking) {
      shoot(player);
      player.currentAction = 'attack';
      player.isAttacking = true;
    }
  }

  // 限制角色不能超出畫面
  player.x = constrain(player.x, 50, windowWidth - 50);
  
  // 重置攻击状态
  if (player.isAttacking && frameCount % 30 === 0) {
    player.isAttacking = false;
    if (!player.isJumping) {
      player.currentAction = 'move';
    }
  }
  
  // 更新子彈
  updateBullets(player);
}

function updateBullets(player) {
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    let bullet = player.bullets[i];
    
    if (!bullet.exploding) {
      bullet.x += bullet.speed;
    }
    
    // 檢查子彈是否擊中對手
    let opponent = player === players.p1 ? players.p2 : players.p1;
    if (checkBulletHit(bullet, opponent)) {
      opponent.health = Math.max(0, opponent.health - 10);
      bullet.exploding = true;
      bullet.speed = 0;
      
      // 重置爆炸粒子
      for (let particle of bullet.particles) {
        particle.x = 0;
        particle.y = 0;
        particle.speedX = random(-5, 5);
        particle.speedY = random(-5, 5);
        particle.size = random(5, 10);
        particle.alpha = 255;
      }
      
      // 被擊中時的效果
      opponent.currentAction = 'hit';
      setTimeout(() => {
        if (!opponent.isJumping) {
          opponent.currentAction = 'move';
        }
      }, 200);
    }
    
    // 移除爆炸完成或超出畫面的子彈
    if ((bullet.exploding && bullet.particles[0].alpha <= 0) || 
        bullet.x < 0 || bullet.x > windowWidth) {
      player.bullets.splice(i, 1);
    }
  }
}

function drawPlayer(player) {
  push();
  translate(player.x, player.y);
  
  // 根據方向翻轉角色，但保持原始大小
  scale(4 * (player.direction === -1 ? -1 : 1), 4);
  
  let spriteData = sprites[player.type][player.currentAction];
  let frameWidth = spriteData.width;
  
  // 提高動畫更新頻率
  if (frameCount % 2 === 0) {
    let isMoving = (player === players.p1 && (keyIsDown(65) || keyIsDown(68))) ||
                   (player === players.p2 && (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)));
    
    if (isMoving || player.isJumping || player.isAttacking) {
      player.currentFrame = (player.currentFrame + 1) % spriteData.frames;
    } else {
      player.currentFrame = 0;
    }
  }
  
  // 繪製角色，調整繪製位置
  image(spriteData.img,
    -frameWidth/2, -spriteData.height/2,
    frameWidth, spriteData.height,
    player.currentFrame * frameWidth, 0,
    frameWidth, spriteData.height
  );
  
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function shoot(player) {
  if (player.bullets.length < 3) {  // 限制最多3顆子彈
    let bullet = {
      x: player.x + (player.direction * 30),
      y: player.y - 10,
      speed: 15 * player.direction,
      size: 20,  // 子彈大小
      color: player.type === 'xiaozhi' ? color(255, 100, 0) : color(0, 100, 255),  // 不同角色不同顏色
      particles: [],  // 粒子特效
      lifetime: 0,    // 子彈存在時間
      exploding: false  // 是否在爆炸狀態
    };
    
    // 初始化粒子特效
    for (let i = 0; i < 10; i++) {
      bullet.particles.push({
        x: 0,
        y: 0,
        speedX: random(-2, 2),
        speedY: random(-2, 2),
        size: random(3, 8),
        alpha: 255
      });
    }
    
    player.bullets.push(bullet);
  }
}

function drawBullets(player) {
  for (let bullet of player.bullets) {
    push();
    translate(bullet.x, bullet.y);
    
    if (!bullet.exploding) {
      // 繪製子彈本體
      noStroke();
      fill(bullet.color);
      
      // 根據角色類型繪製不同形狀的子彈
      if (player.type === 'xiaozhi') {
        // 火球效果
        for (let i = 0; i < 5; i++) {
          let alpha = map(i, 0, 5, 255, 0);
          fill(bullet.color.levels[0], bullet.color.levels[1], bullet.color.levels[2], alpha);
          circle(-i * 4 * player.direction, 0, bullet.size - i * 2);
        }
      } else {
        // 能量球效果
        for (let i = 0; i < 3; i++) {
          let alpha = map(i, 0, 3, 255, 0);
          fill(bullet.color.levels[0], bullet.color.levels[1], bullet.color.levels[2], alpha);
          rotate(bullet.lifetime * 0.1);
          rect(-bullet.size/2, -bullet.size/2, bullet.size, bullet.size);
        }
      }
      
      // 繪製拖尾粒子
      for (let particle of bullet.particles) {
        fill(bullet.color.levels[0], bullet.color.levels[1], bullet.color.levels[2], particle.alpha);
        circle(particle.x, particle.y, particle.size);
        
        // 更新粒子位置
        particle.x += particle.speedX - bullet.speed * 0.1;
        particle.y += particle.speedY;
        particle.alpha = max(0, particle.alpha - 10);
        
        // 重置消失的粒子
        if (particle.alpha <= 0) {
          particle.x = 0;
          particle.y = 0;
          particle.alpha = 255;
        }
      }
    } else {
      // 爆炸效果
      for (let particle of bullet.particles) {
        fill(bullet.color.levels[0], bullet.color.levels[1], bullet.color.levels[2], particle.alpha);
        circle(particle.x, particle.y, particle.size);
        
        // 更新爆炸粒子
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.alpha = max(0, particle.alpha - 15);
      }
    }
    
    bullet.lifetime += 1;
    pop();
  }
}

function drawHealthBar(player) {
  const barWidth = 100;
  const barHeight = 10;
  const x = player.x - barWidth/2;
  const y = player.y - 100;  // 血量條顯示角色上方
  
  // 繪製血量條背景（紅色）
  fill(255, 0, 0);
  noStroke();
  rect(x, y, barWidth, barHeight);
  
  // 繪製當前血量（綠色）
  fill(0, 255, 0);
  rect(x, y, barWidth * (player.health/100), barHeight);
  
  // 繪製血量數字
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(player.health, player.x, y - 5);
}

function checkBulletHit(bullet, player) {
  // 簡單的矩形碰撞檢測
  const hitboxWidth = 50;  // 角色碰撞箱寬度
  const hitboxHeight = 100;  // 角色碰撞箱高度
  
  return bullet.x > player.x - hitboxWidth/2 &&
         bullet.x < player.x + hitboxWidth/2 &&
         bullet.y > player.y - hitboxHeight/2 &&
         bullet.y < player.y + hitboxHeight/2;
}