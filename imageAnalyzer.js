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
    extractedText: text,
    allExtractedAttributes: [] // NEW: Store all found attributes
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
    if (lowerLine.includes('branding') || lowerLine.includes('printing') || lowerLine.includes('engraving') || lowerLine.includes('embroidery') || lowerLine.includes('laser')) {
      const method = extractValueFromLine(line);
      if (method && !extractedData.brandingMethods.includes(method)) {
        extractedData.brandingMethods.push(method);
      }
    }
    
    // Printable Area
    if (lowerLine.includes('print area') || lowerLine.includes('branding area') || lowerLine.includes('customization area')) {
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
    
    // **NEW: Extract ALL key-value pairs as specifications**
    if (line.includes(':') || line.includes('-')) {
      const [key, ...valueParts] = line.split(/[:\-]/);
      const value = valueParts.join(':').trim();
      const cleanKey = key.trim();
      
      if (cleanKey && value && cleanKey.length > 2 && value.length > 0) {
        // Add to specifications
        extractedData.specifications[cleanKey] = value;
        
        // Also add to comprehensive attribute list
        extractedData.allExtractedAttributes.push({
          attribute: cleanKey,
          value: value,
          source: 'Screenshot OCR',
          confidence: 'Medium'
        });
      }
    }
    
    // **NEW: Detect attribute-like patterns (e.g., "Capacity 500ml", "Power 1500W")**
    const attributePattern = /^([A-Za-z\s]+)\s+([0-9]+[\w\s\.,]*)/;
    const match = line.match(attributePattern);
    if (match && match[1] && match[2]) {
      const attr = match[1].trim();
      const val = match[2].trim();
      
      if (attr.length > 2 && !extractedData.specifications[attr]) {
        extractedData.specifications[attr] = val;
        extractedData.allExtractedAttributes.push({
          attribute: attr,
          value: val,
          source: 'Screenshot OCR',
          confidence: 'Medium'
        });
      }
    }
  }
  
  // If no product name found, use first meaningful line
  if (!extractedData.productName && lines.length > 0) {
    extractedData.productName = lines.find(line => line.length > 5 && line.length < 100) || lines[0];
  }
  
  // If no description, use first paragraph-like text
  if (!extractedData.description) {
    const longLines = lines.filter(line => line.length > 50);
    if (longLines.length > 0) {
      extractedData.description = longLines[0];
    }
  }
  
  console.log(`📊 [OCR-PARSER] Extracted ${extractedData.allExtractedAttributes.length} attributes from screenshot`);
  
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
    // **NEW: Run intelligent specification extraction on OCR text**
    console.log('🔍 Running intelligent spec extraction on OCR text...');
    const intelligentSpecs = extractDetailedSpecsFromOCR(extractedData.extractedText, extractedData.productName);
    
    // Merge intelligent specs with basic extracted data
    const mergedSpecs = {
      ...(extractedData.specifications || {}),
      ...intelligentSpecs, // Intelligent specs take priority
      moq: extractedData.moq || null,
      material: extractedData.material || intelligentSpecs.Material || null,
      dimensions: extractedData.dimensions || intelligentSpecs.Dimensions || null,
      weight: extractedData.weight || intelligentSpecs.Weight || null,
      color: extractedData.color || intelligentSpecs.Color || null,
      sku: extractedData.sku || null,
      leadTime: extractedData.leadTime || null,
      brandingMethods: extractedData.brandingMethods || [],
      printableArea: extractedData.printableArea || null,
      packaging: extractedData.packaging || null,
      certifications: extractedData.certifications || []
    };
    
    // Normalize to match backend data structure
    const normalized = {
      title: extractedData.productName || extractedData.title || 'Unknown Product',
      brand: extractedData.brand || extractedData.vendorName || null,
      category: extractedData.category || null,
      price: extractedData.price?.value || extractedData.price || null,
      currency: extractedData.price?.currency || 'INR',
      description: extractedData.description || extractedData.extractedText || '',
      images: [], // Screenshots don't contain product images
      specifications: mergedSpecs,
      metadata: {
        source: 'screenshot',
        extractionMethod: 'tesseract-ocr',
        extractedAt: new Date().toISOString(),
        ...(extractedData._metadata || {})
      }
    };
    
    console.log(`✅ Normalized data with ${Object.keys(normalized.specifications).length} specifications`);
    
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

/**
 * Extract detailed specifications from OCR text using intelligent pattern matching
 * @param {string} text - Raw OCR text
 * @param {string} productName - Product name for context
 * @returns {Object} - Detailed specifications
 */
