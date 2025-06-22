/**
 * Enhanced Tesseract Control Configuration - 8-AXIS MOBILE SYSTEM
 * NEW: Supports Magic Window device orientation + separated touch gestures
 * ENHANCED: Desktop compatibility maintained + new mobile controls
 */

const TesseractControlConfig = {
  // Panel title
  title: "Enhanced 4D Controls",
  
  // UNCHANGED: Parameter controls (work for both desktop and mobile)
  parameters: [
    {
      id: 'fov',
      label: 'FOV',
      type: 'number',
      default: 7,
      min: 2,
      max: 120,
      step: 1,
      uniformName: 'u_fov'
    },
    {
      id: 'perspective',
      label: '4D Scale',
      type: 'number',
      default: 2.3,
      min: 0.1,
      max: 10,
      step: 0.1,
      uniformName: 'u_perspective'
    },
    {
      id: 'cameraZ',
      label: 'Camera Z',
      type: 'number',
      default: 10,
      min: -100,
      max: 50,
      step: 1,
      uniformName: 'u_cameraZ'
    }
  ],
  
  // ENHANCED: Button controls with 8-axis support
  buttons: [
    // Wide reset button (universal)
    {
      id: 'reset-rotation',
      label: 'Reset All Rotation',
      action: 'resetRotation',
      wide: true
    },
    
    // DESKTOP-ONLY: Original 3-axis controls (unchanged for compatibility)
    {
      id: 'stop-rx-desktop',
      label: 'Stop RX',
      action: 'toggleVelocity_rx',
      desktopOnly: true
    },
    {
      id: 'stop-ry-desktop',
      label: 'Stop RY', 
      action: 'toggleVelocity_ry',
      desktopOnly: true
    },
    {
      id: 'stop-rw-desktop',
      label: 'Stop RW',
      action: 'toggleVelocity_rw',
      desktopOnly: true
    },
    
    // MOBILE-ONLY: Enhanced 8-axis controls
    // Row 1: 3D Camera Controls (Magic Window)
    {
      id: 'stop-rx-mobile',
      label: 'Stop RX',
      action: 'toggleVelocity_rx',
      mobileOnly: true,
      tooltip: 'Pitch (forward/back tilt)'
    },
    {
      id: 'stop-ry-mobile', 
      label: 'Stop RY',
      action: 'toggleVelocity_ry',
      mobileOnly: true,
      tooltip: 'Roll (left/right tilt)'
    },
    {
      id: 'stop-rz-mobile',
      label: 'Stop RZ', 
      action: 'toggleVelocity_rz',
      mobileOnly: true,
      tooltip: 'Yaw (compass rotation)'
    },
    
    // Row 2: 4D Hypercube Controls (Touch Gestures)
    {
      id: 'stop-rwx-mobile',
      label: 'Stop RWX',
      action: 'toggleVelocity_rwx',
      mobileOnly: true,
      tooltip: '4D W-X rotation (horizontal touch)'
    },
    {
      id: 'stop-rwy-mobile',
      label: 'Stop RWY',
      action: 'toggleVelocity_rwy', 
      mobileOnly: true,
      tooltip: '4D W-Y rotation (vertical touch)'
    },
    {
      id: 'stop-rw-mobile',
      label: 'Stop RW',
      action: 'toggleVelocity_rw',
      mobileOnly: true,
      tooltip: 'Legacy 4D rotation'
    },
    
    // Row 3: Input Source Controls
    {
      id: 'toggle-magic-window',
      label: 'Magic Window',
      action: 'toggleDeviceOrientationControl',
      mobileOnly: true,
      tooltip: 'Device orientation → 3D camera'
    },
    {
      id: 'toggle-touch-gestures',
      label: 'Touch Gestures',
      action: 'toggleTouchGestureControl', 
      mobileOnly: true,
      tooltip: 'Touch → 4D hypercube rotation'
    },
    {
      id: 'invert-x-axis',
      label: 'Invert X',
      action: 'toggleXAxisInvert',
      mobileOnly: true,
      tooltip: 'Invert X-axis orientation'
    }
  ],
  
  // ENHANCED: Mobile-specific settings
  mobile: {
    showMotionControl: true,
    showMagicWindowControls: true,
    additionalControls: [
      'toggle-magic-window', 
      'toggle-touch-gestures', 
      'invert-x-axis'
    ]
  },
  
  // ENHANCED: Info section with 8-axis explanations
  info: {
    title: "Enhanced 4D Hypercube Controls",
    desktop: [
      "• Click anywhere to start tutorial",
      "• Move mouse to rotate in 3D space (RX, RY)", 
      "• Scroll to rotate through 4th dimension (RW)",
      "• Classic 3-axis control system"
    ],
    mobile: [
      "• Tap button below to start tutorial",
      "• MAGIC WINDOW: Tilt device for 3D perspective (RX, RY, RZ)",
      "• TOUCH GESTURES: Swipe for 4D rotations (RWX, RWY)",
      "• Horizontal swipe = RWX, Vertical swipe = RWY",
      "• Full 8-axis control system"
    ]
  }
};

