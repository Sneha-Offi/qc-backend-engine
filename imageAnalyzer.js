import { createWorker } from 'tesseract.js';

/**
 * Extract product attributes from a screenshot using Tesseract.js OCR
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} mimeType - The image MIME type (e.g., 'image/png')
 * @returns {Promise<Object>} - Extracted product attributes
 */
export async function extractAttributesFromImage(imageBuffer, mimeType) {
  try {
    console.log('🖼️ [IMAGE-ANALYZER] Starting image analysis with Tesseract.js OCR...');
    
    // Create Tesseract worker
    const worker = await createWorker('eng');
    
    console.log('📸 [IMAGE-ANALYZER] Processing image with OCR...');
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(imageBuffer);
    
    await worker.terminate();
    
    console.log('✅ [IMAGE-ANALYZER] OCR extraction complete');
    console.log('📝 [IMAGE-ANALYZER] Extracted text length:', text.length, 'characters');
    
    // Parse the extracted text to find product attributes
    const extractedData = parseProductAttributesFromText(text);
    
    // Add metadata
    extractedData._metadata = {
      source: 'screenshot-ocr',
      analyzer: 'tesseract-js',
      extractedAt: new Date().toISOString(),
      imageSize: imageBuffer.length,
      textLength: text.length
    };
    
    console.log('📊 [IMAGE-ANALYZER] Extracted attributes:', Object.keys(extractedData).length, 'fields');
    
    return extractedData;
    
  } catch (error) {
    console.error('❌ [IMAGE-ANALYZER] Error analyzing image:', error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
}

/**
 * Parse product attributes from OCR text using pattern matching
 * @param {string} text - Raw OCR text
 * @returns {Object} - Structured product attributes
 */
function parseProductAttributesFromText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const extractedData = {
    productName: null,
    brand: null,
    category: null,
    price: null,
    moq: null,
    material: null,
    dimensions: null,
    weight: null,
    color: null,
    sku: null,
    leadTime: null,
    brandingMethods: [],
    printableArea: null,
    packaging: null,
    certifications: [],
    description: null,
    specifications: {},
    extractedText: text
  };
  
  // Pattern matching for common product attributes
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Product Name (usually first or contains "product", "name", "title")
    if (!extractedData.productName && (lowerLine.includes('product name') || lowerLine.includes('product:') || lowerLine.includes('title:'))) {
      extractedData.productName = extractValueFromLine(line);
    }
    
    // Brand / Vendor
    if (lowerLine.includes('brand') || lowerLine.includes('vendor') || lowerLine.includes('manufacturer')) {
      extractedData.brand = extractValueFromLine(line);
    }
    
    // Category
    if (lowerLine.includes('category') || lowerLine.includes('type')) {
      extractedData.category = extractValueFromLine(line);
    }
    
    // Price
    if (lowerLine.match(/price|cost|amount|₹|rs\.?|inr/i)) {
      const priceMatch = line.match(/₹?\s*(\d+[\d,]*\.?\d*)/);
      if (priceMatch) {
        extractedData.price = { value: priceMatch[1], currency: 'INR' };
      }
    }
    
    // MOQ
    if (lowerLine.includes('moq') || lowerLine.includes('minimum order')) {
      const moqMatch = line.match(/(\d+[\d,]*)/);
      extractedData.moq = moqMatch ? moqMatch[1] : extractValueFromLine(line);
    }
    
    // Material
    if (lowerLine.includes('material') || lowerLine.includes('composition')) {
      extractedData.material = extractValueFromLine(line);
    }
    
    // Dimensions
    if (lowerLine.includes('dimension') || lowerLine.includes('size') || lowerLine.match(/\d+\s*x\s*\d+/)) {
      extractedData.dimensions = extractValueFromLine(line);
    }
    
    // Weight
    if (lowerLine.includes('weight') || lowerLine.match(/\d+\s*(kg|g|gm|grams)/i)) {
      extractedData.weight = extractValueFromLine(line);
    }
    
    // Color
    if (lowerLine.includes('color') || lowerLine.includes('colour')) {
      extractedData.color = extractValueFromLine(line);
    }
    
    // SKU
    if (lowerLine.includes('sku') || lowerLine.includes('product code') || lowerLine.includes('item code')) {
      extractedData.sku = extractValueFromLine(line);
    }
    
    // Lead Time
    if (lowerLine.includes('lead time') || lowerLine.includes('delivery time') || lowerLine.includes('dispatch')) {
      extractedData.leadTime = extractValueFromLine(line);
    }
    
    // Branding Methods
    if (lowerLine.includes('branding') || lowerLine.includes('printing') || lowerLine.includes('engraving')) {
      const method = extractValueFromLine(line);
      if (method && !extractedData.brandingMethods.includes(method)) {
        extractedData.brandingMethods.push(method);
      }
    }
    
    // Printable Area
    if (lowerLine.includes('print area') || lowerLine.includes('branding area')) {
      extractedData.printableArea = extractValueFromLine(line);
    }
    
    // Packaging
    if (lowerLine.includes('packaging') || lowerLine.includes('packing')) {
      extractedData.packaging = extractValueFromLine(line);
    }
    
    // Certifications
    if (lowerLine.includes('certification') || lowerLine.includes('certified') || lowerLine.includes('bis') || lowerLine.includes('iso')) {
      const cert = extractValueFromLine(line);
      if (cert && !extractedData.certifications.includes(cert)) {
        extractedData.certifications.push(cert);
      }
    }
    
    // Description (if contains "description" keyword)
    if (lowerLine.includes('description') && !extractedData.description) {
      extractedData.description = extractValueFromLine(line);
    }
    
    // Add to specifications if it looks like a key-value pair
    if (line.includes(':') && !extractedData.specifications[line]) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      if (key.trim() && value) {
        extractedData.specifications[key.trim()] = value;
      }
    }
  }
  
  // If no product name found, use first meaningful line
  if (!extractedData.productName && lines.length > 0) {
    extractedData.productName = lines.find(line => line.length > 5) || lines[0];
  }
  
  // If no description, use first paragraph-like text
  if (!extractedData.description) {
    const longLines = lines.filter(line => line.length > 50);
    if (longLines.length > 0) {
      extractedData.description = longLines[0];
    }
  }
  
  return extractedData;
}

