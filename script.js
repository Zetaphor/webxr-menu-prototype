const debug = false;
let tempMatrix = new THREE.Matrix4();
let tempVector = new THREE.Vector3();
let camera, scene, renderer, container;
let conLeft, conRight, xrConLeft, xrConRight, controllerRay, overheadTarget
let light, debugDisplay;

let testCube;

let menuBase, menuOpenAnimation;
let menuVisible, menuDelayTimeout;
let menuCubeGroup = new THREE.Group();
const menuHand = 'left';
const menuOpenDelay = 2000;
const menuOpenEasing = 'easeOutElastic(1, 0.5)';
const menuCloseEasing = 'linear';
const menuCubeGroupShowEasing = 'spring(1, 80, 10, 0)';
const menuCubeGroupHideEasing = 'spring(1, 80, 10, 0)';

const menuMinScale = { x: 0.1, y: 0.1, z: 0.1 };
const menuMaxScale = { x: 1.0, y: 1.0, z: 1.0 };
let menuCurrentScale = { x: 0.1, y: 0.1, z: 0.1 };

let menuCubeGroupCurrentScale = { x: 0.1, y: 0.1, z: 0.1 };
const menuCubeGroupMinScale = { x: 0.1, y: 0.1, z: 0.1 };
const menuCubeGroupMaxScale = { x: 1.0, y: 1.0, z: 1.0 };


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

  controllerRay = new THREE.Raycaster();
  conLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  conRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x0000ff }));
  scene.add(conLeft, conRight);

  menuBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.02, 0.02, 32), new THREE.MeshLambertMaterial({ color: 0x326fa8, emissive: 0x000000 }));
  menuBase.visible = false;
  scene.add(menuBase);

  let marker = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.005, 0.05), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  marker.position.y = 0.01;
  marker.position.z = 0.17;
  menuBase.add(marker);

  menuBase.add(menuCubeGroup);

  // testCube = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  // testCube.position.z -= 1;
  // testCube.position.y += 0.5;
  // scene.add(testCube);

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

    tempVector.setFromMatrixPosition(camera.matrixWorld);
    tempVector.y = menuBase.position.y;
    menuBase.lookAt(tempVector);
  }



  checkMenuRay(menuHand);

  // if (debug) {
  //   let rotString = `
  //   <h3>Camera</h3>
  //   <p>Position: ${camera.position.x.toFixed(3)}, ${camera.position.y.toFixed(3)}, ${camera.position.z.toFixed(3)}</p>
  //   <h3>Overhead Target</h3>
  //   <p>Rotation: ${overheadTarget.rotation.x.toFixed(3)}, ${overheadTarget.rotation.y.toFixed(3)}, ${overheadTarget.rotation.z.toFixed(3)}</p>
  //   `;

  //   debugDisplay.innerHTML = rotString;
  // }

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
  menuVisible = true;
  animateMenuOpen();
  showMenuCubes();
  if (menuHand === 'left') conLeft.material.emissive.setHex(0x0000ff);
  if (menuHand === 'right') conRight.material.emissive.setHex(0xff0000);
}

function closeMenu() {
  menuVisible = false;
  hideMenuCubes();
  animateMenuClose();

  if (menuHand === 'left') conLeft.material.emissive.setHex(0x000000);
  if (menuHand === 'right') conRight.material.emissive.setHex(0x000000);
}

function showMenuCubes () {
  if (!menuCubeGroup.children.length) generateMenuCubes();
  animateShowMenuCubes();
}

function hideMenuCubes () {
  animateHideMenuCubes();
}

function generateMenuCubes () {
  menuCubeGroup.visible = false;
  const radius = 0.15;
  const totalBoxes = 10;
  for(let i = 0; i <= totalBoxes; i++) {
    let map = new THREE.TextureLoader().load('https://picsum.photos/100?' + Math.random(Date.now()));
    let box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshBasicMaterial({ map: map }));

    // let box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
    box.position.x = Math.sin(((360 / totalBoxes) * i) * (Math.PI/180)) * radius;
    box.position.z = Math.cos(((360 / totalBoxes) * i) * (Math.PI/180)) * radius;
    box.position.y = 0.05;
    menuCubeGroup.add(box);
  }

  let box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
  box.position.y = 0.05;
  menuCubeGroup.add(box);
}

function animateShowMenuCubes() {
  menuCubeGroupCurrentScale = { x: menuCubeGroupMinScale.x, y: menuCubeGroupMinScale.y, z: menuCubeGroupMinScale.z };
  menuCubeGroup.scale.set(menuCubeGroupMinScale.x, menuCubeGroupMinScale.y, menuCubeGroupMinScale.z);
  menuCubeGroup.visible = true;
  anime({
    targets: menuCubeGroupCurrentScale,
    x: menuCubeGroupMaxScale.x,
    y: menuCubeGroupMaxScale.y,
    z: menuCubeGroupMaxScale.z,
    easing: menuCubeGroupShowEasing,
    loop: false,
    delay: 100,
    update: function() {
      menuCubeGroup.scale.set(menuCubeGroupCurrentScale.x, menuCubeGroupCurrentScale.y, menuCubeGroupCurrentScale.z);
    }
  });
}

function animateHideMenuCubes() {
  anime({
    targets: menuCubeGroupCurrentScale,
    x: menuCubeGroupMinScale.x,
    y: menuCubeGroupMinScale.y,
    z: menuCubeGroupMinScale.z,
    easing: menuCubeGroupShowEasing,
    loop: false,
    update: function() {
      menuCubeGroup.scale.set(menuCubeGroupCurrentScale.x, menuCubeGroupCurrentScale.y, menuCubeGroupCurrentScale.z);
    },
    begin: function () {
      animateMenuClose();
    },
    complete: function () {
      // menuCubeGroup.visible = false;
    }
  });
}

function animateMenuOpen() {
  menuCurrentScale = { x: menuMinScale.x, y: menuMinScale.y, z: menuMinScale.z };
  menuBase.scale.set(menuMinScale.x, menuMinScale.y, menuMinScale.z);
  menuBase.visible = true;

  menuOpenAnimation = anime({
    targets: menuCurrentScale,
    x: menuMaxScale.x,
    y: menuMaxScale.y,
    z: menuMaxScale.z,
    easing: menuOpenEasing,
    loop: false,
    duration: 1000,
    begin: function () {
      showMenuCubes();
    },
    update: function() {
      menuBase.scale.set(menuCurrentScale.x, menuCurrentScale.y, menuCurrentScale.z);
    },
  });
}

function animateMenuClose() {
  anime({
    targets: menuCurrentScale,
    x: menuMinScale.x,
    y: menuMinScale.y,
    z: menuMinScale.z,
    easing: menuCloseEasing,
    loop: false,
    duration: 350,
    update: function() {
      menuBase.scale.set(menuCurrentScale.x, menuCurrentScale.y, menuCurrentScale.z);
    },
    complete: function () {
      menuBase.visible = false;
    }
  });
}