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
    this.deviceOrientationEnabled = false;  // Will be auto-enabled by MobileMotionControl
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
   * Initialize the Three.js scene and start rendering - REQUIRED by GenericShader
   */
  async init() {
    try {
      await this.initHypercube();
      this.setupEventListeners();
      this.setupHeroControls();
      this.startAnimation();
      this.isInitialized = true;
      console.log('✅ TesseractShader initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize TesseractShader:', error);
      throw error;
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
   * Apply motion control rotation - respects velocity toggles and X-axis inversion
   */
  applyMobileControls() {
    // Apply device orientation to camera (magic window)
    if (this.deviceOrientationEnabled) {
      if (this.isVelocityEnabled('cameraRx')) {
        const rxInput = this.xAxisInverted ? -this.deviceOrientationInput.rx : this.deviceOrientationInput.rx;
        this.angles.cameraRx += rxInput;
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
   * Create vertex data for the tesseract
   */
  createVertexData() {
    const vertexData = new Float32Array(33 * 4);
    const vertices = [
      [0,0,0,0], [0,0,0,1], [1,0,0,1], [1,1,0,1], [0,1,0,1], [0,0,0,1], [0,0,1,1], [0,1,1,1],
      [0,1,0,1], [0,1,0,0], [0,1,1,0], [0,1,1,1], [1,1,1,1], [1,1,1,0], [1,1,0,0], [1,1,0,1],
      [1,1,1,1], [1,0,1,1], [1,0,1,0], [1,0,0,0], [1,0,0,1], [1,0,1,1], [0,0,1,1], [0,0,1,0],
      [1,0,1,0], [1,1,1,0], [0,1,1,0], [0,0,1,0], [0,0,0,0], [1,0,0,0], [1,1,0,0], [0,1,0,0],
      [0,0,0,0]
    ];
    
    vertices.forEach((vertex, i) => {
      vertexData[i * 4] = (vertex[0] - 0.5) * 2;
      vertexData[i * 4 + 1] = (vertex[1] - 0.5) * 2;
      vertexData[i * 4 + 2] = (vertex[2] - 0.5) * 2;
      vertexData[i * 4 + 3] = (vertex[3] - 0.5) * 2;
    });
    
    return vertexData;
  }

  /**
   * Create text texture for TESSERACT title
   */
  async createTesseractTextTexture() {
    await this.waitForFonts();
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const baseFontSize = Math.min(window.innerWidth * 0.12, 144);
    const subtitleFontSize = Math.min(window.innerWidth * 0.036, 36);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Main title
    ctx.font = `${baseFontSize}px "Spy Agency"`;
    const titleY = centerY - 30;
    ctx.fillText('TESSERACT', centerX, titleY);
    
    // Clean subtitle text
    ctx.font = `400 ${subtitleFontSize}px Orbitron`;
    const subtitleLine1 = 'TouchDesigner Tutorial using GLSL';
    const subtitleLine2 = 'Interactive 4D Hypercube Visualization';
    const subtitleY = titleY + baseFontSize * 0.8 + 20;
    const lineSpacing = subtitleFontSize * 1.2;
    
    ctx.fillText(subtitleLine1, centerX, subtitleY);
    ctx.fillText(subtitleLine2, centerX, subtitleY + lineSpacing);
    
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Wait for custom fonts to load
   */
  async waitForFonts() {
    return new Promise((resolve) => {
      const testCanvas = document.createElement('canvas');
      const testCtx = testCanvas.getContext('2d');
      
      function checkFonts() {
        testCtx.font = '48px "Spy Agency", serif';
        const spyAgencyWidth = testCtx.measureText('TESSERACT').width;
        testCtx.font = '48px serif';
        const serifWidth = testCtx.measureText('TESSERACT').width;
        
        if (Math.abs(spyAgencyWidth - serifWidth) > 1) {
          resolve();
        } else {
          setTimeout(checkFonts, 100);
        }
      }
      checkFonts();
      setTimeout(resolve, 5000); // Fallback timeout
    });
  }

  /**
   * Setup event listeners for interaction
   */
  setupEventListeners() {
    const canvas = document.getElementById(this.canvasId);
    
    // Mouse events for rotation
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('wheel', (e) => this.onWheel(e));
    
    // DESKTOP: Click anywhere functionality (except on controls)
    if (!this.isMobile) {
      canvas.addEventListener('click', (e) => this.onCanvasClick(e));
      canvas.style.cursor = 'pointer';
    } else {
      // MOBILE: Default cursor, touch events will be more selective
      canvas.style.cursor = 'default';
      
      // MOBILE: Touch events only for rotation, avoid button area
      canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
      canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
      canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    // Window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup hero controls panel
   */
  setupHeroControls() {
    // Skip hero-specific controls - using main controls panel instead
    console.log('✅ Using main controls panel for hero section');
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animate();
  }

  /**
   * Stop animation loop
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
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
      
      // NEW: Separated 4D gesture mapping with X-axis inversion support
      const adjustedDeltaX = this.xAxisInverted ? -deltaX : deltaX;
      this.touchInput.rwx += adjustedDeltaX * 0.15;  // Horizontal → RWX (NEW 4D)
      this.touchInput.rwy += deltaY * 0.15;          // Vertical → RWY (same as wheel)
      
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

  /**
   * DESKTOP: Mouse move event handler
   */
  onMouseMove(event) {
    if (this.getTutorialState()) return;
    
    const newMousePos = {
      x: event.clientX / window.innerWidth,
      y: event.clientY / window.innerHeight
    };
    
    const deltaX = (newMousePos.x - this.mousePos.x) * 2.0;
    const deltaY = (newMousePos.y - this.mousePos.y) * 2.0;
    
    this.velocity.x += deltaY * 0.15;
    this.velocity.y += deltaX * 0.15;
    
    this.mousePos = newMousePos;
    
    this.normalizedMouse.x = (this.mousePos.x - 0.5) * 2;
    this.normalizedMouse.y = (this.mousePos.y - 0.5) * 2;
  }

  /**
   * DESKTOP: Canvas click event handler
   */
  onCanvasClick(event) {
    // DESKTOP ONLY: Click anywhere to open tutorial (except on controls)
    if (!this.getTutorialState() && !this.isMobile) {
      // Check if click was on controls panel or settings toggle
      const settingsToggle = document.getElementById('settings-toggle');
      const controlsPanel = document.getElementById('controls-panel');
      const closeButton = document.querySelector('.close-btn');
      
      // Don't open tutorial if clicking on controls
      if (settingsToggle && settingsToggle.contains(event.target)) return;
      if (controlsPanel && controlsPanel.contains(event.target)) return;
      if (closeButton && closeButton.contains(event.target)) return;
      
      event.preventDefault();
      console.log('Canvas clicked - opening tutorial');
      this.onTutorialOpen();
    }
  }

  /**
   * DESKTOP: Mouse wheel event handler
   */
  onWheel(event) {
    // Only handle wheel events when on hero page (not in tutorial)
    if (this.getTutorialState()) return;
    
    const wheelDelta = event.deltaY > 0 ? -0.1963 : 0.1963;
    this.wheelVelocity += wheelDelta * 0.07;
  }

  /**
   * Window resize event handler
   */
  onWindowResize() {
    if (this.camera && this.renderer && this.uniforms) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.uniforms.u_resolution.value.x = window.innerWidth;
      this.uniforms.u_resolution.value.y = window.innerHeight;
    }
  }

  /**
   * Check if touch event is on the tutorial button area
   */
  isTouchOnButton(event) {
    if (!this.isMobile) return false;
    
    const buttonContainer = document.getElementById('mobileTutorialBtn');
    if (!buttonContainer) return false;
    
    const rect = buttonContainer.getBoundingClientRect();
    const touch = event.touches && event.touches[0] ? event.touches[0] : event.changedTouches && event.changedTouches[0];
    
    if (!touch) return false;
    
    // Add generous padding around the button area to be safe
    const padding = 50;
    const isInButtonArea = (
      touch.clientX >= rect.left - padding &&
      touch.clientX <= rect.right + padding &&
      touch.clientY >= rect.top - padding &&
      touch.clientY <= rect.bottom + padding
    );
    
    return isInButtonArea;
  }

  /**
   * Check if velocity is enabled for a specific axis
   */
  isVelocityEnabled(axis) {
    if (!this.velocityEnabled) return true; // Default to enabled
    return this.velocityEnabled[axis] !== false;
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

  /**
   * NEW: Toggle all camera controls at once
   */
  toggleAllCameraControls() {
    const allCameraEnabled = this.isVelocityEnabled('cameraRx') && 
                            this.isVelocityEnabled('cameraRy') && 
                            this.isVelocityEnabled('cameraRz');
    
    // Toggle all camera axes to opposite state
    const newState = !allCameraEnabled;
    this.velocityEnabled.cameraRx = newState;
    this.velocityEnabled.cameraRy = newState;
    this.velocityEnabled.cameraRz = newState;
    
    if (!newState) {
      // Clear camera input when disabled
      this.deviceOrientationInput = { rx: 0, ry: 0, rz: 0 };
    }
    
    console.log(`🎯 All camera controls: ${newState ? 'enabled' : 'disabled'}`);
    return newState;
  }

  /**
   * NEW: Toggle device orientation control (alias for compatibility)
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
   * NEW: Toggle touch gesture control (alias for compatibility)
   */
  toggleTouchGestureControl() {
    this.touchGestureEnabled = !this.touchGestureEnabled;
    
    if (!this.touchGestureEnabled) {
      this.touchInput = { rwx: 0, rwy: 0 };
    }
    
    console.log(`🎯 Touch gesture control: ${this.touchGestureEnabled ? 'enabled' : 'disabled'}`);
    return this.touchGestureEnabled;
  }

  /**
   * NEW: Toggle X-axis inversion
   */
  toggleXAxisInvert() {
    this.xAxisInverted = !this.xAxisInverted;
    console.log(`🎯 X-axis inversion: ${this.xAxisInverted ? 'enabled' : 'disabled'}`);
    return this.xAxisInverted;
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

  /**
   * Cleanup resources - FRAMEWORK INTERFACE
   */
  destroy() {
    this.stopAnimation();
    
    // Call parent destroy
    super.destroy();
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onWindowResize);
    
    const canvas = document.getElementById(this.canvasId);
    if (canvas) {
      // Remove click event listener for desktop
      if (!this.isMobile) {
        canvas.removeEventListener('click', this.onCanvasClick);
      } else {
        // Remove touch event listeners for mobile
        canvas.removeEventListener('touchstart', this.onTouchStart);
        canvas.removeEventListener('touchmove', this.onTouchMove);
        canvas.removeEventListener('touchend', this.onTouchEnd);
      }
    }
    
    console.log('🧹 TesseractShader destroyed');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TesseractShader;
} else if (typeof window !== 'undefined') {
  window.TesseractShader = TesseractShader;
}

console.log('✅ Backwards-Compatible TesseractShader ready - Desktop safe!');
