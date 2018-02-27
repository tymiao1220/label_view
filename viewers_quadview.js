/* globals Stats, dat*/

var HelpersBoundingBox = AMI.BoundingBoxHelper;
var HelpersContour = AMI.ContourHelper;
var HelpersLocalizer = AMI.LocalizerHelper;

var CoreUtils = AMI.UtilsCore;
var ControlsTrackball = AMI.TrackballControl;
var LoadersVolume = AMI.VolumeLoader;
var CamerasOrthographic = AMI.OrthographicCamera;
var ControlsOrthographic = AMI.TrackballOrthoControl;

var HelpersStack = AMI.StackHelper;
var HelpersLut = AMI.LutHelper;
// Shaders
// Data
var ShadersDataUniforms = AMI.DataUniformShader;
var ShadersDataFragment = AMI.DataFragmentShader;
var ShadersDataVertex = AMI.DataVertexShader;
// Layer
var ShadersLayerUniforms = AMI.LayerUniformShader;
var ShadersLayerFragment = AMI.LayerFragmentShader;
var ShadersLayerVertex = AMI.LayerVertexShader;
// standard global variables
var greenChanged;
var yellowChanged;
var redChanged;

var stackFolder1;
var stackFolder2;
var stackFolder3;


var stack;
let stats;
let ready = false;
let readyTo = false;
let redContourHelper = null;
let redTextureTarget = null;
let redContourScene = null;
let layerMix = {
  opacity1: 0.5,
}

var labelStack={};
var label;
// 3d renderer
const r0 = {
  domId: 'r0',
  domElement: null,
  renderer: null,
  color: 0x212121,
  targetID: 0,
  camera: null,
  controls: null,
  scene: null,
  light: null,
  sceneLayer0:null,
  sceneLayer1:null,
  sceneLayerMix:null,
  sceneLayer0TextureTarget:null,
  sceneLayer1TextureTarget:null,
  uniformsLayer1:null
};

// 2d axial renderer
var r1 = {
  domId: 'r1',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'axial',
  sliceColor: 0xFF1744,
  targetID: 1,
  camera: null,
  controls: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
  sceneLayer0:null,
  sceneLayer1:null,
  sceneLayerMix:null,
  sceneLayer0TextureTarget:null,
  sceneLayer1TextureTarget:null,
  meshLayer1:null,
  meshLayerMix:null,
  uniformsLayerMix:null,
  materialLayer1:null,
  uniformsLayer1:null
};

// 2d sagittal renderer
var r2 = {
  domId: 'r2',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'sagittal',
  sliceColor: 0xFFEA00,
  targetID: 2,
  camera: null,
  controls: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
  sceneLayer0:null,
  sceneLayer1:null,
  sceneLayerMix:null,
  sceneLayer0TextureTarget:null,
  sceneLayer1TextureTarget:null,
    meshLayer1:null,
  meshLayerMix:null,
  uniformsLayerMix:null,
  materialLayer1:null,
  uniformsLayer1:null
};


// 2d coronal renderer
var r3 = {
  domId: 'r3',
  domElement: null,
  renderer: null,
  color: 0x121212,
  sliceOrientation: 'coronal',
  sliceColor: 0x76FF03,
  targetID: 3,
  camera: null,
  controls: null,
  light: null,
  stackHelper: null,
  localizerHelper: null,
  localizerScene: null,
  sceneLayer0:null,
  sceneLayer1:null,
  sceneLayerMix:null,
  sceneLayer0TextureTarget:null,
  sceneLayer1TextureTarget:null,
  meshLayer1:null,
  meshLayerMix:null,
  uniformsLayerMix:null,
  materialLayer1:null,
  uniformsLayer1:null
};

// extra variables to show mesh plane intersections in 2D renderers
let sceneClip = new THREE.Scene();
let clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
let clipPlane2 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
let clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

function initRenderer3D(renderObj) {

  // renderer
  renderObj.domElement = document.getElementById(renderObj.domId);

    renderObj.sceneLayer0TextureTarget = new THREE.WebGLRenderTarget(
    renderObj.domElement.clientWidth,
    renderObj.domElement.clientHeight,
    {minFilter: THREE.LinearFilter,
     magFilter: THREE.NearestFilter,
     format: THREE.RGBAFormat,
  });

  renderObj.sceneLayer1TextureTarget = new THREE.WebGLRenderTarget(
    renderObj.domElement.clientWidth,
    renderObj.domElement.clientHeight,
    {minFilter: THREE.LinearFilter,
     magFilter: THREE.NearestFilter,
     format: THREE.RGBAFormat,
  });
  renderObj.renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderObj.renderer.setSize(
    renderObj.domElement.clientWidth, renderObj.domElement.clientHeight);
  renderObj.renderer.setClearColor(renderObj.color, 1);
  renderObj.renderer.domElement.id = renderObj.targetID;
  renderObj.domElement.appendChild(renderObj.renderer.domElement);

  // camera
  renderObj.camera = new THREE.PerspectiveCamera(
    45, renderObj.domElement.clientWidth / renderObj.domElement.clientHeight,
    0.1, 100000);
  renderObj.camera.position.x = 250;
  renderObj.camera.position.y = 250;
  renderObj.camera.position.z = 250;

  // controls
  renderObj.controls = new ControlsTrackball(
    renderObj.camera, renderObj.domElement);
  renderObj.controls.rotateSpeed = 5.5;
  renderObj.controls.zoomSpeed = 1.2;
  renderObj.controls.panSpeed = 0.8;
  renderObj.controls.staticMoving = true;
  renderObj.controls.dynamicDampingFactor = 0.3;

  // scene
  renderObj.scene = new THREE.Scene();

  renderObj.sceneLayer0 = new THREE.Scene();
  renderObj.sceneLayer1 = new THREE.Scene();
  renderObj.sceneLayerMix = new THREE.Scene();
  // light
  renderObj.light = new THREE.DirectionalLight(0xffffff, 1);
  renderObj.light.position.copy(renderObj.camera.position);
  renderObj.sceneLayer0.add(renderObj.light);

  // stats
  stats = new Stats();
  renderObj.domElement.appendChild(stats.domElement);
}

