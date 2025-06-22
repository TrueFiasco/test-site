/**
 * Backwards-Compatible TesseractShader - Desktop Unchanged + Mobile Enhanced
 * PRESERVES: 100% desktop behavior (mouse XY → RX,RY, wheel → RWY)
 * ADDS: Mobile magic window (device orientation → camera) + separated touch (RWX, RWY)
 */
class TesseractShader extends GenericShader {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // UNCHANGED: Original desktop interaction state
    this.mousePos = { x: 0, y: 0 };
    this.normalizedMouse = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.slowVelocity = { x: 0, y: 0 };
    this.maxSlowVelocity = 0.25;
    
    // CORRECTED: Original angles system + mobile extensions
    this.angles = {
      // UNCHANGED: Original desktop hypercube rotations
      rx: 0,   // X-axis hypercube rotation ← mouse Y
      ry: 0,   // Y-axis hypercube rotation ← mouse X
      rwy: 0,  // W-Y plane 4D rotation ← mouse wheel (was "rw")
      
      // NEW: Mobile camera perspective (magic window)
      cameraRx: 0,  // Camera pitch ← device beta
      cameraRy: 0,  // Camera roll ← device gamma  
      cameraRz: 0,  // Camera yaw ← device alpha
      
      // NEW: Mobile 4D touch rotation
      rwx: 0   // W-X plane 4D rotation ← horizontal touch (NEW)
    };
    
    // UNCHANGED: Original desktop velocity system
    this.wheelVelocity = 0;
    
    // ENHANCED: Velocity control for all axes (desktop + mobile)
    this.velocityEnabled = {
      // Original desktop controls
      rx: true, ry: true, rwy: true,
      // New mobile controls  
      cameraRx: true, cameraRy: true, cameraRz: true,
      rwx: true
    };
    
    // NEW: Mobile-specific state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.deviceOrientationEnabled = false;
    this.touchGestureEnabled = true;
    
    // NEW: Input source tracking
    this.rotationSource = this.isMobile ? 'combined' : 'mouse';
    this.deviceOrientationInput = { rx: 0, ry: 0, rz: 0 };
    this.touchInput = { rwx: 0, rwy: 0 };
    
    // Mobile control options
    this.xAxisInverted = false;
    
    // Animation state
    this.animationId = null;
    
    // Auto-register parameters
    this.registerTesseractParameters();
    
