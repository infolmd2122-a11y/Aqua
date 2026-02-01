import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import { fishDatabase } from "./fishData.js";

console.log("Fish DB loaded:", fishDatabase);

let scene, camera, renderer, controls;
let raycaster, mouse;
let fishes = [];
let mixers = [];
const clock = new THREE.Clock();

init();
animate();

// ================= INIT =================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x001f3f);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // ✅ REQUIRED FOR GLB MATERIALS
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.75;

  document.body.appendChild(renderer.domElement);

  // ================= LIGHTING =================
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // ================= CONTROLS =================
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // ================= INTERACTION =================
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // ================= LOAD MODELS =================
  loadAquarium();
  loadFish("models/turtle.glb", "Turtule", new THREE.Vector3(19, -10, 6), 3);
  loadFish("models/emperor_angelfish.glb", "Emperor_angelfish", new THREE.Vector3(6, -5, -10), 3);
  loadFish("models/sharkbite.glb", "Shark", new THREE.Vector3(-129, -130, 198), 0.5);
  loadFish("models/pavona_coral.glb", "Pavona coral", new THREE.Vector3(-32, -19, -8), 2.8);
  loadFish("models/pavona_coral.glb", "Pavona coral", new THREE.Vector3(-25, -19, -4), 2.8);
  loadFish("models/coral_piece.glb", "Coral piece", new THREE.Vector3(-17, -19, -6), 1);
  loadFish("models/coral_piece.glb", "Coral piece", new THREE.Vector3(-17, -19, -4), 1);
  loadFish("models/coral.glb", "Coral", new THREE.Vector3(-30, -16, -7), 6.6);
  loadFish("models/emperor_angelfish.glb", "Emperor_angelfish", new THREE.Vector3(8, -6, -12), 3);
  loadFish("models/jelly_fish.glb", "Jelly fish", new THREE.Vector3(-2, -2, -21), 3);
  loadFish("models/great_hammerhead.glb", "Hammer Head", new THREE.Vector3(-2, 2, 15), 2.5);
  loadFish("models/parrotfish.glb", "Parrot fish", new THREE.Vector3(3, -3, 13), 0.3);
  loadFish("models/clownfish.glb", "Clown fish", new THREE.Vector3(-5, -3, 15), 3);
  loadFish("models/red_betta_fish.glb", "Red betta fish", new THREE.Vector3(-12, -3, -10), 0.01);
  loadFish("models/neon_tetra_aquarium_fish.glb", "Tetra fish", new THREE.Vector3(-2, 3, 10), 60);
  loadFish("models/sword_fish.glb", "Sword fish", new THREE.Vector3(-2, -2, -15), 3);
  window.addEventListener("resize", onResize);
  window.addEventListener("click", onClick);

  console.log("✅ Scene initialized");
}

// ================= LOAD AQUARIUM =================
function loadAquarium() {
  const loader = new GLTFLoader();

  loader.load("models/cave.glb", (gltf) => {
    const aquarium = gltf.scene;

    const box = new THREE.Box3().setFromObject(aquarium);
    const center = box.getCenter(new THREE.Vector3());
    aquarium.position.sub(center);

    aquarium.traverse((child) => {
      if (child.isMesh && child.material.map) {
        child.material.map.colorSpace = THREE.SRGBColorSpace;
        child.material.needsUpdate = true;
      }
    });

    scene.add(aquarium);
    console.log("🐠 Aquarium loaded");
  });
}

// ================= LOAD FISH =================
function loadFish(path, name, position, scale) {
  const loader = new GLTFLoader();

  loader.load(path, (gltf) => {
    console.log("🔍", name, "animations:", gltf.animations.length);

    const fish = gltf.scene;
    fish.name = name;
    fish.position.copy(position);
    fish.scale.setScalar(scale);

    fish.traverse((child) => {
      if (child.isMesh) {
        child.userData.fishName = name;
        fishes.push(child);

        if (child.material.map) {
          child.material.map.colorSpace = THREE.SRGBColorSpace;
        }
        child.material.needsUpdate = true;
      }
    });

    scene.add(fish);

    // ================= ANIMATION =================
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(fish);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
      mixers.push(mixer);
      console.log("🎬 Animation playing:", name);
    }
  },
  undefined,
  (err) => console.error("❌ Load error:", path, err));
}

// ================= CLICK =================
function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(fishes, true);

  if (intersects.length > 0) {
    const fishName = intersects[0].object.userData.fishName;
    const data = fishDatabase[fishName];

    if (data) {
      document.getElementById("fishName").innerHTML = `
        <b>${fishName}</b><br><br>
        🌍 <b>Habitat:</b> ${data.habitat}<br>
        ⏳ <b>Lifespan:</b> ${data.lifespan}<br>
        🍤 <b>Food:</b> ${data.food}<br><br>
        📝 ${data.description}
      `;
    } else {
      document.getElementById("fishName").textContent =
        "No data available for this species.";
    }
  }
}




// ================= ANIMATE =================
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  mixers.forEach((mixer) => mixer.update(delta));

  controls.update();
  renderer.render(scene, camera);
}

// ================= RESIZE =================
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