function initRenderer2D(rendererObj) {
  // renderer
  rendererObj.domElement = document.getElementById(rendererObj.domId);
  rendererObj.renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  rendererObj.renderer.autoClear = false;
  rendererObj.renderer.localClippingEnabled = true;
  rendererObj.renderer.setSize(
    rendererObj.domElement.clientWidth, rendererObj.domElement.clientHeight);
  rendererObj.renderer.setClearColor(0x121212, 1);
  rendererObj.renderer.domElement.id = rendererObj.targetID;
  rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

  // camera
  rendererObj.camera = new CamerasOrthographic(
    rendererObj.domElement.clientWidth / -2,
    rendererObj.domElement.clientWidth / 2,
    rendererObj.domElement.clientHeight / 2,
    rendererObj.domElement.clientHeight / -2,
    1, 1000);

  // controls
  rendererObj.controls = new ControlsOrthographic(
    rendererObj.camera, rendererObj.domElement);
  rendererObj.controls.staticMoving = true;
  rendererObj.controls.noRotate = true;
  rendererObj.camera.controls = rendererObj.controls;

  // scene
  rendererObj.scene = new THREE.Scene();

  rendererObj.sceneLayer0 = new THREE.Scene();
  rendererObj.sceneLayer1 = new THREE.Scene();
  rendererObj.sceneLayerMix = new THREE.Scene();
}

function initHelpersStack(rendererObj, stack, stack2=null) {

    if(stack2!=null){
      rendererObj.sceneLayer0TextureTarget = new THREE.WebGLRenderTarget(
        rendererObj.domElement.clientWidth,
        rendererObj.domElement.clientHeight,
        {minFilter: THREE.LinearFilter,
         magFilter: THREE.NearestFilter,
         format: THREE.RGBAFormat,
      });

      rendererObj.sceneLayer1TextureTarget = new THREE.WebGLRenderTarget(
        rendererObj.domElement.clientWidth,
        rendererObj.domElement.clientHeight,
        {minFilter: THREE.LinearFilter,
         magFilter: THREE.NearestFilter,
         format: THREE.RGBAFormat,
      });

    
    var textures2 = [];
      for (var m = 0; m < stack2._rawData.length; m++) {
        var tex = new THREE.DataTexture(
              stack2.rawData[m],
              stack2.textureSize,   //4096
              stack2.textureSize,
              stack2.textureType,   //1023
              THREE.UnsignedByteType,
              THREE.UVMapping,
              THREE.ClampToEdgeWrapping,
              THREE.ClampToEdgeWrapping,
              THREE.NearestFilter,
              THREE.NearestFilter);
        tex.needsUpdate = true;
        tex.flipY = true;
        textures2.push(tex);
      }
      

      lutLayer1 = new HelpersLut(
        'my-lut-canvases-l1',
        'default',
        'linear',
        [[0, 0, 0, 0], [1, 0, 0, 1]],
        [[0, 0], [1, 1]],
        false);

      rendererObj.uniformsLayer1 = ShadersDataUniforms.uniforms();
      rendererObj.uniformsLayer1.uTextureSize.value = stack2.textureSize;
      rendererObj.uniformsLayer1.uTextureContainer.value = textures2;
      rendererObj.uniformsLayer1.uWorldToData.value = stack2.lps2IJK;
      rendererObj.uniformsLayer1.uNumberOfChannels.value = stack2.numberOfChannels;
      rendererObj.uniformsLayer1.uPixelType.value = stack2.pixelType;//3:50pm 01-08
      rendererObj.uniformsLayer1.uBitsAllocated.value = stack2.bitsAllocated;
      rendererObj.uniformsLayer1.uPackedPerPixel.value = stack2.packedPerPixel;//3:50pm 01-08
      rendererObj.uniformsLayer1.uWindowCenterWidth.value =
        [stack2.windowCenter, stack2.windowWidth];
      rendererObj.uniformsLayer1.uRescaleSlopeIntercept.value =
        [stack2.rescaleSlope, stack2.rescaleIntercept];
      rendererObj.uniformsLayer1.uDataDimensions.value = [stack2.dimensionsIJK.x,
                                              stack2.dimensionsIJK.y,
                                              stack2.dimensionsIJK.z];
      rendererObj.uniformsLayer1.uInterpolation.value = 0;//3:50pm 01-08

      rendererObj.uniformsLayer1.uLut.value = 1;

      rendererObj.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;

      // generate shaders on-demand!
      var fs = new ShadersDataFragment(rendererObj.uniformsLayer1);
      var vs = new ShadersDataVertex();
      rendererObj.materialLayer1 = new THREE.ShaderMaterial(
        {side: THREE.DoubleSide,
        uniforms: rendererObj.uniformsLayer1,
        vertexShader: vs.compute(),
        fragmentShader: fs.compute(),
        clippingPlanes: [],
      });
    }


    rendererObj.stackHelper = new HelpersStack(stack);
    rendererObj.stackHelper.bbox.visible = false;
    rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
    rendererObj.stackHelper.slice.canvasWidth =
      rendererObj.domElement.clientWidth;
    rendererObj.stackHelper.slice.canvasHeight =
      rendererObj.domElement.clientHeight;
    rendererObj.stackHelper.slice.intensityAuto =
      false
    // set camera
    let worldbb = stack.worldBoundingBox();
    let lpsDims = new THREE.Vector3(
      (worldbb[1] - worldbb[0])/2,
      (worldbb[3] - worldbb[2])/2,
      (worldbb[5] - worldbb[4])/2
    );

    // box: {halfDimensions, center}
    let box = {
      center: stack.worldCenter().clone(),
      halfDimensions:
        new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
    };

    // init and zoom
    let canvas = {
        width: rendererObj.domElement.clientWidth,
        height: rendererObj.domElement.clientHeight,
      };

    rendererObj.camera.directions =
      [stack.xCosine, stack.yCosine, stack.zCosine];
    rendererObj.camera.box = box;
    rendererObj.camera.canvas = canvas;
    rendererObj.camera.orientation = rendererObj.sliceOrientation;
    rendererObj.camera.update();
    rendererObj.camera.fitBox(2, 1);

    rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
    rendererObj.stackHelper.index =
      Math.floor(rendererObj.stackHelper.orientationMaxIndex/2);

    if(rendererObj.sceneLayer0.children.length==0){
      rendererObj.sceneLayer0.add(rendererObj.stackHelper);
    }else{
      rendererObj.sceneLayer0.children=[];
      rendererObj.sceneLayer0.add(rendererObj.stackHelper);
    }

    if(stack2!=null){
      rendererObj.meshLayer1 = new THREE.Mesh(rendererObj.stackHelper.slice.geometry, rendererObj.materialLayer1);
      // go the LPS space
      rendererObj.meshLayer1.applyMatrix(stack._ijk2LPS);
    //  rendererObj.sceneLayer1.add(rendererObj.meshLayer1);
      if(rendererObj.sceneLayer1.children.length==0){
        rendererObj.sceneLayer1.add(rendererObj.meshLayer1);
      }else{
        rendererObj.sceneLayer1.children=[];
        rendererObj.sceneLayer1.add(rendererObj.meshLayer1);
      }

      rendererObj.uniformsLayerMix = ShadersLayerUniforms.uniforms();
      rendererObj.uniformsLayerMix.uOpacity1.value = 0.5;
      rendererObj.uniformsLayerMix.uTextureBackTest0.value = rendererObj.sceneLayer0TextureTarget.texture;
      rendererObj.uniformsLayerMix.uTextureBackTest1.value = rendererObj.sceneLayer1TextureTarget.texture;

      let fls = new ShadersLayerFragment(rendererObj.uniformsLayerMix);
      let vls = new ShadersLayerVertex();

      rendererObj.materialLayerMix = new THREE.ShaderMaterial(
        {side: THREE.DoubleSide,
        uniforms: rendererObj.uniformsLayerMix,
        vertexShader: vls.compute(),
        fragmentShader: fls.compute(),
        transparent: true,
        clippingPlanes: [],
      });

      // add mesh in this scene with right shaders...
      rendererObj.meshLayerMix = new THREE.Mesh(rendererObj.stackHelper.slice.geometry, rendererObj.materialLayer1);
      // go the LPS space
      rendererObj.meshLayerMix.applyMatrix(stack._ijk2LPS);
    //  rendererObj.sceneLayerMix.add(rendererObj.meshLayerMix);
      if(rendererObj.sceneLayerMix.children.length==0){
        rendererObj.sceneLayerMix.add(rendererObj.meshLayerMix);
      }else{
        rendererObj.sceneLayerMix.children=[];
        rendererObj.sceneLayerMix.add(rendererObj.meshLayerMix);
      }
    }
  }

