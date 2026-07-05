var clock = document.getElementById('clock');
var fmt = new Intl.DateTimeFormat('en-US', {
  timeZone:'America/Chicago', hour12:false,
  hour:'2-digit', minute:'2-digit', second:'2-digit'
});
function tick(){ clock.textContent = fmt.format(new Date()); }
tick();
setInterval(tick, 1000);

var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ascii art (homepage hero only) */
(function(){
  var pre = document.getElementById('ascii');
  if (!pre) return;
  var box = pre.parentElement;
  var ramp = ' .:;!/>=+?I73JAON08&#@';
  var cols, rows, cw = 6, ch = 11, nameField = null;
  var mouse = { x:-1e4, y:-1e4 };
  var running = true;
  var t0 = null;
  var NAME_IN = 1.4, NAME_HOLD = 3.6, NAME_OUT = 5.2, CYCLE = 18;

  function hash(x, y){
    var h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return h - Math.floor(h);
  }

  function noise(x, y){
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi), b = hash(xi + 1, yi);
    var c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm(x, y, t){
    return noise(x + t, y) * .55 + noise(x * 2.3 - t, y * 2.3) * .3 + noise(x * 5 + t * 2, y * 5) * .15;
  }

  function size(){
    var probe = document.createElement('span');
    probe.textContent = '0000000000';
    probe.style.cssText = 'position:absolute;visibility:hidden;font:10px/11px "Space Mono",monospace';
    document.body.appendChild(probe);
    cw = probe.getBoundingClientRect().width / 10 || 6;
    document.body.removeChild(probe);
    cols = Math.max(40, Math.floor(box.clientWidth / cw));
    rows = Math.max(20, Math.floor(box.clientHeight / ch));
    makeName();
  }

  function makeName(){
    var W = Math.max(1, Math.round(cols * cw)), H = Math.max(1, Math.round(rows * ch));
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var fs = Math.min(H * .3, W / 7.5);
    ctx.font = '700 ' + fs + 'px Helvetica, Arial, sans-serif';
    ctx.fillText('ISAIAH', W / 2, H * .34);
    ctx.fillText('BUCHBERGER', W / 2, H * .66);
    var d = ctx.getImageData(0, 0, W, H).data;
    nameField = new Float32Array(cols * rows);
    for (var r = 0; r < rows; r++){
      for (var c = 0; c < cols; c++){
        var px = Math.min(W - 1, Math.floor((c + .5) * cw));
        var py = Math.min(H - 1, Math.floor((r + .5) * ch));
        nameField[r * cols + c] = d[(py * W + px) * 4] / 255;
      }
    }
  }

  function frame(now){
    if (t0 === null) t0 = now;
    var t = now / 1000;
    var e = (now - t0) / 1000;
    var out = [];
    var rect = pre.getBoundingClientRect();

    var namePhase = e < NAME_OUT && nameField;
    var nameIn = Math.min(1, e / NAME_IN);
    var nameOut = e < NAME_HOLD ? 0 : Math.min(1, (e - NAME_HOLD) / (NAME_OUT - NAME_HOLD));

    var thr;
    if (e >= NAME_OUT){
      var cyc = (((e - NAME_OUT) / CYCLE) + .3) % 1;
      thr = cyc < .3 ? 1 - cyc / .3 : cyc > .72 ? (cyc - .72) / .28 : 0;
    } else {
      thr = 1 - nameOut;
    }

    for (var r = 0; r < rows; r++){
      var line = '';
      var y = r / rows;
      for (var c = 0; c < cols; c++){
        var x = c / cols * 2 - 1;
        var ridge = .12 + .72 * Math.exp(-x * x * 2.4) + .12 * noise(x * 3 + 40, t * .07);
        var b = 0;
        if (y > 1 - ridge){
          var depth = (y - (1 - ridge)) / ridge;
          b = depth * (.35 + .65 * fbm(x * 3.5, y * 3.5, t * .05));
        } else if (hash(c, r) > .997){
          b = .18;
        }
        if (hash(c * 7, r * 13) < thr) b = 0;

        if (namePhase){
          var f = nameField[r * cols + c];
          if (f > .35){
            var nb = .55 + .45 * f;
            if (hash(c * 3, r * 5) > nameIn) nb = 0;
            if (hash(c * 11, r * 3) < nameOut) nb = 0;
            if (nb > b) b = nb;
          }
        }

        var mx = rect.left + c * cw, my = rect.top + r * ch;
        var dx = mx - mouse.x, dy = my - mouse.y;
        if (dx * dx + dy * dy < 4900) b = 0;
        line += ramp[Math.min(ramp.length - 1, Math.floor(b * ramp.length))];
      }
      out.push(line);
    }
    pre.textContent = out.join('\n');
  }

  size();
  window.addEventListener('resize', size);
  window.addEventListener('load', size);
  document.addEventListener('mousemove', function(e){ mouse.x = e.clientX; mouse.y = e.clientY; });

  if (reduced){
    t0 = 0;
    frame((NAME_OUT + CYCLE * .2) * 1000);
    return;
  }

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(en){ running = en[0].isIntersecting; }).observe(box);
  }

  setInterval(function(){ if (running) frame(performance.now()); }, 80);
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

/* index row blink on click */
document.querySelectorAll('.linelist .line').forEach(function(row){
  row.addEventListener('click', function(){
    if (reduced) return;
    row.classList.add('active');
    setTimeout(function(){ row.classList.remove('active'); }, 700);
  });
});
