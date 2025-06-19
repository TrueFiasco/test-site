/**
 * HotspotManager - Single Dialog Multi-Parameter System
 * Desktop: Single dialog showing all active hotspots
 * Mobile: Simple parameter display at end of sections
 */
class HotspotManager {
  constructor(options = {}) {
    this.options = {
      basePath: options.basePath || 'tutorials/tesseract/',
      containerSelector: options.containerSelector || '#hotspotContainer',
      dialogSelector: options.dialogSelector || '#multiParameterDialog',
      dialogOffset: options.dialogOffset || { x: 20, y: 20 },
      ...options
    };
    
    this.hotspots = new Map(); // Map of section ID to hotspot data
    this.activeHotspots = new Set(); // Currently visible hotspot elements
    this.selectedHotspots = new Set(); // Selected hotspot IDs for dialog
    this.currentSection = 0;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.container = null;
    this.singleDialog = null;
    this.dialogContainer = null;
    this.isInitialized = false;
    
    // Bind methods
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  /**
   * Initialize the hotspot manager
   */
  async init() {
    if (this.isInitialized) return;
    
    console.log('🎯 Initializing Single-Dialog HotspotManager...');
    console.log(`📱 Mobile mode: ${this.isMobile}`);
    
    // Find or create containers
    this.container = document.querySelector(this.options.containerSelector);
    if (!this.container) {
      console.warn('⚠️ Hotspot container not found, creating one...');
      this.container = this.createHotspotContainer();
    } else {
      console.log('✅ Hotspot container found');
    }
    
    // Create single dialog container
    this.createSingleDialog();
    console.log('✅ Single dialog created');
    
    // Load hotspot data
    await this.loadHotspotData();
    
    // Setup event listeners
    this.setupEventListeners();
    console.log('✅ Event listeners setup');
    
    this.isInitialized = true;
    console.log('✅ Single-Dialog HotspotManager initialized successfully');
    console.log(`📊 Loaded hotspots for ${this.hotspots.size} sections`);
  }

  /**
   * Load hotspot data from external file
   */
  async loadHotspotData() {
    try {
      // Check if hotspot data is already loaded globally
      if (window.TesseractHotspots) {
        this.processHotspotData(window.TesseractHotspots);
        return;
      }
      
      // Try to load from external file
      const response = await fetch(`${this.options.basePath}hotspots.js`);
      if (response.ok) {
        const hotspotScript = await response.text();
        
        // Safely evaluate the script to get hotspot data
        const scriptElement = document.createElement('script');
        scriptElement.textContent = hotspotScript;
        document.head.appendChild(scriptElement);
        document.head.removeChild(scriptElement);
        
        if (window.TesseractHotspots) {
          this.processHotspotData(window.TesseractHotspots);
        } else {
          throw new Error('Hotspot data not found after loading script');
        }
      } else {
        console.warn('⚠️ External hotspot file not found, using embedded data');
        this.loadEmbeddedHotspotData();
      }
    } catch (error) {
      console.warn('⚠️ Failed to load external hotspot data:', error.message);
      this.loadEmbeddedHotspotData();
    }
  }

  /**
   * Process loaded hotspot data into internal structure
   */
  processHotspotData(hotspotData) {
    if (!hotspotData || !hotspotData.sections) {
      throw new Error('Invalid hotspot data structure');
    }
    
    // Convert array to Map for efficient lookup
    hotspotData.sections.forEach(section => {
      if (section.hotspots && section.hotspots.length > 0) {
        this.hotspots.set(section.sectionId, section.hotspots);
      }
    });
    
    console.log(`📍 Loaded hotspots for ${this.hotspots.size} sections`);
  }

  /**
   * Fallback: Load embedded hotspot data from content.js
   */
  loadEmbeddedHotspotData() {
    if (window.TesseractContent && window.TesseractContent.tutorial.sections) {
      window.TesseractContent.tutorial.sections.forEach(section => {
        if (section.hotspots && section.hotspots.length > 0) {
          this.hotspots.set(section.id, section.hotspots);
        }
      });
      console.log('📍 Using embedded hotspot data from content.js');
    }
  }

  /**
   * Create hotspot container if it doesn't exist
   */
  createHotspotContainer() {
    const container = document.createElement('div');
    container.id = 'hotspotContainer';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    `;
    
    // Try to add to static image container
    const staticImageContainer = document.getElementById('staticImageContainer');
    if (staticImageContainer) {
      staticImageContainer.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
    
    return container;
  }

  /**
   * Create single dialog for all parameters
   */
  createSingleDialog() {
    this.dialogContainer = document.createElement('div');
    this.dialogContainer.id = 'singleDialogContainer';
    this.dialogContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
    `;
    
    this.singleDialog = document.createElement('div');
    this.singleDialog.id = 'multiParameterDialog';
    this.singleDialog.className = 'single-parameter-dialog';
    this.singleDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a1a2e;
      border: 2px solid #444;
      border-radius: 8px;
      padding: 1rem;
      max-width: 500px;
      min-width: 300px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 5px 20px rgba(0,0,0,0.9);
      backdrop-filter: blur(10px);
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: auto;
      display: none;
      z-index: 5000;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #333;
    `;
    
    const title = document.createElement('h4');
    title.textContent = 'Parameters';
    title.style.cssText = `
      color: #00ffff;
      margin: 0;
      font-size: 1rem;
      font-weight: bold;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: #ff4757;
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
    `;
    closeBtn.addEventListener('click', () => {
      console.log('🎯 Close button clicked');
      this.closeAllParameters();
    });
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#ff6b7a';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = '#ff4757';
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    this.singleDialog.appendChild(header);
    
    // Create content container
    const content = document.createElement('div');
    content.id = 'dialogParameterContent';
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;
    this.singleDialog.appendChild(content);
    
    this.dialogContainer.appendChild(this.singleDialog);
    document.body.appendChild(this.dialogContainer);
    
    console.log('✅ Single dialog created and added to DOM');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', this.handleWindowResize);
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeyPress);
  }

  /**
   * Update hotspots for a specific section
   */
  updateHotspots(sectionId) {
    this.currentSection = sectionId;
    this.clearHotspots();
    
    const sectionHotspots = this.hotspots.get(sectionId);
    if (!sectionHotspots || sectionHotspots.length === 0) {
      console.log(`ℹ️ No hotspots found for section ${sectionId}`);
      return;
    }
    
    const windowWidth = window.innerWidth;
    const isMobileView = windowWidth <= 768;
    const isNarrowDesktopView = windowWidth > 768 && windowWidth <= 1024;
    const isWideDesktopView = windowWidth > 1024;
    
    console.log(`📏 Window width: ${windowWidth}px`);
    console.log(`📱 Mobile: ${isMobileView}, Narrow: ${isNarrowDesktopView}, Wide: ${isWideDesktopView}`);
    
    if (isMobileView || isNarrowDesktopView) {
      // Mobile OR narrow desktop: Add parameter images to section content
      console.log(`📋 Adding parameter images to section content`);
      this.addMobileParameterContent(sectionId, sectionHotspots);
      return;
    }
    
    if (isWideDesktopView) {
      console.log(`🎯 Creating interactive hotspots for section ${sectionId}: ${sectionHotspots.length} hotspots`);
      
      sectionHotspots.forEach((hotspotConfig, index) => {
        this.createHotspot(hotspotConfig, index);
      });
      
      console.log(`✅ Created ${this.activeHotspots.size} hotspots`);
    }
  }

  /**
   * Check if we're in narrow desktop view (when columns stack)
   */
  isNarrowDesktop() {
    const width = window.innerWidth;
    const isNarrow = width > 768 && width <= 1024;
    console.log(`📏 isNarrowDesktop check: ${width}px = ${isNarrow}`);
    return isNarrow;
  }

  /**
   * Create individual hotspot element
   */
  createHotspot(config, index) {
    const clickArea = document.createElement('div');
    clickArea.className = 'hotspot-click-area';
    clickArea.style.cssText = `
      position: absolute;
      top: ${config.position.y * 100}%;
      left: ${config.position.x * 100}%;
      width: 45px;
      height: 45px;
      cursor: pointer;
      pointer-events: auto;
      transform: translate(-50%, -50%);
      z-index: 6000;
      border-radius: 50%;
      background: rgba(255, 0, 0, 0.1);
    `;
    
    // Create visual hotspot
    const hotspot = document.createElement('div');
    hotspot.className = 'hotspot';
    hotspot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 15px;
      height: 15px;
      background: #00ffff;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
      animation: pulse-small 2s infinite;
      border: 2px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
      pointer-events: none;
      transform: translate(-50%, -50%);
    `;
    
    clickArea.appendChild(hotspot);
    
    clickArea.dataset.hotspotId = config.id;
    clickArea.dataset.index = index;
    
    console.log(`🎯 Creating hotspot ${config.id} at (${config.position.x * 100}%, ${config.position.y * 100}%)`);
    
    // Event listeners
    clickArea.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`🎯 Hotspot ${config.id} clicked`);
      this.toggleParameter(config, clickArea, hotspot);
    });
    
    clickArea.addEventListener('mouseenter', () => {
      console.log(`🎯 Hotspot ${config.id} hover enter`);
      hotspot.style.transform = 'translate(-50%, -50%) scale(1.5)';
      hotspot.style.background = '#ff00ff';
      hotspot.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.8)';
      hotspot.style.animation = 'none';
    });
    
    clickArea.addEventListener('mouseleave', () => {
      console.log(`🎯 Hotspot ${config.id} hover leave`);
      if (!this.selectedHotspots.has(config.id)) {
        hotspot.style.transform = 'translate(-50%, -50%) scale(1)';
        hotspot.style.background = '#00ffff';
        hotspot.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.7)';
        hotspot.style.animation = 'pulse-small 2s infinite';
      }
    });
    
    if (!this.container) {
      console.error('❌ Hotspot container not found!');
      return;
    }
    
    this.container.appendChild(clickArea);
    this.activeHotspots.add(clickArea);
    
    console.log(`✅ Hotspot ${config.id} created and added to container`);
    console.log(`📊 Container children count: ${this.container.children.length}`);
    console.log(`📊 Active hotspots count: ${this.activeHotspots.size}`);
  }

  /**
   * Toggle parameter in single dialog
   */
  toggleParameter(config, clickArea, visualHotspot) {
    console.log(`🎯 Toggling parameter ${config.id}`);
    
    if (this.selectedHotspots.has(config.id)) {
      // Remove parameter
      this.selectedHotspots.delete(config.id);
      clickArea.classList.remove('selected');
      
      // Reset visual styling
      visualHotspot.style.transform = 'translate(-50%, -50%) scale(1)';
      visualHotspot.style.background = '#00ffff';
      visualHotspot.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.7)';
      visualHotspot.style.animation = 'pulse-small 2s infinite';
      
      console.log(`➖ Removed parameter ${config.id}`);
    } else {
      // Add parameter
      this.selectedHotspots.add(config.id);
      clickArea.classList.add('selected');
      
      // Set selected styling
      visualHotspot.style.transform = 'translate(-50%, -50%) scale(1.8)';
      visualHotspot.style.background = '#ffff00';
      visualHotspot.style.boxShadow = '0 0 25px rgba(255, 255, 0, 0.8)';
      visualHotspot.style.animation = 'none';
      
      console.log(`➕ Added parameter ${config.id}`);
    }
    
    this.updateSingleDialog();
  }

  /**
   * Update the single dialog with selected parameters
   */
  updateSingleDialog() {
    const content = document.getElementById('dialogParameterContent');
    if (!content) {
      console.error('❌ Dialog content container not found');
      return;
    }
    
    // Clear existing content
    content.innerHTML = '';
    
    if (this.selectedHotspots.size === 0) {
      console.log('🎯 No hotspots selected, hiding dialog');
      this.singleDialog.style.display = 'none';
      this.singleDialog.style.opacity = '0';
      return;
    }
    
    console.log(`🎯 Showing dialog with ${this.selectedHotspots.size} parameters`);
    
    // Show dialog
    this.singleDialog.style.display = 'block';
    this.singleDialog.style.visibility = 'visible';
    this.singleDialog.style.zIndex = '5000';
    
    setTimeout(() => {
      this.singleDialog.style.opacity = '1';
      this.singleDialog.style.transform = 'scale(1)';
      console.log('✅ Dialog should now be visible');
    }, 10);
    
    // Add selected parameters
    const currentSectionHotspots = this.hotspots.get(this.currentSection) || [];
    this.selectedHotspots.forEach(hotspotId => {
      const config = currentSectionHotspots.find(h => h.id === hotspotId);
      if (config) {
        console.log(`📸 Adding parameter ${hotspotId} to dialog`);
        this.addParameterToDialog(config, content);
      }
    });
    
    console.log(`📊 Dialog updated with ${this.selectedHotspots.size} parameters`);
  }

  /**
   * Add parameter image to dialog
   */
  addParameterToDialog(config, container) {
    const paramContainer = document.createElement('div');
    paramContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Parameter image only (no title since it's in the image)
    if (config.content.type === 'image' && config.content.source) {
      const img = document.createElement('img');
      let imagePath = config.content.source;
      if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
        imagePath = `${this.options.basePath}${imagePath}`;
      }
      
      img.src = imagePath;
      img.alt = config.content.title || config.id;
      img.style.cssText = `
        width: 100%;
        max-width: 400px;
        height: auto;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      `;
      
      img.onload = () => {
        console.log(`✅ Parameter image loaded: ${imagePath}`);
      };
      
      img.onerror = () => {
        console.error(`❌ Failed to load parameter image: ${imagePath}`);
        paramContainer.innerHTML = `
          <p style="color: #ff6b6b; text-align: center; padding: 0.5rem; font-size: 0.8rem;">
            Failed to load: ${config.content.source}
          </p>
        `;
      };
      
      paramContainer.appendChild(img);
    }
    
    container.appendChild(paramContainer);
  }

  /**
   * Close all parameters and hide dialog
   */
  closeAllParameters() {
    console.log('🎯 Closing all parameters');
    
    // Clear all selections
    this.selectedHotspots.clear();
    
    // Reset all hotspot styling
    this.activeHotspots.forEach(clickArea => {
      clickArea.classList.remove('selected');
      const visualHotspot = clickArea.querySelector('.hotspot');
      if (visualHotspot) {
        visualHotspot.style.transform = 'translate(-50%, -50%) scale(1)';
        visualHotspot.style.background = '#00ffff';
        visualHotspot.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.7)';
        visualHotspot.style.animation = 'pulse-small 2s infinite';
      }
    });
    
    // Hide dialog
    this.singleDialog.style.opacity = '0';
    this.singleDialog.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.singleDialog.style.display = 'none';
    }, 300);
  }

  /**
   * Add parameter images to section content on mobile
   */
  addMobileParameterContent(sectionId, hotspots) {
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!sectionElement) {
      console.warn(`⚠️ Section element not found for section ${sectionId}`);
      return;
    }
    
    // Remove any existing mobile parameters
    const existingParams = sectionElement.querySelector('.mobile-parameters');
    if (existingParams) {
      existingParams.remove();
    }
    
    // Create mobile parameters container
    const mobileParams = document.createElement('div');
    mobileParams.className = 'mobile-parameters';
    mobileParams.style.cssText = `
      display: block !important;
      margin: 2rem 0 1rem 0;
      padding: 0.8rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: 100%;
      box-sizing: border-box;
    `;
    
    // Add each parameter image (no titles since they're in the images)
    hotspots.forEach((hotspot, index) => {
      if (hotspot.content && hotspot.content.type === 'image' && hotspot.content.source) {
        // Individual parameter container
        const paramContainer = document.createElement('div');
        paramContainer.style.cssText = `
          margin-bottom: ${index === hotspots.length - 1 ? '0' : '1rem'};
          text-align: center;
        `;
        
        // Parameter image only (no title)
        const img = document.createElement('img');
        img.src = `${this.options.basePath}${hotspot.content.source}`;
        img.alt = hotspot.content.title || hotspot.id;
        img.style.cssText = `
          width: 100%;
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        img.onerror = () => {
          paramContainer.innerHTML = `
            <p style="color: #ff6b6b; font-style: italic; text-align: center; padding: 0.5rem; font-size: 0.8rem;">
              Failed to load: ${hotspot.content.source}
            </p>
          `;
        };
        
        paramContainer.appendChild(img);
        mobileParams.appendChild(paramContainer);
      }
    });
    
    // Add to end of section
    sectionElement.appendChild(mobileParams);
    
    console.log(`📱 Added ${hotspots.length} parameter images to mobile section ${sectionId}`);
  }

  /**
   * Clear all hotspots and mobile content
   */
  clearHotspots() {
    // Close dialog and clear selections
    this.closeAllParameters();
    
    // Clear desktop hotspots
    this.activeHotspots.forEach(clickArea => {
      if (clickArea.parentNode) {
        clickArea.parentNode.removeChild(clickArea);
      }
    });
    this.activeHotspots.clear();
    
    // Clear mobile parameter content
    const mobileParams = document.querySelectorAll('.mobile-parameters');
    mobileParams.forEach(param => {
      if (param.parentNode) {
        param.parentNode.removeChild(param);
      }
    });
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    // Re-evaluate display mode when window resizes
    if (this.currentSection > 0) {
      const wasNarrow = this.isNarrowDesktop();
      // Small delay to let resize complete
      setTimeout(() => {
        const isNarrowNow = this.isNarrowDesktop();
        if (wasNarrow !== isNarrowNow) {
          // Display mode changed, update hotspots
          this.updateHotspots(this.currentSection);
        }
      }, 100);
    }
  }

  /**
   * Handle document click
   */
  handleDocumentClick(event) {
    // Don't close if clicking on hotspots or dialog
    if (event.target.closest('.hotspot-click-area') || 
        event.target.closest('.single-parameter-dialog')) {
      return;
    }
    
    // Close dialog when clicking outside
    if (this.selectedHotspots.size > 0) {
      this.closeAllParameters();
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyPress(event) {
    if (event.key === 'Escape') {
      this.closeAllParameters();
    }
  }

  /**
   * Get hotspot data for a section
   */
  getHotspotsForSection(sectionId) {
    return this.hotspots.get(sectionId) || [];
  }

  /**
   * Check if mobile mode
   */
  isMobileMode() {
    return this.isMobile;
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.clearHotspots();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleWindowResize);
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeyPress);
    
    // Remove dialog container
    if (this.dialogContainer && this.dialogContainer.parentNode) {
      this.dialogContainer.parentNode.removeChild(this.dialogContainer);
    }
    
    this.isInitialized = false;
    console.log('🎯 Single-Dialog HotspotManager destroyed');
  }

  /**
   * Static method for quick initialization
   */
  static async create(options = {}) {
    const manager = new HotspotManager(options);
    await manager.init();
    
    // Make debug functions globally accessible
    window.debugHotspots = () => manager.debugDialog();
    window.createTestHotspot = () => manager.createTestHotspot();
    
    console.log('🛠️ Debug functions available:');
    console.log('  - debugHotspots() - Shows detailed debug info');
    console.log('  - createTestHotspot() - Creates a test hotspot for debugging');
    
    return manager;
  }

  /**
   * Debug dialog visibility
   */
  debugDialog() {
    console.log('🔍 Dialog Debug Info:');
    console.log('- Dialog element:', this.singleDialog);
    console.log('- Dialog display:', this.singleDialog?.style.display);
    console.log('- Dialog opacity:', this.singleDialog?.style.opacity);
    console.log('- Dialog z-index:', this.singleDialog?.style.zIndex);
    console.log('- Selected hotspots:', this.selectedHotspots.size);
    console.log('- Current section:', this.currentSection);
    console.log('- Window width:', window.innerWidth);
    console.log('- Is mobile:', this.isMobile);
    console.log('- Is narrow desktop:', this.isNarrowDesktop());
    
    // Check if dialog is in DOM
    const dialogInDOM = this.singleDialog ? document.contains(this.singleDialog) : false;
    console.log('- Dialog in DOM:', dialogInDOM);
    
    // Check computed styles
    if (dialogInDOM && this.singleDialog) {
      const computed = window.getComputedStyle(this.singleDialog);
      console.log('- Computed display:', computed.display);
      console.log('- Computed visibility:', computed.visibility);
      console.log('- Computed z-index:', computed.zIndex);
    }
    
    // Check hotspots
    console.log('- Active hotspots count:', this.activeHotspots.size);
    console.log('- Container element:', this.container);
    console.log('- Container children:', this.container?.children.length);
    
    // Check section hotspots data
    const sectionHotspots = this.hotspots.get(this.currentSection);
    console.log('- Section hotspot data:', sectionHotspots);
    
    // List all active hotspots
    this.activeHotspots.forEach((hotspot, index) => {
      console.log(`  Hotspot ${index}:`, {
        id: hotspot.dataset.hotspotId,
        position: hotspot.style.top + ', ' + hotspot.style.left,
        display: hotspot.style.display,
        visibility: window.getComputedStyle(hotspot).visibility
      });
    });
  }

  /**
   * Force create a test hotspot for debugging
   */
  createTestHotspot() {
    console.log('🧪 Creating test hotspot for debugging...');
    
    const testConfig = {
      id: 'test-hotspot',
      position: { x: 0.5, y: 0.5 },
      content: {
        type: 'image',
        source: 'assets/parameters/select1.png',
        title: 'Test Hotspot'
      }
    };
    
    this.createHotspot(testConfig, 999);
    console.log('✅ Test hotspot created');
  }

  // Legacy compatibility methods
  hideAllDialogs() { this.closeAllParameters(); }
  hideDialog() { this.closeAllParameters(); }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HotspotManager;
} else if (typeof window !== 'undefined') {
  window.HotspotManager = HotspotManager;
}

// Add CSS for single dialog system
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Single dialog styling */
    .single-parameter-dialog {
      z-index: 50 !important;
    }
    
    .single-parameter-dialog.active {
      opacity: 1 !important;
      transform: scale(1) !important;
    }
    
    /* Hotspot styling - always on top */
    .hotspot-click-area {
      z-index: 100 !important;
      pointer-events: auto !important;
    }
    
    .hotspot-click-area.selected .hotspot {
      transform: translate(-50%, -50%) scale(1.8) !important;
      background: #ffff00 !important;
      box-shadow: 0 0 25px rgba(255, 255, 0, 0.8) !important;
      animation: none !important;
    }
    
    /* Mobile parameters - force display */
    @media (max-width: 768px) {
      .mobile-parameters {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        margin: 2rem 0 1rem 0 !important;
        padding: 1rem !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      
      .mobile-parameters h4 {
        color: #00ffff !important;
        margin: 0 0 1rem 0 !important;
        font-size: 1rem !important;
        font-weight: bold !important;
        text-align: center !important;
      }
      
      .mobile-parameters img {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        border-radius: 4px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
      
      /* Hide desktop hotspots on mobile */
      .hotspot-click-area {
        display: none !important;
      }
    }
    
    /* Desktop - hide mobile parameters */
    @media (min-width: 769px) {
      .mobile-parameters {
        display: none !important;
      }
    }
    
    /* Small hotspot animations */
    @keyframes pulse-small {
      0%, 100% { 
        transform: translate(-50%, -50%) scale(1); 
        opacity: 1; 
      }
      50% { 
        transform: translate(-50%, -50%) scale(1.3); 
        opacity: 0.7; 
      }
    }
    
    /* Dialog scrollbar styling */
    .single-parameter-dialog::-webkit-scrollbar {
      width: 8px;
    }
    
    .single-parameter-dialog::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .single-parameter-dialog::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }
    
    .single-parameter-dialog::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  `;
  document.head.appendChild(style);
}
