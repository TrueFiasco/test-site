/**
 * HotspotManager - Enhanced Hotspot System for Tutorial Framework
 * Handles intelligent positioning, collision avoidance, and multi-dialog management
 */
class HotspotManager {
  constructor(options = {}) {
    this.options = {
      basePath: options.basePath || 'tutorials/tesseract/',
      containerSelector: options.containerSelector || '#hotspotContainer',
      dialogSelector: options.dialogSelector || '#parameterDialog',
      enableCollisionAvoidance: options.enableCollisionAvoidance !== false,
      enableMultiDialog: options.enableMultiDialog !== false,
      dialogOffset: options.dialogOffset || { x: 10, y: 0 },
      maxDialogs: options.maxDialogs || 5,
      ...options
    };
    
    this.hotspots = new Map(); // Map of section ID to hotspot data
    this.activeHotspots = new Set(); // Currently visible hotspots
    this.stickyHotspots = new Set(); // Click-to-pin hotspots
    this.activeDialogs = new Map(); // Currently open dialogs
    this.currentSection = 0;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.container = null;
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
    
    console.log('🎯 Initializing HotspotManager...');
    console.log(`📱 Mobile mode: ${this.isMobile}`);
    
    // Find or create containers
    this.container = document.querySelector(this.options.containerSelector);
    if (!this.container) {
      console.warn('⚠️ Hotspot container not found, creating one...');
      this.container = this.createHotspotContainer();
    } else {
      console.log('✅ Hotspot container found');
    }
    
    // Create dialog container for multi-dialog support
    this.createDialogContainer();
    console.log('✅ Dialog container created');
    
    // Load hotspot data
    await this.loadHotspotData();
    
    // Setup event listeners
    this.setupEventListeners();
    console.log('✅ Event listeners setup');
    
    this.isInitialized = true;
    console.log('✅ HotspotManager initialized successfully');
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
      z-index: 50;
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
   * Create dialog container for multi-dialog support
   */
  createDialogContainer() {
    this.dialogContainer = document.createElement('div');
    this.dialogContainer.id = 'multiDialogContainer';
    this.dialogContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5000;
    `;
    document.body.appendChild(this.dialogContainer);
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
      return;
    }
    
    if (this.isMobile) {
      // Mobile: Add parameter images to section content instead of hotspots
      this.addMobileParameterContent(sectionId, sectionHotspots);
      return;
    }
    
    console.log(`🎯 Updating hotspots for section ${sectionId}: ${sectionHotspots.length} hotspots`);
    
    sectionHotspots.forEach((hotspotConfig, index) => {
      this.createHotspot(hotspotConfig, index);
    });
  }

  /**
   * Add parameter images to section content on mobile
   */
  addMobileParameterContent(sectionId, hotspots) {
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (!sectionElement) return;
    
    // Remove any existing mobile parameters
    const existingParams = sectionElement.querySelector('.mobile-parameters');
    if (existingParams) {
      existingParams.remove();
    }
    
    // Create mobile parameters container
    const mobileParams = document.createElement('div');
    mobileParams.className = 'mobile-parameters';
    mobileParams.style.cssText = `
      display: block;
      margin: 2rem 0;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      z-index: 25;
      position: relative;
      clear: both;
    `;
    
    const title = document.createElement('h4');
    title.textContent = 'Parameters';
    title.style.cssText = `
      color: #00ffff;
      margin-bottom: 1rem;
      font-size: 1rem;
    `;
    mobileParams.appendChild(title);
    
    // Add each parameter image
    hotspots.forEach(hotspot => {
      if (hotspot.content && hotspot.content.type === 'image' && hotspot.content.source) {
        const img = document.createElement('img');
        img.src = `${this.options.basePath}${hotspot.content.source}`;
        img.alt = hotspot.content.title || hotspot.id;
        img.style.cssText = `
          width: 100%;
          border-radius: 5px;
          margin-bottom: 1.5rem;
        `;
        
        // Add title above image
        const imgTitle = document.createElement('p');
        imgTitle.textContent = hotspot.content.title || hotspot.id;
        imgTitle.style.cssText = `
          color: #00ffff;
          font-weight: bold;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        `;
        
        mobileParams.appendChild(imgTitle);
        mobileParams.appendChild(img);
      }
    });
    
    // Add to end of section
    sectionElement.appendChild(mobileParams);
    
    console.log(`📱 Added ${hotspots.length} parameter images to mobile section ${sectionId}`);
  }

  /**
   * Create individual hotspot element
   */
  createHotspot(config, index) {
    const hotspot = document.createElement('div');
    hotspot.className = 'hotspot';
    hotspot.style.cssText = `
      position: absolute;
      top: ${config.position.y * 100}%;
      left: ${config.position.x * 100}%;
      width: 30px;
      height: 30px;
      background: #00ffff;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 22px rgba(0, 255, 255, 0.7);
      animation: pulse 2s infinite;
      border: 3px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      z-index: 50;
      pointer-events: auto;
      transform: translate(-50%, -50%);
    `;
    
    hotspot.dataset.hotspotId = config.id;
    hotspot.dataset.index = index;
    
    console.log(`🎯 Creating hotspot ${config.id} at (${config.position.x}, ${config.position.y})`);
    
    // Event listeners with debugging
    hotspot.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`🎯 Hotspot ${config.id} clicked`);
      this.toggleStickyDialog(config, hotspot);
    });
    
    hotspot.addEventListener('mouseenter', (e) => {
      console.log(`🎯 Hotspot ${config.id} mouseenter`);
      if (!this.stickyHotspots.has(hotspot)) {
        this.showDialog(config, hotspot);
      }
    });
    
    hotspot.addEventListener('mouseleave', (e) => {
      console.log(`🎯 Hotspot ${config.id} mouseleave`);
      if (!this.stickyHotspots.has(hotspot)) {
        this.scheduleHideDialog(config.id, hotspot);
      }
    });
    
    // Add hover styling via CSS
    hotspot.addEventListener('mouseenter', () => {
      hotspot.style.transform = 'translate(-50%, -50%) scale(1.3)';
      hotspot.style.background = '#ff00ff';
      hotspot.style.boxShadow = '0 0 35px rgba(255, 0, 255, 0.8)';
      hotspot.style.animation = 'none';
    });
    
    hotspot.addEventListener('mouseleave', () => {
      if (!this.stickyHotspots.has(hotspot)) {
        hotspot.style.transform = 'translate(-50%, -50%) scale(1)';
        hotspot.style.background = '#00ffff';
        hotspot.style.boxShadow = '0 0 22px rgba(0, 255, 255, 0.7)';
        hotspot.style.animation = 'pulse 2s infinite';
      }
    });
    
    this.container.appendChild(hotspot);
    this.activeHotspots.add(hotspot);
    
    console.log(`✅ Hotspot ${config.id} created and added to container`);
  }

  /**
   * Show parameter dialog with smart positioning
   */
  showDialog(config, sourceHotspot = null) {
    const dialogId = config.id;
    
    // If dialog already exists, don't create another
    if (this.activeDialogs.has(dialogId)) {
      console.log(`🎯 Dialog ${dialogId} already active`);
      return;
    }
    
    console.log(`🎯 Creating dialog for ${dialogId}`);
    
    const dialog = this.createDialog(config, sourceHotspot);
    this.activeDialogs.set(dialogId, {
      element: dialog,
      config: config,
      sourceHotspot: sourceHotspot
    });
    
    this.dialogContainer.appendChild(dialog);
    
    // Position dialog with collision avoidance
    this.positionDialog(dialog, sourceHotspot);
    
    // Show dialog
    setTimeout(() => {
      dialog.classList.add('active');
      console.log(`✅ Dialog ${dialogId} now visible`);
    }, 10);
  }

  /**
   * Create dialog element
   */
  createDialog(config, sourceHotspot) {
    const dialog = document.createElement('div');
    dialog.className = 'parameter-dialog multi-dialog';
    dialog.dataset.dialogId = config.id;
    
    dialog.style.cssText = `
      position: fixed;
      background: #1a1a2e;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 1rem;
      max-width: 600px;
      min-width: 300px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.8);
      z-index: 5000;
      opacity: 0;
      pointer-events: auto;
      backdrop-filter: blur(10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: scale(0.95);
      display: block;
    `;
    
    // Create header
    const header = document.createElement('h4');
    header.style.cssText = `
      color: #00ffff;
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: bold;
      border-bottom: 1px solid #333;
      padding-bottom: 0.5rem;
    `;
    header.textContent = config.content.title || config.id;
    dialog.appendChild(header);
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.style.cssText = `
      min-height: 50px;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;
    
    // Add image
    if (config.content.type === 'image' && config.content.source) {
      const img = document.createElement('img');
      
      // Fix path resolution - ensure full path
      let imagePath = config.content.source;
      if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
        imagePath = `${this.options.basePath}${imagePath}`;
      }
      
      img.src = imagePath;
      img.alt = config.content.title || config.id;
      img.style.cssText = `
        width: 100%;
        max-width: 525px;
        border-radius: 5px;
        margin-top: 0.5rem;
        transition: opacity 0.3s ease;
      `;
      
      console.log(`🖼️ Loading image: ${imagePath}`);
      
      img.onload = () => {
        console.log(`✅ Image loaded successfully: ${imagePath}`);
      };
      
      img.onerror = () => {
        console.error(`❌ Failed to load image: ${imagePath}`);
        content.innerHTML = `
          <p style="color: #ff6b6b; font-style: italic; text-align: center; padding: 1rem; background: rgba(255, 107, 107, 0.1); border-radius: 5px; border: 1px solid rgba(255, 107, 107, 0.3);">
            Failed to load parameter image:<br><code>${config.content.source}</code>
          </p>
        `;
      };
      
      content.appendChild(img);
    }
    
    dialog.appendChild(content);
    
    // Add close button for sticky dialogs
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      background: #333;
      border: 1px solid #555;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 1rem;
      transition: background 0.3s ease;
    `;
    closeBtn.addEventListener('click', () => {
      console.log(`🎯 Closing dialog ${config.id} via button`);
      this.hideDialog(config.id);
    });
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#555';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = '#333';
    });
    dialog.appendChild(closeBtn);
    
    return dialog;
  }

  /**
   * Position dialog with smart collision avoidance
   */
  positionDialog(dialog, sourceHotspot) {
    if (!sourceHotspot) {
      // Fallback positioning if no source hotspot
      dialog.style.left = '50px';
      dialog.style.top = '50px';
      console.log('🎯 Using fallback dialog positioning');
      return;
    }
    
    const hotspotRect = sourceHotspot.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Calculate base position (to the right of hotspot)
    let x = hotspotRect.right + this.options.dialogOffset.x;
    let y = hotspotRect.top + this.options.dialogOffset.y;
    
    // Get dialog dimensions (estimate if not rendered yet)
    const dialogRect = dialog.getBoundingClientRect();
    const dialogWidth = dialogRect.width || 300;
    const dialogHeight = dialogRect.height || 200;
    
    // Collision avoidance with screen edges
    if (x + dialogWidth > viewport.width - 20) {
      x = hotspotRect.left - dialogWidth - this.options.dialogOffset.x;
    }
    
    if (y + dialogHeight > viewport.height - 20) {
      y = viewport.height - dialogHeight - 20;
    }
    
    if (y < 20) {
      y = 20;
    }
    
    if (x < 10) {
      x = 10;
    }
    
    // Collision avoidance with other dialogs
    if (this.options.enableCollisionAvoidance) {
      const adjustment = this.findDialogCollisionAdjustment(x, y, dialogWidth, dialogHeight);
      x += adjustment.x;
      y += adjustment.y;
    }
    
    const finalX = Math.max(10, Math.min(x, viewport.width - dialogWidth - 10));
    const finalY = Math.max(10, Math.min(y, viewport.height - dialogHeight - 10));
    
    dialog.style.left = `${finalX}px`;
    dialog.style.top = `${finalY}px`;
    
    console.log(`🎯 Positioned dialog at (${finalX}, ${finalY})`);
  }

  /**
   * Find collision adjustment for dialog positioning
   */
  findDialogCollisionAdjustment(x, y, width, height) {
    let adjustment = { x: 0, y: 0 };
    
    this.activeDialogs.forEach((dialogData, dialogId) => {
      const otherDialog = dialogData.element;
      if (!otherDialog.classList.contains('active')) return;
      
      const otherRect = otherDialog.getBoundingClientRect();
      
      // Check for overlap
      if (this.rectsOverlap(
        { x, y, width, height },
        { x: otherRect.left, y: otherRect.top, width: otherRect.width, height: otherRect.height }
      )) {
        // Adjust position to avoid overlap
        adjustment.y += height + 20; // Stack vertically
      }
    });
    
    return adjustment;
  }

  /**
   * Check if two rectangles overlap
   */
  rectsOverlap(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y);
  }

  /**
   * Toggle sticky dialog (click-to-pin)
   */
  toggleStickyDialog(config, hotspot) {
    console.log(`🎯 Toggling sticky dialog for ${config.id}`);
    
    if (this.stickyHotspots.has(hotspot)) {
      // Remove from sticky
      console.log(`📌 Removing sticky state from ${config.id}`);
      this.stickyHotspots.delete(hotspot);
      hotspot.classList.remove('sticky');
      
      // Reset hotspot styling
      hotspot.style.transform = 'translate(-50%, -50%) scale(1)';
      hotspot.style.background = '#00ffff';
      hotspot.style.boxShadow = '0 0 22px rgba(0, 255, 255, 0.7)';
      hotspot.style.animation = 'pulse 2s infinite';
      
      this.hideDialog(config.id);
    } else {
      // Add to sticky
      console.log(`📌 Adding sticky state to ${config.id}`);
      this.stickyHotspots.add(hotspot);
      hotspot.classList.add('sticky');
      
      // Set sticky styling
      hotspot.style.transform = 'translate(-50%, -50%) scale(1.3)';
      hotspot.style.background = '#ffff00';
      hotspot.style.boxShadow = '0 0 35px rgba(255, 255, 0, 0.8)';
      hotspot.style.animation = 'none';
      
      this.showDialog(config, hotspot);
    }
  }

  /**
   * Schedule dialog hide with delay
   */
  scheduleHideDialog(dialogId, sourceHotspot = null) {
    setTimeout(() => {
      if (!this.stickyHotspots.has(sourceHotspot)) {
        this.hideDialog(dialogId);
      }
    }, 100);
  }

  /**
   * Hide specific dialog
   */
  hideDialog(dialogId) {
    const dialogData = this.activeDialogs.get(dialogId);
    if (!dialogData) return;
    
    const dialog = dialogData.element;
    dialog.classList.remove('active');
    
    setTimeout(() => {
      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
      this.activeDialogs.delete(dialogId);
    }, 300);
  }

  /**
   * Hide all dialogs
   */
  hideAllDialogs() {
    this.activeDialogs.forEach((dialogData, dialogId) => {
      this.hideDialog(dialogId);
    });
    
    // Clear sticky hotspots
    this.stickyHotspots.forEach(hotspot => {
      hotspot.classList.remove('sticky');
    });
    this.stickyHotspots.clear();
  }

  /**
   * Clear all hotspots
   */
  clearHotspots() {
    this.hideAllDialogs();
    
    // Clear desktop hotspots
    this.activeHotspots.forEach(hotspot => {
      if (hotspot.parentNode) {
        hotspot.parentNode.removeChild(hotspot);
      }
    });
    
    // Clear mobile parameter content
    if (this.isMobile) {
      const mobileParams = document.querySelectorAll('.mobile-parameters');
      mobileParams.forEach(param => {
        if (param.parentNode) {
          param.parentNode.removeChild(param);
        }
      });
    }
    
    this.activeHotspots.clear();
    this.stickyHotspots.clear();
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    // Reposition active dialogs
    this.activeDialogs.forEach((dialogData, dialogId) => {
      if (dialogData.sourceHotspot && dialogData.element.classList.contains('active')) {
        this.positionDialog(dialogData.element, dialogData.sourceHotspot);
      }
    });
  }

  /**
   * Handle document click (close non-sticky dialogs)
   */
  handleDocumentClick(event) {
    // Don't close if clicking on a hotspot or dialog
    if (event.target.closest('.hotspot') || event.target.closest('.parameter-dialog')) {
      return;
    }
    
    // Close non-sticky dialogs
    const nonStickyDialogs = [];
    this.activeDialogs.forEach((dialogData, dialogId) => {
      if (!this.stickyHotspots.has(dialogData.sourceHotspot)) {
        nonStickyDialogs.push(dialogId);
      }
    });
    
    nonStickyDialogs.forEach(dialogId => {
      this.hideDialog(dialogId);
    });
  }

  /**
   * Handle keyboard events
   */
  handleKeyPress(event) {
    if (event.key === 'Escape') {
      this.hideAllDialogs();
    }
  }

  /**
   * Get hotspot data for a section
   */
  getHotspotsForSection(sectionId) {
    return this.hotspots.get(sectionId) || [];
  }

  /**
   * Add hotspot data for a section
   */
  addHotspotsForSection(sectionId, hotspots) {
    this.hotspots.set(sectionId, hotspots);
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
    console.log('🎯 HotspotManager destroyed');
  }

  /**
   * Static method for quick initialization
   */
  static async create(options = {}) {
    const manager = new HotspotManager(options);
    await manager.init();
    return manager;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HotspotManager;
} else if (typeof window !== 'undefined') {
  window.HotspotManager = HotspotManager;
}

// Add CSS for multi-dialog support
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .parameter-dialog.multi-dialog.active {
      opacity: 1 !important;
      transform: scale(1) !important;
      display: block !important;
    }
    
    .parameter-dialog.multi-dialog {
      display: block;
      opacity: 0;
      transform: scale(0.95);
    }
    
    .hotspot.sticky {
      transform: translate(-50%, -50%) scale(1.3) !important;
      background: #ffff00 !important;
      box-shadow: 0 0 35px rgba(255, 255, 0, 0.8) !important;
      animation: none !important;
    }
    
    .mobile-parameters {
      display: none;
    }
    
    @media (max-width: 768px) {
      .mobile-parameters {
        display: block !important;
        margin: 2rem 0;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        z-index: 25;
        position: relative;
        clear: both;
      }
      
      .mobile-parameters h4 {
        color: #00ffff;
        margin-bottom: 1rem;
        font-size: 1rem;
      }
      
      .mobile-parameters img {
        width: 100%;
        border-radius: 5px;
        margin-bottom: 1.5rem;
      }
    }
    
    @keyframes pulse {
      0%, 100% { 
        transform: translate(-50%, -50%) scale(1); 
        opacity: 1; 
      }
      50% { 
        transform: translate(-50%, -50%) scale(1.2); 
        opacity: 0.7; 
      }
    }
    
    /* Ensure dialogs are always visible when active */
    .parameter-dialog.multi-dialog.active {
      z-index: 5000 !important;
      pointer-events: auto !important;
      visibility: visible !important;
    }
  `;
  document.head.appendChild(style);
}
