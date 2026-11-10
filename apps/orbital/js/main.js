// ORBITAL Mouse 3D Scene Script with Smooth ScrollTrigger Flow, Draco Decoding & OLED Texture
gsap.registerPlugin(ScrollTrigger);

let scene, camera, renderer, mouseGroup, floatGroup, oledCanvas, oledContext, oledTexture;
let clock = new THREE.Clock();
let isModelReady = false;

const MODEL_PATHS = [
  'static/models/mouse_model/mouse.glb',
  'static/models/mouse_model/mouse.gltf'
];

function getResponsiveX(x) {
  if (typeof window === 'undefined') return x;
  if (window.innerWidth < 640) return x * 0.15;
  if (window.innerWidth < 1024) return x * 0.55;
  return x;
}

function initOLEDTexture() {
  if (oledTexture) return oledTexture;

  oledCanvas = document.createElement('canvas');
  oledCanvas.width = 256;
  oledCanvas.height = 256;
  oledContext = oledCanvas.getContext('2d');

  oledTexture = new THREE.CanvasTexture(oledCanvas);
  oledTexture.needsUpdate = true;
  return oledTexture;
}

let frameCount = 0;
function updateOLED() {
  if (!oledContext || !oledTexture) return;
  frameCount++;

  // Warm dark brown screen background
  oledContext.fillStyle = '#1c1815';
  oledContext.fillRect(0, 0, 256, 256);

  // Outer bezel ring
  oledContext.strokeStyle = '#d4a373';
  oledContext.lineWidth = 6;
  oledContext.beginPath();
  oledContext.arc(128, 128, 115, 0, Math.PI * 2);
  oledContext.stroke();

  // Dynamic Animated OLED Modes: Telemetry vs Mini Game
  const mode = Math.floor(frameCount / 180) % 2;

  if (mode === 0) {
    // TELEMETRY DISPLAY (Productivity Mode)
    oledContext.fillStyle = '#faedcd';
    oledContext.font = 'bold 22px sans-serif';
    oledContext.textAlign = 'center';
    oledContext.fillText('ORBITAL OS', 128, 65);

    oledContext.fillStyle = '#bc8a5f';
    oledContext.font = '16px sans-serif';
    oledContext.fillText('1200 DPI', 128, 105);

    // Battery Bar
    oledContext.strokeStyle = '#d4a373';
    oledContext.lineWidth = 3;
    oledContext.strokeRect(78, 130, 100, 16);
    oledContext.fillStyle = '#d4a373';
    oledContext.fillRect(82, 134, 70, 8); // 80% charge

    oledContext.fillStyle = '#a8a29e';
    oledContext.font = '12px sans-serif';
    oledContext.fillText('50H BATT | BLE 5.2', 128, 180);
  } else {
    // MINI GAME DEMO (Casual Rest Mode - Pong Animation)
    oledContext.fillStyle = '#faedcd';
    oledContext.font = '14px sans-serif';
    oledContext.textAlign = 'center';
    oledContext.fillText('GAME: PONG 2.0', 128, 55);

    // Ball movement
    const bx = 128 + Math.sin(frameCount * 0.08) * 60;
    const by = 128 + Math.cos(frameCount * 0.1) * 30;

    oledContext.fillStyle = '#faedcd';
    oledContext.beginPath();
    oledContext.arc(bx, by, 8, 0, Math.PI * 2);
    oledContext.fill();

    // Paddles
    oledContext.fillStyle = '#d4a373';
    oledContext.fillRect(50, 110 + Math.sin(frameCount * 0.08) * 20, 8, 36);
    oledContext.fillRect(198, 110 - Math.sin(frameCount * 0.08) * 20, 8, 36);
  }

  oledTexture.needsUpdate = true;
}

