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
    
    // Find or create containers
    this.container = document.querySelector(this.options.containerSelector);
    if (!this.container) {
      console.warn('⚠️ Hotspot container not found, creating one...');
      this.container = this.createHotspotContainer();
    }
    
    // Create dialog container for multi-dialog support
    this.createDialogContainer();
    
    // Load hotspot data
    await this.loadHotspotData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('✅ HotspotManager initialized successfully');
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
    if (this.isMobile) {
      this.clearHotspots();
      return;
    }
    
    this.currentSection = sectionId;
    this.clearHotspots();
    
    const sectionHotspots = this.hotspots.get(sectionId);
    if (!sectionHotspots || sectionHotspots.length === 0) {
      return;
    }
    
    console.log(`🎯 Updating hotspots for section ${sectionId}: ${sectionHotspots.length} hotspots`);
    
    sectionHotspots.forEach((hotspotConfig, index) => {
      this.createHotspot(hotspotConfig, index);
    });
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
    
    // Event listeners
    hotspot.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleStickyDialog(config, hotspot);
    });
    
    hotspot.addEventListener('mouseenter', (e) => {
      if (!this.stickyHotspots.has(hotspot)) {
        this.showDialog(config, hotspot);
      }
    });
    
    hotspot.addEventListener('mouseleave', (e) => {
      if (!this.stickyHotspots.has(hotspot)) {
        this.scheduleHideDialog(config.id, hotspot);
      }
    });
    
    this.container.appendChild(hotspot);
    this.activeHotspots.add(hotspot);
  }

  /**
   * Show parameter dialog with smart positioning
   */
  showDialog(config, sourceHotspot = null) {
    const dialogId = config.id;
    
    // If dialog already exists, don't create another
    if (this.activeDialogs.has(dialogId)) {
      return;
    }
    
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
      img.src = `${this.options.basePath}${config.content.source}`;
      img.alt = config.content.title || config.id;
      img.style.cssText = `
        width: 100%;
        max-width: 525px;
        border-radius: 5px;
        margin-top: 0.5rem;
        transition: opacity 0.3s ease;
      `;
      
      img.onerror = () => {
        content.innerHTML = `
          <p style="color: #ff6b6b; font-style: italic; text-align: center; padding: 1rem;">
            Failed to load parameter image: ${config.content.source}
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
    if (!sourceHotspot) return;
    
    const hotspotRect = sourceHotspot.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Calculate base position (to the right of hotspot)
    let x = hotspotRect.right + this.options.dialogOffset.x;
    let y = hotspotRect.top + this.options.dialogOffset.y;
    
    // Collision avoidance with screen edges
    if (x + dialogRect.width > viewport.width - 20) {
      x = hotspotRect.left - dialogRect.width - this.options.dialogOffset.x;
    }
    
    if (y + dialogRect.height > viewport.height - 20) {
      y = viewport.height - dialogRect.height - 20;
    }
    
    if (y < 20) {
      y = 20;
    }
    
    // Collision avoidance with other dialogs
    if (this.options.enableCollisionAvoidance) {
      const adjustment = this.findDialogCollisionAdjustment(x, y, dialogRect.width, dialogRect.height);
      x += adjustment.x;
      y += adjustment.y;
    }
    
    dialog.style.left = `${Math.max(10, x)}px`;
    dialog.style.top = `${Math.max(10, y)}px`;
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
    if (this.stickyHotspots.has(hotspot)) {
      // Remove from sticky
      this.stickyHotspots.delete(hotspot);
      hotspot.classList.remove('sticky');
      this.hideDialog(config.id);
    } else {
      // Add to sticky
      this.stickyHotspots.add(hotspot);
      hotspot.classList.add('sticky');
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
    
    this.activeHotspots.forEach(hotspot => {
      if (hotspot.parentNode) {
        hotspot.parentNode.removeChild(hotspot);
      }
    });
    
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
      opacity: 1;
      transform: scale(1);
    }
    
    .hotspot.sticky {
      transform: translate(-50%, -50%) scale(1.3);
      background: #ffff00;
      box-shadow: 0 0 35px rgba(255, 255, 0, 0.8);
      animation: none;
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
  `;
  document.head.appendChild(style);
}
