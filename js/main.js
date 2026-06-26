(function(){
'use strict';

/* ============================================================
   CURSOR
============================================================= */
const cur = document.getElementById('cursor');
const curR = document.getElementById('cursor-ring');
let mx=0,my=0,rx=0,ry=0;

document.addEventListener('mousemove',e=>{
  mx=e.clientX; my=e.clientY;
  cur.style.left=mx+'px'; cur.style.top=my+'px';
});
// ring follows with lag
(function animRing(){
  rx+=(mx-rx)*.12; ry+=(my-ry)*.12;
  curR.style.left=rx+'px'; curR.style.top=ry+'px';
  requestAnimationFrame(animRing);
})();

/* ============================================================
   LOADER
============================================================= */
const loader = document.getElementById('loader');
const loaderPct = document.getElementById('loader-pct');
let pct=0;
const loaderInt = setInterval(()=>{
  pct = Math.min(pct+4, 100);
  loaderPct.textContent = pct+'%';
  if(pct>=100){
    clearInterval(loaderInt);
    setTimeout(()=>{
      loader.classList.add('out');
      initPageEntries();
    },120);
  }
},20);

function initPageEntries(){
  // Trigger above-fold sr elements immediately
  document.querySelectorAll('#hero [data-sr]').forEach((el,i)=>{
    setTimeout(()=>el.classList.add('up'), i*80);
  });
}

/* ============================================================
   HERO THREE.JS CANVAS — Animated 3D Terrain / Mesh
============================================================= */
(function initHeroCanvas(){
  const canvas = document.getElementById('hero-canvas');
  if(!canvas||!window.THREE) return;

  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.set(0, 18, 32);
  camera.lookAt(0,0,0);

  function resize(){
    const w=canvas.clientWidth, h=canvas.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize',resize);

  // Terrain grid geometry
  const COLS=60, ROWS=60;
  const geo = new THREE.PlaneGeometry(80,80,COLS-1,ROWS-1);
  geo.rotateX(-Math.PI/2);

  // Colors
  const mat = new THREE.MeshStandardMaterial({
    color:0x114C5A,
    wireframe:true,
    transparent:true,
    opacity:.45,
  });

  const mesh = new THREE.Mesh(geo,mat);
  scene.add(mesh);

  // Ambient + directional light
  const ambient = new THREE.AmbientLight(0xD9E8E2, .3);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xFFC801, 1.2);
  dirLight.position.set(10,20,10);
  scene.add(dirLight);

  // Particle dots
  const pGeo = new THREE.BufferGeometry();
  const pCount = 300;
  const pPos = new Float32Array(pCount*3);
  for(let i=0;i<pCount;i++){
    pPos[i*3]=(Math.random()-.5)*120;
    pPos[i*3+1]=Math.random()*20;
    pPos[i*3+2]=(Math.random()-.5)*120;
  }
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
  const pMat = new THREE.PointsMaterial({color:0xFFC801,size:.3,transparent:true,opacity:.4});
  const particles = new THREE.Points(pGeo,pMat);
  scene.add(particles);

  // Mouse influence
  let targetRotX=0, targetRotY=0, curRotX=0, curRotY=0;
  document.addEventListener('mousemove',e=>{
    targetRotX = (e.clientY/window.innerHeight - .5) * .3;
    targetRotY = (e.clientX/window.innerWidth - .5) * .5;
  });

  // Stored original positions for wave
  const posAttr = geo.attributes.position;
  const origY = new Float32Array(posAttr.count);
  for(let i=0;i<posAttr.count;i++) origY[i]=posAttr.getY(i);

  let t=0;
  function animate(){
    requestAnimationFrame(animate);
    t+=0.008;

    // Terrain wave
    for(let i=0;i<posAttr.count;i++){
      const x=posAttr.getX(i), z=posAttr.getZ(i);
      const wave = Math.sin(x*.08+t)*2.5 + Math.sin(z*.1+t*.8)*2 + Math.sin((x+z)*.05+t*.6)*1.5;
      posAttr.setY(i, origY[i]+wave);
    }
    posAttr.needsUpdate=true;
    geo.computeVertexNormals();

    // Slow camera rotation
    curRotX += (targetRotX-curRotX)*.03;
    curRotY += (targetRotY-curRotY)*.03;
    mesh.rotation.x = curRotX;
    mesh.rotation.y = curRotY;
    particles.rotation.y = t*.05;
    particles.position.y = Math.sin(t*.3)*1.5;

    renderer.render(scene,camera);
  }
  animate();
})();

/* ============================================================
   HERO CURSOR GLOW
============================================================= */
const heroGlow = document.getElementById('heroGlow');
const heroEl = document.getElementById('hero');
if(heroEl && heroGlow){
  heroEl.addEventListener('mousemove',e=>{
    const r = heroEl.getBoundingClientRect();
    heroGlow.style.left = (e.clientX-r.left)+'px';
    heroGlow.style.top  = (e.clientY-r.top)+'px';
    heroGlow.style.opacity='1';
  });
  heroEl.addEventListener('mouseleave',()=>{ heroGlow.style.opacity='0'; });
}

/* ============================================================
   BENTO SPOTLIGHT
============================================================= */
document.querySelectorAll('.bn').forEach(bn=>{
  const spot = bn.querySelector('.bn-spotlight');
  if(!spot) return;
  bn.addEventListener('mousemove',e=>{
    const r=bn.getBoundingClientRect();
    spot.style.left=(e.clientX-r.left)+'px';
    spot.style.top=(e.clientY-r.top)+'px';
  });
});

/* ============================================================
   ANIMATED COUNTER — number roll-up
============================================================= */
function animateCounter(el, target, suffix, duration){
  const isFloat = !Number.isInteger(target);
  const start = performance.now();
  function step(now){
    const p = Math.min((now-start)/duration,1);
    const ease = p<.5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
    const val = target*ease;
    el.textContent = (isFloat ? val.toFixed(isFloat&&target>=1?2:1) : Math.round(val)) + suffix;
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   HERO FLOATING CARD counter
============================================================= */
setTimeout(()=>{
  const evEl=document.getElementById('hfc-ev');
  if(evEl){
    let v=0; const end=4;
    const iv=setInterval(()=>{
      v+=.1; evEl.textContent=v.toFixed(1);
      if(v>=end){evEl.textContent=end;clearInterval(iv);}
    },60);
  }
},800);

/* ============================================================
   SCROLL REVEAL — IntersectionObserver
============================================================= */
const srObs = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('up');
    // Trigger counters on stat section
    el.querySelectorAll('.counter').forEach(c=>{
      const target = parseFloat(c.dataset.target);
      const suffix = c.dataset.suffix||'';
      animateCounter(c, target, suffix, 1400);
    });
    // Trigger dashboard counters
    el.querySelectorAll('.counter-dash').forEach(c=>{
      const target = parseFloat(c.dataset.target);
      animateCounter(c, target, '', 1600);
    });
    // Trigger chart animation
    el.querySelectorAll('.chart-line,.chart-area').forEach(p=>p.classList.add('animate'));
    // Trigger gauge
    const g1=el.querySelector('#gauge1');
    if(g1){ setTimeout(()=>{ g1.style.strokeDashoffset='30'; },400); }
    const g2=el.querySelector('#gauge2');
    if(g2){ setTimeout(()=>{ g2.style.strokeDashoffset='57'; },600); }

    srObs.unobserve(el);
  });
},{threshold:.12, rootMargin:'0px 0px -60px 0px'});

