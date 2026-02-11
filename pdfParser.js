import pdf from 'pdf-parse';

// ==========================================
// PDF PARSING WITH TABLE DETECTION
// ==========================================
export async function parsePDF(buffer) {
  try {
    const data = await pdf(buffer);
    
    console.log('📄 PDF parsed successfully');
    console.log(`   Pages: ${data.numpages}`);
    console.log(`   Text length: ${data.text.length} characters`);
    
    // Extract structured data
    const parsed = {
      totalPages: data.numpages,
      rawText: data.text,
      metadata: data.info || {},
      extractedData: extractProductInfo(data.text),
      tables: extractTables(data.text),
      specifications: extractSpecifications(data.text),
      pricing: extractPricing(data.text),
      moq: extractMOQ(data.text),
      leadTime: extractLeadTime(data.text),
      brandingMethods: extractBrandingMethods(data.text)
    };
    
    return parsed;
    
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

// ==========================================
// EXTRACT PRODUCT INFORMATION
// ==========================================
function extractProductInfo(text) {
  const products = [];
  const lines = text.split('\n');
  
  // Look for product codes/SKUs
  const productCodeRegex = /\b([A-Z]{2,}\d{3,}|\d{3,}[A-Z]{2,})\b/g;
  const matches = text.match(productCodeRegex);
  
  if (matches) {
    products.push(...new Set(matches));
  }
  
  return {
    productCodes: products,
    totalProducts: products.length
  };
}

// ==========================================
// EXTRACT TABLES (SIMPLE HEURISTIC)
// ==========================================
function extractTables(text) {
  const tables = [];
  const lines = text.split('\n');
  
  let currentTable = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table-like structure (multiple columns separated by spaces/tabs)
    const columns = line.split(/\s{2,}|\t/).filter(col => col.trim());
    
    if (columns.length >= 3) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(columns);
    } else if (inTable && currentTable.length > 2) {
      // End of table
      tables.push(currentTable);
      currentTable = [];
      inTable = false;
    }
  }
  
  return tables;
}

// ==========================================
// EXTRACT SPECIFICATIONS
// ==========================================
function extractSpecifications(text) {
  const specs = {};
  
  // Common specification patterns
  const patterns = [
    /Material:\s*(.+?)(?:\n|$)/gi,
    /Dimensions?:\s*(.+?)(?:\n|$)/gi,
    /Weight:\s*(.+?)(?:\n|$)/gi,
    /Color:\s*(.+?)(?:\n|$)/gi,
    /Size:\s*(.+?)(?:\n|$)/gi,
    /Capacity:\s*(.+?)(?:\n|$)/gi,
    /Packaging:\s*(.+?)(?:\n|$)/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const key = match[0].split(':')[0].trim();
      specs[key] = match[1].trim();
    });
  });
  
  return specs;
}

// ==========================================
// EXTRACT PRICING INFORMATION
// ==========================================
function extractPricing(text) {
  const pricing = [];
  
  // Look for price patterns (₹, Rs., $, USD, etc.)
  const priceRegex = /(?:₹|Rs\.?|USD|\$|EUR|€)\s*[\d,]+(?:\.\d{2})?/gi;
  const matches = text.match(priceRegex);
  
  if (matches) {
    pricing.push(...new Set(matches));
  }
  
  // Look for price ranges
  const rangeRegex = /(\d+)\s*-\s*(\d+)\s*(?:₹|Rs\.?|USD|\$)/gi;
  const rangeMatches = [...text.matchAll(rangeRegex)];
  rangeMatches.forEach(match => {
    pricing.push(match[0]);
  });
  
  return pricing;
}

// ==========================================
// EXTRACT MOQ (MINIMUM ORDER QUANTITY)
// ==========================================
function extractMOQ(text) {
  const moqPatterns = [
    /MOQ:?\s*(\d+)/gi,
    /Minimum Order Quantity:?\s*(\d+)/gi,
    /Min\.? Order:?\s*(\d+)/gi,
    /Minimum Quantity:?\s*(\d+)/gi,
  ];
  
  for (const pattern of moqPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return 'Not specified';
}

// ==========================================
// EXTRACT LEAD TIME
// ==========================================
function extractLeadTime(text) {
  const leadTimePatterns = [
    /Lead Time:?\s*(.+?)(?:\n|$)/gi,
    /Delivery Time:?\s*(.+?)(?:\n|$)/gi,
    /Production Time:?\s*(.+?)(?:\n|$)/gi,
    /(\d+)\s*(?:days?|weeks?|months?)\s*(?:lead time|delivery)/gi,
  ];
  
  for (const pattern of leadTimePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return 'Not specified';
}

// ==========================================
// EXTRACT BRANDING METHODS
// ==========================================
function extractBrandingMethods(text) {
  const methods = [];
  const brandingKeywords = [
    'screen print', 'embroidery', 'laser engraving', 'pad print',
    'digital print', 'heat transfer', 'debossing', 'embossing',
    'sublimation', 'UV print', 'laser etch'
  ];
  
  const lowerText = text.toLowerCase();
  
  brandingKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      methods.push(keyword);
    }
  });
  
  return methods;
}
