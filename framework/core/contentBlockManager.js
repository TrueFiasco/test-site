/**
 * ContentBlockManager - Production Version
 * Handles embedded HTML content and external file loading for tutorial framework
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
   * Render a complete section
   */
  async renderSection(section) {
    if (!section) {
      throw new Error('Section is required');
    }

    console.log(`📄 Rendering section ${section.id}: ${section.title}`);

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
   * Render section content based on layout type
   */
  async _renderSectionContent(section) {
    const { layout, content } = section;

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
   * Render split layout (2 columns)
   */
  async _renderSplitLayout(content) {
    const layoutElement = document.createElement('div');
    layoutElement.className = 'section-layout';

    if (content.left) {
      const leftElement = document.createElement('div');
      leftElement.className = 'section-left';
      const leftContent = await this._renderContentBlock(content.left);
      leftElement.appendChild(leftContent);
      layoutElement.appendChild(leftElement);
    }

    if (content.right) {
      const rightElement = document.createElement('div');
      rightElement.className = 'section-right';
      const rightContent = await this._renderContentBlock(content.right);
      rightElement.appendChild(rightContent);
      layoutElement.appendChild(rightElement);
    }

    return layoutElement;
  }

  /**
   * Render full layout (1 column)
   */
  async _renderFullLayout(content) {
    const layoutElement = document.createElement('div');
    layoutElement.className = 'section-full';

    if (content.full) {
      const fullContent = await this._renderContentBlock(content.full);
      layoutElement.appendChild(fullContent);
    }

    return layoutElement;
  }

  /**
   * Render triple layout (3 columns)
   */
  async _renderTripleLayout(content) {
    const layoutElement = document.createElement('div');
    layoutElement.className = 'section-layout triple';

    const positions = ['left', 'center', 'right'];
    
    for (const position of positions) {
      if (content[position]) {
        const columnElement = document.createElement('div');
        columnElement.className = `section-${position}`;
        const columnContent = await this._renderContentBlock(content[position]);
        columnElement.appendChild(columnContent);
        layoutElement.appendChild(columnElement);
      }
    }

    return layoutElement;
  }

  /**
   * Render individual content block
   */
  async _renderContentBlock(block) {
    if (!block || !block.type) {
      throw new Error('Content block must specify type');
    }

    try {
      switch (block.type) {
        case 'html':
          return await this._renderHTML(block);
        case 'markdown':
          return await this._renderMarkdown(block);
        case 'widget':
          return await this._renderWidget(block);
        case 'image':
          return await this._renderImage(block);
        default:
          throw new Error(`Unknown content type: ${block.type}`);
      }
    } catch (error) {
      console.error('❌ Error rendering content block:', error);
      return this._renderErrorBlock(error);
    }
  }

  /**
   * Render HTML content - supports both embedded content and external sources
   */
  async _renderHTML(block) {
    const container = document.createElement('div');
    container.className = 'content-block html-content';

    let htmlContent;

    if (block.content) {
      // Embedded HTML content (preferred)
      htmlContent = block.content;
    } else if (block.source) {
      // External source file (fallback)
      htmlContent = await this._loadContent(block.source);
    } else {
      throw new Error('HTML block must specify either content or source');
    }

    container.innerHTML = htmlContent;
    return container;
  }

  /**
   * Render Markdown content
   */
  async _renderMarkdown(block) {
    const container = document.createElement('div');
    container.className = 'content-block markdown-content';

    let markdownContent;

    if (block.content) {
      markdownContent = block.content;
    } else if (block.source) {
      markdownContent = await this._loadContent(block.source);
    } else {
      throw new Error('Markdown block must specify either content or source');
    }

    const htmlContent = this._markdownToHTML(markdownContent);
    container.innerHTML = htmlContent;
    
    return container;
  }

  /**
   * Render widget content
   */
  async _renderWidget(block) {
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
   * Render image content
   */
  async _renderImage(block) {
    const container = document.createElement('div');
    container.className = 'content-block image-content';

    const img = document.createElement('img');
    
    if (block.source) {
      img.src = block.source;
    } else {
      throw new Error('Image block must specify source');
    }

    if (block.alt) img.alt = block.alt;
    if (block.caption) img.title = block.caption;
    if (block.className) img.className = block.className;

    img.classList.add('responsive-image');
    container.appendChild(img);

    if (block.caption) {
      const caption = document.createElement('p');
      caption.className = 'image-caption';
      caption.textContent = block.caption;
      container.appendChild(caption);
    }

    return container;
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

  /**
   * Create widget control buttons
   */
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
    // These can be implemented based on your existing widget functionality
    console.log(`Widget action: ${action}`);
  }

  /**
   * Load content from external source
   */
  async _loadContent(source) {
    if (!source) {
      throw new Error('Source is required');
    }

    if (this.options.enableCache && this.contentCache.has(source)) {
      return this.contentCache.get(source);
    }

    try {
      const content = await this._fetchContent(source);
      
      if (this.options.enableCache) {
        this.contentCache.set(source, content);
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load content from ${source}: ${error.message}`);
    }
  }

  /**
   * Fetch content from URL
   */
  async _fetchContent(url) {
    const fullUrl = url.startsWith('http') ? url : `${this.options.basePath}${url}`;
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Load TSV data into table
   */
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
      console.error('❌ Failed to load TSV data:', error);
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; color: #ff6b6b;">Failed to load data</td></tr>';
    }
  }

  /**
   * Load code data into code element
   */
  async _loadCodeData(source, codeElement) {
    try {
      const codeData = await this._loadContent(source);
      codeElement.textContent = codeData;
      codeElement.classList.remove('loading');
    } catch (error) {
      console.error('❌ Failed to load code data:', error);
      codeElement.textContent = 'Failed to load code';
      codeElement.classList.remove('loading');
      codeElement.classList.add('error');
    }
  }

  /**
   * Render mobile parameters section
   */
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

  /**
   * Simple markdown to HTML converter
   */
  _markdownToHTML(markdown) {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/\n/gim, '<br>');
  }

  /**
   * Render error section
   */
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

  /**
   * Render error block
   */
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

  /**
   * Clear content cache
   */
  clearCache() {
    this.contentCache.clear();
    console.log('🗑️ Content cache cleared');
  }

  /**
   * Destroy and cleanup
   */
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