document.querySelectorAll('[data-sr]').forEach(el=>srObs.observe(el));

/* ============================================================
   SVG CHART — build path
============================================================= */
(function buildChart(){
  const chartLine = document.getElementById('chartLine');
  const chartArea = document.getElementById('chartArea');
  if(!chartLine) return;
  const pts = [
    {x:0,y:55},{x:40,y:45},{x:80,y:60},{x:120,y:30},
    {x:160,y:38},{x:200,y:20},{x:240,y:32},{x:280,y:15},
    {x:320,y:25},{x:360,y:10},{x:400,y:18}
  ];
  let d='M';
  pts.forEach((p,i)=>{
    if(i===0){d+=`${p.x} ${p.y}`;}
    else{
      const prev=pts[i-1];
      const cpx=(prev.x+p.x)/2;
      d+=` C${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    }
  });
  chartLine.setAttribute('d',d);
  chartArea.setAttribute('d',d+' L400 80 L0 80 Z');
  // recalculate dash for actual path length
  const len = chartLine.getTotalLength?.() || 600;
  chartLine.style.strokeDasharray=len;
  chartLine.style.strokeDashoffset=len;
})();

/* ============================================================
   CTA CANVAS — Particle dot field
============================================================= */
(function initCtaCanvas(){
  const canvas = document.getElementById('cta-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize(){
    canvas.width=canvas.clientWidth;
    canvas.height=canvas.clientHeight;
  }
  resize(); window.addEventListener('resize',resize);

  const dots=[];
  for(let i=0;i<120;i++){
    dots.push({
      x:Math.random()*1400,y:Math.random()*600,
      vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,
      r:Math.random()*1.5+.5,
      o:Math.random()*.4+.1
    });
  }

  let ctaMx=-9999, ctaMy=-9999;
  canvas.parentElement?.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect();
    ctaMx=e.clientX-r.left; ctaMy=e.clientY-r.top;
  });

  function draw(){
    requestAnimationFrame(draw);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Background gradient
    const grad = ctx.createRadialGradient(canvas.width/2,canvas.height/2,0,canvas.width/2,canvas.height/2,canvas.width*.7);
    grad.addColorStop(0,'rgba(17,76,90,.4)');
    grad.addColorStop(1,'rgba(14,28,36,.95)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Lines between near dots
    dots.forEach((a,i)=>{
      dots.slice(i+1).forEach(b=>{
        const dx=a.x-b.x, dy=a.y-b.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<80){
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=`rgba(255,200,1,${.08*(1-dist/80)})`;
          ctx.lineWidth=.5;ctx.stroke();
        }
      });
      // Cursor repel
      const dx=a.x-ctaMx, dy=a.y-ctaMy;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<100){a.vx+=dx/d*.4;a.vy+=dy/d*.4;}

      a.x+=a.vx; a.y+=a.vy;
      if(a.x<0||a.x>canvas.width)a.vx*=-1;
      if(a.y<0||a.y>canvas.height)a.vy*=-1;

      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,200,1,${a.o})`;
      ctx.fill();
    });
  }
  draw();
})();

