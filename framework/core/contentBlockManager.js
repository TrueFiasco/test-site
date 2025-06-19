/**
 * ContentBlockManager - DEBUG VERSION with detailed logging
 * This will help us see exactly what data is being passed to the renderer
 */
class ContentBlockManager {
  constructor(options = {}) {
    this.options = {
      basePath: options.basePath || '',
      enableCache: options.enableCache !== false,
      enableMarkdown: options.enableMarkdown !== false,
      ...options
    };
    
    this.contentCache = new Map();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    console.log('✅ ContentBlockManager initialized');
    this.isInitialized = true;
  }

  /**
   * Render a complete section - WITH DEBUG LOGGING
   */
  async renderSection(section) {
    if (!section) {
      throw new Error('Section is required');
    }

    console.log(`📄 Rendering section ${section.id}: ${section.title}`);
    
    // 🐛 DEBUG: Log the entire section structure
    console.log('🔍 DEBUG - Full section data:', JSON.stringify(section, null, 2));

    try {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'tutorial-section';
      sectionElement.dataset.sectionId = section.id;

      if (section.background?.image) {
        sectionElement.classList.add('has-background-image');
      }

      const contentElement = await this._renderSectionContent(section);
      sectionElement.appendChild(contentElement);

      if (section.mobileParameters) {
        const mobileParams = this._renderMobileParameters(section.mobileParameters);
        sectionElement.appendChild(mobileParams);
      }

      return sectionElement;

    } catch (error) {
      console.error(`❌ Error rendering section ${section.id}:`, error);
      return this._renderErrorSection(section, error);
    }
  }

  /**
   * Render section content - WITH DEBUG LOGGING
   */
  async _renderSectionContent(section) {
    const { layout, content } = section;
    
    // 🐛 DEBUG: Log layout and content structure
    console.log(`🔍 DEBUG - Layout: ${layout}`);
    console.log('🔍 DEBUG - Content structure:', JSON.stringify(content, null, 2));

    switch (layout) {
      case 'split':
        return await this._renderSplitLayout(content);
      case 'full':
        return await this._renderFullLayout(content);
      case 'triple':
        return await this._renderTripleLayout(content);
      default:
        throw new Error(`Unknown layout type: ${layout}`);
    }
  }

  /**
   * Render split layout - WITH DEBUG LOGGING
   */
  async _renderSplitLayout(content) {
    console.log('🔍 DEBUG - Rendering split layout with content:', content);
    
    const layoutElement = document.createElement('div');
    layoutElement.className = 'section-layout';

    // Render left content
    if (content.left) {
      console.log('🔍 DEBUG - Left content block:', JSON.stringify(content.left, null, 2));
      const leftElement = document.createElement('div');
      leftElement.className = 'section-left';
      
      const leftContent = await this._renderContentBlock(content.left, 'LEFT');
      leftElement.appendChild(leftContent);
      layoutElement.appendChild(leftElement);
    } else {
      console.warn('⚠️ No left content found');
    }

    // Render right content
    if (content.right) {
      console.log('🔍 DEBUG - Right content block:', JSON.stringify(content.right, null, 2));
      const rightElement = document.createElement('div');
      rightElement.className = 'section-right';
      
      const rightContent = await this._renderContentBlock(content.right, 'RIGHT');
      rightElement.appendChild(rightContent);
      layoutElement.appendChild(rightElement);
    } else {
      console.warn('⚠️ No right content found');
    }

    return layoutElement;
  }

  /**
   * Render individual content block - WITH DEBUG LOGGING
   */
  async _renderContentBlock(block, position = '') {
    console.log(`🔍 DEBUG - Rendering ${position} content block:`, JSON.stringify(block, null, 2));
    
    if (!block || !block.type) {
      console.error('❌ Content block missing or no type specified:', block);
      throw new Error('Content block must specify type');
    }

    try {
      switch (block.type) {
        case 'html':
          return await this._renderHTML(block, position);
        case 'markdown':
          return await this._renderMarkdown(block, position);
        case 'widget':
          return await this._renderWidget(block, position);
        case 'image':
          return await this._renderImage(block, position);
        default:
          throw new Error(`Unknown content type: ${block.type}`);
      }
    } catch (error) {
      console.error(`❌ Error rendering ${position} content block:`, error);
      return this._renderErrorBlock(error);
    }
  }

