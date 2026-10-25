/* Decorative only: no decision state, network, or authorization access. */
(()=>{'use strict';
 const main=document.querySelector('main'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),toggle=document.querySelector('.motion-toggle');
 let manualPause=false,cleanup=()=>{};
 const paused=()=>manualPause||document.hidden||reduced.matches;
 function sync(){document.body.classList.toggle('motion-paused',paused());toggle.setAttribute('aria-pressed',String(manualPause));toggle.setAttribute('aria-label',reduced.matches?'Decorative motion reduced by your device preference':manualPause?'Resume decorative motion':'Pause decorative motion');toggle.querySelector('.motion-toggle-label').textContent=reduced.matches?'Reduced motion':manualPause?'Resume motion':'Pause motion';toggle.firstElementChild.textContent=manualPause?'▷':'Ⅱ';}
 toggle.addEventListener('click',()=>{manualPause=!manualPause;sync();});
 function scene(hero){
  const layer=document.createElement('div');layer.className='cinematic-scene';layer.setAttribute('aria-hidden','true');layer.innerHTML='<canvas class="starfield"></canvas><div class="space-horizon"></div><div class="floating-types"><span class="floating-word word-1">HUMAN AUTHORITY</span><span class="floating-word word-2">YOUR INTENT</span><span class="floating-word word-3">PREDICTION ≠ PERMISSION</span><span class="floating-word word-4">KEEP THE FINAL SAY</span></div>';hero.prepend(layer);
  const art=hero.querySelector('.next-system'),orbit=document.createElement('div');orbit.className='orbital-label';orbit.setAttribute('aria-hidden','true');orbit.innerHTML='<span>YOU ARE THE AUTHOR</span><i></i>';art.append(orbit);
  const canvas=layer.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
  let w=1,h=1,frame=0,last=0,active=true,painted=false;
  const stars=Array.from({length:95},()=>({x:(Math.random()-.5)*2.4,y:(Math.random()-.5)*2.1,z:Math.random()*1.5+.05,size:Math.random()*.8+.3}));
  const resize=new ResizeObserver(entries=>{const r=entries[0].contentRect;w=r.width;h=r.height;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);painted=false;});resize.observe(hero);
  const visibility=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;},{threshold:.01});visibility.observe(hero);
  function paint(time){frame=requestAnimationFrame(paint);const dt=Math.min((time-last)||16,40);last=time;if((paused()&&painted)||!active)return;ctx.clearRect(0,0,w,h);const cx=w*.77,cy=h*.45,f=Math.min(w,h)*.46;
   for(const star of stars){const before=star.z;if(!paused())star.z-=dt*.000065;if(star.z<.07){star.z=1.55;star.x=(Math.random()-.5)*2.4;star.y=(Math.random()-.5)*2.1;continue;}const x=cx+star.x/star.z*f,y=cy+star.y/star.z*f,px=cx+star.x/before*f,py=cy+star.y/before*f;if(x<0||x>w||y<0||y>h)continue;const alpha=Math.min(.65,(1.6-star.z)*.46)*(x<w*.43?.12:1);ctx.strokeStyle=`rgba(196,161,255,${alpha})`;ctx.lineWidth=Math.min(1.5,star.size/star.z*.6);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=`rgba(219,196,255,${alpha})`;ctx.beginPath();ctx.arc(x,y,Math.min(1.3,star.size/star.z*.42),0,Math.PI*2);ctx.fill();}painted=true;
  }frame=requestAnimationFrame(paint);
  return ()=>{cancelAnimationFrame(frame);resize.disconnect();visibility.disconnect();};
 }
 function prepare(){cleanup();cleanup=()=>{};const hero=main.querySelector('.hero');if(hero){cleanup=scene(hero);hero.querySelector('h2').classList.add('title-arrive');}
  const note=main.querySelector('.note-card');if(note){const crawl=document.createElement('div');crawl.className='perspective-crawl';crawl.setAttribute('aria-hidden','true');crawl.innerHTML='<div>YOUR LIFE.<br>YOUR AUTHORITY.<br><br>THE FUTURE IS<br>STILL UNWRITTEN.<br><br>KEEP THE RIGHT<br>TO CHOOSE.</div>';note.append(crawl);}sync();
 }
 new MutationObserver(prepare).observe(main,{childList:true});prepare();
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){let frame;
  main.addEventListener('pointermove',event=>{if(paused())return;const hero=event.target.closest('.hero');if(!hero)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--scene-x',((event.clientX-r.left-r.width/2)*.022).toFixed(1)+'px');hero.style.setProperty('--scene-y',((event.clientY-r.top-r.height/2)*.018).toFixed(1)+'px');});},{passive:true});
  main.addEventListener('pointerout',event=>{const hero=event.target.closest('.hero');if(hero&&!hero.contains(event.relatedTarget)){hero.style.setProperty('--scene-x','0px');hero.style.setProperty('--scene-y','0px');}},{passive:true});
 }
})();