function initHelpersLocalizer(rendererObj, stack, referencePlane, localizers) {
    rendererObj.localizerHelper = new HelpersLocalizer(
      stack, rendererObj.stackHelper.slice.geometry, referencePlane);

    for (let i = 0; i < localizers.length; i++) {
      rendererObj.localizerHelper['plane' + (i + 1)] = localizers[i].plane;
      rendererObj.localizerHelper['color' + (i + 1)] = localizers[i].color;
    }

    rendererObj.localizerHelper.canvasWidth =
      rendererObj.domElement.clientWidth;
    rendererObj.localizerHelper.canvasHeight =
      rendererObj.domElement.clientHeight;

    rendererObj.localizerScene = new THREE.Scene();
    rendererObj.localizerScene.add(rendererObj.localizerHelper);
}

/**
 * Init the quadview
 */
function init() {
  /**
   * Called on each animation frame
   */
  function animate() {
    // we are ready when both meshes have been loaded
    if (ready) {
      // render
      r0.controls.update();
      r1.controls.update();
      r2.controls.update();
      r3.controls.update();

      r0.light.position.copy(r0.camera.position);
      if(!readyTo){
        r0.renderer.clear();
        r0.renderer.render(r0.sceneLayer0, r0.camera);
      }
      if(readyTo){
        for(key in labelStack){
          labelStack[key][0].renderer.clear();
        }
      }
      // r1
      if(!readyTo){
        r1.renderer.clear();
        r1.renderer.render(r1.sceneLayer0, r1.camera);
      }
      if(readyTo){
        for(key in labelStack){
        //  labelStack[key][1].renderer.clear();
          labelStack[key][1].renderer.render(labelStack[key][1].sceneLayer0, labelStack[key][1].camera, labelStack[key][1].sceneLayer0TextureTarget, true);
          // render second layer offscreen
          labelStack[key][1].renderer.render(labelStack[key][1].sceneLayer1, labelStack[key][1].camera, labelStack[key][1].sceneLayer1TextureTarget, true);
          // mix the layers and render it ON screen!
          labelStack[key][1].renderer.render(labelStack[key][1].sceneLayerMix, labelStack[key][1].camera);

          labelStack[key][1].materialLayer1.clippingPlanes = [clipPlane1];
          labelStack[key][1].materialLayerMix.clippingPlanes = [clipPlane1];
        }
      /*  r1.renderer.clear();
        r1.renderer.render(r1.sceneLayer0, r1.camera, r1.sceneLayer0TextureTarget, true);
        // render second layer offscreen
        r1.renderer.render(r1.sceneLayer1, r1.camera, r1.sceneLayer1TextureTarget, true);
        // mix the layers and render it ON screen!
        r1.renderer.render(r1.sceneLayerMix, r1.camera);

        r1.materialLayer1.clippingPlanes = [clipPlane1];
        r1.materialLayerMix.clippingPlanes = [clipPlane1];
        */
      }
      
      // localizer
      r1.renderer.clearDepth();
      r1.renderer.render(r1.localizerScene, r1.camera);

      // r2
      //r2.renderer.clear();
      if(!readyTo){
        r2.renderer.clear();
        r2.renderer.render(r2.sceneLayer0, r2.camera);
      }
      if(readyTo){
        for(key in labelStack){ 
        //  labelStack[key][2].renderer.clear();
          labelStack[key][2].renderer.render(labelStack[key][2].sceneLayer0, labelStack[key][2].camera, labelStack[key][2].sceneLayer0TextureTarget, true);
          // render second layer offscreen
          labelStack[key][2].renderer.render(labelStack[key][2].sceneLayer1, labelStack[key][2].camera, labelStack[key][2].sceneLayer1TextureTarget, true);
          // mix the layers and render it ON screen!
          labelStack[key][2].renderer.render(labelStack[key][2].sceneLayerMix, labelStack[key][2].camera);

          labelStack[key][2].materialLayer1.clippingPlanes = [clipPlane1];
          labelStack[key][2].materialLayerMix.clippingPlanes = [clipPlane1];
        }
      /*  r2.renderer.clear();
        r2.renderer.render(r2.sceneLayer0, r2.camera, r2.sceneLayer0TextureTarget, true);
        // render second layer offscreen
        r2.renderer.render(r2.sceneLayer1, r2.camera, r2.sceneLayer1TextureTarget, true);
        // mix the layers and render it ON screen!
        r2.renderer.render(r2.sceneLayerMix, r2.camera);

        r2.materialLayer1.clippingPlanes = [clipPlane2];
        r2.materialLayerMix.clippingPlanes = [clipPlane2];
        */
      }

      // localizer
      r2.renderer.clearDepth();
      r2.renderer.render(r2.localizerScene, r2.camera);
      // r3
      //r3.renderer.clear();
      //  r3.renderer.render(r3.scene, r3.camera);

      if(!readyTo){
          r3.renderer.clear();
          r3.renderer.render(r3.sceneLayer0, r3.camera);
      }
      if(readyTo){
        for(key in labelStack){
        //  labelStack[key][3].renderer.clear();
          labelStack[key][3].renderer.render(labelStack[key][3].sceneLayer0, labelStack[key][3].camera, labelStack[key][3].sceneLayer0TextureTarget, true);
          // render second layer offscreen
          labelStack[key][3].renderer.render(labelStack[key][3].sceneLayer1, labelStack[key][3].camera, labelStack[key][3].sceneLayer1TextureTarget, true);
          // mix the layers and render it ON screen!
          labelStack[key][3].renderer.render(labelStack[key][3].sceneLayerMix, labelStack[key][3].camera);

          labelStack[key][3].materialLayer1.clippingPlanes = [clipPlane1];
          labelStack[key][3].materialLayerMix.clippingPlanes = [clipPlane1];
        }
      /*
        r3.renderer.clear();
        r3.renderer.render(r3.sceneLayer0, r3.camera, r3.sceneLayer0TextureTarget, true);
        // render second layer offscreen
        r3.renderer.render(r3.sceneLayer1, r3.camera, r3.sceneLayer1TextureTarget, true);
        // mix the layers and render it ON screen!
        r3.renderer.render(r3.sceneLayerMix, r3.camera);

        r3.materialLayer1.clippingPlanes = [clipPlane3];
        r3.materialLayerMix.clippingPlanes = [clipPlane3];
        */
      }
      // localizer
      r3.renderer.clearDepth();
      r3.renderer.render(r3.localizerScene, r3.camera);
    }

    stats.update();

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }

  // renderers
  initRenderer3D(r0);
  initRenderer2D(r1);
  initRenderer2D(r2);
  initRenderer2D(r3);

  // start rendering loop
  animate();
}

