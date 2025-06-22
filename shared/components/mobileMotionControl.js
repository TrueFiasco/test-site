/**
 * Enhanced Mobile Motion Control System - MAGIC WINDOW (Phase 1)
 * NEW: Uses DeviceOrientationControls approach for 3D camera rotation (RX, RY, RZ)
 * ENHANCED: Integrates with 8-axis TesseractShader system
 * KEEPS: All existing permission and consent management
 */
class MobileMotionControl {
  constructor(tesseractShader) {
    this.tesseractShader = tesseractShader;
    this.isActive = false;
    this.isSupported = false;
    this.isPermissionGranted = false;
    this.isCalibrated = false;
    
    // NEW: DeviceOrientationControls-style orientation data
    this.orientationData = {
      alpha: 0,   // Z-axis (compass/yaw) → RZ
      beta: 0,    // X-axis (pitch) → RX  
      gamma: 0,   // Y-axis (roll) → RY
      calibration: { alpha: 0, beta: 0, gamma: 0 }
    };
    
    // NEW: Magic window configuration
    this.config = {
      // DeviceOrientationControls sensitivity
      sensitivity: {
        pitch: 0.012,    // Beta → RX sensitivity
        roll: 0.010,     // Gamma → RY sensitivity  
        yaw: 0.008       // Alpha → RZ sensitivity
      },
      deadzone: 2,         // Degrees of deadzone
      maxRotation: 1.5,    // Maximum rotation per frame
      smoothingFactor: 0.12, // Smoothing for magic window effect
      
      // Magic window coordinate mapping
      coordinateSystem: 'right-handed', // WebGL standard
      screenOrientation: 'portrait',    // Default orientation
      invertAxes: {
        pitch: true,     // Invert beta for natural camera movement
        roll: false,     // Direct gamma mapping
        yaw: false       // Direct alpha mapping
      }
    };
    
    // NEW: Smoothed orientation output for magic window
    this.smoothedOrientation = { rx: 0, ry: 0, rz: 0 };
    this.lastOrientation = { rx: 0, ry: 0, rz: 0 };
    
    // EXISTING: UI elements (unchanged)
    this.indicator = document.getElementById('motionIndicator');
    this.permissionPrompt = document.getElementById('motionPermissionPrompt');
    
    this.init();
  }
  
  async init() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;
    
    console.log('🎯 Initializing Enhanced Mobile Motion Control - Magic Window Mode');
    
    this.isSupported = 'DeviceOrientationEvent' in window;
    
    if (!this.isSupported) {
      console.log('❌ Device orientation not supported');
      return;
    }
    
    // UNCHANGED: Permission handling (existing system works great)
    const storedConsent = localStorage.getItem('motionControlConsent');
    const hasStoredConsent = storedConsent === 'granted';
    
    if (this.indicator) {
      this.indicator.style.display = 'flex';
      this.indicator.addEventListener('click', this.toggleMotionControl.bind(this));
    }
    