  /**
   * Render HTML content - WITH DEBUG LOGGING
   */
  async _renderHTML(block, position = '') {
    console.log(`🔍 DEBUG - Rendering HTML for ${position}:`, {
      hasContent: !!block.content,
      hasSource: !!block.source,
      contentLength: block.content ? block.content.length : 0,
      source: block.source
    });

    const container = document.createElement('div');
    container.className = 'content-block html-content';

    let htmlContent;

    // Check if content is embedded directly in the block
    if (block.content) {
      // ✅ Embedded HTML content
      htmlContent = block.content;
      console.log(`✅ Using embedded HTML content for ${position} (${htmlContent.length} chars)`);
    } else if (block.source) {
      // ❌ External source file - this should NOT happen with your new content.js
      console.warn(`⚠️ WARNING: Using external source for ${position}: ${block.source}`);
      console.error(`❌ STOPPING HERE - should use embedded content instead!`);
      
      // Instead of fetching, show error
      container.innerHTML = `
        <div style="color: red; padding: 1rem; border: 2px solid red; margin: 1rem;">
          <h3>❌ Configuration Error</h3>
          <p>This content block is trying to load external file: <code>${block.source}</code></p>
          <p>It should use embedded content instead!</p>
          <p>Check your section generation in content.js</p>
        </div>
      `;
      return container;
    } else {
      console.error(`❌ HTML block for ${position} has no content or source:`, block);
      throw new Error('HTML block must specify either content or source');
    }

    container.innerHTML = htmlContent;
    return container;
  }

  /**
   * Load content from external source - THIS SHOULD NOT BE CALLED with embedded content
   */
  async _loadContent(source) {
    console.log(`🔍 DEBUG - _loadContent called with source: "${source}"`);
    
    if (!source) {
      console.error('❌ Source is undefined or empty');
      throw new Error('Source is required');
    }

    // Check cache first
    if (this.options.enableCache && this.contentCache.has(source)) {
      console.log(`📁 Using cached content for: ${source}`);
      return this.contentCache.get(source);
    }

    try {
      const content = await this._fetchContent(source);
      
      if (this.options.enableCache) {
        this.contentCache.set(source, content);
      }
      
      return content;
    } catch (error) {
      console.error(`❌ Failed to load content from ${source}:`, error);
      throw new Error(`Failed to load content from ${source}: ${error.message}`);
    }
  }

  /**
   * Fetch content from URL - THIS SHOULD NOT BE CALLED with embedded content
   */
  async _fetchContent(url) {
    console.log(`🔍 DEBUG - _fetchContent called with URL: "${url}"`);
    
    const fullUrl = url.startsWith('http') ? url : `${this.options.basePath}${url}`;
    
    console.log(`🌐 Fetching content from: ${fullUrl}`);
    
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Render widget content
   */
  async _renderWidget(block, position = '') {
    console.log(`🔍 DEBUG - Rendering widget for ${position}:`, block.widget);
    
    if (!block.widget) {
      throw new Error('Widget block must specify widget configuration');
    }

    const { widget } = block;

    switch (widget.type) {
      case 'tsv-table':
        return await this._renderTSVTable(widget);
      case 'code-viewer':
        return await this._renderCodeViewer(widget);
      case 'image-gallery':
        return await this._renderImageGallery(widget);
      default:
        throw new Error(`Unknown widget type: ${widget.type}`);
    }
  }

  /**
   * Render TSV table widget
   */
  async _renderTSVTable(widget) {
    const container = document.createElement('div');
    container.className = 'widget-container';

    const buttonsContainer = this._createWidgetButtons(widget.controls || []);
    container.appendChild(buttonsContainer);

    const contentWidget = document.createElement('div');
    contentWidget.className = 'content-widget';

    const widgetContent = document.createElement('div');
    widgetContent.className = 'widget-content';
    widgetContent.id = `tsvContent-${Date.now()}`;

    const table = document.createElement('table');
    table.className = 'tsv-table';
    table.innerHTML = '<thead><tr></tr></thead><tbody></tbody>';

    widgetContent.appendChild(table);
    contentWidget.appendChild(widgetContent);

    const widgetHeader = document.createElement('div');
    widgetHeader.className = 'widget-header';
    
    const widgetTitle = document.createElement('div');
    widgetTitle.className = 'widget-title';
    widgetTitle.textContent = widget.title || 'TSV Data';
    
    widgetHeader.appendChild(widgetTitle);
    contentWidget.appendChild(widgetHeader);

    container.appendChild(contentWidget);

    if (widget.source) {
      this._loadTSVData(widget.source, table);
    }

    return container;
  }

  /**
   * Render code viewer widget
   */
  async _renderCodeViewer(widget) {
    const container = document.createElement('div');
    container.className = 'widget-container';

    const buttonsContainer = this._createWidgetButtons(widget.controls || []);
    container.appendChild(buttonsContainer);

    const contentWidget = document.createElement('div');
    contentWidget.className = 'content-widget';

    const widgetContent = document.createElement('div');
    widgetContent.className = 'widget-content';
    widgetContent.id = `codeContent-${Date.now()}`;

    const codeElement = document.createElement('div');
    codeElement.className = 'code-content loading';
    codeElement.textContent = 'Loading code...';

    widgetContent.appendChild(codeElement);
    contentWidget.appendChild(widgetContent);

    const widgetHeader = document.createElement('div');
    widgetHeader.className = 'widget-header';
    
    const widgetTitle = document.createElement('div');
    widgetTitle.className = 'widget-title';
    widgetTitle.textContent = widget.title || 'Code';
    
    widgetHeader.appendChild(widgetTitle);
    contentWidget.appendChild(widgetHeader);

    container.appendChild(contentWidget);

    if (widget.source) {
      this._loadCodeData(widget.source, codeElement);
    } else if (widget.content) {
      codeElement.textContent = widget.content;
      codeElement.classList.remove('loading');
    }

    return container;
  }

  // ... (rest of the methods remain the same)

  _createWidgetButtons(controls) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'widget-buttons';

    controls.forEach(control => {
      const button = document.createElement('button');
      button.className = `widget-btn widget-btn-${control}`;
      button.title = this._getButtonTitle(control);
      button.addEventListener('click', () => this._handleWidgetAction(control));
      buttonsContainer.appendChild(button);
    });

    return buttonsContainer;
  }