    console.log('🎯 Backwards-Compatible TesseractShader - Desktop safe + Mobile enhanced');
  }

  /**
   * Auto-register parameters from TesseractControlConfig
   */
  registerTesseractParameters() {
    // Import and register parameters if TesseractControlConfig is available
    if (typeof window !== 'undefined' && window.TesseractControlConfig) {
      const config = window.TesseractControlConfig;
      config.parameters.forEach(param => {
        this.registerParameter(param.id, param.uniformName, param.default);
      });
      console.log('✅ Auto-registered Tesseract parameters from config');
    } else {
      // Fallback manual registration
      this.registerParameter('fov', 'u_fov', 7.0);
      this.registerParameter('perspective', 'u_perspective', 2.3);
      this.registerParameter('cameraZ', 'u_cameraZ', 10.0);
      console.log('✅ Fallback parameter registration complete');
    }
  }

  /**
   * BACKWARDS-COMPATIBLE: Shader code that works for both desktop and mobile
   */
  getShaderCode() {
    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform sampler2D u_vertices;
      uniform sampler2D u_textTexture;
      
      // UNCHANGED: Original uniform for desktop compatibility
      uniform vec3 u_rotation;        // RX, RY, RWY (original system)
      
      // NEW: Mobile-only uniforms (only used on mobile)
      uniform vec3 u_cameraRotation;  // Camera RX, RY, RZ (magic window)
      uniform float u_rwxRotation;    // RWX 4D rotation (horizontal touch)
      uniform bool u_isMobile;        // Platform detection
      
      uniform float u_lineWidth;
      uniform float u_fov;
      uniform float u_perspective;
      uniform float u_cameraZ;
      
      // UNCHANGED: Original 3D rotation matrices
      mat4 rotateX(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, -s, 0.0, 0.0, s, c, 0.0, 0.0, 0.0, 0.0, 1.0);
      }
      
      mat4 rotateY(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(c, 0.0, s, 0.0, 0.0, 1.0, 0.0, 0.0, -s, 0.0, c, 0.0, 0.0, 0.0, 0.0, 1.0);
      }
      
      mat4 rotateZ(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(c, -s, 0.0, 0.0, s, c, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
      }
      
      // UNCHANGED: Original RWY 4D rotation (mouse wheel)
      mat4 rotateWY(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c);
      }
      
      // NEW: RWX 4D rotation (horizontal touch)
      mat4 rotateWX(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(c, 0.0, 0.0, -s, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, s, 0.0, 0.0, c);
      }
      
      float distanceToLineSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a; vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }
      
      vec2 project4DTo2D(vec4 point4D) {
        vec3 pos3D = point4D.xyz * (point4D.w + u_perspective);
        vec3 camPos = vec3(0.0, 0.0, u_cameraZ);
        vec3 relPos = pos3D - camPos;
        float f = 1.0 / tan(radians(u_fov) * 0.5);
        vec2 projected = vec2(f * relPos.x / relPos.z, f * relPos.y / relPos.z);
        return projected * 0.1;
      }
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 screenSt = st;
        st = (st - 0.5) * 2.0;
        st.x *= u_resolution.x / u_resolution.y;
        
        vec4 textSample = texture2D(u_textTexture, screenSt);
        float textMask = textSample.r;
        
        mat4 finalRotation;
        
        if (u_isMobile) {
          // MOBILE: Enhanced system with camera + hypercube separation
          
          // 1. Apply 4D rotations to hypercube
          mat4 hypercube4D = rotateWX(u_rwxRotation) *           // RWX ← horizontal touch
                            rotateWY(u_rotation.z) *            // RWY ← vertical touch/wheel
                            rotateY(u_rotation.y) *             // RY ← (mobile: touch legacy)
                            rotateX(u_rotation.x);              // RX ← (mobile: touch legacy)
          
          // 2. Apply 3D camera rotation (magic window)
          mat4 camera3D = rotateZ(u_cameraRotation.z) *         // Camera yaw ← alpha
                         rotateY(u_cameraRotation.y) *         // Camera roll ← gamma
                         rotateX(u_cameraRotation.x);          // Camera pitch ← beta
          
          // 3. Combine: camera perspective + hypercube
          finalRotation = camera3D * hypercube4D;
          
        } else {
          // DESKTOP: Original system unchanged
          finalRotation = rotateWY(u_rotation.z) *              // RWY ← mouse wheel
                         rotateY(u_rotation.y) *               // RY ← mouse X
                         rotateX(u_rotation.x);                // RX ← mouse Y
        }
        
        float minDist = 1000.0;
        
        for (int i = 0; i < 32; i++) {
          vec4 vertex1 = texture2D(u_vertices, vec2((float(i) + 0.5) / 33.0, 0.5));
          vec4 vertex2 = texture2D(u_vertices, vec2((float(i + 1) + 0.5) / 33.0, 0.5));
          
          vertex1 = finalRotation * vertex1;
          vertex2 = finalRotation * vertex2;
          
          vec2 p1 = project4DTo2D(vertex1);
          vec2 p2 = project4DTo2D(vertex2);
          
          float dist = distanceToLineSegment(st, p1, p2);
          minDist = min(minDist, dist);
        }
        
        float intensity = smoothstep(0.0, u_lineWidth, minDist);
        
        vec3 lineColor = vec3(0.2, 0.8, 1.0);
        vec3 glowColor = vec3(0.6, 0.3, 1.0);
        vec3 bgColor = vec3(0.05, 0.05, 0.15);
        
        vec3 color = mix(lineColor, bgColor, intensity);
        float glow = exp(-minDist * 30.0) * 0.5;
        color += glow * glowColor;
        
        if (textMask > 0.1) {
          float textGlow = exp(-minDist * 20.0) * 2.0;
          vec3 textGlowColor = vec3(1.0, 0.8, 0.2);
          color += textGlow * textGlowColor * textMask;
          
          if (minDist < u_lineWidth * 2.0) {
            vec3 textLineColor = vec3(1.0, 0.9, 0.3);
            float textInfluence = (1.0 - minDist / (u_lineWidth * 2.0)) * textMask;
            color = mix(color, textLineColor, textInfluence * 0.7);
          }
          
          float sparkleFreq = 15.0;
          float sparkle = sin(st.x * sparkleFreq + u_time * 3.0) * sin(st.y * sparkleFreq + u_time * 2.5);
          sparkle = pow(max(sparkle, 0.0), 3.0);
          color += sparkle * 0.3 * textMask * vec3(1.0, 0.8, 0.4);
        }
        
        float pulse = sin(u_time * 2.0) * 0.5 + 0.5;
        if (minDist < u_lineWidth * 0.5) {
          float pulseMult = textMask > 0.1 ? 0.6 : 0.3;
          color = mix(color, vec3(1.0), pulse * pulseMult);
        }
        
        float sparkle = sin(st.x * 20.0 + u_time) * sin(st.y * 20.0 + u_time * 1.1);
        color += sparkle * 0.05 * (1.0 - intensity) * (1.0 - textMask);
        
        gl_FragColor = vec4(color, 0.8);
      }
    `;

    return { vertexShader, fragmentShader };
  }

  /**
   * BACKWARDS-COMPATIBLE: Initialize with both original and new uniforms
   */
  async initHypercube() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      throw new Error(`Canvas with ID "${this.canvasId}" not found`);
    }

    // Scene setup (unchanged)
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: false 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Create vertex and text textures (unchanged)
    const vertexData = this.createVertexData();
    const vertexTexture = new THREE.DataTexture(
      vertexData, 33, 1, THREE.RGBAFormat, THREE.FloatType
    );
    vertexTexture.needsUpdate = true;
    
    const textTexture = await this.createTesseractTextTexture();
    
    // BACKWARDS-COMPATIBLE: Uniforms that work for both desktop and mobile
    const { vertexShader, fragmentShader } = this.getShaderCode();
    
    this.uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_vertices: { value: vertexTexture },
      u_textTexture: { value: textTexture },
      
      // UNCHANGED: Original uniform (desktop compatibility)
      u_rotation: { value: new THREE.Vector3(0, 0, 0) },  // RX, RY, RWY
      
      // NEW: Mobile-only uniforms
      u_cameraRotation: { value: new THREE.Vector3(0, 0, 0) },  // Camera RX, RY, RZ
      u_rwxRotation: { value: 0.0 },                            // RWX 4D rotation
      u_isMobile: { value: this.isMobile },                     // Platform detection
      
      u_lineWidth: { value: 0.02 },
      u_fov: { value: 7.0 },
      u_perspective: { value: 2.3 },
      u_cameraZ: { value: 10.0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(plane, material);
    this.scene.add(mesh);
  }

  // ==========================================
  // MOBILE ENHANCEMENTS (New Methods)
  // ==========================================

  enableDeviceOrientation() {
    if (!this.isMobile || !this.canUseMotion()) {
      console.log('📱 Device orientation not available');
      return false;
    }
    
    this.deviceOrientationEnabled = true;
    this.rotationSource = 'combined';
    console.log('🪟 Magic Window device orientation enabled');
    return true;
  }

  disableDeviceOrientation() {
    this.deviceOrientationEnabled = false;
    this.rotationSource = this.isMobile ? 'touch' : 'mouse';
    this.deviceOrientationInput = { rx: 0, ry: 0, rz: 0 };
    console.log('🪟 Magic Window device orientation disabled');
  }

  updateDeviceOrientationInput(input) {
    if (!this.deviceOrientationEnabled) return;
    
    this.deviceOrientationInput.rx = input.rx || 0;
    this.deviceOrientationInput.ry = input.ry || 0;
    this.deviceOrientationInput.rz = input.rz || 0;
  }

  updateTouchGestureInput(input) {
    if (!this.touchGestureEnabled) return;
    
    this.touchInput.rwx = input.rwx || 0;
    this.touchInput.rwy = input.rwy || 0;
  }

  toggleVelocity(axis) {
    if (!this.velocityEnabled) {
      this.velocityEnabled = {};
    }
    
    if (this.velocityEnabled[axis] === undefined) {
      this.velocityEnabled[axis] = true;
    }
    
    this.velocityEnabled[axis] = !this.velocityEnabled[axis];
    
    // Stop velocity when disabled
    if (!this.velocityEnabled[axis]) {
      switch(axis) {
        case 'rx': 
          this.velocity.x = 0;
          this.deviceOrientationInput.rx = 0;
          break;
        case 'ry': 
          this.velocity.y = 0;
          this.deviceOrientationInput.ry = 0;
          break;
        case 'rwy': 
          this.wheelVelocity = 0;
          this.touchInput.rwy = 0;
          break;
        case 'cameraRx': this.deviceOrientationInput.rx = 0; break;
        case 'cameraRy': this.deviceOrientationInput.ry = 0; break;
        case 'cameraRz': this.deviceOrientationInput.rz = 0; break;
        case 'rwx': this.touchInput.rwx = 0; break;
      }
    }
    
    console.log(`🎛️ ${axis.toUpperCase()} velocity ${this.velocityEnabled[axis] ? 'enabled' : 'disabled'}`);
    return this.velocityEnabled[axis];
  }

  // ==========================================
  // BACKWARDS-COMPATIBLE: Animation Loop
  // ==========================================

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    if (!this.uniforms) return;
    
    this.uniforms.u_time.value += 0.016;
    
    if (this.isMobile) {
      // MOBILE: Enhanced system
      this.applyMobileControls();
    } else {
      // DESKTOP: Original system unchanged
      this.applyDesktopControls();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * NEW: Mobile control application
   */
  applyMobileControls() {
    // Apply device orientation to camera (magic window)
    if (this.deviceOrientationEnabled) {
      if (this.isVelocityEnabled('cameraRx')) {
        this.angles.cameraRx += this.deviceOrientationInput.rx;
      }
      if (this.isVelocityEnabled('cameraRy')) {
        this.angles.cameraRy += this.deviceOrientationInput.ry;
      }
      if (this.isVelocityEnabled('cameraRz')) {
        this.angles.cameraRz += this.deviceOrientationInput.rz;
      }
      
      // Damping
      this.deviceOrientationInput.rx *= 0.95;
      this.deviceOrientationInput.ry *= 0.95;
      this.deviceOrientationInput.rz *= 0.95;
    }
    
    // Apply touch gestures to 4D hypercube
    if (this.touchGestureEnabled) {
      if (this.isVelocityEnabled('rwx')) {
        this.angles.rwx += this.touchInput.rwx;
      }
      if (this.isVelocityEnabled('rwy')) {
        this.angles.rwy += this.touchInput.rwy;
      }
      
      // Damping
      this.touchInput.rwx *= 0.90;
      this.touchInput.rwy *= 0.90;
    }
    
    // Apply desktop-style controls when available (legacy support)
    if (this.isVelocityEnabled('rx')) {
      this.angles.rx += this.velocity.x;
    }
    if (this.isVelocityEnabled('ry')) {
      this.angles.ry += this.velocity.y;
    }
    if (this.isVelocityEnabled('rwy')) {
      this.angles.rwy += this.wheelVelocity;
    }
    
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.wheelVelocity *= 0.96;
    
    // Update mobile uniforms
    this.uniforms.u_rotation.value.x = this.angles.rx;
    this.uniforms.u_rotation.value.y = this.angles.ry;
    this.uniforms.u_rotation.value.z = this.angles.rwy;
    
    this.uniforms.u_cameraRotation.value.x = this.angles.cameraRx;
    this.uniforms.u_cameraRotation.value.y = this.angles.cameraRy;
    this.uniforms.u_cameraRotation.value.z = this.angles.cameraRz;
    
    this.uniforms.u_rwxRotation.value = this.angles.rwx;
  }

  /**
   * UNCHANGED: Desktop control application (original behavior)
   */
  applyDesktopControls() {
    // Apply rotations only if velocity enabled
    if (this.isVelocityEnabled('rx')) {
      this.angles.rx += this.velocity.x;
    }
    if (this.isVelocityEnabled('ry')) {
      this.angles.ry += this.velocity.y;
    }
    if (this.isVelocityEnabled('rwy')) {
      this.angles.rwy += this.wheelVelocity;
    }
    
    // Apply damping
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.wheelVelocity *= 0.96;
    
    // Calculate slow velocity targets
    const targetSlowVelX = this.isVelocityEnabled('rx') ? this.normalizedMouse.y * 0.0125 : 0;
    const targetSlowVelY = this.isVelocityEnabled('ry') ? this.normalizedMouse.x * 0.0125 : 0;
    
    this.slowVelocity.x += (targetSlowVelX - this.slowVelocity.x) * 0.1;
    this.slowVelocity.y += (targetSlowVelY - this.slowVelocity.y) * 0.1;
    
    const slowSpeed = Math.sqrt(this.slowVelocity.x * this.slowVelocity.x + this.slowVelocity.y * this.slowVelocity.y);
    if (slowSpeed > this.maxSlowVelocity) {
      this.slowVelocity.x = (this.slowVelocity.x / slowSpeed) * this.maxSlowVelocity;
      this.slowVelocity.y = (this.slowVelocity.y / slowSpeed) * this.maxSlowVelocity;
    }
    
    this.angles.rx += this.slowVelocity.x;
    this.angles.ry += this.slowVelocity.y;
    
    // Update original uniforms only
    this.uniforms.u_rotation.value.x = this.angles.rx;
    this.uniforms.u_rotation.value.y = this.angles.ry;
    this.uniforms.u_rotation.value.z = this.angles.rwy;
  }

  /**
   * ENHANCED: Reset all rotations (both desktop and mobile)
   */
  resetRotation() {
    // Reset original desktop angles
    this.angles.rx = 0;
    this.angles.ry = 0;
    this.angles.rwy = 0;
    
    // Reset mobile camera angles
    this.angles.cameraRx = 0;
    this.angles.cameraRy = 0;
    this.angles.cameraRz = 0;
    this.angles.rwx = 0;
    
    // Reset all input sources
    this.velocity.x = 0; this.velocity.y = 0;
    this.slowVelocity.x = 0; this.slowVelocity.y = 0;
    this.wheelVelocity = 0;
    this.deviceOrientationInput = { rx: 0, ry: 0, rz: 0 };
    this.touchInput = { rwx: 0, rwy: 0 };
    
    console.log('🔄 All rotations reset to zero');
  }

  resetAll() {
    this.resetRotation();
    
    // Reset parameters
    this.setParameter('fov', 7.0);
    this.setParameter('perspective', 2.3);
    this.setParameter('cameraZ', 10.0);
    
    // Reset velocity states
    this.velocityEnabled = {
      rx: true, ry: true, rwy: true,
      cameraRx: true, cameraRy: true, cameraRz: true,
      rwx: true
    };
    
    this.xAxisInverted = false;
    
    console.log('🔄 All parameters reset');
  }

  // ==========================================
  // MOBILE TOUCH EVENTS (Enhanced)
  // ==========================================

  onTouchStart(event) {
    if (this.isTouchOnButton(event)) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    console.log('Touch start for separated 4D gestures');
  }

  onTouchMove(event) {
    if (this.isTouchOnButton(event)) return;
    if (!this.touchGestureEnabled) return;
    
    event.preventDefault();
    if (!this.getTutorialState()) {
      const touch = event.touches[0];
      
      // Calculate separate horizontal and vertical deltas
      const deltaX = (touch.clientX - this.touchStartX) / window.innerWidth;
      const deltaY = (touch.clientY - this.touchStartY) / window.innerHeight;
      
      // NEW: Separated 4D gesture mapping
      this.touchInput.rwx += deltaX * 0.15;  // Horizontal → RWX (NEW 4D)
      this.touchInput.rwy += deltaY * 0.15;  // Vertical → RWY (same as wheel)
      
      // Update start position for continuous gesture
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
    }
  }

  onTouchEnd(event) {
    if (this.isTouchOnButton(event)) return;
    
    event.preventDefault();
    console.log('Touch end for separated 4D gestures');
  }

  // ==========================================
  // COMPATIBILITY METHODS
  // ==========================================

  enableMotionControl() {
    return this.enableDeviceOrientation();
  }

  disableMotionControl() {
    this.disableDeviceOrientation();
  }

  toggleMotionControl() {
    if (this.deviceOrientationEnabled) {
      this.disableDeviceOrientation();
      return false;
    } else {
      return this.enableDeviceOrientation();
    }
  }

  toggleTouchControl() {
    this.touchGestureEnabled = !this.touchGestureEnabled;
    
    if (!this.touchGestureEnabled) {
      this.touchInput = { rwx: 0, rwy: 0 };
    }
    
    console.log(`🎯 Touch gesture control: ${this.touchGestureEnabled ? 'enabled' : 'disabled'}`);
    return this.touchGestureEnabled;
  }

  updateMotionInput(input) {
    // Convert old motion input to new system
    this.updateDeviceOrientationInput({
      rx: input.x || 0,
      ry: input.y || 0,
      rz: input.w || 0
    });
  }

  isMotionControlActive() {
    return this.deviceOrientationEnabled;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TesseractShader;
} else if (typeof window !== 'undefined') {
  window.TesseractShader = TesseractShader;
}

console.log('✅ Backwards-Compatible TesseractShader ready - Desktop safe!');
