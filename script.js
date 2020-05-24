const debug = false;
let tempMatrix = new THREE.Matrix4();
let tempVector = new THREE.Vector3();
let camera, scene, renderer, container;
let conLeft, conRight, xrConLeft, xrConRight,
  controllerRay, overheadTarget;
let light, debugDisplay;

let shaderFrogRuntime;
let clock;

let testCube;

let navigating, navigationTargetGroup, navigationTargetLeft,
  navigationTargetRight, navigationTargetUp, navigationTargetDown;

let menuGroup;
let menuBase, menuVisible, menuDelayTimeout;
let menuCubeGroup;
let menuDisplayImage;
const menuHand = 'left';
let menuCubeGroupTotal = 10;
const menuCubeGroupRadius = 0.15;

let menuOpening, menuClosing;
let menuOpenTimeline, menuCloseTimeline;
let menuCubeGroupTimeline;

let menuAnimProperties = {
  scaleX: 0.1,
  scaleY: 0.1,
  scaleZ: 0.1,
  posX: 0,
  posY: 0,
  posZ: 0
};

let menuCubeGroupCurrentScale;
const menuCubeScrollDuration = 350;

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

  navigationTargetGroup = new THREE.Group();
  navigationTargetGroup.visible = false;
  navigationTargetLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
  navigationTargetRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
  navigationTargetUp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1), new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
  navigationTargetDown = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1), new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
  navigationTargetLeft.position.x = -0.08;
  navigationTargetRight.position.x = 0.08;
  navigationTargetUp.position.y = 0.08;
  navigationTargetDown.position.y = -0.08;
  navigationTargetLeft.z = 0.1;
  navigationTargetRight.z = 0.1;
  navigationTargetUp.z = 0.1;
  navigationTargetDown.z = 0.1;
  navigationTargetLeft.name = 'left';
  navigationTargetRight.name = 'right';
  navigationTargetUp.name = 'up';
  navigationTargetDown.name = 'down';
  navigationTargetGroup.add(navigationTargetLeft, navigationTargetRight, navigationTargetUp, navigationTargetDown);
  scene.add(navigationTargetGroup);


  shaderFrogRuntime = new ShaderRuntime();
  clock = new THREE.Clock();

  menuGroup = new THREE.Group();
  scene.add(menuGroup);

  menuBase = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 32), new THREE.MeshLambertMaterial({ color: 0x326fa8, emissive: 0x000000 }));
  menuBase.visible = false;
  shaderFrogRuntime.load('./Circuit_Grid.json', function( shaderData ) {
    let material = shaderFrogRuntime.get(shaderData.name);
    menuBase.material = material;
  });
  menuGroup.add(menuBase);

  let marker = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.005, 0.05), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  marker.position.y = 0.01;
  marker.position.z = 0.17;
  menuGroup.add(marker);

  menuCubeGroup = new THREE.Group();
  menuCubeGroup.visible = false;
  menuGroup.add(menuCubeGroup);

  menuDisplayImage = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.005, 0.18), new THREE.MeshBasicMaterial());
  menuDisplayImage.visible = false;
  menuDisplayImage.material.transparent = true;
  menuDisplayImage.material.opacity = 0.8;
  menuDisplayImage.position.y = 0.2;
  menuGroup.add(menuDisplayImage);

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
    let options = { optionalFeatures: ['local-floor', 'bounded-floor'] };
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

  if (menuVisible || menuOpening || menuClosing) {
    shaderFrogRuntime.updateShaders(clock.getElapsedTime());
    if (menuHand === 'left') {
      menuGroup.position.x = xrConLeft.position.x + 0.2;
      menuGroup.position.y = xrConLeft.position.y + 0.1;
      menuGroup.position.z = xrConLeft.position.z;
      // navigationTargetGroup.position.x = xrConRight.position.x;
      // navigationTargetGroup.position.y = xrConRight.position.y;
      // navigationTargetGroup.position.z = xrConRight.position.z - 0.1;
    } else {
      menuGroup.position.x = xrConRight.position.x - 0.2;
      menuGroup.position.y = xrConRight.position.y + 0.1;
      menuGroup.position.z = xrConRight.position.z;
      // navigationTargetGroup.position.x = xrConLeft.position.x;
      // navigationTargetGroup.position.y = xrConLeft.position.y;
      // navigationTargetGroup.position.z = xrConLeft.position.z - 0.1;
    }

    tempVector.setFromMatrixPosition(camera.matrixWorld);
    tempVector.y = menuGroup.position.y;

    if (menuVisible) {
      menuGroup.lookAt(tempVector);
      menuDisplayImage.lookAt(tempVector);
      // menuDisplayImage.rotation.x = 1;
      if (!navigating) checkNavigationRay();
      animateSpinningMenuCubes();
    }
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

function checkNavigationRay() {
  if (navigating) return;
  let controller = menuHand === 'left' ? conRight : conLeft;

  tempMatrix.identity().extractRotation(controller.matrixWorld);
  controllerRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  controllerRay.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  const intersections = controllerRay.intersectObjects([navigationTargetLeft, navigationTargetRight, navigationTargetUp, navigationTargetDown]);
  if (intersections.length) {
    navigating = true;
    if (intersections[0].object.name === 'left') navigationInputLeft();
    else if (intersections[0].object.name === 'right') navigationInputRight();
    else if (intersections[0].object.name === 'up') navigationInputUp();
    else if (intersections[0].object.name === 'down') navigationInputDown();
  }
}

function checkMenuRay() {
  let controller = menuHand === 'left' ? conLeft : conRight;

  tempMatrix.identity().extractRotation(controller.matrixWorld);
  controllerRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  controllerRay.ray.direction.set(1, 0, 0).applyMatrix4(tempMatrix);
  const side1Intersects = controllerRay.intersectObjects([overheadTarget]);
  controllerRay.ray.direction.set(-1, 0, 0).applyMatrix4(tempMatrix);
  const side2Intersects = controllerRay.intersectObjects([overheadTarget]);

  let openGesture, closeGesture = false;

  // Left hand: side1 = right, side2 = left
  // Right hand: side1 = left, side2 = right

  if (menuHand === 'left') {
    if (side1Intersects.length) openGesture = true;
    else if (side2Intersects.length) closeGesture = true;
  } else {
    if (side2Intersects.length) openGesture = true;
    else if (side1Intersects.length) closeGesture = true;
  }

  if (menuVisible && closeGesture) menuCloseGesture();
  else if (!menuVisible && openGesture) menuOpenGesture();
}

function menuOpenGesture() {
  if (menuVisible) return;
  if (!menuOpening) {
    console.log('Started');
    menuOpening = true;
    animateMenuOpen();
  }
}

function menuCloseGesture() {
  if (menuClosing) return;
  if (menuOpening) {
    menuOpenTimeline.pause();
    if (typeof menuCubeGroupTimeline['pause'] !== 'undefined') menuCubeGroupTimeline.pause();
    menuOpening = false;
  }
  animateMenuClose();
}

function openMenu() {
  menuVisible = true;
  if (!menuCubeGroup.children.length) generateMenuCubes();
  animateNavigationTargetOpen();
  animateMenuOpen();
  animateShowMenuCubes();
  if (menuHand === 'left') conLeft.material.emissive.setHex(0x0000ff);
  if (menuHand === 'right') conRight.material.emissive.setHex(0xff0000);
}

function closeMenu() {
  menuVisible = false;
  animateHideMenuCubes();
  animateMenuClose();
  animatNavigationTargetClose();

  if (menuHand === 'left') conLeft.material.emissive.setHex(0x000000);
  if (menuHand === 'right') conRight.material.emissive.setHex(0x000000);
}

function generateMenuCubes () {
  for (var i = menuCubeGroup.children.length - 1; i >= 0; i--) {
    menuCubeGroup.remove(menuCubeGroup.children[i]);
  }

  for(let i = 0; i < menuCubeGroupTotal; i++) {
    const map = new THREE.TextureLoader().load('https://picsum.photos/100?' + Math.random(Date.now()));
    let box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshBasicMaterial({ map: map }));
    box.position.x = Math.sin(((360 / menuCubeGroupTotal) * i) * (Math.PI/180)) * menuCubeGroupRadius;
    box.position.z = Math.cos(((360 / menuCubeGroupTotal) * i) * (Math.PI/180)) * menuCubeGroupRadius;
    box.scale.set(0.1, 0.1, 0.1);
    menuCubeGroup.add(box);
  }

  let box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
  box.scale.set(0.1, 0.1, 0.1);
  menuCubeGroup.add(box);
}

