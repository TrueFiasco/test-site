/**
 * ControlPanelRenderer - Complete framework control panel system
 * Generates control panel HTML from configuration, handles all event management
 * Uses existing tutorial-framework.css classes, binds to GenericShader interface
 * Includes automatic settings button management for complete framework integration
 * Supports all control types and mobile/desktop responsive layouts
 */
class ControlPanelRenderer {
  constructor(shader, config, options = {}) {
    this.shader = shader;
    this.config = config;
    this.containerId = options.containerId || 'controls-panel';
    this.settingsButtonId = options.settingsButtonId || 'settings-toggle';
    this.device = shader.device;
    
    // Panel state management
    this.panelOpen = false;
    this.settingsButton = null;
    this.controlsPanel = null;
    this.backdrop = null;
    
    // Parameter smoothing system
    this.filterStrength = 0.1;
    this.parameterTargets = {};
    this.smoothingActive = false;
    
    console.log('🎨 ControlPanelRenderer created with framework settings button management');
  }

  // ==========================================
  // MAIN FRAMEWORK ENTRY POINTS
  // ==========================================

  /**
   * Render control panel and setup settings button management
   * This is the main entry point for complete framework integration
   */
  renderWithSettingsButton() {
    // First render the control panel content
    this.render();
    
    // Then setup automatic settings button management
    this.setupSettingsButtonManagement();
    
    console.log('✅ Control panel rendered with automatic settings button management');
  }

