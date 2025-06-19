/**
 * ContentBlockManager - Dynamic Content Loading and Rendering System
 * Handles multiple content types, layouts, and responsive design for tutorial framework
 */
class ContentBlockManager {
  constructor(options = {}) {
    this.options = {
      basePath: options.basePath || './tutorials/',
      enableMarkdown: options.enableMarkdown !== false,
      enableWidgets: options.enableWidgets !== false,
      enableSyntaxHighlighting: options.enableSyntaxHighlighting !== false,
      ...options
    };
    
    this.contentCache = new Map();
    this.widgetInstances = new Map();
    this.loadingPromises = new Map();
    
    // Initialize markdown parser if enabled
    if (this.options.enableMarkdown && typeof marked !== 'undefined') {
      this.markdownRenderer = marked;
      this._configureMarkdown();
    }
  }

  /**
   * Render section content based on configuration
   * @param {Object} section - Section configuration
   * @param {HTMLElement} container - Target container element
   * @returns {Promise<void>}
   */
  async renderSection(section, container) {
    if (!section || !container) {
      throw new Error('Section and container are required');
    }

    console.log(`📄 Rendering section ${section.id}: ${section.title}`);

    // Clear existing content
    container.innerHTML = '';
    
    // Create section layout
    const sectionElement = this._createSectionElement(section);
    container.appendChild(sectionElement);

    // Render content based on layout
    await this._renderSectionContent(section, sectionElement);

    // Add mobile parameter images if they exist
    await this._addMobileParameters(section, sectionElement);

    console.log(`✅ Section ${section.id} rendered successfully`);
  }

  /**
   * Create section DOM structure
   */
  _createSectionElement(section) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'tutorial-section';
    sectionEl.dataset.sectionId = section.id;
    
    // Add background image class if needed
    if (section.background?.image) {
      sectionEl.classList.add('has-background-image');
    }