    if (hasStoredConsent) {
      console.log('✅ Found stored motion consent - enabling magic window mode');
      this.isPermissionGranted = true;
      this.startMagicWindowDetection();
      this.autoEnableMotionControl();
      return;
    }
    
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      console.log('📱 iOS device detected - showing permission prompt');
      this.showPermissionPrompt();
    } else {
      console.log('📱 Android device - enabling magic window mode with stored consent');
      this.isPermissionGranted = true;
      this.startMagicWindowDetection();
      this.autoEnableMotionControl();
      localStorage.setItem('motionControlConsent', 'granted');
    }
  }
  
  autoEnableMotionControl() {
    console.log('🎯 Starting auto-enable motion control process...');
    
    this.isActive = true;
    
    // NEW: Enable device orientation in enhanced shader
    if (this.tesseractShader && typeof this.tesseractShader.enableDeviceOrientation === 'function') {
      const result = this.tesseractShader.enableDeviceOrientation();
      console.log(`🪟 Magic Window auto-enabled via enhanced shader: ${result}`);
    } else if (this.tesseractShader && typeof this.tesseractShader.enableMotionControl === 'function') {
      // Fallback for compatibility
      const result = this.tesseractShader.enableMotionControl();
      console.log(`🪟 Magic Window auto-enabled via fallback method: ${result}`);
    } else {
      console.warn('⚠️ No shader methods available for enabling motion control');
    }
    
    // IMPORTANT: Set global variables for motion control logic
    if (typeof window !== 'undefined') {
      window.currentSection = window.currentSection || 0;
      window.tutorialOpen = window.tutorialOpen || false;
      console.log(`🌍 Global state set - Section: ${window.currentSection}, Tutorial: ${window.tutorialOpen}`);
    }
    
    // Auto-calibrate after brief delay
    setTimeout(() => {
      this.calibrateOrientation();
      console.log('🪟 Auto-calibration complete');
      
      // Double-check shader state after calibration
      if (this.tesseractShader) {
        console.log(`📊 Post-calibration shader state - DeviceOrientation: ${this.tesseractShader.deviceOrientationEnabled}`);
      }
    }, 1500);
    
    console.log('🎯 Magic Window motion control auto-enabled and ready');
  }
  
  // UNCHANGED: Permission methods (existing implementation is solid)
  showPermissionPrompt() {
    if (!this.permissionPrompt) return;
    
    const storedConsent = localStorage.getItem('motionControlConsent');
    if (storedConsent) return;
    
    setTimeout(() => {
      const currentSection = window.currentSection || 0;
      if (currentSection === 0 && !this.isActive) {
        this.permissionPrompt.classList.add('show');
      }
    }, 2000);
    
    const enableBtn = document.getElementById('enableMotionBtn');
    const declineBtn = document.getElementById('declineMotionBtn');
    
    if (enableBtn) {
      enableBtn.addEventListener('click', this.requestPermission.bind(this));
    }
    
    if (declineBtn) {
      declineBtn.addEventListener('click', this.declinePermission.bind(this));
    }
  }
  
  async requestPermission() {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      
      if (response === 'granted') {
        console.log('✅ Motion permission granted - enabling magic window');
        this.isPermissionGranted = true;
        
        localStorage.setItem('motionControlConsent', 'granted');
        
        this.startMagicWindowDetection();
        this.hidePermissionPrompt();
        this.autoEnableMotionControl();
      } else {
        console.log('❌ Motion permission denied');
        localStorage.setItem('motionControlConsent', 'denied');
        this.handlePermissionDenied();
      }
    } catch (error) {
      console.error('Motion permission request failed:', error);
      this.handlePermissionDenied();
    }
  }
  
  declinePermission() {
    console.log('👤 User declined motion control');
    localStorage.setItem('motionControlConsent', 'declined');
    this.hidePermissionPrompt();
  }
  
  hidePermissionPrompt() {
    if (this.permissionPrompt) {
      this.permissionPrompt.classList.remove('show');
    }
  }
  
  handlePermissionDenied() {
    this.hidePermissionPrompt();
    console.log('📱 Using touch controls as fallback');
  }
  
  // NEW: Magic Window Detection System
  startMagicWindowDetection() {
    if (!this.isPermissionGranted) return;
    
    console.log('🪟 Starting Magic Window detection system');
    window.addEventListener('deviceorientation', this.handleMagicWindowOrientation.bind(this));
    
    if (this.indicator) {
      this.indicator.style.opacity = '0.7';
    }
  }
  
  // NEW: Magic Window Calibration
  calibrateOrientation() {
    this.orientationData.calibration = {
      alpha: this.orientationData.alpha,
      beta: this.orientationData.beta,
      gamma: this.orientationData.gamma
    };
    
    this.isCalibrated = true;
    
    if (this.indicator) {
      this.indicator.classList.remove('calibrating');
      this.indicator.classList.add('active');
      this.indicator.title = 'Magic Window active - tap to toggle';
      
      // Visual feedback
      this.indicator.style.transform = 'scale(1.2)';
      setTimeout(() => {
        this.indicator.style.transform = 'scale(1)';
      }, 400);
    }
    
    // ADDED: Update control panel button when calibration completes
    if (window.enhancedControlPanel && typeof window.enhancedControlPanel.updateMotionControlButton === 'function') {
      setTimeout(() => {
        const motionButton = document.getElementById('motion-control-toggle');
        if (motionButton) {
          window.enhancedControlPanel.updateMotionControlButton(motionButton);
        }
      }, 100);
    }
    
    console.log('🪟 Magic Window calibrated and ready - motion should be active now');
  }
  
  toggleMotionControl() {
    // UNCHANGED: Permission checking logic
    const storedConsent = localStorage.getItem('motionControlConsent');
    if (!storedConsent || storedConsent === 'denied') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        this.showPermissionPrompt();
      }
      return;
    }
    
    if (!this.isSupported || !this.isPermissionGranted) return;
    
    this.isActive = !this.isActive;
    
    // NEW: Toggle enhanced shader orientation control
    if (this.tesseractShader) {
      if (typeof this.tesseractShader.toggleDeviceOrientationControl === 'function') {
        if (this.isActive) {
          this.tesseractShader.enableDeviceOrientation();
          console.log('🪟 Magic Window motion control ENABLED');
        } else {
          this.tesseractShader.disableDeviceOrientation();
          console.log('🪟 Magic Window motion control DISABLED');
        }
      } else if (typeof this.tesseractShader.toggleMotionControl === 'function') {
        // Fallback compatibility
        this.tesseractShader.toggleMotionControl();
      }
    }
    
    // Update UI
    if (this.indicator) {
      if (this.isActive) {
        this.indicator.classList.add('active');
        this.indicator.title = 'Magic Window active - tap to pause';
      } else {
        this.indicator.classList.remove('active');
        this.indicator.title = 'Magic Window paused - tap to resume';
      }
    }
    
    // Update control panel button if it exists
    if (window.enhancedControlPanel && typeof window.enhancedControlPanel.updateMotionControlButton === 'function') {
      setTimeout(() => window.enhancedControlPanel.updateMotionControlButton(), 100);
    }
    
    // ADDED: Force update control panel button state
    this.updateControlPanelButton();
  }
  
  /**
   * ADDED: Helper method to update control panel button state
   */
  updateControlPanelButton() {
    setTimeout(() => {
      const motionButton = document.getElementById('motion-control-toggle');
      if (motionButton && window.controlPanelRenderer) {
        window.controlPanelRenderer.updateMotionControlButton(motionButton);
        console.log('🎛️ Forced motion control button update');
      }
    }, 500);
  }
  
  // NEW: MAGIC WINDOW ORIENTATION HANDLER
  handleMagicWindowOrientation(event) {
    const currentSection = window.currentSection || 0;
    if (currentSection !== 0 || !this.isActive || !this.isCalibrated) {
      return;
    }
    
    // Get raw orientation data
    this.orientationData.alpha = event.alpha || 0;  // Compass (Z-axis)
    this.orientationData.beta = event.beta || 0;    // Pitch (X-axis)
    this.orientationData.gamma = event.gamma || 0;   // Roll (Y-axis)
    
    // Calculate deltas from calibration point
    const deltaAlpha = this.normalizeAngle(this.orientationData.alpha - this.orientationData.calibration.alpha);
    const deltaBeta = this.orientationData.beta - this.orientationData.calibration.beta;
    const deltaGamma = this.orientationData.gamma - this.orientationData.calibration.gamma;
    
    // Apply deadzone filtering
    const processedAlpha = Math.abs(deltaAlpha) > this.config.deadzone ? deltaAlpha : 0;
    const processedBeta = Math.abs(deltaBeta) > this.config.deadzone ? deltaBeta : 0;
    const processedGamma = Math.abs(deltaGamma) > this.config.deadzone ? deltaGamma : 0;
    
    // NEW: DeviceOrientationControls-style transformation
    const targetOrientation = this.calculateMagicWindowRotation(
      processedAlpha, processedBeta, processedGamma
    );
    
    // Apply smoothing for smooth magic window effect
    this.smoothedOrientation.rx = this.lerp(
      this.smoothedOrientation.rx, 
      targetOrientation.rx, 
      1 - this.config.smoothingFactor
    );
    this.smoothedOrientation.ry = this.lerp(
      this.smoothedOrientation.ry, 
      targetOrientation.ry, 
      1 - this.config.smoothingFactor
    );
    this.smoothedOrientation.rz = this.lerp(
      this.smoothedOrientation.rz, 
      targetOrientation.rz, 
      1 - this.config.smoothingFactor
    );
    
    this.applyMagicWindowToShader();
  }
  
  // NEW: Magic Window Rotation Calculation (DeviceOrientationControls approach)
  calculateMagicWindowRotation(alpha, beta, gamma) {
    // Convert device orientation to camera rotation for "looking through glass" effect
    
    let rx = beta * this.config.sensitivity.pitch;   // Pitch: beta → RX
    let ry = gamma * this.config.sensitivity.roll;   // Roll: gamma → RY
    let rz = alpha * this.config.sensitivity.yaw;    // Yaw: alpha → RZ
    
    // Apply axis inversions for natural camera movement
    if (this.config.invertAxes.pitch) rx = -rx;
    if (this.config.invertAxes.roll) ry = -ry;
    if (this.config.invertAxes.yaw) rz = -rz;
    
    // Clamp to maximum rotation per frame
    rx = this.clamp(rx, -this.config.maxRotation, this.config.maxRotation);
    ry = this.clamp(ry, -this.config.maxRotation, this.config.maxRotation);
    rz = this.clamp(rz, -this.config.maxRotation, this.config.maxRotation);
    
    return { rx, ry, rz };
  }
  
  // NEW: Apply magic window transformation to enhanced shader
  applyMagicWindowToShader() {
    if (!this.tesseractShader) return;
    
    // NEW: Use enhanced shader's device orientation input method
    if (typeof this.tesseractShader.updateDeviceOrientationInput === 'function') {
      this.tesseractShader.updateDeviceOrientationInput({
        rx: this.smoothedOrientation.rx * 0.02,  // Scale for smooth rotation
        ry: this.smoothedOrientation.ry * 0.02,
        rz: this.smoothedOrientation.rz * 0.02
      });
    } else if (typeof this.tesseractShader.updateMotionInput === 'function') {
      // Fallback for compatibility with old shader
      console.warn('Using fallback motion control - enhanced shader not detected');
      this.tesseractShader.updateMotionInput({
        x: this.smoothedOrientation.rx * 0.015,
        y: this.smoothedOrientation.ry * 0.015,
        w: this.smoothedOrientation.rz * 0.01
      });
    }
  }
  
  // UTILITY METHODS (unchanged)
  normalizeAngle(angle) {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }
  
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  
  lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  // UNCHANGED: State management methods
  disable() {
    this.isActive = false;
    
    if (this.tesseractShader && typeof this.tesseractShader.disableDeviceOrientation === 'function') {
      this.tesseractShader.disableDeviceOrientation();
    } else if (this.tesseractShader && typeof this.tesseractShader.disableMotionControl === 'function') {
      this.tesseractShader.disableMotionControl();
    }
    
    if (this.indicator) {
      this.indicator.classList.remove('active');
      this.indicator.style.opacity = '0.4';
    }
  }
  
  enable() {
    if (this.isSupported && this.isPermissionGranted) {
      const currentSection = window.currentSection || 0;
      if (currentSection === 0 && this.indicator) {
        this.indicator.style.opacity = '0.7';
      }
    }
  }
  
  destroy() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;
    
    window.removeEventListener('deviceorientation', this.handleMagicWindowOrientation);
    
    if (this.indicator) {
      this.indicator.removeEventListener('click', this.toggleMotionControl);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileMotionControl;
} else if (typeof window !== 'undefined') {
  window.MobileMotionControl = MobileMotionControl;
}

/**
 * 🪟 MAGIC WINDOW IMPLEMENTATION COMPLETE!
 * 
 * Key Changes:
 * 1. ✅ Uses DeviceOrientationControls approach for smooth 3D camera rotation
 * 2. ✅ Maps device orientation to RX, RY, RZ camera axes (not hypercube rotation)
 * 3. ✅ Integrates with enhanced TesseractShader's 8-axis system
 * 4. ✅ Keeps all existing permission and consent management
 * 5. ✅ Maintains compatibility with existing control panel
 * 
 * Magic Window Effect:
 * - Phone tilt forward/back → Camera pitch (look down into box)
 * - Phone tilt left/right → Camera roll (box tilts sideways)
 * - Phone rotate around vertical → Camera yaw (rotate around box)
 * - Touch gestures → Separate 4D hypercube rotations (RWX, RWY)
 * 
 * Next: Update control config for new button mappings!
 */
