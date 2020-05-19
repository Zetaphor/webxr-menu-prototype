let camera, scene, renderer, container;
let conLeft, conRight, xrConLeft, xrConRight, rayLeft, rayRight, headCube
let light, debugDisplay, INTERSECTED;
let tempMatrix = new THREE.Matrix4();
const menuHand = 'left';
let menuBase, menuGroup;
let menuRayActive
const debug = true;
let entranceStarted = false;
const entranceDuration = 500;
let entranceTween;
let startScale = { x: 0.1, y: 0.1, z: 0.1 };
let finalScale = { x: 1, y: 1, z: 1 };
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

  headCube = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 1), new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
  headCube.name = 'headCube'
  scene.add(headCube);

  conLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  conRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x0000ff }));
  scene.add(conLeft, conRight);

  menuGroup = new THREE.Group()
  menuBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.02, 0.02), new THREE.MeshLambertMaterial({ color: 0x32cd32 }));
  menuBase.visible = false;
  // menuGroup.add(menuBase);
  scene.add(menuBase);

  if (!debug) {
    headCube.visible = false;
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

  let cameraRot = new THREE.Quaternion().setFromRotationMatrix(camera.matrixWorld);
  let cameraPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  camera.updateMatrixWorld(true);

  headCube.position.x = cameraPos.x;
  headCube.position.y = cameraPos.y + 0.5;
  headCube.position.z = cameraPos.z;
  headCube.position.z = cameraPos.z - 0.5;

  if (debug) {
    let rotString = `
    <h3>Camera</h3>
    <p>Camera Position: ${cameraPos.x.toFixed(3)}, ${cameraPos.y.toFixed(3)}, ${cameraPos.z.toFixed(3)}</p>
    <p>Camera Rotation: ${cameraRot._x.toFixed(3)}, ${cameraRot._y.toFixed(3)}, ${cameraRot._z.toFixed(3)}</p>
    <h3>Cube</h3>
    <p>Cube Position: ${headCube.position.x.toFixed(3)}, ${headCube.position.y.toFixed(3)}, ${headCube.position.z.toFixed(3)}</p>
    <p>Cube Rotation: ${headCube.rotation.x.toFixed(3)}, ${headCube.rotation.y.toFixed(3)}, ${headCube.rotation.z.toFixed(3)}</p>
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

  let intersects = controllerRay.intersectObjects([headCube]);
  if (intersects.length > 0) {
    if (menuHand === 'left') conLeft.material.emissive.setHex(0x0000ff);
    if (menuHand === 'right') conRight.material.emissive.setHex(0xff0000);

    if (!menuRayActive) {
      menuBase.visible = true;
      menuRayActive = true;
    }

    TWEEN.update();

    if (!entranceStarted) {
      // menuGroup.scale.set(0.1, 0.1, 0.1);
      console.log('Entrance Started')
      entranceStarted = true;
      menuBase.scale.set(startScale.x, startScale.y, startScale.z);
      currentScale = startScale
      // console.log(currentScale)
      entranceTween = new TWEEN.Tween(currentScale)
        .to(finalScale, entranceDuration)
        .easing(TWEEN.Easing.Exponential.In)
        .onUpdate(() => {
          menuBase.scale.set(currentScale.x, currentScale.y, currentScale.z);
        }).start();
    }
  } else {
    if (menuRayActive) {
      menuBase.visible = false;
      menuRayActive = false;
      entranceStarted = false;
      entranceTween.stop();
    }
    if (menuHand === 'left') conLeft.material.emissive.setHex(0x000000);
    if (menuHand === 'right') conRight.material.emissive.setHex(0x000000);
  }
}