/**
 * Extract value after common separators
 * @param {string} line - Line of text
 * @returns {string} - Extracted value
 */
function extractValueFromLine(line) {
  // Try to extract value after : or -
  const separators = [':', '-', '='];
  for (const sep of separators) {
    if (line.includes(sep)) {
      const parts = line.split(sep);
      if (parts.length > 1) {
        return parts.slice(1).join(sep).trim();
      }
    }
  }
  return line.trim();
}

/**
 * Validate and normalize extracted product data
 * @param {Object} extractedData - Raw extracted data from Claude
 * @returns {Object} - Normalized product data
 */
export function normalizeExtractedData(extractedData) {
  try {
    // Normalize to match backend data structure
    const normalized = {
      title: extractedData.productName || extractedData.title || 'Unknown Product',
      brand: extractedData.brand || extractedData.vendorName || null,
      category: extractedData.category || null,
      price: extractedData.price?.value || extractedData.price || null,
      currency: extractedData.price?.currency || 'INR',
      description: extractedData.description || extractedData.extractedText || '',
      images: [], // Screenshots don't contain product images
      specifications: {
        ...(extractedData.specifications || {}),
        moq: extractedData.moq || null,
        material: extractedData.material || null,
        dimensions: extractedData.dimensions || null,
        weight: extractedData.weight || null,
        color: extractedData.color || null,
        sku: extractedData.sku || null,
        leadTime: extractedData.leadTime || null,
        brandingMethods: extractedData.brandingMethods || [],
        printableArea: extractedData.printableArea || null,
        packaging: extractedData.packaging || null,
        certifications: extractedData.certifications || []
      },
      metadata: {
        source: 'screenshot',
        extractionMethod: 'claude-vision-api',
        extractedAt: new Date().toISOString(),
        ...(extractedData._metadata || {})
      }
    };
    
    return normalized;
    
  } catch (error) {
    console.error('❌ [IMAGE-ANALYZER] Error normalizing data:', error);
    return {
      title: 'Unknown Product',
      error: error.message,
      rawData: extractedData
    };
  }
}