window.onload = function() {
  // init threeJS
  init();
  let t2 = [
    '04397342','04397343','04397344','04397345','04397346','04397347','04397348','04397349','04397350','04397351',
    '04397352','04397353','04397354','04397355','04397356','04397357','04397358','04397359','04397360','04397361',
    '04397362','04397363','04397364','04397365','04397366','04397367','04397368','04397369','04397370','04397371',
    '04397372','04397373','04397374','04397375','04397376','04397377'
  ];

  let files = t2.map(function(v) {
    return '../testData/m241/'+v+'.dcm';
  });
  
  // load sequence for each file
  // instantiate the loader
  // it loads and parses the dicom image
  let loader = new LoadersVolume();
  loader.load(files)
  .then(function() {
    let series = loader.data[0].mergeSeries(loader.data)[0];
    loader.free();
    loader = null;
    // get first stack from series
    stack = series.stack[0];
  //  let stack2 = labelSeries.stack[0];

    stack.prepare();
  
    // center 3d camera/control on the stack
    let centerLPS = stack.worldCenter();
    r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    r0.camera.updateProjectionMatrix();
    r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

    // bouding box
    let boxHelper = new HelpersBoundingBox(stack);
    r0.sceneLayer0.add(boxHelper);

    // red slice
    initHelpersStack(r1, stack);
    r0.sceneLayer0.add(r1.sceneLayer0);

    // yellow slice
    initHelpersStack(r2, stack);
    r0.sceneLayer0.add(r2.sceneLayer0);

    // green slice
    initHelpersStack(r3, stack);
    r0.sceneLayer0.add(r3.sceneLayer0);

    // create new mesh with Localizer shaders
    let plane1 = r1.stackHelper.slice.cartesianEquation();
    let plane2 = r2.stackHelper.slice.cartesianEquation();
    let plane3 = r3.stackHelper.slice.cartesianEquation();

    // localizer red slice
    initHelpersLocalizer(r1, stack, plane1, [
      {plane: plane2,
       color: new THREE.Color(r2.stackHelper.borderColor),
      },
      {plane: plane3,
       color: new THREE.Color(r3.stackHelper.borderColor),
      },
    ]);

    // localizer yellow slice
    initHelpersLocalizer(r2, stack, plane2, [
      {plane: plane1,
       color: new THREE.Color(r1.stackHelper.borderColor),
      },
      {plane: plane3,
       color: new THREE.Color(r3.stackHelper.borderColor),
      },
    ]);

    // localizer green slice
    initHelpersLocalizer(r3, stack, plane3, [
      {plane: plane1,
       color: new THREE.Color(r1.stackHelper.borderColor),
      },
      {plane: plane2,
       color: new THREE.Color(r2.stackHelper.borderColor),
      },
    ]);



    function updateLayer1Green() {
    // update layer1 geometry...
      for(key in labelStack){
        
        if (labelStack[key][3].meshLayer1) {
            // dispose geometry first
            labelStack[key][3].meshLayer1.geometry.dispose();
            labelStack[key][3].meshLayer1.geometry = labelStack[key][3].stackHelper.slice.geometry;
            labelStack[key][3].meshLayer1.geometry.verticesNeedUpdate = true;
        }
      }
    /*
      if (r3.meshLayer1) {
          // dispose geometry first
          r3.meshLayer1.geometry.dispose();
          r3.meshLayer1.geometry = r3.stackHelper.slice.geometry;
          r3.meshLayer1.geometry.verticesNeedUpdate = true;
      }
*/
    }
    function updateLayer1Yellow() {
    // update layer1 geometry...
      for(key in labelStack){
        
        if (labelStack[key][2].meshLayer1) {
            // dispose geometry first
            labelStack[key][2].meshLayer1.geometry.dispose();
            labelStack[key][2].meshLayer1.geometry = labelStack[key][2].stackHelper.slice.geometry;
            labelStack[key][2].meshLayer1.geometry.verticesNeedUpdate = true;
        }
      }
/*
      if (r2.meshLayer1) {
          // dispose geometry first
          r2.meshLayer1.geometry.dispose();
          r2.meshLayer1.geometry = r2.stackHelper.slice.geometry;
          r2.meshLayer1.geometry.verticesNeedUpdate = true;
      }
*/  
    }
    function updateLayer1Red() {
    // update layer1 geometry...

     for(key in labelStack){
        
        if (labelStack[key][1].meshLayer1) {
            // dispose geometry first
            labelStack[key][1].meshLayer1.geometry.dispose();
            labelStack[key][1].meshLayer1.geometry = labelStack[key][1].stackHelper.slice.geometry;
            labelStack[key][1].meshLayer1.geometry.verticesNeedUpdate = true;
        }
      }
/*
      if (r1.meshLayer1) {
          // dispose geometry first
          
          r1.meshLayer1.geometry.dispose();
          r1.meshLayer1.geometry = r1.stackHelper.slice.geometry;
          r1.meshLayer1.geometry.verticesNeedUpdate = true;
      }
      */
    }
    /**
     * Update layer mix
     */
    function updateLayerMixGreen() {
      // update layer1 geometry...
      for(key in labelStack){
        if (labelStack[key][3].meshLayerMix) {
          labelStack[key][3].sceneLayerMix.remove(labelStack[key][3].meshLayerMix);
          labelStack[key][3].meshLayerMix.material.dispose();
          //meshLayerMix.material = null;//3:50pm 01-08
          labelStack[key][3].meshLayerMix.geometry.dispose();
          //meshLayerMix.geometry = null;//3:50pm 01-08

          // add mesh in this scene with right shaders...
          labelStack[key][3].meshLayerMix = 
          new THREE.Mesh(labelStack[key][3].stackHelper.slice.geometry, labelStack[key][3].materialLayerMix);
          // go the LPS space
          labelStack[key][3].meshLayerMix.applyMatrix(labelStack[key][3].stackHelper.stack._ijk2LPS);

          labelStack[key][3].sceneLayerMix.add(labelStack[key][3].meshLayerMix);
        }
      }
      /*
      if (r3.meshLayerMix) {
        r3.sceneLayerMix.remove(r3.meshLayerMix);
        r3.meshLayerMix.material.dispose();
        //meshLayerMix.material = null;//3:50pm 01-08
        r3.meshLayerMix.geometry.dispose();
        //meshLayerMix.geometry = null;//3:50pm 01-08

        // add mesh in this scene with right shaders...
        r3.meshLayerMix = 
        new THREE.Mesh(r3.stackHelper.slice.geometry, r3.materialLayerMix);
        // go the LPS space
        r3.meshLayerMix.applyMatrix(r3.stackHelper.stack._ijk2LPS);

        r3.sceneLayerMix.add(r3.meshLayerMix);
      }
      */
    }

    function updateLayerMixYellow() {
      // update layer1 geometry...

      /*
      if (r2.meshLayerMix) {
        r2.sceneLayerMix.remove(r2.meshLayerMix);
        r2.meshLayerMix.material.dispose();
        //meshLayerMix.material = null;//3:50pm 01-08
        r2.meshLayerMix.geometry.dispose();
        //meshLayerMix.geometry = null;//3:50pm 01-08

        // add mesh in this scene with right shaders...
        r2.meshLayerMix = 
        new THREE.Mesh(r2.stackHelper.slice.geometry, r2.materialLayerMix);
        // go the LPS space
        r2.meshLayerMix.applyMatrix(r2.stackHelper.stack._ijk2LPS);

        r2.sceneLayerMix.add(r2.meshLayerMix);
      }
      */
      for(key in labelStack){
        if (labelStack[key][2].meshLayerMix) {
          labelStack[key][2].sceneLayerMix.remove(labelStack[key][2].meshLayerMix);
          labelStack[key][2].meshLayerMix.material.dispose();
          //meshLayerMix.material = null;//3:50pm 01-08
          labelStack[key][2].meshLayerMix.geometry.dispose();
          //meshLayerMix.geometry = null;//3:50pm 01-08

          // add mesh in this scene with right shaders...
          labelStack[key][2].meshLayerMix = 
          new THREE.Mesh(labelStack[key][2].stackHelper.slice.geometry, labelStack[key][2].materialLayerMix);
          // go the LPS space
          labelStack[key][2].meshLayerMix.applyMatrix(labelStack[key][2].stackHelper.stack._ijk2LPS);

          labelStack[key][2].sceneLayerMix.add(labelStack[key][2].meshLayerMix);
        }
      }
    }

    function updateLayerMixRed() {
      // update layer1 geometry...
      /*
      if (r1.meshLayerMix) {
        r1.sceneLayerMix.remove(r1.meshLayerMix);
        r1.meshLayerMix.material.dispose();
        //meshLayerMix.material = null;//3:50pm 01-08
        r1.meshLayerMix.geometry.dispose();
        //meshLayerMix.geometry = null;//3:50pm 01-08

        // add mesh in this scene with right shaders...
        r1.meshLayerMix = 
        new THREE.Mesh(r1.stackHelper.slice.geometry, r1.materialLayerMix);
        // go the LPS space
        r1.meshLayerMix.applyMatrix(r1.stackHelper.stack._ijk2LPS);

        r1.sceneLayerMix.add(r1.meshLayerMix);
      }
      */
      for(key in labelStack){
        if (labelStack[key][1].meshLayerMix) {
          labelStack[key][1].sceneLayerMix.remove(labelStack[key][1].meshLayerMix);
          labelStack[key][1].meshLayerMix.material.dispose();
          //meshLayerMix.material = null;//3:50pm 01-08
          labelStack[key][1].meshLayerMix.geometry.dispose();
          //meshLayerMix.geometry = null;//3:50pm 01-08

          // add mesh in this scene with right shaders...
          labelStack[key][1].meshLayerMix = 
          new THREE.Mesh(labelStack[key][1].stackHelper.slice.geometry, labelStack[key][1].materialLayerMix);
          // go the LPS space
          labelStack[key][1].meshLayerMix.applyMatrix(labelStack[key][1].stackHelper.stack._ijk2LPS);

          labelStack[key][1].sceneLayerMix.add(labelStack[key][1].meshLayerMix);
        }
      }
    }
    console.log(r1);
    let gui = new dat.GUI({
      autoPlace: false,
    });
    let customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    // Red
    stackFolder1 = gui.addFolder('Axial (Red)');

    var opacityLayerMix1Red = stackFolder1.add(
      layerMix, 'opacity1', 0, 1).step(0.01).onChange(function(value) {
      r1.uniformsLayerMix.uOpacity1.value = value;
    });

    stackFolder1.add(
      r1.stackHelper.slice, 'interpolation', 0, 1).step(1).listen();
    
    redChanged = stackFolder1.add(
      r1.stackHelper,
      'index', 0, r1.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
      onRedChanged();
    });

    // Yellow
    stackFolder2 = gui.addFolder('Sagittal (yellow)');

    var opacityLayerMix1Yellow = stackFolder2.add(
      layerMix, 'opacity1', 0, 1).step(0.01).onChange(function(value) {
      r2.uniformsLayerMix.uOpacity1.value = value;
    });
    stackFolder2.add(
      r2.stackHelper.slice, 'interpolation', 0, 1).step(1).listen();

    yellowChanged = stackFolder2.add(
      r2.stackHelper,
      'index', 0, r2.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
      onYellowChanged();
    });

    // Green
    stackFolder3 = gui.addFolder('Coronal (green)');
    
    var opacityLayerMix1 = stackFolder3.add(
      layerMix, 'opacity1', 0, 1).step(0.01).onChange(function(value) {
      r3.uniformsLayerMix.uOpacity1.value = value;
    });
  

    stackFolder3.add(
      r3.stackHelper.slice, 'interpolation', 0, 1).step(1).listen();

    greenChanged = stackFolder3.add(
      r3.stackHelper,
      'index', 0, r3.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
      onGreenChanged();
    });
    var  params = {color: "#1861b3" }
    stackFolder4 = gui.addFolder('Label Color');
    stackFolder4.addColor(params,'color').onChange(update);

    function update() {
        var colorObj = new THREE.Color( params.color );

        lutLayer1 = new HelpersLut(
        'my-lut-canvases-l1',
        'default',
        'linear',
        [[0, 0, 0, 0], [1, colorObj.r, colorObj.g, colorObj.b]],
        [[0, 0], [1, 1]],
        false);
        r1.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
        r2.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
        r3.uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
    };
    /**
     * Update Layer Mix
     */
    function updateLocalizer(refObj, targetLocalizersHelpers) {
      let refHelper = refObj.stackHelper;
      let localizerHelper = refObj.localizerHelper;
      let plane = refHelper.slice.cartesianEquation();
      localizerHelper.referencePlane = plane;

      // bit of a hack... works fine for this application
      for (let i = 0; i < targetLocalizersHelpers.length; i++) {
        for (let j = 0; j < 3; j++) {
          let targetPlane = targetLocalizersHelpers[i]['plane' + (j + 1)];
          if (targetPlane &&
             plane.x.toFixed(6) === targetPlane.x.toFixed(6) &&
             plane.y.toFixed(6) === targetPlane.y.toFixed(6) &&
             plane.z.toFixed(6) === targetPlane.z.toFixed(6)) {
            targetLocalizersHelpers[i]['plane' + (j + 1)] = plane;
          }
        }
      }

      // update the geometry will create a new mesh
      localizerHelper.geometry = refHelper.slice.geometry;
    }

    function updateClipPlane(refObj, clipPlane) {
      const stackHelper = refObj.stackHelper;
      const camera = refObj.camera;
      let vertices = stackHelper.slice.geometry.vertices;
      let p1 = new THREE.Vector3(vertices[0].x, vertices[0].y, vertices[0].z)
        .applyMatrix4(stackHelper._stack.ijk2LPS);
      let p2 = new THREE.Vector3(vertices[1].x, vertices[1].y, vertices[1].z)
        .applyMatrix4(stackHelper._stack.ijk2LPS);
      let p3 = new THREE.Vector3(vertices[2].x, vertices[2].y, vertices[2].z)
        .applyMatrix4(stackHelper._stack.ijk2LPS);

      clipPlane.setFromCoplanarPoints(p1, p2, p3);

      let cameraDirection = new THREE.Vector3(1, 1, 1);
      cameraDirection.applyQuaternion(camera.quaternion);

      if (cameraDirection.dot(clipPlane.normal) > 0) {
        clipPlane.negate();
      }
    }

    function onYellowChanged() {
      updateLocalizer(r2, [r1.localizerHelper, r3.localizerHelper]);
      updateClipPlane(r2, clipPlane2);
      if(readyTo){
        updateLayer1Yellow();
        updateLayerMixYellow();
      }
    }

   // yellowChanged.onChange(onYellowChanged);

    function onRedChanged() {
      updateLocalizer(r1, [r2.localizerHelper, r3.localizerHelper]);
      updateClipPlane(r1, clipPlane1);
    if(readyTo){
      updateLayer1Red();
      updateLayerMixRed();
    }
    }

   // redChanged.onChange(onRedChanged);

    function onGreenChanged() {
      updateLocalizer(r3, [r1.localizerHelper, r2.localizerHelper]);
      updateClipPlane(r3, clipPlane3);
      if(readyTo){
        updateLayer1Green();
        updateLayerMixGreen();
      }
    }

