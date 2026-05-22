/* ============================================================
   World — three.js low-poly scene
   廃都市の中の小さな美しい世界
   ============================================================ */

(function () {
  const TILE = 1.0;          // world units per tile
  const TILE_H = 0.86;       // tile thickness (Minecraft-style cube blocks)
  const TILE_BODY_H = 0.80;  // dark earth body — tall for visible cube sides
  const TILE_CAP_H = 0.06;   // colored top cap thickness
  const FURNITURE_H = 0.45;  // character landing height on furniture tops
  const BED_SLEEP_Y = 0.09;  // character group Y while sleeping on bed
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
      sun: [0x180806, 0.6, [6, 10, 4]],
      ambient: [0x180806, 0.3],
      ground: 0x0a0604,
      star: 0,
      mood: 'void',
    },
    blood_moon: {
      label: 'Blood Moon',
      sky: [0x250405, 0x140203, 0x060101],
      fog: [0x1c0203, 0.06],
      sun: [0xdd1a08, 0.55, [5, 8, 5]],
      ambient: [0x380808, 0.4],
      ground: 0x120202,
      star: 0.3,
      mood: 'red',
    },
  };

  // ---------- Tile materials ----------
  const TILE_MATERIALS = {
    soil_barren:  { color: 0x8e6d48, rough: 0.93 },
    soil_ash:     { color: 0x8f887d, rough: 0.88 },
    soil_toxic:   { color: 0x5f6f55, rough: 0.92 },
    soil_cracked: { color: 0x6a5a48, rough: 0.93 },
    path_broken:  { color: 0x615c56, rough: 0.9 },
    water_murky:  { color: 0x4b6468, rough: 0.34, transmission: 0.35 },
    brick_ruin:   { color: 0x855a4a, rough: 0.88 },
    field_barren: { color: 0x3a2e1e, rough: 0.95 },
  };

  // ---------- Three.js / scene ----------
  let renderer, scene, camera;
  let sunLight, ambientLight, hemiLight;
  let skyMesh;
  let stars;
  let tileGroup, itemGroup;
  let charGroup, charBody, charHairFront, charSitting = false, charSleeping = false;
  let _promptVec = null;  // THREE.Vector3, allocated once in init()
  let _promptPrev = null; // last value sent to React, avoids re-render when unchanged
  let pinpointLight; // light over character
  let blackSun;      // for collapse weather
  let bloodMoon;     // for blood_moon weather
  let waterTime = 0;
  let _lastCropTick = 0;
  let _cropTimerPrev = null;

  // Internal state cache
  let tilesCache = []; // last rendered tiles list for diffing
  let chairTiles = []; // cached chair_iron positions, updated when tiles change
  let shelfTiles = []; // cached shelf_rust positions, updated when tiles change
  let bedTiles = [];   // cached bed_iron positions, updated when tiles change
  let sleepBedPos = null;
  let sitChairPos = null;
  let weatherKey = null;
  let timeOfDayKey = null;
  let seasonKey = null;
  let weatherModeKey = null;
  let raf = null;
  let placement = null; // { category, id } when in placement mode
  let placementGhost = null;
  let placementRotation = 0; // 0-3 → 0/90/180/270 degrees (R key cycles)
  let removeMode = false;
  let removePreview = null;
  let charVelY = 0;          // vertical velocity (fall + jump)
  let charY = 0;             // current Y of charGroup
  let charOnGround = true;   // standing on a tile
  let charJumping = false;   // true when jump was initiated (allows mid-air movement)
  let raycaster = null;
  let mouseNDC = { x: NaN, y: NaN };
  let charPos = { x: 0, z: 0 };
  let charPosVisual = { x: 0, z: 0 }; // smoothed
  let charYaw = 0;
  let charYawVisual = 0;
  let cameraTarget = { x: 0.5, z: 0.5 }; // looking at scene center
  const CAMERA_PRESETS = {
    topdown: { dist: 0.01, height: 22, yaw: 0 },
    isometric: { dist: 13, height: 10, yaw: -0.78 },
    soft: { dist: 10, height: 7.2, yaw: -0.62 },
    perspective: { dist: 14, height: 9, yaw: -0.55 },
    fp: { dist: 0, height: 1.05, yaw: 0 },
  };
  const CAMERA_DEFAULT_FOV = 38;
  const CAMERA_DEFAULT_NEAR = 0.1;
  const CAMERA_FP_FOV = 58;
  const CAMERA_FP_NEAR = 0.02;
  let cameraMode = 'perspective';
  let cameraOffset = { ...CAMERA_PRESETS.perspective };
  let cameraModeChangeHandler = null;
  let cameraFocusOverride = null;
  let specialWeatherKey = null;
  let developerOverlayEnabled = false;
  let developerOverlayEl = null;
  let developerOverlayChangeHandler = null;
  let overlayFrameCounter = 0;
  let overlayLastFpsSampleAt = 0;
  let overlayFps = 0;
  let overlayMaterialCount = 0;
  let overlayProgramCount = 0;
  let overlayLastHeavySampleAt = 0;
  let removeModeChangeHandler = null;

  // Keys
  const keys = { w: false, a: false, s: false, d: false, shift: false };

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

    _promptVec = new THREE.Vector3();
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

    // Blood moon (blood_moon weather only)
    const bMoonGeo = new THREE.CircleGeometry(3.2, 48);
    const bMoonMat = new THREE.MeshBasicMaterial({ color: 0xcc1a0a, transparent: true, opacity: 0 });
    bloodMoon = new THREE.Mesh(bMoonGeo, bMoonMat);
    bloodMoon.position.set(10, 15, -18);
    bloodMoon.lookAt(0, 0, 0);
    scene.add(bloodMoon);
    const bHaloGeo = new THREE.RingGeometry(3.3, 5.0, 64);
    const bHaloMat = new THREE.MeshBasicMaterial({ color: 0x880806, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const bHalo = new THREE.Mesh(bHaloGeo, bHaloMat);
    bHalo.position.copy(bloodMoon.position);
    bHalo.lookAt(0, 0, 0);
    scene.add(bHalo);
    bloodMoon.userData.halo = bHalo;

    // Ground (extends beyond grid for context)
    const groundGeo = new THREE.PlaneGeometry(60, 60, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x14110c, roughness: 1.0, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.82;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.userData.ground = ground;

    // Groups
    tileGroup = new THREE.Group();
    scene.add(tileGroup);
    itemGroup = new THREE.Group();
    scene.add(itemGroup);

    // Character — build immediately with fallback colors, then rebuild with skin textures
    charGroup = buildCharacter(THREE, null, null);
    scene.add(charGroup);
    {
      const loaded = {};
      const loader = new THREE.TextureLoader();
      const tryRebuild = () => {
        if (!loaded.face || !loaded.outfit) return;
        scene.remove(charGroup);
        charGroup = buildCharacter(THREE, loaded.face, loaded.outfit);
        scene.add(charGroup);
      };
      loader.load('skin/face/1.png', (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        loaded.face = tex;
        tryRebuild();
      });
      loader.load('skin/outfit/1.png', (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        loaded.outfit = tex;
        tryRebuild();
      });
    }

    // Initial render
    syncFromStore(window.Store.get());
    // Sync char position once at startup only
    const initPos = window.Store.get().character.position;
    charPos.x = initPos.x; charPos.z = initPos.z;
    charPosVisual.x = charPos.x; charPosVisual.z = charPos.z;

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

      // Interaction prompt (chair / shelf) — uses cached tiles, no Store.get() per frame
      if (_promptVec && window.setInteractionPrompt) {
        const _onChair = !charSitting && !charSleeping && chairTiles.some(t =>
          Math.abs(charPos.x - t.x * TILE) < TILE / 2 &&
          Math.abs(charPos.z - t.z * TILE) < TILE / 2
        );
        const _onShelf = !charSitting && !charSleeping && shelfTiles.some(t =>
          Math.abs(charPos.x - t.x * TILE) < TILE / 2 &&
          Math.abs(charPos.z - t.z * TILE) < TILE / 2
        );
        const _onBed = !charSitting && !charSleeping && bedTiles.some(t =>
          Math.abs(charPos.x - t.x * TILE) < TILE / 2 &&
          Math.abs(charPos.z - t.z * TILE) < TILE / 2
        );
        const _show = _onChair || _onShelf || _onBed || charSitting || charSleeping;
        if (_show) {
          _promptVec.set(charGroup.position.x, charGroup.position.y + 1.05, charGroup.position.z);
          _promptVec.project(camera);
          if (_promptVec.z < 1) {
            const _c = renderer.domElement;
            const _sx = Math.round((_promptVec.x *  0.5 + 0.5) * _c.clientWidth);
            const _sy = Math.round((_promptVec.y * -0.5 + 0.5) * _c.clientHeight);
            const _label = charSleeping ? '起きる' : (charSitting ? '立つ' : (_onBed ? '寝る' : (_onShelf ? '棚を使う' : '座る')));
            // Only update React state when values actually change
            if (!_promptPrev || _promptPrev.x !== _sx || _promptPrev.y !== _sy || _promptPrev.label !== _label) {
              _promptPrev = { key: 'E', label: _label, x: _sx, y: _sy };
              window.setInteractionPrompt(_promptPrev);
            }
          }
        } else if (_promptPrev !== null) {
          _promptPrev = null;
          window.setInteractionPrompt(null);
        }
      }

      // Walk / run animation
      const moving = keys.w || keys.a || keys.s || keys.d;
      const running = moving && keys.shift;
      if (charGroup && !charSitting && !charSleeping) {
        const parts = charGroup.userData.parts;
        if (moving) {
          const freq = running ? 0.022 : 0.012;
          const amp  = running ? 0.70  : 0.50;
          const swing = Math.sin(now * freq) * amp;
          const bobY  = Math.abs(Math.sin(now * freq)) * 0.03;
          if (charBody) charBody.position.y = 0.504 + bobY;
          if (parts) {
            if (parts.legL) parts.legL.rotation.x =  swing;
            if (parts.legR) parts.legR.rotation.x = -swing;
            if (parts.armL) parts.armL.rotation.x = -swing;
            if (parts.armR) parts.armR.rotation.x =  swing;
          }
        } else {
          if (charBody) charBody.position.y = 0.504;
          if (parts) {
            if (parts.legL) parts.legL.rotation.x = 0;
            if (parts.legR) parts.legR.rotation.x = 0;
            if (parts.armL) parts.armL.rotation.x = 0;
            if (parts.armR) parts.armR.rotation.x = 0;
          }
        }
      }

      // Unified Y physics — jump + furniture landing + fall + respawn
      {
        const fs = window.Store.get();
        const tiles = fs.world.tiles;
        if (charSleeping) {
          charY = BED_SLEEP_Y;
          charVelY = 0;
          charOnGround = true;
          charJumping = false;
        } else {
          const overTile = charSitting || tiles.some(t =>
            Math.abs(charPos.x - t.x * TILE) < 0.50 && Math.abs(charPos.z - t.z * TILE) < 0.50
          );
          const furnitureSurf = () => !charSitting && charY > 0 && tiles.some(t =>
            t.item && Math.abs(charPos.x - t.x * TILE) < 0.36 && Math.abs(charPos.z - t.z * TILE) < 0.36
          );
          const landH = furnitureSurf() ? FURNITURE_H : 0;
          if (overTile && charY <= landH && charVelY <= 0) {
            charY = landH; charVelY = 0; charOnGround = true; charJumping = false;
          } else {
            charVelY -= 14 * dt;
            charY += charVelY * dt;
            const lh = furnitureSurf() ? FURNITURE_H : 0;
            if (overTile && charY <= lh && charVelY < 0) {
              charY = lh; charVelY = 0; charOnGround = true; charJumping = false;
            } else {
              charOnGround = false;
            }
            if (charY < -5) {
              const spawn = fs.world.spawnTile || { x: 0, z: 0 };
              const spawnTile = tiles.find(t => t.x === spawn.x && t.z === spawn.z);
              const fallback = spawnTile || tiles.find(t => !t.item) || tiles[0];
              if (fallback) {
                charPos.x = fallback.x * TILE;
                charPos.z = fallback.z * TILE;
                charPosVisual.x = charPos.x;
                charPosVisual.z = charPos.z;
                window.Store.setCharacterPos(charPos.x, charPos.z);
              }
              charY = 0; charVelY = 0; charOnGround = true; charJumping = false;
            }
          }
        }
        charGroup.position.y = charY;
      }

      // Water ripple
      waterTime += dt;
      tileGroup.children.forEach(t => {
        if (t.userData.isWater) {
          const baseY = Number.isFinite(t.userData.baseY) ? t.userData.baseY : -0.04;
          t.position.y = baseY + (Math.sin(waterTime * 1.4 + t.userData.x * 0.7 + t.userData.z * 0.5) * 0.012);
        }
      });

      // Stars twinkle
      if (stars && stars.material.uniforms) {
        stars.material.uniforms.time.value = waterTime;
      }

      // Camera follows character softly unless a temporary focus target is active.
      if (cameraFocusOverride && now < cameraFocusOverride.until) {
        cameraTarget.x += (cameraFocusOverride.x - cameraTarget.x) * 0.09;
        cameraTarget.z += (cameraFocusOverride.z - cameraTarget.z) * 0.09;
      } else {
        cameraFocusOverride = null;
        cameraTarget.x += ((charPosVisual.x) - cameraTarget.x) * 0.04;
        cameraTarget.z += ((charPosVisual.z) - cameraTarget.z) * 0.04;
      }
      updateCameraPos();
      updateRemovePreview();

      // Pinpoint light follows
      pinpointLight.position.set(charPosVisual.x, 2.2, charPosVisual.z + 0.2);

      // Crop auto-advance + timer overlay (throttled to every 5s)
      const nowMs = Date.now();
      if (nowMs - _lastCropTick > 5000) {
        _lastCropTick = nowMs;
        const cropState = window.Store.get();
        const STAGE_MS = 450000; // 7.5 min per stage → 15 min total
        (cropState.world.tiles || []).forEach(t => {
          if (!t.cropPlantedAt) return;
          const elapsed = nowMs - t.cropPlantedAt;
          if (t.item === 'potato_field_0' && elapsed >= STAGE_MS) window.Store.advanceCrop(t.x, t.z);
          else if (t.item === 'potato_field_50' && elapsed >= STAGE_MS * 2) window.Store.advanceCrop(t.x, t.z);
        });
      }
      if (window.setCropTimers) {
        const cropState2 = window.Store.get();
        const timers = [];
        const tilesForTimer = cropState2.world.tiles || [];
        const oreCatalogMap = window.Store?.CATALOG_MAP || {};

        const projectTimerPos = (x, z, y = 0.9) => {
          _promptVec.set(x * TILE, y, z * TILE);
          _promptVec.project(camera);
          const c = renderer.domElement;
          return {
            x: Math.round((_promptVec.x * 0.5 + 0.5) * c.clientWidth),
            y: Math.round((_promptVec.y * -0.5 + 0.5) * c.clientHeight)
          };
        };

        // Farming timers
        tilesForTimer.forEach(t => {
          if (!t.cropPlantedAt) return;
          if (t.item !== 'potato_field_0' && t.item !== 'potato_field_50' && t.item !== 'potato_field_100') return;

          const pos = projectTimerPos(t.x, t.z, 0.9);
          if (t.item === 'potato_field_100') {
            timers.push({ ...pos, label: '採取可能', ready: true });
            return;
          }

          const elapsed = nowMs - t.cropPlantedAt;
          const TOTAL_MS = 900000; // 15 min total (0% → 100%)
          const remaining = Math.max(0, TOTAL_MS - elapsed);
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          timers.push({ ...pos, label: `${mins}:${secs.toString().padStart(2, '0')}` });
        });

        // Ore timers (same UX as farming)
        tilesForTimer.forEach(t => {
          const oreDef = oreCatalogMap[t.item];
          if (!oreDef || oreDef.category !== 'ore' || !oreDef.harvestMin) return;

          const totalMs = oreDef.harvestMin * 60000;
          const placedAt = Number(t.orePlacedAt || 0);
          const elapsed = placedAt > 0 ? (nowMs - placedAt) : totalMs;
          const remaining = Math.max(0, totalMs - elapsed);
          const pos = projectTimerPos(t.x, t.z, 0.9);

          if (remaining <= 0) {
            timers.push({ ...pos, label: '採取可能', ready: true });
            return;
          }

          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          timers.push({ ...pos, label: `${mins}:${secs.toString().padStart(2, '0')}` });
        });

        const sig = JSON.stringify(timers);
        if (sig !== _cropTimerPrev) {
          _cropTimerPrev = sig;
          window.setCropTimers(timers);
        }
      }

      renderer.render(scene, camera);
      updateDeveloperOverlay(now);
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
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('click', onCanvasClick);
    updateCanvasCursor();

    // Subscribe to state changes
    window.Store.subscribe(syncFromStore);
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function updateCanvasCursor() {
    const canvas = renderer?.domElement;
    if (!canvas) return;
    if (removeMode) {
      canvas.style.cursor = 'crosshair';
      return;
    }
    if (placement) {
      canvas.style.cursor = 'copy';
      return;
    }
    canvas.style.cursor = '';
  }

  function getTileAtCell(cell, worldState = window.Store.get()) {
    if (!cell || !worldState?.world?.tiles) return null;
    return worldState.world.tiles.find(t => t.x === cell.x && t.z === cell.z) || null;
  }

  function getRemoveTargetAtCell(cell, worldState = window.Store.get()) {
    const tile = getTileAtCell(cell, worldState);
    if (!tile) return null;
    if (tile.item) {
      return { valid: true, kind: 'item', tile };
    }
    if (window.Store?.isStarterTileProtected?.(tile.x, tile.z)) {
      return { valid: false, kind: 'tile', reason: 'protected_tile', tile };
    }
    const tileCount = worldState?.world?.tiles?.length || 0;
    if (tileCount <= 1) {
      return { valid: false, kind: 'tile', reason: 'last_tile', tile };
    }
    return { valid: true, kind: 'tile', tile };
  }

  function ensureRemovePreview() {
    if (removePreview || !scene || !window.THREE) return removePreview;
    const THREE = window.THREE;
    const group = new THREE.Group();
    group.visible = false;
    group.renderOrder = 95;

    const fillMat = new THREE.MeshBasicMaterial({
      color: 0xff6b58,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(TILE * 0.9, TILE * 0.9), fillMat);
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.001;
    fill.renderOrder = 95;
    group.add(fill);

    const totalBlockH = TILE_BODY_H + TILE_CAP_H;
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(TILE * 0.98, totalBlockH, TILE * 0.98));
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xff9a74,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const edge = new THREE.LineSegments(edgeGeo, edgeMat);
    edge.renderOrder = 96;
    group.add(edge);

    group.userData.fillMat = fillMat;
    group.userData.edgeMat = edgeMat;
    group.userData.blockEdge = edge;
    scene.add(group);
    removePreview = group;
    return removePreview;
  }

  function updateRemovePreview() {
    const preview = ensureRemovePreview();
    if (!preview) return;
    if (!removeMode || placement || !raycaster || !camera) {
      preview.visible = false;
      return;
    }
    const cell = getHoveredCell();
    const target = getRemoveTargetAtCell(cell);
    if (!cell || !target) {
      preview.visible = false;
      return;
    }

    const isItem = target.kind === 'item';
    const valid = !!target.valid;
    const groupY = isItem ? 0.14 : 0.11;
    preview.position.set(cell.x * TILE, groupY, cell.z * TILE);
    preview.visible = true;

    // Block center world Y = (-0.77 + 0.09) / 2 = -0.34
    const blockEdge = preview.userData.blockEdge;
    if (blockEdge) blockEdge.position.y = -0.34 - groupY;

    const fillMat = preview.userData.fillMat;
    const edgeMat = preview.userData.edgeMat;
    if (!fillMat || !edgeMat) return;

    if (!valid) {
      fillMat.color.set(0x5f4b46);
      fillMat.opacity = 0.14;
      edgeMat.color.set(0x8a6d63);
      edgeMat.opacity = 0.52;
      return;
    }

    if (isItem) {
      fillMat.color.set(0xffa060);
      fillMat.opacity = 0.26;
      edgeMat.color.set(0xffc08d);
      edgeMat.opacity = 0.98;
    } else {
      fillMat.color.set(0xff6754);
      fillMat.opacity = 0.22;
      edgeMat.color.set(0xff8b76);
      edgeMat.opacity = 0.95;
    }
  }

  function onKeyDown(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    const k = e.key.toLowerCase();
    if (window.shelfStorageOpen) {
      if (k === 'e' || k === 'escape') e.preventDefault();
      return;
    }
    if (charSleeping && k !== 'e') {
      if (k === 'escape') e.preventDefault();
      return;
    }
    if (k === 'w' || k === 'arrowup')    { keys.w = true; e.preventDefault(); }
    if (k === 's' || k === 'arrowdown')  { keys.s = true; e.preventDefault(); }
    if (k === 'a' || k === 'arrowleft')  { keys.a = true; e.preventDefault(); }
    if (k === 'd' || k === 'arrowright') { keys.d = true; e.preventDefault(); }
    if (e.key === 'Shift') keys.shift = true;
    if (e.code === 'Space' && charOnGround && !charSitting && !charSleeping) {
      charVelY = 5.0;
      charOnGround = false;
      charJumping = true;
      e.preventDefault();
    }
    if (k === 'e') {
      if (charSleeping) {
        setSleeping(false);
      } else if (charSitting) {
        setSitting(false);
      } else {
        const st = window.Store.get();
        const nearbyChair = st.world.tiles.find(t =>
          t.item === 'chair_iron' &&
          Math.abs(charPos.x - t.x * TILE) < TILE / 2 &&
          Math.abs(charPos.z - t.z * TILE) < TILE / 2
        );
        const nearbyShelf = st.world.tiles.find(t =>
          t.item === 'shelf_rust' &&
          Math.abs(charPos.x - t.x * TILE) < TILE / 2 &&
          Math.abs(charPos.z - t.z * TILE) < TILE / 2
        );
        const nearbyBed = st.world.tiles.find(t =>
          t.item === 'bed_iron' &&
          Math.abs(charPos.x - t.x * TILE) < TILE / 2 &&
          Math.abs(charPos.z - t.z * TILE) < TILE / 2
        );
        if (nearbyBed) setSleeping(true, nearbyBed);
        else if (nearbyChair) setSitting(true);
        else if (nearbyShelf) window.openShelfStorageAt?.(nearbyShelf.x, nearbyShelf.z);
        else window.toggleExtendedInventory?.();
      }
    }
  }
  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup')    keys.w = false;
    if (k === 's' || k === 'arrowdown')  keys.s = false;
    if (k === 'a' || k === 'arrowleft')  keys.a = false;
    if (k === 'd' || k === 'arrowright') keys.d = false;
    if (e.key === 'Shift') keys.shift = false;
    if (k === 'escape') {
      if (cameraMode === 'fp') {
        setCameraMode('perspective');
        window.toast?.('Walk表示を終了');
      }
      if (removeMode) {
        setRemoveModeEnabled(false, { silentToast: true });
      }
      setPlacement(null);
    }
    if (k === 'r' && placement) {
      placementRotation = (placementRotation + 1) % 4;
      if (placementGhost) placementGhost.rotation.y = -placementRotation * Math.PI / 2;
    }
  }

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    updateGhost();
    updateRemovePreview();
  }

  function onPointerLeave() {
    mouseNDC.x = NaN;
    mouseNDC.y = NaN;
    updateRemovePreview();
  }

  function getHoveredCell() {
    if (!raycaster || !camera) return null;
    if (!Number.isFinite(mouseNDC.x) || !Number.isFinite(mouseNDC.y)) return null;
    raycaster.setFromCamera(mouseNDC, camera);
    // Intersect virtual horizontal plane at tile surface y=0.09
    const plane = new (window.THREE.Plane)(new (window.THREE.Vector3)(0, 1, 0), -0.09);
    const pt = new (window.THREE.Vector3)();
    if (!raycaster.ray.intersectPlane(plane, pt)) return null;
    return { x: Math.round(pt.x / TILE), z: Math.round(pt.z / TILE) };
  }

  function updateGhost() {
    if (!placement || !placementGhost) return;
    const cell = getHoveredCell();
    if (!cell) return;

    const isTile = placement.category === 'tile';
    const isUsable = !!window.Store.CATALOG_MAP[placement.id]?.usable;
    if (placement.category === 'items') return;
    if (placement.category === 'carry' && !isUsable) return;
    const ghostY = isTile ? -(TILE_BODY_H / 2 - 0.03) : 0.09;
    placementGhost.position.set(cell.x * TILE, ghostY, cell.z * TILE);
    placementGhost.rotation.y = -placementRotation * Math.PI / 2;

    // Validity check
    const s = window.Store.get();
    const tile = s.world.tiles.find(t => t.x === cell.x && t.z === cell.z);
    let valid;
    if (isUsable) {
      const px = Math.round(charPos.x / TILE);
      const pz = Math.round(charPos.z / TILE);
      const playerTile = s.world.tiles.find(t => t.x === px && t.z === pz);
      if (placement.id === 'hoe_rust') valid = !!playerTile && playerTile.type === 'soil_barren' && !playerTile.item;
      else if (placement.id === 'pickaxe_rust') {
        valid = !!playerTile && playerTile.item === 'iron_rust';
        if (valid) {
          const needMs = Math.max(0, Math.round((window.Store.CATALOG_MAP.iron_rust?.harvestMin || 0) * 60000));
          const elapsed = Number(playerTile.orePlacedAt) ? (Date.now() - playerTile.orePlacedAt) : needMs;
          valid = elapsed >= needMs;
        }
      }
      else if (placement.id === 'potato_seed') valid = !!playerTile && playerTile.item === 'field_barren';
      else valid = false;
    } else if (isTile) {
      // Must be adjacent to an existing tile (or world is empty)
      const adjacent = s.world.tiles.length === 0 || s.world.tiles.some(t =>
        (Math.abs(t.x - cell.x) === 1 && t.z === cell.z) ||
        (t.x === cell.x && Math.abs(t.z - cell.z) === 1)
      );
      valid = adjacent;
    } else {
      const spawn = s.world.spawnTile || { x: 0, z: 0 };
      valid = !!tile && !tile.item && !(cell.x === spawn.x && cell.z === spawn.z);
    }
    placementGhost.userData.parts?.forEach(m => {
      if (m.material) m.material.opacity = valid ? 0.6 : 0.3;
    });
    if (placementGhost.userData.tint) {
      placementGhost.userData.tint.material.color.set(valid ? 0xc97b4a : 0xa64a3a);
    }
  }

  function onCanvasClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const cell = getHoveredCell();
    if (!cell) return;

    if (removeMode) {
      const removed = window.Store.removeAt(cell.x, cell.z);
      if (!removed || !removed.ok) {
        if (removed?.reason === 'last_tile') window.toast?.('最後のタイルは削除できません', 'warn');
        if (removed?.reason === 'protected_tile') window.toast?.('初期4タイルは削除できません', 'warn');
        if (removed?.reason === 'shelf_not_empty') window.toast?.('棚の中身を空にしてから削除してください', 'warn');
        updateRemovePreview();
        return;
      }
      window.toast?.('回収: ' + (removed.name || removed.id), 'success');
      updateRemovePreview();
      return;
    }

    // Harvest ripe crop when nothing is selected — acts on tile under player
    if (!placement) {
      const px = Math.round(charPos.x / TILE);
      const pz = Math.round(charPos.z / TILE);
      const sv = window.Store.get();
      const hvTile = sv.world.tiles.find(t => t.x === px && t.z === pz);
      if (hvTile?.item === 'potato_field_100') {
        if (window.Store.harvestCrop(px, pz)) window.toast?.('収穫: 廃土ポテト', 'success');
      }
      return;
    }

    // Held items (non-usable carry or materials): no world interaction
    const _isUsableItem = !!window.Store.CATALOG_MAP[placement.id]?.usable;
    if ((placement.category === 'carry' || placement.category === 'items') && !_isUsableItem) return;

    // Usable item use (hoe / seed) — acts on the tile under the player
    if (window.Store.CATALOG_MAP[placement.id]?.usable) {
      const px = Math.round(charPos.x / TILE);
      const pz = Math.round(charPos.z / TILE);
      const sv = window.Store.get();
      const useTile = sv.world.tiles.find(t => t.x === px && t.z === pz);
      if (placement.id === 'hoe_rust') {
        if (!useTile || useTile.type !== 'soil_barren' || useTile.item) {
          window.toast?.('荒土タイルの上に立って使用してください', 'error');
        } else if (window.Store.useHoeAt(px, pz, placement.slotIdx)) {
          const ns = window.Store.get();
          const hoe = placement.slotIdx !== undefined
            ? ns.carried?.hotbar?.[placement.slotIdx]
            : [...(ns.carried?.hotbar||[]),...(ns.carried?.bag||[])].find(sl=>sl?.id==='hoe_rust');
          const rem = hoe ? (hoe.uses !== undefined ? hoe.uses : hoe.count) : 0;
          window.toast?.('耕地化: 荒れた耕地' + (rem===0?' (クワが壊れた)':''), 'success');
          if (rem === 0) setPlacement(null);
        }
        return;
      }
      if (placement.id === 'pickaxe_rust') {
        if (!useTile || useTile.item !== 'iron_rust') {
          window.toast?.('錆鉄鉱石の上に立って使用してください', 'error');
        } else {
          const res = window.Store.usePickaxeAt(px, pz, placement.slotIdx);
          if (res?.ok) {
            const rem = Number(res.remainingUses || 0);
            window.toast?.('採取: 錆鉄片' + (rem === 0 ? ' (ピッケルが壊れた)' : ''), 'success');
            if (rem === 0) setPlacement(null);
          } else if (res?.reason === 'not_ready') {
            const sec = Math.max(0, Math.ceil((res.remainingMs || 0) / 1000));
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            window.toast?.(`まだ採取できません (${m}:${String(s).padStart(2, '0')})`, 'warn');
          } else if (res?.reason === 'no_pickaxe') {
            window.toast?.('ピッケルが見つかりません', 'warn');
            setPlacement(null);
          }
        }
        return;
      }
      if (placement.id === 'potato_seed') {
        if (!useTile || useTile.item !== 'field_barren') {
          window.toast?.('荒れた耕地の上に立って使用してください', 'error');
        } else if (window.Store.plantSeedAt(px, pz)) {
          const ns = window.Store.get();
          const cnt = ns.inventory?.farming?.potato_seed || 0;
          window.toast?.('種を植えました', 'success');
          if (cnt === 0) setPlacement(null);
        }
        return;
      }
      return;
    }

    // Validate placement before calling placeAt
    const s = window.Store.get();
    const isTile = placement.category === 'tile';
    let valid = false;
    if (isTile) {
      valid = s.world.tiles.length === 0 || s.world.tiles.some(t =>
        (Math.abs(t.x - cell.x) === 1 && t.z === cell.z) ||
        (t.x === cell.x && Math.abs(t.z - cell.z) === 1)
      );
    } else {
      const tile = s.world.tiles.find(t => t.x === cell.x && t.z === cell.z);
      const spawn = s.world.spawnTile || { x: 0, z: 0 };
      if (tile && cell.x === spawn.x && cell.z === spawn.z) {
        window.toast?.('スポーン地点には配置できません', 'error');
        return;
      }
      // Allow building merge: same building placed on same tile upgrades it
      const isMerge = placement.category === 'building' && tile?.item === placement.id;
      valid = !!tile && (!tile.item || isMerge);
    }
    if (!valid) {
      window.toast?.('配置できません', 'error');
      return;
    }
    window.Store.placeAt(placement.category, placement.id, cell.x, cell.z, placementRotation);
    const placed = window.Store.get();
    const tileAfter = placed.world.tiles.find(t => t.x === cell.x && t.z === cell.z);
    const mergedName = window.Store.CATALOG_MAP[tileAfter?.item]?.name;
    const msg = mergedName && tileAfter?.item !== placement.id
      ? 'アップグレード → ' + mergedName
      : '配置: ' + (window.Store.CATALOG_MAP[placement.id]?.name || placement.id);
    window.toast?.(msg, 'success');
    // Stay in placement mode if still have stock
    const remaining = (window.Store.get().inventory[placement.category]?.[placement.id]) || 0;
    if (remaining <= 0) setPlacement(null);
    updateRemovePreview();
  }

  function setPlacement(p) {
    if (p && removeMode) setRemoveModeEnabled(false, { silentToast: true });
    placement = p;
    // Clear old ghost
    if (placementGhost) {
      scene.remove(placementGhost);
      placementGhost.traverse?.(n => { n.geometry?.dispose?.(); n.material?.dispose?.(); });
      placementGhost = null;
    }
    if (p) {
      placementRotation = 0;
      placementGhost = buildGhost(p);
      scene.add(placementGhost);
    }
    updateCanvasCursor();
    updateRemovePreview();
    if (placementChangeHandler) placementChangeHandler(p);
  }
  let placementChangeHandler = null;

  function buildGhost(p) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const parts = [];
    if (p.category === 'carry' || p.category === 'items' || window.Store.CATALOG_MAP[p.id]?.usable) {
      // No 3D ghost for carried/material/usable items
      g.userData.parts = parts;
      return g;
    }
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
    if (charSitting || charSleeping || window.extendedInventoryOpen || window.shelfStorageOpen) return;
    let inputX = 0, inputZ = 0;
    if (keys.w) inputZ -= 1;
    if (keys.s) inputZ += 1;
    if (keys.a) inputX -= 1;
    if (keys.d) inputX += 1;
    if (inputX === 0 && inputZ === 0) return;
    let yawRef = 0;
    if (cameraMode === 'fp') yawRef = charYawVisual || charYaw || 0;
    else if (cameraMode !== 'topdown') yawRef = cameraOffset.yaw || 0;
    const c = Math.cos(yawRef), s = Math.sin(yawRef);
    let dx = inputX * c + inputZ * s;
    let dz = -inputX * s + inputZ * c;
    const len = Math.hypot(dx, dz);
    dx /= len; dz /= len;
    const speed = keys.shift ? 5.0 : 1.75;
    const nx = charPos.x + dx * speed * dt;
    const nz = charPos.z + dz * speed * dt;
    const tiles = window.Store.get().world.tiles;
    // While falling off edge (not a deliberate jump), block re-entry onto tiles
    if (!charOnGround && !charJumping) {
      const wouldLand = tiles.some(t =>
        Math.abs(nx - t.x * TILE) < 0.5 && Math.abs(nz - t.z * TILE) < 0.5
      );
      if (wouldLand) return;
    }
    // Furniture collision — skip when elevated on furniture top
    const hitItem = charY < FURNITURE_H - 0.1 && tiles.some(t =>
      t.item && Math.abs(nx - t.x * TILE) < 0.36 && Math.abs(nz - t.z * TILE) < 0.36
    );
    if (hitItem) return;
    charPos.x = Math.max(-14, Math.min(14, nx));
    charPos.z = Math.max(-14, Math.min(14, nz));
    // Yaw towards motion (except first-person strafe)
    if (cameraMode !== 'fp') {
      charYaw = Math.atan2(dx, dz);
    }
    // Persist (throttled)
    if (!handleMovement._save || performance.now() - handleMovement._save > 5000) {
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
    if (cameraMode === 'fp') {
      const eyeY = charSleeping ? 0.98 : (charSitting ? 0.92 : height);
      const dirX = Math.sin(charYawVisual);
      const dirZ = Math.cos(charYawVisual);
      const px = charPosVisual.x + dirX * 0.04;
      const pz = charPosVisual.z + dirZ * 0.04;
      camera.up.set(0, 1, 0);
      camera.position.set(px, eyeY, pz);
      camera.lookAt(px + dirX * 3, eyeY + 0.12, pz + dirZ * 3);
      return;
    }
    if (cameraMode === 'topdown') {
      camera.up.set(0, 0, -1);
      camera.position.set(tx, height, tz + dist);
      camera.lookAt(tx, 0, tz);
    } else {
      camera.up.set(0, 1, 0);
      camera.position.set(
        tx + Math.sin(yaw) * dist,
        height,
        tz + Math.cos(yaw) * dist
      );
      camera.lookAt(tx, 0.5, tz);
    }
  }

  function setCameraMode(mode) {
    if (!CAMERA_PRESETS[mode]) return cameraMode;
    if (cameraMode === mode) return cameraMode;
    cameraMode = mode;
    cameraOffset = { ...CAMERA_PRESETS[mode] };
    if (camera) {
      camera.fov = (mode === 'fp') ? CAMERA_FP_FOV : CAMERA_DEFAULT_FOV;
      camera.near = (mode === 'fp') ? CAMERA_FP_NEAR : CAMERA_DEFAULT_NEAR;
      camera.updateProjectionMatrix();
    }
    updateCameraPos();
    cameraModeChangeHandler?.(cameraMode);
    return cameraMode;
  }

  function toggleTopdown() {
    return setCameraMode(cameraMode === 'topdown' ? 'perspective' : 'topdown');
  }

  function zoomCameraByScale(scale) {
    if (!Number.isFinite(scale) || scale <= 0) return false;
    if (cameraMode === 'fp') return false;

    if (cameraMode === 'topdown') {
      cameraOffset.height = Math.max(8, Math.min(38, cameraOffset.height * scale));
    } else {
      cameraOffset.dist = Math.max(4, Math.min(26, cameraOffset.dist * scale));
      cameraOffset.height = Math.max(3, Math.min(20, cameraOffset.height * scale));
    }
    updateCameraPos();
    return true;
  }

  function zoomInCamera() {
    return zoomCameraByScale(0.9);
  }

  function zoomOutCamera() {
    return zoomCameraByScale(1.12);
  }

  function rotateCamera(step = Math.PI / 10) {
    if (cameraMode === 'fp' || cameraMode === 'topdown') return false;
    cameraOffset.yaw += step;
    updateCameraPos();
    return true;
  }

  function setRemoveModeEnabled(enabled, options = {}) {
    const next = !!enabled;
    if (removeMode === next) return removeMode;
    removeMode = next;
    if (removeMode && placement) setPlacement(null);
    updateCanvasCursor();
    updateRemovePreview();
    if (!options.silentToast) {
      window.toast?.(removeMode ? '削除モード: ON' : '削除モード: OFF');
    }
    removeModeChangeHandler?.(removeMode);
    return removeMode;
  }

  function toggleRemoveMode() {
    return setRemoveModeEnabled(!removeMode);
  }

  function centerOnGrid() {
    const s = window.Store.get();
    const tiles = s?.world?.tiles || [];

    if (tiles.length === 0) {
      cameraFocusOverride = { x: 0.5, z: 0.5, until: performance.now() + 1200 };
      return;
    }

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    tiles.forEach(t => {
      if (typeof t.x !== 'number' || typeof t.z !== 'number') return;
      if (t.x < minX) minX = t.x;
      if (t.x > maxX) maxX = t.x;
      if (t.z < minZ) minZ = t.z;
      if (t.z > maxZ) maxZ = t.z;
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minZ)) {
      cameraFocusOverride = { x: 0.5, z: 0.5, until: performance.now() + 1200 };
      return;
    }

    const centerX = ((minX + maxX) * 0.5) * TILE;
    const centerZ = ((minZ + maxZ) * 0.5) * TILE;
    cameraFocusOverride = { x: centerX, z: centerZ, until: performance.now() + 1200 };
  }

  function ensureDeveloperOverlay() {
    if (developerOverlayEl) return developerOverlayEl;
    const el = document.createElement('div');
    el.setAttribute('data-role', 'developer-overlay');
    el.style.position = 'fixed';
    el.style.top = '220px';
    el.style.right = '16px';
    el.style.zIndex = '65';
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'pre';
    el.style.fontFamily = "var(--font-mono), 'JetBrains Mono', monospace";
    el.style.fontSize = '11px';
    el.style.lineHeight = '1.45';
    el.style.letterSpacing = '0.02em';
    el.style.color = 'var(--ink-soft)';
    el.style.background = 'rgba(6, 4, 3, 0.82)';
    el.style.border = '1px solid var(--line)';
    el.style.borderRadius = '8px';
    el.style.padding = '8px 10px';
    el.style.backdropFilter = 'blur(3px)';
    el.style.display = 'none';
    document.body.appendChild(el);
    developerOverlayEl = el;
    return el;
  }

  function countSceneMaterials() {
    if (!scene) return 0;
    const materials = new Set();
    scene.traverse((node) => {
      if (!node || !node.material) return;
      if (Array.isArray(node.material)) {
        node.material.forEach((m) => { if (m) materials.add(m); });
      } else {
        materials.add(node.material);
      }
    });
    return materials.size;
  }

  function updateDeveloperOverlay(now) {
    if (!developerOverlayEnabled || !renderer) return;
    const el = ensureDeveloperOverlay();
    if (!el) return;

    overlayFrameCounter += 1;
    if (!overlayLastFpsSampleAt) overlayLastFpsSampleAt = now;
    const fpsElapsed = now - overlayLastFpsSampleAt;
    if (fpsElapsed >= 450) {
      overlayFps = (overlayFrameCounter * 1000) / fpsElapsed;
      overlayFrameCounter = 0;
      overlayLastFpsSampleAt = now;
    }

    if (!overlayLastHeavySampleAt || (now - overlayLastHeavySampleAt) >= 650) {
      overlayMaterialCount = countSceneMaterials();
      overlayProgramCount = renderer.info?.programs?.length || 0;
      overlayLastHeavySampleAt = now;
    }

    const frame = renderer.info?.render?.frame ?? 0;
    const draws = renderer.info?.render?.calls ?? 0;
    const tris = renderer.info?.render?.triangles ?? 0;
    const geoms = renderer.info?.memory?.geometries ?? 0;
    const texs = renderer.info?.memory?.textures ?? 0;
    const ghosts = placementGhost ? 1 : 0;

    const rows = [
      'developer overlay',
      `fps:    ${overlayFps.toFixed(1)}`,
      `frame:  ${frame}`,
      `draws:  ${draws}`,
      `tris:   ${tris}`,
      `geoms:  ${geoms}`,
      `mats:   ${overlayMaterialCount}`,
      `grogs:  ${overlayProgramCount}`,
      `texs:   ${texs}`,
      `ghosts: ${ghosts}`,
    ];
    el.textContent = rows.join('\n');
  }

  function setDeveloperOverlayEnabled(enabled) {
    const next = !!enabled;
    developerOverlayEnabled = next;
    const el = ensureDeveloperOverlay();
    if (el) el.style.display = next ? 'block' : 'none';
    if (next) {
      overlayFrameCounter = 0;
      overlayLastFpsSampleAt = 0;
      overlayLastHeavySampleAt = 0;
    }
    developerOverlayChangeHandler?.(developerOverlayEnabled);
    return developerOverlayEnabled;
  }

  function toggleDeveloperOverlay() {
    return setDeveloperOverlayEnabled(!developerOverlayEnabled);
  }

  // ---------- Character — Minecraft skin UV mapped ----------
  function buildCharacter(THREE, faceTex, outfitTex) {
    const g = new THREE.Group();

    // Fallback solid-color materials (used before textures load)
    const FB = {
      skin:  new THREE.MeshStandardMaterial({ color: 0xc8a27a, roughness: 0.72 }),
      hair:  new THREE.MeshStandardMaterial({ color: 0x563423, roughness: 0.90 }),
      shirt: new THREE.MeshStandardMaterial({ color: 0x1f7a8c, roughness: 0.85 }),
      pants: new THREE.MeshStandardMaterial({ color: 0x2d4f9e, roughness: 0.85 }),
    };

    // UV region material from a texture (ox,oy = pixel top-left, sw,sh = size, atlas=64×64)
    function fm(tex, ox, oy, sw, sh) {
      if (!tex) return new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
      const t = tex.clone();
      t.repeat.set(sw / 64, sh / 64);
      t.offset.set(ox / 64, 1 - (oy + sh) / 64);
      t.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, transparent: true, alphaTest: 0.1 });
    }
    // Shorthand helpers
    const fh = (ox, oy, sw, sh) => fm(faceTex,   ox, oy, sw, sh);
    const oh = (ox, oy, sw, sh) => fm(outfitTex, ox, oy, sw, sh);

    // BoxGeometry material index order: [+x, -x, +y, -y, +z(front), -z(back)]
    // Steve faces +z. His right = +x, left = -x.

    // HEAD — face texture  [+x=left, -x=right, +y=top, -y=bottom, +z=front, -z=back]
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.224, 0.224), faceTex ? [
      fh(16, 8, 8, 8),   // +x = Steve's left
      fh( 0, 8, 8, 8),   // -x = Steve's right
      fh( 8, 0, 8, 8),   // +y = top
      fh(16, 0, 8, 8),   // -y = bottom
      fh( 8, 8, 8, 8),   // +z = front (face)
      fh(24, 8, 8, 8),   // -z = back
    ] : [FB.hair, FB.hair, FB.hair, FB.skin, FB.skin, FB.hair]);
    head.position.y = 0.784;
    head.castShadow = true;
    g.add(head);

    // BODY — outfit texture
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.336, 0.112), outfitTex ? [
      oh(28, 20, 4, 12),  // +x = left side
      oh(16, 20, 4, 12),  // -x = right side
      oh(20, 16, 8,  4),  // +y = top
      oh(28, 16, 8,  4),  // -y = bottom
      oh(20, 20, 8, 12),  // +z = front
      oh(32, 20, 8, 12),  // -z = back
    ] : FB.shirt);
    body.position.y = 0.504;
    body.castShadow = true;
    g.add(body);
    charBody = body;

    // RIGHT ARM (+x = Steve's right) — outfit texture
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.336, 0.112), outfitTex ? [
      oh(40, 20, 4, 12),  // +x = outer
      oh(48, 20, 4, 12),  // -x = inner
      oh(44, 16, 4,  4),  // +y = top
      oh(48, 16, 4,  4),  // -y = bottom
      oh(44, 20, 4, 12),  // +z = front
      oh(52, 20, 4, 12),  // -z = back
    ] : FB.shirt);
    armR.position.set(0.168, 0, 0);
    armR.castShadow = true;
    body.add(armR);

    // LEFT ARM (-x = Steve's left) — outfit texture
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.336, 0.112), outfitTex ? [
      oh(40, 52, 4, 12),  // +x = inner
      oh(32, 52, 4, 12),  // -x = outer
      oh(36, 48, 4,  4),  // +y = top
      oh(40, 48, 4,  4),  // -y = bottom
      oh(36, 52, 4, 12),  // +z = front
      oh(44, 52, 4, 12),  // -z = back
    ] : FB.shirt);
    armL.position.set(-0.168, 0, 0);
    armL.castShadow = true;
    body.add(armL);

    // RIGHT LEG (+x = Steve's right) — outfit texture
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.336, 0.112), outfitTex ? [
      oh( 0, 20, 4, 12),  // +x = outer
      oh( 8, 20, 4, 12),  // -x = inner
      oh( 4, 16, 4,  4),  // +y = top
      oh( 8, 16, 4,  4),  // -y = bottom
      oh( 4, 20, 4, 12),  // +z = front
      oh(12, 20, 4, 12),  // -z = back
    ] : FB.pants);
    legR.position.set(0.056, 0.168, 0);
    legR.castShadow = true;
    g.add(legR);

    // LEFT LEG (-x = Steve's left) — outfit texture
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.336, 0.112), outfitTex ? [
      oh(16, 52, 4, 12),  // +x = inner
      oh(24, 52, 4, 12),  // -x = outer
      oh(20, 48, 4,  4),  // +y = top
      oh(24, 48, 4,  4),  // -y = bottom
      oh(20, 52, 4, 12),  // +z = front
      oh(28, 52, 4, 12),  // -z = back
    ] : FB.pants);
    legL.position.set(-0.056, 0.168, 0);
    legL.castShadow = true;
    g.add(legL);

    g.userData.parts = { body, head, armL, armR, legL, legR };
    return g;
  }

  function applyStandingPose(parts) {
    if (!parts) return;
    if (parts.body) {
      parts.body.position.set(0, 0.504, 0);
      parts.body.rotation.x = 0;
    }
    if (parts.head) {
      parts.head.position.set(0, 0.784, 0);
      parts.head.rotation.x = 0;
    }
    if (parts.legL) {
      parts.legL.position.set(-0.056, 0.168, 0.0);
      parts.legL.rotation.x = 0;
    }
    if (parts.legR) {
      parts.legR.position.set(0.056, 0.168, 0.0);
      parts.legR.rotation.x = 0;
    }
    if (parts.bootL) {
      parts.bootL.position.set(-0.056, 0.040, 0.0);
      parts.bootL.rotation.x = 0;
    }
    if (parts.bootR) {
      parts.bootR.position.set(0.056, 0.040, 0.0);
      parts.bootR.rotation.x = 0;
    }
    if (parts.armL) parts.armL.rotation.x = 0;
    if (parts.armR) parts.armR.rotation.x = 0;
  }

  function findAdjacentFreeTile(x, z) {
    const s = window.Store.get();
    const adj = [
      { x: x - 1, z },
      { x: x + 1, z },
      { x, z: z - 1 },
      { x, z: z + 1 },
    ];
    return adj.find(c => {
      const t = s.world.tiles.find(t => t.x === c.x && t.z === c.z);
      return t && !t.item;
    }) || null;
  }
  function findAdjacentAnyTile(x, z) {
    const s = window.Store.get();
    const adj = [
      { x: x - 1, z },
      { x: x + 1, z },
      { x, z: z - 1 },
      { x, z: z + 1 },
    ];
    return adj.find(c => s.world.tiles.some(t => t.x === c.x && t.z === c.z)) || null;
  }

  function setSitting(sitting) {
    if (!charGroup) return;
    if (!sitting && charSleeping) {
      setSleeping(false);
      return;
    }
    if (sitting && charSleeping) {
      charSleeping = false;
      sleepBedPos = null;
    }
    charSitting = sitting;
    const desk = findDeskPosition();
    if (sitting) {
      const st = window.Store.get();
      const chairs = st.world.tiles.filter(t => t.item === 'chair_iron');
      let chair = null;
      if (chairs.length) {
        const cx = charPos.x / TILE;
        const cz = charPos.z / TILE;
        chair = chairs.slice().sort((a, b) => {
          const da = Math.hypot(a.x - cx, a.z - cz);
          const db = Math.hypot(b.x - cx, b.z - cz);
          return da - db;
        })[0];
      } else if (desk) {
        chair = findChairPosition() || { x: desk.x + 1, z: desk.z, itemRotation: 0 };
      }
      if (!chair) return;
      sitChairPos = { x: chair.x, z: chair.z };
      charPos.x = chair.x * TILE;
      charPos.z = chair.z * TILE;
      charPosVisual.x = charPos.x;
      charPosVisual.z = charPos.z;
      const rot = Number.isFinite(chair.itemRotation) ? ((Math.round(chair.itemRotation) % 4 + 4) % 4) : 0;
      charYaw = -rot * Math.PI / 2;
      charYawVisual = charYaw;
      charY = 0; charVelY = 0; charOnGround = true;
      const parts = charGroup.userData.parts;
      if (parts) {
        if (parts.body) {
          parts.body.position.y = 0.45;
          parts.body.rotation.x = 0;
        }
        if (parts.head) {
          parts.head.position.y = 0.73;
          parts.head.rotation.x = 0;
        }
        if (parts.legL) {
          parts.legL.position.set(-0.056, 0.37, 0.04);
          parts.legL.rotation.x = -1.2;
        }
        if (parts.legR) {
          parts.legR.position.set(0.056, 0.37, 0.04);
          parts.legR.rotation.x = -1.2;
        }
        if (parts.bootL) {
          parts.bootL.position.set(-0.056, 0.12, 0.18);
          parts.bootL.rotation.x = -0.20;
        }
        if (parts.bootR) {
          parts.bootR.position.set(0.056, 0.12, 0.18);
          parts.bootR.rotation.x = -0.20;
        }
        if (parts.armL) parts.armL.rotation.x = -0.18;
        if (parts.armR) parts.armR.rotation.x = -0.18;
      }
    } else {
      const chair = sitChairPos || findChairPosition();
      if (chair) {
        const free = findAdjacentFreeTile(chair.x, chair.z);
        if (free) {
          charPos.x = free.x * TILE;
          charPos.z = free.z * TILE;
          charPosVisual.x = charPos.x;
          charPosVisual.z = charPos.z;
        }
      }
      sitChairPos = null;
      charY = 0; charVelY = 0; charOnGround = true;
      applyStandingPose(charGroup.userData.parts);
    }
  }

  function setSleeping(sleeping, bedPos = null) {
    if (!charGroup) return;
    if (sleeping) {
      if (charSitting) setSitting(false);
      const st = window.Store.get();
      const bed = bedPos || st.world.tiles.find(t => t.item === 'bed_iron');
      if (!bed) return;
      charSleeping = true;
      charSitting = false;
      sleepBedPos = { x: bed.x, z: bed.z };
      charPos.x = bed.x * TILE;
      charPos.z = bed.z * TILE;
      charPosVisual.x = charPos.x;
      charPosVisual.z = charPos.z;
      const bedRot = Number.isFinite(bed.itemRotation) ? (Math.round(bed.itemRotation) % 4 + 4) % 4 : 0;
      charYaw = -bedRot * Math.PI / 2;
      charYawVisual = charYaw;
      charY = BED_SLEEP_Y;
      charVelY = 0;
      charOnGround = true;
      charJumping = false;
      const parts = charGroup.userData.parts;
      if (parts) {
        if (parts.body) {
          parts.body.position.set(0, 0.325, 0.00);
          parts.body.rotation.x = -Math.PI / 2 + 0.08;
        }
        if (parts.head) {
          parts.head.position.set(0, 0.325, -0.19);
          parts.head.rotation.x = -Math.PI / 2 + 0.08;
        }
        if (parts.legL) {
          parts.legL.position.set(-0.056, 0.325, 0.16);
          parts.legL.rotation.x = -Math.PI / 2 + 0.06;
        }
        if (parts.legR) {
          parts.legR.position.set(0.056, 0.325, 0.16);
          parts.legR.rotation.x = -Math.PI / 2 + 0.06;
        }
        if (parts.armL) parts.armL.rotation.x = -1.38;
        if (parts.armR) parts.armR.rotation.x = -1.38;
      }
      const spawnSet = window.Store.setSpawnToBed?.(bed.x, bed.z);
      if (spawnSet?.ok) window.toast?.('スポーン地点をベッドに設定', 'info');
      return;
    }

    charSleeping = false;
    const bed = sleepBedPos || findBedPosition();
    if (bed) {
      const standTile = findAdjacentFreeTile(bed.x, bed.z) || findAdjacentAnyTile(bed.x, bed.z);
      if (standTile) {
        charPos.x = standTile.x * TILE;
        charPos.z = standTile.z * TILE;
        charPosVisual.x = charPos.x;
        charPosVisual.z = charPos.z;
      } else {
        const spawn = window.Store.get().world.spawnTile || { x: 0, z: 0 };
        charPos.x = spawn.x * TILE;
        charPos.z = spawn.z * TILE;
        charPosVisual.x = charPos.x;
        charPosVisual.z = charPos.z;
      }
    }
    charY = 0;
    charVelY = 0;
    charOnGround = true;
    charJumping = false;
    sleepBedPos = null;
    applyStandingPose(charGroup.userData.parts);
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
  function findBedPosition() {
    const s = window.Store.get();
    const t = s.world.tiles.find(t => t.item === 'bed_iron');
    return t ? { x: t.x, z: t.z } : null;
  }

  // ---------- Sync from store ----------
  function syncFromStore(state) {
    // Time / season / weather mode
    const nextSpecial = state.world.specialWeather || null;
    const nextTimeOfDay = nextSpecial || state.world.timeOfDay || state.world.weather || 'night';
    const nextSeason = state.world.season || 'spring';
    const nextWeatherMode = state.world.weatherMode || 'clear';
    if (
      nextTimeOfDay !== timeOfDayKey
      || nextSeason !== seasonKey
      || nextWeatherMode !== weatherModeKey
      || state.world.weather !== weatherKey
      || nextSpecial !== specialWeatherKey
    ) {
      applyWeather(nextTimeOfDay, nextSeason, nextWeatherMode);
      timeOfDayKey = nextTimeOfDay;
      seasonKey = nextSeason;
      weatherModeKey = nextWeatherMode;
      weatherKey = state.world.weather;
      specialWeatherKey = nextSpecial;
    }

    // Tiles diff
    rebuildTiles(state.world.tiles);
    updateRemovePreview();

  }

  function rebuildTiles(tiles) {
    chairTiles = tiles.filter(t => t.item === 'chair_iron');
    shelfTiles = tiles.filter(t => t.item === 'shelf_rust');
    bedTiles = tiles.filter(t => t.item === 'bed_iron');
    if (charSleeping && sleepBedPos) {
      const stillBed = tiles.some(t => t.x === sleepBedPos.x && t.z === sleepBedPos.z && t.item === 'bed_iron');
      if (!stillBed) {
        charSleeping = false;
        sleepBedPos = null;
        applyStandingPose(charGroup?.userData?.parts);
      }
    }
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
      const mat = TILE_MATERIALS[t.type] || TILE_MATERIALS.soil_barren;
      const isWater = (t.type === 'water_murky');

      // ---- Dark earth body (full width, peeks around cap for depth) ----
      const bodyShadeMul = (t.type === 'soil_ash')
        ? 0.46
        : (t.type === 'soil_toxic'
          ? 0.42
          : (t.type === 'soil_cracked'
            ? 0.40
            : (t.type === 'path_broken' ? 0.41 : 0.38)));
      const bodyColor = new THREE.Color(mat.color).multiplyScalar(bodyShadeMul);
      const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 1.0, metalness: 0.0 });
      const bodyGeo = new THREE.BoxGeometry(TILE * 1.01, TILE_BODY_H, TILE * 1.01);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(t.x * TILE, -TILE_BODY_H * 0.5 + 0.03, t.z * TILE);
      body.receiveShadow = true;
      tileGroup.add(body);

      // ---- Colored top cap (narrower = ledge effect) ----
      const topColor = new THREE.Color(mat.color);
      if (t.type === 'soil_toxic') {
        // green-biased contaminated soil tone
        topColor.lerp(new THREE.Color(0x758a63), 0.28);
      }
      const sideShadeMul = (t.type === 'soil_ash')
        ? 0.58
        : (t.type === 'soil_cracked' ? 0.52 : (t.type === 'path_broken' ? 0.53 : 0.48));
      const sideColor = topColor.clone().multiplyScalar(sideShadeMul);
      const topMat = new THREE.MeshStandardMaterial({
        color: topColor,
        roughness: mat.rough ?? 0.9,
        metalness: (t.type === 'soil_ash') ? 0.05 : 0.0,
      });
      const sideMat = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.97, metalness: 0.0 });
      const capGeo = new THREE.BoxGeometry(TILE * 0.93, TILE_CAP_H, TILE * 0.93);
      // BoxGeometry groups: [+x, -x, +y(top), -y(bottom), +z, -z]
      const mesh = isWater
        ? new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({
          color: mat.color,
          roughness: 0.24,
          metalness: 0.02,
          transparent: true,
          opacity: 0.78,
        }))
        : new THREE.Mesh(capGeo, [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
      const capY = 0.03 + TILE_CAP_H * 0.5;  // sits on top of body, top face = 0.09
      const baseY = isWater ? capY - 0.04 : capY;
      mesh.position.set(t.x * TILE, baseY, t.z * TILE);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.userData.x = t.x;
      mesh.userData.z = t.z;
      mesh.userData.isWater = isWater;
      mesh.userData.baseY = baseY;
      tileGroup.add(mesh);

      // ---- Tile surface details ----
      const surfY = mesh.position.y + TILE_CAP_H * 0.5; // top of cap
      if (t.type === 'water_murky') {
        const topLocalY = TILE_CAP_H * 0.5;

        // Mud/sand shallow patches under the water
        const bedMat = new THREE.MeshBasicMaterial({
          color: 0x6a5f52,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.24, h: 0.14, x: -0.14, z: 0.10, r: 0.36 },
          { w: 0.20, h: 0.12, x: 0.16, z: -0.08, r: -0.28 },
          { w: 0.14, h: 0.10, x: 0.04, z: 0.20, r: 0.62 },
        ].forEach(({ w, h, x, z, r }) => {
          const bg = new THREE.PlaneGeometry(w, h);
          const bm = new THREE.Mesh(bg, bedMat);
          bm.rotation.x = -Math.PI / 2;
          bm.rotation.z = r;
          bm.position.set(x, topLocalY - 0.013, z);
          mesh.add(bm);
        });

        // Thin dirty film on the surface (kept subtle)
        const filmMat = new THREE.MeshBasicMaterial({
          color: 0xc7d0cb,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.16, h: 0.08, x: -0.02, z: -0.02, r: 0.12 },
          { w: 0.11, h: 0.06, x: 0.18, z: 0.14, r: -0.34 },
        ].forEach(({ w, h, x, z, r }) => {
          const fg = new THREE.PlaneGeometry(w, h);
          const fm = new THREE.Mesh(fg, filmMat);
          fm.rotation.x = -Math.PI / 2;
          fm.rotation.z = r;
          fm.position.set(x, topLocalY + 0.0008, z);
          mesh.add(fm);
        });

        // Gentle small ripples
        const rippleMat = new THREE.MeshBasicMaterial({
          color: 0x8eb4bc,
          transparent: true,
          opacity: 0.30,
          side: THREE.DoubleSide,
        });
        [
          { inR: 0.030, outR: 0.034, x: -0.10, z: 0.02 },
          { inR: 0.024, outR: 0.028, x: 0.17, z: -0.12 },
          { inR: 0.018, outR: 0.022, x: 0.02, z: 0.18 },
        ].forEach(({ inR, outR, x, z }) => {
          const rg = new THREE.RingGeometry(inR, outR, 16);
          const rm = new THREE.Mesh(rg, rippleMat);
          rm.rotation.x = -Math.PI / 2;
          rm.position.set(x, topLocalY + 0.0012, z);
          mesh.add(rm);
        });

        // Submerged pebbles
        const pebbleMats = [
          new THREE.MeshStandardMaterial({ color: 0xa8aa9e, roughness: 0.92, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x7c7f78, roughness: 0.96, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x6f675d, roughness: 0.98, metalness: 0.0 }),
        ];
        [
          { x: -0.20, z: -0.14, r: 0.014, m: 0, sy: 0.52 },
          { x: 0.09, z: -0.20, r: 0.012, m: 1, sy: 0.58 },
          { x: 0.22, z: 0.10, r: 0.013, m: 2, sy: 0.54 },
          { x: -0.02, z: 0.22, r: 0.011, m: 1, sy: 0.56 },
        ].forEach(({ x, z, r, m, sy }) => {
          const sg = new THREE.SphereGeometry(r, 5, 4);
          const sm = new THREE.Mesh(sg, pebbleMats[m]);
          sm.scale.y = sy;
          sm.position.set(x, topLocalY - 0.016 + r * 0.25, z);
          mesh.add(sm);
        });

        // Dry grass remnants near the edge
        const grassMat = new THREE.MeshStandardMaterial({
          color: 0x8e836f,
          roughness: 1.0,
          metalness: 0.0,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        [
          { x: -0.27, z: 0.02, rot: 0.44, h: 0.050 },
          { x: 0.24, z: -0.24, rot: -0.30, h: 0.046 },
          { x: 0.06, z: 0.26, rot: 1.00, h: 0.042 },
        ].forEach(({ x, z, rot, h }) => {
          const gg = new THREE.PlaneGeometry(0.016, h);
          const gm = new THREE.Mesh(gg, grassMat);
          gm.rotation.y = rot;
          gm.position.set(x, topLocalY - 0.002 + h * 0.38, z);
          mesh.add(gm);
        });

        // Quiet bluish highlight for slight fantasy beauty
        const sheenMat = new THREE.MeshBasicMaterial({
          color: 0xdbe7e8,
          transparent: true,
          opacity: 0.20,
          side: THREE.DoubleSide,
        });
        const hg = new THREE.PlaneGeometry(0.11, 0.020);
        const hm = new THREE.Mesh(hg, sheenMat);
        hm.rotation.x = -Math.PI / 2;
        hm.rotation.z = -0.20;
        hm.position.set(0.04, topLocalY + 0.0014, -0.03);
        mesh.add(hm);
      }
      if (t.type === 'soil_barren') {
        const cx = t.x * TILE, cz = t.z * TILE;
        // Crack lines — thin flat planes, semi-transparent dark
        const crackMat = new THREE.MeshBasicMaterial({ color: 0x3a2810, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
        [
          { w: 0.38, rot: 0.28, px: -0.05, pz: -0.08 },
          { w: 0.26, rot: -0.62, px: 0.14, pz: 0.20 },
        ].forEach(({ w, rot, px, pz }) => {
          const cg = new THREE.PlaneGeometry(w, 0.012);
          const cm = new THREE.Mesh(cg, crackMat);
          cm.rotation.x = -Math.PI / 2;
          cm.rotation.z = rot;
          cm.position.set(cx + px, surfY + 0.001, cz + pz);
          tileGroup.add(cm);
        });
        // Pebbles — 5 flattened spheres, 3 colour variants
        const pebMats = [
          new THREE.MeshStandardMaterial({ color: 0x7a7268, roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: 0x4e3e2c, roughness: 1.0 }),
          new THREE.MeshStandardMaterial({ color: 0xa89c8c, roughness: 0.85 }),
        ];
        [
          { px: -0.22, pz: -0.18, r: 0.040, m: 0 },
          { px:  0.20, pz:  0.12, r: 0.032, m: 2 },
          { px: -0.05, pz:  0.28, r: 0.028, m: 1 },
          { px:  0.30, pz: -0.26, r: 0.036, m: 0 },
          { px:  0.08, pz: -0.10, r: 0.022, m: 2 },
        ].forEach(({ px, pz, r, m }) => {
          const sg = new THREE.SphereGeometry(r, 5, 3);
          const pb = new THREE.Mesh(sg, pebMats[m]);
          pb.scale.y = 0.58;
          pb.position.set(cx + px, surfY + r * 0.58 - 0.004, cz + pz);
          tileGroup.add(pb);
        });
        // Dry grass tufts — crossed PlaneGeometry pairs
        const grassMat = new THREE.MeshStandardMaterial({ color: 0xb8a040, roughness: 1.0, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
        [
          { px: -0.28, pz:  0.10, rot: 0.4 },
          { px:  0.18, pz: -0.30, rot: -0.5 },
          { px: -0.10, pz: -0.22, rot: 1.1 },
        ].forEach(({ px, pz, rot }) => {
          for (let a = 0; a < 2; a++) {
            const gg = new THREE.PlaneGeometry(0.10, 0.12);
            const gm = new THREE.Mesh(gg, grassMat);
            gm.rotation.y = rot + a * Math.PI / 2;
            gm.position.set(cx + px, surfY + 0.06, cz + pz);
            tileGroup.add(gm);
          }
        });
      }
      if (t.type === 'soil_ash') {
        const cx = t.x * TILE, cz = t.z * TILE;

        // Soft, thin cracks (not too aggressive)
        const ashCrackMat = new THREE.MeshBasicMaterial({
          color: 0x645d54,
          transparent: true,
          opacity: 0.42,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.26, rot: 0.18, px: -0.10, pz: -0.03 },
          { w: 0.22, rot: -0.52, px: 0.14, pz: 0.11 },
          { w: 0.14, rot: 0.82, px: 0.00, pz: -0.18 },
        ].forEach(({ w, rot, px, pz }) => {
          const cg = new THREE.PlaneGeometry(w, 0.008);
          const cm = new THREE.Mesh(cg, ashCrackMat);
          cm.rotation.x = -Math.PI / 2;
          cm.rotation.z = rot;
          cm.position.set(cx + px, surfY + 0.001, cz + pz);
          tileGroup.add(cm);
        });

        // Burnt patches (gentle soot, not dirty)
        const sootMat = new THREE.MeshBasicMaterial({
          color: 0x1d1915,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.20, h: 0.11, px: -0.16, pz: 0.16, rot: 0.45 },
          { w: 0.16, h: 0.09, px: 0.18, pz: -0.12, rot: -0.30 },
        ].forEach(({ w, h, px, pz, rot }) => {
          const bg = new THREE.PlaneGeometry(w, h);
          const bm = new THREE.Mesh(bg, sootMat);
          bm.rotation.x = -Math.PI / 2;
          bm.rotation.z = rot;
          bm.position.set(cx + px, surfY + 0.0012, cz + pz);
          tileGroup.add(bm);
        });

        // Ash grains + pebbles
        const ashPebbleMats = [
          new THREE.MeshStandardMaterial({ color: 0xd7d3cb, roughness: 0.82, metalness: 0.05 }),
          new THREE.MeshStandardMaterial({ color: 0xbeb7ac, roughness: 0.88, metalness: 0.04 }),
          new THREE.MeshStandardMaterial({ color: 0x8f877a, roughness: 0.94, metalness: 0.02 }),
          new THREE.MeshStandardMaterial({ color: 0x6f665b, roughness: 0.98, metalness: 0.0 }),
        ];
        [
          { px: -0.22, pz: -0.16, r: 0.016, m: 0, sy: 0.42 },
          { px: -0.04, pz: -0.24, r: 0.014, m: 1, sy: 0.45 },
          { px:  0.12, pz: -0.02, r: 0.013, m: 0, sy: 0.48 },
          { px:  0.24, pz:  0.18, r: 0.012, m: 2, sy: 0.44 },
          { px: -0.14, pz:  0.22, r: 0.012, m: 1, sy: 0.43 },
          { px:  0.04, pz:  0.24, r: 0.026, m: 3, sy: 0.58 },
          { px:  0.22, pz: -0.18, r: 0.022, m: 2, sy: 0.56 },
        ].forEach(({ px, pz, r, m, sy }) => {
          const sg = new THREE.SphereGeometry(r, 5, 4);
          const sm = new THREE.Mesh(sg, ashPebbleMats[m]);
          sm.scale.y = sy;
          sm.position.set(cx + px, surfY + r * sy - 0.003, cz + pz);
          tileGroup.add(sm);
        });

        // Subtle reflective ash sheen (fantasy but quiet)
        const sheenMat = new THREE.MeshBasicMaterial({
          color: 0xe8e4dc,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.12, h: 0.020, px: -0.01, pz: 0.05, rot: -0.25 },
          { w: 0.09, h: 0.018, px: 0.17, pz: -0.04, rot: 0.35 },
        ].forEach(({ w, h, px, pz, rot }) => {
          const gg = new THREE.PlaneGeometry(w, h);
          const gm = new THREE.Mesh(gg, sheenMat);
          gm.rotation.x = -Math.PI / 2;
          gm.rotation.z = rot;
          gm.position.set(cx + px, surfY + 0.0014, cz + pz);
          tileGroup.add(gm);
        });
      }
      if (t.type === 'soil_toxic') {
        const cx = t.x * TILE, cz = t.z * TILE;

        // fine cracks (quiet, not too aggressive)
        const toxicCrackMat = new THREE.MeshBasicMaterial({
          color: 0x3d4233,
          transparent: true,
          opacity: 0.46,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.24, rot: 0.22, px: -0.12, pz: -0.05 },
          { w: 0.20, rot: -0.58, px: 0.12, pz: 0.14 },
          { w: 0.15, rot: 0.88, px: 0.02, pz: -0.20 },
        ].forEach(({ w, rot, px, pz }) => {
          const cg = new THREE.PlaneGeometry(w, 0.008);
          const cm = new THREE.Mesh(cg, toxicCrackMat);
          cm.rotation.x = -Math.PI / 2;
          cm.rotation.z = rot;
          cm.position.set(cx + px, surfY + 0.001, cz + pz);
          tileGroup.add(cm);
        });

        // soft blackened patches (burnt traces)
        const charMat = new THREE.MeshBasicMaterial({
          color: 0x23271e,
          transparent: true,
          opacity: 0.26,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.21, h: 0.11, px: -0.17, pz: 0.17, rot: 0.36 },
          { w: 0.17, h: 0.09, px: 0.20, pz: -0.10, rot: -0.28 },
        ].forEach(({ w, h, px, pz, rot }) => {
          const bg = new THREE.PlaneGeometry(w, h);
          const bm = new THREE.Mesh(bg, charMat);
          bm.rotation.x = -Math.PI / 2;
          bm.rotation.z = rot;
          bm.position.set(cx + px, surfY + 0.0012, cz + pz);
          tileGroup.add(bm);
        });

        // muted green contamination marks (natural / calm)
        const contamMat = new THREE.MeshBasicMaterial({
          color: 0x7b9366,
          transparent: true,
          opacity: 0.40,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.16, h: 0.10, px: 0.06, pz: 0.04, rot: -0.18 },
          { w: 0.12, h: 0.08, px: -0.03, pz: -0.18, rot: 0.32 },
        ].forEach(({ w, h, px, pz, rot }) => {
          const gg = new THREE.PlaneGeometry(w, h);
          const gm = new THREE.Mesh(gg, contamMat);
          gm.rotation.x = -Math.PI / 2;
          gm.rotation.z = rot;
          gm.position.set(cx + px, surfY + 0.0015, cz + pz);
          tileGroup.add(gm);
        });

        // pebbles + ash grains
        const toxicPebbleMats = [
          new THREE.MeshStandardMaterial({ color: 0xb0b39e, roughness: 0.9, metalness: 0.02 }),
          new THREE.MeshStandardMaterial({ color: 0x8e917f, roughness: 0.96, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x686e5f, roughness: 0.98, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x545b4b, roughness: 1.0, metalness: 0.0 }),
        ];
        [
          { px: -0.23, pz: -0.18, r: 0.015, m: 0, sy: 0.45 },
          { px: -0.05, pz: -0.25, r: 0.013, m: 1, sy: 0.46 },
          { px:  0.14, pz: -0.01, r: 0.013, m: 0, sy: 0.48 },
          { px:  0.24, pz:  0.17, r: 0.012, m: 2, sy: 0.44 },
          { px: -0.13, pz:  0.23, r: 0.012, m: 1, sy: 0.43 },
          { px:  0.05, pz:  0.23, r: 0.024, m: 3, sy: 0.58 },
          { px:  0.21, pz: -0.17, r: 0.020, m: 2, sy: 0.56 },
        ].forEach(({ px, pz, r, m, sy }) => {
          const sg = new THREE.SphereGeometry(r, 5, 4);
          const sm = new THREE.Mesh(sg, toxicPebbleMats[m]);
          sm.scale.y = sy;
          sm.position.set(cx + px, surfY + r * sy - 0.003, cz + pz);
          tileGroup.add(sm);
        });

        // dead grass debris (small, hand-made low poly feel)
        const deadGrassMat = new THREE.MeshStandardMaterial({
          color: 0x748064,
          roughness: 1.0,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
        [
          { px: -0.26, pz: 0.06, rot: 0.45, h: 0.06 },
          { px:  0.17, pz: -0.27, rot: -0.30, h: 0.05 },
          { px: -0.02, pz: 0.27, rot: 0.90, h: 0.055 },
        ].forEach(({ px, pz, rot, h }) => {
          const dg = new THREE.PlaneGeometry(0.018, h);
          const dm = new THREE.Mesh(dg, deadGrassMat);
          dm.rotation.y = rot;
          dm.position.set(cx + px, surfY + h * 0.45, cz + pz);
          tileGroup.add(dm);
        });

        // tiny calm sheen to avoid too dirty look
        const toxicSheenMat = new THREE.MeshBasicMaterial({
          color: 0xd7dfd0,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
        });
        const hg = new THREE.PlaneGeometry(0.10, 0.018);
        const hm = new THREE.Mesh(hg, toxicSheenMat);
        hm.rotation.x = -Math.PI / 2;
        hm.rotation.z = -0.24;
        hm.position.set(cx + 0.03, surfY + 0.0016, cz - 0.02);
        tileGroup.add(hm);
      }
      if (t.type === 'brick_ruin') {
        const cx = t.x * TILE, cz = t.z * TILE;

        // Broken brick floor pieces (clear brick identity, but naturally collapsed)
        const brickMats = [
          new THREE.MeshStandardMaterial({ color: 0xa0644f, roughness: 0.9, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x8c5844, roughness: 0.94, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x765246, roughness: 0.97, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0xb3775f, roughness: 0.88, metalness: 0.0 }),
        ];
        [
          { px: -0.22, pz: -0.18, sx: 0.22, sy: 0.026, sz: 0.12, m: 0, ry: 0.06 },
          { px:  0.03, pz: -0.18, sx: 0.20, sy: 0.024, sz: 0.11, m: 1, ry: -0.04 },
          { px:  0.24, pz: -0.16, sx: 0.18, sy: 0.023, sz: 0.10, m: 2, ry: 0.05 },
          { px: -0.18, pz:  0.02, sx: 0.19, sy: 0.024, sz: 0.11, m: 3, ry: 0.12 },
          { px:  0.07, pz:  0.02, sx: 0.21, sy: 0.025, sz: 0.12, m: 0, ry: -0.08 },
          { px:  0.28, pz:  0.04, sx: 0.16, sy: 0.022, sz: 0.10, m: 2, ry: 0.10 },
          { px: -0.24, pz:  0.22, sx: 0.20, sy: 0.024, sz: 0.11, m: 1, ry: -0.06 },
          { px:  0.01, pz:  0.23, sx: 0.18, sy: 0.023, sz: 0.10, m: 2, ry: 0.03 },
          { px:  0.23, pz:  0.22, sx: 0.21, sy: 0.025, sz: 0.12, m: 3, ry: -0.10 },
        ].forEach(({ px, pz, sx, sy, sz, m, ry }) => {
          const bg = new THREE.BoxGeometry(sx, sy, sz);
          const bm = new THREE.Mesh(bg, brickMats[m]);
          bm.position.set(cx + px, surfY + sy * 0.52 - 0.0035, cz + pz);
          bm.rotation.y = ry;
          tileGroup.add(bm);
        });

        // Soil/sand in the gaps between bricks
        const gapMat = new THREE.MeshBasicMaterial({
          color: 0x64584c,
          transparent: true,
          opacity: 0.46,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.60, h: 0.022, px: 0.00, pz: -0.07, rot: 0.06 },
          { w: 0.58, h: 0.020, px: 0.02, pz: 0.12, rot: -0.08 },
          { w: 0.18, h: 0.08, px: -0.31, pz: 0.05, rot: 0.28 },
        ].forEach(({ w, h, px, pz, rot }) => {
          const gg = new THREE.PlaneGeometry(w, h);
          const gm = new THREE.Mesh(gg, gapMat);
          gm.rotation.x = -Math.PI / 2;
          gm.rotation.z = rot;
          gm.position.set(cx + px, surfY + 0.0012, cz + pz);
          tileGroup.add(gm);
        });

        // Fracture traces on old brick surface
        const crackCoreMat = new THREE.MeshBasicMaterial({
          color: 0x2e231d,
          transparent: true,
          opacity: 0.66,
          side: THREE.DoubleSide,
        });
        const crackEdgeMat = new THREE.MeshBasicMaterial({
          color: 0x594338,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.30, core: 0.012, px: -0.08, pz: -0.01, rot: 0.28 },
          { w: 0.26, core: 0.011, px: 0.17, pz: 0.10, rot: -0.46 },
          { w: 0.18, core: 0.010, px: -0.23, pz: 0.19, rot: 0.92 },
        ].forEach(({ w, core, px, pz, rot }) => {
          const eg = new THREE.PlaneGeometry(w, core * 2.0);
          const em = new THREE.Mesh(eg, crackEdgeMat);
          em.rotation.x = -Math.PI / 2;
          em.rotation.z = rot;
          em.position.set(cx + px, surfY + 0.0011, cz + pz);
          tileGroup.add(em);

          const cg = new THREE.PlaneGeometry(w * 0.95, core);
          const cm = new THREE.Mesh(cg, crackCoreMat);
          cm.rotation.x = -Math.PI / 2;
          cm.rotation.z = rot;
          cm.position.set(cx + px, surfY + 0.0013, cz + pz);
          tileGroup.add(cm);
        });

        // Chipped brick fragments + small rubble
        [
          { px: -0.30, pz: -0.01, sx: 0.052, sy: 0.016, sz: 0.036, m: 1, ry: 0.34 },
          { px: 0.16, pz: -0.28, sx: 0.046, sy: 0.014, sz: 0.032, m: 2, ry: -0.28 },
          { px: 0.30, pz: 0.12, sx: 0.040, sy: 0.013, sz: 0.028, m: 0, ry: 0.18 },
          { px: -0.05, pz: 0.31, sx: 0.038, sy: 0.012, sz: 0.026, m: 3, ry: -0.16 },
        ].forEach(({ px, pz, sx, sy, sz, m, ry }) => {
          const fg = new THREE.BoxGeometry(sx, sy, sz);
          const fm = new THREE.Mesh(fg, brickMats[m]);
          fm.position.set(cx + px, surfY + sy * 0.55 - 0.003, cz + pz);
          fm.rotation.y = ry;
          tileGroup.add(fm);
        });

        const pebbleMats = [
          new THREE.MeshStandardMaterial({ color: 0xb3a696, roughness: 0.92, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x8a7f73, roughness: 0.96, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x6f665d, roughness: 0.98, metalness: 0.0 }),
        ];
        [
          { px: -0.14, pz: -0.25, r: 0.013, m: 0, sy: 0.54 },
          { px: 0.09, pz: -0.04, r: 0.012, m: 1, sy: 0.58 },
          { px: 0.25, pz: 0.18, r: 0.011, m: 2, sy: 0.56 },
          { px: -0.26, pz: 0.10, r: 0.012, m: 1, sy: 0.55 },
        ].forEach(({ px, pz, r, m, sy }) => {
          const sg = new THREE.SphereGeometry(r, 5, 4);
          const sm = new THREE.Mesh(sg, pebbleMats[m]);
          sm.scale.y = sy;
          sm.position.set(cx + px, surfY + r * sy - 0.003, cz + pz);
          tileGroup.add(sm);
        });

        // Dry grass remains near edges
        const grassMat = new THREE.MeshStandardMaterial({
          color: 0x9b8b72,
          roughness: 1.0,
          metalness: 0.0,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.88,
        });
        [
          { px: -0.31, pz: -0.22, rot: 0.42, h: 0.050 },
          { px: 0.29, pz: -0.08, rot: -0.30, h: 0.047 },
          { px: 0.05, pz: 0.30, rot: 0.96, h: 0.044 },
        ].forEach(({ px, pz, rot, h }) => {
          const gg = new THREE.PlaneGeometry(0.016, h);
          const gm = new THREE.Mesh(gg, grassMat);
          gm.rotation.y = rot;
          gm.position.set(cx + px, surfY + h * 0.42, cz + pz);
          tileGroup.add(gm);
        });

        // Subtle warm/calm sheen to keep "clean but old" feel
        const warmSheenMat = new THREE.MeshBasicMaterial({
          color: 0xf0d9c2,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
        });
        const hg = new THREE.PlaneGeometry(0.12, 0.018);
        const hm = new THREE.Mesh(hg, warmSheenMat);
        hm.rotation.x = -Math.PI / 2;
        hm.rotation.z = -0.18;
        hm.position.set(cx + 0.03, surfY + 0.0016, cz - 0.02);
        tileGroup.add(hm);
      }
      if (t.type === 'soil_cracked') {
        const cx = t.x * TILE, cz = t.z * TILE;

        // Deep but readable cracks: dark core + soft edge
        const crackCoreMat = new THREE.MeshBasicMaterial({
          color: 0x1d1611,
          transparent: true,
          opacity: 0.72,
          side: THREE.DoubleSide,
        });
        const crackEdgeMat = new THREE.MeshBasicMaterial({
          color: 0x3a2e22,
          transparent: true,
          opacity: 0.36,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.74, core: 0.022, rot: 0.42, px: -0.01, pz: 0.02 },
          { w: 0.64, core: 0.020, rot: -0.58, px: 0.06, pz: -0.05 },
          { w: 0.34, core: 0.016, rot: 1.08, px: -0.14, pz: 0.15 },
        ].forEach(({ w, core, rot, px, pz }) => {
          const eg = new THREE.PlaneGeometry(w, core * 2.0);
          const em = new THREE.Mesh(eg, crackEdgeMat);
          em.rotation.x = -Math.PI / 2;
          em.rotation.z = rot;
          em.position.set(cx + px, surfY + 0.001, cz + pz);
          tileGroup.add(em);

          const cg = new THREE.PlaneGeometry(w * 0.96, core);
          const cm = new THREE.Mesh(cg, crackCoreMat);
          cm.rotation.x = -Math.PI / 2;
          cm.rotation.z = rot;
          cm.position.set(cx + px, surfY + 0.0012, cz + pz);
          tileGroup.add(cm);
        });

        // Crumbled dry-soil fragments
        const fragmentMats = [
          new THREE.MeshStandardMaterial({ color: 0x8b765d, roughness: 0.95, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x6f5d4a, roughness: 0.98, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x9d876b, roughness: 0.92, metalness: 0.0 }),
        ];
        [
          { px: -0.26, pz: -0.18, sx: 0.08, sy: 0.030, sz: 0.06, m: 0, ry: 0.34 },
          { px:  0.24, pz:  0.15, sx: 0.07, sy: 0.026, sz: 0.05, m: 1, ry: -0.46 },
          { px: -0.06, pz:  0.26, sx: 0.06, sy: 0.022, sz: 0.05, m: 2, ry: 0.18 },
          { px:  0.18, pz: -0.24, sx: 0.05, sy: 0.020, sz: 0.04, m: 1, ry: -0.22 },
        ].forEach(({ px, pz, sx, sy, sz, m, ry }) => {
          const fg = new THREE.BoxGeometry(sx, sy, sz);
          const fm = new THREE.Mesh(fg, fragmentMats[m]);
          fm.position.set(cx + px, surfY + sy * 0.52 - 0.004, cz + pz);
          fm.rotation.y = ry;
          tileGroup.add(fm);
        });

        // Small pebbles
        const pebbleMats = [
          new THREE.MeshStandardMaterial({ color: 0xb29d81, roughness: 0.9 }),
          new THREE.MeshStandardMaterial({ color: 0x7c6852, roughness: 0.96 }),
          new THREE.MeshStandardMaterial({ color: 0x988268, roughness: 0.92 }),
        ];
        [
          { px: -0.18, pz: 0.22, r: 0.014, m: 0, sy: 0.52 },
          { px:  0.06, pz: 0.18, r: 0.012, m: 1, sy: 0.55 },
          { px:  0.22, pz: -0.08, r: 0.013, m: 2, sy: 0.50 },
          { px: -0.02, pz: -0.26, r: 0.011, m: 1, sy: 0.58 },
          { px: -0.25, pz: -0.02, r: 0.012, m: 2, sy: 0.52 },
        ].forEach(({ px, pz, r, m, sy }) => {
          const sg = new THREE.SphereGeometry(r, 5, 4);
          const sm = new THREE.Mesh(sg, pebbleMats[m]);
          sm.scale.y = sy;
          sm.position.set(cx + px, surfY + r * sy - 0.003, cz + pz);
          tileGroup.add(sm);
        });

        // Dry grass remnants
        const remnantMat = new THREE.MeshStandardMaterial({
          color: 0x8d7b5c,
          roughness: 1.0,
          metalness: 0.0,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        [
          { px: -0.22, pz: 0.04, rot: 0.38, h: 0.055 },
          { px:  0.14, pz: -0.20, rot: -0.28, h: 0.050 },
          { px:  0.01, pz: 0.24, rot: 0.92, h: 0.048 },
        ].forEach(({ px, pz, rot, h }) => {
          const gg = new THREE.PlaneGeometry(0.017, h);
          const gm = new THREE.Mesh(gg, remnantMat);
          gm.rotation.y = rot;
          gm.position.set(cx + px, surfY + h * 0.45, cz + pz);
          tileGroup.add(gm);
        });

        // Slight dry sheen (quiet, not wet)
        const drySheenMat = new THREE.MeshBasicMaterial({
          color: 0xe2d8c8,
          transparent: true,
          opacity: 0.11,
          side: THREE.DoubleSide,
        });
        const hg = new THREE.PlaneGeometry(0.11, 0.017);
        const hm = new THREE.Mesh(hg, drySheenMat);
        hm.rotation.x = -Math.PI / 2;
        hm.rotation.z = -0.18;
        hm.position.set(cx + 0.04, surfY + 0.0016, cz - 0.03);
        tileGroup.add(hm);
      }

      if (t.type === 'path_broken') {
        const cx = t.x * TILE, cz = t.z * TILE;

        // Asphalt cracks: readable deep core + soft fracture edge
        const roadCrackCoreMat = new THREE.MeshBasicMaterial({
          color: 0x1f1d1b,
          transparent: true,
          opacity: 0.76,
          side: THREE.DoubleSide,
        });
        const roadCrackEdgeMat = new THREE.MeshBasicMaterial({
          color: 0x4f4a44,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.76, core: 0.020, rot: 0.36, px: -0.01, pz: -0.02 },
          { w: 0.58, core: 0.018, rot: -0.52, px: 0.10, pz: 0.10 },
          { w: 0.32, core: 0.014, rot: 1.10, px: -0.16, pz: 0.13 },
        ].forEach(({ w, core, rot, px, pz }) => {
          const eg = new THREE.PlaneGeometry(w, core * 2.1);
          const em = new THREE.Mesh(eg, roadCrackEdgeMat);
          em.rotation.x = -Math.PI / 2;
          em.rotation.z = rot;
          em.position.set(cx + px, surfY + 0.001, cz + pz);
          tileGroup.add(em);

          const cg = new THREE.PlaneGeometry(w * 0.96, core);
          const cm = new THREE.Mesh(cg, roadCrackCoreMat);
          cm.rotation.x = -Math.PI / 2;
          cm.rotation.z = rot;
          cm.position.set(cx + px, surfY + 0.0012, cz + pz);
          tileGroup.add(cm);
        });

        // Broken paving pieces (kept simple, low-poly)
        const slabMats = [
          new THREE.MeshStandardMaterial({ color: 0x7b766f, roughness: 0.9, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x69655f, roughness: 0.95, metalness: 0.0 }),
          new THREE.MeshStandardMaterial({ color: 0x85796f, roughness: 0.92, metalness: 0.0 }),
        ];
        [
          { px: -0.18, pz: -0.16, sx: 0.20, sy: 0.015, sz: 0.14, m: 0, ry: 0.18 },
          { px:  0.22, pz:  0.10, sx: 0.18, sy: 0.014, sz: 0.13, m: 1, ry: -0.22 },
          { px:  0.02, pz:  0.24, sx: 0.15, sy: 0.013, sz: 0.11, m: 2, ry: 0.14 },
        ].forEach(({ px, pz, sx, sy, sz, m, ry }) => {
          const sg = new THREE.BoxGeometry(sx, sy, sz);
          const sm = new THREE.Mesh(sg, slabMats[m]);
          sm.position.set(cx + px, surfY + sy * 0.52 - 0.003, cz + pz);
          sm.rotation.y = ry;
          tileGroup.add(sm);
        });

        // Missing edge hints (collapsed edge silhouette without changing tile bounds)
        const edgeChipMat = new THREE.MeshBasicMaterial({
          color: 0x2d2a27,
          transparent: true,
          opacity: 0.40,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.20, h: 0.07, px: -0.34, pz: -0.30, rot: -0.10 },
          { w: 0.18, h: 0.06, px: 0.33, pz: 0.28, rot: 0.20 },
          { w: 0.15, h: 0.05, px: 0.30, pz: -0.31, rot: -0.30 },
        ].forEach(({ w, h, px, pz, rot }) => {
          const eg = new THREE.PlaneGeometry(w, h);
          const em = new THREE.Mesh(eg, edgeChipMat);
          em.rotation.x = -Math.PI / 2;
          em.rotation.z = rot;
          em.position.set(cx + px, surfY + 0.0011, cz + pz);
          tileGroup.add(em);
        });

        // Gravel + debris
        const rubbleMats = [
          new THREE.MeshStandardMaterial({ color: 0x8f867a, roughness: 0.93 }),
          new THREE.MeshStandardMaterial({ color: 0x5f5a53, roughness: 0.98 }),
          new THREE.MeshStandardMaterial({ color: 0x786b5f, roughness: 0.95 }),
        ];
        [
          { px: -0.23, pz: 0.20, r: 0.015, m: 0, sy: 0.54 },
          { px: -0.06, pz: -0.26, r: 0.013, m: 1, sy: 0.58 },
          { px: 0.18, pz: -0.20, r: 0.014, m: 2, sy: 0.52 },
          { px: 0.27, pz: 0.18, r: 0.012, m: 1, sy: 0.56 },
          { px: -0.02, pz: 0.09, r: 0.011, m: 2, sy: 0.55 },
        ].forEach(({ px, pz, r, m, sy }) => {
          const rg = new THREE.SphereGeometry(r, 5, 4);
          const rm = new THREE.Mesh(rg, rubbleMats[m]);
          rm.scale.y = sy;
          rm.position.set(cx + px, surfY + r * sy - 0.003, cz + pz);
          tileGroup.add(rm);
        });
        [
          { px: -0.12, pz: 0.27, sx: 0.040, sy: 0.016, sz: 0.030, m: 2, ry: 0.50 },
          { px: 0.24, pz: -0.05, sx: 0.036, sy: 0.014, sz: 0.028, m: 1, ry: -0.32 },
          { px: 0.03, pz: -0.18, sx: 0.032, sy: 0.013, sz: 0.025, m: 0, ry: 0.16 },
        ].forEach(({ px, pz, sx, sy, sz, m, ry }) => {
          const dg = new THREE.BoxGeometry(sx, sy, sz);
          const dm = new THREE.Mesh(dg, rubbleMats[m]);
          dm.position.set(cx + px, surfY + sy * 0.55 - 0.003, cz + pz);
          dm.rotation.y = ry;
          tileGroup.add(dm);
        });

        // Dry dust veil (quiet, not dirty)
        const dustMat = new THREE.MeshBasicMaterial({
          color: 0xb2a595,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
        });
        [
          { w: 0.18, h: 0.10, px: -0.02, pz: -0.01, rot: 0.14 },
          { w: 0.14, h: 0.08, px: 0.16, pz: 0.17, rot: -0.30 },
        ].forEach(({ w, h, px, pz, rot }) => {
          const dg = new THREE.PlaneGeometry(w, h);
          const dm = new THREE.Mesh(dg, dustMat);
          dm.rotation.x = -Math.PI / 2;
          dm.rotation.z = rot;
          dm.position.set(cx + px, surfY + 0.0015, cz + pz);
          tileGroup.add(dm);
        });

        // Subtle calm highlight to keep it visually appealing
        const roadSheenMat = new THREE.MeshBasicMaterial({
          color: 0xd8cec0,
          transparent: true,
          opacity: 0.10,
          side: THREE.DoubleSide,
        });
        const hg = new THREE.PlaneGeometry(0.10, 0.016);
        const hm = new THREE.Mesh(hg, roadSheenMat);
        hm.rotation.x = -Math.PI / 2;
        hm.rotation.z = -0.22;
        hm.position.set(cx + 0.05, surfY + 0.0016, cz - 0.04);
        tileGroup.add(hm);
      }

      // Item on tile
      if (t.item) {
        const m = buildItem(t.item, t.x, t.z, t.itemRotation || 0);
        if (m) itemGroup.add(m);
      }
    });
  }

  function buildItem(id, x, z, rotation = 0) {
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
      // Back posts — run from floor through seat to backrest top, slight backward lean
      [-0.13, 0.13].forEach(bx => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.66, 0.028), ironMat);
        post.position.set(bx, 0.33, -0.13);
        post.rotation.x = 0.06;
        post.castShadow = true;
        g.add(post);
      });

      // Front legs — slight outward splay per side
      [-0.13, 0.13].forEach((fx, i) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.26, 0.028), ironMat);
        leg.position.set(fx, 0.13, 0.14);
        leg.rotation.z = (i===0 ? -1 : 1) * 0.022;
        leg.castShadow = true;
        g.add(leg);
      });

      // Lower cross braces (rust — worn joints)
      const brFront = new THREE.Mesh(new THREE.BoxGeometry(0.252, 0.018, 0.018), rustMat);
      brFront.position.set(0, 0.082, 0.14);
      g.add(brFront);
      const brBack = new THREE.Mesh(new THREE.BoxGeometry(0.252, 0.018, 0.018), rustMat);
      brBack.position.set(0, 0.082, -0.13);
      g.add(brBack);
      [-0.13, 0.13].forEach(sx => {
        const br = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.255), rustMat);
        br.position.set(sx, 0.082, 0.005);
        g.add(br);
      });

      // Seat — hard flat metal plate, top at y≈0.264
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.030, 0.28), ironMat);
      seat.position.set(0, 0.249, 0.005);
      seat.castShadow = true;
      g.add(seat);
      // Seat rim — rust, slightly wider/thinner lip
      const seatRim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.014, 0.30), rustMat);
      seatRim.position.set(0, 0.232, 0.005);
      g.add(seatRim);

      // Under-seat support bar
      const suppBar = new THREE.Mesh(new THREE.BoxGeometry(0.254, 0.018, 0.018), ironMat);
      suppBar.position.set(0, 0.228, -0.078);
      g.add(suppBar);

      // Backrest — top bar + mid bar + center strut (all slightly leaned)
      const bkTop = new THREE.Mesh(new THREE.BoxGeometry(0.254, 0.030, 0.030), ironMat);
      bkTop.position.set(0, 0.588, -0.165);
      bkTop.rotation.x = 0.06;
      bkTop.castShadow = true;
      g.add(bkTop);
      const bkMid = new THREE.Mesh(new THREE.BoxGeometry(0.254, 0.022, 0.022), ironMat);
      bkMid.position.set(0, 0.468, -0.158);
      bkMid.rotation.x = 0.06;
      g.add(bkMid);
      const bkStrut = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.132, 0.020), rustMat);
      bkStrut.position.set(0, 0.528, -0.162);
      bkStrut.rotation.x = 0.06;
      g.add(bkStrut);
    } else if (id === 'shelf_rust') {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x4e4a46, roughness: 0.9, metalness: 0.55 });
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x5d5851, roughness: 0.93, metalness: 0.35 });
      const rustAccentMat = new THREE.MeshStandardMaterial({ color: 0x7a4c34, roughness: 0.94, metalness: 0.24 });
      const chippedPaintMat = new THREE.MeshStandardMaterial({ color: 0x8d8377, roughness: 0.92, metalness: 0.2 });
      const grimeMat = new THREE.MeshStandardMaterial({ color: 0x413a34, roughness: 0.98, metalness: 0.1 });

      // Vertical posts (slightly bent / uneven)
      [
        [-0.275, -0.108, -0.034, -0.030],
        [ 0.270, -0.110,  0.026,  0.024],
        [-0.262,  0.108, -0.018, -0.014],
        [ 0.278,  0.108,  0.032,  0.030],
      ].forEach(([px, pz, dx, rz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.74, 0.036), frameMat);
        post.position.set(px + dx, 0.37, pz);
        post.rotation.z = rz;
        post.castShadow = true;
        g.add(post);
      });

      // Top / bottom rails
      [
        [0, 0.73, -0.108], [0, 0.73, 0.108],
        [0, 0.04, -0.108], [0, 0.04, 0.108],
      ].forEach(([rx, ry, rz], i) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.028, 0.024), i < 2 ? frameMat : rustAccentMat);
        rail.position.set(rx, ry, rz);
        rail.castShadow = true;
        g.add(rail);
      });
      [-0.275, 0.275].forEach((sx, i) => {
        const sideTop = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.028, 0.22), frameMat);
        sideTop.position.set(sx, 0.73, 0);
        sideTop.castShadow = true;
        g.add(sideTop);
        const sideBottom = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.028, 0.22), i === 0 ? rustAccentMat : frameMat);
        sideBottom.position.set(sx, 0.04, 0);
        sideBottom.castShadow = true;
        g.add(sideBottom);
      });

      // Shelf boards (slightly warped)
      const shelfLevels = [0.17, 0.37, 0.57];
      shelfLevels.forEach((sy, i) => {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.028, 0.22), shelfMat);
        board.position.set(0, sy, 0);
        board.rotation.z = (i - 1) * 0.012;
        board.rotation.x = i === 2 ? -0.012 : 0.006;
        board.castShadow = true;
        board.receiveShadow = true;
        g.add(board);

        // Front lip
        const lip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.018, 0.018), i % 2 === 0 ? frameMat : rustAccentMat);
        lip.position.set(0, sy - 0.004, 0.105);
        lip.rotation.z = board.rotation.z * 0.8;
        g.add(lip);
      });

      // Rusted cross braces
      [-0.23, 0.23].forEach((sx, i) => {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.52, 0.018), rustAccentMat);
        brace.position.set(sx, 0.39, i === 0 ? 0.09 : -0.09);
        brace.rotation.x = i === 0 ? 0.17 : -0.14;
        brace.rotation.z = i === 0 ? -0.06 : 0.05;
        g.add(brace);
      });

      // Chipped paint / worn patches
      [
        [-0.18, 0.58, 0.102, 0.11, 0.006, 0.035, 0.09],
        [ 0.14, 0.35, 0.102, 0.10, 0.006, 0.030,-0.12],
        [ 0.04, 0.17, 0.102, 0.08, 0.006, 0.028, 0.16],
      ].forEach(([px, py, pz, sx, sy, sz, rz]) => {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), chippedPaintMat);
        chip.position.set(px, py, pz);
        chip.rotation.y = rz;
        g.add(chip);
      });
      [
        [-0.22, 0.46, 0.107, 0.07, 0.004, 0.010, 0.22],
        [ 0.20, 0.26, 0.107, 0.05, 0.004, 0.010,-0.18],
      ].forEach(([px, py, pz, sx, sy, sz, rz]) => {
        const scratch = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), grimeMat);
        scratch.position.set(px, py, pz);
        scratch.rotation.y = rz;
        g.add(scratch);
      });

      // Stored objects: book, toolbox, box, bottle, scrap
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.026, 0.085),
        new THREE.MeshStandardMaterial({ color: 0x7a6149, roughness: 0.9 })
      );
      book.position.set(-0.16, 0.385, -0.015);
      book.rotation.y = -0.22;
      book.castShadow = true;
      g.add(book);

      const toolboxBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.050, 0.070),
        new THREE.MeshStandardMaterial({ color: 0x5e4e44, roughness: 0.88, metalness: 0.18 })
      );
      toolboxBody.position.set(0.15, 0.196, 0.000);
      toolboxBody.castShadow = true;
      g.add(toolboxBody);
      const toolboxHandle = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.012, 0.012), rustAccentMat);
      toolboxHandle.position.set(0.15, 0.230, 0.000);
      g.add(toolboxHandle);

      const smallBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.065, 0.085),
        new THREE.MeshStandardMaterial({ color: 0x6a5a4b, roughness: 0.95 })
      );
      smallBox.position.set(0.135, 0.602, 0.005);
      smallBox.rotation.y = 0.14;
      smallBox.castShadow = true;
      g.add(smallBox);

      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.022, 0.082, 8),
        new THREE.MeshStandardMaterial({ color: 0x9ba39a, roughness: 0.72, metalness: 0.06 })
      );
      bottle.position.set(-0.025, 0.609, 0.018);
      bottle.castShadow = true;
      g.add(bottle);
      const bottleNeck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.010, 0.022, 8),
        new THREE.MeshStandardMaterial({ color: 0x8c948b, roughness: 0.78 })
      );
      bottleNeck.position.set(-0.025, 0.661, 0.018);
      g.add(bottleNeck);

      const scrap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.05), rustAccentMat);
      scrap.position.set(-0.19, 0.181, 0.016);
      scrap.rotation.y = -0.36;
      g.add(scrap);
    } else if (id === 'bed_iron') {
      const matMattress = new THREE.MeshStandardMaterial({ color: 0x908070, roughness: 0.95 });
      const matBlanket  = new THREE.MeshStandardMaterial({ color: 0x6e7a74, roughness: 0.92 });
      const matPillow   = new THREE.MeshStandardMaterial({ color: 0xc0b09a, roughness: 0.93 });

      // 4 corner posts — head(-z) taller for headboard, foot(+z) shorter for footboard
      // alternate iron/rust for worn look; slight outward lean per side
      [[-0.27,-0.40,0.43],[0.27,-0.40,0.43],[-0.27,0.40,0.29],[0.27,0.40,0.29]]
        .forEach(([px,pz,h],i) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.036,h,0.036), i%2===0?ironMat:rustMat);
          post.position.set(px, h/2, pz);
          post.rotation.z = (px<0?-1:1)*0.03;
          post.castShadow = true;
          g.add(post);
        });

      // Side rails
      [-0.27,0.27].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.032,0.038,0.77), ironMat);
        rail.position.set(rx, 0.208, 0);
        rail.castShadow = true;
        g.add(rail);
      });

      // Headboard — top bar + mid bar + 3 vertical struts
      const hbTop = new THREE.Mesh(new THREE.BoxGeometry(0.58,0.034,0.034), ironMat);
      hbTop.position.set(0, 0.415, -0.40);
      g.add(hbTop);
      const hbMid = new THREE.Mesh(new THREE.BoxGeometry(0.58,0.024,0.024), ironMat);
      hbMid.position.set(0, 0.305, -0.40);
      g.add(hbMid);
      [-0.19,0,0.19].forEach(sx => {
        const sv = new THREE.Mesh(new THREE.BoxGeometry(0.022,0.138,0.022), rustMat);
        sv.position.set(sx, 0.358, -0.40);
        g.add(sv);
      });

      // Footboard — single bar
      const fbBar = new THREE.Mesh(new THREE.BoxGeometry(0.58,0.028,0.028), ironMat);
      fbBar.position.set(0, 0.268, 0.40);
      g.add(fbBar);

      // Slats (5) — rust-tinted, visible between frame and mattress
      for (let i=0;i<5;i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.016,0.048), rustMat);
        slat.position.set(0, 0.221, -0.29+i*0.145);
        g.add(slat);
      }

      // Mattress — worn gray-brown ticking
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.54,0.064,0.78), matMattress);
      mattress.position.set(0, 0.257, 0);
      mattress.castShadow = true;
      g.add(mattress);

      // Blanket — covers lower 2/3, with folded edge near head and toe-bunch at foot
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.50,0.026,0.52), matBlanket);
      blanket.position.set(0, 0.296, 0.13);
      g.add(blanket);
      const bFold = new THREE.Mesh(new THREE.BoxGeometry(0.50,0.036,0.052),
        new THREE.MeshStandardMaterial({ color: 0x7e8e88, roughness: 0.92 }));
      bFold.position.set(0, 0.298, -0.12);
      g.add(bFold);
      const bToe = new THREE.Mesh(new THREE.BoxGeometry(0.46,0.040,0.058), matBlanket);
      bToe.position.set(0, 0.300, 0.36);
      g.add(bToe);

      // Pillow — two-layer for slight puffy look
      const pilBase = new THREE.Mesh(new THREE.BoxGeometry(0.32,0.040,0.22), matPillow);
      pilBase.position.set(0, 0.289, -0.265);
      g.add(pilBase);
      const pilTop = new THREE.Mesh(new THREE.BoxGeometry(0.26,0.040,0.16),
        new THREE.MeshStandardMaterial({ color: 0xd0c0a8, roughness: 0.93 }));
      pilTop.position.set(0, 0.313, -0.265);
      g.add(pilTop);
    } else if (id === 'lamp_broken') {
      // Broken old street lamp: bent metal pole, cracked head, hanging wires, faint remaining glow
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x555b61, roughness: 0.86, metalness: 0.45 });
      const rustPatchMat = new THREE.MeshStandardMaterial({ color: 0x744f37, roughness: 0.96, metalness: 0.16 });
      const paintChipMat = new THREE.MeshStandardMaterial({ color: 0x8c8f8f, roughness: 0.90, metalness: 0.12 });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x9aa5af, roughness: 0.38, metalness: 0.02, transparent: true, opacity: 0.70
      });
      const wireMat = new THREE.MeshStandardMaterial({ color: 0x2c2522, roughness: 0.94, metalness: 0.08 });
      const warmGlowMat = new THREE.MeshStandardMaterial({
        color: 0xffd9ae, roughness: 0.45, emissive: 0xffb56f, emissiveIntensity: 1.1
      });
      const glowShellMat = new THREE.MeshStandardMaterial({
        color: 0xffcca0, roughness: 0.72, transparent: true, opacity: 0.26, emissive: 0xffa663, emissiveIntensity: 0.36
      });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.09, 8), poleMat);
      base.position.y = 0.045;
      base.castShadow = true;
      g.add(base);

      const lowerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.66, 7), poleMat);
      lowerPole.position.set(0.00, 0.39, 0.01);
      lowerPole.rotation.z = 0.08;
      lowerPole.castShadow = true;
      g.add(lowerPole);

      const bendJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.036, 0.24, 7), rustPatchMat);
      bendJoint.position.set(-0.04, 0.73, 0.02);
      bendJoint.rotation.z = 0.46;
      bendJoint.castShadow = true;
      g.add(bendJoint);

      const brokenArm = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.46, 7), poleMat);
      brokenArm.position.set(-0.20, 0.87, 0.02);
      brokenArm.rotation.z = 1.05;
      brokenArm.castShadow = true;
      g.add(brokenArm);

      const support = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.35, 0.028), rustPatchMat);
      support.position.set(-0.08, 0.58, -0.07);
      support.rotation.z = -0.18;
      support.castShadow = true;
      g.add(support);

      const headFrame = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.13, 0.16), poleMat);
      headFrame.position.set(-0.37, 0.84, 0.02);
      headFrame.rotation.z = -0.20;
      headFrame.castShadow = true;
      g.add(headFrame);

      const headInner = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 0.12), new THREE.MeshStandardMaterial({ color: 0x2c2f32, roughness: 0.95 }));
      headInner.position.set(-0.37, 0.84, 0.02);
      headInner.rotation.z = -0.20;
      g.add(headInner);

      // cracked / chipped glass pieces
      const glassA = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.048, 0.010), glassMat);
      glassA.position.set(-0.40, 0.82, 0.09);
      glassA.rotation.set(0.18, 0.15, -0.45);
      g.add(glassA);
      const glassB = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.042, 0.010), glassMat);
      glassB.position.set(-0.34, 0.80, -0.08);
      glassB.rotation.set(-0.14, -0.12, 0.32);
      g.add(glassB);
      const glassShard = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.030, 0.007), glassMat);
      glassShard.position.set(-0.43, 0.75, 0.02);
      glassShard.rotation.set(0.28, -0.08, 0.56);
      g.add(glassShard);

      // old hanging cables
      const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.23, 5), wireMat);
      wire1.position.set(-0.31, 0.70, 0.08);
      wire1.rotation.z = 0.30;
      g.add(wire1);
      const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.20, 5), wireMat);
      wire2.position.set(-0.43, 0.69, -0.04);
      wire2.rotation.z = -0.22;
      g.add(wire2);

      // chipped paint / rust patches
      const patch1 = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.010, 0.010), paintChipMat);
      patch1.position.set(-0.01, 0.56, 0.038);
      patch1.rotation.z = 0.24;
      g.add(patch1);
      const patch2 = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.010, 0.010), rustPatchMat);
      patch2.position.set(-0.18, 0.80, -0.022);
      patch2.rotation.z = -0.34;
      g.add(patch2);
      const patch3 = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.010, 0.010), rustPatchMat);
      patch3.position.set(-0.33, 0.89, 0.065);
      patch3.rotation.z = 0.52;
      g.add(patch3);

      // faint remaining lamp light (not too bright)
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), warmGlowMat);
      core.position.set(-0.37, 0.80, 0.02);
      g.add(core);
      const glowShell = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), glowShellMat);
      glowShell.position.set(-0.37, 0.80, 0.02);
      g.add(glowShell);
      const ll = new THREE.PointLight(0xffb16a, 0.34, 2.6, 1.8);
      ll.position.set(-0.37, 0.80, 0.02);
      g.add(ll);

      // tiny debris near base for abandoned-road feeling
      const chipA = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.04), rustPatchMat);
      chipA.position.set(0.11, 0.02, -0.05);
      chipA.rotation.y = 0.5;
      g.add(chipA);
      const chipB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.035), new THREE.MeshStandardMaterial({ color: 0x6f665d, roughness: 0.95 }));
      chipB.position.set(-0.08, 0.015, 0.09);
      chipB.rotation.y = -0.35;
      g.add(chipB);
    } else if (id === 'drum_oil') {
      // Old steel oil drum: dented, chipped paint, rust, label trace, subtle soot
      const drumBodyMat = new THREE.MeshStandardMaterial({ color: 0x9a4336, roughness: 0.84, metalness: 0.5 });
      const rustMatSoft = new THREE.MeshStandardMaterial({ color: 0x7a442f, roughness: 0.95, metalness: 0.17 });
      const chipMat = new THREE.MeshStandardMaterial({ color: 0xc0715a, roughness: 0.88, metalness: 0.22 });
      const grimeMat = new THREE.MeshStandardMaterial({ color: 0x3b3632, roughness: 0.98, metalness: 0.08 });
      const labelMat = new THREE.MeshStandardMaterial({ color: 0xb2a58c, roughness: 0.92, metalness: 0.05 });

      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.184, 0.173, 0.44, 12), drumBodyMat);
      drum.position.y = 0.30;
      drum.rotation.z = 0.025;
      drum.castShadow = true;
      drum.receiveShadow = true;
      g.add(drum);

      // Rim caps
      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.169, 0.171, 0.018, 12), chipMat);
      topCap.position.y = 0.523;
      topCap.rotation.z = 0.02;
      g.add(topCap);
      const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(0.161, 0.165, 0.018, 12), rustMatSoft);
      bottomCap.position.y = 0.078;
      bottomCap.rotation.z = 0.02;
      g.add(bottomCap);

      // Reinforcement bands (worn)
      const band1 = new THREE.Mesh(new THREE.TorusGeometry(0.181, 0.011, 6, 24), chipMat);
      band1.position.y = 0.395;
      band1.rotation.x = Math.PI / 2;
      band1.rotation.z = 0.03;
      g.add(band1);
      const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.178, 0.011, 6, 24), rustMatSoft);
      band2.position.y = 0.215;
      band2.rotation.x = Math.PI / 2;
      band2.rotation.z = 0.03;
      g.add(band2);

      // Dents / crushed side (soft low-poly planes pressed into body)
      const dentA = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.012), grimeMat);
      dentA.position.set(0.168, 0.29, 0.018);
      dentA.rotation.y = Math.PI / 2 - 0.22;
      dentA.rotation.z = -0.08;
      g.add(dentA);
      const dentB = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.010), grimeMat);
      dentB.position.set(-0.165, 0.34, -0.028);
      dentB.rotation.y = -Math.PI / 2 + 0.16;
      dentB.rotation.z = 0.06;
      g.add(dentB);

      // Rust / chipped paint patches
      [
        [0.09, 0.42, 0.158, 0.06, 0.014, 0.03, 0.28, rustMatSoft],
        [-0.13, 0.24, 0.146, 0.05, 0.012, 0.03, -0.31, rustMatSoft],
        [0.02, 0.16, -0.159, 0.07, 0.012, 0.03, 0.12, chipMat],
        [-0.06, 0.33, -0.157, 0.05, 0.012, 0.03, -0.18, chipMat],
      ].forEach(([px, py, pz, sx, sy, sz, ry, mat]) => {
        const patch = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
        patch.position.set(px, py, pz);
        patch.rotation.y = ry;
        patch.rotation.x = 0.03;
        g.add(patch);
      });

      // Old label trace (peeled)
      const label = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.075, 0.010), labelMat);
      label.position.set(-0.155, 0.285, 0.04);
      label.rotation.y = -Math.PI / 2 + 0.26;
      label.rotation.z = -0.02;
      g.add(label);
      const labelTear = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.018, 0.011), grimeMat);
      labelTear.position.set(-0.158, 0.302, 0.046);
      labelTear.rotation.y = -Math.PI / 2 + 0.26;
      g.add(labelTear);

      // subtle dark grime near lower side
      const soot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 12), grimeMat);
      soot.position.y = 0.11;
      soot.scale.set(1.02, 1, 1.02);
      soot.material = new THREE.MeshStandardMaterial({ color: 0x2f2b28, roughness: 0.99, metalness: 0.03, transparent: true, opacity: 0.32 });
      g.add(soot);
    } else if (id === 'shack_scrap') {
      // Lv1 — crude lean-to shack: mismatched iron plates, tilted posts, tarp roof
      const mPl  = new THREE.MeshStandardMaterial({ color: 0x7a4828, roughness: 0.90, metalness: 0.32 });
      const mPlD = new THREE.MeshStandardMaterial({ color: 0x5e3a20, roughness: 0.92, metalness: 0.28 });
      const mWd  = new THREE.MeshStandardMaterial({ color: 0x3c2816, roughness: 0.97 });
      const mTp  = new THREE.MeshStandardMaterial({ color: 0x4c4438, roughness: 0.99 });
      const mDk  = new THREE.MeshStandardMaterial({ color: 0x181210, roughness: 0.95 });
      // Foundation
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.036, 0.72), new THREE.MeshStandardMaterial({ color: 0x1e1912, roughness: 1.0 }));
      slab.position.y = 0.018; g.add(slab);
      // Walls (iron plates, mismatched)
      const wB = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.50, 0.032), mPl);
      wB.position.set(0, 0.286, -0.352); g.add(wB);
      const wL = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.47, 0.68), mPlD);
      wL.position.set(-0.352, 0.272, 0); g.add(wL);
      const wR = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.51, 0.68), mPl);
      wR.position.set(0.352, 0.292, 0); g.add(wR);
      // Front wall (split for door gap)
      const wFL = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.50, 0.032), mPlD);
      wFL.position.set(-0.243, 0.286, 0.352); g.add(wFL);
      const wFR = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.50, 0.032), mPl);
      wFR.position.set( 0.243, 0.286, 0.352); g.add(wFR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.08, 0.032), mWd);
      lintel.position.set(0, 0.498, 0.352); g.add(lintel);
      // Corner posts (slightly tilted)
      [[-0.344,-0.344, 0.04],[0.344,-0.344,-0.03],[-0.344,0.344,-0.03],[0.344,0.344, 0.04]].forEach(([px,pz,rz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.60, 0.058), mWd);
        post.position.set(px, 0.30, pz); post.rotation.z = rz; post.castShadow = true; g.add(post);
      });
      // Door (dark opening)
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.40, 0.020), mDk);
      door.position.set(0, 0.236, 0.365); door.rotation.z = 0.03; g.add(door);
      // Roof — lean-to tarp, front-lower slope
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.040, 0.78), mTp);
      roof.position.set(0, 0.575, 0.016); roof.rotation.x = -0.13; roof.castShadow = true; g.add(roof);
      // Drape strip over door
      const drape = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.028, 0.055), mTp);
      drape.position.set(0, 0.548, 0.418); g.add(drape);

    } else if (id === 'shack_scrap_2') {
      // Lv2 — reinforced scrap shack: overlapping plates, tin roof, window, crate
      const mPl  = new THREE.MeshStandardMaterial({ color: 0x7a4828, roughness: 0.88, metalness: 0.34 });
      const mPlD = new THREE.MeshStandardMaterial({ color: 0x5e3a20, roughness: 0.90, metalness: 0.28 });
      const mWd  = new THREE.MeshStandardMaterial({ color: 0x3e2a18, roughness: 0.96 });
      const mTin = new THREE.MeshStandardMaterial({ color: 0x6a5838, roughness: 0.84, metalness: 0.26 });
      const mDk  = new THREE.MeshStandardMaterial({ color: 0x181410, roughness: 0.95 });
      const mWin = new THREE.MeshStandardMaterial({ color: 0x1a2830, roughness: 0.55, metalness: 0.12, transparent: true, opacity: 0.75 });
      // Foundation
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.040, 0.78), new THREE.MeshStandardMaterial({ color: 0x1e1912, roughness: 1.0 }));
      slab.position.y = 0.020; g.add(slab);
      // Walls
      const wDefs2 = [
        [0.76, 0.54, 0.034, 0, 0.312, -0.375, mPl ],
        [0.034, 0.52, 0.74, -0.375, 0.300, 0, mPlD],
        [0.034, 0.54, 0.74,  0.375, 0.312, 0, mPl ],
        [0.26,  0.54, 0.034, -0.25, 0.312, 0.375, mPlD],
        [0.18,  0.54, 0.034,  0.29, 0.312, 0.375, mPl ],
        [0.22,  0.10, 0.034,  0.04, 0.530, 0.375, mWd ],
      ];
      wDefs2.forEach(([gw,gh,gd, px,py,pz, m]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(gw,gh,gd), m);
        mesh.position.set(px,py,pz); g.add(mesh);
      });
      // Reinforcing wood planks on back wall
      [0.10, 0.37].forEach(py => {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.048, 0.034), mWd);
        plank.position.set(0, py, -0.378); g.add(plank);
      });
      // Corner posts
      [[-0.375,-0.375],[0.375,-0.375],[-0.375,0.375],[0.375,0.375]].forEach(([px,pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.64, 0.068), mWd);
        post.position.set(px, 0.32, pz); post.castShadow = true; g.add(post);
      });
      // Door (plank door)
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.028), mDk);
      door.position.set(0.04, 0.260, 0.390); g.add(door);
      const dfT = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.040, 0.028), mWd);
      dfT.position.set(0.04, 0.504, 0.390); g.add(dfT);
      // Window (left wall)
      const winPane = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.18, 0.20), mWin);
      winPane.position.set(-0.378, 0.35, 0.08); g.add(winPane);
      const wfTop = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.022, 0.23), mWd);
      wfTop.position.set(-0.378, 0.448, 0.08); g.add(wfTop);
      const wfBot = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.022, 0.23), mWd);
      wfBot.position.set(-0.378, 0.253, 0.08); g.add(wfBot);
      // Tin roof (slight slope + ridge)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.046, 0.85), mTin);
      roof.position.set(0, 0.652, 0); roof.rotation.x = -0.055; roof.castShadow = true; g.add(roof);
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.83, 0.058, 0.034), mWd);
      ridge.position.set(0, 0.682, 0); g.add(ridge);
      // Crate outside (front-left)
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.10), mWd);
      crate.position.set(-0.40, 0.095, 0.43); g.add(crate);
      const crateTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.010, 0.10), mPlD);
      crateTop.position.set(-0.40, 0.155, 0.43); g.add(crateTop);

    } else if (id === 'shack_scrap_3') {
      // Lv3 — fortified small home: solid walls, peaked roof, chimney, warm windows
      const mPl  = new THREE.MeshStandardMaterial({ color: 0x7a4828, roughness: 0.85, metalness: 0.38 });
      const mPlD = new THREE.MeshStandardMaterial({ color: 0x5e3a20, roughness: 0.88, metalness: 0.30 });
      const mWd  = new THREE.MeshStandardMaterial({ color: 0x3e2a18, roughness: 0.95 });
      const mTin = new THREE.MeshStandardMaterial({ color: 0x5a4c30, roughness: 0.82, metalness: 0.30 });
      const mChim= new THREE.MeshStandardMaterial({ color: 0x2c2820, roughness: 0.96, metalness: 0.10 });
      const mWin = new THREE.MeshStandardMaterial({ color: 0x3a2810, roughness: 0.50, transparent: true, opacity: 0.88, emissive: new THREE.Color(0xc07820), emissiveIntensity: 0.38 });
      const mDk  = new THREE.MeshStandardMaterial({ color: 0x181410, roughness: 0.95 });
      // Foundation
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.044, 0.84), new THREE.MeshStandardMaterial({ color: 0x201c14, roughness: 1.0 }));
      slab.position.y = 0.022; g.add(slab);
      // Walls (reinforced composite)
      const wDefs3 = [
        [0.82, 0.60, 0.036, 0,     0.344, -0.402, mPl ],
        [0.036, 0.58, 0.80, -0.402, 0.334, 0,     mPlD],
        [0.036, 0.60, 0.80,  0.402, 0.344, 0,     mPl ],
        [0.28,  0.60, 0.036, -0.27, 0.344, 0.402, mPlD],
        [0.20,  0.60, 0.036,  0.31, 0.344, 0.402, mPl ],
        [0.24,  0.12, 0.036,  0.02, 0.584, 0.402, mWd ],
      ];
      wDefs3.forEach(([gw,gh,gd, px,py,pz, m]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(gw,gh,gd), m);
        mesh.position.set(px,py,pz); g.add(mesh);
      });
      // Wood reinforcement strips (back wall + right wall)
      [[0, 0.10, -0.406, 0.82, true],[0, 0.36, -0.406, 0.82, true],
       [0, 0.10, 0, 0.80, false],[0, 0.36, 0, 0.80, false]].forEach(([cx, py, pz, sz, isBack]) => {
        const p = new THREE.Mesh(new THREE.BoxGeometry(isBack ? sz : 0.036, 0.048, isBack ? 0.036 : sz), mWd);
        p.position.set(isBack ? cx : -0.406, py, isBack ? pz : cx); g.add(p);
      });
      // Corner posts (sturdy)
      [[-0.40,-0.40],[0.40,-0.40],[-0.40,0.40],[0.40,0.40]].forEach(([px,pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.080, 0.70, 0.080), mWd);
        post.position.set(px, 0.35, pz); post.castShadow = true; g.add(post);
      });
      // Door with frame
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, 0.028), mDk);
      door.position.set(0.02, 0.286, 0.416); g.add(door);
      [[0.30,0.044,0.028, 0.02,0.536,0.416],
       [0.040,0.50,0.028, -0.105,0.286,0.416],
       [0.040,0.50,0.028,  0.145,0.286,0.416]].forEach(([gw,gh,gd, px,py,pz]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(gw,gh,gd), mWd);
        m.position.set(px,py,pz); g.add(m);
      });
      // Front window (left of door) with warm glow
      const winF = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.036), mWin);
      winF.position.set(-0.29, 0.38, 0.402); g.add(winF);
      const wfFT = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.024, 0.036), mWd);
      wfFT.position.set(-0.29, 0.478, 0.402); g.add(wfFT);
      const wfFB = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.024, 0.036), mWd);
      wfFB.position.set(-0.29, 0.284, 0.402); g.add(wfFB);
      // Side window (left wall) with warm glow
      const winS = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.18, 0.18), mWin);
      winS.position.set(-0.402, 0.38, -0.06); g.add(winS);
      const wfST = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.024, 0.22), mWd);
      wfST.position.set(-0.402, 0.478, -0.06); g.add(wfST);
      const wfSB = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.024, 0.22), mWd);
      wfSB.position.set(-0.402, 0.284, -0.06); g.add(wfSB);
      // Peaked tin roof (two slopes, ridge along X)
      // Panel length ≈ sqrt(0.425² + 0.215²) ≈ 0.476, angle ≈ atan(0.215/0.425) ≈ 0.468rad
      const roofF = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.042, 0.476), mTin);
      roofF.position.set(0, 0.774, 0.212); roofF.rotation.x =  0.468; roofF.castShadow = true; g.add(roofF);
      const roofB = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.042, 0.476), mTin);
      roofB.position.set(0, 0.774,-0.212); roofB.rotation.x = -0.468; roofB.castShadow = true; g.add(roofB);
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.058, 0.058), mWd);
      ridge.position.set(0, 0.862, 0); g.add(ridge);
      // Gable ends (triangular fill — approximate with a tall thin box)
      const gableF = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.22, 0.45), mPl);
      gableF.position.set(0.41, 0.770, 0); g.add(gableF);
      const gableB = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.22, 0.45), mPlD);
      gableB.position.set(-0.41, 0.770, 0); g.add(gableB);
      // Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.28, 0.10), mChim);
      chimney.position.set(0.24, 0.875, -0.16); g.add(chimney);
      const chimneyTop = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.024, 0.135), mChim);
      chimneyTop.position.set(0.24, 1.015, -0.16); g.add(chimneyTop);
      const soot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.024, 0.09), new THREE.MeshStandardMaterial({ color: 0x181410, roughness: 1.0, transparent: true, opacity: 0.55 }));
      soot.position.set(0.24, 1.028, -0.16); g.add(soot);
      // Outside: barrel (right-front)
      const barrelBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.175, 8), mPlD);
      barrelBody.position.set(0.44, 0.128, 0.44); g.add(barrelBody);
      const barrelHoop = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.018, 8), mWd);
      barrelHoop.position.set(0.44, 0.138, 0.44); g.add(barrelHoop);
      // Outside: crate (left-front)
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.110, 0.10), mWd);
      crate.position.set(-0.42, 0.095, 0.42); g.add(crate);
      const crateTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.010, 0.10), mPlD);
      crateTop.position.set(-0.42, 0.150, 0.42); g.add(crateTop);

    } else if (id === 'warehouse_rust') {
      // Lv1 — old corrugated iron shed: peeling paint, single warped door, padlock, flat roof
      const mPl  = new THREE.MeshStandardMaterial({ color: 0x7a4828, roughness: 0.85, metalness: 0.40 });
      const mPlD = new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: 0.88, metalness: 0.36 });
      const mWd  = new THREE.MeshStandardMaterial({ color: 0x3c2816, roughness: 0.96 });
      const mDk  = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.93 });
      const mPnt = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.95 });
      // Foundation
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.040, 0.82), new THREE.MeshStandardMaterial({ color: 0x1c1814, roughness: 1.0 }));
      slab.position.y = 0.020; g.add(slab);
      // Walls (slightly varying heights)
      const wB = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.62, 0.036), mPl);
      wB.position.set(0, 0.354, -0.392); g.add(wB);
      const wL = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.60, 0.78), mPlD);
      wL.position.set(-0.392, 0.344, 0); g.add(wL);
      const wR = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.63, 0.78), mPl);
      wR.position.set(0.392, 0.359, 0); g.add(wR);
      const wFL = new THREE.Mesh(new THREE.BoxGeometry(0.225, 0.62, 0.036), mPlD);
      wFL.position.set(-0.288, 0.354, 0.392); g.add(wFL);
      const wFR = new THREE.Mesh(new THREE.BoxGeometry(0.225, 0.62, 0.036), mPl);
      wFR.position.set( 0.288, 0.354, 0.392); g.add(wFR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.082, 0.036), mWd);
      lintel.position.set(0, 0.614, 0.392); g.add(lintel);
      // Corrugation hint strips on back wall
      [0.14, 0.30, 0.46, 0.58].forEach(py => {
        const cs = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.016, 0.003), mPlD);
        cs.position.set(0, py, -0.411); g.add(cs);
      });
      // Faded paint patch
      const paint = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.20, 0.002), mPnt);
      paint.position.set(-0.14, 0.44, -0.411); g.add(paint);
      // Corner ribs
      [[-0.392,-0.392],[0.392,-0.392],[-0.392,0.392],[0.392,0.392]].forEach(([px,pz]) => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.64, 0.042), mPlD);
        rib.position.set(px, 0.352, pz); g.add(rib);
      });
      // Single door (slightly warped)
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.52, 0.024), mDk);
      door.position.set(0, 0.304, 0.404); door.rotation.z = 0.022; g.add(door);
      const dfT = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.034, 0.024), mWd);
      dfT.position.set(0, 0.572, 0.404); g.add(dfT);
      // Padlock
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.028), mPlD);
      lock.position.set(0.12, 0.380, 0.412); g.add(lock);
      const lockArch = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.022, 0.028), mWd);
      lockArch.position.set(0.12, 0.405, 0.412); g.add(lockArch);
      // Flat roof (slight slope + front rim)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.048, 0.90), mPl);
      roof.position.set(0, 0.684, 0); roof.rotation.x = 0.038; roof.castShadow = true; g.add(roof);
      const roofRim = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.030, 0.028), mPlD);
      roofRim.position.set(0, 0.696, 0.445); g.add(roofRim);

    } else if (id === 'warehouse_rust_2') {
      // Lv2 — reinforced storage: steel bands, double doors, stacked crates, repair patch
      const mPl  = new THREE.MeshStandardMaterial({ color: 0x7a4828, roughness: 0.84, metalness: 0.42 });
      const mPlD = new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: 0.87, metalness: 0.38 });
      const mSt  = new THREE.MeshStandardMaterial({ color: 0x4a3c28, roughness: 0.82, metalness: 0.44 });
      const mWd  = new THREE.MeshStandardMaterial({ color: 0x3c2816, roughness: 0.96 });
      const mDk  = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.93 });
      // Foundation
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.044, 0.88), new THREE.MeshStandardMaterial({ color: 0x1c1814, roughness: 1.0 }));
      slab.position.y = 0.022; g.add(slab);
      // Walls (taller)
      [[0.86,0.68,0.036, 0,0.384,-0.422, mPl],[0.036,0.66,0.84,-0.422,0.374,0,mPlD],
       [0.036,0.69,0.84, 0.422,0.389,0,mPl],[0.24,0.68,0.036,-0.31,0.384,0.422,mPlD],
       [0.20,0.68,0.036, 0.33,0.384,0.422,mPl],[0.30,0.10,0.036,0,0.656,0.422,mWd]
      ].forEach(([gw,gh,gd,px,py,pz,m]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(gw,gh,gd), m);
        mesh.position.set(px,py,pz); g.add(mesh);
      });
      // Horizontal reinforcement bands (3 per wall)
      [0.12, 0.40, 0.62].forEach(py => {
        [[0.86,0.044,0.036, 0,py,-0.426],[0.036,0.044,0.84,-0.426,py,0],[0.036,0.044,0.84,0.426,py,0]].forEach(([gw,gh,gd,px,_py,pz]) => {
          const b = new THREE.Mesh(new THREE.BoxGeometry(gw,gh,gd), mSt);
          b.position.set(px,py,pz); g.add(b);
        });
      });
      // Corner ribs
      [[-0.422,-0.422],[0.422,-0.422],[-0.422,0.422],[0.422,0.422]].forEach(([px,pz]) => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.70, 0.050), mPlD);
        rib.position.set(px, 0.382, pz); g.add(rib);
      });
      // Double door panels
      [[-0.08, 0.012],[0.08,-0.012]].forEach(([px,rz]) => {
        const dp = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.55, 0.026), mDk);
        dp.position.set(px, 0.319, 0.434); dp.rotation.z = rz; g.add(dp);
      });
      const divBar = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.57, 0.026), mWd);
      divBar.position.set(0, 0.319, 0.434); g.add(divBar);
      const dfT2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.038, 0.026), mWd);
      dfT2.position.set(0, 0.614, 0.434); g.add(dfT2);
      // Lock bar
      const lockBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.022, 0.028), mPlD);
      lockBar2.position.set(0, 0.40, 0.446); g.add(lockBar2);
      // Repair patch on left wall
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.22, 0.28), mSt);
      patch.position.set(-0.425, 0.52, -0.10); g.add(patch);
      // Stacked crates (front-right)
      [[0.45,0.090,0.43],[0.45,0.202,0.43]].forEach(([px,py,pz]) => {
        const cr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.108, 0.10), mWd);
        cr.position.set(px,py,pz); g.add(cr);
      });
      // Flat roof + ridge
      const roof2 = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.050, 0.96), mPl);
      roof2.position.set(0, 0.752, 0); roof2.castShadow = true; g.add(roof2);
      const ridge2 = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.032, 0.038), mSt);
      ridge2.position.set(0, 0.780, 0); g.add(ridge2);

    } else if (id === 'warehouse_rust_3') {
      // Lv3 — major storage: thick walls, double doors, work lamp, material rack, stacked boxes
      const mPl  = new THREE.MeshStandardMaterial({ color: 0x7a4828, roughness: 0.82, metalness: 0.44 });
      const mPlD = new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: 0.86, metalness: 0.40 });
      const mSt  = new THREE.MeshStandardMaterial({ color: 0x4a3c28, roughness: 0.80, metalness: 0.46 });
      const mWd  = new THREE.MeshStandardMaterial({ color: 0x3c2816, roughness: 0.95 });
      const mDk  = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.93 });
      const mLamp= new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.6, emissive: new THREE.Color(0xd08020), emissiveIntensity: 0.40 });
      const mPatch= new THREE.MeshStandardMaterial({ color: 0x4a3c28, roughness: 0.82, metalness: 0.42 });
      // Foundation
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.048, 0.94), new THREE.MeshStandardMaterial({ color: 0x201c14, roughness: 1.0 }));
      slab.position.y = 0.024; g.add(slab);
      // Thick walls
      [[0.92,0.76,0.042, 0,0.428,-0.452,mPl],[0.042,0.74,0.90,-0.452,0.418,0,mPlD],
       [0.042,0.76,0.90, 0.452,0.428,0,mPl],[0.26,0.76,0.042,-0.33,0.428,0.452,mPlD],
       [0.22,0.76,0.042,  0.35,0.428,0.452,mPl],[0.32,0.12,0.042,0,0.716,0.452,mSt]
      ].forEach(([gw,gh,gd,px,py,pz,m]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(gw,gh,gd), m);
        mesh.position.set(px,py,pz); g.add(mesh);
      });
      // Heavy reinforcement bands
      [0.12, 0.44, 0.68].forEach(py => {
        [[0.92,0.052,0.042, 0,py,-0.456],[0.042,0.052,0.90,-0.456,py,0],[0.042,0.052,0.90,0.456,py,0]].forEach(([gw,gh,gd,px,_,pz]) => {
          const b = new THREE.Mesh(new THREE.BoxGeometry(gw,gh,gd), mSt);
          b.position.set(px,py,pz); g.add(b);
        });
      });
      // Corner ribs
      [[-0.452,-0.452],[0.452,-0.452],[-0.452,0.452],[0.452,0.452]].forEach(([px,pz]) => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.80, 0.060), mPlD);
        rib.position.set(px, 0.428, pz); g.add(rib);
      });
      // Double doors (two panels)
      [[-0.085],[0.085]].forEach(([px]) => {
        const dp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.60, 0.030), mDk);
        dp.position.set(px, 0.348, 0.466); g.add(dp);
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.018, 0.030), mSt);
        hBar.position.set(px, 0.500, 0.466); g.add(hBar);
      });
      const divBar3 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.62, 0.030), mWd);
      divBar3.position.set(0, 0.348, 0.466); g.add(divBar3);
      const dfTop3 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.042, 0.030), mSt);
      dfTop3.position.set(0, 0.672, 0.466); g.add(dfTop3);
      const lockBar3 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.026, 0.034), mPlD);
      lockBar3.position.set(0, 0.440, 0.480); g.add(lockBar3);
      // Flat roof with repair patch
      const roofMain = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.054, 1.02), mPl);
      roofMain.position.set(0, 0.836, 0); roofMain.castShadow = true; g.add(roofMain);
      const roofPatch = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.010, 0.40), mPatch);
      roofPatch.position.set(-0.20, 0.864, 0.12); g.add(roofPatch);
      const roofEdge = new THREE.Mesh(new THREE.BoxGeometry(1.00, 0.036, 0.038), mSt);
      roofEdge.position.set(0, 0.857, 0.488); g.add(roofEdge);
      // Work lamp above door
      const lampPost3 = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.10, 0.020), mSt);
      lampPost3.position.set(0, 0.732, 0.468); g.add(lampPost3);
      const lampBody3 = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.028, 0.048, 8), mLamp);
      lampBody3.position.set(0, 0.760, 0.468); g.add(lampBody3);
      const lampShade3 = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.030, 0.022, 8), mSt);
      lampShade3.position.set(0, 0.781, 0.468); g.add(lampShade3);
      // External material rack (right side)
      [[0.458,0.24,-0.28],[0.458,0.24,0.10]].forEach(([px,py,pz]) => {
        const rp = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.48, 0.024), mWd);
        rp.position.set(px,py,pz); g.add(rp);
      });
      [0.14,0.30,0.46].forEach(py => {
        const sh = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.42), mSt);
        sh.position.set(0.458, py, -0.09); g.add(sh);
      });
      // Stacked boxes (left-front)
      [[-0.46,0.095,0.47],[-0.46,0.210,0.47],[-0.32,0.095,0.47]].forEach(([px,py,pz]) => {
        const bx = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.106, 0.09), mWd);
        bx.position.set(px,py,pz); g.add(bx);
      });

    } else if (id === 'field_barren') {
      const mSoil = new THREE.MeshStandardMaterial({ color: 0x2c1e0e, roughness: 1.0 });
      const mDark = new THREE.MeshStandardMaterial({ color: 0x1e1408, roughness: 1.0 });
      // Tilled rows
      for (let i = 0; i < 4; i++) {
        const row = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.05, 0.12), mSoil);
        row.position.set(0, 0.10, -0.27 + i * 0.18);
        g.add(row);
        const groove = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.02, 0.04), mDark);
        groove.position.set(0, 0.09, -0.27 + i * 0.18);
        g.add(groove);
      }
      // Small pebbles
      [[-0.28,0.08],[-0.10,0.08],[0.22,0.08],[0.32,0.08]].forEach(([px,pz]) => {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 1.0 }));
        p.scale.y = 0.5;
        p.position.set(px, 0.095, pz);
        g.add(p);
      });
    } else if (id === 'potato_field_0') {
      const mSoil = new THREE.MeshStandardMaterial({ color: 0x2c1e0e, roughness: 1.0 });
      const mMound = new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 1.0 });
      // Tilled rows (same as field_barren)
      for (let i = 0; i < 4; i++) {
        const row = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.05, 0.12), mSoil);
        row.position.set(0, 0.10, -0.27 + i * 0.18);
        g.add(row);
      }
      // Seed mounds — 3 small bumps
      [-0.22, 0, 0.22].forEach(px => {
        const mound = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), mMound);
        mound.scale.y = 0.45;
        mound.position.set(px, 0.10, 0);
        g.add(mound);
        // Tiny seed crack
        const crack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.04), new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 1.0 }));
        crack.position.set(px, 0.12, 0);
        g.add(crack);
      });
    } else if (id === 'potato_field_50') {
      const mSoil = new THREE.MeshStandardMaterial({ color: 0x2c1e0e, roughness: 1.0 });
      const mStem = new THREE.MeshStandardMaterial({ color: 0x4a5a28, roughness: 1.0 });
      const mLeaf = new THREE.MeshStandardMaterial({ color: 0x5a6a30, roughness: 0.9 });
      for (let i = 0; i < 4; i++) {
        const row = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.05, 0.12), mSoil);
        row.position.set(0, 0.10, -0.27 + i * 0.18);
        g.add(row);
      }
      // Small sprouts — 3 plants
      [-0.22, 0, 0.22].forEach(px => {
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.025), mStem);
        stem.position.set(px, 0.175, 0);
        g.add(stem);
        const leafL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.06), mLeaf);
        leafL.rotation.z = 0.5;
        leafL.position.set(px - 0.07, 0.24, 0.02);
        g.add(leafL);
        const leafR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.06), mLeaf);
        leafR.rotation.z = -0.5;
        leafR.position.set(px + 0.07, 0.24, -0.02);
        g.add(leafR);
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), mLeaf);
        top.scale.y = 0.55;
        top.position.set(px, 0.28, 0);
        g.add(top);
      });
    } else if (id === 'potato_field_100') {
      const mSoil = new THREE.MeshStandardMaterial({ color: 0x2c1e0e, roughness: 1.0 });
      const mStem = new THREE.MeshStandardMaterial({ color: 0x3a4820, roughness: 1.0 });
      const mLeaf = new THREE.MeshStandardMaterial({ color: 0x4a6028, roughness: 0.9 });
      const mTuber = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.85 });
      for (let i = 0; i < 4; i++) {
        const row = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.05, 0.12), mSoil);
        row.position.set(0, 0.10, -0.27 + i * 0.18);
        g.add(row);
      }
      // Full-grown plants — 3 plants
      [-0.22, 0, 0.22].forEach(px => {
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), mStem);
        stem.position.set(px, 0.22, 0);
        g.add(stem);
        // Leaves spread out
        [[-0.10,0.30,0.3],[ 0.10,0.32,-0.3],[-0.06,0.38,0.0],[0.08,0.40,0.4]].forEach(([lx,ly,rz]) => {
          const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.07), mLeaf);
          leaf.rotation.z = rz;
          leaf.position.set(px + lx, ly, 0);
          g.add(leaf);
        });
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 5), mLeaf);
        crown.scale.y = 0.6;
        crown.position.set(px, 0.44, 0);
        g.add(crown);
        // Exposed tuber bulge
        const tuber = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), mTuber);
        tuber.scale.set(1.1, 0.7, 0.9);
        tuber.position.set(px + 0.06, 0.10, 0.04);
        g.add(tuber);
      });
    } else if (id === 'iron_rust') {
      // Rust iron ore: red-brown rust veins, black-gray rock, chipped metal fragments
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x353230, roughness: 0.95, metalness: 0.08 });
      const rustOreMat = new THREE.MeshStandardMaterial({ color: 0x8a4f38, roughness: 0.88, metalness: 0.34 });
      const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x514740, roughness: 0.78, metalness: 0.58 });
      const dustMat = new THREE.MeshStandardMaterial({ color: 0x6f5b48, roughness: 0.98, metalness: 0.02 });

      const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.20, 0), rockMat);
      core.position.set(-0.03, 0.20, 0.00);
      core.scale.set(1.08, 0.92, 1.00);
      core.castShadow = true;
      core.receiveShadow = true;
      g.add(core);

      const sideRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), rockMat);
      sideRock.position.set(0.16, 0.14, 0.10);
      sideRock.scale.set(1.0, 0.85, 0.95);
      sideRock.rotation.y = 0.5;
      sideRock.castShadow = true;
      g.add(sideRock);

      const backRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), rockMat);
      backRock.position.set(-0.18, 0.13, -0.06);
      backRock.scale.set(0.95, 0.82, 0.92);
      backRock.rotation.y = -0.4;
      g.add(backRock);

      // Rusty ore veins
      [
        [-0.03, 0.25, 0.16, 0.16, 0.05, 0.03, -0.25],
        [0.12, 0.19, -0.11, 0.14, 0.04, 0.03, 0.32],
        [-0.17, 0.17, 0.03, 0.10, 0.035, 0.03, 0.10],
      ].forEach(([px, py, pz, sx, sy, sz, ry]) => {
        const vein = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), rustOreMat);
        vein.position.set(px, py, pz);
        vein.rotation.y = ry;
        vein.rotation.x = 0.08;
        vein.castShadow = true;
        g.add(vein);
      });

      // Chipped exposed metal fragments
      const shardA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.03), darkMetalMat);
      shardA.position.set(0.07, 0.27, 0.02);
      shardA.rotation.set(0.2, 0.7, -0.25);
      g.add(shardA);
      const shardB = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.03), darkMetalMat);
      shardB.position.set(-0.11, 0.16, -0.12);
      shardB.rotation.set(-0.12, -0.55, 0.18);
      g.add(shardB);

      // Fine cracks / dry dust and soil adhered to surface
      [
        [0.00, 0.30, 0.04, 0.11, 0.006, 0.008, -0.18],
        [-0.09, 0.22, -0.08, 0.09, 0.006, 0.008, 0.26],
      ].forEach(([px, py, pz, sx, sy, sz, ry]) => {
        const crack = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshStandardMaterial({ color: 0x272220, roughness: 0.99 }));
        crack.position.set(px, py, pz);
        crack.rotation.y = ry;
        g.add(crack);
      });
      const dustA = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.07), dustMat);
      dustA.position.set(0.11, 0.06, -0.02);
      dustA.rotation.y = -0.3;
      g.add(dustA);
      const dustB = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.016, 0.06), dustMat);
      dustB.position.set(-0.13, 0.055, 0.07);
      dustB.rotation.y = 0.36;
      g.add(dustB);
    } else {
      // Generic placeholder
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x6a5040 }));
      box.position.y = 0.25;
      g.add(box);
    }

    if (rotation) g.rotation.y = -rotation * Math.PI / 2;
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
    // Blood moon visible only for 'blood_moon'
    if (bloodMoon) {
      bloodMoon.material.opacity = (key === 'blood_moon') ? 1.0 : 0.0;
      bloodMoon.userData.halo.material.opacity = (key === 'blood_moon') ? 0.45 : 0.0;
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
    setCameraMode,
    toggleTopdown,
    zoomInCamera,
    zoomOutCamera,
    rotateCamera,
    centerOnGrid,
    setRemoveModeEnabled,
    toggleRemoveMode,
    setDeveloperOverlayEnabled,
    toggleDeveloperOverlay,
    getCameraMode: () => cameraMode,
    getRemoveModeEnabled: () => removeMode,
    getDeveloperOverlayEnabled: () => developerOverlayEnabled,
    onCameraModeChange: (fn) => { cameraModeChangeHandler = fn; },
    onRemoveModeChange: (fn) => { removeModeChangeHandler = fn; },
    onDeveloperOverlayChange: (fn) => { developerOverlayChangeHandler = fn; },
    onPlacementChange: (fn) => { placementChangeHandler = fn; },
    getCharPos: () => ({ x: charPos.x, z: charPos.z }),
    setCharPos: (x, z) => { charPos.x = x; charPos.z = z; },
  };
})();