    return sectionEl;
  }

  /**
   * Render section content based on layout type
   */
  async _renderSectionContent(section, sectionElement) {
    const layout = section.layout || 'split';
    
    switch (layout) {
      case 'split':
        await this._renderSplitLayout(section, sectionElement);
        break;
      case 'full':
        await this._renderFullLayout(section, sectionElement);
        break;
      case 'triple':
        await this._renderTripleLayout(section, sectionElement);
        break;
      default:
        console.warn(`Unknown layout type: ${layout}, falling back to split`);
        await this._renderSplitLayout(section, sectionElement);
    }
  }

  /**
   * Render split layout (left/right columns)
   */
  async _renderSplitLayout(section, sectionElement) {
    const layoutDiv = document.createElement('div');
    layoutDiv.className = 'section-layout';
    
    const leftDiv = document.createElement('div');
    leftDiv.className = 'section-left';
    
    const rightDiv = document.createElement('div');
    rightDiv.className = 'section-right';
    
    // Render left content
    if (section.content?.left) {
      await this._renderContentBlock(section.content.left, leftDiv, section.id);
    }
    
    // Render right content
    if (section.content?.right) {
      await this._renderContentBlock(section.content.right, rightDiv, section.id);
    }
    
    layoutDiv.appendChild(leftDiv);
    layoutDiv.appendChild(rightDiv);
    sectionElement.appendChild(layoutDiv);
  }

  /**
   * Render full layout (single column)
   */
  async _renderFullLayout(section, sectionElement) {
    const layoutDiv = document.createElement('div');
    layoutDiv.className = 'section-full';
    
    // Render full content
    if (section.content?.full) {
      await this._renderContentBlock(section.content.full, layoutDiv, section.id);
    }
    
    sectionElement.appendChild(layoutDiv);
  }

  /**
   * Render triple layout (three columns)
   */
  async _renderTripleLayout(section, sectionElement) {
    const layoutDiv = document.createElement('div');
    layoutDiv.className = 'section-layout section-triple';
    
    const leftDiv = document.createElement('div');
    leftDiv.className = 'section-left';
    
    const centerDiv = document.createElement('div');
    centerDiv.className = 'section-center';
    
    const rightDiv = document.createElement('div');
    rightDiv.className = 'section-right';
    
    // Render content blocks
    if (section.content?.left) {
      await this._renderContentBlock(section.content.left, leftDiv, section.id);
    }
    
    if (section.content?.center) {
      await this._renderContentBlock(section.content.center, centerDiv, section.id);
    }
    
    if (section.content?.right) {
      await this._renderContentBlock(section.content.right, rightDiv, section.id);
    }
    
    layoutDiv.appendChild(leftDiv);
    layoutDiv.appendChild(centerDiv);
    layoutDiv.appendChild(rightDiv);
    sectionElement.appendChild(layoutDiv);
  }

  /**
   * Render individual content block
   */
  async _renderContentBlock(contentBlock, container, sectionId) {
    if (!contentBlock || !contentBlock.type) {
      console.warn('Invalid content block configuration');
      return;
    }

    try {
      switch (contentBlock.type) {
        case 'markdown':
          await this._renderMarkdown(contentBlock, container, sectionId);
          break;
        case 'html':
          await this._renderHTML(contentBlock, container, sectionId);
          break;
        case 'image':
          await this._renderImage(contentBlock, container, sectionId);
          break;
        case 'widget':
          await this._renderWidget(contentBlock, container, sectionId);
          break;
        default:
          console.warn(`Unknown content type: ${contentBlock.type}`);
          container.innerHTML = `<p style="color: #ff6b6b;">Unknown content type: ${contentBlock.type}</p>`;
      }
    } catch (error) {
      console.error(`Error rendering content block:`, error);
      container.innerHTML = `<p style="color: #ff6b6b;">Error loading content: ${error.message}</p>`;
    }
  }

  /**
   * Render markdown content
   */
  async _renderMarkdown(contentBlock, container, sectionId) {
    const content = await this._loadContent(contentBlock.source, sectionId);
    
    if (this.markdownRenderer) {
      container.innerHTML = this.markdownRenderer.parse(content);
    } else {
      // Fallback to simple text processing
      container.innerHTML = this._processSimpleMarkdown(content);
    }
    
    // Apply syntax highlighting if enabled
    if (this.options.enableSyntaxHighlighting) {
      this._applySyntaxHighlighting(container);
    }
  }

  /**
   * Render HTML content
   */
  async _renderHTML(contentBlock, container, sectionId) {
    const content = await this._loadContent(contentBlock.source, sectionId);
    container.innerHTML = content;
  }

  /**
   * Render image content
   */
  async _renderImage(contentBlock, container, sectionId) {
    const img = document.createElement('img');
    img.src = contentBlock.source;
    img.alt = contentBlock.alt || '';
    img.className = contentBlock.className || 'content-image';
    
    if (contentBlock.caption) {
      const figure = document.createElement('figure');
      const caption = document.createElement('figcaption');
      caption.textContent = contentBlock.caption;
      
      figure.appendChild(img);
      figure.appendChild(caption);
      container.appendChild(figure);
    } else {
      container.appendChild(img);
    }
  }

  /**
   * Render widget content
   */
  async _renderWidget(contentBlock, container, sectionId) {
    if (!contentBlock.widget) {
      throw new Error('Widget content block must specify widget configuration');
    }

    const widget = contentBlock.widget;
    const widgetId = `widget-${sectionId}-${Date.now()}`;

    switch (widget.type) {
      case 'tsv-table':
        await this._renderTSVTableWidget(widget, container, widgetId);
        break;
      case 'code-viewer':
        await this._renderCodeViewerWidget(widget, container, widgetId);
        break;
      default:
        console.warn(`Unknown widget type: ${widget.type}`);
        container.innerHTML = `<p style="color: #ff6b6b;">Unknown widget type: ${widget.type}</p>`;
    }
  }

  /**
   * Render TSV table widget
   */
  async _renderTSVTableWidget(widget, container, widgetId) {
    const widgetContainer = this._createWidgetContainer(widget, widgetId);
    
    try {
      // Load TSV data
      const tsvData = await this._loadContent(widget.source, 'tsv');
      const { headers, rows } = this._parseTSV(tsvData);
      
      // Create table
      const table = document.createElement('table');
      table.className = 'tsv-table';
      table.id = `${widgetId}-table`;
      
      // Create header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create body
      const tbody = document.createElement('tbody');
      rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      
      // Add table to widget content
      const widgetContent = widgetContainer.querySelector('.widget-content');
      widgetContent.appendChild(table);
      
      // Store widget instance
      this.widgetInstances.set(widgetId, {
        type: 'tsv-table',
        data: { headers, rows, tsvData },
        element: widgetContainer
      });
      
    } catch (error) {
      const widgetContent = widgetContainer.querySelector('.widget-content');
      widgetContent.innerHTML = `<div class="error">Error loading TSV data: ${error.message}</div>`;
    }
    
    container.appendChild(widgetContainer);
  }

  /**
   * Render code viewer widget
   */
  async _renderCodeViewerWidget(widget, container, widgetId) {
    const widgetContainer = this._createWidgetContainer(widget, widgetId);
    
    try {
      // Load code content
      const codeContent = await this._loadContent(widget.source, 'code');
      
      // Create code element
      const codeDiv = document.createElement('div');
      codeDiv.className = 'code-content';
      codeDiv.textContent = codeContent;
      
      // Add code to widget content
      const widgetContent = widgetContainer.querySelector('.widget-content');
      widgetContent.appendChild(codeDiv);
      
      // Apply syntax highlighting if enabled
      if (this.options.enableSyntaxHighlighting && widget.language) {
        this._applySyntaxHighlightingToElement(codeDiv, widget.language);
      }
      
      // Store widget instance
      this.widgetInstances.set(widgetId, {
        type: 'code-viewer',
        data: { code: codeContent, language: widget.language },
        element: widgetContainer
      });
      
    } catch (error) {
      const widgetContent = widgetContainer.querySelector('.widget-content');
      widgetContent.innerHTML = `<div class="error">Error loading code: ${error.message}</div>`;
    }
    
    container.appendChild(widgetContainer);
  }

  /**
   * Create widget container with controls
   */
  _createWidgetContainer(widget, widgetId) {
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.id = widgetId;
    
    // Create widget buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'widget-buttons';
    
    const controls = widget.controls || ['fullscreen', 'copy'];
    controls.forEach(control => {
      const button = document.createElement('button');
      button.className = `widget-btn widget-btn-${control}`;
      button.title = this._getControlTitle(control);
      button.addEventListener('click', () => this._handleWidgetControl(control, widgetId));
      buttonsDiv.appendChild(button);
    });
    
    // Create content widget
    const contentWidget = document.createElement('div');
    contentWidget.className = 'content-widget';
    
    // Create widget content area
    const widgetContent = document.createElement('div');
    widgetContent.className = 'widget-content';
    
    // Create widget header
    const widgetHeader = document.createElement('div');
    widgetHeader.className = 'widget-header';
    
    const widgetTitle = document.createElement('div');
    widgetTitle.className = 'widget-title';
    widgetTitle.textContent = widget.title || 'Widget';
    
    widgetHeader.appendChild(widgetTitle);
    
    // Assemble widget
    contentWidget.appendChild(widgetContent);
    contentWidget.appendChild(widgetHeader);
    
    container.appendChild(buttonsDiv);
    container.appendChild(contentWidget);
    
    return container;
  }

  /**
   * Handle widget control actions
   */
  _handleWidgetControl(control, widgetId) {
    const widget = this.widgetInstances.get(widgetId);
    if (!widget) return;
    
    switch (control) {
      case 'fullscreen':
        this._showWidgetFullscreen(widgetId);
        break;
      case 'copy':
        this._copyWidgetContent(widgetId);
        break;
      case 'download':
        this._downloadWidgetContent(widgetId);
        break;
    }
  }

  /**
   * Show widget in fullscreen modal
   */
  _showWidgetFullscreen(widgetId) {
    const widget = this.widgetInstances.get(widgetId);
    if (!widget) return;
    
    // Create fullscreen modal
    const modal = document.createElement('div');
    modal.className = 'widget-fullscreen active';
    modal.id = `${widgetId}-fullscreen`;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'widget-fullscreen-header';
    
    const title = document.createElement('h3');
    title.textContent = widget.element.querySelector('.widget-title').textContent;
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'widget-fullscreen-buttons';
    
    // Add control buttons
    ['copy', 'download'].forEach(control => {
      const button = document.createElement('button');
      button.className = `widget-btn widget-btn-${control}`;
      button.title = this._getControlTitle(control);
      button.addEventListener('click', () => this._handleWidgetControl(control, widgetId));
      buttonsDiv.appendChild(button);
    });
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'nav-btn close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this._closeWidgetFullscreen(modal));
    buttonsDiv.appendChild(closeBtn);
    
    header.appendChild(title);
    header.appendChild(buttonsDiv);
    
    // Create content
    const content = document.createElement('div');
    content.className = 'widget-fullscreen-content';
    
    // Clone widget content
    const originalContent = widget.element.querySelector('.widget-content');
    content.innerHTML = originalContent.innerHTML;
    
    modal.appendChild(header);
    modal.appendChild(content);
    
    // Add to document
    document.body.appendChild(modal);
    
    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this._closeWidgetFullscreen(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Close fullscreen widget modal
   */
  _closeWidgetFullscreen(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  /**
   * Copy widget content to clipboard
   */
  async _copyWidgetContent(widgetId) {
    const widget = this.widgetInstances.get(widgetId);
    if (!widget) return;
    
    let textToCopy = '';
    
    switch (widget.type) {
      case 'tsv-table':
        textToCopy = widget.data.tsvData;
        break;
      case 'code-viewer':
        textToCopy = widget.data.code;
        break;
    }
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      this._showCopyNotification();
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  /**
   * Download widget content
   */
  _downloadWidgetContent(widgetId) {
    // Implementation for download functionality
    // This would typically trigger a download of the source file
    console.log('Download functionality would be implemented here');
  }

  /**
   * Show copy notification
   */
  _showCopyNotification() {
    let notification = document.getElementById('copyNotification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'copyNotification';
      notification.className = 'copy-notification';
      notification.textContent = 'Copied to clipboard!';
      document.body.appendChild(notification);
    }
    
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 2000);
  }

  /**
   * Get control button title
   */
  _getControlTitle(control) {
    const titles = {
      fullscreen: 'Fullscreen',
      copy: 'Copy to Clipboard', 
      download: 'Download from GitHub'
    };
    return titles[control] || control;
  }

  /**
   * Load content from URL or cache
   */
  async _loadContent(source, cacheKey) {
    const fullCacheKey = `${cacheKey}-${source}`;
    
    // Check cache first
    if (this.contentCache.has(fullCacheKey)) {
      return this.contentCache.get(fullCacheKey);
    }
    
    // Check if already loading
    if (this.loadingPromises.has(fullCacheKey)) {
      return this.loadingPromises.get(fullCacheKey);
    }
    
    // Load content
    const loadPromise = this._fetchContent(source);
    this.loadingPromises.set(fullCacheKey, loadPromise);
    
    try {
      const content = await loadPromise;
      this.contentCache.set(fullCacheKey, content);
      return content;
    } finally {
      this.loadingPromises.delete(fullCacheKey);
    }
  }

  /**
   * Fetch content from URL
   */
  async _fetchContent(source) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to load content: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  /**
   * Parse TSV data
   */
  _parseTSV(tsvData) {
    const lines = tsvData.trim().split('\n');
    const headers = lines[0].split('\t').map(h => h.trim());
    const rows = lines.slice(1).map(line => 
      line.split('\t').map(cell => cell.trim())
    );
    
    return { headers, rows };
  }

  /**
   * Configure markdown parser
   */
  _configureMarkdown() {
    if (this.markdownRenderer && this.markdownRenderer.setOptions) {
      this.markdownRenderer.setOptions({
        breaks: true,
        gfm: true,
        sanitize: false
      });
    }
  }

  /**
   * Simple markdown processing fallback
   */
  _processSimpleMarkdown(content) {
    return content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Apply syntax highlighting to container
   */
  _applySyntaxHighlighting(container) {
    // Implementation would depend on chosen syntax highlighting library
    // (Prism.js, highlight.js, etc.)
    console.log('Syntax highlighting would be applied here');
  }

  /**
   * Apply syntax highlighting to specific element
   */
  _applySyntaxHighlightingToElement(element, language) {
    // Implementation would depend on chosen syntax highlighting library
    element.dataset.language = language;
    console.log(`Syntax highlighting for ${language} would be applied here`);
  }

  /**
   * Add mobile parameter images
   */
  async _addMobileParameters(section, sectionElement) {
    // Implementation for adding mobile parameter images
    // This would check for parameter hotspots and add mobile-specific content
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && section.hotspots && section.hotspots.length > 0) {
      const mobileParams = document.createElement('div');
      mobileParams.className = 'mobile-parameters';
      
      const title = document.createElement('h4');
      title.textContent = 'Parameters';
      mobileParams.appendChild(title);
      
      // Add parameter images for mobile
      for (const hotspot of section.hotspots) {
        if (hotspot.content && hotspot.content.type === 'image') {
          const img = document.createElement('img');
          img.src = hotspot.content.source;
          img.alt = hotspot.content.title || '';
          mobileParams.appendChild(img);
        }
      }
      
      if (mobileParams.children.length > 1) {
        sectionElement.appendChild(mobileParams);
      }
    }
  }

  /**
   * Clear all cached content
   */
  clearCache() {
    this.contentCache.clear();
    console.log('Content cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedItems: this.contentCache.size,
      activeWidgets: this.widgetInstances.size,
      loadingPromises: this.loadingPromises.size
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.contentCache.clear();
    this.loadingPromises.clear();
    
    // Clean up widget instances
    this.widgetInstances.forEach((widget, id) => {
      const modal = document.getElementById(`${id}-fullscreen`);
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    this.widgetInstances.clear();
    
    console.log('ContentBlockManager destroyed');
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentBlockManager;
} else if (typeof window !== 'undefined') {
  window.ContentBlockManager = ContentBlockManager;
}