  _getButtonTitle(control) {
    const titles = {
      'fullscreen': 'Fullscreen',
      'copy': 'Copy to Clipboard',
      'download': 'Download from GitHub'
    };
    return titles[control] || control;
  }

  _handleWidgetAction(action) {
    console.log(`Widget action: ${action}`);
  }

  async _loadTSVData(source, table) {
    try {
      const tsvData = await this._loadContent(source);
      const rows = tsvData.trim().split('\n');
      const headers = rows[0].split('\t');
      const dataRows = rows.slice(1);

      const thead = table.querySelector('thead tr');
      thead.innerHTML = '';
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.trim();
        thead.appendChild(th);
      });

      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';
      dataRows.forEach(row => {
        const cells = row.split('\t');
        const tr = document.createElement('tr');
        cells.forEach(cell => {
          const td = document.createElement('td');
          td.textContent = cell.trim();
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

    } catch (error) {
      console.error('Failed to load TSV data:', error);
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; color: #ff6b6b;">Failed to load data</td></tr>';
    }
  }

  async _loadCodeData(source, codeElement) {
    try {
      const codeData = await this._loadContent(source);
      codeElement.textContent = codeData;
      codeElement.classList.remove('loading');
    } catch (error) {
      console.error('Failed to load code data:', error);
      codeElement.textContent = 'Failed to load code';
      codeElement.classList.remove('loading');
      codeElement.classList.add('error');
    }
  }

  _renderMobileParameters(parameters) {
    const container = document.createElement('div');
    container.className = 'mobile-parameters';

    const title = document.createElement('h4');
    title.textContent = parameters.title || 'Parameters';
    container.appendChild(title);

    if (parameters.images && Array.isArray(parameters.images)) {
      parameters.images.forEach(imagePath => {
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = 'Parameter Image';
        container.appendChild(img);
      });
    }

    return container;
  }

  _renderErrorSection(section, error) {
    const sectionElement = document.createElement('div');
    sectionElement.className = 'tutorial-section error-section';
    
    const errorContainer = document.createElement('div');
    errorContainer.className = 'section-layout';
    errorContainer.innerHTML = `
      <div class="section-full">
        <div class="error-content">
          <h2>Error Loading Section ${section.id}</h2>
          <p>${section.title}</p>
          <p class="error-message">${error.message}</p>
          <button onclick="location.reload()" class="retry-button">Retry</button>
        </div>
      </div>
    `;
    
    sectionElement.appendChild(errorContainer);
    return sectionElement;
  }

  _renderErrorBlock(error) {
    const container = document.createElement('div');
    container.className = 'content-block error-block';
    container.innerHTML = `
      <div class="error-content">
        <p>⚠️ Content Error</p>
        <p class="error-message">${error.message}</p>
      </div>
    `;
    return container;
  }

  clearCache() {
    this.contentCache.clear();
    console.log('🗑️ Content cache cleared');
  }

  destroy() {
    this.clearCache();
    this.isInitialized = false;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentBlockManager;
} else if (typeof window !== 'undefined') {
  window.ContentBlockManager = ContentBlockManager;
}