function animateMenuOpen() {
  menuGroup.visible = true;
  menuGroup.scale.set(1, 1, 1);
  menuAnimProperties.scaleX, menuAnimProperties.scaleY, menuAnimProperties.scaleZ  = 0.1;
  menuBase.scale.set(0.1, 0.1, 0.1);
  menuBase.visible = true;
  menuOpenTimeline = gsap.timeline();
  menuOpenTimeline.to(menuAnimProperties, {
    scaleX: 1, scaleY: 1, scaleZ: 1,
    duration: 1,
    ease: 'back',
    onUpdate: function () {
      menuBase.scale.set(menuAnimProperties.scaleX, menuAnimProperties.scaleY, menuAnimProperties.scaleZ);
    }
  }).to(menuAnimProperties, {
    scaleX: 8, scaleY: 0.5, scaleZ: 8,
    duration: 2,
    ease: 'back',
    onUpdate: function () {
      menuBase.scale.set(menuAnimProperties.scaleX, menuAnimProperties.scaleY, menuAnimProperties.scaleZ);
    }
  }).then(function () {
    animateShowMenuCubes();
  });
}

function animateMenuClose() {
  hideDisplay();
  menuAnimProperties.scaleX, menuAnimProperties.scaleY, menuAnimProperties.scaleZ = 1;
  menuCloseTimeline = gsap.to(menuAnimProperties, {
    scaleX: 0.1, scaleY: 0.1, scaleZ: 0.1,
      duration: 1,
      ease: 'back',
      onUpdate: function () {
        menuGroup.scale.set(menuAnimProperties.scaleX, menuAnimProperties.scaleY, menuAnimProperties.scaleZ);
      }
    }
  ).then(function() {
    menuBase.visible = false;
    menuGroup.visible = false;
    menuCubeGroup.visible = false;
    menuVisible = false;
    menuClosing = false;
  });
}

