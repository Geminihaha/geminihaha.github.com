// ============================================================
// ZOMBIE HUNTER — 뱀파이어 서바이버 스타일 웹 게임
// ============================================================

// ─── 설정 ───
const W = 960, H = 640;
const MAP_W = 4000, MAP_H = 4000;
const FIXED_DT = 1/60;
const PI = Math.PI, TAU = PI*2;

// ─── 유틸 ───
const rand = (a,b) => Math.random()*(b-a)+a;
const randInt = (a,b) => Math.floor(rand(a,b+1));
const dist = (x1,y1,x2,y2) => Math.hypot(x2-x1,y2-y1);
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const lerp = (a,b,t) => a+(b-a)*t;
const choice = arr => arr[Math.floor(Math.random()*arr.length)];

// ─── 캐릭터 정의 ───
const CHARACTERS = [
  { id:'antonio',  name:'안토니오', weapon:'whip',         desc:'채찍 전사',       bonus:'공격력 +20%',   bonusFn:s=>{s.dmgMul*=1.2} },
  { id:'imelda',   name:'이멜다',   weapon:'magicWand',    desc:'마법사',         bonus:'경험치 +30%',   bonusFn:s=>{s.xpMul*=1.3} },
  { id:'gennaro',  name:'제나로',   weapon:'knife',        desc:'도적',           bonus:'발사체 +1',     bonusFn:s=>{s.projectileBonus++} },
  { id:'porta',    name:'포르타',   weapon:'lightningRing', desc:'전기 마법사',    bonus:'범위 +30%',     bonusFn:s=>{s.areaMul*=1.3} },
  { id:'arca',     name:'아르카',   weapon:'fireWand',     desc:'화염 마법사',    bonus:'지속시간 +30%', bonusFn:s=>{s.durationMul*=1.3} },
  { id:'mortaccio',name:'모르타치오',weapon:'axe',         desc:'사냥꾼',        bonus:'공격속도 +20%', bonusFn:s=>{s.speedMul*=1.2} },
];

