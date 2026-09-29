(function(){
  /* Two ways the same code runs:
     - the one-page preview (index.html on its own): views switch by #hash, e.g. #w-lets-touchdesign
     - the published site made by tools/build.mjs: every view is its own page with a real address
       (/workshops/lets-touchdesign/). The build marks <html> with data-base (path back to the site
       root, e.g. "../../") and data-page (which view this page is), and keeps only that view. */
  var BASE=document.documentElement.getAttribute('data-base'),PAGE=document.documentElement.getAttribute('data-page')||'home';
  var PATHS={'about-us':'about/',workshops:'workshops/',mentors:'mentors/'};
  function href(r){
    if(BASE===null)return '#'+r;
    if(r.indexOf('w-')===0)return BASE+'workshops/'+r.slice(2)+'/';
    if(PATHS[r])return BASE+PATHS[r];
    if(r==='top')return PAGE==='home'?'#top':BASE;
    return PAGE==='home'?'#'+r:BASE+'#'+r;
  }
  /* images and data sit at the site root; pages in sub-folders reach them through data-base */
  function asset(p){return BASE===null||/^(https?:|\/|data:|mailto:)/.test(p)?p:BASE+p}
  var TITLES={home:'Hiveworx · Hands-on design workshops in Lisbon','about-us':'About Hiveworx · An experience-based design school in Lisbon',
    mentors:'Mentors · Practitioners who teach at Hiveworx, Lisbon',workshops:'Design workshops & talks in Lisbon · Hiveworx'};
  /* "Drawing Letters · Workshop in Lisbon · Hiveworx"; titles that already say workshop/talk just add the city */
  function sessionTitle(s){return s.title+(new RegExp('\\b'+typeLabel(s)+'\\b','i').test(s.title)?' in Lisbon':' · '+typeLabel(s)+' in Lisbon')+' · Hiveworx'}

  var nav=document.getElementById('nav');
  function onScroll(){nav.classList.toggle('scrolled',window.scrollY>8)}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  var mb=document.getElementById('menuBtn');
  /* mobile menu: full-screen blurred overlay; the page underneath stops scrolling while it is open */
  function setMenu(o){
    nav.classList.toggle('open',o);mb.setAttribute('aria-expanded',o);mb.setAttribute('aria-label',o?'Close menu':'Open menu');
    document.documentElement.classList.toggle('menu-open',o);
    if(window.lenis){o?lenis.stop():lenis.start()}
  }
  mb.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
  document.querySelectorAll('#menu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);mb.focus()}});
  matchMedia('(min-width:881px)').addEventListener('change',function(e){if(e.matches)setMenu(false)});

  var tabs=[].slice.call(document.querySelectorAll('#join [role=tab]'));
  function select(t,focus){
    tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!on});
    if(focus)t.focus({preventScroll:true});
    /* phones: the tab row scrolls sideways; bring the chosen tab to the middle */
    var row=t.parentNode;if(row.scrollWidth>row.clientWidth)row.scrollTo({left:t.offsetLeft-(row.clientWidth-t.offsetWidth)/2,behavior:"smooth"});
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){select(t)});
    t.addEventListener('keydown',function(e){
      var k=e.key,n=null;
      if(k==='ArrowRight')n=tabs[(i+1)%tabs.length];
      if(k==='ArrowLeft')n=tabs[(i-1+tabs.length)%tabs.length];
      if(k==='Home')n=tabs[0]; if(k==='End')n=tabs[tabs.length-1];
      if(n){e.preventDefault();select(n,true)}
    });
  });
  document.querySelectorAll('[data-tab]').forEach(function(a){a.addEventListener('click',function(){select(document.getElementById(a.dataset.tab))})});





  /* ===== Sessions: one list, every page reads from it ===== */
  var ICON={date:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    time:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    loc:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    fmt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h2l2-6 3 12 3-9 2 5 2-2h4"/></svg>',
    level:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19v-5M12 19V9M19 19V5"/></svg>',
    duration:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/></svg>',
    person:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.6-4.4 3.5-7 7.5-7s6.9 2.6 7.5 7"/></svg>',
    price:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12 12 20 4 12V4h8Z"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>'};
  var SESSIONS=[],MENTORS=[],MENTOR_ORDER=[],HIDDEN=[];   /* HIDDEN: pages switched off in sessions.json (hiddenPages) */
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function art(){return '<div class="ph ph-art" role="img" aria-label="Image coming soon"><span class="ph-text">No image</span></div>'}
  /* a session photo when there is one, otherwise the image placeholder */
  function media(s,lazy){return s.image?'<img class="ws-photo"'+(lazy?' loading="lazy"':'')+' src="'+esc(asset(s.image.src))+'" alt="'+esc(s.image.alt)+'" width="1672" height="941"'+(s.image.focus?' style="object-position:'+esc(s.image.focus)+'"':'')+'>':art(s.art)}
  function typeLabel(s){return s.format==='talk'?'Talk':'Workshop'}
  function byDate(a,b){if(!a.dateISO&&!b.dateISO)return 0;if(!a.dateISO)return 1;if(!b.dateISO)return -1;return a.dateISO<b.dateISO?-1:1}
  /* card price has little room: "To be announced" shows as TBD (the workshop page keeps the full words) */
  function tbd(v){return /^to be announced$/i.test(String(v||"").trim())?"TBD":v}
  function card(s){
    return '<article class="cls" data-kind="'+esc(s.format)+'" data-disc="'+esc(s.discipline)+'">'+
      '<div class="cls-art">'+media(s,1)+'<span class="cls-type">'+typeLabel(s)+'</span>'+(s.featured?'<span class="cls-status cls-status-up">next up</span>':'')+'</div>'+
      '<div class="cls-body"><p class="cls-tag">'+esc(s.discipline)+'</p>'+seriesLine(s)+
      '<h3><a href="'+href('w-'+s.slug)+'">'+esc(s.title)+'</a></h3>'+
      '<ul class="cls-when"><li>'+ICON.date+esc(s.date)+'</li><li>'+ICON.time+esc(s.time)+'</li></ul>'+
      '<div class="cls-mentor">'+ICON.person+'<span><b>'+esc(s.mentor.name)+'</b>'+esc(s.mentor.role)+'</span></div>'+
      '<div class="cls-foot"><p class="price"><b>'+esc(tbd(s.price))+'</b>'+esc(s.priceNote)+'</p>'+
      '<a class="btn btn-ghost btn-sm" '+(s.dateISO&&s.bookUrl?'href="'+esc(s.bookUrl)+'" target="_blank" rel="noopener"':'href="'+href('w-'+s.slug)+'"')+'>'+(s.dateISO?'Book a spot':'View details')+' <span class="arr">→</span></a></div></div></article>';
  }
  function metaList(s){
    return '<ul class="ws-meta"><li>'+ICON.date+'<span><b>Date</b>'+esc(s.date)+'</span></li><li>'+ICON.time+'<span><b>Start time</b>'+esc(s.time)+'</span></li>'+
      '<li>'+ICON.loc+'<span><b>Location</b>'+esc(s.location)+'</span></li><li>'+ICON.fmt+'<span><b>Format</b>'+esc(s.formatLabel)+'</span></li></ul>';
  }
  /* "Book a spot" on cards opens the booking page directly when a session has one */
  function ctaLabel(s){return s.dateISO?'Book a spot':'Register your interest'}
  /* workshops that belong to a series: a small line on cards, and a strip on the workshop page */
  function seriesParts(s){return SESSIONS.filter(function(x){return x.series&&x.series.id===s.series.id}).sort(function(a,b){return a.series.part-b.series.part})}
  function seriesLine(s){return s.series?'<p class="cls-series"><span>Series</span> · Part '+s.series.part+' of '+s.series.of+'</p>':''}
  function seriesStrip(s){
    if(!s.series)return '';
    var parts=seriesParts(s),next=parts.filter(function(x){return x.series.part===s.series.part+1})[0];
    return '<nav class="sd-series" aria-label="'+esc(s.series.name)+' series"><p class="sd-series-name"><span class="label">Series</span> '+esc(s.series.name)+'</p><ol>'+
      parts.map(function(x){var cur=x.slug===s.slug;return '<li'+(cur?' class="is-current"':'')+'><a href="'+href('w-'+x.slug)+'"'+(cur?' aria-current="page"':'')+'><span class="sd-series-n">0'+x.series.part+'</span>'+esc(x.title)+'</a></li>'}).join('')+'</ol>'+
      (next?'<a class="link sd-series-next" href="'+href('w-'+next.slug)+'">Continues with Part '+next.series.part+': '+esc(next.title)+' <span class="arr">→</span></a>':'<p class="sd-series-next">Final part of the series</p>')+'</nav>';
  }

  function renderFeatured(){
    var s=SESSIONS.filter(function(x){return x.featured})[0]; var el=document.getElementById('featured');
    if(!el)return;
    if(!s){el.closest('section').hidden=true;return}
    el.innerHTML='<article class="ws-card"><div class="ws-art">'+media(s)+
      '<div class="ws-tags"><span class="tag">'+esc(s.discipline)+'</span><span class="tag tag-ghost">'+typeLabel(s)+'</span></div></div><div class="ws-body">'+
      '<div class="ws-title"><h2><a href="'+href('w-'+s.slug)+'">'+esc(s.title)+'</a></h2><p class="ws-by">'+ICON.person+typeLabel(s)+' by: <b>'+esc(s.mentor.name)+'</b></p></div>'+
      metaList(s)+
      '<div class="ws-ctas"><a class="btn btn-light" href="'+href('w-'+s.slug)+'">See '+typeLabel(s).toLowerCase()+' details <span class="arr">→</span></a></div></div></article>';
  }
  function renderHomeGrid(){
    /* three cards: the featured session, then any pinned with homePin, then the next by date */
    var rank=function(x){return x.featured?0:x.homePin?1:2};
    var list=SESSIONS.slice().sort(function(a,b){return rank(a)-rank(b)||byDate(a,b)}).slice(0,3);
    ['homeGrid','aboutGrid'].forEach(function(id){var g=document.getElementById(id);if(g)g.innerHTML=list.map(card).join('')});
    applyHomeFilter();
  }
  function wireFilters(fid,gid){
    var btns=[].slice.call(document.querySelectorAll('#'+fid+' .filter'));
    btns.forEach(function(b){b.addEventListener('click',function(){
      btns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
      [].forEach.call(document.querySelectorAll('#'+gid+' .cls'),function(c){c.hidden=!(b.dataset.filter==='all'||c.dataset.kind===b.dataset.filter)});
    })});
  }
  function applyHomeFilter(){}
  wireFilters('homeFilters','homeGrid');wireFilters('aboutFilters','aboutGrid');

  var pf='all',pd='all';
  function filterBtns(id,opts,cur,set){
    var box=document.getElementById(id);
    box.innerHTML=opts.map(function(o){return '<button class="filter" type="button" data-v="'+esc(o[0])+'" aria-pressed="'+(o[0]===cur)+'">'+esc(o[1])+'</button>'}).join('');
    [].forEach.call(box.querySelectorAll('.filter'),function(b){b.addEventListener('click',function(){set(b.dataset.v);renderPage()})});
  }
  function renderPage(){
    if(!document.getElementById('pageGrid'))return;
    var discs=[];SESSIONS.forEach(function(s){if(discs.indexOf(s.discipline)<0)discs.push(s.discipline)});
    filterBtns('pageFormat',[['all','All formats'],['workshop','Workshops'],['talk','Talks']],pf,function(v){pf=v});
    filterBtns('pageDisc',[['all','All disciplines']].concat(discs.map(function(d){return [d,d]})),pd,function(v){pd=v});
    var list=SESSIONS.slice().sort(byDate).filter(function(s){return (pf==='all'||s.format===pf)&&(pd==='all'||s.discipline===pd)});
    document.getElementById('pageGrid').innerHTML=list.map(card).join('');
    document.getElementById('pageEmpty').hidden=list.length>0;
    document.getElementById('resultCount').textContent=list.length+(list.length===1?' session':' sessions');
  }
  var rf=document.getElementById('resetFilters');if(rf)rf.addEventListener('click',function(){pf='all';pd='all';renderPage()});

  /* ===== Single workshop page ===== */
  var DEF={};
  var INC={
    mentor:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="15" r="6"/><path d="M6 40c1-9 5-14 11-14s10 5 11 14"/><path d="M29 8h13v10h-6l-4 4v-4h-3Z"/></svg>',
    tools:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38 30 18M26 14l8 8M34 6l8 8-6 6-8-8Z"/><path d="M38 38 18 18M12 10l-4 4 6 6 4-4Z"/></svg>',
    materials:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6 41 15v18L24 42 7 33V15Z"/><path d="M7 15l17 9 17-9M24 24v18"/></svg>',
    notes:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="6" width="28" height="36" rx="2"/><path d="M16 16h16M16 23h16M16 30h10"/><path d="M6 12h6M6 20h6M6 28h6M6 36h6"/></svg>',
    sound:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 28v-8M15 34V14M22 40V8M29 32V16M36 26v-4M42 25v-2"/></svg>',
    headphones:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="9" height="13" rx="2"/><rect x="33" y="28" width="9" height="13" rx="2"/></svg>',
    takehome:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 16h28l-3 26H13Z"/><path d="M18 20v-6a6 6 0 0 1 12 0v6"/></svg>',
    coffee:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18h26v12a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 30Z"/><path d="M34 22h3a5 5 0 0 1 0 10h-4M16 6c-2 3 2 5 0 8M24 6c-2 3 2 5 0 8"/></svg>',
    community:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="14" r="5"/><circle cx="10" cy="20" r="4"/><circle cx="38" cy="20" r="4"/><path d="M14 40c0-8 4-13 10-13s10 5 10 13M3 38c0-6 3-9 7-9M45 38c0-6-3-9-7-9"/></svg>',
    type:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 40 22 8h4l12 32M15 28h18"/><path d="M6 40h10M32 40h10"/></svg>',
    print:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="14" width="36" height="20" rx="2"/><path d="M14 14V6h20v8M14 28h20v14H14Z"/><path d="M8 20h6"/></svg>',
    idea:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 30a12 12 0 1 1 14 0c-2 2-3 4-3 6h-8c0-2-1-4-3-6ZM19 40h10M21 44h6"/></svg>',
    laptop:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="10" width="30" height="20" rx="2"/><path d="M4 36h40l-3 4H7Z"/></svg>',
    clock:'<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><path d="M24 14v10l7 5"/></svg>',
    phone:'<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="5" width="20" height="38" rx="3"/><path d="M21 37h6M8 8l32 32"/></svg>',
    quiet:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h8l10-8v26l-10-8H8Z"/><path d="M33 19l10 10M43 19 33 29"/></svg>',
    steps:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 38h10V28h10V18h10V8h6"/><path d="M36 8h6v6"/></svg>',
    calm:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 20c5-5 9-5 14 0s9 5 14 0 9-5 14 0M4 30c5-5 9-5 14 0s9 5 14 0 9-5 14 0"/></svg>'
  };
  function pick(s,k){return Array.isArray(s[k])?s[k]:(DEF[k]||[])}
  function bookHref(s){if(s.bookUrl)return s.bookUrl;return 'mailto:hello@hiveworx.com?subject='+encodeURIComponent((s.dateISO?'Booking: ':'Interest: ')+s.title)}
  function tile(){return '<div class="g-tile ph"><span class="ph-text">No image</span></div>'}
  /* thin outline hexagon, drawn at 1px whatever its size */
  function hexOutline(cls,speed){return '<svg class="sd-hex '+cls+' plx" data-speed="'+speed+'" viewBox="0 0 100 115" aria-hidden="true"><path d="M50 1 99 29v57L50 114 1 86V29Z" vector-effect="non-scaling-stroke"/></svg>'}
  function fact(icon,label,v){return v?'<li>'+icon+'<span><b>'+label+'</b>'+esc(v)+'</span></li>':''}
  function mentorRow(s){return '<div class="cls-mentor">'+ICON.person+'<span><b>'+esc(s.mentor.name)+'</b>'+esc(s.mentor.role)+'</span></div>'}
  function secHead(label,title){return '<div class="sd-sec-head"><p class="label">'+label+'</p>'+(title?'<h2>'+title+'</h2>':'')+'</div>'}
  function renderDetail(slug){
    var s=SESSIONS.filter(function(x){return x.slug===slug})[0], el=document.getElementById('detail');
    if(!el)return;
    if(!s){el.innerHTML='<section class="page-head"><div class="wrap notfound"><h1>We couldn’t find that session.</h1><p>It may have finished or moved. Browse the full program instead.</p><a class="btn btn-primary" href="'+href('workshops')+'">See all workshops <span class="arr">→</span></a></div></section>';document.getElementById('moreGrid').innerHTML='';return}
    document.title=sessionTitle(s);
    var tl=typeLabel(s), tll=tl.toLowerCase(), book=bookHref(s), cta=ctaLabel(s),
        inc=pick(s,'included'), gal=pick(s,'gallery'), qs=pick(s,'testimonials'),
        draft=qs.some(function(q){return q.placeholder}),
        explore=s.explore||[], outcome=s.outcome||[], bio=s.mentor.bio||[];
    var h=
    /* 1. title + hero */
    '<section class="sd-head"><div class="wrap">'+
      '<nav class="crumbs" aria-label="Breadcrumb"><a class="link" href="'+href('top')+'">Home</a><span aria-hidden="true">/</span><a class="link" href="'+href('workshops')+'">Workshops &amp; talks</a><span aria-hidden="true">/</span><span>'+tl+'</span></nav>'+
      '<div class="ws-tags"><span class="tag">'+esc(s.discipline)+'</span><span class="tag tag-ghost">'+esc(s.formatLabel)+'</span>'+(s.series?'<span class="tag tag-ghost">Part '+s.series.part+' of '+s.series.of+'</span>':'')+'</div>'+
      '<h1 class="sd-title">'+esc(s.title)+'</h1>'+
      '<div class="sd-by">'+mentorRow(s)+'</div>'+
      '<div class="sd-hero"><div class="sd-frame">'+media(s)+'</div>'+hexOutline('sd-hex-a',.08)+hexOutline('sd-hex-b',-.06)+hexOutline('sd-hex-c',.12)+'</div>'+seriesStrip(s)+
    '</div></section>'+
    /* 2. main area: tabbed content on the left, sticky details card on the right.
       The card sticks while this section scrolls and stops where "Good to know" begins. */
    '<section class="sd-main"><div class="wrap sd-main-grid">'+
      '<div class="sd-main-col">'+
        (bio.length?'<div class="tabs sd-tabs" role="tablist" aria-label="Workshop information">'+
          '<button class="tab" role="tab" id="sdt-details" aria-controls="sdp-details" aria-selected="true">'+tl+' details</button>'+
          '<button class="tab" role="tab" id="sdt-mentor" aria-controls="sdp-mentor" aria-selected="false" tabindex="-1">About the mentor</button></div>':'')+
        '<div class="sd-panel-tab" role="tabpanel" id="sdp-details" aria-labelledby="sdt-details">'+
          '<div class="sd-block"><p class="label">About this '+tll+'</p>'+
            '<p class="sd-sec-body">'+esc(s.summary||s.about[0])+'</p>'+
            (s.summary?s.about:s.about.slice(1)).map(function(p){return '<p class="sd-sec-body">'+esc(p)+'</p>'}).join('')+'</div>'+
          (s.forWho?'<div class="sd-block"><p class="label">Who it’s for</p><p class="sd-sec-body">'+esc(s.forWho)+'</p>'+(s.levelNote?'<p class="sd-sec-body">'+esc(s.levelNote)+'</p>':'')+'</div>':'')+
          (explore.length?'<div class="sd-block"><p class="label">What you’ll explore</p>'+
            '<ol class="sd-explore">'+explore.map(function(e,i){return '<li><details name="explore"><summary><span class="sd-ex-n">'+(i<9?'0':'')+(i+1)+'</span><h3>'+esc(e.title)+'</h3></summary><p>'+esc(e.text)+'</p></details></li>'}).join('')+'</ol>'+
            (outcome.length?'<div class="sd-outcome"><p class="label">End of day outcome</p>'+outcome.map(function(p,i){return '<p class="sd-sec-body">'+esc(p)+'</p>'}).join('')+'</div>':'')+'</div>':'')+
        '</div>'+
        (bio.length?'<div class="sd-panel-tab" role="tabpanel" id="sdp-mentor" aria-labelledby="sdt-mentor" hidden>'+
          '<div class="sd-block"><p class="label">About the mentor</p><h2 class="sd-mentor-name">'+esc(s.mentor.name)+'</h2>'+
          bio.map(function(p,i){return '<p class="sd-sec-body">'+esc(p)+'</p>'}).join('')+'</div></div>':'')+
        /* closing note: the last thing in the column, so the sticky card stops level with it */
        '<p class="hand sd-end-note">'+esc(s.includedNote||DEF.includedNote||'just bring curiosity')+'</p>'+
      '</div>'+
      '<aside class="sd-card" aria-label="'+tl+' details">'+
        '<div class="sd-card-price"><span class="sd-card-k">Price</span><b>'+esc(s.price)+'</b>'+(s.priceNote?'<span>'+esc(s.priceNote)+'</span>':'')+'</div>'+
        '<ul class="sd-card-facts">'+
          fact(ICON.date,'Date',s.date)+fact(ICON.time,'Start time',s.time)+fact(ICON.loc,'Location',s.location)+
          fact(ICON.fmt,'Format',s.formatLabel)+fact(ICON.level,'Level',s.level)+fact(ICON.duration,'Duration',s.duration)+
        '</ul>'+
        '<a class="btn btn-light sd-card-cta" href="'+book+'"'+(s.bookUrl?' target="_blank" rel="noopener"':'')+'>Register for the '+tll+' <span class="arr">→</span></a>'+
      '</aside>'+
    '</div></section>'+
    /* 3. good to know / what's included */
    (inc.length?'<section class="sd-inc-wrap"><div class="wrap"><div class="sd-inc"><div><p class="label">'+(s.includedLabel||DEF.includedLabel||'The practical bit')+'</p><h2>'+(s.includedTitle||DEF.includedTitle||'What’s <span class="v">included</span>')+'</h2>'+
      '</div>'+
      '<ul class="sd-inc-grid">'+inc.map(function(it){return '<li>'+(INC[it.icon]||INC.idea)+'<span>'+esc(it.text)+'</span></li>'}).join('')+'</ul></div></div></section>':'')+
    /* 4. gallery */
    (gal.length?'<div class="marquee sd-marquee" aria-hidden="true"><div class="marquee-track">'+
      Array(12).join('<span>From the studio</span><span>Gallery</span>')+'</div></div>'+
      '<section class="sd-gal wrap" aria-label="Gallery"><div class="sd-gal-head"><p class="label">Gallery</p><h2>Moments from <span class="v">the studio</span></h2>'+
        '<p>What a Hiveworx session looks like: people, tools, mess, and the things they make.</p>'+
        '<a class="btn btn-ghost" href="'+href('workshops')+'">Back to all workshops <span class="arr">→</span></a></div>'+
      '<div class="sd-photos">'+gal.map(tile).join('')+'</div></section>':'')+
    /* 5. testimonials */
    (qs.length?'<section class="sd-voices"><div class="wrap"><div class="sec-head"><div><div class="letter-head"><p class="label">In their words</p>'+(draft?'<span class="draft">placeholder quotes</span>':'')+'</div>'+
      '<h2>Hear what participants <span class="v">have to say</span></h2></div></div>'+
      '<div class="sd-quotes">'+qs.map(function(q){return '<figure class="sd-quote"><div class="sd-rate" aria-label="Rated 5 out of 5"><i></i><i></i><i></i><i></i><i></i></div>'+
        '<blockquote>'+esc(q.quote)+'</blockquote><figcaption><span class="av" aria-hidden="true">'+esc(q.initials)+'</span><span><b>'+esc(q.name)+'</b>'+esc(q.role)+'</span></figcaption></figure>'}).join('')+
      '</div></div></section>':'')+
    '';
    el.innerHTML=h;
    bindTiles(el);
    parallax();
    var more=SESSIONS.filter(function(x){return x.slug!==slug}).sort(byDate).slice(0,3);
    document.getElementById('moreGrid').innerHTML=more.map(card).join('');
  }

  document.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('.sd-tabs [role=tab]');if(!t)return;
    t.parentNode.querySelectorAll('[role=tab]').forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!on});
  });
  document.addEventListener('keydown',function(e){
    var t=e.target.closest&&e.target.closest('.sd-tabs [role=tab]');if(!t||(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'))return;
    var all=[].slice.call(t.parentNode.querySelectorAll('[role=tab]')),n=all[(all.indexOf(t)+(e.key==='ArrowRight'?1:all.length-1))%all.length];
    e.preventDefault();n.click();n.focus();
  });

  /* slight scroll parallax for elements marked .plx (data-speed: fraction of scroll) */
  var plxOn=false;
  function parallax(){
    if(plxOn||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
    plxOn=true;var ticking=false;
    function run(){ticking=false;var mid=innerHeight/2;
      document.querySelectorAll('.plx').forEach(function(e){if(!e.getClientRects().length)return;var r=e.getBoundingClientRect();
        e.style.transform='translate3d(0,'+(((r.top+r.height/2)-mid)*(+e.dataset.speed||0)*-1).toFixed(1)+'px,0)'})}
    addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(run)}},{passive:true});
    addEventListener('resize',run);run();
  }

  /* Mentors page: one card per mentor, collected from the workshops they lead */
  function renderMentors(){
    var list=[],seen={};
    /* mentors listed on their own come first (e.g. the founder), then everyone leading a session */
    MENTORS.forEach(function(m){if(m&&m.name&&!seen[m.name]){seen[m.name]={m:m,sessions:[]};list.push(seen[m.name])}});
    SESSIONS.slice().sort(byDate).forEach(function(s){
      var m=s.mentor;if(!m||!m.name||m.listed===false)return;
      if(!seen[m.name]){seen[m.name]={m:m,sessions:[]};list.push(seen[m.name])}
      seen[m.name].sessions.push(s);
    });
    /* an explicit order from sessions.json wins; everyone else keeps the order above */
    var ord=MENTOR_ORDER;list.sort(function(a,b){var i=ord.indexOf(a.m.name),k=ord.indexOf(b.m.name);return (i<0?99:i)-(k<0?99:k)});
    var grid=document.getElementById('mentorGrid');if(!grid)return;
    grid.innerHTML=list.map(function(x){
      var m=x.m,photo=m.photo?'<img class="mt-img" loading="lazy" src="'+esc(asset(m.photo))+'" alt="Portrait of '+esc(m.name)+'">':'<div class="ph mt-ph"><span class="ph-text">No image</span></div>';
      return '<article class="mt-card"><div class="mt-photo">'+photo+'</div><div class="mt-body">'+
        '<h3>'+esc(m.name)+'</h3><p class="mt-role">'+esc(m.role)+'</p>'+
        (m.short?'<p class="mt-text">'+esc(m.short)+'</p>':'')+
        
        '</div></article>';
    }).join('');
  }

  var V={about:document.getElementById('view-about'),home:document.getElementById('view-home'),workshops:document.getElementById('view-workshops'),mentors:document.getElementById('view-mentors'),detail:document.getElementById('view-detail')};
  /* on the published site each page holds only its own view, so the others are missing */
  function show(which){Object.keys(V).forEach(function(k){if(V[k])V[k].hidden=k!==which})}
  /* page switches jump to the top; in-page links glide (with smooth scrolling on) */
  function toTop(){if(window.lenis)lenis.scrollTo(0,{immediate:true,force:true});else window.scrollTo(0,0)}
  /* glide to a section on the same page; when arriving from another page, re-measure the
     (now taller) home page first and jump straight there, so the smooth-scroll library
     does not stop at the previous page height or sweep through every section on the way */
  function toEl(t,jump){
    if(!window.lenis){t.scrollIntoView();return}
    lenis.resize();
    lenis.scrollTo(t,{offset:-72,immediate:!!jump,force:true});
  }
  function route(){
    var h=(location.hash||'').slice(1),first=!routed;routed=true;
    if(HIDDEN.indexOf(h)>=0)h='';   /* a hidden page opens the home page instead */
    if(BASE!==null){
      if(PAGE==='404')return;
      /* old one-page links (hiveworx.com/#w-…) move to the page's own address */
      if(PAGE==='home'&&(PATHS[h]||h.indexOf('w-')===0)){location.replace(href(h));return}
      if(PAGE!=='home'){
        /* this page's view is already in place: fill it in, but only jump to the top on arrival */
        var t0=h&&document.getElementById(h);
        if(PAGE==='about-us'){runCounters()}
        else if(PAGE==='mentors'){renderMentors()}
        else if(PAGE==='workshops'){renderPage()}
        else if(PAGE.indexOf('w-')===0){renderDetail(PAGE.slice(2))}
        if(t0)toEl(t0,first);
        return;
      }
    }
    if(h==='about-us'){show('about');document.title=TITLES['about-us'];toTop();runCounters();return}
    if(h==='mentors'){show('mentors');document.title=TITLES.mentors;renderMentors();toTop();return}
    if(h==='workshops'){show('workshops');document.title=TITLES.workshops;renderPage();toTop();return}
    if(h.indexOf('w-')===0){show('detail');renderDetail(h.slice(2));toTop();return}
    var fromOther=!V.home||V.home.hidden||first;
    show('home');document.title=TITLES.home;
    var t=h&&document.getElementById(h);
    if(t&&h!=='top'){toEl(t,fromOther)}else{toTop()}
  }
  var routed=false;
  window.addEventListener('hashchange',route);
  /* in-page links (#contact, #mentors, #w-…): the site does the scrolling itself. Without this
     the browser also jumps to the anchor on its own, fighting the smooth scroll and landing
     the section under the sticky menu or at a different spot each time. */
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
    var href=a.getAttribute('href');if(href.length<2)return;
    e.preventDefault();
    if(location.hash!==href)history.pushState(null,'',href);
    route();
  });
  /* counters: final values sit in the HTML; animate from 0 once visible */
  var counted=false;
  function runCounters(){
    if(counted||!document.querySelector('.stats'))return;var els=[].slice.call(document.querySelectorAll('.count'));
    if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(!('IntersectionObserver' in window))return;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;io.disconnect();counted=true;
      els.forEach(function(el){var to=+el.dataset.to,t0=null;
        function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/1400),v=1-Math.pow(1-p,3);el.textContent=Math.round(to*v).toLocaleString('en');if(p<1)requestAnimationFrame(step)}
        el.textContent='0';requestAnimationFrame(step)});
    })},{threshold:.4});
    io.observe(document.querySelector('.stats'));
  }
  /* gallery lightbox: works for any group of .g-tile buttons */
  var tiles=[],lb=document.getElementById('lightbox'),lbI=document.getElementById('lbImg'),lbC=document.getElementById('lbCap'),cur=0;
  function openLB(i){cur=(i+tiles.length)%tiles.length;var im=tiles[cur].querySelector('img');lbI.src=im.src;lbI.alt=im.alt;lbC.textContent=im.alt;if(!lb.open){try{lb.showModal()}catch(e){lb.setAttribute('open','')}}}
  function bindTiles(root){
    if(!root)return;
    var group=[].slice.call(root.querySelectorAll('.g-tile'));
    group.forEach(function(t,i){t.addEventListener('click',function(){tiles=group;openLB(i)})});
  }
  bindTiles(document.getElementById('gallery'));
  document.getElementById('lbPrev').addEventListener('click',function(){openLB(cur-1)});
  document.getElementById('lbNext').addEventListener('click',function(){openLB(cur+1)});
  document.getElementById('lbClose').addEventListener('click',function(){lb.close?lb.close():lb.removeAttribute('open')});
  lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight')openLB(cur+1);if(e.key==='ArrowLeft')openLB(cur-1)});

  /* no-cache: always check for a newer sessions.json, so edited dates and links show at once */
  fetch(asset('sessions.json'),{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
    SESSIONS=d.sessions||[];MENTORS=d.mentors||[];MENTOR_ORDER=d.mentorOrder||[];HIDDEN=d.hiddenPages||[];DEF=d.defaults||{};renderFeatured();renderHomeGrid();route();
  }).catch(function(){
    var f=document.getElementById('featured');if(f)f.innerHTML='<p class="empty">Workshops couldn’t load. Refresh the page to try again.</p>';route();
  });
  var btn=document.getElementById('copyBtn'),msg=document.getElementById('copyMsg'),email='hello@hiveworx.com';
  if(btn)btn.addEventListener('click',function(){
    function fallback(){var r=document.createRange();r.selectNodeContents(document.getElementById('email'));var s=getSelection();s.removeAllRanges();s.addRange(r);msg.textContent='Address selected. Press Ctrl/Cmd+C to copy.'}
    try{navigator.clipboard.writeText(email).then(function(){msg.textContent='Copied hello@hiveworx.com'},fallback)}catch(e){fallback()}
  });

  /* ===== Contact form =====
     Messages go through Formspree (form "Hiveworx website"), which emails them to the inbox set there;
     the visitor's address becomes the reply-to. Clear FORM_ENDPOINT to fall back to opening the
     visitor's email app instead. */
  var FORM_ENDPOINT='https://formspree.io/f/xeaonrwb';
  var form=document.getElementById('contactForm');
  if(form){
    var F={name:form.elements.name,email:form.elements.email,who:form.elements.who,topic:form.elements.topic,message:form.elements.message},
        status=document.getElementById('ct-status'),count=document.getElementById('ct-count');
    var RULES={
      name:function(v){return v?'':'Please tell us your name.'},
      email:function(v){return !v?'Please add your email so we can reply.':/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?'':'That email doesn’t look right. Check for typos.'},
      who:function(v){return v?'':'Please choose who you are.'},
      topic:function(v){return v?'':'Add a short topic.'},
      message:function(v){return v?'':'Write your message.'}
    };
    function check(k){
      var el=F[k],err=RULES[k](el.value.trim()),box=document.getElementById(el.id+'-err');
      box.textContent=err;
      if(err){el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',box.id)}else{el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby')}
      return !err;
    }
    Object.keys(F).forEach(function(k){
      F[k].addEventListener('blur',function(){if(F[k].value.trim()||F[k].hasAttribute('aria-invalid'))check(k)});
      F[k].addEventListener('input',function(){if(F[k].hasAttribute('aria-invalid'))check(k)});
    });
    F.who.addEventListener('change',function(){check('who')});
    F.message.addEventListener('input',function(){count.textContent=F.message.value.length+' / 2000'});

    /* buttons like "Become a mentor" or "Partner with us" pre-select who you are */
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[data-who]');
      if(a){F.who.value=a.dataset.who;check('who')}
    });

    form.addEventListener('submit',function(e){
      e.preventDefault();
      status.textContent='';status.classList.remove('is-error');
      var ok=true,first=null;
      Object.keys(F).forEach(function(k){if(!check(k)){ok=false;first=first||F[k]}});
      if(!ok){first.focus();return}
      var d={name:F.name.value.trim(),email:F.email.value.trim(),who:F.who.value,topic:F.topic.value.trim(),message:F.message.value.trim()};
      if(FORM_ENDPOINT){
        var btn=form.querySelector('[type=submit]');btn.disabled=true;
        var payload={name:d.name,email:d.email,'I am a':d.who,topic:d.topic,message:d.message,
          _subject:'['+d.who+'] '+d.topic+' · Hiveworx website',_gotcha:form.elements._gotcha?form.elements._gotcha.value:''};
        fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)})
          .then(function(r){if(!r.ok)throw 0;form.reset();count.textContent='0 / 2000';status.textContent='Thanks, '+d.name+'. Your message was sent. We’ll reply to '+d.email+'.'})
          .catch(function(){status.classList.add('is-error');status.textContent='Your message couldn’t be sent. Try again, or email hello@hiveworx.com.'})
          .then(function(){btn.disabled=false});
        return;
      }
      var body='Name: '+d.name+'\nEmail: '+d.email+'\nI am a: '+d.who+'\n\n'+d.message;
      location.href='mailto:hello@hiveworx.com?subject='+encodeURIComponent('['+d.who+'] '+d.topic)+'&body='+encodeURIComponent(body);
      status.textContent='Your email app should open with the message ready to send. If nothing happened, email us at hello@hiveworx.com.';
    });
  }
})();
