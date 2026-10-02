/* Hiveworx: behaviour shared by every page. The pages themselves are built by Astro; this only adds
   the menu, tabs, filters, counters, smooth section scrolling and the contact form. */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Menu ===== */
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

  /* ===== Tabs (home "Get involved", session pages) ===== */
  function wireTabs(list){
    var tabs=[].slice.call(list.querySelectorAll('[role=tab]'));
    function select(t,focus){
      tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;var p=document.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on});
      if(focus)t.focus({preventScroll:true});
      /* phones: the tab row scrolls sideways; bring the chosen tab to the middle */
      if(list.scrollWidth>list.clientWidth)list.scrollTo({left:t.offsetLeft-(list.clientWidth-t.offsetWidth)/2,behavior:'smooth'});
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){select(t)});
      t.addEventListener('keydown',function(e){
        var k=e.key,n=null;
        if(k==='ArrowRight')n=tabs[(i+1)%tabs.length];
        if(k==='ArrowLeft')n=tabs[(i-1+tabs.length)%tabs.length];
        if(k==='Home')n=tabs[0];if(k==='End')n=tabs[tabs.length-1];
        if(n){e.preventDefault();select(n,true)}
      });
    });
  }
  document.querySelectorAll('[role=tablist]').forEach(wireTabs);

  /* ===== Filters ===== */
  /* home / About: All · Workshops · Talks on the three cards below */
  document.querySelectorAll('[data-card-filter]').forEach(function(box){
    var btns=[].slice.call(box.querySelectorAll('.filter')),grid=box.parentNode.querySelector('.cls-grid');
    btns.forEach(function(b){b.addEventListener('click',function(){
      btns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
      [].forEach.call(grid.querySelectorAll('.cls'),function(c){c.hidden=!(b.dataset.filter==='all'||c.dataset.kind===b.dataset.filter)});
    })});
  });
  /* Workshops & talks page: format × discipline, with a count and an empty message */
  var bar=document.getElementById('pageFilters');
  if(bar){
    var groups=[].slice.call(bar.querySelectorAll('[data-group]')),cards=[].slice.call(document.querySelectorAll('#pageGrid .cls'));
    var cnt=document.getElementById('resultCount'),empty=document.getElementById('pageEmpty');
    function apply(){
      var want={};groups.forEach(function(g){var on=g.querySelector('[aria-pressed="true"]');want[g.dataset.group]=on?on.dataset.v:'all'});
      var n=0;cards.forEach(function(c){var ok=Object.keys(want).every(function(k){return want[k]==='all'||c.dataset[k]===want[k]});c.hidden=!ok;if(ok)n++});
      cnt.textContent=n+(n===1?' session':' sessions');empty.hidden=n>0;
    }
    groups.forEach(function(g){var btns=[].slice.call(g.querySelectorAll('.filter'));btns.forEach(function(b){b.addEventListener('click',function(){btns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});apply()})})});
    document.getElementById('resetFilters').addEventListener('click',function(){groups.forEach(function(g){g.querySelectorAll('.filter').forEach(function(x,i){x.setAttribute('aria-pressed',i===0)})});apply()});
  }

  /* ===== Scroll effects ===== */
  /* slight parallax for elements marked .plx (data-speed: fraction of scroll) */
  if(!reduce&&document.querySelector('.plx')){
    var ticking=false;
    function run(){ticking=false;var mid=innerHeight/2;
      document.querySelectorAll('.plx').forEach(function(e){if(!e.getClientRects().length)return;var r=e.getBoundingClientRect();
        e.style.transform='translate3d(0,'+(((r.top+r.height/2)-mid)*(+e.dataset.speed||0)*-1).toFixed(1)+'px,0)'})}
    addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(run)}},{passive:true});
    addEventListener('resize',run);run();
  }
  /* counters: final values sit in the HTML; count up from 0 once visible */
  var stats=document.querySelector('.stats');
  if(stats&&!reduce&&'IntersectionObserver' in window){
    var els=[].slice.call(stats.querySelectorAll('.count'));
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;io.disconnect();
      els.forEach(function(el){var to=+el.dataset.to,t0=null;
        function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/1400),v=1-Math.pow(1-p,3);el.textContent=Math.round(to*v).toLocaleString('en');if(p<1)requestAnimationFrame(step)}
        el.textContent='0';requestAnimationFrame(step)});
    })},{threshold:.4});
    io.observe(stats);
  }

  /* ===== Sections: /#contact, /#join… =====
     Same-page links glide to the section (just under the sticky menu); arriving from another page
     jumps straight there once the page has its full height. */
  function target(hash){try{return hash&&hash.length>1&&document.querySelector(hash)}catch(e){return null}}
  function toEl(el,jump){
    if(window.lenis){lenis.resize();lenis.scrollTo(el,{offset:-72,immediate:!!jump,force:true})}
    else el.scrollIntoView({behavior:jump||reduce?'auto':'smooth'});
  }
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href*="#"]');if(!a)return;
    var u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname!==location.pathname)return;
    var el=target(u.hash);if(!el)return;
    e.preventDefault();if(location.hash!==u.hash)history.pushState(null,'',u.hash);toEl(el,false);
  });
  window.addEventListener('load',function(){var el=target(location.hash);if(el)setTimeout(function(){toEl(el,true)},60)});

  /* ===== Gallery lightbox (any group of .g-tile buttons) ===== */
  var lb=document.getElementById('lightbox');
  if(lb){
    var tiles=[],cur=0,lbI=document.getElementById('lbImg'),lbC=document.getElementById('lbCap');
    function openLB(i){cur=(i+tiles.length)%tiles.length;var im=tiles[cur].querySelector('img');if(!im)return;lbI.src=im.src;lbI.alt=im.alt;lbC.textContent=im.alt;if(!lb.open){try{lb.showModal()}catch(e){lb.setAttribute('open','')}}}
    var group=[].slice.call(document.querySelectorAll('.g-tile'));
    group.forEach(function(t,i){t.addEventListener('click',function(){tiles=group;openLB(i)})});
    document.getElementById('lbPrev').addEventListener('click',function(){openLB(cur-1)});
    document.getElementById('lbNext').addEventListener('click',function(){openLB(cur+1)});
    document.getElementById('lbClose').addEventListener('click',function(){lb.close?lb.close():lb.removeAttribute('open')});
    lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight')openLB(cur+1);if(e.key==='ArrowLeft')openLB(cur-1)});
  }

  /* ===== Cookie consent + Google Analytics (set up in src/components/Analytics.astro) ===== */
  function choice(){try{return localStorage.getItem('hx-consent')}catch(e){return null}}
  var cc=document.getElementById('cookieBanner');
  function consent(v){
    try{localStorage.setItem('hx-consent',v)}catch(e){}
    if(window.gtag)gtag('consent','update',{analytics_storage:v});
    if(v==='granted'&&window.hxLoadGA)hxLoadGA();
    if(v==='denied'){
      /* changed their mind: remove the analytics cookies already set */
      document.cookie.split(';').forEach(function(c){
        var n=c.split('=')[0].trim();if(!/^_ga/.test(n))return;
        var host=location.hostname,base=host.replace(/^www\./,'');
        ['','; domain='+host,'; domain=.'+base].forEach(function(d){document.cookie=n+'=; Max-Age=0; path=/'+d});
      });
    }
    if(cc)cc.hidden=true;
  }
  if(cc){
    if(!choice())cc.hidden=false;
    cc.addEventListener('click',function(e){var b=e.target.closest('[data-consent]');if(b)consent(b.dataset.consent)});
  }
  /* "Cookie settings" (footer, privacy page) reopens the banner */
  document.querySelectorAll('#cookieSettings,[data-cookie-settings]').forEach(function(b){if(cc)b.addEventListener('click',function(){cc.hidden=false;cc.querySelector('[data-consent="granted"]').focus()})});

  /* events (sent only after Accept): booking clicks and contact messages */
  function track(name,params){if(choice()==='granted'&&window.gtag)gtag('event',name,params||{})}
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');if(!a||!/luma\.com/.test(a.getAttribute('href')))return;
    var card=a.closest('.cls'),title=card?card.querySelector('h3'):document.querySelector('.sd-title');
    track('book_click',{session:title?title.textContent.trim():'',link_location:card?'card':'session_page'});
  });

  /* ===== Contact ===== */
  var btn=document.getElementById('copyBtn'),msg=document.getElementById('copyMsg'),email='hello@hiveworx.com';
  if(btn)btn.addEventListener('click',function(){
    function fallback(){var r=document.createRange();r.selectNodeContents(document.getElementById('email'));var s=getSelection();s.removeAllRanges();s.addRange(r);msg.textContent='Address selected. Press Ctrl/Cmd+C to copy.'}
    try{navigator.clipboard.writeText(email).then(function(){msg.textContent='Copied hello@hiveworx.com'},fallback)}catch(e){fallback()}
  });

  /* buttons like "Become a mentor" or "Partner with us" pre-select who you are, also from other pages */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[data-who]');if(!a)return;
    try{sessionStorage.setItem('hx-who',a.dataset.who)}catch(err){}
    if(window.hxWho)window.hxWho(a.dataset.who);
  });

  /* Messages go through Formspree (form "Hiveworx website"), which emails them to hello@hiveworx.com;
     the visitor's address becomes the reply-to. Clear FORM_ENDPOINT to open the visitor's email app instead. */
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
    window.hxWho=function(v){F.who.value=v;check('who')};
    try{var w=sessionStorage.getItem('hx-who');if(w){sessionStorage.removeItem('hx-who');F.who.value=w}}catch(err){}

    form.addEventListener('submit',function(e){
      e.preventDefault();
      status.textContent='';status.classList.remove('is-error');
      var ok=true,first=null;
      Object.keys(F).forEach(function(k){if(!check(k)){ok=false;first=first||F[k]}});
      if(!ok){first.focus();return}
      var d={name:F.name.value.trim(),email:F.email.value.trim(),who:F.who.value,topic:F.topic.value.trim(),message:F.message.value.trim()};
      if(FORM_ENDPOINT){
        var sb=form.querySelector('[type=submit]');sb.disabled=true;
        var payload={name:d.name,email:d.email,'I am a':d.who,topic:d.topic,message:d.message,
          _subject:'['+d.who+'] '+d.topic+' · Hiveworx website',_gotcha:form.elements._gotcha?form.elements._gotcha.value:''};
        fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)})
          .then(function(r){if(!r.ok)throw 0;track('generate_lead',{who:d.who});form.reset();count.textContent='0 / 2000';status.textContent='Thanks, '+d.name+'. Your message was sent. We’ll reply to '+d.email+'.'})
          .catch(function(){status.classList.add('is-error');status.textContent='Your message couldn’t be sent. Try again, or email hello@hiveworx.com.'})
          .then(function(){sb.disabled=false});
        return;
      }
      var body='Name: '+d.name+'\nEmail: '+d.email+'\nI am a: '+d.who+'\n\n'+d.message;
      location.href='mailto:hello@hiveworx.com?subject='+encodeURIComponent('['+d.who+'] '+d.topic)+'&body='+encodeURIComponent(body);
      status.textContent='Your email app should open with the message ready to send. If nothing happened, email us at hello@hiveworx.com.';
    });
  }
})();