// ─── 무기 정의 ───
const WEAPON_DEFS = {
  whip:{
    name:'채찍', emoji:'📍', dmg:12, cd:0.45, color:'#ddd',
    desc:'전방 호형 공격',
    update:(g,w,dt)=>{
      w.timer+=dt; if(w.timer<w.cd*g.speedMul) return; w.timer=0;
      const p=g.player, angle=Math.atan2(p.fy,p.fx);
      const arc=PI/2, r=90*g.areaMul;
      g.entities.push({
        type:'attack', life:0.25, team:'player',
          x:p.x, y:p.y, dmg:w.dmg*g.dmgMul,
          draw:(ctx)=>{
          ctx.save(); ctx.translate(p.x-g.camX,p.y-g.camY); ctx.rotate(angle);
          ctx.strokeStyle=w.color; ctx.lineWidth=4; ctx.globalAlpha=0.9;
          ctx.beginPath(); ctx.arc(0,0,r,-arc/2,arc/2); ctx.stroke();
          ctx.globalAlpha=0.3; ctx.fillStyle=w.color;
          ctx.beginPath(); ctx.arc(0,0,r,-arc/2,arc/2); ctx.lineTo(0,0); ctx.closePath(); ctx.fill();
          ctx.restore();
        },
        hit:(e)=>{
          const dx=e.x-p.x, dy=e.y-p.y;
          const d=Math.hypot(dx,dy);
          if(d>=r) return false;
          const a=Math.atan2(dy,dx);
          let diff=a-angle;
          if(diff>PI) diff-=TAU;
          if(diff<-PI) diff+=TAU;
          return Math.abs(diff)<=arc/2+0.2;
        }
      });
    }
  },
  magicWand:{
    name:'마법봉', emoji:'✨', dmg:10, cd:0.35, color:'#6af', speed:380,
    desc:'추적 발사체',
    update:(g,w,dt)=>{
      w.timer+=dt; if(w.timer<w.cd*g.speedMul) return; w.timer=0;
      const p=g.player; let target=null, minDist=350*g.areaMul;
      for(const e of g.entities){
        if(e.type!=='enemy'||e.hp<=0) continue;
        const d=dist(p.x,p.y,e.x,e.y);
        if(d<minDist){minDist=d; target=e;}
      }
      let angle=Math.atan2(p.fy,p.fx);
      if(target) angle=Math.atan2(target.y-p.y,target.x-p.x);
      const sp=w.speed||300;
      g.entities.push({
        type:'projectile', team:'player', x:p.x, y:p.y,
        vx:Math.cos(angle)*sp, vy:Math.sin(angle)*sp,
        dmg:w.dmg*g.dmgMul, radius:5, life:1.5, pierce:0,
        color:w.color, homing:!!target,
        draw(ctx){
          ctx.fillStyle=this.color; ctx.shadowColor=this.color; ctx.shadowBlur=12;
          ctx.beginPath(); ctx.arc(this.x-g.camX,this.y-g.camY,this.radius,0,TAU); ctx.fill();
          ctx.shadowBlur=0;
        }
      });
    }
  },
  knife:{
    name:'단검', emoji:'🗡️', dmg:8, cd:0.12, color:'#fd8', speed:550,
    desc:'고속 직선 발사',
    update:(g,w,dt)=>{
      w.timer+=dt; if(w.timer<w.cd*g.speedMul) return; w.timer=0;
      const p=g.player, angle=Math.atan2(p.fy,p.fx);
      const sp=w.speed||500, cnt=1+g.projectileBonus;
      for(let i=0;i<cnt;i++){
        const a=angle+rand(-0.1,0.1);
        g.entities.push({
          type:'projectile', team:'player', x:p.x, y:p.y,
          vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
          dmg:w.dmg*g.dmgMul, radius:3, life:0.8, pierce:99, color:w.color,
          draw(ctx){
            ctx.fillStyle=this.color; ctx.strokeStyle='#fff'; ctx.lineWidth=1;
            ctx.save(); ctx.translate(this.x-g.camX,this.y-g.camY);
            ctx.rotate(Math.atan2(this.vy,this.vx));
            ctx.fillRect(-6,-2,12,4); ctx.strokeRect(-6,-2,12,4);
            ctx.restore();
          }
        });
      }
    }
  },
  lightningRing:{
    name:'번개링', emoji:'⚡', dmg:18, cd:1.0, color:'#ff0',
    desc:'주변 번개 낙뢰',
    update:(g,w,dt)=>{
      w.timer+=dt; if(w.timer<w.cd*g.speedMul) return; w.timer=0;
      const p=g.player, range=200*g.areaMul;
      let targets=[];
      for(const e of g.entities){
        if(e.type!=='enemy'||e.hp<=0) continue;
        if(dist(p.x,p.y,e.x,e.y)<=range) targets.push(e);
      }
      if(!targets.length) return;
      const t=choice(targets);
      const dmg=w.dmg*g.dmgMul;
      t.hp-=dmg; g.spawnDamageNum(t.x,t.y,dmg);
      g.screenshake=4;
      // lightning visual
      g.entities.push({
        type:'effect', life:0.25, x:t.x, y:t.y, team:'player',
        draw(ctx){
          ctx.strokeStyle='#ff0'; ctx.lineWidth=3; ctx.shadowColor='#ff0'; ctx.shadowBlur=20;
          const sx=p.x-g.camX, sy=p.y-g.camY, ex=this.x-g.camX, ey=this.y-g.camY;
          ctx.beginPath(); ctx.moveTo(sx,sy);
          let cx=sx, cy=sy;
          for(let i=0;i<5;i++){
            cx+=(ex-sx)/5+rand(-20,20); cy+=(ey-sy)/5+rand(-15,15);
            ctx.lineTo(cx,cy);
          }
          ctx.lineTo(ex,ey); ctx.stroke(); ctx.shadowBlur=0;
        }
      });
      // splash
      const splashR=40*g.areaMul;
      for(const e of g.entities){
        if(e.type!=='enemy'||e===t||e.hp<=0) continue;
        if(dist(t.x,t.y,e.x,e.y)<=splashR){e.hp-=dmg*0.5; g.spawnDamageNum(e.x,e.y,dmg*0.5);}
      }
    }
  },
  fireWand:{
    name:'화염봉', emoji:'🔥', dmg:15, cd:0.6, color:'#f80', speed:200,
    desc:'폭발성 화염구',
    update:(g,w,dt)=>{
      w.timer+=dt; if(w.timer<w.cd*g.speedMul) return; w.timer=0;
      const p=g.player, angle=Math.atan2(p.fy,p.fx);
      const sp=w.speed||200;
      g.entities.push({
        type:'projectile', team:'player', x:p.x, y:p.y,
        vx:Math.cos(angle)*sp, vy:Math.sin(angle)*sp,
        dmg:w.dmg*g.dmgMul, radius:8, life:1.2, pierce:0, color:w.color,
        onHit(g,enemy){
          const ex=this.x, ey=this.y, r=50*g.areaMul;
          for(const e of g.entities){
            if(e.type!=='enemy'||e.hp<=0) continue;
            if(dist(ex,ey,e.x,e.y)<=r){e.hp-=this.dmg*0.6; g.spawnDamageNum(e.x,e.y,this.dmg*0.6);}
          }
          // explosion effect
          g.entities.push({
            type:'effect', life:0.25, x:ex, y:ey, team:'player',
            draw(ctx){
              ctx.fillStyle='#f80'; ctx.globalAlpha=0.4;
              ctx.beginPath(); ctx.arc(this.x-g.camX,this.y-g.camY,r*g.areaMul,0,TAU); ctx.fill();
              ctx.fillStyle='#ff0'; ctx.globalAlpha=0.3;
              ctx.beginPath(); ctx.arc(this.x-g.camX,this.y-g.camY,r*g.areaMul*0.6,0,TAU); ctx.fill();
              ctx.globalAlpha=1;
              for(let i=0;i<6;i++){
                const a=rand(0,TAU), d=rand(0,r*g.areaMul*0.6);
                const px=this.x-g.camX+Math.cos(a)*d, py=this.y-g.camY+Math.sin(a)*d;
                ctx.fillStyle=`hsl(${20+rand(0,20)},100%,${50+rand(0,30)}%)`;
                ctx.beginPath(); ctx.arc(px,py,rand(2,6),0,TAU); ctx.fill();
              }
            }
          });
        },
        draw(ctx){
          ctx.fillStyle=this.color; ctx.shadowColor='#f80'; ctx.shadowBlur=15;
          ctx.beginPath(); ctx.arc(this.x-g.camX,this.y-g.camY,this.radius,0,TAU); ctx.fill();
          ctx.shadowBlur=0;
          ctx.fillStyle='#ff0';
          ctx.beginPath(); ctx.arc(this.x-g.camX,this.y-g.camY,this.radius*0.5,0,TAU); ctx.fill();
        }
      });
    }
  },
  garlic:{
    name:'마늘', emoji:'🧄', dmg:6, cd:0.4, color:'#a8f',
    desc:'지속 피해 오라',
    update:(g,w,dt)=>{
      w.timer+=dt; if(w.timer<w.cd*g.speedMul) return; w.timer=0;
      const p=g.player, r=(70+5*w.level)*g.areaMul;
      for(const e of g.entities){
        if(e.type!=='enemy'||e.hp<=0) continue;
        if(dist(p.x,p.y,e.x,e.y)<=r){e.hp-=w.dmg*g.dmgMul; e.knockback(p.x,p.y,30);}
      }
      // aura visual
      g.entities.push({
        type:'effect', life:0.2, x:p.x, y:p.y, team:'player',
        draw(ctx){
          ctx.strokeStyle='#a8f'; ctx.lineWidth=2; ctx.globalAlpha=0.25;
          ctx.beginPath(); ctx.arc(p.x-g.camX,p.y-g.camY,r,0,TAU); ctx.stroke();
          ctx.globalAlpha=0.08; ctx.fillStyle='#a8f';
          ctx.beginPath(); ctx.arc(p.x-g.camX,p.y-g.camY,r,0,TAU); ctx.fill();
          ctx.globalAlpha=1;
        }
      });
    }
  },
  kingBible:{
    name:'성서', emoji:'📖', dmg:8, cd:0.1, color:'#fff',
    desc:'회전하는 발사체',
    update:(g,w,dt)=>{
      const p=g.player, orbitR=(75+5*w.level)*g.areaMul;
      const count=2+w.level, spd=2;
      w.__bibles=w.__bibles||[];
      // remove stale
      w.__bibles=w.__bibles.filter(b=>b.owner===p);
      if(!w.__bibles.length){
        for(let i=0;i<count;i++){
          w.__bibles.push({owner:p, angle:TAU*i/count, life:999});
        }
      }
      for(const b of w.__bibles){
        b.angle+=dt*spd;
        const bx=p.x+Math.cos(b.angle)*orbitR, by=p.y+Math.sin(b.angle)*orbitR;
        for(const e of g.entities){
          if(e.type!=='enemy'||e.hp<=0) continue;
          if(dist(bx,by,e.x,e.y)<20){e.hp-=w.dmg*g.dmgMul; e.knockback(p.x,p.y,20);}
        }
        // visual
        g.entities.push({
          type:'effect', life:0.05, x:bx, y:by, team:'player',
          draw(ctx){
            ctx.fillStyle='#fff'; ctx.shadowColor='#fff'; ctx.shadowBlur=8;
            ctx.beginPath(); ctx.arc(bx-g.camX,by-g.camY,6,0,TAU); ctx.fill();
            ctx.shadowBlur=0;
            ctx.fillStyle='#ffd700';
            ctx.beginPath(); ctx.arc(bx-g.camX,by-g.camY,3,0,TAU); ctx.fill();
          }
        });
      }
    }
  },
  axe:{
    name:'도끼', emoji:'🪓', dmg:20, cd:0.7, color:'#a55', speed:280,
    desc:'대형 포물선 투척',
    update:(g,w,dt)=>{
      w.timer+=dt; if(w.timer<w.cd*g.speedMul) return; w.timer=0;
      const p=g.player, angle=Math.atan2(p.fy,p.fx);
      const sp=w.speed||250;
      g.entities.push({
        type:'projectile', team:'player', x:p.x, y:p.y,
        vx:Math.cos(angle)*sp, vy:Math.sin(angle)*sp,
        dmg:w.dmg*g.dmgMul, radius:14, life:1.0, pierce:3, color:w.color,
        arcHeight:0, age:0,
        update(dt){
          this.age+=dt; this.arcHeight=Math.sin(this.age*4)*60*g.areaMul;
          this.x+=this.vx*dt; this.y+=this.vy*dt;
        },
        draw(ctx){
          const sx=this.x-g.camX, sy=this.y-g.camY-this.arcHeight;
          ctx.fillStyle=this.color; ctx.strokeStyle='#ddd'; ctx.lineWidth=2;
          ctx.save(); ctx.translate(sx,sy); ctx.rotate(this.age*6);
          ctx.beginPath();
          ctx.moveTo(0,-12); ctx.lineTo(6,0); ctx.lineTo(0,12); ctx.lineTo(-6,0); ctx.closePath();
          ctx.fill(); ctx.stroke(); ctx.restore();
          ctx.fillStyle='#864';
          ctx.beginPath(); ctx.arc(sx,sy,4,0,TAU); ctx.fill();
        }
      });
    }
  }
};