/* ============================================================
   FEATURE 2: BENTO ↔ ACCORDION — Context Transfer
============================================================= */
let bentoActive=-1, acOpen=-1;
const MOBILE_BP=768;
let wasMobile=window.innerWidth<=MOBILE_BP;

document.querySelectorAll('.bn').forEach(bn=>{
  bn.addEventListener('mouseenter',()=>{bentoActive=+bn.dataset.index;bn.classList.add('active')});
  bn.addEventListener('mouseleave',()=>bn.classList.remove('active'));
  bn.addEventListener('focus',()=>{bentoActive=+bn.dataset.index});
});

function openAccordion(idx){
  document.querySelectorAll('.ac-item').forEach(item=>{
    const open=+item.dataset.index===idx;
    item.classList.toggle('open',open);
    item.querySelector('.ac-btn')?.setAttribute('aria-expanded',String(open));
  });
  acOpen=idx;
}

document.querySelectorAll('.ac-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const item=btn.closest('.ac-item');
    const idx=+item.dataset.index;
    if(item.classList.contains('open')){
      item.classList.remove('open');btn.setAttribute('aria-expanded','false');acOpen=-1;
    } else {
      openAccordion(idx); bentoActive=idx;
    }
  });
});

let rTimer;
window.addEventListener('resize',()=>{
  clearTimeout(rTimer);
  rTimer=setTimeout(()=>{
    const isMob=window.innerWidth<=MOBILE_BP;
    if(isMob&&!wasMobile){
      if(bentoActive>=0) openAccordion(bentoActive);
      wasMobile=true;
    } else if(!isMob&&wasMobile){
      if(acOpen>=0){
        bentoActive=acOpen;
        document.querySelectorAll('.bn').forEach(n=>n.classList.toggle('active',+n.dataset.index===acOpen));
      }
      wasMobile=false;
    }
  },50);
});

/* ============================================================
   PRICING MATRIX — Feature 1 (state-isolated)
============================================================= */
const PM={
  base:{starter:25,pro:79,enterprise:239},
  annual_discount:.80,
  tariff:{
    INR:{symbol:'₹',rate:83.12,regional_factor:.97},
    USD:{symbol:'$',rate:1.00,regional_factor:1.00},
    EUR:{symbol:'€',rate:.93,regional_factor:.98},
  }
};
let activeBilling='monthly', activeCurrency='INR';

function computePrice(plan,billing,currency){
  const base=PM.base[plan];
  const mult=billing==='annual'?PM.annual_discount:1;
  const {rate,regional_factor}=PM.tariff[currency];
  return Math.round(base*mult*rate*regional_factor);
}
function fmtPrice(v,cur){return cur==='INR'?v.toLocaleString('en-IN'):v.toLocaleString('en-US')}

function updatePrices(){
  const {symbol}=PM.tariff[activeCurrency];
  document.querySelectorAll('[data-field="symbol"]').forEach(el=>el.textContent=symbol);
  ['starter','pro','enterprise'].forEach(plan=>{
    const price=computePrice(plan,activeBilling,activeCurrency);
    const fmt=fmtPrice(price,activeCurrency);
    const vEl=document.querySelector(`[data-plan="${plan}"][data-field="value"]`);
    const nEl=document.querySelector(`[data-plan="${plan}"][data-field="note"]`);
    if(vEl){
      vEl.style.opacity='0';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{vEl.textContent=fmt;vEl.style.transition='opacity 150ms ease-out';vEl.style.opacity='1';}));
    }
    if(nEl){
      if(activeBilling==='annual'){
        nEl.textContent=`${symbol}${fmtPrice(price*12,activeCurrency)}/yr · Billed annually`;
      } else {
        nEl.textContent='Billed monthly';
      }
    }
  });
}

window.setBilling=function(b){
  if(activeBilling===b)return; activeBilling=b;
  document.querySelectorAll('[data-billing]').forEach(btn=>{
    const on=btn.dataset.billing===b;
    btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',String(on));
  });
  updatePrices();
};
window.setCurrency=function(c){
  if(activeCurrency===c)return; activeCurrency=c;
  document.querySelectorAll('[data-currency]').forEach(btn=>{
    const on=btn.dataset.currency===c;
    btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',String(on));
  });
  updatePrices();
};
updatePrices();

})();
