/**
 * Tesseract Tutorial Control Configuration
 * Defines all parameters, buttons, and UI for the 4D hypercube controls
 * Used by ControlPanelRenderer to generate HTML and bind events
 */

export const TesseractControlConfig = {
  // Panel title
  title: "4D Projection Controls",
  
  // Parameter controls
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
  
  // Button controls
  buttons: [
    // Wide reset button
    {
      id: 'reset-rotation',
      label: 'Reset Rotation',
      action: 'resetRotation',
      wide: true
    },
    
    // Desktop-only velocity controls
    {
      id: 'stop-rx',
      label: 'Stop RX',
      action: 'toggleVelocityRX',
      desktopOnly: true
    },
    {
      id: 'stop-ry',
      label: 'Stop RY', 
      action: 'toggleVelocityRY',
      desktopOnly: true
    },
    {
      id: 'stop-rw',
      label: 'Stop RW',
      action: 'toggleVelocityRW', 
      desktopOnly: true
    },
    
    // Mobile-only velocity controls (first row)
    {
      id: 'stop-rx-mobile',
      label: 'Stop RX',
      action: 'toggleVelocityRX',
      mobileOnly: true
    },
    {
      id: 'stop-ry-mobile', 
      label: 'Stop RY',
      action: 'toggleVelocityRY',
      mobileOnly: true
    },
    {
      id: 'stop-rw-mobile',
      label: 'Stop RW', 
      action: 'toggleVelocityRW',
      mobileOnly: true
    },
    
    // Mobile-only additional controls (second row)
    {
      id: 'stop-motion',
      label: 'Stop Motion',
      action: 'toggleMotionControl',
      mobileOnly: true
    },
    {
      id: 'stop-touch',
      label: 'Stop Touch',
      action: 'toggleTouchControl', 
      mobileOnly: true
    },
    {
      id: 'invert-x',
      label: 'Fix X-Axis',
      action: 'toggleXAxisInvert',
      mobileOnly: true
    }
  ],
  
  // Mobile-specific settings
  mobile: {
    showMotionControl: true,
    additionalControls: ['stop-motion', 'stop-touch', 'invert-x']
  },
  
  // Info section with device-specific instructions
  info: {
    title: "4D Hypercube Controls",
    desktop: [
      "• Click anywhere to start tutorial",
      "• Move mouse to rotate in 3D space", 
      "• Scroll to rotate through 4th dimension"
    ],
    mobile: [
      "• Tap button below to start tutorial",
      "• Tilt device to rotate hypercube",
      "• Touch and drag for manual control",
      "• Use \"Motion Control\" above to enable device tilt"
    ]
  }
};

/**
 * Parameter registration mapping for TesseractShader
 * Maps parameter IDs to shader uniform names
 */
export const TesseractParameterMap = {
  'fov': 'u_fov',
  'perspective': 'u_perspective', 
  'cameraZ': 'u_cameraZ'
};

/**
 * Button action mapping for TesseractShader
 * Maps button action names to shader method names
 */
export const TesseractActionMap = {
  'resetRotation': 'resetRotation',
  'toggleVelocityRX': function(shader) { return shader.toggleVelocity('rx'); },
  'toggleVelocityRY': function(shader) { return shader.toggleVelocity('ry'); },
  'toggleVelocityRW': function(shader) { return shader.toggleVelocity('rw'); },
  'toggleMotionControl': 'toggleMotionControl',
  'toggleTouchControl': 'toggleTouchControl',
  'toggleXAxisInvert': 'toggleXAxisInvert'
};

/**
 * Default shader parameter values
 * Used for initialization and reset functionality
 */
export const TesseractDefaults = {
  fov: 7.0,
  perspective: 2.3,
  cameraZ: 10.0,
  lineWidth: 0.02,
  
  // Rotation defaults
  rotation: {
    rx: 0,
    ry: 0, 
    rw: 0
  },
  
  // Velocity defaults
  velocityEnabled: {
    rx: true,
    ry: true,
    rw: true
  }
};

/**
 * Responsive button layout configuration
 * Defines how buttons are arranged on mobile vs desktop
 */
export const TesseractButtonLayout = {
  desktop: {
    rows: [
      ['stop-rx', 'stop-ry', 'stop-rw']
    ]
  },
  mobile: {
    rows: [
      ['stop-rx-mobile', 'stop-ry-mobile', 'stop-rw-mobile'],
      ['stop-motion', 'stop-touch', 'invert-x']
    ]
  }
};

/**
 * Advanced configuration for parameter smoothing
 * Defines different filter strengths for different parameter types
 */
export const TesseractSmoothingConfig = {
  default: 0.1,
  parameters: {
    'fov': 0.05,        // Slower smoothing for FOV changes
    'perspective': 0.1,  // Normal smoothing for perspective
    'cameraZ': 0.15      // Faster smoothing for camera position
  }
};

/**
 * Validation rules for parameters
 * Used by control panel to validate user input
 */
export const TesseractValidation = {
  fov: {
    min: 2,
    max: 120,
    step: 1,
    warningThreshold: { min: 5, max: 90 },
    errorMessage: "FOV must be between 2 and 120 degrees"
  },
  perspective: {
    min: 0.1,
    max: 10,
    step: 0.1,
    warningThreshold: { min: 0.5, max: 5 },
    errorMessage: "4D Scale must be between 0.1 and 10"
  },
  cameraZ: {
    min: -100,
    max: 50,
    step: 1,
    warningThreshold: { min: -20, max: 20 },
    errorMessage: "Camera Z must be between -100 and 50"
  }
};

/**
 * Helper function to register all parameters with a shader
 * @param {GenericShader} shader - The shader instance to register parameters with
 */
export function registerTesseractParameters(shader) {
  TesseractControlConfig.parameters.forEach(param => {
    shader.registerParameter(param.id, param.uniformName, param.default);
  });
  
  console.log('✅ Tesseract parameters registered with shader');
}

/**
 * Helper function to apply default values to shader
 * @param {GenericShader} shader - The shader instance to apply defaults to
 */
export function applyTesseractDefaults(shader) {
  // Apply parameter defaults
  Object.keys(TesseractDefaults).forEach(key => {
    if (key !== 'rotation' && key !== 'velocityEnabled' && shader.setParameter) {
      shader.setParameter(key, TesseractDefaults[key]);
    }
  });
  
  console.log('✅ Tesseract defaults applied to shader');
}

/**
 * Export everything as default for easy importing
 */
export default {
  config: TesseractControlConfig,
  parameterMap: TesseractParameterMap,
  actionMap: TesseractActionMap,
  defaults: TesseractDefaults,
  buttonLayout: TesseractButtonLayout,
  smoothing: TesseractSmoothingConfig,
  validation: TesseractValidation,
  registerParameters: registerTesseractParameters,
  applyDefaults: applyTesseractDefaults
};

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage:
 * import { TesseractControlConfig } from './controlConfig.js';
 * const renderer = new ControlPanelRenderer(shader, TesseractControlConfig);
 * 
 * // Full setup with helpers:
 * import TesseractConfig from './controlConfig.js';
 * TesseractConfig.registerParameters(shader);
 * TesseractConfig.applyDefaults(shader);
 * const renderer = new ControlPanelRenderer(shader, TesseractConfig.config);
 * 
 * // Advanced configuration:
 * import { TesseractSmoothingConfig, TesseractValidation } from './controlConfig.js';
 * // Use custom smoothing and validation rules
 */