// ─── 업그레이드 정의 ───
const UPGRADES = [
  { id:'moveSpd',  name:'이동 속도', desc:'이동 속도 +12%',       icon:'🏃', apply:s=>{s.playerSpd*=1.12} },
  { id:'atkSpd',   name:'공격 속도', desc:'공격 속도 +15%',       icon:'⚡', apply:s=>{s.speedMul/=1.15} },
  { id:'dmg',      name:'공격력',   desc:'공격력 +20%',           icon:'💥', apply:s=>{s.dmgMul*=1.2} },
  { id:'area',     name:'공격 범위', desc:'공격 범위 +15%',        icon:'⭕', apply:s=>{s.areaMul*=1.15} },
  { id:'maxHp',    name:'최대 체력', desc:'최대 체력 +25',         icon:'❤️', apply:s=>{s.maxHpBonus+=25} },
  { id:'armor',    name:'방어력',   desc:'방어력 +1',             icon:'🛡️', apply:s=>{s.armor++} },
  { id:'regen',    name:'재생',     desc:'초당 체력 +1 회복',     icon:'💚', apply:s=>{s.regen+=1} },
  { id:'magnet',   name:'자기력',   desc:'XP 획득 범위 +35%',      icon:'🧲', apply:s=>{s.magnetMul*=1.35} },
  { id:'growth',   name:'성장',     desc:'경험치 획득 +25%',       icon:'📈', apply:s=>{s.xpMul*=1.25} },
  { id:'duration', name:'지속시간', desc:'효과 지속시간 +15%',     icon:'⏱️', apply:s=>{s.durationMul*=1.15} },
];

// ─── 적 타입 정의 ───
const ENEMY_TYPES = [
  { id:'bat',      name:'박쥐',   hp:25,  spd:2.8, size:10, xp:8,  color:'#86a', dmg:6,  minTime:0 },
  { id:'zombie',   name:'좀비',   hp:70,  spd:1.2, size:14, xp:12, color:'#5a5', dmg:8,  minTime:0 },
  { id:'skeleton', name:'해골',   hp:120, spd:1.6, size:13, xp:18, color:'#ddd', dmg:10, minTime:40, ranged:true },
  { id:'ghost',    name:'유령',   hp:50,  spd:2.2, size:11, xp:14, color:'#8cf', dmg:7,  minTime:60, phase:true },
  { id:'werewolf', name:'늑대인간',hp:350, spd:2.0, size:18, xp:40, color:'#a33', dmg:15, minTime:100 },
  { id:'mummy',    name:'미라',   hp:500, spd:0.7, size:16, xp:55, color:'#b90', dmg:12, minTime:160, armor:3 },
];

// ─── 입력 ───
const keys={}, mouse={x:0,y:0,clicked:false,justClicked:false};

function toCanvasCoords(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  return {
    x:(clientX-rect.left)*(canvas.width/rect.width),
    y:(clientY-rect.top)*(canvas.height/rect.height)
  };
}

document.addEventListener('keydown',e=>{keys[e.key]=true; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.key))e.preventDefault();});
document.addEventListener('keyup',e=>{keys[e.key]=false;});
document.addEventListener('mousemove',e=>{const c=toCanvasCoords(e.clientX,e.clientY);mouse.x=c.x;mouse.y=c.y;});
document.addEventListener('mousedown',e=>{mouse.clicked=true;mouse.justClicked=true;});
document.addEventListener('mouseup',e=>{mouse.clicked=false;});
document.addEventListener('touchstart',e=>{
  const t=e.touches[0], c=toCanvasCoords(t.clientX,t.clientY);
  mouse.x=c.x; mouse.y=c.y; mouse.clicked=true; mouse.justClicked=true;
  e.preventDefault();
},{passive:false});
document.addEventListener('touchmove',e=>{
  const t=e.touches[0], c=toCanvasCoords(t.clientX,t.clientY);
  mouse.x=c.x; mouse.y=c.y; e.preventDefault();
},{passive:false});
document.addEventListener('touchend',e=>{mouse.clicked=false; e.preventDefault();},{passive:false});

// ─── 게임 메인 ───
const canvas=document.getElementById('gc');
const ctx=canvas.getContext('2d');
canvas.width=W; canvas.height=H;

// ─── 반응형 리사이즈 ───
function resizeCanvas(){
  const maxW=window.innerWidth, maxH=window.innerHeight;
  const ratio=W/H; // 1.5
  let w, h;
  if(maxW/maxH>ratio){h=maxH;w=h*ratio;}
  else{w=maxW;h=w/ratio;}
  canvas.style.width=w+'px'; canvas.style.height=h+'px';
}
window.addEventListener('resize',resizeCanvas);
resizeCanvas();

let game=null;
let animId=null;

class Game {
  constructor(){
    this.state='menu';        // menu | playing | levelUp | gameOver
    this.time=0;              // 게임 진행 시간 (초)
    this.player=null;
    this.entities=[];         // enemies, projectiles, effects, xp gems ...
    this.weapons=[];
    this.level=1;
    this.xp=0;
    this.xpToNext=10;
    this.kills=0;
    this.camX=0; this.camY=0; // 카메라 위치
    this.difficulty=1;
    this.selectedChar=0;
    this.paused=false;
    this.screenshake=0;
    this.upgradeChoices=[];
    this.damageNums=[];
    this.stats={};
    this.menuHover=-1;
    this.hitCount=0; // 디버그: 실제 적중 횟수
  }

  // ── 초기화 ──
  init(){
    this.player={
      x:MAP_W/2, y:MAP_H/2, hp:100, maxHp:100, spd:260,
      fx:1, fy:0,
      invTimer:1.5,
    };
    this.entities=[];
    this.weapons=[];
    this.level=1; this.xp=0; this.kills=0; this.time=0;
    this.screenshake=0; this.damageNums=[];
    this.camX=this.player.x-W/2; this.camY=this.player.y-H/2;
    this.difficulty=1;
    this.spawnTimer=0;
    this._lastBoss=undefined;

    // stat modifiers
    this.dmgMul=1;
    this.speedMul=1;          // lower = faster attack
    this.areaMul=1;
    this.xpMul=1;
    this.playerSpd=1;
    this.magnetMul=1;
    this.durationMul=1;
    this.projectileBonus=0;
    this.maxHpBonus=0;
    this.armor=0;
    this.regen=0;

    // character bonus
    const ch=CHARACTERS[this.selectedChar];
    if(ch) ch.bonusFn(this);

    this.player.maxHp=100+this.maxHpBonus;
    this.player.hp=this.player.maxHp;

    // starting weapon
    this.addWeapon(ch.weapon);
  }

  addWeapon(id){
    if(this.weapons.some(w=>w.id===id)) return;
    const def=WEAPON_DEFS[id];
    if(!def) return;
    this.weapons.push({
      id, timer:0, level:1, cd:def.cd, dmg:def.dmg,
      ...(def.__extra||{})
    });
  }