function extractDetailedSpecsFromOCR(text, productName) {
  const specs = {};
  
  // Normalize text
  const normalizedText = text.toLowerCase();
  
  // **1. CAPACITY / VOLUME (ml, L, oz)**
  const capacityPatterns = [
    /(\d+)\s*(ml|milliliter|millilitre)/i,
    /(\d+\.?\d*)\s*(l|liter|litre)(?!\w)/i,
    /(\d+)\s*(oz|ounce)/i,
    /capacity[:\s]*(\d+\.?\d*)\s*(ml|l|oz)/i
  ];
  
  for (const pattern of capacityPatterns) {
    const match = text.match(pattern);
    if (match) {
      let value = match[1];
      let unit = match[2];
      
      // Convert liters to ml
      if (unit.toLowerCase().startsWith('l') && !unit.toLowerCase().includes('ml')) {
        value = parseFloat(value) * 1000;
        unit = 'ml';
      }
      
      specs['Capacity'] = `${value}${unit}`;
      break;
    }
  }
  
  // Try from product name too
  if (!specs['Capacity'] && productName) {
    const titleMatch = productName.match(/(\d+)\s*(ml|l|oz)/i);
    if (titleMatch) {
      specs['Capacity'] = `${titleMatch[1]}${titleMatch[2]}`;
    }
  }
  
  // **2. MATERIAL**
  const materials = [
    'stainless steel', 'steel', 'ss 304', '304 stainless', '316 stainless',
    'plastic', 'bpa free plastic', 'tritan', 'polypropylene',
    'glass', 'borosilicate glass',
    'aluminum', 'aluminium', 'copper', 'silicone'
  ];
  
  for (const material of materials) {
    if (normalizedText.includes(material)) {
      specs['Material'] = material.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }
  
  // **3. HOT RETENTION**
  const hotPatterns = [
    /(?:keeps?|retain|hot|warm)\s+(?:for|up to)?\s*(\d+)\s*(?:hour|hr|hrs)/i,
    /hot[:\s]+(\d+)\s*(?:hour|hr)/i,
    /(\d+)\s*(?:hour|hr|hrs)\s+hot/i
  ];
  
  for (const pattern of hotPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs['Hot Retention'] = `${match[1]} hours`;
      break;
    }
  }
  
  // **4. COLD RETENTION**
  const coldPatterns = [
    /(?:keeps?|retain|cold|cool)\s+(?:for|up to)?\s*(\d+)\s*(?:hour|hr|hrs)/i,
    /cold[:\s]+(\d+)\s*(?:hour|hr)/i,
    /(\d+)\s*(?:hour|hr|hrs)\s+cold/i
  ];
  
  for (const pattern of coldPatterns) {
    const match = text.match(pattern);
    if (match && !specs['Hot Retention']) {
      specs['Cold Retention'] = `${match[1]} hours`;
      break;
    } else if (match) {
      specs['Cold Retention'] = `${match[1]} hours`;
    }
  }
  
  // **5. INSULATION**
  if (normalizedText.includes('vacuum insulated') || normalizedText.includes('double wall')) {
    specs['Insulation'] = 'Vacuum Insulated / Double Wall';
  }
  
  // **6. WEIGHT**
  const weightPatterns = [
    /weight[:\s]*(\d+\.?\d*)\s*(kg|g|gm|grams)/i,
    /(\d+\.?\d*)\s*(kg|g|gm)\s+(?:weight|approx)/i
  ];
  
  for (const pattern of weightPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs['Weight'] = `${match[1]}${match[2]}`;
      break;
    }
  }
  
  // **7. DIMENSIONS**
  const dimensionPatterns = [
    /(\d+\.?\d*)\s*(?:cm|mm|inch)?\s*x\s*(\d+\.?\d*)\s*(cm|mm|inch)/i,
    /dimensions?[:\s]*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/i
  ];
  
  for (const pattern of dimensionPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs['Dimensions'] = match[0];
      break;
    }
  }
  
  // **8. COLOR**
  const colors = [
    'black', 'white', 'silver', 'grey', 'gray', 'blue', 'red', 'green',
    'yellow', 'orange', 'pink', 'purple', 'gold', 'rose gold', 'copper',
    'matte black', 'glossy'
  ];
  
  for (const color of colors) {
    if (normalizedText.includes(color) || (productName && productName.toLowerCase().includes(color))) {
      specs['Color'] = color.charAt(0).toUpperCase() + color.slice(1);
      break;
    }
  }
  
  // **9. LEAK PROOF**
  if (normalizedText.includes('leak proof') || normalizedText.includes('leakproof')) {
    specs['Leak Proof'] = 'Yes';
  }
  
  // **10. BPA FREE**
  if (normalizedText.includes('bpa free') || normalizedText.includes('bpa-free')) {
    specs['BPA Free'] = 'Yes';
  }
  
  // **11. DISHWASHER SAFE**
  if (normalizedText.includes('dishwasher safe')) {
    specs['Dishwasher Safe'] = 'Yes';
  }
  
  console.log(`🔍 [INTELLIGENT-OCR] Extracted ${Object.keys(specs).length} intelligent specs from OCR`);
  
  return specs;
}