function createProceduralFallbackMouse() {
  const group = new THREE.Group();

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x2e2a25,
    roughness: 0.4,
    metalness: 0.1
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xbc8a5f,
    roughness: 0.2,
    metalness: 0.6
  });

  const bodyGeo = new THREE.BoxGeometry(2.2, 1.2, 3.8, 16, 16, 16);
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    if (x < 0) x *= 1.35; 
    if (z > 0) y *= 0.7;  
    if (y > 0) x += (z * 0.15); 

    pos.setXYZ(i, x, y, z);
  }
  bodyGeo.computeVertexNormals();

  const bodyMesh = new THREE.Mesh(bodyGeo, shellMat);
  group.add(bodyMesh);

  const screenRingGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 32);
  const ringMesh = new THREE.Mesh(screenRingGeo, accentMat);
  ringMesh.position.set(0.1, 0.62, -0.4);
  ringMesh.rotation.x = 0.2;
  group.add(ringMesh);

  const screenGeo = new THREE.CircleGeometry(0.5, 32);
  const screenMat = new THREE.MeshBasicMaterial({
    map: initOLEDTexture(),
    side: THREE.DoubleSide
  });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0.1, 0.67, -0.4);
  screenMesh.rotation.x = -Math.PI / 2 + 0.2;
  group.add(screenMesh);

  const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24);
  const wheelMesh = new THREE.Mesh(wheelGeo, accentMat);
  wheelMesh.rotation.z = Math.PI / 2;
  wheelMesh.position.set(0.1, 0.6, -1.2);
  group.add(wheelMesh);

  return group;
}

function initScene() {
  const container = document.getElementById('canvas-container');
  if (!container) return;
  
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.5, 7);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  if ('outputEncoding' in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  container.appendChild(renderer.domElement);

  // Balanced Studio Lighting for PBR materials
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xfff8ee, 1.4);
  dirLight1.position.set(5, 10, 7);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xd4a373, 0.85);
  dirLight2.position.set(-5, -2, -5);
  scene.add(dirLight2);

  const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x332b24, 0.6);
  scene.add(hemiLight);

  // Group Hierarchy: mouseGroup (driven by scroll) -> floatGroup (gentle idle float) -> model
  mouseGroup = new THREE.Group();
  floatGroup = new THREE.Group();
  mouseGroup.add(floatGroup);
  scene.add(mouseGroup);

  // Initial Hero Pose
  mouseGroup.position.set(getResponsiveX(1.3), 0.1, 0.2);
  mouseGroup.rotation.set(0.25, -0.55, 0.08);

  loadExternalModel();

  window.addEventListener('resize', onWindowResize);
  animate();
}

function loadExternalModel() {
  if (typeof THREE.GLTFLoader === 'undefined') {
    useFallback();
    return;
  }

  const loader = new THREE.GLTFLoader();

  if (typeof THREE.DRACOLoader !== 'undefined') {
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.preload();
    loader.setDRACOLoader(dracoLoader);
  }

  let attemptIndex = 0;

  function tryNextPath() {
    if (attemptIndex >= MODEL_PATHS.length) {
      console.warn('Fallback triggered: No custom .glb or .gltf file detected in static/models/mouse_model/. Using procedural fallback.');
      useFallback();
      return;
    }

    const currentPath = MODEL_PATHS[attemptIndex];
    attemptIndex++;

    console.log('Attempting to load model from:', currentPath);

    loader.load(
      currentPath,
      function (gltf) {
        console.log('Successfully loaded custom model from:', currentPath);
        const model = gltf.scene;

        initOLEDTexture();

        // Preserve authentic materials and apply OLED dynamic texture to display mesh
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const name = (child.name || '').toLowerCase();
            const matName = (child.material && child.material.name ? child.material.name : '').toLowerCase();

            // Detect if this mesh is the circular OLED display screen
            const isScreen = name.includes('plane.037') ||
                             name.includes('screen') ||
                             name.includes('oled') ||
                             name.includes('display') ||
                             matName.includes('material.001') ||
                             matName.includes('screen') ||
                             matName.includes('oled');

            if (isScreen) {
              child.material = new THREE.MeshBasicMaterial({
                map: oledTexture,
                side: THREE.DoubleSide
              });
            } else if (child.material) {
              child.material.side = THREE.DoubleSide;
              if (child.material.map) {
                child.material.map.encoding = THREE.sRGBEncoding;
              }
              child.material.needsUpdate = true;
            }
          }
        });

        // 1. Calculate unscaled bounding box to find the model size
        const initialBox = new THREE.Box3().setFromObject(model);
        const size = initialBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // 2. Scale the model so its maximum dimension is ~3.5 units
        if (maxDim > 0) {
          const targetScale = 3.5 / maxDim;
          model.scale.set(targetScale, targetScale, targetScale);
        }

        // 3. Update world matrix to calculate the scaled model's center accurately
        model.updateMatrixWorld(true);

        // 4. Center the scaled model at (0, 0, 0)
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        model.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);

        // 5. Add to floatGroup and initialize continuous scroll animations
        floatGroup.add(model);
        isModelReady = true;
        setupScrollAnimations();
      },
      undefined,
      function (error) {
        console.warn('Failed loading path:', currentPath, error);
        tryNextPath();
      }
    );
  }

  tryNextPath();
}

