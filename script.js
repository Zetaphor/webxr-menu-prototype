let camera, scene, renderer, container;
let conLeft, conRight, xrConLeft, xrConRight, rayLeft, rayRight, overheadTarget
let light, debugDisplay, INTERSECTED;
let tempMatrix = new THREE.Matrix4();
const menuHand = 'left';
let menuBase, menuGroup;
let menuRayActive
const debug = true;
let entranceStarted = false;
const entranceDuration = 500;
let entranceTween;
const startScale = { x: 0.1, y: 0.1, z: 0.1 };
const finalScale = { x: 1, y: 1, z: 1 };
let currentScale = { x: 0.1, y: 0.1, z: 0.1 };

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

  overheadTarget = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01), new THREE.MeshLambertMaterial({
      color: 0xffffff, transparent: true, opacity: 0.4 }));
  overheadTarget.name = 'overheadTarget';
  scene.add(overheadTarget);

  conLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  conRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x0000ff }));
  scene.add(conLeft, conRight);

  menuGroup = new THREE.Group()
  menuBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.02, 0.02), new THREE.MeshLambertMaterial({ color: 0x32cd32 }));
  menuBase.visible = false;
  // menuGroup.add(menuBase);
  scene.add(menuBase);

  if (!debug) {
    overheadTarget.visible = false;
    conLeft.visible = false;
    conRight.visible = false;
  }

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.xr.enabled = true;

  rayLeft = new THREE.Raycaster();
  rayRight = new THREE.Raycaster();

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
    overheadTarget.position.y = xrConLeft.position.y + 0.3;
    overheadTarget.position.z = xrConLeft.position.z;
  } else {
    overheadTarget.position.x = xrConRight.position.x;
    overheadTarget.position.y = xrConRight.position.y + 0.3;
    overheadTarget.position.z = xrConRight.position.z;
  }

  if (menuRayActive) {
    if (menuHand === 'left') {
      menuBase.position.x = xrConLeft.position.x;
      menuBase.position.y = xrConLeft.position.y + 0.07;
      menuBase.position.z = xrConLeft.position.z;

    } else {
      menuBase.position.x = xrConRight.position.x;
      menuBase.position.y = xrConRight.position.y + 0.07;
      menuBase.position.z = xrConRight.position.z;
    }
  }

  checkMenuRay(menuHand);

  if (debug) {
    let rotString = `
    <h3>Overhead Target</h3>
    <p>Position: ${overheadTarget.position.x.toFixed(3)}, ${overheadTarget.position.y.toFixed(3)}, ${overheadTarget.position.z.toFixed(3)}</p>
    <p>Rotation: ${overheadTarget.rotation.x.toFixed(3)}, ${overheadTarget.rotation.y.toFixed(3)}, ${overheadTarget.rotation.z.toFixed(3)}</p>
    `;

    debugDisplay.innerHTML = rotString;
  }

  renderer.render(scene, camera);
}

function checkMenuRay() {
  let controller = menuHand === 'left' ? conLeft : conRight
  let controllerRay = menuHand === 'left' ? rayLeft : rayRight

  tempMatrix.identity().extractRotation(controller.matrixWorld);

  controllerRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  if (menuHand === 'left') controllerRay.ray.direction.set(1, 0, 0).applyMatrix4(tempMatrix);
  else controllerRay.ray.direction.set(-1, 0, 0).applyMatrix4(tempMatrix);

  let intersects = controllerRay.intersectObjects([overheadTarget]);
  if (intersects.length > 0) {
    if (menuHand === 'left') conLeft.material.emissive.setHex(0x0000ff);
    if (menuHand === 'right') conRight.material.emissive.setHex(0xff0000);

    if (!menuRayActive) {
      menuBase.visible = true;
      menuBase.scale.set(startScale.x, startScale.y, startScale.z);
      currentScale = startScale
      menuRayActive = true;
    }

    TWEEN.update();

    if (!entranceStarted) {
      // menuGroup.scale.set(0.1, 0.1, 0.1);
      console.log('Entrance Started')
      entranceStarted = true;
      currentScale = {x: 0.1, y: 0.1, z: 0.1};
      menuBase.scale.set(0.1, 0.1, 0.1);
      TWEEN.removeAll();

      new TWEEN.Tween(currentScale)
        .to(finalScale, entranceDuration)
        .easing(TWEEN.Easing.Sinusoidal.In)
        .onUpdate(() => {
          menuBase.scale.set(currentScale.x, currentScale.y, currentScale.z);
        }).start();
    }
  } else {
    if (menuRayActive) {
      menuBase.visible = false;
      menuRayActive = false;
      entranceStarted = false;
      // entranceTween.stop();
    }
    if (menuHand === 'left') conLeft.material.emissive.setHex(0x000000);
    if (menuHand === 'right') conRight.material.emissive.setHex(0x000000);
  }
}