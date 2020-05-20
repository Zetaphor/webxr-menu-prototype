let camera, scene, renderer, container;
let conLeft, conRight, xrConLeft, xrConRight, controllerRay, overheadTarget
let light, debugDisplay, INTERSECTED;
let tempMatrix = new THREE.Matrix4();
const menuHand = 'left';
let menuBase, menuGroup;
let menuVisible;
const debug = false;
let entranceStarted = false;
const entranceDuration = 500;
const startScale = { x: 0.1, y: 0.1, z: 0.1 };
const finalScale = { x: 1, y: 1, z: 1 };
let currentScale = { x: 0.1, y: 0.1, z: 0.1 };
let menuButtons = new THREE.Group();

let cubeGroup = new THREE.Group();

// Use right hand to control input
// Map actions to directions (Select, back, etc)
// Boop boxes or point

init();
requestSession();

window.addEventListener("unload", closeSession);

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
  scene.add(light);

  overheadTarget = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 10), new THREE.MeshLambertMaterial({
      color: 0xffffff, transparent: true, opacity: 0.4 }));
  overheadTarget.name = 'overheadTarget';
  scene.add(overheadTarget);

  conLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  conRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x0000ff }));
  scene.add(conLeft, conRight);

  controllerRay = new THREE.Raycaster();

  // menuGroup = new THREE.Group()
  menuBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.02, 0.02, 32), new THREE.MeshLambertMaterial({ color: 0x333333 }));
  menuBase.visible = false;
  // menuGroup.add(menuBase);
  scene.add(menuBase);

  menuBase.add(cubeGroup);

  // let buttonL  = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03), new THREE.MeshLambertMaterial({ color: 0x32cd32 }));
  // buttonL.position.x += 0.1;
  // buttonL.position.y += 0.1;
  // buttonL.rotateX(1);
  // menuButtons.add(buttonL);

  // let buttonR  = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03), new THREE.MeshLambertMaterial({ color: 0x32cd32 }));
  // buttonR.position.x -= 0.1;
  // buttonR.position.y += 0.1;
  // buttonR.rotateX(1);
  // menuButtons.add(buttonR);

  // menuBase.add(menuButtons);

  if (!debug) {
    overheadTarget.visible = false;
    conLeft.visible = false;
    conRight.visible = false;
  }

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.xr.enabled = true;

  debugDisplay = document.getElementById('debug');
}

function requestSession() {
  navigator.xr.isSessionSupported('immersive-vr').then(function (supported) {
    let options = {
      optionalFeatures: ['local-floor', 'bounded-floor']
    };
    navigator.xr.requestSession('immersive-vr', options).then(onSessionStarted);
  });
}

function onSessionStarted(session) {
  renderer.xr.setSession(session);
  xrConLeft = renderer.xr.getController(0);
  xrConRight = renderer.xr.getController(1);
  animate();
}

