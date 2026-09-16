// SVR ONE — Three.js hero scene: animated particle wave + floating wireframes.
// Fails silently (canvas stays transparent) if WebGL or the CDN is unavailable.
import * as THREE from 'three';

(function initHero() {
  const canvas = document.getElementById('webgl-hero');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 640;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isSmall });
  } catch (err) {
    canvas.style.display = 'none';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 1.6, 7);

  // --- Particle wave grid ---
  const COUNT_X = isSmall ? 56 : 92;
  const COUNT_Z = isSmall ? 36 : 60;
  const count = COUNT_X * COUNT_Z;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lime = new THREE.Color('#c8f04a');
  const pale = new THREE.Color('#9aa3b5');
  const dim = new THREE.Color('#2b3242');

  let i = 0;
  for (let x = 0; x < COUNT_X; x++) {
    for (let z = 0; z < COUNT_Z; z++) {
      positions[i * 3] = (x / COUNT_X - 0.5) * 24;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (z / COUNT_Z - 0.5) * 15;
      const r = Math.random();
      const c = r < 0.22 ? lime : r < 0.5 ? pale : dim;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      i++;
    }
  }
  const waveGeo = new THREE.BufferGeometry();
  waveGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  waveGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const waveMat = new THREE.PointsMaterial({
    size: 0.075,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const wave = new THREE.Points(waveGeo, waveMat);
  wave.position.y = -1.05;
  wave.rotation.x = -0.32;
  scene.add(wave);

  // --- Floating wireframe accents ---
  const limeWire = new THREE.MeshBasicMaterial({
    color: 0xc8f04a, wireframe: true, transparent: true, opacity: 0.32,
  });
  const greyWire = new THREE.MeshBasicMaterial({
    color: 0x8b93a7, wireframe: true, transparent: true, opacity: 0.2,
  });
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), limeWire);
  ico.position.set(4.9, 1.0, -1.6);
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.24, 12, 42), greyWire);
  torus.position.set(-5.1, 0.5, -2.2);
  const octa = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), limeWire.clone());
  octa.material.opacity = 0.22;
  octa.position.set(-2.6, 1.9, -3.2);
  scene.add(ico, torus, octa);

  // --- Mouse parallax ---
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  // --- Resize ---
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight || 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // --- Pause when offscreen ---
  let running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      running = entries[0].isIntersecting;
    }).observe(canvas);
  }

  // --- Animate ---
  const clock = new THREE.Clock();
  const posAttr = waveGeo.attributes.position;

  function updateWave(t) {
    for (let k = 0; k < count; k++) {
      const px = positions[k * 3];
      const pz = positions[k * 3 + 2];
      posAttr.array[k * 3 + 1] =
        Math.sin(px * 0.5 + t * 1.05) * 0.42 +
        Math.cos(pz * 0.65 + t * 0.8) * 0.34;
    }
    posAttr.needsUpdate = true;
  }

  function tick() {
    requestAnimationFrame(tick);
    if (!running || document.hidden) return;
    const t = clock.getElapsedTime();

    if (!reduceMotion) {
      updateWave(t);
      ico.rotation.y = t * 0.28;
      ico.rotation.x = t * 0.12;
      ico.position.y = 1.0 + Math.sin(t * 0.7) * 0.2;
      torus.rotation.x = t * 0.18;
      torus.rotation.z = t * 0.14;
      octa.rotation.y = -t * 0.35;
      octa.position.y = 1.9 + Math.cos(t * 0.55) * 0.22;
    }

    tx += (mx - tx) * 0.045;
    ty += (my - ty) * 0.045;
    camera.position.x = tx * 1.7;
    camera.position.y = 1.6 - ty * 1.1;
    camera.lookAt(0, 0.1, 0);

    renderer.render(scene, camera);
  }
  tick();
})();
