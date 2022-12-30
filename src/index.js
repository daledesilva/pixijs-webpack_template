import * as PIXI from 'pixi.js';
import gsap from 'gsap';

// Import style sheets for preprocessing
////////////////////////////////////////

import "./style.scss";

// Constants
//////////////////////

const GRAVITY = 9.8;
// const GROUND_HEX = 0xE01A4F;
// const FG_HEX = 0x0C090D;
// const BG_HEX = 0xFFC6D9;
// const GROUND_HEX = 0xB89685;
// const FG_HEX = 0x504746;
// const BG_HEX = 0xE7F9A9;
const GROUND_HEX = 0xE66C6C;
const FG_HEX = 0x9E7171;
const BG_HEX = 0xFCC0C0;
const GOAL_HEX = 0x000000;

//////////////////////
//////////////////////

class Ground {
  constructor(options) {
    const {
      y,
    } = options;

    this.ground = new PIXI.Graphics();
    this.ground.y = y;
    this.ground.beginFill(GROUND_HEX);
    this.ground.drawRect(
      0,
      0,
      app.renderer.width,
      app.renderer.height - this.ground.y
    );
    this.ground.endFill();

    app.stage.addChild(this.ground);
    return this.ground;
  }
}

class Point {
  constructor(options) {
    const { x, y } = options;

    this.x = x;
    this.y = y;

    return this;
  }
}

class Body {
  constructor(options) {
    const { parent, size } = options;
    
    this.body = new PIXI.Graphics();
    this.body.size = size;
    this.body.mX = 0;
    this.body.mY = 0;
    this.body.inertiaCoeff = 0.008;//0.0025;  // This should be based on the body size
    this.body.frictionCoeff = 0.94;

    this.body.beginFill(FG_HEX);
    this.body.drawCircle(0, 0, size / 2);
    this.body.endFill();

    return this.body;
  }
}

class Goal {
  constructor(options) {
    const { size } = options;

    this.size = size;

    this.goal = new PIXI.Graphics();
    this.goal.lineStyle({
      width: 5,
      color: GOAL_HEX,
      alpha: 0.4
    });
    this.goal.drawCircle(0, 0, size / 2);
    this.goal.endFill();

    return this.goal;
  }
}

class Foot {
  constructor(options) {
    const { length, width } = options;

    this.foot = new PIXI.Graphics();
    this.foot.lineStyle({
      width: width,
      color: FG_HEX,
      cap: PIXI.LINE_CAP.ROUND,
    });
    this.foot.lineTo(length, 0);

    return this.foot;
  }

}

class Leg {
  constructor(options) {
    const { width, bendDirection } = options;
    this.width = width;
    this.bendDirection = bendDirection;

    this.graphic = new PIXI.Graphics();
    return this;
  }

  drawfromTo(body, foot) {
    this.graphic.clear();
    this.graphic.lineStyle({
      width: this.width,
      color: FG_HEX,
      cap: PIXI.LINE_CAP.ROUND,
    });

    // Straight lines
    // this.graphic.moveTo(body.x, body.y);
    // this.graphic.lineTo(foot.x, foot.y);
    
    // Curves
    this.graphic.moveTo(body.x, body.y);
    this.graphic.quadraticCurveTo(foot.x, body.y+30, foot.x, foot.y);
  }
}

class Biped {
  constructor(options) {
    const {
      x,
      height,
      ground,
      bodySize,
      footGap,
      legWidth,
      drawBodyGoal,
    } = options;

    // remember settings
    this.height = height;
    this.bodySize = bodySize;
    this.footGap = footGap;
    this.legWidth = legWidth;
    this.ground = ground;

    // this.goal = new Point({});
    this.goal = new Goal({
      size: bodySize,
    });

    // Create container
    this.biped = new PIXI.Container();

    // Create body
    this.body = new Body({
      size: bodySize
    });
    
    // Create left foot and leg
    this.foot1 = new Foot({
      length: 20,
      width: legWidth
    });
    this.leg1 = new Leg({
      width: legWidth
    });

    // create right foot and leg
    this.foot2 = new Foot({
      length: 20,
      width: legWidth
    });
    this.leg2 = new Leg({
      width: legWidth
    });
    
    // set initial positions
    this.body.x = x;
    this.body.y = this.ground.y - this.height;
    this.foot1.x = this.body.x - footGap / 2;
    this.foot1.y = this.ground.y;
    this.foot2.x = this.body.x + footGap / 2;
    this.foot2.y = this.ground.y;
    
    // Add all elements to biped object and stage
    if(drawBodyGoal) this.biped.addChild(this.goal);
    this.biped.addChild(this.body);
    this.biped.addChild(this.leg1.graphic);
    this.biped.addChild(this.foot1);
    this.biped.addChild(this.leg2.graphic);
    this.biped.addChild(this.foot2);
    app.stage.addChild(this.biped);

    return this;

  }

  
  setPosition({x,y}) {
    this.goal.x = x;
    this.goal.y = y || this.ground.y - this.height;

    // Horizontal movement based on momentum toward goal
    this.body.mX += (this.goal.x - this.body.x) * this.body.inertiaCoeff;
    this.body.mX *= this.body.frictionCoeff;
    this.body.x += this.body.mX;

    // Vertical movement
    // Dest Y based on height & speed of horizontal movement
    // Final Y based on momentum toward dest Y
    const upwardRatio = 1 / (Math.abs(this.body.mX/20)+1);
    const goalGroundOffset = this.goal.y - this.ground.y;
    const bodyDestY = this.ground.y + goalGroundOffset * upwardRatio;
    this.body.mY += (bodyDestY - this.body.y) * this.body.inertiaCoeff;
    this.body.mY *= this.body.frictionCoeff;

    if(this.body.y + this.body.mY > this.ground.y - this.body.size/2) {
      this.body.mY *= -1;
    }
    this.body.y += this.body.mY;
    
    this.placeFeet();
    this.drawLegs();
  }
  