function animateShowMenuCubes() {
  generateMenuCubes();
  menuCubeGroup.visible = true;
  for (let i = 0; i < menuCubeGroup.children.length; i++) {
    let childAnimProperties = { scaleX: 0.1, scaleY: 0.1, scaleZ: 0.1, posY: 0 };
    menuCubeGroup.children[i].visible = true;
    gsap.to(childAnimProperties, {
      scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0,
      posY: 0.08,
      duration: 0.3,
      ease: 'back',
      delay: 0.2 * i,
      onStart: function () {
        menuCubeGroup.children[i].visible = true;
      },
      onUpdate: function () {
        menuCubeGroup.children[i].scale.set(childAnimProperties.scaleX, childAnimProperties.scaleY, childAnimProperties.scaleZ);
        menuCubeGroup.children[i].position.y = childAnimProperties.posY;
      }
    }).then(function() {
      menuVisible = true;
      menuOpening = false;
    });
  }
}

function animateHideMenuCubes() {
  anime({
    targets: menuCubeGroupCurrentScale,
    x: menuCubeGroupStartScale.x,
    y: menuCubeGroupStartScale.y,
    z: menuCubeGroupStartScale.z,
    easing: menuCubeGroupShowEasing,
    loop: false,
    update: function() {
      menuCubeGroup.scale.set(menuCubeGroupCurrentScale.x, menuCubeGroupCurrentScale.y, menuCubeGroupCurrentScale.z);
    },
    complete: function () {
      menuCubeGroup.visible = false;
    }
  });
}

function animateSpinningMenuCubes() {
  for (let i = 0; i < menuCubeGroup.children.length; i++) {
    menuCubeGroup.children[i].rotation.y -= 0.003;
  }
}

function  animateNavigationTargetOpen() {
  navigationTargetGroup.visible = true;
}

function  animatNavigationTargetClose() {
  navigationTargetGroup.visible = false;
}

function navigationInputLeft() {
  animateMenuCubesScroll('left');
}

function navigationInputRight() {
  animateMenuCubesScroll('right');
}

function animateMenuCubesScroll(direction) {
  for (let i = 0; i < menuCubeGroup.children.length; i++) {
    let groupIndex;
    if (direction === 'right') groupIndex = i === 0 ? menuCubeGroup.children.length - 1 : i - 1;
    else groupIndex = i == menuCubeGroup.children.length - 1 ? 0 : i + 1;

    hideDisplay();
    anime({
      targets: menuCubeGroup.children[i].position,
      x: menuCubeGroup.children[groupIndex].position.x,
      y: menuCubeGroup.children[groupIndex].position.y,
      z: menuCubeGroup.children[groupIndex].position.z,
      duration: menuCubeScrollDuration,
      easing: 'linear',
      loop: false
    });
  }
  let timeout = setTimeout(function () {
    navigating = false;
    clearTimeout(timeout);
    showDisplay();
  }, menuCubeScrollDuration + 50);
}

function showDisplay() {
  menuDisplayImage.visible = true;
  menuDisplayImage.material.map = new THREE.TextureLoader().load('https://picsum.photos/100?' + Math.random(Date.now()));
}

function hideDisplay() {
  menuDisplayImage.visible = false;
}

function navigationInputUp() {
  let timeout = setTimeout(function () {
    menuCubeGroupTotal++;
    if (menuCubeGroupTotal > 20) menuCubeGroupTotal = 20;
    generateMenuCubes();
    navigating = false;
  }, 300);
}

function navigationInputDown() {
  let timeout = setTimeout(function () {
    menuCubeGroupTotal--;
    if (!menuCubeGroupTotal) menuCubeGroupTotal = 1;
    generateMenuCubes();
    navigating = false;
  }, 300);
}