  /**
   * Generate complete control panel HTML and bind events (original method)
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`❌ Container ${this.containerId} not found`);
      return;
    }

    // Generate HTML using existing CSS classes
    container.innerHTML = this.generateHTML();
    
    // Bind all event listeners
    this.bindEvents();
    
    console.log('✅ Control panel content rendered and bound');
  }

  // ==========================================
  // SETTINGS BUTTON MANAGEMENT (Framework)
  // ==========================================

  /**
   * Setup automatic settings button management (framework handles everything)
   */
  setupSettingsButtonManagement() {
    this.settingsButton = document.getElementById(this.settingsButtonId);
    this.controlsPanel = document.getElementById(this.containerId);
    
    if (!this.settingsButton || !this.controlsPanel) {
      console.error(`❌ Settings button (${this.settingsButtonId}) or panel (${this.containerId}) not found`);
      return;
    }
    
    // Clean up any existing listeners
    const newButton = this.settingsButton.cloneNode(true);
    this.settingsButton.parentNode.replaceChild(newButton, this.settingsButton);
    this.settingsButton = newButton;
    
    // Bind settings button click
    this.settingsButton.addEventListener('click', (e) => this.handleSettingsButtonClick(e));
    
    // Setup global escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panelOpen) {
        this.closePanel();
      }
    });
    
    console.log('🎛️ Framework settings button management setup complete');
  }

  /**
   * Handle settings button click with proper event management
   */
  handleSettingsButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    console.log('⚙️ Settings button clicked (framework managed), panel open:', this.panelOpen);
    
    if (this.panelOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * Open control panel with framework event protection
   */
  openPanel() {
    console.log('✅ Opening panel (framework managed)');
    
    // Show panel
    this.controlsPanel.style.display = 'block';
    this.controlsPanel.style.opacity = '1';
    this.controlsPanel.style.visibility = 'visible';
    this.controlsPanel.style.pointerEvents = 'auto';
    
    // Ensure button stays clickable
    this.settingsButton.style.zIndex = '99999';
    this.settingsButton.style.pointerEvents = 'auto';
    
    this.panelOpen = true;
    
    // Setup panel event protection (framework handles this automatically)
    this.setupPanelEventProtection();
    
    // Add backdrop for mobile or outside-click closing
    this.addBackdrop();
  }

  /**
   * Close control panel
   */
  closePanel() {
    console.log('✅ Closing panel (framework managed)');
    
    this.controlsPanel.style.display = 'none';
    this.controlsPanel.style.opacity = '0';
    this.controlsPanel.style.visibility = 'hidden';
    this.controlsPanel.style.pointerEvents = 'none';
    
    this.panelOpen = false;
    
    this.removeBackdrop();
  }

  /**
   * Setup comprehensive event protection for panel content
   * This prevents clicks inside the panel from closing it
   */
  setupPanelEventProtection() {
    // Protect the panel container itself
    this.controlsPanel.addEventListener('click', (e) => {
      console.log('🛡️ Panel click protected by framework');
      e.stopPropagation();
      e.stopImmediatePropagation();
    });
    
    this.controlsPanel.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    this.controlsPanel.addEventListener('mouseup', (e) => {
      e.stopPropagation();
    });
    
    // Protect all interactive elements inside the panel
    this.controlsPanel.querySelectorAll('input, button, select, label').forEach(element => {
      // Click protection
      element.addEventListener('click', (e) => {
        console.log('🛡️ Control click protected by framework:', e.target.tagName);
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
      
      // Input event protection
      element.addEventListener('change', (e) => {
        e.stopPropagation();
      });
      
      element.addEventListener('input', (e) => {
        e.stopPropagation();
      });
      
      // Focus protection
      element.addEventListener('focus', (e) => {
        e.stopPropagation();
      });
      
      element.addEventListener('blur', (e) => {
        e.stopPropagation();
      });
    });
    
    console.log('🛡️ Framework panel event protection setup complete');
  }

  /**
   * Add backdrop for outside-click closing (mobile friendly)
   */
  addBackdrop() {
    this.removeBackdrop(); // Remove existing first
    
    this.backdrop = document.createElement('div');
    this.backdrop.id = 'framework-backdrop';
    this.backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1999;
      pointer-events: auto;
    `;
    
    // Backdrop click behavior depends on device
    this.backdrop.addEventListener('click', (e) => {
      if (this.device.isMobile) {
        // Mobile: allow backdrop closing
        console.log('🎯 Mobile backdrop click - closing panel');
        e.preventDefault();
        this.closePanel();
      } else {
        // Desktop: backdrop doesn't close (only settings button closes)
        console.log('🎯 Desktop backdrop click - ignoring (settings button only)');
        e.preventDefault();
      }
    });
    
    document.body.appendChild(this.backdrop);
  }

  /**
   * Remove backdrop
   */
  removeBackdrop() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
  }

  /**
   * Check if panel is currently open
   */
  isPanelOpen() {
    return this.panelOpen;
  }

  // ==========================================
  // HTML GENERATION SYSTEM
  // ==========================================

  /**
   * Generate complete HTML structure using existing CSS classes
   */
  generateHTML() {
    return `
      ${this.generateTitle()}
      ${this.generateParameters()}
      ${this.generateFilterControl()}
      ${this.generateMotionControl()}
      ${this.generateButtons()}
      ${this.generateInfoSection()}
    `;
  }

  /**
   * Generate panel title
   */
  generateTitle() {
    const title = this.config.title || 'Control Panel';
    return `<h4>${title}</h4>`;
  }

  /**
   * Generate parameter controls
   */
  generateParameters() {
    if (!this.config.parameters) return '';
    
    return this.config.parameters.map(param => {
      switch (param.type) {
        case 'number':
          return this.generateNumberControl(param);
        case 'range':
          return this.generateRangeControl(param);
        case 'boolean':
          return this.generateBooleanControl(param);
        case 'select':
          return this.generateSelectControl(param);
        default:
          console.warn(`Unknown parameter type: ${param.type}`);
          return '';
      }
    }).join('');
  }

  /**
   * Generate number input control
   */
  generateNumberControl(param) {
    const { id, label, min, max, step, default: defaultValue } = param;
    
    return `
      <div class="control-group">
        <label for="${id}-control">${label}:</label>
        <input type="number" 
               id="${id}-control" 
               value="${defaultValue}" 
               ${min !== undefined ? `min="${min}"` : ''}
               ${max !== undefined ? `max="${max}"` : ''}
               ${step !== undefined ? `step="${step}"` : ''}
               data-param-id="${id}">
      </div>
    `;
  }

  /**
   * Generate range slider control
   */
  generateRangeControl(param) {
    const { id, label, min, max, step, default: defaultValue } = param;
    
    return `
      <div class="control-group">
        <label for="${id}-control">${label}:</label>
        <input type="range" 
               id="${id}-control" 
               value="${defaultValue}" 
               min="${min || 0}" 
               max="${max || 100}" 
               ${step !== undefined ? `step="${step}"` : ''}
               data-param-id="${id}"
               style="width: 80px;">
      </div>
    `;
  }

  /**
   * Generate boolean toggle control
   */
  generateBooleanControl(param) {
    const { id, label, default: defaultValue } = param;
    
    return `
      <div class="control-group">
        <label for="${id}-control">${label}:</label>
        <button class="control-button" 
                id="${id}-control" 
                data-param-id="${id}"
                data-value="${defaultValue}"
                style="width: 80px; padding: 0.2rem 0.5rem; font-size: 0.75rem;">
          ${defaultValue ? 'ON' : 'OFF'}
        </button>
      </div>
    `;
  }

  /**
   * Generate select dropdown control
   */
  generateSelectControl(param) {
    const { id, label, options, default: defaultValue } = param;
    
    const optionsHTML = options.map(option => {
      const value = typeof option === 'object' ? option.value : option;
      const text = typeof option === 'object' ? option.label : option;
      const selected = value === defaultValue ? 'selected' : '';
      return `<option value="${value}" ${selected}>${text}</option>`;
    }).join('');
    
    return `
      <div class="control-group">
        <label for="${id}-control">${label}:</label>
        <select id="${id}-control" data-param-id="${id}" style="width: 80px;">
          ${optionsHTML}
        </select>
      </div>
    `;
  }

  /**
   * Generate filter strength control
   */
  generateFilterControl() {
    return `
      <div class="control-group">
        <label for="filter-strength">Filter:</label>
        <input type="range" 
               id="filter-strength" 
               value="0.1" 
               min="0.01" 
               max="1" 
               step="0.01" 
               style="width: 80px;" 
               title="Parameter change smoothing">
      </div>
    `;
  }

  /**
   * Generate mobile-only motion control
   */
  generateMotionControl() {
    if (!this.device.isMobile || !this.config.mobile?.showMotionControl) {
      return '';
    }
    
    return `
      <div class="control-group mobile-only" id="motion-control-group">
        <label for="motion-control-toggle">Motion Control:</label>
        <button class="control-button" 
                id="motion-control-toggle" 
                style="width: 80px; padding: 0.2rem 0.5rem; font-size: 0.75rem;">
          Enable
        </button>
      </div>
    `;
  }

  /**
   * Generate button controls
   */
  generateButtons() {
    if (!this.config.buttons) return '';
    
    const buttons = this.config.buttons;
    const desktopButtons = buttons.filter(btn => !btn.mobileOnly);
    const mobileButtons = buttons.filter(btn => btn.mobileOnly);
    
    let html = '<div class="button-group">';
    
    // Wide buttons (like reset)
    const wideButtons = desktopButtons.filter(btn => btn.wide);
    wideButtons.forEach(btn => {
      html += `
        <button class="control-button wide" 
                id="${btn.id}" 
                data-action="${btn.action}">
          ${btn.label}
        </button>
      `;
    });
    
    // Desktop button rows
    const normalButtons = desktopButtons.filter(btn => !btn.wide);
    if (normalButtons.length > 0) {
      html += '<div class="desktop-only">';
      html += this.generateButtonRow(normalButtons);
      html += '</div>';
    }
    
    // Mobile button rows
    if (mobileButtons.length > 0) {
      html += '<div class="mobile-only">';
      
      // Group mobile buttons into rows
      const mobileRows = this.groupButtonsIntoRows(mobileButtons, 3);
      mobileRows.forEach(row => {
        html += this.generateButtonRow(row);
      });
      
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Generate a row of buttons
   */
  generateButtonRow(buttons) {
    const buttonHTML = buttons.map(btn => `
      <button class="control-button" 
              id="${btn.id}" 
              data-action="${btn.action}">
        ${btn.label}
      </button>
    `).join('');
    
    return `<div class="button-row">${buttonHTML}</div>`;
  }

  /**
   * Group buttons into rows
   */
  groupButtonsIntoRows(buttons, buttonsPerRow) {
    const rows = [];
    for (let i = 0; i < buttons.length; i += buttonsPerRow) {
      rows.push(buttons.slice(i, i + buttonsPerRow));
    }
    return rows;
  }

  /**
   * Generate info section
   */
  generateInfoSection() {
    if (!this.config.info) return '';
    
    let html = `
      <div class="info-section">
        <h4>${this.config.info.title || 'Controls'}</h4>
    `;
    
    // Desktop instructions
    if (this.config.info.desktop) {
      this.config.info.desktop.forEach(text => {
        html += `<p class="desktop-only">${text}</p>`;
      });
    }
    
    // Mobile instructions
    if (this.config.info.mobile) {
      this.config.info.mobile.forEach(text => {
        html += `<p class="mobile-only">${text}</p>`;
      });
    }
    
    html += '</div>';
    return html;
  }

  // ==========================================
  // EVENT BINDING SYSTEM
  // ==========================================

  /**
   * Bind all event listeners
   */
  bindEvents() {
    this.bindParameterEvents();
    this.bindFilterEvents();
    this.bindMotionEvents();
    this.bindButtonEvents();
    
    console.log('🔗 All events bound');
  }

  /**
   * Bind parameter control events
   */
  bindParameterEvents() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Bind all parameter inputs
    container.querySelectorAll('[data-param-id]').forEach(input => {
      const paramId = input.dataset.paramId;
      
      if (input.type === 'range' || input.type === 'number') {
        input.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          this.smoothParameterChange(paramId, value);
        });
      } else if (input.tagName === 'SELECT') {
        input.addEventListener('change', (e) => {
          this.shader.setParameter(paramId, e.target.value);
        });
      } else if (input.tagName === 'BUTTON') {
        // Boolean toggle button
        input.addEventListener('click', (e) => {
          const currentValue = e.target.dataset.value === 'true';
          const newValue = !currentValue;
          
          e.target.dataset.value = newValue;
          e.target.textContent = newValue ? 'ON' : 'OFF';
          
          this.shader.setParameter(paramId, newValue);
        });
      }
    });
  }

  /**
   * Bind filter strength events
   */
  bindFilterEvents() {
    const filterControl = document.getElementById('filter-strength');
    if (filterControl) {
      filterControl.addEventListener('input', (e) => {
        this.filterStrength = parseFloat(e.target.value);
        console.log('🎛️ Filter strength:', this.filterStrength);
      });
    }
  }

  /**
   * Bind motion control events with framework consent integration
   */
  bindMotionEvents() {
    const motionToggle = document.getElementById('motion-control-toggle');
    if (motionToggle && this.device.isMobile) {
      motionToggle.addEventListener('click', (e) => {
        this.handleMotionControlToggle(motionToggle);
      });
      
      // Set initial button state based on framework consent and current state
      this.updateMotionControlButton(motionToggle);
    }
  }

  /**
   * Handle motion control toggle with framework consent system
   */
  handleMotionControlToggle(button) {
    // Check current motion consent from framework
    const hasConsent = this.shader.canUseMotion();
    const isActive = this.shader.isMotionControlActive && this.shader.isMotionControlActive();
    
    if (!hasConsent) {
      // No consent yet - request permission
      this.requestMotionPermission(button);
    } else if (isActive) {
      // Currently active - disable it
      this.shader.disableMotionControl();
      this.updateMotionControlButton(button);
      console.log('📱 Motion control disabled via control panel');
    } else {
      // Has consent but not active - enable it
      this.shader.enableMotionControl();
      this.updateMotionControlButton(button);
      console.log('📱 Motion control enabled via control panel');
    }
  }

  /**
   * Request motion permission using framework consent system
   */
  requestMotionPermission(button) {
    // Check if permission API is available
    if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ permission request
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          const granted = response === 'granted';
          GenericShader.setMotionConsent(granted);
          
          if (granted) {
            this.shader.enableMotionControl();
            console.log('📱 Motion permission granted via iOS permission dialog');
          } else {
            console.log('📱 Motion permission denied via iOS permission dialog');
          }
          
          this.updateMotionControlButton(button);
        })
        .catch(error => {
          console.error('Motion permission request failed:', error);
          GenericShader.setMotionConsent(false);
          this.updateMotionControlButton(button);
        });
    } else {
      // Android/other devices - assume granted
      GenericShader.setMotionConsent(true);
      this.shader.enableMotionControl();
      this.updateMotionControlButton(button);
      console.log('📱 Motion permission auto-granted for Android/other devices');
    }
  }

  /**
   * Update motion control button state
   */
  updateMotionControlButton(button) {
    const hasConsent = this.shader.canUseMotion();
    const isActive = this.shader.isMotionControlActive && this.shader.isMotionControlActive();
    
    if (!hasConsent) {
      button.textContent = 'Enable';
      button.classList.remove('disabled');
      button.style.background = '';
      button.style.borderColor = '';
    } else if (isActive) {
      button.textContent = 'Disable';
      button.classList.remove('disabled');
      button.style.background = 'rgba(0, 255, 127, 0.3)';
      button.style.borderColor = 'rgba(0, 255, 127, 0.6)';
    } else {
      button.textContent = 'Enable';
      button.classList.add('disabled');
      button.style.background = 'rgba(255, 100, 100, 0.3)';
      button.style.borderColor = 'rgba(255, 100, 100, 0.5)';
    }
  }

  /**
   * Bind button action events
   */
  bindButtonEvents() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    container.querySelectorAll('[data-action]').forEach(button => {
      const action = button.dataset.action;
      
      button.addEventListener('click', (e) => {
        this.handleButtonAction(action, button);
      });
    });
  }

  // ==========================================
  // BUTTON ACTION SYSTEM
  // ==========================================

  /**
   * Handle button actions with Tesseract-specific logic
   */
  handleButtonAction(action, button) {
    console.log(`🎛️ Button action: ${action}`);
    
    // Check if TesseractActionMap is available for custom mappings
    const actionMap = window.TesseractActionMap || {};
    const mappedAction = actionMap[action] || action;
    
    switch (action) {
      case 'resetAll':
        if (typeof this.shader.resetAll === 'function') {
          this.shader.resetAll();
          this.showButtonFeedback(button, 'Reset ✓');
        }
        break;
        
      case 'resetRotation':
        if (typeof this.shader.resetRotation === 'function') {
          this.shader.resetRotation();
          this.showButtonFeedback(button, 'Reset ✓');
        }
        break;
        
      case 'toggleVelocityRX':
      case 'toggleVelocityRY':
      case 'toggleVelocityRW':
        // Handle velocity toggle actions with axis parameter
        if (typeof this.shader.toggleVelocity === 'function') {
          const axis = mappedAction; // 'rx', 'ry', or 'rw'
          const enabled = this.shader.toggleVelocity(axis);
          
          // Update button text and style based on state
          if (enabled) {
            button.textContent = button.textContent.replace('Enable', 'Stop');
            button.classList.remove('disabled');
            button.style.background = '';
            button.style.borderColor = '';
          } else {
            button.textContent = button.textContent.replace('Stop', 'Enable');
            button.classList.add('disabled');
            button.style.background = 'rgba(255, 100, 100, 0.3)';
            button.style.borderColor = 'rgba(255, 100, 100, 0.5)';
          }
        }
        break;
        
      case 'toggleMotionControl':
        // Handle motion control toggle
        if (typeof this.shader.toggleMotionControl === 'function') {
          const enabled = this.shader.toggleMotionControl();
          this.updateButtonToggleState(button, enabled, 'Motion');
        }
        break;
        
      case 'toggleTouchControl':
        // Handle touch control toggle  
        if (typeof this.shader.toggleTouchControl === 'function') {
          const enabled = this.shader.toggleTouchControl();
          this.updateButtonToggleState(button, enabled, 'Touch');
        }
        break;
        
      case 'toggleXAxisInvert':
        // Handle X-axis invert toggle
        if (typeof this.shader.toggleXAxisInvert === 'function') {
          const enabled = this.shader.toggleXAxisInvert();
          this.updateButtonToggleState(button, enabled, 'X-Axis', 'Fix X-Axis', 'Unfix X-Axis');
        }
        break;
        
      default:
        // Try to call method on shader directly
        if (typeof this.shader[mappedAction] === 'function') {
          const result = this.shader[mappedAction]();
          
          // Handle toggle methods that return boolean
          if (typeof result === 'boolean') {
            this.updateButtonToggleState(button, result);
          }
        } else {
          console.warn(`⚠️ Unknown action: ${action} (mapped to: ${mappedAction})`);
        }
        break;
    }
  }

  /**
   * Update button state for toggle actions
   */
  updateButtonToggleState(button, enabled, actionType = '', enabledText = '', disabledText = '') {
    if (enabled) {
      button.textContent = disabledText || button.textContent.replace('Enable', 'Stop').replace('Start', 'Stop');
      button.classList.remove('disabled');
      button.style.background = '';
      button.style.borderColor = '';
    } else {
      button.textContent = enabledText || button.textContent.replace('Stop', 'Enable').replace('Disable', 'Enable');
      button.classList.add('disabled');
      button.style.background = 'rgba(255, 100, 100, 0.3)';
      button.style.borderColor = 'rgba(255, 100, 100, 0.5)';
    }
    
    if (actionType) {
      console.log(`🎛️ ${actionType} is now: ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Show temporary button feedback
   */
  showButtonFeedback(button, text) {
    const originalText = button.textContent;
    const originalBg = button.style.background;
    
    button.textContent = text;
    button.style.background = 'rgba(0, 255, 0, 0.3)';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = originalBg;
    }, 1000);
  }

  // ==========================================
  // PARAMETER SMOOTHING SYSTEM
  // ==========================================

  /**
   * Smooth parameter change with filtering
   */
  smoothParameterChange(paramId, targetValue) {
    this.parameterTargets[paramId] = targetValue;
    
    if (!this.smoothingActive) {
      this.smoothingActive = true;
      this.smoothParameterLoop();
    }
  }

  /**
   * Parameter smoothing animation loop
   */
  smoothParameterLoop() {
    if (!this.parameterTargets || Object.keys(this.parameterTargets).length === 0) {
      this.smoothingActive = false;
      return;
    }
    
    let hasActiveChanges = false;
    
    Object.keys(this.parameterTargets).forEach(paramId => {
      const target = this.parameterTargets[paramId];
      const current = this.shader.getParameter(paramId) || 0;
      const diff = target - current;
      
      if (Math.abs(diff) > 0.01) {
        const newValue = current + (diff * this.filterStrength);
        this.shader.setParameter(paramId, newValue);
        hasActiveChanges = true;
      } else {
        // Close enough, set final value and remove from targets
        this.shader.setParameter(paramId, target);
        delete this.parameterTargets[paramId];
      }
    });
    
    if (hasActiveChanges) {
      requestAnimationFrame(() => this.smoothParameterLoop());
    } else {
      this.smoothingActive = false;
    }
  }

  /**
   * Update control values from shader state
   */
  updateFromShader() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    const params = this.shader.getShaderParams();
    
    container.querySelectorAll('[data-param-id]').forEach(input => {
      const paramId = input.dataset.paramId;
      const value = params[paramId];
      
      if (value !== undefined) {
        if (input.type === 'range' || input.type === 'number') {
          input.value = value;
        } else if (input.tagName === 'SELECT') {
          input.value = value;
        } else if (input.tagName === 'BUTTON' && input.dataset.value !== undefined) {
          input.dataset.value = value;
          input.textContent = value ? 'ON' : 'OFF';
        }
      }
    });
  }

  // ==========================================
  // CLEANUP AND UTILITIES
  // ==========================================

  /**
   * Destroy and cleanup all framework-managed elements
   */
  destroy() {
    // Close panel if open
    if (this.panelOpen) {
      this.closePanel();
    }
    
    // Clean up backdrop
    this.removeBackdrop();
    
    // Stop parameter smoothing
    this.smoothingActive = false;
    this.parameterTargets = {};
    
    // Clean up panel content
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
    
    // Reset state
    this.panelOpen = false;
    this.settingsButton = null;
    this.controlsPanel = null;
    
    console.log('🧹 ControlPanelRenderer destroyed (framework managed)');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ControlPanelRenderer;
} else if (typeof window !== 'undefined') {
  window.ControlPanelRenderer = ControlPanelRenderer;
}

/**
 * USAGE EXAMPLE - COMPLETE FRAMEWORK INTEGRATION:
 * 
 * // Tutorial initialization - ONE LINE for complete control panel!
 * const controlPanel = new ControlPanelRenderer(shader, config, {
 *   containerId: 'controls-panel',
 *   settingsButtonId: 'settings-toggle'
 * });
 * 
 * controlPanel.renderWithSettingsButton(); // EVERYTHING handled automatically!
 * 
 * Framework automatically provides:
 * ✅ Settings button click management
 * ✅ Panel event protection (prevents closing when clicking inside)
 * ✅ Desktop vs mobile backdrop behavior
 * ✅ Parameter binding and smoothing
 * ✅ Button actions and state management
 * ✅ Motion control integration with consent persistence
 * ✅ Error handling and fallbacks
 * ✅ Responsive mobile/desktop layouts
 * ✅ Complete event cleanup on destroy
 */