  placeFeet() {

    // console.log('this.foot1.isMoving', this.foot1.isMoving);
    if (this.foot1.isMoving || this.foot2.isMoving) return;
    
    this.foot1.xOffsetFromBody = this.foot1.x - this.goal.x;
    this.foot2.xOffsetFromBody = this.foot2.x - this.goal.x;

    let foot;
    if (Math.abs(this.foot1.xOffsetFromBody) > Math.abs(this.foot2.xOffsetFromBody) ) {
      foot = this.foot1;
    } else {
      foot = this.foot2;
    }

    let footTooFarBack = Math.abs(foot.xOffsetFromBody) > this.footGap;

    if (footTooFarBack) {
      this.moveFoot(foot)
    }
    
  }

  moveFoot(foot) {
    const destX = this.goal.x - foot.xOffsetFromBody/Math.abs(foot.xOffsetFromBody) * this.footGap;
    const direction = (destX - foot.x) / Math.abs(destX - foot.x);
    foot.isMoving = true;

    let stepAnim = gsap.timeline({
      onComplete: () => {
        foot.isMoving = false;
      }
    })

    // Horizontal movement
    stepAnim.to(foot, {
      x: destX,
      ease: "power4.inOut",
      duration: 0.4,
    }, 0)

    // Vertical movement
    stepAnim.to(foot, {
      y: this.ground.y - 20,
      ease: "power4.inOut",
      duration: 0.2,
    }, 0)
    stepAnim.to(foot, {
      y: this.ground.y,
      ease: "power4.inOut",
      duration: 0.2,
    }, 0.2)

    // Angle
    stepAnim.to(foot, {
      angle: 10 * direction,
      ease: "power4.inOut",
      duration: 0.2,
    }, 0)
    stepAnim.to(foot, {
      angle: -10 * direction,
      ease: "power4.inOut",
      duration: 0.1,
    }, 0.2)
    stepAnim.to(foot, {
      angle: 0,
      ease: "power4.inOut",
      duration: 0.2,
    }, 0.3)

    // Foot direction
    stepAnim.to(foot.scale, {
      x: direction,
      ease: "power4.inOut",
      duration: 0.2,
    }, 0)
    
  }

  drawLegs() {
    this.leg1.drawfromTo(this.body, this.foot1);
    this.leg2.drawfromTo(this.body, this.foot2);
  }
  
}




// Setup //////////////
///////////////////////

let app = new PIXI.Application({
  backgroundColor: BG_HEX,
  resizeTo: window,
  antialias: true,
  // autoDensity: true,
  // resolution: window.devicePixelRatio
});
const stageWidth = app.renderer.width;
const stageHeight = app.renderer.height;
document.body.appendChild(app.view);

const ground = new Ground({ y: stageHeight*0.7 });


const biped = new Biped({
  x: stageWidth / 2,
  height: 200,
  ground,
  bodySize: 100,
  footGap: 70,
  legWidth: 5,
  drawBodyGoal: true,
})




// The animation loop
/////////////////////

let elapsed = 0.0;
let xPos = stageWidth / 2;
let yPos = stageHeight * 0.7 - biped.height;
let xPosAdd = 0;
let yPosAdd = 0;

app.ticker.add((delta) => {
  elapsed += delta;
 
  // let x = stageWidth / 2;                 // Anchor around horizontal center
  // x += Math.sin(elapsed / 60) * 30;    // Move left and right
  // x += Math.sin(elapsed / 40) * 40;    // Add some variation
  // x += Math.cos(elapsed / 80) * 20;    // Add some more variation
  // x += Math.cos(elapsed / 100) * 100;    // Add some more variation
  // x += Math.sin(elapsed / 80) * -100;    // Add some more variation

  xPos += xPosAdd;
  yPos += yPosAdd;

  // Adjust for boundaries
  if (yPos > ground.y - biped.bodySize / 2) {
    yPos = ground.y - biped.bodySize / 2;
    yPosAdd = 0;
  }

  biped.setPosition({ x: xPos, y: yPos });

});


const downListener = (e) => {
  switch(e.key) {
    case 'ArrowRight':
      xPosAdd += 5;
      break;
    case 'ArrowLeft':
      xPosAdd -= 5;
      break;
    case 'ArrowUp':
      yPosAdd -= 10;
      break;
    case 'ArrowDown':
      yPosAdd += 10;
      break;
  }
  if(xPosAdd > 10) xPosAdd = 10;
  if(xPosAdd < -10) xPosAdd = -10;
}
const upListener = (e) => {
  xPosAdd = 0;
  yPosAdd = 0;
}

window.addEventListener("keydown", downListener, false);
window.addEventListener("keyup", upListener, false);

