/* Low-poly bookshelf hero with painted canvas textures. three.js is loaded via
   dynamic import so a CDN failure or missing WebGL hides the hero instead of
   leaving a blank hole. */
(function(){
  var box = document.querySelector('.shelf');
  var canvas = document.getElementById('shelf-canvas');
  if (!box || !canvas) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* no CDN / no WebGL: collapse the scene so the title and page flow remain */
  function hideScene(){
    box.style.display = 'none';
    var st = document.querySelector('.study');
    if (st){ st.style.height = 'auto'; st.style.minHeight = '0'; }
    ['.study-hint', '.study-cue'].forEach(function(sel){
      var el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    });
  }

  import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js')
    .then(start)
    .catch(hideScene);

  function start(THREE){
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch(e){ hideScene(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    /* ---------- painted textures ---------- */

    function texture(w, h, draw){
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      draw(cv.getContext('2d'), w, h);
      var t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    }

    function grain(ctx, w, h, amt){
      for (var i = 0; i < w * h * amt / 40; i++){
        var l = Math.random() > .5;
        ctx.fillStyle = l ? 'rgba(255,245,230,.05)' : 'rgba(30,20,12,.06)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1);
      }
    }

    /* baked-light helpers: edge vignette and soft colour stains */
    function vignette(ctx, w, h, a){
      var g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .74);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(18,11,6,' + a + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    /* print-shop halftone: a dot screen whose dot size drifts across the surface */
    function halftone(ctx, w, h, gap, ink, a){
      ctx.globalAlpha = a;
      ctx.fillStyle = ink;
      for (var y = gap / 2; y < h; y += gap){
        for (var x = gap / 2; x < w; x += gap){
          var drift = (Math.sin(x * .045) + Math.cos(y * .06) + 2) / 4;
          var r = (drift * .7 + Math.random() * .3) * gap * .3;
          ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function stains(ctx, w, h, n){
      for (var i = 0; i < n; i++){
        var x = Math.random() * w, y = Math.random() * h, r = w * (.08 + Math.random() * .22);
        var g = ctx.createRadialGradient(x, y, r * .2, x, y, r);
        g.addColorStop(0, Math.random() > .5 ? 'rgba(255,218,165,.08)' : 'rgba(70,48,88,.07)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
    }

    function woodTex(){
      return texture(512, 512, function(ctx, w, h){
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#ab8156'); g.addColorStop(.5, '#a07647'); g.addColorStop(1, '#a87d51');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 84; i++){
          ctx.strokeStyle = 'rgba(96,64,36,' + (.06 + Math.random() * .14) + ')';
          ctx.lineWidth = .8 + Math.random() * 2.4;
          var y = Math.random() * h;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(w * .3, y + Math.random() * 10 - 5, w * .7, y + Math.random() * 10 - 5, w, y + Math.random() * 8 - 4);
          ctx.stroke();
        }
        for (var k = 0; k < 7; k++){
          var x = Math.random() * w, y2 = Math.random() * h;
          var rg = ctx.createRadialGradient(x, y2, 1, x, y2, 10 + Math.random() * 14);
          rg.addColorStop(0, 'rgba(78,50,26,.55)'); rg.addColorStop(1, 'rgba(78,50,26,0)');
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(x, y2, 26, 0, 7); ctx.fill();
        }
        /* worn lighter edges */
        ctx.fillStyle = 'rgba(255,236,204,.09)';
        ctx.fillRect(0, 0, w, 7); ctx.fillRect(0, h - 7, w, 7);
        stains(ctx, w, h, 6);
        grain(ctx, w, h, .5);
        vignette(ctx, w, h, .3);
      });
    }

    function pagesTex(){
      return texture(64, 64, function(ctx, w, h){
        ctx.fillStyle = '#ece3cf'; ctx.fillRect(0, 0, w, h);
        for (var y = 0; y < h; y += 2){
          ctx.fillStyle = 'rgba(140,125,95,' + (.12 + Math.random() * .16) + ')';
          ctx.fillRect(0, y, w, 1);
        }
      });
    }

    function floorTex(){
      /* herringbone parquet, honey oak */
      return texture(1024, 1024, function(ctx, w, h){
        ctx.fillStyle = '#b98a4e'; ctx.fillRect(0, 0, w, h);
        var L = 128, T = 42;
        function plank(x, y, ang){
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ang);
          var tones = ['#c69a5c', '#b8874a', '#c08e50', '#ad7f42', '#cda368'];
          ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
          ctx.fillRect(-L / 2, -T / 2, L, T);
          ctx.strokeStyle = 'rgba(70,44,20,.5)';
          ctx.lineWidth = 1.6;
          ctx.strokeRect(-L / 2, -T / 2, L, T);
          for (var i = 0; i < 4; i++){
            ctx.strokeStyle = 'rgba(120,82,42,' + (.15 + Math.random() * .2) + ')';
            ctx.lineWidth = 1;
            var gy = -T / 2 + 6 + Math.random() * (T - 12);
            ctx.beginPath(); ctx.moveTo(-L / 2, gy); ctx.lineTo(L / 2, gy + Math.random() * 6 - 3); ctx.stroke();
          }
          ctx.restore();
        }
        var step = L / Math.SQRT2;
        for (var ry = -1; ry < h / step + 2; ry++){
          for (var cx = -1; cx < w / step + 2; cx++){
            var x = cx * step, y = ry * step;
            if ((cx + ry) % 2 === 0) plank(x, y, Math.PI / 4);
            else plank(x, y, -Math.PI / 4);
          }
        }
        stains(ctx, w, h, 8);
        grain(ctx, w, h, .3);
        vignette(ctx, w, h, .34);
      });
    }

    function plasterTex(){
      return texture(512, 512, function(ctx, w, h){
        ctx.fillStyle = '#eee8db'; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 26; i++){
          var x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 90;
          var g = ctx.createRadialGradient(x, y, 4, x, y, r);
          g.addColorStop(0, Math.random() > .5 ? 'rgba(214,202,180,.16)' : 'rgba(255,252,244,.14)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        }
        halftone(ctx, w, h, 9, '#8a7f6a', .06);
        grain(ctx, w, h, .2);
        vignette(ctx, w, h, .12);
      });
    }

    function paintedTex(){
      /* white-painted shelf wood, faintly worn */
      return texture(256, 256, function(ctx, w, h){
        ctx.fillStyle = '#f2eee2'; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 16; i++){
          ctx.strokeStyle = 'rgba(196,186,166,' + (.08 + Math.random() * .1) + ')';
          ctx.lineWidth = 1;
          var y = Math.random() * h;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + Math.random() * 4 - 2); ctx.stroke();
        }
        grain(ctx, w, h, .18);
        vignette(ctx, w, h, .1);
      });
    }

    function paintingTex(){
      /* big expressionist canvas: olive, teal, ochre figures */
      return texture(360, 280, function(ctx, w, h){
        ctx.fillStyle = '#5c6047'; ctx.fillRect(0, 0, w, h);
        function blob(cx, cy, rw, rh, fill, a){
          ctx.globalAlpha = a;
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rw, rh, Math.random() * .8 - .4, 0, 7);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        blob(w * .28, h * .4, 46, 90, '#2e4a52', .85);
        blob(w * .62, h * .45, 60, 100, '#233648', .8);
        blob(w * .3, h * .5, 30, 66, '#7a7d50', .9);
        blob(w * .3, h * .72, 26, 22, '#d8cfa8', .95);
        blob(w * .66, h * .5, 26, 70, '#6d7048', .9);
        blob(w * .78, h * .35, 22, 40, '#d8cfa8', .5);
        blob(w * .12, h * .3, 30, 44, '#31463e', .7);
        blob(w * .9, h * .6, 28, 60, '#4a5a3c', .7);
        for (var i = 0; i < 26; i++){
          ctx.strokeStyle = 'rgba(24,28,20,' + (.25 + Math.random() * .3) + ')';
          ctx.lineWidth = 2 + Math.random() * 4;
          ctx.beginPath();
          var x = Math.random() * w, y = Math.random() * h;
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + 20, y + 40, x - 10, y + 70, x + 8, y + 110);
          ctx.stroke();
        }
        for (var j = 0; j < 12; j++){
          ctx.strokeStyle = 'rgba(216,207,168,' + (.2 + Math.random() * .25) + ')';
          ctx.lineWidth = 1.5 + Math.random() * 3;
          ctx.beginPath();
          var x2 = Math.random() * w, y2 = Math.random() * h;
          ctx.moveTo(x2, y2); ctx.lineTo(x2 + Math.random() * 60 - 30, y2 + Math.random() * 80 - 40);
          ctx.stroke();
        }
        halftone(ctx, w, h, 7, '#14180f', .16);
        grain(ctx, w, h, .3);
        vignette(ctx, w, h, .3);
      });
    }

    function facadeTex(){
      /* the pale milanese courtyard seen through the window */
      return texture(192, 256, function(ctx, w, h){
        var sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#e8ecf0'); sky.addColorStop(1, '#ded7c8');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#d3c5ae';
        ctx.fillRect(14, 30, w - 28, h - 30);
        for (var fy = 52; fy < h - 20; fy += 56){
          for (var fx = 30; fx < w - 34; fx += 44){
            ctx.fillStyle = 'rgba(88,86,84,.7)';
            ctx.fillRect(fx, fy, 22, 34);
            ctx.fillStyle = 'rgba(240,238,232,.5)';
            ctx.fillRect(fx + 2, fy + 2, 8, 30);
            ctx.fillStyle = '#c0b096';
            ctx.fillRect(fx - 4, fy + 34, 30, 4);
          }
        }
        var haze = ctx.createLinearGradient(0, 0, 0, h);
        haze.addColorStop(0, 'rgba(255,255,255,.5)'); haze.addColorStop(.6, 'rgba(255,255,255,.15)');
        haze.addColorStop(1, 'rgba(255,255,255,.35)');
        ctx.fillStyle = haze; ctx.fillRect(0, 0, w, h);
      });
    }

    function rugTex(){
      return texture(256, 384, function(ctx, w, h){
        ctx.fillStyle = '#6b3a33'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#d9c69e'; ctx.lineWidth = 6;
        ctx.strokeRect(12, 12, w - 24, h - 24);
        ctx.strokeStyle = '#a8842c'; ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, w - 48, h - 48);
        /* diamond field */
        ctx.strokeStyle = 'rgba(217,198,158,.16)'; ctx.lineWidth = 1.5;
        for (var y = 48; y < h - 48; y += 28){
          for (var x = 44; x < w - 44; x += 28){
            ctx.beginPath();
            ctx.moveTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 9, y);
            ctx.closePath(); ctx.stroke();
          }
        }
        /* fringe */
        ctx.strokeStyle = 'rgba(233,222,196,.8)'; ctx.lineWidth = 2;
        for (var fx = 8; fx < w - 6; fx += 7){
          ctx.beginPath(); ctx.moveTo(fx, 2); ctx.lineTo(fx, 9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fx, h - 9); ctx.lineTo(fx, h - 2); ctx.stroke();
        }
        /* weave */
        for (var wy = 0; wy < h; wy += 3){
          ctx.fillStyle = 'rgba(0,0,0,' + (.03 + Math.random() * .04) + ')';
          ctx.fillRect(0, wy, w, 1);
        }
        stains(ctx, w, h, 3);
        grain(ctx, w, h, .5);
        vignette(ctx, w, h, .3);
      });
    }

    function paperTex(){
      return texture(128, 168, function(ctx, w, h){
        ctx.fillStyle = '#f5f2ea'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(60,55,45,.75)';
        ctx.fillRect(18, 16, 62, 3);
        for (var y = 30; y < h - 14; y += 8){
          ctx.fillStyle = 'rgba(90,85,72,' + (.3 + Math.random() * .25) + ')';
          ctx.fillRect(18, y, 22 + Math.random() * 70, 2);
        }
        /* faint coffee ring */
        ctx.strokeStyle = 'rgba(150,105,55,.14)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(w * .68, h * .72, 15, .4, 5.6); ctx.stroke();
        grain(ctx, w, h, .15);
        vignette(ctx, w, h, .12);
      });
    }

    function screenTex(){
      return texture(256, 168, function(ctx, w, h){
        /* pdf viewer chrome */
        ctx.fillStyle = '#33363c'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#24262b'; ctx.fillRect(0, 0, w, 16);
        ['#c25b4e', '#c8a250', '#6a9c62'].forEach(function(c, i){
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(10 + i * 12, 8, 3, 0, 7); ctx.fill();
        });
        /* the open page */
        var px = w / 2 - 52, py = 24, pw = 104, ph = h - 34;
        ctx.fillStyle = '#f7f4ec'; ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(40,38,32,.85)';
        ctx.fillRect(px + 12, py + 10, 56, 4);
        ctx.fillRect(px + 12, py + 18, 34, 2);
        for (var y = py + 30; y < py + ph - 8; y += 7){
          ctx.fillStyle = 'rgba(80,76,66,' + (.35 + Math.random() * .25) + ')';
          ctx.fillRect(px + 12, y, pw - 24 - Math.random() * 18, 2);
        }
        /* faint glow */
        var g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .7);
        g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
    }

    function lum(hex){
      return ((hex >> 16 & 255) * .3 + (hex >> 8 & 255) * .59 + (hex & 255) * .11) / 255;
    }
    function css(hex){ return '#' + ('00000' + hex.toString(16)).slice(-6); }

    /* rounded-spine shading + wear, shared by generic and real spines */
    function shade(ctx, w, h){
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(0,0,0,.32)'); g.addColorStop(.18, 'rgba(0,0,0,0)');
      g.addColorStop(.82, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.32)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    function scuffs(ctx, w, h){
      for (var i = 0; i < 14; i++){
        ctx.strokeStyle = 'rgba(255,248,235,' + (Math.random() * .12) + ')';
        ctx.lineWidth = 1;
        var y = Math.random() * h;
        ctx.beginPath(); ctx.moveTo(Math.random() * w, y); ctx.lineTo(Math.random() * w, y + Math.random() * 20 - 10); ctx.stroke();
      }
      halftone(ctx, w, h, 7, '#141008', .05);
      grain(ctx, w, h, .35);
      vignette(ctx, w, h, .2);
    }
    /* vertical spine text: lines = [{t, font, fill, dy}], dy offsets across the spine width */
    function vtext(ctx, w, h, lines){
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lines.forEach(function(L){
        ctx.font = L.font; ctx.fillStyle = L.fill;
        ctx.fillText(L.t, 0, L.dy || 0);
      });
      ctx.restore();
    }

    function spineTex(hex, title, style){
      return texture(128, 480, function(ctx, w, h){
        ctx.fillStyle = css(hex); ctx.fillRect(0, 0, w, h);
        shade(ctx, w, h);
        var ink = lum(hex) > .55 ? 'rgba(40,32,22,.85)' : 'rgba(238,228,205,.9)';
        ctx.strokeStyle = ink; ctx.fillStyle = ink;
        if (style % 3 === 0){
          ctx.lineWidth = 2;
          [26, 34, h - 34, h - 26].forEach(function(y){
            ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(w - 14, y); ctx.stroke();
          });
        } else if (style % 3 === 1){
          ctx.globalAlpha = .28; ctx.fillRect(0, 0, w, 58); ctx.globalAlpha = 1;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(12, 66); ctx.lineTo(w - 12, 66); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(12, h - 30); ctx.lineTo(w - 12, h - 30); ctx.stroke();
        } else {
          ctx.save(); ctx.translate(w / 2, h - 40); ctx.rotate(Math.PI / 4);
          ctx.fillRect(-7, -7, 14, 14); ctx.restore();
        }
        if (title){
          var t = title.length > 20 ? title.slice(0, 19) + '…' : title;
          vtext(ctx, w, h, [{ t: t, font: '600 30px Georgia, serif', fill: ink, dy: 6 }]);
        }
        scuffs(ctx, w, h);
      });
    }

    /* real book spines, painted from their jackets */
    var REAL_SPINES = {
      gawa: { hex: 0xb39877, draw: function(ctx, w, h){
        ctx.fillStyle = '#b39877'; ctx.fillRect(0, 0, w, h);
        [0, h - 40].forEach(function(y){
          ctx.fillStyle = '#4a3a28'; ctx.fillRect(0, y, w, 40);
          for (var i = 0; i < 60; i++){
            ctx.fillStyle = 'rgba(200,175,140,' + Math.random() * .35 + ')';
            ctx.fillRect(Math.random() * w, y + Math.random() * 40, 2, 2);
          }
        });
        vtext(ctx, w, h, [
          { t: spaced('THE FAME OF GAWA'), font: '600 20px Helvetica, Arial, sans-serif', fill: '#3d2e1e', dy: -10 },
          { t: spaced('NANCY D. MUNN'), font: '400 13px Helvetica, Arial, sans-serif', fill: '#4a3a26', dy: 16 }
        ]);
      }},
      dialectics: { hex: 0xd9c69e, draw: function(ctx, w, h){
        ctx.fillStyle = '#d9c69e'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2;
        [22, 30, h - 30, h - 22].forEach(function(y){
          ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(w - 12, y); ctx.stroke();
        });
        vtext(ctx, w, h, [
          { t: 'NOTES ON DIALECTICS', font: '700 22px Georgia, serif', fill: '#5a3a1e', dy: -10 },
          { t: 'HEGEL · MARX · LENIN   C.L.R. James', font: 'italic 400 13px Georgia, serif', fill: '#6b4526', dy: 16 }
        ]);
      }},
      gramsci: { hex: 0xf1ede3, draw: function(ctx, w, h){
        ctx.fillStyle = '#f1ede3'; ctx.fillRect(0, 0, w, h);
        /* brush strokes */
        ctx.strokeStyle = 'rgba(21,19,18,.88)'; ctx.lineCap = 'round';
        for (var i = 0; i < 5; i++){
          ctx.lineWidth = 8 + Math.random() * 12;
          ctx.beginPath();
          ctx.moveTo(Math.random() * w, 60 + Math.random() * (h - 120));
          ctx.lineTo(Math.random() * w, 60 + Math.random() * (h - 120));
          ctx.stroke();
        }
        vtext(ctx, w, h, [
          { t: 'PRISON NOTEBOOKS', font: '700 21px Helvetica, Arial, sans-serif', fill: '#c0251c', dy: -10 },
          { t: 'ANTONIO GRAMSCI', font: '700 15px Helvetica, Arial, sans-serif', fill: '#c0251c', dy: 16 }
        ]);
      }},
      hall: { hex: 0x17191d, draw: function(ctx, w, h){
        ctx.fillStyle = '#17191d'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#b39877'; ctx.fillRect(w / 2 - 9, h - 34, 18, 18);
        vtext(ctx, w, h, [
          { t: spaced('ESSENTIAL ESSAYS VOL. 1'), font: '600 15px Helvetica, Arial, sans-serif', fill: '#d8c9a8', dy: -10 },
          { t: spaced('STUART HALL'), font: '700 19px Helvetica, Arial, sans-serif', fill: '#f2efe8', dy: 16 }
        ]);
      }},
      wittgenstein: { hex: 0xeceff1, draw: function(ctx, w, h){
        ctx.fillStyle = '#eceff1'; ctx.fillRect(0, 0, w, h);
        /* ghost letterform wash */
        ctx.fillStyle = 'rgba(150,155,162,.25)';
        ctx.font = '700 120px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('W', w / 2, h * .72);
        ctx.fillStyle = '#20242a';
        ctx.font = '600 9px Helvetica, Arial, sans-serif';
        ctx.fillText('WILEY', w / 2, h - 22);
        vtext(ctx, w, h, [
          { t: 'Philosophical Investigations', font: '600 19px Georgia, serif', fill: '#a12332', dy: -9 },
          { t: 'Ludwig Wittgenstein', font: '400 15px Georgia, serif', fill: '#a12332', dy: 16 }
        ]);
      }},
      lukacs: { hex: 0x241a12, draw: function(ctx, w, h){
        ctx.fillStyle = '#241a12'; ctx.fillRect(0, 0, w, h);
        /* halftone dots */
        for (var y = 14; y < h * .4; y += 9){
          for (var x = 10; x < w - 6; x += 9){
            var rr = Math.random() * 3.2;
            ctx.fillStyle = 'rgba(226,214,186,' + (.25 + Math.random() * .5) + ')';
            ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
          }
        }
        vtext(ctx, w, h, [
          { t: spaced('GEORG LUKÁCS'), font: '700 19px Helvetica, Arial, sans-serif', fill: '#e2d6ba', dy: -9 },
          { t: 'History and Class Consciousness', font: '600 13px Helvetica, Arial, sans-serif', fill: '#c9bc9d', dy: 16 }
        ]);
      }},
      debt: { hex: 0xd93a2b, draw: function(ctx, w, h){
        ctx.fillStyle = '#d93a2b'; ctx.fillRect(0, 0, w, h);
        /* receipt strip with torn ends */
        ctx.fillStyle = '#f7f4ee';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 24, 56);
        for (var x = w / 2 - 24, up = false; x <= w / 2 + 24; x += 8, up = !up){
          ctx.lineTo(x, 56 + (up ? 5 : 0));
        }
        ctx.lineTo(w / 2 + 24, h - 56);
        for (var x2 = w / 2 + 24, up2 = true; x2 >= w / 2 - 24; x2 -= 8, up2 = !up2){
          ctx.lineTo(x2, h - 56 - (up2 ? 5 : 0));
        }
        ctx.closePath(); ctx.fill();
        vtext(ctx, w, h, [
          { t: 'DEBT  ·  THE FIRST 5,000 YEARS', font: '600 15px "Space Mono", Courier, monospace', fill: '#2e3450', dy: -8 },
          { t: 'DAVID GRAEBER', font: '400 12px "Space Mono", Courier, monospace', fill: '#2e3450', dy: 12 }
        ]);
      }},
      ritual: { hex: 0x2e5440, draw: function(ctx, w, h){
        ctx.fillStyle = '#2e5440'; ctx.fillRect(0, 0, w, h);
        /* red zigzags top and bottom */
        [30, h - 44].forEach(function(y){
          ctx.strokeStyle = '#c8502a'; ctx.lineWidth = 3;
          ctx.beginPath();
          for (var x = 16, up = true; x <= w - 16; x += 12, up = !up){
            ctx[x === 16 ? 'moveTo' : 'lineTo'](x, y + (up ? -6 : 6));
          }
          ctx.stroke();
        });
        vtext(ctx, w, h, [
          { t: 'The Ritual Process', font: '600 22px Georgia, serif', fill: '#f2efe6', dy: -9 },
          { t: 'Victor Turner', font: '400 14px Georgia, serif', fill: '#d8e0d2', dy: 16 }
        ]);
      }}
    };

    function realSpineTex(key){
      var spec = REAL_SPINES[key];
      return texture(128, 480, function(ctx, w, h){
        spec.draw(ctx, w, h);
        shade(ctx, w, h);
        scuffs(ctx, w, h);
      });
    }

    function spaced(s){ return s.split('').join(' '); }

    /* the four real covers, painted from memory of their designs */
    var COVERS = {
      conscripts: { spine: 0x241d2e, draw: function(ctx, w, h){
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#2b2338'); g.addColorStop(1, '#15101d');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f2eef5';
        ctx.font = '700 29px Helvetica, Arial, sans-serif';
        ctx.fillText('DAVID SCOTT', w / 2, 44);
        ctx.font = '700 15px Helvetica, Arial, sans-serif';
        ctx.fillText('CONSCRIPTS OF MODERNITY', w / 2, 72);
        ctx.fillStyle = '#b8443a';
        ctx.font = '600 9px Helvetica, Arial, sans-serif';
        ctx.fillText('THE TRAGEDY OF COLONIAL ENLIGHTENMENT', w / 2, 94);
        /* dark painting block */
        ctx.fillStyle = '#241c30'; ctx.fillRect(26, 112, w - 52, 252);
        for (var i = 0; i < 6; i++){
          var x = 40 + Math.random() * (w - 90), y = 130 + Math.random() * 210;
          var rg = ctx.createRadialGradient(x, y, 2, x, y, 26 + Math.random() * 18);
          rg.addColorStop(0, 'rgba(140,116,96,.5)'); rg.addColorStop(1, 'rgba(140,116,96,0)');
          ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, 46, 0, 7); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(180,170,190,.25)'; ctx.strokeRect(26, 112, w - 52, 252);
        grain(ctx, w, h, .25);
      }},
      capital: { spine: 0x101010, draw: function(ctx, w, h){
        /* foundry painting */
        ctx.fillStyle = '#2a150d'; ctx.fillRect(0, 0, w, 232);
        var rg = ctx.createRadialGradient(w / 2, 132, 8, w / 2, 132, 130);
        rg.addColorStop(0, '#d97a2e'); rg.addColorStop(.45, '#8a3c16'); rg.addColorStop(1, 'rgba(42,21,13,0)');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, w, 232);
        for (var i = 0; i < 16; i++){
          ctx.strokeStyle = 'rgba(16,8,5,' + (.4 + Math.random() * .4) + ')';
          ctx.lineWidth = 2 + Math.random() * 4;
          ctx.beginPath();
          var x = Math.random() * w;
          ctx.moveTo(x, 60 + Math.random() * 170);
          ctx.lineTo(x + Math.random() * 60 - 30, 232);
          ctx.stroke();
        }
        for (var s = 0; s < 30; s++){
          ctx.fillStyle = 'rgba(240,170,80,' + Math.random() * .8 + ')';
          ctx.fillRect(w * .2 + Math.random() * w * .6, 90 + Math.random() * 110, 2, 2);
        }
        /* penguin band */
        ctx.fillStyle = '#f2ead6'; ctx.fillRect(0, 232, w, 34);
        ctx.fillStyle = '#a5561e';
        ctx.font = '600 10px Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillText(spaced('PENGUIN') + '   ' + spaced('CLASSICS'), w / 2, 253);
        /* black band */
        ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 266, w, h - 266);
        ctx.fillStyle = '#f5f2ea';
        ctx.font = '600 14px Georgia, serif';
        ctx.fillText(spaced('KARL MARX'), w / 2, 302);
        ctx.strokeStyle = '#c89a4a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w / 2 - 34, 316); ctx.lineTo(w / 2 + 34, 316); ctx.stroke();
        ctx.font = '600 21px Georgia, serif';
        ctx.fillText(spaced('CAPITAL'), w / 2, 350);
        ctx.fillStyle = '#c89a4a';
        ctx.font = '600 11px Georgia, serif';
        ctx.fillText(spaced('VOLUME I'), w / 2, 374);
        grain(ctx, w, h, .2);
      }},
      ewc: { spine: 0xbf4f1c, draw: function(ctx, w, h){
        ctx.fillStyle = '#bf4f1c'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#d9a41e';
        ctx.fillRect(0, 0, 16, h); ctx.fillRect(w - 16, 0, 16, h);
        /* worker silhouette */
        ctx.fillStyle = '#8f3a12';
        ctx.beginPath(); ctx.arc(w / 2, 30, 24, 0, 7); ctx.fill();
        ctx.fillRect(w / 2 - 62, 52, 124, h - 52);
        ctx.fillStyle = '#7d340f';
        ctx.fillRect(w / 2 - 62, 52, 16, 200); ctx.fillRect(w / 2 + 46, 52, 16, 200);
        /* title */
        ctx.fillStyle = '#f7f1e4';
        ctx.font = '400 27px Georgia, serif'; ctx.textAlign = 'left';
        ['The', 'making', 'of the', 'English', 'working', 'class'].forEach(function(line, i){
          ctx.fillText(line, 66, 126 + i * 33);
        });
        ctx.font = '700 13px Helvetica, Arial, sans-serif';
        ctx.fillText('by E.P.THOMPSON', 66, 366);
        ctx.font = '400 8px Helvetica, Arial, sans-serif';
        ctx.fillStyle = 'rgba(247,241,228,.8)';
        ctx.fillText('A Vintage Giant', 66, 384);
        grain(ctx, w, h, .3);
      }},
      piety: { spine: 0x8a2f26, draw: function(ctx, w, h){
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#7d2a26'); g.addColorStop(.55, '#c4642f'); g.addColorStop(1, '#e0b25c');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        /* mashrabiya lattice */
        ctx.fillStyle = 'rgba(74,22,18,.28)';
        for (var y = 8; y < h; y += 24){
          for (var x = (y / 24 % 2) * 12 + 8; x < w; x += 24){
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, 7);
            ctx.arc(x + 7, y + 7, 4, 0, 7);
            ctx.fill();
          }
        }
        var v = ctx.createLinearGradient(0, 0, w, 0);
        v.addColorStop(0, 'rgba(40,10,8,.5)'); v.addColorStop(.2, 'rgba(40,10,8,0)');
        v.addColorStop(.8, 'rgba(40,10,8,0)'); v.addColorStop(1, 'rgba(40,10,8,.5)');
        ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f0d48a';
        ctx.font = '600 17px Georgia, serif';
        ctx.fillText(spaced('POLITICS OF PIETY'), w / 2, 42);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f7ecd2';
        ctx.font = '400 8px Helvetica, Arial, sans-serif';
        ctx.fillText('THE ISLAMIC REVIVAL', w - 26, 72);
        ctx.fillText('AND THE', w - 26, 85);
        ctx.fillText('FEMINIST SUBJECT', w - 26, 98);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f0d48a';
        ctx.font = '600 15px Georgia, serif';
        ctx.fillText(spaced('SABA MAHMOOD'), w / 2, 368);
        ctx.font = '400 7px Helvetica, Arial, sans-serif';
        ctx.fillStyle = 'rgba(247,236,210,.85)';
        ctx.fillText('WITH A NEW PREFACE BY THE AUTHOR', w / 2, 386);
        grain(ctx, w, h, .25);
      }}
    };

    /* ---------- scene ---------- */

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
    camera.position.set(2.1, 3.1, 11.4);

    var amb = new THREE.AmbientLight(0xffffff, .75);
    var hemi = new THREE.HemisphereLight(0xfff6e6, 0x8a7a68, .35);
    var sun = new THREE.DirectionalLight(0xfff2dd, 1.45);
    sun.position.set(4, 6, 5);
    var fill = new THREE.DirectionalLight(0xdce6f5, .5);
    fill.position.set(-4, 2, -3);
    scene.add(amb, hemi, sun, fill);

    var group = new THREE.Group();
    group.rotation.y = -.12;
    scene.add(group);

    /* the bookcase (and its books) live in their own group, left of the desk */
    var caseG = new THREE.Group();
    caseG.position.x = -1.05;
    group.add(caseG);

    var wood = new THREE.MeshLambertMaterial({ map: woodTex() });
    var woodDark = new THREE.MeshLambertMaterial({ map: woodTex(), color: 0x9a8672 });
    var pages = new THREE.MeshLambertMaterial({ map: pagesTex() });

    function block(w, h, d, material, x, y, z, parent){
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        material.isMaterial || Array.isArray(material) ? material : new THREE.MeshLambertMaterial({ color: material }));
      m.position.set(x, y, z);
      (parent || group).add(m);
      return m;
    }

    /* bookcase: slim stainless-steel grid, 4 columns x 5 rows, open back to the wall */
    var painted = new THREE.MeshLambertMaterial({ map: paintedTex() });
    var steel = new THREE.MeshPhongMaterial({ map: texture(256, 256, function(ctx, w, h){
      ctx.fillStyle = '#c3c7cb'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 140; i++){
        ctx.strokeStyle = 'rgba(' + (Math.random() > .5 ? '255,255,255' : '110,116,124') + ',' + (.05 + Math.random() * .1) + ')';
        ctx.lineWidth = 1;
        var y = Math.random() * h;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      vignette(ctx, w, h, .14);
    }), specular: 0x9aa2ac, shininess: 90 });
    var W = 5.4, D = .62, SIDE = .04, CASE_H = 4.34;
    [.02, .88, 1.74, 2.60, 3.46, 4.32].forEach(function(y){ block(W, .04, D, steel, 0, y, 0, caseG); });
    block(SIDE, CASE_H, D, steel, -(W - SIDE) / 2, CASE_H / 2, 0, caseG);
    block(SIDE, CASE_H, D, steel,  (W - SIDE) / 2, CASE_H / 2, 0, caseG);
    for (var dv = 1; dv <= 3; dv++){
      block(.04, CASE_H - .08, D, steel, -2.66 + dv * 1.34 - .02, CASE_H / 2, 0, caseG);
    }

    /* plant on top */
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .2, 8),
      new THREE.MeshLambertMaterial({ color: 0xa86048 }));
    pot.position.set(-2.1, 4.44, 0);
    caseG.add(pot);
    [[-.05, .22, 0, .09, .3], [.06, .2, .04, .07, .24], [0, .18, -.06, .06, .2]].forEach(function(l){
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(l[3], l[4], 6),
        new THREE.MeshLambertMaterial({ color: 0x5d7a52 }));
      leaf.position.set(pot.position.x + l[0], pot.position.y + l[1], pot.position.z + l[2]);
      caseG.add(leaf);
    });

    /* small stack lying on top of the case */
    [[0xa8842c, .3, 0], [0x35506b, .1, .035]].forEach(function(s, i){
      var b = block(.4, .05, .28, s[0], 1.9, 4.34 + .025 + i * .05, .05, caseG);
      b.rotation.y = s[1];
    });

    /* ---------- the study: a corner of a milanese room ---------- */

    /* herringbone parquet as the diorama base, with a dark plinth under it */
    var floorMat = new THREE.MeshPhongMaterial({ map: floorTex(), shininess: 14, specular: 0x3a352c });
    block(8.8, .12, 5.2, floorMat, .35, -.06, 1.1);
    block(8.8, .1, 5.2, 0x2a2118, .35, -.17, 1.1);

    /* plaster walls: back and left, with white skirting */
    var plaster = new THREE.MeshLambertMaterial({ map: plasterTex() });
    block(8.8, 5.3, .14, plaster, .35, 2.65, -.82);
    block(.14, 5.3, 4.55, plaster, -3.98, 2.65, 1.4);
    block(8.8, .16, .04, painted, .35, .08, -.73);
    block(.04, .16, 4.55, painted, -3.89, .08, 1.4);

    /* window on the back wall, daylight and a pale courtyard beyond */
    var winG = new THREE.Group();
    winG.position.set(3.55, 2.85, -.73);
    group.add(winG);
    var daylight = new THREE.MeshLambertMaterial({ map: facadeTex(), emissive: 0xbfc4c2, emissiveMap: facadeTex() });
    var pane = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.05, .02), daylight);
    winG.add(pane);
    [[0, 1.08, 1.7, .12], [0, -1.08, 1.7, .12]].forEach(function(f){
      block(f[2], f[3], .1, painted, f[0], f[1], .02, winG);
    });
    [[-.81, 0], [.81, 0]].forEach(function(f){
      block(.12, 2.28, .1, painted, f[0], f[1], .02, winG);
    });
    block(.05, 2.05, .05, painted, 0, 0, .03, winG);
    block(1.5, .05, .05, painted, 0, .1, .03, winG);

    /* radiator under the window */
    for (var fin = 0; fin < 11; fin++){
      block(.07, .58, .12, 0xe6e0d2, 3.05 + fin * .1, .42, -.66);
    }
    block(1.1, .05, .1, 0xd8d2c4, 3.55, .73, -.66);

    /* the big canvas, hung on the left wall */
    block(.02, 1.56, 1.96, 0x2c261e, -3.905, 3.05, 1.35);
    block(.03, 1.46, 1.86, new THREE.MeshLambertMaterial({ map: paintingTex() }), -3.895, 3.05, 1.35);

    /* toio-style floor lamp: grey cone base, yellow stem, red head */
    var toio = new THREE.Group();
    toio.position.set(4.35, 0, 1.7);
    group.add(toio);
    toio.add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .24, .28, 14), new THREE.MeshLambertMaterial({ color: 0xb2aa9a })).translateY(.14));
    toio.add(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.95, 10), new THREE.MeshLambertMaterial({ color: 0xd9a91f })).translateY(1.25));
    toio.add(new THREE.Mesh(new THREE.CylinderGeometry(.095, .055, .24, 12), new THREE.MeshLambertMaterial({ color: 0xc23b28, emissive: 0x30100a })).translateY(2.32));

    /* the mari-style desk: glass ellipse on blonde tapered legs */
    var blonde = new THREE.MeshLambertMaterial({ map: (function(){
      return texture(256, 256, function(ctx, w, h){
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#dcb886'); g.addColorStop(.5, '#d2ab74'); g.addColorStop(1, '#d8b27e');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < 30; i++){
          ctx.strokeStyle = 'rgba(160,118,66,' + (.08 + Math.random() * .12) + ')';
          ctx.lineWidth = 1 + Math.random() * 1.6;
          var y = Math.random() * h;
          ctx.beginPath(); ctx.moveTo(0, y);
          ctx.bezierCurveTo(w * .3, y + 4, w * .7, y - 4, w, y + 2); ctx.stroke();
        }
        grain(ctx, w, h, .25);
        vignette(ctx, w, h, .14);
      });
    })() });
    var deskG = new THREE.Group();
    deskG.position.set(2.45, 0, 1.05);
    deskG.rotation.y = -.35;
    group.add(deskG);
    var glass = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .022, 42),
      new THREE.MeshPhongMaterial({ color: 0xb9d8cc, transparent: true, opacity: .38, shininess: 100, specular: 0xcccccc }));
    glass.scale.set(1.18, 1, .64);
    glass.position.y = 1.169;
    deskG.add(glass);
    var subTop = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .045, 36), blonde);
    subTop.scale.set(1.02, 1, .5);
    subTop.position.y = 1.135;
    deskG.add(subTop);
    [[-.82, -.3], [.82, -.3], [-.82, .32], [.82, .32]].forEach(function(pl){
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(.038, .062, 1.12, 12), blonde);
      leg.position.set(pl[0], .56, pl[1]);
      leg.rotation.z = pl[0] > 0 ? -.07 : .07;
      leg.rotation.x = pl[1] > 0 ? .06 : -.06;
      deskG.add(leg);
    });

    /* tizio-style task lamp, black and angular, with a warm pool of light */
    var lampBlack = new THREE.MeshLambertMaterial({ color: 0x181818 });
    var tizio = new THREE.Group();
    tizio.position.set(-.72, 1.18, -.26);
    deskG.add(tizio);
    tizio.add(new THREE.Mesh(new THREE.CylinderGeometry(.085, .095, .035, 14), lampBlack).translateY(.018));
    var arm1 = new THREE.Mesh(new THREE.BoxGeometry(.02, .55, .02), lampBlack);
    arm1.position.set(.1, .26, 0); arm1.rotation.z = -.5;
    tizio.add(arm1);
    var arm2 = new THREE.Mesh(new THREE.BoxGeometry(.02, .5, .02), lampBlack);
    arm2.position.set(.38, .42, 0); arm2.rotation.z = 1.2;
    tizio.add(arm2);
    var head = new THREE.Mesh(new THREE.BoxGeometry(.14, .05, .07), lampBlack);
    head.position.set(.58, .32, 0);
    tizio.add(head);
    var deskLamp = new THREE.PointLight(0xffd9a0, .55, 2.6);
    deskLamp.position.set(.58, .28, 0);
    tizio.add(deskLamp);

    var GREEN = 0x33ffaa;
    var hotspots = [];
    function hotspot(g, name, tag, href){
      g.userData = { name: name, tag: tag, href: href, glow: true };
      hotspots.push(g);
      return g;
    }

    /* papers on the desk -> /papers/ (green paperclip) */
    var paper = new THREE.MeshLambertMaterial({ map: paperTex() });
    var papersG = hotspot(new THREE.Group(), 'Papers & documents', 'Papers', '/papers/');
    deskG.add(papersG);
    [[-.3, .18, .25], [-.12, .32, -.4], [-.5, .02, .1]].forEach(function(p, i){
      var sheet = block(.3, .006, .4, [paper, paper, paper, paper, paper, paper], p[0], 1.183 + i * .007, p[1], papersG);
      sheet.rotation.y = p[2];
    });
    block(.05, .012, .09, GREEN, -.46, 1.205, -.02, papersG).userData.marker = true;

    /* small stack of books -> /writing/ (green ribbon tail) */
    var stackG = hotspot(new THREE.Group(), 'All writing — essays & notes', 'Writing', '/writing/');
    deskG.add(stackG);
    [[0x7d3b34, .42, .07, .3, .15], [0x3f5d4c, .36, .06, .26, -.1]].forEach(function(s, i){
      var b = block(s[1], s[2], s[3], s[0], .72, 1.18 + s[2] / 2 + i * .068, -.28, stackG);
      b.rotation.y = s[4];
    });
    block(.04, .008, .12, GREEN, .66, 1.315, -.16, stackG).userData.marker = true;

    /* open notebook -> current research (green bookmark) */
    var paper2 = new THREE.MeshLambertMaterial({ map: paperTex() });
    var nbG = hotspot(new THREE.Group(), 'Current research — A Change of Heart', 'Research', '#research');
    nbG.position.set(.38, 0, .3);
    nbG.rotation.y = .3;
    deskG.add(nbG);
    [-1, 1].forEach(function(s){
      var half = block(.18, .016, .26, [paper2, paper2, paper2, paper2, paper2, paper2], s * .088, 1.198, 0, nbG);
      half.rotation.z = -s * .07;
    });
    block(.04, .006, .1, GREEN, .02, 1.192, .16, nbG).userData.marker = true;

    /* monitor with the cv open -> the cv pdf (green sticky note) */
    var bezel = new THREE.MeshLambertMaterial({ color: 0x1b1b1f });
    var monG = hotspot(new THREE.Group(), 'Curriculum Vitae — open on screen', 'CV · PDF', '/assets/docs/CV_Buchberger_Isaiah.pdf');
    deskG.add(monG);
    block(.3, .02, .2, 0x1b1b1f, .05, 1.19, -.3, monG);
    block(.05, .24, .05, 0x1b1b1f, .05, 1.32, -.3, monG);
    var screen = new THREE.MeshLambertMaterial({ map: screenTex(), emissive: 0x1e1f24 });
    var mon = block(.68, .44, .035, [bezel, bezel, bezel, bezel, screen, bezel], .05, 1.62, -.3, monG);
    mon.rotation.x = -.06;
    mon.rotation.y = .12;
    block(.05, .05, .008, GREEN, -.27, -.13, .022, mon).userData.marker = true;

    /* bentwood chair, half pulled out -> about (a marked book waits on the seat) */
    var olive = new THREE.MeshLambertMaterial({ color: 0x83866b });
    var chairG = hotspot(new THREE.Group(), 'About Isaiah — pull up a chair', 'About', '#about');
    chairG.position.set(1.45, 0, 2.15);
    chairG.rotation.y = .65;
    group.add(chairG);
    var seat = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .035, 20), olive);
    seat.position.y = .63;
    chairG.add(seat);
    [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]].forEach(function(pl){
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(.016, .02, .63, 8), olive);
      leg.position.set(pl[0] * 1.12, .315, pl[1] * 1.12);
      leg.rotation.z = pl[0] > 0 ? -.06 : .06;
      leg.rotation.x = pl[1] > 0 ? .06 : -.06;
      chairG.add(leg);
    });
    /* double-hoop bentwood back */
    var hoop = new THREE.Mesh(new THREE.TorusGeometry(.2, .015, 8, 24, Math.PI), olive);
    hoop.position.set(0, 1.02, -.2);
    chairG.add(hoop);
    var hoop2 = new THREE.Mesh(new THREE.TorusGeometry(.12, .013, 8, 20, Math.PI), olive);
    hoop2.position.set(0, .98, -.2);
    chairG.add(hoop2);
    [[-.2], [.2]].forEach(function(px){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .42, 8), olive);
      post.position.set(px[0], .82, -.2);
      chairG.add(post);
    });
    var seatBook = block(.18, .04, .14, 0x3f5d4c, .02, .67, .04, chairG);
    seatBook.rotation.y = .25;
    block(.04, .006, .1, GREEN, .03, .028, .04, seatBook).userData.marker = true;

    /* baked contact shadows ground everything on the floor */
    var shadowMapTex = texture(128, 128, function(ctx, w, h){
      var g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(.65, 'rgba(0,0,0,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    function contactShadow(wd, dp, x, z, parent, y){
      var m = new THREE.Mesh(new THREE.PlaneGeometry(wd, dp),
        new THREE.MeshBasicMaterial({ map: shadowMapTex, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y === undefined ? .006 : y, z);
      m.userData.marker = true;
      (parent || group).add(m);
      return m;
    }
    contactShadow(6.4, 1.5, 0, .12, caseG);
    contactShadow(2.7, 1.5, 0, 0, deskG, .007);
    contactShadow(1.1, 1.1, 0, .05, chairG, .008);

    /* ---------- books ---------- */

    var SPINES = [0x7d3b34, 0x3f5d4c, 0x35506b, 0xa8842c, 0xb09268, 0x4a4a4a, 0xe8e0cf, 0x6b4a68];
    var seed = 7;
    function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

    var entries = (window.SHELF_BOOKS || []).slice();
    var linked = entries.filter(function(b){ return b.href; });
    var plain = entries.filter(function(b){ return !b.href; });

    var pickables = [];
    var FACE_W = .48;

    var L = [linked[0] || null, linked[1] || null, linked[2] || null, linked[3] || null, linked[4] || null];
    var P = [plain[0] || null, plain[1] || null];

    /* cell plans: 5 rows x 4 columns; 'F:' face-out cover, 'S:' real spine,
       'O:' shelf object, '_' deliberate gap, null = filler spine */
    var cellPlans = [
      [['O:hstack', null], ['S:wittgenstein', null, '_'], ['O:vase', '_', null], ['S:hall', null]],
      [['F:conscripts', null], ['S:gramsci', L[0], null], ['O:plant', '_', null], ['F:piety', null]],
      [['S:ritual', null, L[1]], ['F:capital', null], ['S:lukacs', P[0], null], ['O:ball', 'S:gawa', null]],
      [['O:bottles', '_', null], [L[2], 'S:dialectics', null], ['F:ewc', null], ['S:debt', L[3], null]],
      [[P[1], null, null], ['O:box', '_', null], [L[4], null, 'O:frame'], ['O:bowl', null, '_']]
    ];
    var rowY = [3.48, 2.62, 1.76, .90, .04];

    function isFace(i){ return typeof i === 'string' && i.slice(0, 2) === 'F:'; }
    function isReal(i){ return typeof i === 'string' && i.slice(0, 2) === 'S:'; }
    function isObj(i){ return typeof i === 'string' && i.slice(0, 2) === 'O:'; }

    /* small shelf objects to keep the grid lived-in; all inert decor */
    function makeObject(key, x, yb){
      var g = new THREE.Group();
      caseG.add(g);
      var w = .2;
      if (key === 'plant'){
        w = .22;
        var po = new THREE.Mesh(new THREE.CylinderGeometry(.07, .055, .11, 10), new THREE.MeshLambertMaterial({ color: 0xa86048 }));
        po.position.set(0, .055, 0); g.add(po);
        [[-.03, .13, 0, .05, .16], [.03, .12, .02, .04, .13], [0, .1, -.03, .035, .11]].forEach(function(l){
          var lf = new THREE.Mesh(new THREE.ConeGeometry(l[3], l[4], 6), new THREE.MeshLambertMaterial({ color: 0x5d7a52 }));
          lf.position.set(l[0], l[1], l[2]); g.add(lf);
        });
      } else if (key === 'vase'){
        w = .2;
        var body = new THREE.Mesh(new THREE.SphereGeometry(.085, 14, 12), new THREE.MeshLambertMaterial({ color: 0xd9d2c2 }));
        body.scale.y = 1.2; body.position.y = .1; g.add(body);
        var neck = new THREE.Mesh(new THREE.CylinderGeometry(.032, .045, .08, 10), new THREE.MeshLambertMaterial({ color: 0xd9d2c2 }));
        neck.position.y = .22; g.add(neck);
      } else if (key === 'bottles'){
        w = .3;
        [[-.09, 0x2e4a34], [0, 0x24402c], [.09, 0x3a5240]].forEach(function(b){
          var bt = new THREE.Mesh(new THREE.CylinderGeometry(.033, .033, .27, 10), new THREE.MeshLambertMaterial({ color: b[1] }));
          bt.position.set(b[0], .135, 0); g.add(bt);
          var nk = new THREE.Mesh(new THREE.CylinderGeometry(.013, .022, .09, 8), new THREE.MeshLambertMaterial({ color: b[1] }));
          nk.position.set(b[0], .3, 0); g.add(nk);
        });
      } else if (key === 'bowl'){
        w = .22;
        var bw = new THREE.Mesh(new THREE.CylinderGeometry(.1, .055, .08, 14), new THREE.MeshLambertMaterial({ color: 0x9a5f43 }));
        bw.position.y = .04; g.add(bw);
      } else if (key === 'ball'){
        w = .18;
        var bl = new THREE.Mesh(new THREE.SphereGeometry(.08, 14, 12), new THREE.MeshLambertMaterial({ map: texture(64, 32, function(ctx, tw, th){
          ctx.fillStyle = '#e8e0cf'; ctx.fillRect(0, 0, tw, th);
          ctx.fillStyle = '#26211a';
          for (var st = 0; st < 6; st++){ ctx.fillRect(st * 11 + (st % 2) * 3, 0, 5, th); }
        }) }));
        bl.position.y = .08; g.add(bl);
      } else if (key === 'frame'){
        w = .3;
        var fr = new THREE.Mesh(new THREE.BoxGeometry(.3, .22, .015), new THREE.MeshLambertMaterial({ color: 0x2c261e }));
        var cv2 = new THREE.Mesh(new THREE.BoxGeometry(.27, .19, .012), new THREE.MeshLambertMaterial({ map: paintingTex() }));
        cv2.position.z = .006;
        fr.add(cv2);
        fr.position.set(0, .105, -.06);
        fr.rotation.x = -.12;
        g.add(fr);
      } else if (key === 'hstack'){
        w = .36;
        [[0xa8842c, .12], [0x35506b, -.08], [0x7d3b34, .05]].forEach(function(hb, i2){
          var hk = block(.3, .038, .21, hb[0], 0, .019 + i2 * .038, 0, g);
          hk.rotation.y = hb[1];
        });
      } else if (key === 'box'){
        w = .26;
        block(.22, .13, .17, 0xb09268, 0, .065, 0, g);
        block(.23, .02, .18, 0x9a7f56, 0, .14, 0, g);
      }
      g.position.set(x + w / 2, yb, .02);
      return w;
    }

    cellPlans.forEach(function(rowPlan, r){
      rowPlan.forEach(function(cell, cIdx){
        var x = -2.66 + cIdx * 1.34 + .05;
        var cellEnd = -2.66 + cIdx * 1.34 + 1.3 - .05;
        var yb = rowY[r];

        function placeSpine(item){
          var real = isReal(item) ? item.slice(2) : null;
          var w = real ? .1 + rnd() * .03 : .07 + rnd() * .05;
          var h = real ? .5 + rnd() * .08 : .34 + rnd() * .16;
          var d = .24 + rnd() * .05;
          var hex = real ? REAL_SPINES[real].hex : SPINES[Math.floor(rnd() * SPINES.length)];
          var title = item && item.name ? item.name : null;
          var sMat = new THREE.MeshLambertMaterial({
            map: real ? realSpineTex(real) : spineTex(hex, title, Math.floor(rnd() * 3))
          });
          var board = new THREE.MeshLambertMaterial({ color: hex });
          /* spine faces the viewer (+z); boards on the sides; pages on top and fore-edge */
          var book = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.03, w - .012), h, d),
            [board, board, pages, board, sMat, pages]);
          book.position.set(x + w / 2, yb + h / 2, .04);
          caseG.add(book);
          x += w + .004;
          if (item && item.href){
            /* marginalia-green bookmark ribbon marks the clickable books */
            block(.028, .08, .012, 0x33ffaa, 0, h / 2 + .03, d / 2 - .04, book).userData.marker = true;
            book.userData = item;
            book.userData.baseZ = book.position.z;
            pickables.push(book);
          }
        }

        cell.forEach(function(item){
          if (item === '_'){ x += .1 + rnd() * .12; return; }
          if (isObj(item)){ x += makeObject(item.slice(2), x, yb) + .05; return; }
          if (isFace(item)){
            var key = item.slice(2);
            var c = COVERS[key];
            var cw = FACE_W - .06, chh = .56 + rnd() * .06, cd = .085;
            var coverMat = new THREE.MeshLambertMaterial({ map: texture(256, 400, function(ctx, cw2, chh2){
              c.draw(ctx, cw2, chh2);
              halftone(ctx, cw2, chh2, 5, '#0c0a08', .06);
              vignette(ctx, cw2, chh2, .22);
            }) });
            var spineMat = new THREE.MeshLambertMaterial({ map: spineTex(c.spine, null, 1) });
            var backMat = new THREE.MeshLambertMaterial({ color: c.spine });
            var bk = block(cw, chh, cd, [pages, spineMat, pages, backMat, coverMat, backMat],
              x + FACE_W / 2, yb + chh / 2, .1, caseG);
            bk.rotation.y = .08 + rnd() * .06;
            x += FACE_W;
            return;
          }
          placeSpine(item);
        });

        /* pad toward the divider with filler spines, keeping some air */
        var guard = 0;
        while (x < cellEnd - .3 && guard++ < 14){
          if (rnd() < .3){ x += .08 + rnd() * .14; continue; }
          placeSpine(null);
        }
      });
    });

    /* ---------- interaction ---------- */

    /* beckoning halos: a faint green shell breathes around every door */
    var doors = pickables.concat(hotspots);
    doors.forEach(function(d, i){
      var m = new THREE.MeshBasicMaterial({
        color: 0x33ffaa, side: THREE.BackSide, transparent: true, opacity: .18, depthWrite: false
      });
      d.userData.haloMat = m;
      d.userData.haloPhase = i * 1.7;
      var targets = [];
      d.traverse(function(n){
        var g = n.isMesh && !n.userData.marker && n.geometry.parameters;
        if (g && ((g.width !== undefined && g.height !== undefined && g.depth !== undefined) || g.radiusTop !== undefined)) targets.push(n);
      });
      targets.forEach(function(n){
        var g = n.geometry.parameters;
        var hull;
        if (g.radiusTop !== undefined){
          var padC = Math.min(.05, Math.max(.015, Math.min(g.radiusTop, g.radiusBottom) * .6));
          hull = new THREE.Mesh(new THREE.CylinderGeometry(g.radiusTop + padC, g.radiusBottom + padC, g.height + padC * 2, g.radialSegments), m);
        } else {
          /* shell thickness scales with the part so thin legs get a rim, not a ghost */
          var pad = Math.min(.05, Math.max(.015, Math.min(g.width, g.height, g.depth) * .35)) * 2;
          hull = new THREE.Mesh(new THREE.BoxGeometry(g.width + pad, g.height + pad, g.depth + pad), m);
        }
        n.add(hull);
      });
    });

    var tip = box.querySelector('.shelf-tip');
    var ray = new THREE.Raycaster();
    var ptr = new THREE.Vector2(-2, -2);
    var mouse = { x: 0, y: 0 };
    var hovered = null;

    function setGlow(obj, on){
      obj.traverse(function(n){
        if (n.isMesh){
          (Array.isArray(n.material) ? n.material : [n.material]).forEach(function(m){
            if (m.emissive && !m.map) m.emissive.setHex(on ? 0x18180e : 0x000000);
            else if (m.emissive && m.map) m.emissive.setHex(on ? 0x14140c : (m === screen ? 0x1e1f24 : 0x000000));
          });
        }
      });
    }

    function pick(cx, cy){
      var rect = canvas.getBoundingClientRect();
      ptr.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      /* raycast the whole scene so furniture genuinely occludes the books */
      var hit = ray.intersectObjects(group.children, true)[0];
      var o = hit ? hit.object : null;
      while (o && !(o.userData && o.userData.href)) o = o.parent;
      return o || null;
    }

    canvas.addEventListener('pointermove', function(e){
      var rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      var b = pick(e.clientX, e.clientY);
      if (b !== hovered){
        if (hovered && hovered.userData.glow) setGlow(hovered, false);
        hovered = b;
        if (b && b.userData.glow) setGlow(b, true);
        canvas.style.cursor = b ? 'pointer' : '';
        if (b){
          tip.textContent = b.userData.name + ' — ' + b.userData.tag;
          tip.hidden = false;
        } else {
          tip.hidden = true;
        }
      }
      if (b){
        var bx = box.getBoundingClientRect();
        var left = e.clientX - bx.left + 14;
        left = Math.min(left, bx.width - tip.offsetWidth - 8);
        tip.style.left = Math.max(8, left) + 'px';
        tip.style.top = (e.clientY - bx.top - 8) + 'px';
      }
      needs = true;
    });

    function clearHover(){
      if (hovered && hovered.userData.glow) setGlow(hovered, false);
      hovered = null;
      mouse.x = 0; mouse.y = 0;
      canvas.style.cursor = '';
      tip.hidden = true;
      needs = true;
    }
    canvas.addEventListener('pointerleave', clearHover);
    window.addEventListener('scroll', clearHover, { passive: true });

    canvas.addEventListener('click', function(e){
      var b = pick(e.clientX, e.clientY);
      if (b) window.location.href = b.userData.href;
    });

    /* theme */
    function applyTheme(){
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      amb.intensity = dark ? .74 : .95;
      sun.intensity = dark ? 1.3 : 1.65;
      hemi.intensity = dark ? .34 : .52;
      needs = true;
    }
    new MutationObserver(applyTheme)
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    applyTheme();

    /* sizing */
    function size(){
      var w = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2;
      var h = box.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var dist = camera.position.distanceTo(new THREE.Vector3(.45, 1.85, .6));
      var halfW = Math.tan(camera.fov * Math.PI / 360) * dist * camera.aspect;
      camera.zoom = Math.min(1, halfW / 3.95);
      camera.updateProjectionMatrix();
      needs = true;
    }
    size();
    window.addEventListener('resize', size);

    /* render loop: pauses offscreen; when reduced motion is set, renders only on change */
    var visible = true, needs = true;
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }).observe(box);
    }

    camera.lookAt(.45, 1.85, .6);


    function frame(now){
      requestAnimationFrame(frame);
      if (!visible) return;

      var settling = false;
      pickables.forEach(function(b){
        var target = b.userData.baseZ + (b === hovered ? .12 : 0);
        var dz = target - b.position.z;
        if (Math.abs(dz) > .002){ b.position.z += dz * .18; settling = true; }
      });

      /* halo breathing */
      var tSec = now / 1000;
      doors.forEach(function(d){
        var m = d.userData.haloMat;
        var target = d === hovered ? .6
          : reduced ? .26
          : .14 + .22 * (Math.sin(tSec * 1.6 + d.userData.haloPhase) + 1) / 2;
        var dm = target - m.opacity;
        if (Math.abs(dm) > .004){ m.opacity += dm * .15; settling = true; }
      });

      if (!reduced){
        var t = now / 1000;
        group.rotation.y += ((-.12 + mouse.x * .08 + Math.sin(t * .25) * .02) - group.rotation.y) * .06;
        group.rotation.x += ((mouse.y * .04) - group.rotation.x) * .06;
      } else if (!needs && !settling){
        return;
      }
      needs = false;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
})();