//    greenChanged.onChange(onGreenChanged);

    function onDoubleClick(event) {

      const canvas = event.target.parentElement;
      const id = event.target.id;
      const mouse = {
        x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
        y: - ((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
      };
      //
      let camera = null;
      let stackHelper = null;
      let sceneLayer0 = null;
      switch (id) {
        case '0':
          camera = r0.camera;
          stackHelper = r1.stackHelper;
          sceneLayer0 = r0.sceneLayer0;
          break;
        case '1':
          camera = r1.camera;
          stackHelper = r1.stackHelper;
          sceneLayer0 = r1.sceneLayer0;
          break;
        case '2':
          camera = r2.camera;
          stackHelper = r2.stackHelper;
          sceneLayer0 = r2.sceneLayer0;
          break;
        case '3':
          camera = r3.camera;
          stackHelper = r3.stackHelper;
          sceneLayer0 = r3.sceneLayer0;
          break;
      }

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(sceneLayer0.children, true);
      if (intersects.length > 0) {
        let ijk =
          CoreUtils.worldToData(stackHelper.stack.lps2IJK, intersects[0].point);

        r1.stackHelper.index =
          ijk.getComponent((r1.stackHelper.orientation + 2) % 3);
        r2.stackHelper.index =
          ijk.getComponent((r2.stackHelper.orientation + 2) % 3);
        r3.stackHelper.index =
          ijk.getComponent((r3.stackHelper.orientation + 2) % 3);

        onGreenChanged();
        onRedChanged();
        onYellowChanged();
      }
    }

    // event listeners
    r0.domElement.addEventListener('dblclick', onDoubleClick);
    r1.domElement.addEventListener('dblclick', onDoubleClick);
    r2.domElement.addEventListener('dblclick', onDoubleClick);
    r3.domElement.addEventListener('dblclick', onDoubleClick);

    function onClick(event) {
      const canvas = event.target.parentElement;
      const id = event.target.id;
      const mouse = {
        x: ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1,
        y: - ((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1,
      };
      //
      let camera = null;
      let stackHelper = null;
      let scene = null;
      switch (id) {
        case '0':
          camera = r0.camera;
          stackHelper = r1.stackHelper;
          scene = r0.scene;
          break;
        case '1':
          camera = r1.camera;
          stackHelper = r1.stackHelper;
          scene = r1.scene;
          break;
        case '2':
          camera = r2.camera;
          stackHelper = r2.stackHelper;
          scene = r2.scene;
          break;
        case '3':
          camera = r3.camera;
          stackHelper = r3.stackHelper;
          scene = r3.scene;
          break;
      }

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        if (intersects[0].object && intersects[0].object.objRef) {
          const refObject = intersects[0].object.objRef;
          refObject.selected = !refObject.selected;

          let color = refObject.color;
          if (refObject.selected) {
            color = 0xCCFF00;
          }

          // update materials colors
          refObject.material.color.setHex(color);
          refObject.materialFront.color.setHex(color);
          refObject.materialBack.color.setHex(color);
        }
      }
    }
    r0.domElement.addEventListener('click', onClick);

    function onScroll(event) {
      const id = event.target.domElement.id;
      let stackHelper = null;
      switch (id) {
        case 'r1':
          stackHelper = r1.stackHelper;
          break;
        case 'r2':
          stackHelper = r2.stackHelper;
          break;
        case 'r3':
          stackHelper = r3.stackHelper;
          break;
      }

      if (event.delta > 0) {
        if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
          return false;
        }
        stackHelper.index += 1;
      } else {
        if (stackHelper.index <= 0) {
          return false;
        }
        stackHelper.index -= 1;
      }

      onGreenChanged();
      onRedChanged();
      onYellowChanged();
    }

     // event listeners
    r1.controls.addEventListener('OnScroll', onScroll);
    r2.controls.addEventListener('OnScroll', onScroll);
    r3.controls.addEventListener('OnScroll', onScroll);

    function windowResize2D(rendererObj) {
      rendererObj.camera.canvas = {
        width: rendererObj.domElement.clientWidth,
        height: rendererObj.domElement.clientHeight,
      };
      rendererObj.camera.fitBox(2, 1);
      rendererObj.renderer.setSize(
        rendererObj.domElement.clientWidth,
        rendererObj.domElement.clientHeight);

      // update info to draw borders properly
      rendererObj.stackHelper.slice.canvasWidth =
        rendererObj.domElement.clientWidth;
      rendererObj.stackHelper.slice.canvasHeight =
        rendererObj.domElement.clientHeight;
      rendererObj.localizerHelper.canvasWidth =
        rendererObj.domElement.clientWidth;
      rendererObj.localizerHelper.canvasHeight =
        rendererObj.domElement.clientHeight;
    }

    function onWindowResize() {
      // update 3D
      r0.camera.aspect = r0.domElement.clientWidth / r0.domElement.clientHeight;
      r0.camera.updateProjectionMatrix();
      r0.renderer.setSize(
        r0.domElement.clientWidth, r0.domElement.clientHeight);

      // update 2d
      windowResize2D(r1);
      windowResize2D(r2);
      windowResize2D(r3);
    }

    window.addEventListener('resize', onWindowResize, false);
    ready = true;
    onGreenChanged();
    onRedChanged();
    onYellowChanged();
    $('#overlay').on('click',function(){
      label = {};
      let loader = new LoadersVolume();
      loader.load('./testData/m241-1.nrrd')
      .then(function() {


        let labelSeries = loader.data[0].mergeSeries(loader.data)[0];
        loader.free();
        loader = null;
        // get first stack from series
        let stack2 = labelSeries.stack[0];
        stack2.prepare();
      // pixels packing for the fragment shaders now happens there
        stack2.pack();
        initHelpersStack(r1, stack, stack2);
        r0.sceneLayer1.add(r1.sceneLayer1);
        r0.sceneLayerMix.add(r1.sceneLayerMix);
        initHelpersStack(r2, stack, stack2);
        r0.sceneLayer1.add(r2.sceneLayer1);
        r0.sceneLayerMix.add(r2.sceneLayerMix);
        initHelpersStack(r3, stack, stack2);
        r0.sceneLayer1.add(r3.sceneLayer1);
        r0.sceneLayerMix.add(r3.sceneLayerMix);

        label[0]=r0;
        label[1]=r1;
        label[2]=r2;
        label[3]=r3;

        labelStack['./testData/m241-1.nrrd'] = label;
        console.log(labelStack);
        readyTo = true;
        onGreenChanged();
        onRedChanged();
        onYellowChanged();

        console.log(r1);
        if(redChanged){
          stackFolder1.remove(redChanged);
        }
        
        redChanged = stackFolder1.add(
          r1.stackHelper,
          'index', 0, r1.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
          onRedChanged();
        });

        stackFolder2.remove(yellowChanged);
        yellowChanged = stackFolder2.add(
          r2.stackHelper,
          'index', 0, r2.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
          onYellowChanged();
        });

        stackFolder3.remove(greenChanged);
        greenChanged = stackFolder3.add(
          r3.stackHelper,
          'index', 0, r3.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
          onGreenChanged();
        });

        
      }).catch(function(error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
      });
    });
    $('#overlay2').on('click',function(){
      label = {};
      let loader = new LoadersVolume();
      loader.load('./testData/m241-2.nrrd')
      .then(function() {


        let labelSeries = loader.data[0].mergeSeries(loader.data)[0];
        loader.free();
        loader = null;
        // get first stack from series
        let stack2 = labelSeries.stack[0];
        stack2.prepare();
      // pixels packing for the fragment shaders now happens there
        stack2.pack();
        initHelpersStack(r1, stack, stack2);
        r0.sceneLayer1.add(r1.sceneLayer1);
        r0.sceneLayerMix.add(r1.sceneLayerMix);
        initHelpersStack(r2, stack, stack2);
        r0.sceneLayer1.add(r2.sceneLayer1);
        r0.sceneLayerMix.add(r2.sceneLayerMix);
        initHelpersStack(r3, stack, stack2);
        r0.sceneLayer1.add(r3.sceneLayer1);
        r0.sceneLayerMix.add(r3.sceneLayerMix);

        label[0]=r0;
        label[1]=r1;
        label[2]=r2;
        label[3]=r3;

        labelStack['./testData/m241-2.nrrd'] = label;
        console.log(labelStack);
        readyTo = true;
        onGreenChanged();
        onRedChanged();
        onYellowChanged();
     
        console.log(r1);
        if(redChanged){
          stackFolder1.remove(redChanged);
        }
        
        redChanged = stackFolder1.add(
          r1.stackHelper,
          'index', 0, r1.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
          onRedChanged();
        });

        stackFolder2.remove(yellowChanged);
        yellowChanged = stackFolder2.add(
          r2.stackHelper,
          'index', 0, r2.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
          onYellowChanged();
        });

        stackFolder3.remove(greenChanged);
        greenChanged = stackFolder3.add(
          r3.stackHelper,
          'index', 0, r3.stackHelper.orientationMaxIndex).step(1).listen().onChange(function() {
          onGreenChanged();
        });

        
      }).catch(function(error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
      });
    })
  })
  .catch(function(error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
  });
};