async function closeSession(session) {
  await renderer.xr.getSession().end();
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  conLeft.position.x = xrConLeft.position.x;
  conLeft.position.y = xrConLeft.position.y;
  conLeft.position.z = xrConLeft.position.z;
  conLeft.rotation.x = xrConLeft.rotation.x;
  conLeft.rotation.y = xrConLeft.rotation.y;
  conLeft.rotation.z = xrConLeft.rotation.z;

  conRight.position.x = xrConRight.position.x;
  conRight.position.y = xrConRight.position.y;
  conRight.position.z = xrConRight.position.z;
  conRight.rotation.x = xrConRight.rotation.x;
  conRight.rotation.y = xrConRight.rotation.y;
  conRight.rotation.z = xrConRight.rotation.z;

  if (menuHand === 'left') {
    overheadTarget.position.x = xrConLeft.position.x;
    overheadTarget.position.y = xrConLeft.position.y + 0.2;
    overheadTarget.position.z = xrConLeft.position.z;
  } else {
    overheadTarget.position.x = xrConRight.position.x;
    overheadTarget.position.y = xrConRight.position.y + 0.2;
    overheadTarget.position.z = xrConRight.position.z;
  }

  if (menuVisible) {
    if (menuHand === 'left') {
      menuBase.position.x = xrConLeft.position.x;
      menuBase.position.y = xrConLeft.position.y + 0.1;
      menuBase.position.z = xrConLeft.position.z;
    } else {
      menuBase.position.x = xrConRight.position.x;
      menuBase.position.y = xrConRight.position.y + 0.1;
      menuBase.position.z = xrConRight.position.z;
    }

    // menuBase.lookAt(camera.position);
    // menuBase.rotation.z = Math.atan2( ( camera.position.x - menuBase.position.x ), ( camera.position.z - menuBase.position.z ) );
  }

  checkMenuRay(menuHand);

  if (debug) {
    let rotString = `
    <h3>Camera</h3>
    <p>Position: ${camera.position.x.toFixed(3)}, ${camera.position.y.toFixed(3)}, ${camera.position.z.toFixed(3)}</p>
    <h3>Overhead Target</h3>
    <p>Rotation: ${overheadTarget.rotation.x.toFixed(3)}, ${overheadTarget.rotation.y.toFixed(3)}, ${overheadTarget.rotation.z.toFixed(3)}</p>
    `;

    debugDisplay.innerHTML = rotString;
  }

  renderer.render(scene, camera);
}

function checkMenuRay() {
  let controller = menuHand === 'left' ? conLeft : conRight

  tempMatrix.identity().extractRotation(controller.matrixWorld);
  controllerRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  controllerRay.ray.direction.set(1, 0, 0).applyMatrix4(tempMatrix);
  const side1Intersects = controllerRay.intersectObjects([overheadTarget]);
  controllerRay.ray.direction.set(-1, 0, 0).applyMatrix4(tempMatrix);
  const side2Intersects = controllerRay.intersectObjects([overheadTarget]);

  let openGesture, closeGesture = false;

  if (menuHand == 'left') {
    if (side1Intersects.length) openGesture = true;
    else if (side2Intersects.length) closeGesture = true;
  } else {
    if (side2Intersects.length) openGesture = true;
    else if (side1Intersects.length) closeGesture = true;
  }

  if (menuVisible && closeGesture) closeMenu();
  else if (!menuVisible && openGesture) openMenu();
}

function openMenu() {
  currentScale = {x: 0.1, y: 0.1, z: 0.1};
  menuBase.scale.set(0.1, 0.1, 0.1);
  menuBase.visible = true;
  menuVisible = true;
  drawCubes();

  anime({
    targets: currentScale,
    x: 1.0,
    y: 1.0,
    z: 1.0,
    easing: 'spring(1, 80, 10, 0)',
    loop: false,
    update: function() {
      menuBase.scale.set(currentScale.x, currentScale.y, currentScale.z);
    }
  });

  if (menuHand === 'left') conLeft.material.emissive.setHex(0x0000ff);
  if (menuHand === 'right') conRight.material.emissive.setHex(0xff0000);
}

function closeMenu() {
  menuVisible = false;
  anime({
    targets: currentScale,
    x: 0.1,
    y: 0.1,
    z: 0.1,
    easing: 'easeInElastic(1, 0.5)',
    loop: false,
    update: function() {
      menuBase.scale.set(currentScale.x, currentScale.y, currentScale.z);
    },
    complete: function () {
      menuBase.visible = false;
    }
  });

  if (menuHand === 'left') conLeft.material.emissive.setHex(0x000000);
  if (menuHand === 'right') conRight.material.emissive.setHex(0x000000);
}

function drawCubes() {
  let points = [];
  let radius = 0.15;

  // 360 full circle will be drawn clockwise
  let totalBoxes = 10;
  for(let i = 0; i <= totalBoxes; i++) {
    let box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    box.position.x = Math.sin(((360 / totalBoxes) * i) * (Math.PI/180)) * radius;
    box.position.z = Math.cos(((360 / totalBoxes) * i) * (Math.PI/180)) * radius;
    box.position.y = 0.05;
    cubeGroup.add(box);
  }
}