/**
 * ENHANCED: Parameter registration mapping (unchanged)
 */
const TesseractParameterMap = {
  'fov': 'u_fov',
  'perspective': 'u_perspective', 
  'cameraZ': 'u_cameraZ'
};

/**
 * ENHANCED: Button action mapping for 8-axis system
 */
const TesseractActionMap = {
  'resetRotation': 'resetRotation',
  
  // 8-axis velocity toggles
  'toggleVelocity_rx': 'rx',    // Camera pitch
  'toggleVelocity_ry': 'ry',    // Camera roll
  'toggleVelocity_rz': 'rz',    // Camera yaw
  'toggleVelocity_rwx': 'rwx',  // 4D W-X rotation
  'toggleVelocity_rwy': 'rwy',  // 4D W-Y rotation
  'toggleVelocity_rw': 'rw',    // Legacy 4D rotation
  
  // NEW: Input source controls
  'toggleDeviceOrientationControl': 'toggleDeviceOrientationControl',
  'toggleTouchGestureControl': 'toggleTouchGestureControl',
  'toggleXAxisInvert': 'toggleXAxisInvert',
  
  // LEGACY: Compatibility mappings
  'toggleMotionControl': 'toggleDeviceOrientationControl',
  'toggleTouchControl': 'toggleTouchGestureControl'
};

/**
 * ENHANCED: Default values for 8-axis system
 */
const TesseractDefaults = {
  fov: 7.0,
  perspective: 2.3,
  cameraZ: 10.0,
  lineWidth: 0.02,
  
  // ENHANCED: 8-axis rotation defaults
  rotation: {
    // 3D Camera (Magic Window)
    rx: 0, ry: 0, rz: 0,
    // 4D Hypercube (Touch + Legacy)
    rwx: 0, rwy: 0, rw: 0
  },
  
  // ENHANCED: 8-axis velocity defaults
  velocityEnabled: {
    // 3D Camera controls
    rx: true, ry: true, rz: true,
    // 4D Hypercube controls
    rwx: true, rwy: true, rw: true
  },
  
  // NEW: Input source defaults
  inputSources: {
    deviceOrientationEnabled: false,
    touchGestureEnabled: true,
    xAxisInverted: false
  }
};

/**
 * ENHANCED: Responsive button layout for 8-axis system
 */
const TesseractButtonLayout = {
  desktop: {
    rows: [
      ['stop-rx-desktop', 'stop-ry-desktop', 'stop-rw-desktop']
    ]
  },
  mobile: {
    rows: [
      // 3D Camera Controls (Magic Window)
      ['stop-rx-mobile', 'stop-ry-mobile', 'stop-rz-mobile'],
      // 4D Hypercube Controls (Touch Gestures) 
      ['stop-rwx-mobile', 'stop-rwy-mobile', 'stop-rw-mobile'],
      // Input Source Controls
      ['toggle-magic-window', 'toggle-touch-gestures', 'invert-x-axis']
    ]
  }
};

/**
 * ENHANCED: Advanced configuration with 8-axis smoothing
 */
const TesseractSmoothingConfig = {
  default: 0.1,
  parameters: {
    'fov': 0.05,
    'perspective': 0.1,
    'cameraZ': 0.15
  },
  // NEW: Axis-specific smoothing
  motionAxes: {
    // 3D Camera (smoother for magic window effect)
    'rx': 0.12, 'ry': 0.12, 'rz': 0.10,
    // 4D Hypercube (responsive for touch gestures)
    'rwx': 0.08, 'rwy': 0.08, 'rw': 0.10
  }
};

/**
 * ENHANCED: Validation rules (unchanged parameters)
 */
const TesseractValidation = {
  fov: {
    min: 2, max: 120, step: 1,
    warningThreshold: { min: 5, max: 90 },
    errorMessage: "FOV must be between 2 and 120 degrees"
  },
  perspective: {
    min: 0.1, max: 10, step: 0.1,
    warningThreshold: { min: 0.5, max: 5 },
    errorMessage: "4D Scale must be between 0.1 and 10"
  },
  cameraZ: {
    min: -100, max: 50, step: 1,
    warningThreshold: { min: -20, max: 20 },
    errorMessage: "Camera Z must be between -100 and 50"
  }
};

/**
 * ENHANCED: Helper function to register 8-axis parameters with shader
 */
function registerTesseractParameters(shader) {
  TesseractControlConfig.parameters.forEach(param => {
    shader.registerParameter(param.id, param.uniformName, param.default);
  });
  
  console.log('✅ Enhanced Tesseract 8-axis parameters registered');
}

/**
 * ENHANCED: Helper function to apply 8-axis defaults
 */