function useFallback() {
  const fallback = createProceduralFallbackMouse();
  floatGroup.add(fallback);
  isModelReady = true;
  setupScrollAnimations();
}

function setupScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Kill existing scroll triggers if re-initializing on resize
  if (window._orbitalTimeline) {
    window._orbitalTimeline.kill();
  }

  // Set initial starting pose matching hero section
  const startX = getResponsiveX(1.3);
  mouseGroup.position.set(startX, 0.1, 0.2);
  mouseGroup.rotation.set(0.25, -0.55, 0.08);

  // Master continuous timeline tied across entire page scroll flow
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "main",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      invalidateOnRefresh: true
    }
  });

  window._orbitalTimeline = tl;

  // Keyframe Sequence: smooth, continuous transitions without dead zones
  tl
    // 1. Progress from Hero -> Validation Roadmap (gentle shift to give space for 4-step roadmap)
    .to(mouseGroup.position, {
      x: getResponsiveX(1.4),
      y: -0.05,
      z: 0.35,
      duration: 1.0,
      ease: "power1.inOut"
    }, "step1")
    .to(mouseGroup.rotation, {
      x: 0.15,
      y: -0.25,
      z: 0.02,
      duration: 1.0,
      ease: "power1.inOut"
    }, "step1")

    // 2. Progress into Ergonomics Section (glides to LEFT, tilts to display 57° vertical contour & thumb saddle)
    .to(mouseGroup.position, {
      x: getResponsiveX(-1.75),
      y: 0.15,
      z: 1.15,
      duration: 1.4,
      ease: "power1.inOut"
    }, "step2")
    .to(mouseGroup.rotation, {
      x: 0.18,
      y: 1.18,
      z: -0.16,
      duration: 1.4,
      ease: "power1.inOut"
    }, "step2")

    // 3. Progress into Connectivity Section (glides to RIGHT, reveals base charging interface & front cable zone)
    .to(mouseGroup.position, {
      x: getResponsiveX(1.65),
      y: -0.1,
      z: 0.75,
      duration: 1.4,
      ease: "power1.inOut"
    }, "step3")
    .to(mouseGroup.rotation, {
      x: -0.32,
      y: -1.42,
      z: 0.22,
      duration: 1.4,
      ease: "power1.inOut"
    }, "step3")

    // 4. Progress into Display & Interaction Section (tilts forward & zooms close to prominently showcase the circular OLED)
    .to(mouseGroup.position, {
      x: getResponsiveX(-1.45),
      y: -0.32,
      z: 2.3,
      duration: 1.5,
      ease: "power1.inOut"
    }, "step4")
    .to(mouseGroup.rotation, {
      x: 1.14,
      y: 0.04,
      z: -0.03,
      duration: 1.5,
      ease: "power1.inOut"
    }, "step4")

    // 5. Progress into Technical Architecture & Survey Callout (centers hovering above candidate components)
    .to(mouseGroup.position, {
      x: 0,
      y: 0.65,
      z: 0.35,
      duration: 1.4,
      ease: "power1.inOut"
    }, "step5")
    .to(mouseGroup.rotation, {
      x: 0.35,
      y: 0.45,
      z: 0.05,
      duration: 1.4,
      ease: "power1.inOut"
    }, "step5")

    // 6. Progress into Quick Share Section (gentle receding rest pose)
    .to(mouseGroup.position, {
      x: 0,
      y: 0.4,
      z: -0.1,
      duration: 1.0,
      ease: "power1.inOut"
    }, "step6")
    .to(mouseGroup.rotation, {
      x: 0.2,
      y: 0.1,
      z: 0.0,
      duration: 1.0,
      ease: "power1.inOut"
    }, "step6");

  ScrollTrigger.refresh();
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  setupScrollAnimations();
}

function animate() {
  requestAnimationFrame(animate);
  updateOLED();

  // Gentle subtle breathing float on floatGroup (does not conflict with GSAP on mouseGroup)
  if (isModelReady && floatGroup) {
    const elapsed = clock.getElapsedTime();
    floatGroup.position.y = Math.sin(elapsed * 1.5) * 0.04;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

window.addEventListener('DOMContentLoaded', initScene);