  getWeaponStat(id, field){
    const w=this.weapons.find(x=>x.id===id);
    return w?w[field]:null;
  }

  // ── 게임 시작 ──
  startGame(charIdx){
    this.selectedChar=charIdx;
    this.init();
    this.state='playing';
    this.gameStartTime=performance.now();
  }

  // ── 스폰 ──
  spawnEnemy(){
    const p=this.player;
    // determine which types are available
    const available=ENEMY_TYPES.filter(t=>t.minTime<=this.time);
    if(!available.length) return;
    
    // weighted random
    let weights=available.map(t=>{
      let w=1;
      if(t.id==='bat') w=2; // more bats
      if(t.id==='werewolf'||t.id==='mummy') w=0.5; // rarer
      return w;
    });
    const total=weights.reduce((a,b)=>a+b,0);
    let r=Math.random()*total;
    let idx=0;
    for(let i=0;i<weights.length;i++){r-=weights[i]; if(r<=0){idx=i; break;}}
    const type=available[idx];

    // spawn position just outside camera viewport
    let x,y;
    const margin=70;
    const side=randInt(0,3);
    if(side===0){x=p.x-W/2-margin;  y=rand(p.y-H/2, p.y+H/2);}          // left
    else if(side===1){x=p.x+W/2+margin; y=rand(p.y-H/2, p.y+H/2);}      // right
    else if(side===2){x=rand(p.x-W/2, p.x+W/2); y=p.y-H/2-margin;}      // top
    else{x=rand(p.x-W/2, p.x+W/2); y=p.y+H/2+margin;}                    // bottom

    x=clamp(x,10,MAP_W-10); y=clamp(y,10,MAP_H-10);

    const hpMul=1+this.time/60;
    const spdMul=1+Math.min(this.time/300,0.5);

    const enemy={
      type:'enemy', id:type.id, name:type.name,
      x, y,
      hp:type.hp*hpMul, maxHp:type.hp*hpMul,
      spd:type.spd*60*spdMul, size:type.size,
      xp:type.xp*Math.ceil(hpMul),
      color:type.color, dmg:type.dmg,
      armor:type.armor||0,
      phase:type.phase||false,
      ranged:type.ranged||false,
      shootTimer:rand(1,3),
      vx:0, vy:0,
      knockback(tx,ty,power){
        const a=Math.atan2(this.y-ty,this.x-tx);
        this.vx+=Math.cos(a)*power; this.vy+=Math.sin(a)*power;
      },
      draw(ctx){
        const sx=this.x-game.camX, sy=this.y-game.camY;
        if(sx<-60||sx>W+60||sy<-60||sy>H+60) return;
        // shadow
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(sx+2,sy+4,this.size*0.7,this.size*0.4,0,0,TAU); ctx.fill();

        // body
        ctx.fillStyle=this.color;
        ctx.beginPath(); ctx.arc(sx,sy,this.size,0,TAU); ctx.fill();

        // eyes / details
        ctx.fillStyle='#fff';
        const eyeOff=this.size*0.3;
        ctx.beginPath(); ctx.arc(sx-eyeOff,sy-3,this.size*0.22,0,TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(sx+eyeOff,sy-3,this.size*0.22,0,TAU); ctx.fill();
        ctx.fillStyle='#200';
        ctx.beginPath(); ctx.arc(sx-eyeOff+2,sy-4,this.size*0.1,0,TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(sx+eyeOff+2,sy-4,this.size*0.1,0,TAU); ctx.fill();

        // distinctive features
        if(this.id==='bat'){
          ctx.fillStyle='#648';
          ctx.beginPath(); ctx.arc(sx-8,sy-4,4,0,TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(sx+8,sy-4,4,0,TAU); ctx.fill();
        }else if(this.id==='ghost'){
          ctx.globalAlpha=0.4;
          ctx.fillStyle='#8cf';
          ctx.beginPath(); ctx.arc(sx,sy,this.size+5,0,TAU); ctx.fill();
          ctx.globalAlpha=1;
        }else if(this.id==='skeleton'){
          ctx.fillStyle='#200';
          ctx.fillRect(sx-3-this.vx*0.1,sy+3,6,8);
        }else if(this.id==='werewolf'){
          ctx.fillStyle='#a33';
          ctx.beginPath(); ctx.arc(sx-5,sy-this.size-4,6,0,PI); ctx.fill();
          ctx.beginPath(); ctx.arc(sx+5,sy-this.size-4,6,0,PI); ctx.fill();
        }else if(this.id==='mummy'){
          ctx.strokeStyle='#960'; ctx.lineWidth=2;
          for(let i=0;i<3;i++){
            const a=i*0.8+this.x*0.01;
            ctx.beginPath(); ctx.arc(sx,sy,this.size*0.7,a,a+0.4); ctx.stroke();
          }
        }

        // health bar
        if(this.hp<this.maxHp){
          const bw=this.size*2+10, bh=4;
          ctx.fillStyle='#400';
          ctx.fillRect(sx-bw/2,sy-this.size-10,bw,bh);
          ctx.fillStyle='#f44';
          ctx.fillRect(sx-bw/2,sy-this.size-10,bw*(this.hp/this.maxHp),bh);
        }
      }
    };
    this.entities.push(enemy);
  }

  spawnXPGem(x,y,amount){
    const gem={
      type:'xpGem', x, y, amount:Math.ceil(amount*this.xpMul),
      life:10, radius:5,
      draw(ctx){
        const sx=this.x-game.camX, sy=this.y-game.camY;
        if(sx<-20||sx>W+20||sy<-20||sy>H+20) return;
        const glow=Math.sin(game.time*6)*0.2+0.8;
        ctx.fillStyle=`rgba(80,255,80,${0.3*glow})`;
        ctx.beginPath(); ctx.arc(sx,sy,this.radius+4,0,TAU); ctx.fill();
        ctx.fillStyle='#4f4'; ctx.shadowColor='#4f4'; ctx.shadowBlur=8;
        ctx.beginPath();
        ctx.moveTo(sx,sy-this.radius);
        ctx.lineTo(sx+this.radius*0.6,sy);
        ctx.lineTo(sx,sy+this.radius);
        ctx.lineTo(sx-this.radius*0.6,sy);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur=0;
      }
    };
    this.entities.push(gem);
  }

  spawnDamageNum(x,y,amount){
    this.damageNums.push({
      x, y, text:Math.round(amount).toString(),
      life:0.8, maxLife:0.8, vy:-40,
      draw(ctx){
        const sx=this.x-game.camX, sy=this.y-game.camY;
        const a=this.life/this.maxLife;
        ctx.globalAlpha=a; ctx.fillStyle='#ff4'; ctx.font='bold 22px sans-serif';
        ctx.strokeStyle='#000'; ctx.lineWidth=3;
        ctx.textAlign='center';
        ctx.strokeText(this.text,sx,sy);
        ctx.fillText(this.text,sx,sy);
        ctx.globalAlpha=1;
      }
    });
  }

  spawnParticles(x,y,color,count=8){
    for(let i=0;i<count;i++){
      const a=rand(0,TAU), spd=rand(30,80);
      this.entities.push({
        type:'particle', life:rand(0.2,0.5), x, y,
        vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
        color, radius:rand(2,4),
        draw(ctx){
          ctx.globalAlpha=this.life*2; ctx.fillStyle=this.color;
          ctx.beginPath(); ctx.arc(this.x-game.camX,this.y-game.camY,this.radius,0,TAU); ctx.fill();
          ctx.globalAlpha=1;
        }
      });
    }
  }

  // ── 업그레이드 ──
  showLevelUp(){
    this.state='levelUp';
    // pick 3 random upgrades (no dupes)
    const pool=[...UPGRADES];
    this.upgradeChoices=[];
    for(let i=0;i<3;i++){
      if(!pool.length) break;
      const idx=randInt(0,pool.length-1);
      this.upgradeChoices.push(pool.splice(idx,1)[0]);
    }
  }

  applyUpgrade(idx){
    const up=this.upgradeChoices[idx];
    if(!up) return;
    up.apply(this);
    // refresh player HP
    this.player.maxHp=100+this.maxHpBonus;
    this.player.hp=Math.min(this.player.hp,this.player.maxHp);
    this.state='playing';
  }

  // ── 업데이트 ──
  update(dt){
    if(this.state==='menu'){
      this.updateMenu(dt);
      return;
    }
    if(this.state==='levelUp'||this.state==='gameOver') return;

    this.time+=dt;
    this.difficulty=1+this.time/60;

    // invincibility timer
    if(this.player.invTimer>0) this.player.invTimer-=dt;

    // regen
    if(this.regen>0){
      this.player.hp=Math.min(this.player.hp+this.regen*dt,this.player.maxHp);
    }

    // screenshake decay
    if(this.screenshake>0) this.screenshake=Math.max(0,this.screenshake-dt*30);

    this.updatePlayer(dt);
    this.updateWeapons(dt);
    this.updateEntities(dt);
    this.checkCollisions();
    this.updateSpawner(dt);
    this.updateDamageNums(dt);
    
    // camera follow
    this.camX=this.player.x-W/2;
    this.camY=this.player.y-H/2;
  }

  updateMenu(dt){
    // handle character selection
    const total=CHARACTERS.length;
    const itemH=80, startY=200;
    this.menuHover=-1;
    for(let i=0;i<total;i++){
      const y=startY+i*itemH;
      if(mouse.y>=y&&mouse.y<y+itemH&&mouse.x>W/2-200&&mouse.x<W/2+200){
        this.menuHover=i;
        if(mouse.justClicked){ this.startGame(i); mouse.justClicked=false; return; }
      }
    }
    // keyboard selection
    for(let i=0;i<total;i++){
      if(keys[String(i+1)]){
        this.startGame(i); keys[String(i+1)]=false; return;
      }
    }
  }

  updatePlayer(dt){
    const p=this.player;
    let dx=0, dy=0;
    if(keys['w']||keys['W']||keys['ArrowUp']) dy=-1;
    if(keys['s']||keys['S']||keys['ArrowDown']) dy=1;
    if(keys['a']||keys['A']||keys['ArrowLeft']) dx=-1;
    if(keys['d']||keys['D']||keys['ArrowRight']) dx=1;

    // touch input - move toward touch
    if(!dx&&!dy&&mouse.clicked){
      const mx=mouse.x, my=mouse.y;
      if(mx>=0&&mx<=W&&my>=0&&my<=H){
        const wx=mx+this.camX-W/2, wy=my+this.camY-H/2;
        if(dist(p.x,p.y,wx,wy)>10){
          dx=wx-p.x; dy=wy-p.y;
          const len=Math.hypot(dx,dy);
          dx/=len; dy/=len;
        }
      }
    }

    if(dx||dy){
      const len=Math.hypot(dx,dy);
      p.fx=dx/len; p.fy=dy/len;
    }

    const spd=p.spd*this.playerSpd*dt;
    p.x+=dx*spd; p.y+=dy*spd;
    p.x=clamp(p.x,20,MAP_W-20);
    p.y=clamp(p.y,20,MAP_H-20);
  }

  updateWeapons(dt){
    for(const w of this.weapons){
      const def=WEAPON_DEFS[w.id];
      if(def) def.update(this,w,dt);
    }
  }

  updateEntities(dt){
    for(let i=this.entities.length-1;i>=0;i--){
      const e=this.entities[i];
      
      if(e.type==='enemy'){
        // move toward player
        const p=this.player;
        if(!e.phase){
          const dx=p.x-e.x, dy=p.y-e.y;
          const d=Math.hypot(dx,dy);
          if(d>1){
            e.vx+=((dx/d)*e.spd*dt*60 - e.vx)*0.05;
            e.vy+=((dy/d)*e.spd*dt*60 - e.vy)*0.05;
          }
        }else{
          // ghost: phase toward player with some offset
          const dx=p.x-e.x, dy=p.y-e.y;
          const d=Math.hypot(dx,dy);
          if(d>1){
            e.vx+=((dx/d)*e.spd*dt*60 + Math.sin(this.time*2+e.x)*20 - e.vx)*0.05;
            e.vy+=((dy/d)*e.spd*dt*60 + Math.cos(this.time*1.7+e.y)*20 - e.vy)*0.05;
          }
        }
        // knockback decay
        e.vx*=0.9; e.vy*=0.9;
        e.x+=e.vx*dt; e.y+=e.vy*dt;
        e.x=clamp(e.x,0,MAP_W); e.y=clamp(e.y,0,MAP_H);

        // skeleton ranged attack
        if(e.ranged){
          e.shootTimer-=dt;
          if(e.shootTimer<=0){
            e.shootTimer=rand(2,4);
            const a=Math.atan2(p.y-e.y,p.x-e.x);
            this.entities.push({
              type:'projectile', team:'enemy', x:e.x, y:e.y,
              vx:Math.cos(a)*180, vy:Math.sin(a)*180,
              dmg:5, radius:4, life:2, pierce:0, color:'#eee',
              draw(ctx){
                ctx.fillStyle=this.color;
                ctx.beginPath(); ctx.arc(this.x-game.camX,this.y-game.camY,this.radius,0,TAU); ctx.fill();
              }
            });
          }
        }
      }

      // projectiles (all)
      if(e.type==='projectile'||e.type==='particle'){
        if(e.update) e.update(dt);
        else{ e.x+=e.vx*dt; e.y+=e.vy*dt; }
      }

      // xp gem: move toward player if close enough
      if(e.type==='xpGem'){
        const p=this.player;
        const magnetRange=100*this.magnetMul;
        const d=dist(p.x,p.y,e.x,e.y);
        if(d<magnetRange){
          const pull=(magnetRange-d)/magnetRange*150+20;
          const a=Math.atan2(p.y-e.y,p.x-e.x);
          e.vx=(e.vx||0)+(Math.cos(a)*pull*dt);
          e.vy=(e.vy||0)+(Math.sin(a)*pull*dt);
          e.vx*=0.95; e.vy*=0.95;
          e.x+=e.vx; e.y+=e.vy;
        }
      }

      // life countdown
      if(e.life!==undefined){
        e.life-=dt;
        if(e.life<=0){ this.entities.splice(i,1); continue; }
      }

      // remove off-map enemies
      if(e.type==='enemy'&&(e.x<-100||e.x>MAP_W+100||e.y<-100||e.y>MAP_H+100)){
        this.entities.splice(i,1);
      }
    }
  }

  checkCollisions(){
    const p=this.player;

    for(let i=0;i<this.entities.length;i++){
      const e=this.entities[i];
      if(!e||e.hp===undefined||e.hp<=0) continue;
      if(e.type!=='enemy') continue;

      // enemy touches player
      if(p.invTimer<=0){
        const d=dist(p.x,p.y,e.x,e.y);
        if(d<e.size+12){
          const dmg=Math.max(1,e.dmg-this.armor);
          p.hp-=dmg;
          p.invTimer=0.3;
          this.screenshake=6;
          this.spawnDamageNum(p.x,p.y-30,dmg);
          this.spawnParticles(p.x,p.y,'#f44',5);
          if(p.hp<=0){
            p.hp=0;
            this.gameOver();
            return;
          }
        }
      }

      // projectile hits enemy
      for(let j=0;j<this.entities.length;j++){
        const proj=this.entities[j];
        if(!proj||proj.type!=='projectile'||proj.team!=='player') continue;
        if(dist(proj.x,proj.y,e.x,e.y)<e.size+proj.radius){
          const dmg=proj.dmg||10;
          const actualDmg=Math.max(1,dmg-e.armor);
          e.hp-=actualDmg;
          e.knockback(proj.x,proj.y,25);
          this.spawnDamageNum(e.x,e.y,actualDmg);
          this.spawnParticles(e.x,e.y,e.color,3);
          if(proj.pierce!==undefined&&proj.pierce>0){
            proj.pierce--;
            if(proj.pierce<=0){ this.entities.splice(j,1); j--; }
          }else if(proj.pierce===0||proj.pierce===undefined){
            this.entities.splice(j,1); j--;
            // onHit callback
            if(proj.onHit) proj.onHit(this,e);
          }
          if(e.hp<=0){
            this.kills++;
            this.spawnXPGem(e.x,e.y,e.xp);
            this.spawnParticles(e.x,e.y,e.color,12);
            this.entities.splice(i,1); i--;
            break;
          }
        }
      }
    }

    // collect xp gems
    for(let i=this.entities.length-1;i>=0;i--){
      const g=this.entities[i];
      if(g.type!=='xpGem') continue;
      if(dist(p.x,p.y,g.x,g.y)<g.radius+15){
        this.xp+=g.amount;
        this.entities.splice(i,1);
        // check level up
        if(this.xp>=this.xpToNext){
          this.xp-=this.xpToNext;
          this.level++;
          this.xpToNext=Math.floor(10*Math.pow(1.15,this.level-1));
          this.showLevelUp();
          return; // stop processing rest of loop while paused
        }
      }
    }

    // enemy projectile hits player
    for(let i=0;i<this.entities.length;i++){
      const pj=this.entities[i];
      if(!pj||pj.type!=='projectile'||pj.team!=='enemy') continue;
      if(p.invTimer<=0&&dist(p.x,p.y,pj.x,pj.y)<12+pj.radius){
        const dmg=Math.max(1,(pj.dmg||5)-this.armor);
        p.hp-=dmg;
        p.invTimer=0.3;
        this.screenshake=4;
        this.spawnDamageNum(p.x,p.y-20,dmg);
        this.spawnParticles(p.x,p.y,'#f44',3);
        this.entities.splice(i,1); i--;
        if(p.hp<=0){p.hp=0; this.gameOver(); return;}
      }
    }

    // attack hitevent
    for(let i=0;i<this.entities.length;i++){
      const atk=this.entities[i];
      if(!atk||atk.type!=='attack'||atk.team!=='player') continue;
      for(let j=0;j<this.entities.length;j++){
        const e=this.entities[j];
        if(!e||e.type!=='enemy'||e.hp<=0) continue;
        if(atk.hit(e)){
          this.hitCount++;
          const dmg=atk.dmg||10;
          const actual=Math.max(1,dmg-e.armor);
          e.hp-=actual;
          e.knockback(this.player.x,this.player.y,40);
          this.spawnDamageNum(e.x,e.y,actual);
          this.spawnParticles(e.x,e.y,e.color,5);
          if(e.hp<=0){
            this.kills++;
            this.spawnXPGem(e.x,e.y,e.xp);
            this.spawnParticles(e.x,e.y,e.color,15);
            this.entities.splice(j,1); j--;
          }
        }
      }
    }
  }

  updateSpawner(dt){
    this.spawnTimer=(this.spawnTimer||0)+dt;
    const interval=Math.max(0.4,0.8-this.time/240);
    if(this.spawnTimer>=interval){
      this.spawnTimer=0;
      const count=2+Math.floor(this.time/20);
      const maxEnemy=Math.min(200,80+Math.floor(this.time/5));
      const enemyCount=this.entities.filter(e=>e.type==='enemy').length;
      if(enemyCount<maxEnemy){
        for(let i=0;i<Math.min(count,5);i++) this.spawnEnemy();
      }
    }

    // boss every 120s
    if(this.time>30&&this._lastBoss===undefined) this._lastBoss=0;
    if(this.time-this._lastBoss>=120){
      this._lastBoss=this.time;
      // spawn reaper boss
      const hp=2000*(1+this.time/120);
      const boss={
        type:'enemy', id:'reaper', name:'데스',
        x:rand(100,MAP_W-100), y:rand(100,MAP_H-100), 
        hp, maxHp:hp,
        spd:1.4*60, size:28,
        xp:500, color:'#222', dmg:25,
        armor:5, phase:false, ranged:true, shootTimer:1,
        knockback:(tx,ty,power)=>{
          const a=Math.atan2(this.y-ty,this.x-tx);
          this.vx+=Math.cos(a)*power*0.3; this.vy+=Math.sin(a)*power*0.3;
        },
        draw(ctx){
          const sx=this.x-game.camX, sy=this.y-game.camY;
          if(sx<-50||sx>W+50||sy<-50||sy>H+50) return;
          // aura
          ctx.fillStyle='rgba(100,0,0,0.15)';
          ctx.beginPath(); ctx.arc(sx,sy,45,0,TAU); ctx.fill();
          ctx.fillStyle='#111';
          ctx.beginPath(); ctx.arc(sx,sy,this.size,0,TAU); ctx.fill();
          ctx.fillStyle='#a00';
          ctx.beginPath(); ctx.arc(sx-5,sy-5,6,0,TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(sx+5,sy-5,6,0,TAU); ctx.fill();
          ctx.fillStyle='#f44';
          ctx.font='28px sans-serif'; ctx.textAlign='center';
          ctx.fillText('👁',sx,sy+8);
          // crown
          ctx.fillStyle='#da0';
          for(let i=0;i<5;i++){
            const a=i*TAU/5-this.x*0.01;
            ctx.beginPath(); ctx.arc(sx+Math.cos(a)*16,sy-24+Math.sin(a)*8,4,0,TAU); ctx.fill();
          }
          // boss HP bar
          const bw=80, bh=6;
          ctx.fillStyle='#400';
          ctx.fillRect(sx-bw/2,sy-44,bw,bh);
          ctx.fillStyle='#f00';
          ctx.fillRect(sx-bw/2,sy-44,bw*(this.hp/this.maxHp),bh);
        }
      };
      this.entities.push(boss);
      // big announcement effect
      for(let i=0;i<30;i++){
        const a=rand(0,TAU), spd=rand(50,200);
        this.entities.push({
          type:'particle', life:rand(0.5,1.2), x:boss.x, y:boss.y,
          vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
          color:'#f00', radius:rand(3,8),
          draw(ctx){ctx.globalAlpha=this.life; ctx.fillStyle=this.color;
            ctx.beginPath(); ctx.arc(this.x-game.camX,this.y-game.camY,this.radius,0,TAU); ctx.fill();
            ctx.globalAlpha=1;}
        });
      }
    }
  }

  updateDamageNums(dt){
    for(let i=this.damageNums.length-1;i>=0;i--){
      const d=this.damageNums[i];
      d.life-=dt;
      d.y+=d.vy*dt;
      d.vy*=0.95;
      if(d.life<=0) this.damageNums.splice(i,1);
    }
  }

  gameOver(){
    this.state='gameOver';
    this.stats={time:this.time,kills:this.kills,level:this.level};
  }

  // ── 렌더링 ──
  render(){
    ctx.clearRect(0,0,W,H);

    // screenshake offset
    const shakeX=this.screenshake?rand(-this.screenshake,this.screenshake):0;
    const shakeY=this.screenshake?rand(-this.screenshake,this.screenshake):0;
    ctx.save();
    ctx.translate(shakeX,shakeY);

    if(this.state==='menu'){ this.renderMenu(); ctx.restore(); return; }

    this.renderBackground();
    this.renderEntities();

    // player
    this.renderPlayer();

    // damage numbers
    for(const d of this.damageNums) if(d.draw) d.draw(ctx);

    ctx.restore();

    // HUD (not affected by shake)
    this.renderHUD();

    if(this.state==='levelUp') this.renderLevelUp();
    if(this.state==='gameOver') this.renderGameOver();
  }

  renderMenu(){
    // background
    ctx.fillStyle='#0a0a12';
    ctx.fillRect(0,0,W,H);

    // grid lines
    ctx.strokeStyle='rgba(40,40,80,0.3)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // title
    ctx.fillStyle='#f44'; ctx.font='bold 52px sans-serif'; ctx.textAlign='center';
    ctx.shadowColor='#f44'; ctx.shadowBlur=30;
    ctx.fillText('🧟 ZOMBIE HUNTER',W/2,90);
    ctx.shadowBlur=0;
    ctx.fillStyle='#aaa'; ctx.font='20px sans-serif';
    ctx.fillText('뱀파이어 서바이버 스타일 서바이벌 액션 게임',W/2,130);

    // character select
    ctx.fillStyle='#fff'; ctx.font='bold 22px sans-serif';
    ctx.fillText('— 캐릭터 선택 —',W/2,180);

    const itemH=70, startY=200;
    for(let i=0;i<CHARACTERS.length;i++){
      const ch=CHARACTERS[i];
      const y=startY+i*itemH;
      const hover=i===this.menuHover;

      ctx.fillStyle=hover?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.05)';
      ctx.fillRect(W/2-220,y,440,itemH-6);
      if(hover){
        ctx.strokeStyle='#f44'; ctx.lineWidth=2;
        ctx.strokeRect(W/2-220,y,440,itemH-6);
      }

      ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left';
      ctx.fillText(`${i+1}. ${ch.name}  —  ${ch.weapon?WEAPON_DEFS[ch.weapon]?.name||'':''}`,W/2-200,y+25);
      ctx.fillStyle='#aaa'; ctx.font='15px sans-serif';
      ctx.fillText(ch.bonus,W/2-200,y+50);
    }

    // bottom
    ctx.fillStyle='#666'; ctx.font='14px sans-serif'; ctx.textAlign='center';
    ctx.fillText('방향키/WASD 이동  •  자동 공격  •  레벨업으로 능력 강화',W/2,H-30);
  }

  renderBackground(){
    // map background
    const grad=ctx.createRadialGradient(this.camX+W/2,this.camY+H/2,0,this.camX+W/2,this.camY+H/2,800);
    grad.addColorStop(0,'#1a1a2e');
    grad.addColorStop(1,'#0f0f1a');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle='rgba(60,60,120,0.15)'; ctx.lineWidth=1;
    const gridSize=80;
    const startX=-(this.camX%gridSize);
    const startY=-(this.camY%gridSize);
    for(let x=startX;x<W;x+=gridSize){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for(let y=startY;y<H;y+=gridSize){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // map border
    if(this.camX<0){ctx.fillStyle='rgba(255,0,0,0.3)'; ctx.fillRect(0,0,-this.camX,H);}
    if(this.camY<0){ctx.fillStyle='rgba(255,0,0,0.3)'; ctx.fillRect(0,0,W,-this.camY);}
    if(this.camX+W>MAP_W){ctx.fillStyle='rgba(255,0,0,0.3)'; ctx.fillRect(MAP_W-this.camX,0,W-(MAP_W-this.camX),H);}
    if(this.camY+H>MAP_H){ctx.fillStyle='rgba(255,0,0,0.3)'; ctx.fillRect(0,MAP_H-this.camY,W,H-(MAP_H-this.camY));}
  }

  renderEntities(){
    // sort by y for depth
    const sorted=[...this.entities].sort((a,b)=>a.y-b.y);
    for(const e of sorted){
      if(e.draw) e.draw(ctx);
    }
  }

  renderPlayer(){
    const p=this.player;
    const sx=p.x-this.camX, sy=p.y-this.camY;
    if(sx<-30||sx>W+30||sy<-30||sy>H+30) return;

    // invincibility shield effect (always show player)
    const shielded=p.invTimer>0;

    // shadow
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(sx+2,sy+5,16,8,0,0,TAU); ctx.fill();

    // body
    const col=this.selectedChar===0?'#48f':this.selectedChar===1?'#84f':this.selectedChar===2?'#f84':this.selectedChar===3?'#ff8':this.selectedChar===4?'#f48':'#8f8';
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.arc(sx,sy,14,0,TAU); ctx.fill();
    ctx.shadowBlur=0;

    // direction indicator
    ctx.fillStyle='#fff';
    const dx=p.fx*18, dy=p.fy*18;
    ctx.beginPath();
    ctx.moveTo(sx+dx,sy+dy);
    ctx.lineTo(sx+dx-p.fy*6-p.fx*4,sy+dy+p.fx*6-p.fy*4);
    ctx.lineTo(sx+dx+p.fy*6-p.fx*4,sy+dy-p.fx*6-p.fy*4);
    ctx.closePath(); ctx.fill();

    // eyes
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(sx-4,sy-3,3,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(sx+4,sy-3,3,0,TAU); ctx.fill();
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(sx-3+p.fx*1.5,sy-3+p.fy*1.5,1.5,0,TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(sx+5+p.fx*1.5,sy-3+p.fy*1.5,1.5,0,TAU); ctx.fill();

    // HP bar
    const bw=36, bh=4;
    ctx.fillStyle='#400';
    ctx.fillRect(sx-bw/2,sy-26,bw,bh);
    ctx.fillStyle='#4f4';
    ctx.fillRect(sx-bw/2,sy-26,bw*(p.hp/p.maxHp),bh);

    // shield visual during invincibility
    if(shielded){
      ctx.fillStyle='rgba(100,180,255,0.08)';
      ctx.beginPath(); ctx.arc(sx,sy,22,0,TAU); ctx.fill();
      ctx.strokeStyle='rgba(100,180,255,0.25)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(sx,sy,22,0,TAU); ctx.stroke();
    }
  }

  renderHUD(){
    const p=this.player;
    // health bar (top-left)
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(10,10,200,20);
    ctx.fillStyle='#f33';
    ctx.fillRect(12,12,196*(p.hp/p.maxHp),16);
    ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.textAlign='left';
    ctx.fillText(`❤️ ${Math.ceil(p.hp)}/${p.maxHp}`,18,24);

    // level & XP
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(10,35,200,16);
    ctx.fillStyle='#4f4';
    const xpPct=this.xp/this.xpToNext;
    ctx.fillRect(12,37,196*xpPct,12);
    ctx.fillStyle='#fff'; ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.fillText(`Lv.${this.level}  XP ${this.xp}/${this.xpToNext}`,110,47);
    if(this.xpMul>1){ctx.fillStyle='#ff0'; ctx.fillText(`x${this.xpMul.toFixed(1)}`,200,47);}

    // time & kills (top-right)
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(W-200,10,190,40);
    ctx.fillStyle='#fff'; ctx.font='13px sans-serif'; textAlignRight('right');
    ctx.fillText(`⏱ ${Math.floor(this.time/60)}:${String(Math.floor(this.time%60)).padStart(2,'0')}`,W-15,28);
    ctx.fillText(`💀 ${this.kills}  🧟 ${this.entities.filter(e=>e.type==='enemy').length}`,W-15,44);

    // weapons (bottom-left)
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.fillRect(10,H-40,50*this.weapons.length+10,30);
    let wx=15;
    for(const w of this.weapons){
      const def=WEAPON_DEFS[w.id];
      ctx.fillStyle='#fff'; ctx.font='14px sans-serif'; ctx.textAlign='left';
      ctx.fillText(`${def?def.emoji||'🔫':''}${def?def.name:''} Lv.${w.level}`,wx,H-18);
      wx+=ctx.measureText(`${def?def.emoji||'🔫':''}${def?def.name:''} Lv.${w.level}`).width+15;
    }

    // debug info (bottom-right)
    if(fpsHistory.length){
      const avgFps=Math.round(fpsHistory.reduce((a,b)=>a+b,0)/fpsHistory.length);
      ctx.fillStyle='rgba(0,0,0,0.4)';
      ctx.fillRect(W-200,H-20,195,16);
      ctx.fillStyle='#8f8'; ctx.font='10px monospace'; ctx.textAlign='right';
      ctx.fillText(`${avgFps}FPS ${this.entities.length}ent 히트:${this.hitCount}`,W-8,H-8);
    }
  }

  renderLevelUp(){
    // dim background
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle='#ff4'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center';
    ctx.shadowColor='#ff4'; ctx.shadowBlur=20;
    ctx.fillText(`⬆ 레벨업! Lv.${this.level}`,W/2,120);
    ctx.shadowBlur=0;
    ctx.fillStyle='#aaa'; ctx.font='18px sans-serif';
    ctx.fillText('원하는 강화를 선택하세요 (1/2/3 키 또는 클릭)',W/2,155);

    const boxW=250, boxH=200, gap=30, totalW=this.upgradeChoices.length*boxW+(this.upgradeChoices.length-1)*gap;
    const startX=(W-totalW)/2;
    for(let i=0;i<this.upgradeChoices.length;i++){
      const up=this.upgradeChoices[i];
      const bx=startX+i*(boxW+gap), by=200;
      const hover=mouse.x>=bx&&mouse.x<=bx+boxW&&mouse.y>=by&&mouse.y<=by+boxH;

      ctx.fillStyle=hover?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.05)';
      ctx.fillRect(bx,by,boxW,boxH);
      ctx.strokeStyle=hover?'#ff4':'#444';
      ctx.lineWidth=2; ctx.strokeRect(bx,by,boxW,boxH);

      ctx.fillStyle='#fff'; ctx.font='40px sans-serif'; textAlignCenterH();
      ctx.fillText(up.icon||'⭐',bx+boxW/2,by+60);
      ctx.font='bold 20px sans-serif'; ctx.fillStyle='#ff4';
      ctx.fillText(up.name,bx+boxW/2,by+105);
      ctx.font='15px sans-serif'; ctx.fillStyle='#ccc';
      ctx.fillText(up.desc,bx+boxW/2,by+140);
      ctx.fillStyle='#888'; ctx.font='13px sans-serif';
      ctx.fillText(`[${i+1}] 선택`,bx+boxW/2,by+175);

      // handle click
      if(hover&&mouse.justClicked){this.applyUpgrade(i); mouse.justClicked=false; return;}
    }

    // keyboard selection
    for(let i=0;i<this.upgradeChoices.length;i++){
      if(keys[String(i+1)]){ this.applyUpgrade(i); keys[String(i+1)]=false; return; }
    }
  }

  renderGameOver(){
    ctx.fillStyle='rgba(0,0,0,0.75)';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle='#f44'; ctx.font='bold 52px sans-serif'; ctx.textAlign='center';
    ctx.shadowColor='#f44'; ctx.shadowBlur=40;
    ctx.fillText('💀 GAME OVER',W/2,180);
    ctx.shadowBlur=0;

    ctx.fillStyle='#fff'; ctx.font='22px sans-serif';
    ctx.fillText(`생존 시간: ${Math.floor(this.stats.time/60)}:${String(Math.floor(this.stats.time%60)).padStart(2,'0')}`,W/2,260);
    ctx.fillText(`처치 수: ${this.stats.kills}`,W/2,295);
    ctx.fillText(`레벨: ${this.stats.level}`,W/2,330);

    const by=400, bw=220, bh=50;
    const hover=mouse.x>=W/2-bw/2&&mouse.x<=W/2+bw/2&&mouse.y>=by&&mouse.y<=by+bh;
    ctx.fillStyle=hover?'#f44':'#822';
    ctx.fillRect(W/2-bw/2,by,bw,bh);
    ctx.strokeStyle='#f44'; ctx.lineWidth=2;
    ctx.strokeRect(W/2-bw/2,by,bw,bh);
    ctx.fillStyle='#fff'; ctx.font='bold 22px sans-serif';
    ctx.fillText('다시 시작',W/2,by+33);

    if(hover&&mouse.justClicked){ mouse.justClicked=false; this.state='menu'; return; }
    if(keys['r']||keys['R']||keys['Enter']){ keys['r']=false; this.state='menu'; }
  }
}

// ─── 헬퍼 ───
function textAlignRight(dir){
  ctx.textAlign=dir||'right';
}
function textAlignCenterH(){
  ctx.textAlign='center';
}

// ─── 게임 루프 ───
let lastTime=0;
let logTimer=0;
const fpsHistory=[];
function loop(timestamp){
  const dt=Math.min((timestamp-lastTime)/1000,0.05);
  lastTime=timestamp;

  if(game){
    try{ game.update(dt); game.render(); }
    catch(e){ console.warn('[ZOMBIE] frame error:',e); }
  }

  // 디버그 로그 — 1초 간격
  const safeDt=Math.max(dt,0.001);
  logTimer+=safeDt;
  fpsHistory.push(1/safeDt);
  if(fpsHistory.length>60) fpsHistory.shift();
  if(logTimer>=1){
    logTimer=0;
    const avgFps=Math.round(fpsHistory.reduce((a,b)=>a+b,0)/fpsHistory.length);
    console.log(
      `[ZOMBIE] time=${game?Math.floor(game.time):'-'}s `+
      `state=${game?game.state:'-'} `+
      `fps=${avgFps} `+
      `dt=${(dt*1000).toFixed(1)}ms `+
      `entities=${game?game.entities.length:'-'} `+
      `player=(${game?Math.round(game.player.x):'-'},${game?Math.round(game.player.y):'-'}) `+
      `cam=(${game?Math.round(game.camX):'-'},${game?Math.round(game.camY):'-'})`
    );
  }

  mouse.justClicked=false;
  animId=requestAnimationFrame(loop);
}

// ─── 시작 ───
window.onload=function(){
  game=new Game();
  lastTime=performance.now();
  loop(lastTime);
};
