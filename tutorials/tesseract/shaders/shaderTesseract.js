/**
 * Enhanced TesseractShader - 8-Axis Mobile System (Phase 1)
 * NEW: Adds RWX and RZ rotations + DeviceOrientationControls integration
 * KEEPS: Desktop functionality completely unchanged
 */
class TesseractShader extends GenericShader {
  constructor(canvasId, options = {}) {
    super(canvasId, options);
    
    // EXISTING: Desktop/general interaction state
    this.mousePos = { x: 0, y: 0 };
    this.normalizedMouse = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.slowVelocity = { x: 0, y: 0 };
    this.wheelVelocity = 0;
    this.maxSlowVelocity = 0.25;
    
    // ENHANCED: 8-axis rotation system for mobile
    this.angles = {
      // 3D Camera Rotation (DeviceOrientation → Magic Window)
      rx: 0,  // X-axis rotation (pitch) ← beta
      ry: 0,  // Y-axis rotation (roll) ← gamma  
      rz: 0,  // Z-axis rotation (yaw) ← alpha
      
      // 4D Hypercube Rotations (Touch Gestures)
      rwx: 0, // W-X plane rotation ← horizontal touch
      rwy: 0, // W-Y plane rotation ← vertical touch (existing, enhanced)
      
      // Legacy desktop 4D rotation (wheel)
      rw: 0   // Kept for desktop compatibility
    };
    
    // ENHANCED: Velocity control for all 8 axes
    this.velocityEnabled = {
      // 3D camera controls
      rx: true, ry: true, rz: true,
      // 4D hypercube controls  
      rwx: true, rwy: true, rw: true
    };
    
    // NEW: Mobile-specific state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.deviceOrientationEnabled = false;
    this.touchGestureEnabled = true;
    
    // NEW: Motion control integration
    this.rotationSource = 'mouse'; // 'mouse', 'motion', or 'combined'
    this.deviceOrientationInput = { rx: 0, ry: 0, rz: 0 };
    this.touchInput = { rwx: 0, rwy: 0 };
    
    // Mobile control options
    this.xAxisInverted = false;
    
    // Animation state
    this.animationId = null;
    
    // Auto-register parameters
    this.registerTesseractParameters();
    
    console.log('🎯 Enhanced TesseractShader - 8-axis mobile system ready!');
  }

  /**
   * ENHANCED: Get shader code with new 4D rotation matrices
   */
  getShaderCode() {
    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform sampler2D u_vertices;
      uniform sampler2D u_textTexture;
      
      // ENHANCED: All rotation uniforms for 8-axis system
      uniform vec3 u_rotation3D;    // RX, RY, RZ (camera orientation)
      uniform vec3 u_rotation4D;    // RWX, RWY, RW (hypercube 4D rotations)
      
      uniform float u_lineWidth;
      uniform float u_fov;
      uniform float u_perspective;
      uniform float u_cameraZ;
      
      // EXISTING: 3D rotation matrices (camera)
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
      
      // EXISTING: Legacy 4D rotation (desktop wheel)
      mat4 rotateWY(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c);
      }
      
      // NEW: 4D rotation matrices for mobile touch
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
        
        // ENHANCED: Combined transformation order
        // 1. Apply 4D rotations to hypercube (touch gestures)
        mat4 hypercube4D = rotateWX(u_rotation4D.x) *  // RWX ← horizontal touch
                          rotateWY(u_rotation4D.y) *  // RWY ← vertical touch  
                          rotateWY(u_rotation4D.z);   // RW ← desktop wheel
        
        // 2. Apply 3D camera rotation (device orientation) 
        mat4 camera3D = rotateZ(u_rotation3D.z) *     // RZ ← alpha (yaw)
                       rotateY(u_rotation3D.y) *     // RY ← gamma (roll)
                       rotateX(u_rotation3D.x);      // RX ← beta (pitch)
        
