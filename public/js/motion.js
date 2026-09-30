/* Scroll motion: smooth scrolling (Lenis) + content that fades and rises into view.
   - Nothing is hidden until this script runs (the .rv-on class gates every hidden state),
     so the page reads normally without JavaScript.
   - With "reduce motion" switched on, none of this runs.
   - Reveals use the `translate` property, not `transform`, so elements keep their own
     rotations and hover lifts; the reveal classes are removed once the motion ends. */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;

  /* 1. smooth scrolling */
  if(window.Lenis){
    try{window.lenis=new Lenis({autoRaf:true,lerp:0.1,smoothWheel:true})}catch(e){}
  }

  /* 2. reveal on scroll */
  if(!('IntersectionObserver' in window))return;
  document.documentElement.classList.add('rv-on');

  /* headings rise in word by word */
  var HEAD='main h1, main h2, .ct-lead-first';
  /* blocks fade and rise; siblings in the same group are staggered */
  var BLOCK=[
    '.hero-loc','.hero-lead','.hero-ctas','.hero-art','.hero .marquee',
    'main .label','.ws-head .hand','.sec-head > p','.page-lead','.ab-body','.filters','.filter-bar','.result-count',
    '.values > *','.nots-row','.cls-grid > .cls','.cls-more','.disc > .dcard','.studio','.aud .tabs',
    '.ws-card','.ct-panel','.founder > *','.p-grid > li','.p-cta','.g-grid > *','.stats > .stat',
    '.sd-by',':not(.ws-art) > .ws-tags','.sd-hero','.sd-tabs','.sd-block','.sd-end-note','.sd-card','.sd-inc > *','.sd-inc-grid > li','.mt-grid > .mt-card',
    'footer .f-grid > *','footer .f-bottom'
  ].join(',');

  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      var el=e.target;io.unobserve(el);
      el.classList.add('rv-in');
      if(!el.classList.contains('rv-head')){
        var d=parseFloat(el.style.getPropertyValue('--d'))||0;
        setTimeout(function(){el.classList.remove('rv','rv-in');el.style.removeProperty('--d')},(d+1)*1000+100);
      }
    });
  },{rootMargin:'0px 0px -8% 0px',threshold:0.12});

  function splitWords(h){
    var walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT,null),nodes=[],n,i=0;
    while((n=walker.nextNode()))nodes.push(n);
    nodes.forEach(function(t){
      var parts=t.textContent.split(/(\s+)/),frag=document.createDocumentFragment();
      parts.forEach(function(p){
        if(!p)return;
        if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(p));return}
        var w=document.createElement('span');w.className='rv-w';
        var inner=document.createElement('span');inner.className='rv-wi';inner.style.setProperty('--i',i++);
        inner.textContent=p;w.appendChild(inner);frag.appendChild(w);
      });
      t.parentNode.replaceChild(frag,t);
    });
  }

  function prep(root){
    if(root.nodeType!==1||root.closest('.rv-head'))return;
    var heads=[].slice.call(root.querySelectorAll(HEAD));if(root.matches(HEAD))heads.push(root);
    heads.forEach(function(h){
      if(h.classList.contains('rv'))return;
      splitWords(h);h.classList.add('rv','rv-head');io.observe(h);
    });
    var blocks=[].slice.call(root.querySelectorAll(BLOCK));if(root.matches(BLOCK))blocks.push(root);
    blocks.forEach(function(el){
      if(el.classList.contains('rv')||el.classList.contains('rv-done')||el.closest('.rv-head'))return;
      var sibs=[].filter.call(el.parentNode.children,function(s){return s.matches(BLOCK)}),k=sibs.indexOf(el);
      el.classList.add('rv','rv-done');
      if(k>0)el.style.setProperty('--d',(Math.min(k,6)*0.08).toFixed(2)+'s');
      io.observe(el);
    });
  }

  prep(document.body);
  /* content rendered later (cards, filters, workshop pages) animates the same way */
  new MutationObserver(function(ms){
    ms.forEach(function(m){[].forEach.call(m.addedNodes,function(n){if(n.nodeType===1)prep(n)})});
  }).observe(document.body,{childList:true,subtree:true});
})();
