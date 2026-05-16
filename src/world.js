/* ============================================================
   World — three.js low-poly scene
   廃都市の中の小さな美しい世界
   ============================================================ */

(function () {
  const TILE = 1.0;          // world units per tile
  const TILE_H = 0.18;       // tile thickness
  const GRID_OFFSET = 0;     // origin

  // ---------- Color presets per weather ----------
  const WEATHER = {
    morning: {
      label: '朝',
      sky: [0xe8c8a0, 0xa88a6e, 0x6a5040],
      fog: [0xc8a888, 0.03],
      sun: [0xfff0d4, 1.0, [10, 6, 4]],
      ambient: [0x8a7058, 0.5],
      ground: 0x2a2218,
      star: 0,
      mood: 'warm',
    },
    noon: {
      label: '昼',
      sky: [0xa0a8a0, 0x7a7a76, 0x5a5650],
      fog: [0x707268, 0.025],
      sun: [0xeae0c8, 0.95, [6, 10, 6]],
      ambient: [0x807868, 0.6],
      ground: 0x2a2a26,
      star: 0,
      mood: 'pale',
    },
    evening: {
      label: '夕方',
      sky: [0xc06a48, 0x70402a, 0x2a1a16],
      fog: [0x60302a, 0.045],
      sun: [0xff8a50, 0.95, [8, 3, 2]],
      ambient: [0x6a3a2a, 0.55],
      ground: 0x2a1814,
      star: 0,
      mood: 'red',
    },
    night: {
      label: '夜',
      sky: [0x18202e, 0x0a1018, 0x06080c],
      fog: [0x0a0e16, 0.05],
      sun: [0x6a90c0, 0.4, [4, 8, 4]],
      ambient: [0x1a2230, 0.5],
      ground: 0x0e1218,
      star: 0.4,
      mood: 'cold',
    },
    deep_night: {
      label: '深夜',
      sky: [0x080a12, 0x040608, 0x000000],
      fog: [0x040608, 0.07],
      sun: [0x506680, 0.18, [3, 6, 3]],
      ambient: [0x0a1018, 0.35],
      ground: 0x05070a,
      star: 0.5,
      mood: 'cold',
    },
    night_starry: {
      label: '星空',
      sky: [0x1a2440, 0x0a1428, 0x040814],
      fog: [0x0a1428, 0.025],
      sun: [0xa8c4e8, 0.5, [3, 8, 4]],
      ambient: [0x2a3050, 0.6],
      ground: 0x141a26,
      star: 1.0,
      mood: 'star',
    },
    seabed: {
      label: '海底',
      sky: [0x103048, 0x062028, 0x021014],
      fog: [0x062028, 0.09],
      sun: [0x80c8d8, 0.5, [2, 8, 2]],
      ambient: [0x1a4458, 0.7],
      ground: 0x0a2030,
      star: 0,
      mood: 'abyss',
    },
    collapse: {
      label: '崩壊',
      sky: [0x000000, 0x080604, 0x100804],
      fog: [0x080404, 0.06],
      sun: [0x180806, 0.6, [6, 10, 4]], // black sun => use very dark + ringlight
      ambient: [0x180806, 0.3],
      ground: 0x0a0604,
      star: 0,
      mood: 'void',
    },
  };

  // ---------- Tile materials ----------
  const TILE_MATERIALS = {
    soil_barren:  { color: 0x4a3a2a, rough: 0.95 },
    soil_ash:     { color: 0x5a554c, rough: 0.95 },
    soil_toxic:   { color: 0x4a5a3a, rough: 0.9 },
    soil_cracked: { color: 0x3e3022, rough: 0.95 },
    path_broken:  { color: 0x6a6258, rough: 0.85 },
    water_murky:  { color: 0x2c4048, rough: 0.3, transmission: 0.4 },
    brick_ruin:   { color: 0x7a4a36, rough: 0.85 },
    field_barren: { color: 0x3a2e1e, rough: 0.95 },
    moss_gray:    { color: 0x4a5240, rough: 0.95 },
  };

  // ---------- Three.js / scene ----------
  let renderer, scene, camera;
  let sunLight, ambientLight, hemiLight;
  let skyMesh;
  let stars;
  let tileGroup, itemGroup;
  let charGroup, charBody, charHairFront, charSitting = false;
  let pinpointLight; // light over character
  let blackSun;      // for collapse weather
  let waterTime = 0;

  // Internal state cache
  let tilesCache = []; // last rendered tiles list for diffing
  let weatherKey = null;
  let timeOfDayKey = null;
  let seasonKey = null;
  let weatherModeKey = null;
  let raf = null;
  let placement = null; // { category, id } when in placement mode
  let placementGhost = null;
  let raycaster = null;
  let mouseNDC = { x: 0, y: 0 };
  let charPos = { x: 0, z: 0 };
  let charPosVisual = { x: 0, z: 0 }; // smoothed
  let charYaw = 0;
  let charYawVisual = 0;
  let cameraTarget = { x: 0.5, z: 0.5 }; // looking at scene center
  let cameraOffset = { dist: 14, height: 9, yaw: -0.55 };

  // Keys
  const keys = { w: false, a: false, s: false, d: false };

  function init(rootEl) {
    const THREE = window.THREE;
    if (!THREE) {
      console.error('THREE not loaded');
      return;
    }

    const w = window.innerWidth, h = window.innerHeight;

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rootEl.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080604);
    scene.fog = new THREE.FogExp2(0x080604, 0.05);

    camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);
    updateCameraPos();

    // Lights
    ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0x6080a0, 0x201810, 0.4);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xffe8c8, 1.0);
    sunLight.position.set(6, 12, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.0008;
    scene.add(sunLight);

    pinpointLight = new THREE.PointLight(0xffd8a0, 0.0, 6, 1.2);
    pinpointLight.position.set(0, 2.0, 0);
    scene.add(pinpointLight);

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(80, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x18202e) },
        midColor:    { value: new THREE.Color(0x0a1018) },
        bottomColor: { value: new THREE.Color(0x06080c) },
        offset:      { value: 8 },
        exponent:    { value: 0.7 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos + vec3(0.0, offset, 0.0)).y;
          vec3 col;
          if (h > 0.0) {
            col = mix(midColor, topColor, pow(max(h, 0.0), exponent));
          } else {
            col = mix(midColor, bottomColor, pow(max(-h, 0.0), exponent));
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);

    // Stars (always present, opacity controlled by weather)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1400;
    const starPos = new Float32Array(starCount * 3);
    const starSize = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      // distributed on upper hemisphere
      const phi = Math.acos(Math.random() * 0.96 + 0.02); // close to top
      const theta = Math.random() * Math.PI * 2;
      const r = 60;
      starPos[i*3+0] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = r * Math.cos(phi);
      starPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      starSize[i] = Math.random() < 0.06 ? 2.4 : (Math.random() < 0.3 ? 1.4 : 0.8);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSize, 1));
    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        time:    { value: 0 },
        opacity: { value: 0.0 },
        tint:    { value: new THREE.Color(0xe8e8ff) },
      },
      vertexShader: `
        attribute float size;
        varying float vSize;
        void main() {
          vSize = size;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * (180.0 / -mv.z);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform vec3 tint;
        varying float vSize;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;
          float twinkle = 0.7 + 0.3 * sin(time * 2.0 + vSize * 13.7);
          float alpha = smoothstep(0.5, 0.0, d) * opacity * twinkle;
          gl_FragColor = vec4(tint, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Black sun (collapse weather only)
    const sunGeo = new THREE.CircleGeometry(4, 48);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    blackSun = new THREE.Mesh(sunGeo, sunMat);
    blackSun.position.set(-12, 16, -20);
    blackSun.lookAt(0, 0, 0);
    scene.add(blackSun);
    // Halo ring around it
    const haloGeo = new THREE.RingGeometry(4.2, 5.2, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xa64a3a, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(blackSun.position);
    halo.lookAt(0, 0, 0);
    scene.add(halo);
    blackSun.userData.halo = halo;

    // Ground (extends beyond grid for context)
    const groundGeo = new THREE.PlaneGeometry(60, 60, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x14110c, roughness: 1.0, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.userData.ground = ground;

    // Groups
    tileGroup = new THREE.Group();
    scene.add(tileGroup);
    itemGroup = new THREE.Group();
    scene.add(itemGroup);

    // Character
    charGroup = buildCharacter(THREE);
    scene.add(charGroup);

    // Initial render
    syncFromStore(window.Store.get());

    // Animation loop
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Move character based on keys
      handleMovement(dt);

      // Smoothly catch up visual position
      const lerp = 1 - Math.exp(-dt * 10);
      charPosVisual.x += (charPos.x - charPosVisual.x) * lerp;
      charPosVisual.z += (charPos.z - charPosVisual.z) * lerp;
      charGroup.position.x = charPosVisual.x;
      charGroup.position.z = charPosVisual.z;

      let yawDiff = charYaw - charYawVisual;
      while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
      while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;
      charYawVisual += yawDiff * lerp;
      charGroup.rotation.y = charYawVisual;

      // Walk bob
      const moving = keys.w || keys.a || keys.s || keys.d;
      if (charBody && !charSitting) {
        const bobY = moving ? Math.sin(now * 0.012) * 0.05 : 0;
        charBody.position.y = 0.42 + bobY;
      }

      // Water ripple
      waterTime += dt;
      tileGroup.children.forEach(t => {
        if (t.userData.isWater) {
          t.position.y = (Math.sin(waterTime * 1.4 + t.userData.x * 0.7 + t.userData.z * 0.5) * 0.012) - 0.04;
        }
      });

      // Stars twinkle
      if (stars && stars.material.uniforms) {
        stars.material.uniforms.time.value = waterTime;
      }

      // Camera follows character softly
      cameraTarget.x += ((charPosVisual.x) - cameraTarget.x) * 0.04;
      cameraTarget.z += ((charPosVisual.z) - cameraTarget.z) * 0.04;
      updateCameraPos();

      // Pinpoint light follows
      pinpointLight.position.set(charPosVisual.x, 2.2, charPosVisual.z + 0.2);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // Resize
    window.addEventListener('resize', onResize);

    // Keyboard
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Raycaster + click placement
    raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onCanvasClick);

    // Subscribe to state changes
    window.Store.subscribe(syncFromStore);
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function onKeyDown(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup')    { keys.w = true; e.preventDefault(); }
    if (k === 's' || k === 'arrowdown')  { keys.s = true; e.preventDefault(); }
    if (k === 'a' || k === 'arrowleft')  { keys.a = true; e.preventDefault(); }
    if (k === 'd' || k === 'arrowright') { keys.d = true; e.preventDefault(); }
  }
  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup')    keys.w = false;
    if (k === 's' || k === 'arrowdown')  keys.s = false;
    if (k === 'a' || k === 'arrowleft')  keys.a = false;
    if (k === 'd' || k === 'arrowright') keys.d = false;
    if (k === 'escape') {
      setPlacement(null);
    }
  }

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    updateGhost();
  }

  function getHoveredCell() {
    if (!raycaster || !camera) return null;
    raycaster.setFromCamera(mouseNDC, camera);
    // Intersect a horizontal plane at y=0.09 (tile top)
    const ground = scene.userData.ground;
    const hits = raycaster.intersectObjects([ground], false);
    if (!hits[0]) return null;
    const p = hits[0].point;
    return { x: Math.round(p.x / TILE), z: Math.round(p.z / TILE) };
  }

  function updateGhost() {
    if (!placement || !placementGhost) return;
    const cell = getHoveredCell();
    if (!cell) return;
    placementGhost.position.set(cell.x * TILE, 0.1, cell.z * TILE);
    // Check validity
    const s = window.Store.get();
    const tile = s.world.tiles.find(t => t.x === cell.x && t.z === cell.z);
    let valid = true;
    if (placement.category === 'tile') {
      valid = true; // can replace or place anywhere
    } else {
      valid = !!tile && !tile.item; // need a tile, must be empty
    }
    placementGhost.userData.parts?.forEach(m => {
      if (m.material) m.material.opacity = valid ? 0.6 : 0.3;
    });
    if (placementGhost.userData.tint) {
      placementGhost.userData.tint.material.color.set(valid ? 0xc97b4a : 0xa64a3a);
    }
  }

  function onCanvasClick(e) {
    if (!placement) return;
    const cell = getHoveredCell();
    if (!cell) return;
    window.Store.placeAt(placement.category, placement.id, cell.x, cell.z);
    window.toast?.('配置: ' + (window.Store.CATALOG_MAP[placement.id]?.name || placement.id), 'success');
    // Stay in placement mode if still have stock
    const s = window.Store.get();
    const remaining = s.inventory[placement.category]?.[placement.id] || 0;
    if (remaining <= 0) setPlacement(null);
  }

  function setPlacement(p) {
    placement = p;
    // Clear old ghost
    if (placementGhost) {
      scene.remove(placementGhost);
      placementGhost.traverse?.(n => { n.geometry?.dispose?.(); n.material?.dispose?.(); });
      placementGhost = null;
    }
    if (p) {
      // Build ghost mesh
      placementGhost = buildGhost(p);
      scene.add(placementGhost);
    }
    if (placementChangeHandler) placementChangeHandler(p);
  }
  let placementChangeHandler = null;

  function buildGhost(p) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const parts = [];
    if (p.category === 'tile') {
      const geo = new THREE.BoxGeometry(TILE * 0.98, TILE_H, TILE * 0.98);
      const mat = new THREE.MeshBasicMaterial({ color: 0xc97b4a, transparent: true, opacity: 0.5 });
      const m = new THREE.Mesh(geo, mat);
      g.add(m);
      parts.push(m);
    } else {
      // Use the item geometry as a ghost — clone it
      const itemMesh = buildItem(p.id, 0, 0);
      itemMesh.position.set(0, 0, 0);
      itemMesh.traverse(n => {
        if (n.material) {
          if (Array.isArray(n.material)) n.material = n.material.map(m => m.clone());
          else n.material = n.material.clone();
          if (Array.isArray(n.material)) n.material.forEach(m => { m.transparent = true; m.opacity = 0.55; });
          else { n.material.transparent = true; n.material.opacity = 0.55; }
          parts.push(n);
        }
      });
      g.add(itemMesh);
    }
    g.userData.parts = parts;
    return g;
  }

  function handleMovement(dt) {
    if (charSitting) return;
    let dx = 0, dz = 0;
    if (keys.w) dz -= 1;
    if (keys.s) dz += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
    if (dx === 0 && dz === 0) return;
    const len = Math.hypot(dx, dz);
    dx /= len; dz /= len;
    const speed = 3.5;
    charPos.x += dx * speed * dt;
    charPos.z += dz * speed * dt;
    // Clamp
    charPos.x = Math.max(-14, Math.min(14, charPos.x));
    charPos.z = Math.max(-14, Math.min(14, charPos.z));
    // Yaw towards motion
    charYaw = Math.atan2(dx, dz);
    // Persist (throttled)
    if (!handleMovement._save || performance.now() - handleMovement._save > 500) {
      handleMovement._save = performance.now();
      window.Store.setCharacterPos(charPos.x, charPos.z);
    }
  }

  function updateCameraPos() {
    if (!camera) return;
    const tx = cameraTarget.x, tz = cameraTarget.z;
    const yaw = cameraOffset.yaw;
    const dist = cameraOffset.dist;
    const height = cameraOffset.height;
    camera.position.set(
      tx + Math.sin(yaw) * dist,
      height,
      tz + Math.cos(yaw) * dist
    );
    camera.lookAt(tx, 0.5, tz);
  }

  // ---------- Character ----------
  function buildCharacter(THREE) {
    const g = new THREE.Group();

    // Body (dress) — dark coat with rust accent
    const bodyGeo = new THREE.BoxGeometry(0.34, 0.5, 0.28);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.85 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.42;
    body.castShadow = true;
    g.add(body);
    charBody = body;

    // Skirt flare
    const skirtGeo = new THREE.ConeGeometry(0.28, 0.32, 8);
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x1c1816, roughness: 0.95 });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.y = 0.22;
    skirt.castShadow = true;
    g.add(skirt);

    // Head
    const headGeo = new THREE.BoxGeometry(0.26, 0.26, 0.24);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xe8d8c0, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.82;
    head.castShadow = true;
    g.add(head);

    // Hair — long white hair (back)
    const hairBackGeo = new THREE.BoxGeometry(0.30, 0.46, 0.22);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xeae4d6, roughness: 0.55, emissive: 0x080808 });
    const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
    hairBack.position.set(0, 0.66, -0.045);
    hairBack.castShadow = true;
    g.add(hairBack);

    // Hair — top
    const hairTopGeo = new THREE.BoxGeometry(0.28, 0.08, 0.26);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 0.95, 0);
    g.add(hairTop);

    // Hair — front bangs
    const hairFrontGeo = new THREE.BoxGeometry(0.27, 0.10, 0.04);
    const hairFront = new THREE.Mesh(hairFrontGeo, hairMat);
    hairFront.position.set(0, 0.88, 0.115);
    g.add(hairFront);
    charHairFront = hairFront;

    // Side hair locks (longer, going down past shoulders)
    const lockGeo = new THREE.BoxGeometry(0.06, 0.5, 0.08);
    const lockL = new THREE.Mesh(lockGeo, hairMat);
    lockL.position.set(-0.14, 0.62, 0.04);
    g.add(lockL);
    const lockR = new THREE.Mesh(lockGeo, hairMat);
    lockR.position.set(0.14, 0.62, 0.04);
    g.add(lockR);

    // Cape / scarf (rust-colored accent)
    const capeGeo = new THREE.BoxGeometry(0.36, 0.18, 0.05);
    const capeMat = new THREE.MeshStandardMaterial({ color: 0x8a5635, roughness: 0.9 });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.55, -0.13);
    g.add(cape);

    // Eyes (tiny black points)
    const eyeGeo = new THREE.BoxGeometry(0.03, 0.03, 0.01);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x10080a, emissive: 0x6a8aa0, emissiveIntensity: 0.15 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.06, 0.82, 0.125);
    g.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.06, 0.82, 0.125);
    g.add(eyeR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.09, 0.18, 0.09);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.9 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.07, 0.08, 0);
    legL.castShadow = true;
    g.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.07, 0.08, 0);
    legR.castShadow = true;
    g.add(legR);

    g.userData.parts = { body, head, skirt, hairBack, hairFront, hairTop, lockL, lockR, cape, legL, legR };
    return g;
  }

  function setSitting(sitting) {
    if (!charGroup) return;
    charSitting = sitting;
    const desk = findDeskPosition();
    if (sitting && desk) {
      // Position character at chair (next to desk)
      const chair = findChairPosition() || { x: desk.x + 1, z: desk.z };
      charPos.x = chair.x * TILE;
      charPos.z = chair.z * TILE;
      // Face the desk
      const dx = desk.x - chair.x;
      const dz = desk.z - chair.z;
      charYaw = Math.atan2(dx, dz);
      // Lower body to sitting pose
      const parts = charGroup.userData.parts;
      if (parts) {
        parts.body.position.y = 0.32;
        parts.head.position.y = 0.72;
        parts.skirt.position.y = 0.16;
      }
    } else {
      const parts = charGroup.userData.parts;
      if (parts) {
        parts.body.position.y = 0.42;
        parts.head.position.y = 0.82;
        parts.skirt.position.y = 0.22;
      }
    }
  }

  function findDeskPosition() {
    const s = window.Store.get();
    const t = s.world.tiles.find(t => t.item === 'desk_iron');
    return t ? { x: t.x, z: t.z } : null;
  }
  function findChairPosition() {
    const s = window.Store.get();
    const t = s.world.tiles.find(t => t.item === 'chair_iron');
    return t ? { x: t.x, z: t.z } : null;
  }

  // ---------- Sync from store ----------
  function syncFromStore(state) {
    // Time / season / weather mode
    const nextTimeOfDay = state.world.timeOfDay || state.world.weather || 'night';
    const nextSeason = state.world.season || 'spring';
    const nextWeatherMode = state.world.weatherMode || 'clear';
    if (
      nextTimeOfDay !== timeOfDayKey
      || nextSeason !== seasonKey
      || nextWeatherMode !== weatherModeKey
      || state.world.weather !== weatherKey
    ) {
      applyWeather(nextTimeOfDay, nextSeason, nextWeatherMode);
      timeOfDayKey = nextTimeOfDay;
      seasonKey = nextSeason;
      weatherModeKey = nextWeatherMode;
      weatherKey = state.world.weather;
    }

    // Tiles diff
    rebuildTiles(state.world.tiles);

    // Char position from store (only if not currently moving, to avoid jitter)
    if (!keys.w && !keys.a && !keys.s && !keys.d && !charSitting) {
      charPos.x = state.character.position.x;
      charPos.z = state.character.position.z;
    }
  }

  function rebuildTiles(tiles) {
    const THREE = window.THREE;
    // Crude rebuild for simplicity (only 4 tiles initially, scales fine for hundreds)
    while (tileGroup.children.length) {
      const c = tileGroup.children.pop();
      c.geometry?.dispose?.();
      if (Array.isArray(c.material)) c.material.forEach(m => m.dispose?.());
      else c.material?.dispose?.();
    }
    while (itemGroup.children.length) {
      const c = itemGroup.children.pop();
      c.traverse?.(n => {
        n.geometry?.dispose?.();
        if (Array.isArray(n.material)) n.material.forEach(m => m.dispose?.());
        else n.material?.dispose?.();
      });
    }

    tiles.forEach(t => {
      // Tile
      const mat = TILE_MATERIALS[t.type] || TILE_MATERIALS.soil_barren;
      const isWater = (t.type === 'water_murky');
      const tileGeo = new THREE.BoxGeometry(TILE * 0.98, TILE_H, TILE * 0.98);
      const tileMat = new THREE.MeshStandardMaterial({
        color: mat.color,
        roughness: mat.rough ?? 0.9,
        metalness: 0.0,
      });
      // Subtle vertex jitter for low-poly feel
      const pos = tileGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0) {
          const jx = (Math.sin(t.x * 9.3 + t.z * 3.7 + i) * 0.03);
          const jz = (Math.cos(t.x * 7.1 + t.z * 5.9 + i) * 0.03);
          pos.setY(i, pos.getY(i) + jx * 0.5 + jz * 0.2);
        }
      }
      tileGeo.computeVertexNormals();
      const mesh = new THREE.Mesh(tileGeo, tileMat);
      mesh.position.set(t.x * TILE, 0, t.z * TILE);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.userData.x = t.x;
      mesh.userData.z = t.z;
      mesh.userData.isWater = isWater;
      tileGroup.add(mesh);

      // Tile detail — cracks for cracked, glow specks for toxic etc.
      if (t.type === 'soil_toxic') {
        const glow = new THREE.PointLight(0x9bcc6a, 0.25, 1.5, 1.5);
        glow.position.set(t.x * TILE, 0.05, t.z * TILE);
        tileGroup.add(glow);
      }
      if (t.type === 'brick_ruin') {
        // Small bumps to simulate broken brick
        for (let i = 0; i < 3; i++) {
          const bg = new THREE.BoxGeometry(0.12, 0.06, 0.16);
          const bm = new THREE.MeshStandardMaterial({ color: 0x6a3a26, roughness: 0.9 });
          const bb = new THREE.Mesh(bg, bm);
          bb.position.set(t.x * TILE + (i - 1) * 0.22, 0.12, t.z * TILE - 0.15);
          bb.rotation.y = (i - 1) * 0.4;
          tileGroup.add(bb);
        }
      }
      if (t.type === 'soil_cracked') {
        const cg = new THREE.PlaneGeometry(0.85, 0.04);
        const cm = new THREE.MeshBasicMaterial({ color: 0x0a0604, transparent: true, opacity: 0.65 });
        const c1 = new THREE.Mesh(cg, cm);
        c1.rotation.x = -Math.PI / 2;
        c1.position.set(t.x * TILE, 0.091, t.z * TILE);
        c1.rotation.z = 0.4;
        tileGroup.add(c1);
        const c2 = new THREE.Mesh(cg, cm);
        c2.rotation.x = -Math.PI / 2;
        c2.position.set(t.x * TILE, 0.091, t.z * TILE + 0.15);
        c2.rotation.z = -0.6;
        tileGroup.add(c2);
      }

      // Item on tile
      if (t.item) {
        const m = buildItem(t.item, t.x, t.z);
        if (m) itemGroup.add(m);
      }
    });
  }

  function buildItem(id, x, z) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    g.position.set(x * TILE, 0.09, z * TILE);

    const ironMat = new THREE.MeshStandardMaterial({ color: 0x4a4036, roughness: 0.7, metalness: 0.6 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x6a3c28, roughness: 0.95, metalness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.95 });

    if (id === 'desk_iron') {
      // Desktop
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.5), ironMat);
      top.position.y = 0.36;
      top.castShadow = true; top.receiveShadow = true;
      g.add(top);
      // Legs
      [[-0.30, -0.20], [0.30, -0.20], [-0.30, 0.20], [0.30, 0.20]].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.04), ironMat);
        leg.position.set(px, 0.18, pz);
        leg.castShadow = true;
        g.add(leg);
      });
      // Book on desk
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.14), new THREE.MeshStandardMaterial({ color: 0x8a5635, roughness: 0.9 }));
      book.position.set(-0.18, 0.41, -0.05);
      book.rotation.y = 0.2;
      book.castShadow = true;
      g.add(book);
      // Paper
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.16), new THREE.MeshStandardMaterial({ color: 0xc8b896, roughness: 1.0 }));
      paper.position.set(0.10, 0.39, 0.04);
      g.add(paper);
      // Pen
      const pen = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.4, metalness: 0.4 }));
      pen.position.set(0.12, 0.40, -0.08);
      pen.rotation.y = 0.5;
      g.add(pen);
      // Small lamp
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.04, 8), ironMat);
      lampBase.position.set(0.25, 0.41, -0.18);
      g.add(lampBase);
      const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.10, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.9, side: THREE.DoubleSide }));
      lampShade.position.set(0.25, 0.52, -0.18);
      g.add(lampShade);
      const lampLight = new THREE.PointLight(0xffd49a, 0.4, 1.4, 1.2);
      lampLight.position.set(0.25, 0.46, -0.18);
      g.add(lampLight);
    } else if (id === 'chair_iron') {
      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.34), ironMat);
      seat.position.y = 0.24;
      seat.castShadow = true;
      g.add(seat);
      // Back
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.05), ironMat);
      back.position.set(0, 0.45, -0.15);
      back.castShadow = true;
      g.add(back);
      // Legs
      [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), ironMat);
        leg.position.set(px, 0.12, pz);
        g.add(leg);
      });
    } else if (id === 'shelf_rust') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.25), rustMat);
      body.position.y = 0.42;
      body.castShadow = true;
      g.add(body);
      // Shelves (lines)
      for (let i = 0; i < 3; i++) {
        const sh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.27), ironMat);
        sh.position.set(0, 0.22 + i * 0.2, 0);
        g.add(sh);
      }
    } else if (id === 'bed_iron') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), ironMat);
      base.position.y = 0.13;
      base.castShadow = true;
      g.add(base);
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.46), new THREE.MeshStandardMaterial({ color: 0x4a3a32, roughness: 0.95 }));
      mattress.position.y = 0.22;
      g.add(mattress);
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0x8a7c66, roughness: 0.95 }));
      pillow.position.set(-0.22, 0.27, 0);
      g.add(pillow);
    } else if (id === 'lamp_broken') {
      // Bent street lamp
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 6), ironMat);
      post.position.y = 0.6;
      post.rotation.z = 0.25;
      post.castShadow = true;
      g.add(post);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.18), ironMat);
      head.position.set(-0.3, 1.05, 0);
      g.add(head);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd49a, emissive: 0xffa860, emissiveIntensity: 1.0 }));
      bulb.position.set(-0.3, 0.97, 0);
      g.add(bulb);
      const ll = new THREE.PointLight(0xffb060, 0.6, 4, 1.5);
      ll.position.set(-0.3, 0.97, 0);
      g.add(ll);
    } else if (id === 'drum_oil') {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 12), rustMat);
      drum.position.y = 0.30;
      drum.castShadow = true;
      g.add(drum);
      // bands
      const band1 = new THREE.Mesh(new THREE.TorusGeometry(0.181, 0.012, 6, 24), ironMat);
      band1.position.y = 0.35;
      band1.rotation.x = Math.PI/2;
      g.add(band1);
      const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.181, 0.012, 6, 24), ironMat);
      band2.position.y = 0.18;
      band2.rotation.x = Math.PI/2;
      g.add(band2);
    } else if (id === 'shack_scrap') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.55, 0.78), woodMat);
      base.position.y = 0.31; base.castShadow = true; g.add(base);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.3, 4), rustMat);
      roof.position.y = 0.75; roof.rotation.y = Math.PI/4; g.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.02), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.95 }));
      door.position.set(0, 0.20, 0.40); g.add(door);
    } else if (id === 'warehouse_rust') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.62, 0.85), rustMat);
      base.position.y = 0.34; base.castShadow = true; g.add(base);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.9), ironMat);
      roof.position.y = 0.68; g.add(roof);
    } else if (id === 'field_barren') {
      // Rows of dirt
      for (let i = 0; i < 3; i++) {
        const row = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.16), new THREE.MeshStandardMaterial({ color: 0x2a2014, roughness: 1.0 }));
        row.position.set(0, 0.10, -0.25 + i * 0.25);
        g.add(row);
      }
    } else if (id === 'moss_gray') {
      for (let i = 0; i < 4; i++) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0x5a6450, roughness: 1.0 }));
        c.position.set((Math.random() - 0.5) * 0.6, 0.06, (Math.random() - 0.5) * 0.6);
        c.scale.y = 0.4;
        g.add(c);
      }
    } else if (id === 'potato_waste') {
      // Sprouts
      for (let i = 0; i < 3; i++) {
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.02), new THREE.MeshStandardMaterial({ color: 0x4a4a2a, roughness: 1.0 }));
        stem.position.set(-0.18 + i * 0.18, 0.18, 0);
        g.add(stem);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 1.0 }));
        leaf.position.set(-0.18 + i * 0.18, 0.26, 0);
        leaf.scale.y = 0.4;
        g.add(leaf);
      }
    } else if (id === 'iron_rust') {
      const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: 0x5a3826, roughness: 0.7, metalness: 0.55 }));
      r1.position.set(-0.1, 0.18, 0);
      r1.castShadow = true;
      g.add(r1);
      const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: 0x6a4232, roughness: 0.7, metalness: 0.5 }));
      r2.position.set(0.15, 0.13, 0.1);
      g.add(r2);
    } else {
      // Generic placeholder
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x6a5040 }));
      box.position.y = 0.25;
      g.add(box);
    }

    return g;
  }

  // ---------- Weather ----------
  function mixHex(THREE, a, b, t) {
    const clamped = Math.max(0, Math.min(1, t));
    const c = new THREE.Color(a);
    c.lerp(new THREE.Color(b), clamped);
    return c.getHex();
  }

  function applyWeather(timeOfDay, season = 'spring', weatherMode = 'clear') {
    const THREE = window.THREE;
    const key = WEATHER[timeOfDay] ? timeOfDay : 'night';
    const w = WEATHER[key] || WEATHER.night;

    const SEASON = {
      spring: { tint: 0xb9d99b, sky: 0.06, ground: 0.08, fog: 0.002 },
      summer: { tint: 0xe0cb93, sky: 0.04, ground: 0.06, fog: -0.003 },
      autumn: { tint: 0xd79a67, sky: 0.09, ground: 0.12, fog: 0.006 },
      winter: { tint: 0xc2d9ee, sky: 0.11, ground: 0.18, fog: 0.01 },
    };
    const MODE = {
      clear:  { tint: 0xffffff, sky: 0.00, fog: 0.000, sun: 1.00, ambient: 1.00, star: 1.00, groundSnow: 0.00 },
      cloudy: { tint: 0x95a0ad, sky: 0.24, fog: 0.014, sun: 0.62, ambient: 0.95, star: 0.25, groundSnow: 0.00 },
      rain:   { tint: 0x74889b, sky: 0.34, fog: 0.024, sun: 0.45, ambient: 0.90, star: 0.00, groundSnow: 0.00 },
      storm:  { tint: 0x5d6d83, sky: 0.45, fog: 0.038, sun: 0.28, ambient: 0.84, star: 0.00, groundSnow: 0.00 },
      snow:   { tint: 0xd1e0f0, sky: 0.30, fog: 0.026, sun: 0.55, ambient: 1.04, star: 0.00, groundSnow: 0.26 },
    };
    const s = SEASON[season] || SEASON.spring;
    const m = MODE[weatherMode] || MODE.clear;

    let skyTop = mixHex(THREE, w.sky[0], s.tint, s.sky);
    let skyMid = mixHex(THREE, w.sky[1], s.tint, s.sky * 0.7);
    let skyBot = mixHex(THREE, w.sky[2], s.tint, s.sky * 0.5);
    skyTop = mixHex(THREE, skyTop, m.tint, m.sky);
    skyMid = mixHex(THREE, skyMid, m.tint, m.sky * 0.8);
    skyBot = mixHex(THREE, skyBot, m.tint, m.sky * 0.7);

    let fogColor = mixHex(THREE, w.fog[0], s.tint, s.sky * 0.65);
    fogColor = mixHex(THREE, fogColor, m.tint, m.sky * 0.7);
    const fogDensity = Math.max(0.005, w.fog[1] + s.fog + m.fog);

    const sunColor = mixHex(THREE, w.sun[0], m.tint, m.sky * 0.3);
    const sunIntensity = Math.max(0.05, w.sun[1] * m.sun);
    const ambientColor = mixHex(THREE, w.ambient[0], s.tint, s.sky * 0.5);
    const ambientIntensity = Math.max(0.1, w.ambient[1] * m.ambient);
    const groundColor = mixHex(THREE, mixHex(THREE, w.ground, s.tint, s.ground), 0xe5edf4, m.groundSnow);

    // Sky
    if (skyMesh && skyMesh.material.uniforms) {
      skyMesh.material.uniforms.topColor.value.setHex(skyTop);
      skyMesh.material.uniforms.midColor.value.setHex(skyMid);
      skyMesh.material.uniforms.bottomColor.value.setHex(skyBot);
    }
    // Fog
    if (scene.fog) {
      scene.fog.color.setHex(fogColor);
      scene.fog.density = fogDensity;
    }
    scene.background = new THREE.Color(fogColor);
    // Sun
    if (sunLight) {
      sunLight.color.setHex(sunColor);
      sunLight.intensity = sunIntensity;
      sunLight.position.set(w.sun[2][0], w.sun[2][1], w.sun[2][2]);
    }
    // Ambient
    if (ambientLight) {
      ambientLight.color.setHex(ambientColor);
      ambientLight.intensity = ambientIntensity;
    }
    // Stars
    if (stars && stars.material.uniforms) {
      const starOpacity = Math.max(0, Math.min(1, w.star * m.star));
      stars.material.uniforms.opacity.value = starOpacity;
      stars.material.uniforms.tint.value.setHex(key === 'night_starry' ? 0xe8e8ff : 0xa0b8d0);
    }
    // Ground
    const ground = scene.userData.ground;
    if (ground) ground.material.color.setHex(groundColor);

    // Black sun visible only for 'collapse'
    if (blackSun) {
      blackSun.material.opacity = (key === 'collapse') ? 1.0 : 0.0;
      blackSun.userData.halo.material.opacity = (key === 'collapse') ? 0.5 : 0.0;
    }

    // Adjust hemi
    if (hemiLight) {
      if (w.mood === 'star') {
        hemiLight.color.setHex(mixHex(THREE, 0x9ab8e0, s.tint, 0.18)); hemiLight.intensity = 0.5;
      } else if (w.mood === 'abyss') {
        hemiLight.color.setHex(mixHex(THREE, 0x60b0c0, s.tint, 0.14)); hemiLight.intensity = 0.7;
      } else if (w.mood === 'warm' || w.mood === 'red') {
        hemiLight.color.setHex(mixHex(THREE, 0xe8a070, s.tint, 0.2)); hemiLight.intensity = 0.5;
      } else if (w.mood === 'void') {
        hemiLight.color.setHex(0x301812); hemiLight.intensity = 0.3;
      } else {
        hemiLight.color.setHex(mixHex(THREE, 0x6080a0, s.tint, 0.16)); hemiLight.intensity = 0.4;
      }
    }
  }

  // ---------- Public API ----------
  window.World = {
    init,
    setSitting,
    setPlacement,
    onPlacementChange: (fn) => { placementChangeHandler = fn; },
    getCharPos: () => ({ x: charPos.x, z: charPos.z }),
    setCharPos: (x, z) => { charPos.x = x; charPos.z = z; },
  };
})();
