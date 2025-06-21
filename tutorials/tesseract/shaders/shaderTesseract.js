/**
 * TesseractShader - 4D Hypercube WebGL Visualization
 * Enhanced with framework integration and mobile motion control support
 * Extends GenericShader for reusable tutorial framework
 */
class TesseractShader extends GenericShader {
  constructor(canvasId, options = {}) {
    // Call parent constructor
    super(canvasId, options);
    
    // Tesseract-specific interaction state
    this.mousePos = { x: 0, y: 0 };
    this.normalizedMouse = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.slowVelocity = { x: 0, y: 0 };
    this.angles = { rx: 0, ry: 0, rw: 0 };
    this.wheelVelocity = 0;
    this.maxSlowVelocity = 0.25;
    
    // Velocity control system
    this.velocityEnabled = {
      rx: true,  // X-axis rotation enabled by default
      ry: true,  // Y-axis rotation enabled by default  
      rw: true   // W-axis rotation enabled by default
    };
    
    // Mobile touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    // Motion control state (integrated with GenericShader consent system)
    this.rotationSource = 'mouse'; // 'mouse' or 'motion'
    this.motionInput = { x: 0, y: 0, w: 0 }; // Motion control input
    this.motionEnabled = false;
    
    // Mobile control options
    this.xAxisInverted = false; // X-axis inversion state for mobile
    
    // Animation state
    this.animationId = null;
    
    // Auto-register parameters from TesseractControlConfig
    this.registerTesseractParameters();
    
    console.log('🎯 TesseractShader created with framework integration');
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
   * Initialize the Three.js scene and start rendering
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
   * Initialize Three.js scene, camera, renderer and shaders
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
    
    // Create vertex data for tesseract
    const vertexData = this.createVertexData();
    const vertexTexture = new THREE.DataTexture(
      vertexData, 33, 1, THREE.RGBAFormat, THREE.FloatType
    );
    vertexTexture.needsUpdate = true;
    
    // Create text texture
    const textTexture = await this.createTesseractTextTexture();
    
    // Setup shaders and materials
    const { vertexShader, fragmentShader } = this.getShaderCode();
    
    this.uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_vertices: { value: vertexTexture },
      u_textTexture: { value: textTexture },
      u_rotation: { value: new THREE.Vector3(0, 0, 0) },
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
   * Get vertex and fragment shader code
   */
  getShaderCode() {
    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform sampler2D u_vertices;
      uniform sampler2D u_textTexture;
      uniform vec3 u_rotation;
      uniform float u_lineWidth;
      uniform float u_fov;
      uniform float u_perspective;
      uniform float u_cameraZ;
      
      mat4 rotateX(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, -s, 0.0, 0.0, s, c, 0.0, 0.0, 0.0, 0.0, 1.0);
      }
      
      mat4 rotateY(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(c, 0.0, s, 0.0, 0.0, 1.0, 0.0, 0.0, -s, 0.0, c, 0.0, 0.0, 0.0, 0.0, 1.0);
      }
      
      mat4 rotateWY(float angle) {
        float c = cos(angle); float s = sin(angle);
        return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c);
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
        
        mat4 rotation = rotateWY(u_rotation.z) * rotateY(u_rotation.y) * rotateX(u_rotation.x);
        
        float minDist = 1000.0;
        
        for (int i = 0; i < 32; i++) {
          vec4 vertex1 = texture2D(u_vertices, vec2((float(i) + 0.5) / 33.0, 0.5));
          vec4 vertex2 = texture2D(u_vertices, vec2((float(i + 1) + 0.5) / 33.0, 0.5));
          
          vertex1 = rotation * vertex1;
          vertex2 = rotation * vertex2;
          
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
   * Create text texture for TESSERACT title
   * Shows only title and subtitle - no interaction hints
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
    
    // Clean subtitle text - same for both mobile and desktop
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

  // ==========================================
  // TESSERACT-SPECIFIC CONTROL METHODS
  // ==========================================

  /**
   * Reset all rotation values to zero - FRAMEWORK INTERFACE
   */
  resetRotation() {
    this.angles.rx = 0;
    this.angles.ry = 0;
    this.angles.rw = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.slowVelocity.x = 0;
    this.slowVelocity.y = 0;
    this.wheelVelocity = 0;
    this.motionInput = { x: 0, y: 0, w: 0 };
    console.log('🔄 Rotation reset to zero');
  }

  /**
   * Reset all parameters and state - FRAMEWORK INTERFACE (required abstract method)
   */
  resetAll() {
    // Reset rotation
    this.resetRotation();
    
    // Reset parameters to defaults
    this.setParameter('fov', 7.0);
    this.setParameter('perspective', 2.3);
    this.setParameter('cameraZ', 10.0);
    
    // Reset velocity states
    this.velocityEnabled = { rx: true, ry: true, rw: true };
    
    // Reset mobile control states
    this.xAxisInverted = false;
    
    console.log('🔄 All Tesseract parameters reset to defaults');
  }

  /**
   * Toggle velocity for specific axis
   * @param {string} axis - 'rx', 'ry', or 'rw'
   * @returns {boolean} - Whether velocity is now enabled
   */
  toggleVelocity(axis) {
    if (!this.velocityEnabled) {
      this.velocityEnabled = {};
    }
    
    // Initialize all axes as enabled by default
    if (this.velocityEnabled[axis] === undefined) {
      this.velocityEnabled[axis] = true;
    }
    
    // Toggle the specific axis
    this.velocityEnabled[axis] = !this.velocityEnabled[axis];
    
    // If disabled, stop velocity for that axis
    if (!this.velocityEnabled[axis]) {
      switch(axis) {
        case 'rx':
          this.velocity.x = 0;
          this.slowVelocity.x = 0;
          if (this.motionInput) this.motionInput.x = 0;
          break;
        case 'ry':
          this.velocity.y = 0;
          this.slowVelocity.y = 0;
          if (this.motionInput) this.motionInput.y = 0;
          break;
        case 'rw':
          this.wheelVelocity = 0;
          if (this.motionInput) this.motionInput.w = 0;
          break;
      }
    }
    
    console.log(`🎛️ ${axis.toUpperCase()} velocity ${this.velocityEnabled[axis] ? 'enabled' : 'disabled'}`);
    return this.velocityEnabled[axis];
  }

  /**
   * Check if velocity is enabled for a specific axis
   * @param {string} axis - 'rx', 'ry', or 'rw'
   * @returns {boolean}
   */
  isVelocityEnabled(axis) {
    if (!this.velocityEnabled) return true; // Default to enabled
    return this.velocityEnabled[axis] !== false;
  }

  // ==========================================
  // MOTION CONTROL INTEGRATION (with framework consent system)
  // ==========================================

  /**
   * Set rotation input source
   * @param {string} source - 'mouse' or 'motion'
   */
  setRotationSource(source) {
    this.rotationSource = source;
    console.log(`🎯 Rotation source set to: ${source}`);
  }

  /**
   * Enable motion control (integrated with framework consent)
   */
  enableMotionControl() {
    // Check framework consent system first
    if (!this.canUseMotion()) {
      console.log('📱 Motion control not available or not consented');
      return false;
    }
    
    this.motionEnabled = true;
    this.setRotationSource('motion');
    console.log('🎯 Motion control enabled in shader');
    return true;
  }

  /**
   * Disable motion control
   */
  disableMotionControl() {
    this.motionEnabled = false;
    this.setRotationSource('mouse');
    // Reset motion input
    this.motionInput = { x: 0, y: 0, w: 0 };
    console.log('🎯 Motion control disabled in shader');
  }

  /**
   * Toggle motion control (for button integration)
   */
  toggleMotionControl() {
    if (this.isMotionControlActive()) {
      this.disableMotionControl();
      return false;
    } else {
      return this.enableMotionControl();
    }
  }

  /**
   * Update motion input from external motion controller
   * @param {Object} input - {x, y, w} motion values
   */
  updateMotionInput(input) {
    if (!this.motionEnabled) return;
    
    this.motionInput.x = input.x || 0;
    this.motionInput.y = input.y || 0;
    this.motionInput.w = input.w || 0;
  }

  /**
   * Check if motion control is active
   */
  isMotionControlActive() {
    return this.motionEnabled && this.rotationSource === 'motion';
  }

  // ==========================================
  // ADDITIONAL CONTROL METHODS (for mobile buttons)
  // ==========================================

  /**
   * Toggle touch control (for mobile control panel)
   */
  toggleTouchControl() {
    // For Tesseract, this could disable/enable touch-based 4D rotation
    const currentlyEnabled = !this.motionEnabled || this.rotationSource !== 'motion';
    
    if (currentlyEnabled) {
      // Currently using touch - disable it (motion only)
      if (this.canUseMotion()) {
        this.enableMotionControl();
        console.log('🎯 Touch control disabled - motion only mode');
        return false;
      } else {
        console.log('🎯 Cannot disable touch - motion not available');
        return true;
      }
    } else {
      // Currently motion only - enable touch
      this.disableMotionControl();
      console.log('🎯 Touch control enabled - mixed mode');
      return true;
    }
  }

  /**
   * Toggle X-axis inversion (for mobile control panel)
   */
  toggleXAxisInvert() {
    // Toggle X-axis inversion state
    if (!this.xAxisInverted) {
      this.xAxisInverted = true;
    } else {
      this.xAxisInverted = false;
    }
    
    console.log(`🎯 X-axis inversion: ${this.xAxisInverted ? 'enabled' : 'disabled'}`);
    return this.xAxisInverted;
  }

  // ==========================================
  // ENHANCED PARAMETER INTEGRATION
  // ==========================================

  /**
   * Override setParameter to handle Tesseract-specific parameters
   */
  setParameter(parameterId, value) {
    const success = super.setParameter(parameterId, value);
    
    if (success) {
      console.log(`🎛️ Parameter ${parameterId} set to ${value}`);
    }
    
    return success;
  }

  /**
   * Get shader parameters including Tesseract-specific state
   */
  getShaderParams() {
    const baseParams = super.getShaderParams();
    
    return {
      ...baseParams,
      rotation: {
        x: this.angles.rx,
        y: this.angles.ry,
        w: this.angles.rw
      },
      velocityEnabled: { ...this.velocityEnabled },
      rotationSource: this.rotationSource,
      motionEnabled: this.motionEnabled,
      xAxisInverted: this.xAxisInverted
    };
  }

  /**
   * Set shader parameters including Tesseract-specific state
   */
  setShaderParams(params) {
    super.setShaderParams(params);
    
    if (params.rotation) {
      if (params.rotation.x !== undefined) this.angles.rx = params.rotation.x;
      if (params.rotation.y !== undefined) this.angles.ry = params.rotation.y;
      if (params.rotation.w !== undefined) this.angles.rw = params.rotation.w;
    }
    
    if (params.velocityEnabled) {
      this.velocityEnabled = { ...this.velocityEnabled, ...params.velocityEnabled };
    }
  }

  // ==========================================
  // EVENT LISTENERS & CONTROLS
  // ==========================================

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

  // ==========================================
  // ANIMATION LOOP
  // ==========================================

  /**
   * Animation loop with motion control integration
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    if (!this.uniforms) return;
    
    this.uniforms.u_time.value += 0.016;
    
    // Apply rotation based on input source
    if (this.isMotionControlActive()) {
      // Motion control mode - apply motion input
      this.applyMotionRotation();
    } else {
      // Mouse/touch control mode - apply traditional rotation
      this.applyMouseRotation();
    }
    
    // Update shader uniforms
    this.uniforms.u_rotation.value.x = this.angles.rx;
    this.uniforms.u_rotation.value.y = this.angles.ry;
    this.uniforms.u_rotation.value.z = this.angles.rw;
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Apply motion control rotation - respects velocity toggles and X-axis inversion
   */
  applyMotionRotation() {
    // Apply motion input only if velocity is enabled for each axis
    if (this.isVelocityEnabled('rx')) {
      const xInput = this.xAxisInverted ? -this.motionInput.x : this.motionInput.x;
      this.angles.rx += xInput;
    }
    if (this.isVelocityEnabled('ry')) {
      this.angles.ry += this.motionInput.y;
    }
    if (this.isVelocityEnabled('rw')) {
      this.angles.rw += this.motionInput.w;
    }
    
    // Apply damping to motion input
    this.motionInput.x *= 0.85;
    this.motionInput.y *= 0.85;
    this.motionInput.w *= 0.90;
  }

  /**
   * Apply traditional mouse/touch rotation - respects velocity toggles and X-axis inversion
   */
  applyMouseRotation() {
    // Apply rotation only if velocity is enabled for each axis
    if (this.isVelocityEnabled('rx')) {
      const xVelocity = this.xAxisInverted ? -this.velocity.x : this.velocity.x;
      const xSlowVelocity = this.xAxisInverted ? -this.slowVelocity.x : this.slowVelocity.x;
      this.angles.rx += xVelocity + xSlowVelocity;
    }
    if (this.isVelocityEnabled('ry')) {
      this.angles.ry += this.velocity.y + this.slowVelocity.y;
    }
    if (this.isVelocityEnabled('rw')) {
      this.angles.rw += this.wheelVelocity;
    }
    
    // Apply damping
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.wheelVelocity *= 0.96;
    
    // Calculate slow velocity targets only if enabled
    const targetSlowVelX = this.isVelocityEnabled('rx') ? this.normalizedMouse.y * 0.0125 : 0;
    const targetSlowVelY = this.isVelocityEnabled('ry') ? this.normalizedMouse.x * 0.0125 : 0;
    
    this.slowVelocity.x += (targetSlowVelX - this.slowVelocity.x) * 0.1;
    this.slowVelocity.y += (targetSlowVelY - this.slowVelocity.y) * 0.1;
    
    const slowSpeed = Math.sqrt(this.slowVelocity.x * this.slowVelocity.x + this.slowVelocity.y * this.slowVelocity.y);
    if (slowSpeed > this.maxSlowVelocity) {
      this.slowVelocity.x = (this.slowVelocity.x / slowSpeed) * this.maxSlowVelocity;
      this.slowVelocity.y = (this.slowVelocity.y / slowSpeed) * this.maxSlowVelocity;
    }
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

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  onMouseMove(event) {
    if (this.getTutorialState()) return;
    
    // Skip mouse input if motion control is active
    if (this.isMotionControlActive()) return;
    
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

  onTouchStart(event) {
    // MOBILE: Check if touch is on the tutorial button area
    if (this.isTouchOnButton(event)) {
      console.log('Touch on button area - letting button handle it');
      return; // Don't interfere with button interaction
    }
    
    // Skip touch input if motion control is active
    if (this.isMotionControlActive()) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    console.log('Touch start for hypercube rotation');
  }

  onTouchMove(event) {
    // MOBILE: Check if touch is on the tutorial button area
    if (this.isTouchOnButton(event)) {
      return; // Don't interfere with button interaction
    }
    
    // Skip touch input if motion control is active
    if (this.isMotionControlActive()) return;
    
    event.preventDefault();
    if (!this.getTutorialState()) {
      const touch = event.touches[0];
      const deltaX = (touch.clientX - this.touchStartX) / window.innerWidth;
      const deltaY = (touch.clientY - this.touchStartY) / window.innerHeight;
      
      this.velocity.x += deltaY * 0.1;
      this.velocity.y += deltaX * 0.1;
    }
  }

  onTouchEnd(event) {
    // MOBILE: Check if touch is on the tutorial button area
    if (this.isTouchOnButton(event)) {
      return; // Don't interfere with button interaction
    }
    
    // Skip touch input if motion control is active
    if (this.isMotionControlActive()) return;
    
    event.preventDefault();
    console.log('Touch end for hypercube rotation');
    // Touch events now only handle hypercube rotation gestures
    // Tutorial opening is handled by the button on mobile
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
    
    if (isInButtonArea) {
      console.log('Touch detected in button area:', { 
        touchX: touch.clientX, 
        touchY: touch.clientY, 
        buttonTop: rect.top, 
        buttonBottom: rect.bottom 
      });
    }
    
    return isInButtonArea;
  }

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

  onWheel(event) {
    // Only handle wheel events when on hero page (not in tutorial)
    if (this.getTutorialState()) return;
    
    // Skip wheel input if motion control is active
    if (this.isMotionControlActive()) return;
    
    const wheelDelta = event.deltaY > 0 ? 0.5 : -0.5;
    this.wheelVelocity += wheelDelta * 0.07;
  }

  onWindowResize() {
    if (this.camera && this.renderer && this.uniforms) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.uniforms.u_resolution.value.x = window.innerWidth;
      this.uniforms.u_resolution.value.y = window.innerHeight;
    }
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

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TesseractShader;
} else if (typeof window !== 'undefined') {
  window.TesseractShader = TesseractShader;
}