function applyTesseractDefaults(shader) {
  // Apply parameter defaults
  Object.keys(TesseractDefaults).forEach(key => {
    if (key !== 'rotation' && key !== 'velocityEnabled' && key !== 'inputSources' && shader.setParameter) {
      shader.setParameter(key, TesseractDefaults[key]);
    }
  });
  
  // Apply 8-axis defaults if enhanced shader
  if (shader.angles && TesseractDefaults.rotation) {
    Object.assign(shader.angles, TesseractDefaults.rotation);
  }
  
  if (shader.velocityEnabled && TesseractDefaults.velocityEnabled) {
    Object.assign(shader.velocityEnabled, TesseractDefaults.velocityEnabled);
  }
  
  console.log('✅ Enhanced Tesseract 8-axis defaults applied');
}

/**
 * NEW: Helper function to detect mobile capabilities
 */
function detectMobileCapabilities() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasDeviceOrientation = 'DeviceOrientationEvent' in window;
  const hasDeviceMotion = 'DeviceMotionEvent' in window;
  const hasPermissionAPI = 'permissions' in navigator;
  
  return {
    isMobile,
    hasDeviceOrientation,
    hasDeviceMotion,
    hasPermissionAPI,
    supports8Axis: isMobile && hasDeviceOrientation
  };
}

/**
 * NEW: Helper function to get appropriate button layout
 */
function getButtonLayoutForDevice() {
  const capabilities = detectMobileCapabilities();
  
  if (capabilities.supports8Axis) {
    return TesseractButtonLayout.mobile;
  } else {
    return TesseractButtonLayout.desktop;
  }
}

// ==========================================
// EXPORT SYSTEM (Both ES6 and Window Globals)
// ==========================================

if (typeof exports !== 'undefined') {
  exports.TesseractControlConfig = TesseractControlConfig;
  exports.TesseractParameterMap = TesseractParameterMap;
  exports.TesseractActionMap = TesseractActionMap;
  exports.TesseractDefaults = TesseractDefaults;
  exports.TesseractButtonLayout = TesseractButtonLayout;
  exports.TesseractSmoothingConfig = TesseractSmoothingConfig;
  exports.TesseractValidation = TesseractValidation;
  exports.registerTesseractParameters = registerTesseractParameters;
  exports.applyTesseractDefaults = applyTesseractDefaults;
  exports.detectMobileCapabilities = detectMobileCapabilities;
  exports.getButtonLayoutForDevice = getButtonLayoutForDevice;
}

if (typeof window !== 'undefined') {
  window.TesseractControlConfig = TesseractControlConfig;
  window.TesseractParameterMap = TesseractParameterMap;
  window.TesseractActionMap = TesseractActionMap;
  window.TesseractDefaults = TesseractDefaults;
  window.TesseractButtonLayout = TesseractButtonLayout;
  window.TesseractSmoothingConfig = TesseractSmoothingConfig;
  window.TesseractValidation = TesseractValidation;
  window.registerTesseractParameters = registerTesseractParameters;
  window.applyTesseractDefaults = applyTesseractDefaults;
  window.detectMobileCapabilities = detectMobileCapabilities;
  window.getButtonLayoutForDevice = getButtonLayoutForDevice;
  
  console.log('✅ Enhanced TesseractControlConfig (8-AXIS) available globally');
}

/**
 * ENHANCED: Default export object for ES6
 */
const TesseractConfigDefault = {
  config: TesseractControlConfig,
  parameterMap: TesseractParameterMap,
  actionMap: TesseractActionMap,
  defaults: TesseractDefaults,
  buttonLayout: TesseractButtonLayout,
  smoothing: TesseractSmoothingConfig,
  validation: TesseractValidation,
  registerParameters: registerTesseractParameters,
  applyDefaults: applyTesseractDefaults,
  detectMobileCapabilities: detectMobileCapabilities,
  getButtonLayoutForDevice: getButtonLayoutForDevice
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TesseractConfigDefault;
  module.exports.TesseractControlConfig = TesseractControlConfig;
}

if (typeof window !== 'undefined') {
  window.TesseractConfigDefault = TesseractConfigDefault;
}

/**
 * 🎮 ENHANCED 8-AXIS CONTROL SYSTEM COMPLETE!
 * 
 * Features:
 * ✅ 8-axis control system (RX,RY,RZ + RWX,RWY,RW)
 * ✅ Magic Window device orientation mapping
 * ✅ Separated touch gesture controls  
 * ✅ Desktop compatibility maintained
 * ✅ Mobile-specific button layouts
 * ✅ Enhanced tooltips and explanations
 * ✅ Input source toggle controls
 * 
 * Mobile Button Layout:
 * Row 1: RX, RY, RZ (3D Camera - Magic Window)
 * Row 2: RWX, RWY, RW (4D Hypercube - Touch)
 * Row 3: Magic Window, Touch, Invert (Input Sources)
 * 
 * Desktop Layout: 
 * Row 1: RX, RY, RW (Original system unchanged)
 */
