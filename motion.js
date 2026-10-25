/* Presentation only. Never changes permission rules, choices, or authorization. */
(()=>{'use strict';
 const main=document.querySelector('main');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let observer;
 function prepare(){
  if(observer)observer.disconnect();
  document.body.dataset.page=location.hash.slice(1)||'overview';
  const items=main.querySelectorAll('.page-heading,.hero,.stats,.scenario,.bottom-grid,.steps,.offer,.decision,.finance-proposal,.privacy-layout>.panel,.contract-list,.contract-editor,.evidence-grid,.research-hero,.thinking-grid,.mechanism');
  if(reduced.matches){items.forEach(e=>e.classList.remove('reveal-pending'));return;}
  observer=new IntersectionObserver(entries=>{for(const entry of entries){
   if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');entry.target.classList.add('reveal-ready');}
   entry.target.classList.toggle('motion-visible',entry.isIntersecting);
  }},{threshold:0.035});
  items.forEach((e,i)=>{e.style.setProperty('--entry-delay',Math.min(i%4*65,195)+'ms');e.classList.add('reveal-pending');observer.observe(e);});
 }
 const changes=new MutationObserver(prepare);changes.observe(main,{childList:true});prepare();
 reduced.addEventListener('change',prepare);
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){
  main.addEventListener('pointermove',event=>{if(reduced.matches)return;
   const card=event.target.closest('.hero,.scenario');if(!card)return;
   const r=card.getBoundingClientRect();
   card.style.setProperty('--pointer-x',((event.clientX-r.left)/r.width*100).toFixed(1)+'%');
   card.style.setProperty('--pointer-y',((event.clientY-r.top)/r.height*100).toFixed(1)+'%');
  },{passive:true});
 }
 document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('motion-paused',document.hidden);});
})();