        // 3. Combine for final transformation
        mat4 finalRotation = camera3D * hypercube4D;
        
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
   * ENHANCED: Initialize with new uniform system
   */
  async initHypercube() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      throw new Error(`Canvas with ID "${this.canvasId}" not found`);
    }

    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: false 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Create vertex and text textures
    const vertexData = this.createVertexData();
    const vertexTexture = new THREE.DataTexture(
      vertexData, 33, 1, THREE.RGBAFormat, THREE.FloatType
    );
    vertexTexture.needsUpdate = true;
    
    const textTexture = await this.createTesseractTextTexture();
    
    // ENHANCED: New uniform system for 8-axis control
    const { vertexShader, fragmentShader } = this.getShaderCode();
    
    this.uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_vertices: { value: vertexTexture },
      u_textTexture: { value: textTexture },
      
      // NEW: Separated 3D camera and 4D hypercube rotations
      u_rotation3D: { value: new THREE.Vector3(0, 0, 0) },  // RX, RY, RZ
      u_rotation4D: { value: new THREE.Vector3(0, 0, 0) },  // RWX, RWY, RW
      
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
  // NEW: 8-AXIS CONTROL METHODS
  // ==========================================

  /**
   * NEW: Enable device orientation for 3D camera rotation
   */
  enableDeviceOrientation() {
    if (!this.canUseMotion()) {
      console.log('📱 Device orientation not available or not consented');
      return false;
    }
    
    this.deviceOrientationEnabled = true;
    this.rotationSource = 'combined'; // Both touch and orientation
    console.log('🎯 Device orientation enabled for 3D camera rotation');
    return true;
  }

  /**
   * NEW: Disable device orientation
   */
  disableDeviceOrientation() {
    this.deviceOrientationEnabled = false;
    this.rotationSource = 'touch';
    this.deviceOrientationInput = { rx: 0, ry: 0, rz: 0 };
    console.log('🎯 Device orientation disabled');
  }

  /**
   * NEW: Update device orientation input (called from mobileMotionControl)
   */
  updateDeviceOrientationInput(input) {
    if (!this.deviceOrientationEnabled) return;
    
    this.deviceOrientationInput.rx = input.rx || 0;
    this.deviceOrientationInput.ry = input.ry || 0;
    this.deviceOrientationInput.rz = input.rz || 0;
  }

  /**
   * NEW: Update touch gesture input
   */
  updateTouchGestureInput(input) {
    if (!this.touchGestureEnabled) return;
    
    this.touchInput.rwx = input.rwx || 0;
    this.touchInput.rwy = input.rwy || 0;
  }

  /**
   * NEW: Toggle specific axis velocity (enhanced for 8-axis)
   */
  toggleVelocity(axis) {
    if (!this.velocityEnabled) {
      this.velocityEnabled = {};
    }
    
    // Initialize as enabled by default
    if (this.velocityEnabled[axis] === undefined) {
      this.velocityEnabled[axis] = true;
    }
    
    this.velocityEnabled[axis] = !this.velocityEnabled[axis];
    
    // Stop velocity when disabled
    if (!this.velocityEnabled[axis]) {
      switch(axis) {
        case 'rx': this.deviceOrientationInput.rx = 0; break;
        case 'ry': this.deviceOrientationInput.ry = 0; break;
        case 'rz': this.deviceOrientationInput.rz = 0; break;
        case 'rwx': this.touchInput.rwx = 0; break;
        case 'rwy': this.touchInput.rwy = 0; break;
        case 'rw': this.wheelVelocity = 0; break;
      }
    }
    
    console.log(`🎛️ ${axis.toUpperCase()} velocity ${this.velocityEnabled[axis] ? 'enabled' : 'disabled'}`);
    return this.velocityEnabled[axis];
  }

  // ==========================================
  // ENHANCED: ANIMATION LOOP
  // ==========================================

  /**
   * ENHANCED: Animation loop with 8-axis integration
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    if (!this.uniforms) return;
    
    this.uniforms.u_time.value += 0.016;
    
    // Apply rotations based on input source and enabled axes
    this.applyDeviceOrientationRotation();
    this.applyTouchGestureRotation();
    this.applyDesktopRotation(); // Keep desktop unchanged
    
    // Update shader uniforms
    this.uniforms.u_rotation3D.value.x = this.angles.rx;  // Camera RX
    this.uniforms.u_rotation3D.value.y = this.angles.ry;  // Camera RY  
    this.uniforms.u_rotation3D.value.z = this.angles.rz;  // Camera RZ
    
    this.uniforms.u_rotation4D.value.x = this.angles.rwx; // Hypercube RWX
    this.uniforms.u_rotation4D.value.y = this.angles.rwy; // Hypercube RWY
    this.uniforms.u_rotation4D.value.z = this.angles.rw;  // Hypercube RW (desktop)
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * NEW: Apply device orientation to 3D camera rotation
   */
  applyDeviceOrientationRotation() {
    if (!this.deviceOrientationEnabled) return;
    
    // Apply device orientation only if velocity enabled
    if (this.isVelocityEnabled('rx')) {
      this.angles.rx += this.deviceOrientationInput.rx * 0.02;
    }
    if (this.isVelocityEnabled('ry')) {
      this.angles.ry += this.deviceOrientationInput.ry * 0.02;
    }
    if (this.isVelocityEnabled('rz')) {
      this.angles.rz += this.deviceOrientationInput.rz * 0.02;
    }
    
    // Apply damping to device orientation input
    this.deviceOrientationInput.rx *= 0.95;
    this.deviceOrientationInput.ry *= 0.95;
    this.deviceOrientationInput.rz *= 0.95;
  }

  /**
   * NEW: Apply touch gestures to 4D hypercube rotation
   */
  applyTouchGestureRotation() {
    if (!this.touchGestureEnabled) return;
    
    // Apply touch gestures only if velocity enabled
    if (this.isVelocityEnabled('rwx')) {
      this.angles.rwx += this.touchInput.rwx;
    }
    if (this.isVelocityEnabled('rwy')) {
      this.angles.rwy += this.touchInput.rwy;
    }
    
    // Apply damping to touch input
    this.touchInput.rwx *= 0.90;
    this.touchInput.rwy *= 0.90;
  }

  /**
   * UNCHANGED: Keep desktop rotation behavior exactly the same
   */
  applyDesktopRotation() {
    // Desktop mouse/wheel behavior unchanged
    if (this.isVelocityEnabled('rw')) {
      this.angles.rw += this.wheelVelocity;
    }
    
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.wheelVelocity *= 0.96;
    
    // Note: On mobile, we no longer use mouse velocity for rx/ry
    // On desktop, this behavior continues as before via mouse events
  }

  /**
   * ENHANCED: Reset all rotation values
   */
  resetRotation() {
    // Reset all 8 axes
    this.angles.rx = 0; this.angles.ry = 0; this.angles.rz = 0;
    this.angles.rwx = 0; this.angles.rwy = 0; this.angles.rw = 0;
    
    // Reset all input sources
    this.velocity.x = 0; this.velocity.y = 0;
    this.slowVelocity.x = 0; this.slowVelocity.y = 0;
    this.wheelVelocity = 0;
    this.deviceOrientationInput = { rx: 0, ry: 0, rz: 0 };
    this.touchInput = { rwx: 0, rwy: 0 };
    
    console.log('🔄 All 8 axes reset to zero');
  }

  /**
   * ENHANCED: Reset all parameters and state
   */
  resetAll() {
    this.resetRotation();
    
    // Reset parameters
    this.setParameter('fov', 7.0);
    this.setParameter('perspective', 2.3);
    this.setParameter('cameraZ', 10.0);
    
    // Reset velocity states for all 8 axes
    this.velocityEnabled = {
      rx: true, ry: true, rz: true,
      rwx: true, rwy: true, rw: true
    };
    
    // Reset mobile control states
    this.xAxisInverted = false;
    
    console.log('🔄 All Enhanced Tesseract parameters reset');
  }

  // ==========================================
  // ENHANCED: MOBILE CONTROL TOGGLES
  // ==========================================

  /**
   * NEW: Toggle device orientation control
   */
  toggleDeviceOrientationControl() {
    if (this.deviceOrientationEnabled) {
      this.disableDeviceOrientation();
      return false;
    } else {
      return this.enableDeviceOrientation();
    }
  }

  /**
   * NEW: Toggle touch gesture control
   */
  toggleTouchGestureControl() {
    this.touchGestureEnabled = !this.touchGestureEnabled;
    
    if (!this.touchGestureEnabled) {
      this.touchInput = { rwx: 0, rwy: 0 };
    }
    
    console.log(`🎯 Touch gesture control: ${this.touchGestureEnabled ? 'enabled' : 'disabled'}`);
    return this.touchGestureEnabled;
  }

  // ==========================================
  // ENHANCED: EVENT HANDLERS (Mobile-specific)
  // ==========================================

  /**
   * ENHANCED: Touch start - prepare for separated gestures
   */
  onTouchStart(event) {
    if (this.isTouchOnButton(event)) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    console.log('Touch start for separated 4D gesture control');
  }

  /**
   * NEW: Touch move - separated RWX (horizontal) and RWY (vertical)
   */
  onTouchMove(event) {
    if (this.isTouchOnButton(event)) return;
    if (!this.touchGestureEnabled) return;
    
    event.preventDefault();
    if (!this.getTutorialState()) {
      const touch = event.touches[0];
      
      // Calculate separate horizontal and vertical deltas
      const deltaX = (touch.clientX - this.touchStartX) / window.innerWidth;
      const deltaY = (touch.clientY - this.touchStartY) / window.innerHeight;
      
      // NEW: Separated gesture mapping
      this.touchInput.rwx += deltaX * 0.15;  // Horizontal → RWX (4D)
      this.touchInput.rwy += deltaY * 0.15;  // Vertical → RWY (4D)
      
      // Update start position for continuous gesture
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
    }
  }

  /**
   * ENHANCED: Touch end
   */
  onTouchEnd(event) {
    if (this.isTouchOnButton(event)) return;
    
    event.preventDefault();
    console.log('Touch end for separated 4D gesture control');
  }

  // ==========================================
  // COMPATIBILITY: LEGACY METHODS
  // ==========================================

  /**
   * LEGACY: Keep old motion control methods for compatibility
   */
  enableMotionControl() {
    return this.enableDeviceOrientation();
  }

  disableMotionControl() {
    this.disableDeviceOrientation();
  }

  toggleMotionControl() {
    return this.toggleDeviceOrientationControl();
  }

  toggleTouchControl() {
    return this.toggleTouchGestureControl();
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

  console.log('✅ Enhanced TesseractShader with 8-axis mobile system ready!');
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TesseractShader;
} else if (typeof window !== 'undefined') {
  window.TesseractShader = TesseractShader;
}
