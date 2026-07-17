var clock = document.getElementById('clock');
var fmt = new Intl.DateTimeFormat('en-US', {
  timeZone:'America/Chicago', hour12:false,
  hour:'2-digit', minute:'2-digit', second:'2-digit'
});
function tick(){ clock.textContent = fmt.format(new Date()); }
tick();
setInterval(tick, 1000);

var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* theme toggle */
(function(){
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var h = document.documentElement;
  function paint(){
    var dark = h.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? 'Light' : 'Dark';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }
  paint();
  btn.addEventListener('click', function(){
    var next = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    h.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch(e){}
    paint();
  });
})();

/* text scramble */
(function(){
  if (reduced) return;
  var pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>=/?!#&';

  function scramble(el){
    if (el.dataset.busy) return;
    var orig = el.dataset.orig || (el.dataset.orig = el.textContent);
    el.dataset.busy = '1';
    var i = 0, len = orig.length;
    var iv = setInterval(function(){
      var s = '';
      for (var j = 0; j < len; j++){
        s += j < i ? orig[j] : (orig[j] === ' ' ? ' ' : pool[Math.floor(Math.random() * pool.length)]);
      }
      el.textContent = s;
      i += Math.ceil(len / 12);
      if (i > len){
        el.textContent = orig;
        delete el.dataset.busy;
        clearInterval(iv);
      }
    }, 30);
  }

  var targets = document.querySelectorAll('nav a, footer .fine');
  targets.forEach(function(el){
    el.addEventListener('mouseenter', function(){ scramble(el); });
  });

  window.addEventListener('load', function(){
    targets.forEach(function(el, k){
      setTimeout(function(){ scramble(el); }, k * 90);
    });
  });
})();

/* index row blink on click (links only) */
document.querySelectorAll('.linelist a.line').forEach(function(row){
  row.addEventListener('click', function(){
    if (reduced) return;
    row.classList.add('active');
    setTimeout(function(){ row.classList.remove('active'); }, 700);
  });
});
