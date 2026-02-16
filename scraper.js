import axios from 'axios';
import * as cheerio from 'cheerio';
import { detectCategory, extractCategoryAttributes, validateCategoryAttributes } from './categoryTaxonomy.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD0AhnzXhoZGX8_5iVLIDD0BS10ll5Jla0';
const GOOGLE_CX = process.env.GOOGLE_CX || '607c25e7c7c3d4629';

// ==========================================
// GOOGLE CUSTOM SEARCH
// ==========================================
export async function searchGoogle(query, numResults = 5) {
  try {
    const url = 'https://www.googleapis.com/customsearch/v1';
    const params = {
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: query,
      num: Math.min(numResults, 10)
    };

    const response = await axios.get(url, { params });
    
    if (response.data.items) {
      return response.data.items.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Google Search API Error:', error.message);
    throw new Error('Failed to perform Google search');
  }
}

// ==========================================
// VENDOR-SPECIFIC SEARCH
// ==========================================
export async function searchVendor(vendorName, productName) {
  try {
    const query = `site:${vendorName}.com OR site:${vendorName}.in ${productName} specifications MOQ price`;
    return await searchGoogle(query, 5);
  } catch (error) {
    console.error('Vendor Search Error:', error.message);
    throw new Error('Failed to search vendor website');
  }
}

// ==========================================
// WEB SCRAPING WITH CHEERIO
// ==========================================
export async function scrapeWebsite(url) {
  try {
    console.log(`🌐 Scraping: ${url}`);
    
    // **ENHANCED: Better headers to avoid 403 errors**
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000, // Increased timeout
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract basic information
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'No title found';
    
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().trim() || 
                       'No description found';
    
    // Extract price information
    let price = 'Not found';
    const priceSelectors = [
      '.price', '#price', '[itemprop="price"]', '.product-price',
      '.a-price-whole', '.a-offscreen', // Amazon
      '.pdp-price', // Flipkart
      '.seller-card__price', // IndiaMART
    ];
    
    for (const selector of priceSelectors) {
      const priceElement = $(selector).first();
      if (priceElement.length) {
        price = priceElement.text().trim();
        break;
      }
    }
    
    // Extract specifications/attributes
    const specifications = {};
    
    // Try table-based specs
    $('table').each((i, table) => {
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td, th');
        if (cells.length === 2) {
          const key = $(cells[0]).text().trim();
          const value = $(cells[1]).text().trim();
          if (key && value) {
            // **Clean and normalize the attribute name**
            const cleanedKey = cleanAttributeName(key);
            if (cleanedKey && value && value.length > 0 && value.length < 500) {
              // **DEDUPLICATION: Only add if not already present**
              if (!specifications[cleanedKey]) {
                specifications[cleanedKey] = value;
              } else {
                // If already exists, prefer the longer/more detailed value
                if (value.length > specifications[cleanedKey].length) {
                  specifications[cleanedKey] = value;
                }
              }
            }
          }
        }
      });
    });
    
    // Try list-based specs
    $('.specifications li, .specs li, .product-specs li').each((i, item) => {
      const text = $(item).text().trim();
      const parts = text.split(':');
      if (parts.length === 2) {
        const cleanedKey = cleanAttributeName(parts[0].trim());
        if (cleanedKey && parts[1].trim()) {
          // **DEDUPLICATION: Only add if not already present**
          if (!specifications[cleanedKey]) {
            specifications[cleanedKey] = parts[1].trim();
          }
        }
      }
    });
    
    // Extract images
    const images = [];
    $('img').each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('icon') && !src.includes('logo')) {
        const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
        images.push(fullUrl);
      }
    });
    
    // Extract meta tags
    const metaTags = {};
    $('meta').each((i, meta) => {
      const name = $(meta).attr('name') || $(meta).attr('property');
      const content = $(meta).attr('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });
    
    // Extract all text for AI analysis
    const rawText = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit to first 5000 chars
    
    // **NEW: Extract product-specific attributes from raw text using pattern matching**
    console.log('🔍 Extracting detailed specifications from page content...');
    const extractedSpecs = extractDetailedSpecifications(rawText, title);
    
    // Merge extracted specs with table/list specs
    Object.entries(extractedSpecs).forEach(([key, value]) => {
      if (value && !specifications[key]) {
        specifications[key] = value;
      }
    });
    
    console.log(`✅ Extracted ${Object.keys(specifications).length} specifications`);
    
    // **NEW: Detect category and extract category-specific attributes**
    const category = detectCategory(title, specifications);
    if (category) {
      console.log(`🔍 Detected category: ${category}`);
      const categoryAttributes = extractCategoryAttributes(category, specifications);
      if (categoryAttributes) {
        console.log(`🔍 Extracted category-specific attributes: ${Object.keys(categoryAttributes).length}`);
        Object.entries(categoryAttributes).forEach(([key, value]) => {
          if (value && !specifications[key]) {
            specifications[key] = value;
          }
        });
      }
    }
    
    return {
      url,
      title,
      price,
      description,
      specifications,
      images: images.slice(0, 10), // Limit to 10 images
      metaTags,
      rawText,
      scrapedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Web scraping error:', error.message);
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}

// ==========================================
// INTELLIGENT SPECIFICATION EXTRACTION
// ==========================================
/**
 * Extract detailed product specifications from raw text using pattern matching
 * @param {string} text - Raw page text
 * @param {string} title - Product title for context
 * @returns {Object} - Extracted specifications
 */
function extractDetailedSpecifications(text, title) {
  const specs = {};
  
  // Normalize text
  const normalizedText = text.toLowerCase();
  
  // **1. CAPACITY / VOLUME (ml, L, oz, gallons)**
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
      
      // Convert liters to ml for consistency
      if (unit.toLowerCase().startsWith('l') && !unit.toLowerCase().includes('ml')) {
        value = parseFloat(value) * 1000;
        unit = 'ml';
      }
      
      specs['Capacity'] = `${value}${unit}`;
      break;
    }
  }
  
  // Also try to extract from title
  if (!specs['Capacity']) {
    const titleMatch = title.match(/(\d+)\s*(ml|l|oz)/i);
    if (titleMatch) {
      specs['Capacity'] = `${titleMatch[1]}${titleMatch[2]}`;
    }
  }
  
  // **2. MATERIAL (stainless steel, plastic, glass, etc.)**
  const materials = [
    'stainless steel', 'steel', 'ss', '304 stainless', '316 stainless',
    'plastic', 'bpa free plastic', 'tritan', 'polypropylene', 'pp',
    'glass', 'borosilicate glass', 
    'aluminum', 'aluminium',
    'copper',
    'silicone'
  ];
  
  for (const material of materials) {
    if (normalizedText.includes(material)) {
      specs['Material'] = material.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }
  
  // **3. HOT RETENTION (keeps hot for X hours)**
  const hotPatterns = [
    /(?:keeps?|retain|retains?|hot|warm)\s+(?:for|up to)?\s*(\d+)\s*(?:hour|hr|hrs)/i,
    /hot[:\s]+(\d+)\s*(?:hour|hr|hrs)/i,
    /(\d+)\s*(?:hour|hr|hrs)\s+hot/i
  ];
  
  for (const pattern of hotPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs['Hot Retention'] = `${match[1]} hours`;
      break;
    }
  }
  
  // **4. COLD RETENTION (keeps cold for X hours)**
  const coldPatterns = [
    /(?:keeps?|retain|retains?|cold|cool)\s+(?:for|up to)?\s*(\d+)\s*(?:hour|hr|hrs)/i,
    /cold[:\s]+(\d+)\s*(?:hour|hr|hrs)/i,
    /(\d+)\s*(?:hour|hr|hrs)\s+cold/i
  ];
  
  for (const pattern of coldPatterns) {
    const match = text.match(pattern);
    if (match && !specs['Hot Retention']) { // Avoid overwriting hot with cold
      specs['Cold Retention'] = `${match[1]} hours`;
      break;
    } else if (match) {
      specs['Cold Retention'] = `${match[1]} hours`;
    }
  }
  
  // **5. INSULATION TYPE**
  if (normalizedText.includes('vacuum insulated') || normalizedText.includes('double wall')) {
    specs['Insulation'] = 'Vacuum Insulated / Double Wall';
  } else if (normalizedText.includes('single wall')) {
    specs['Insulation'] = 'Single Wall';
  }
  
  // **6. WEIGHT**
  const weightPatterns = [
    /weight[:\s]*(\d+\.?\d*)\s*(kg|g|gm|grams|kilograms)/i,
    /(\d+\.?\d*)\s*(kg|g|gm|grams)\s+(?:weight|approx)/i
  ];
  
  for (const pattern of weightPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs['Weight'] = `${match[1]}${match[2]}`;
      break;
    }
  }
  
  // **7. DIMENSIONS (Height x Diameter, etc.)**
  const dimensionPatterns = [
    /(\d+\.?\d*)\s*(?:cm|mm|inch|inches)?\s*x\s*(\d+\.?\d*)\s*(cm|mm|inch|inches)/i,
    /dimensions?[:\s]*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x?\s*(\d+\.?\d*)?\s*(cm|mm|inch)/i
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
    'matte black', 'glossy', 'metallic'
  ];
  
  for (const color of colors) {
    if (normalizedText.includes(color) || title.toLowerCase().includes(color)) {
      specs['Color'] = color.charAt(0).toUpperCase() + color.slice(1);
      break;
    }
  }
  
  // **9. LEAK PROOF / SPILL PROOF**
  if (normalizedText.includes('leak proof') || normalizedText.includes('leakproof')) {
    specs['Leak Proof'] = 'Yes';
  }
  
  if (normalizedText.includes('spill proof') || normalizedText.includes('spillproof')) {
    specs['Spill Proof'] = 'Yes';
  }
  
  // **10. DISHWASHER SAFE**
  if (normalizedText.includes('dishwasher safe')) {
    specs['Dishwasher Safe'] = 'Yes';
  }
  
  // **11. BPA FREE**
  if (normalizedText.includes('bpa free') || normalizedText.includes('bpa-free')) {
    specs['BPA Free'] = 'Yes';
  }
  
  // **12. WARRANTY**
  const warrantyPatterns = [
    /(\d+)\s*(?:year|yr|month|day)\s+warranty/i,
    /warranty[:\s]*(\d+)\s*(?:year|yr|month)/i
  ];
  
  for (const pattern of warrantyPatterns) {
    const match = text.match(pattern);
    if (match) {
      specs['Warranty'] = match[0];
      break;
    }
  }
  
  // **13. BRAND SPECIFIC FEATURES (from raw text)**
  // Extract sentences that might contain features
  const sentences = text.match(/[^.!?]+[.!?]/g) || [];
  
  for (const sentence of sentences.slice(0, 20)) { // Check first 20 sentences
    const lower = sentence.toLowerCase();
    
    // Look for "keeps hot" or "keeps cold" statements
    if (lower.includes('keeps hot') || lower.includes('keeps warm')) {
      const hourMatch = sentence.match(/(\d+)\s*(?:hour|hr)/i);
      if (hourMatch && !specs['Hot Retention']) {
        specs['Hot Retention'] = `${hourMatch[1]} hours`;
      }
    }
    
    if (lower.includes('keeps cold') || lower.includes('keeps cool')) {
      const hourMatch = sentence.match(/(\d+)\s*(?:hour|hr)/i);
      if (hourMatch && !specs['Cold Retention']) {
        specs['Cold Retention'] = `${hourMatch[1]} hours`;
      }
    }
  }
  
  console.log(`📊 [SPEC-EXTRACTOR] Extracted ${Object.keys(specs).length} detailed specifications`);
  
  return specs;
}

// ==========================================
// ATTRIBUTE NAME CLEANING
// ==========================================
/**
 * Clean and normalize attribute names
 * @param {string} key - Raw attribute name
 * @returns {string} - Cleaned attribute name or null if invalid
 */
function cleanAttributeName(key) {
  if (!key || typeof key !== 'string') return null;
  
  // Step 1: Remove URLs and long text (likely not an attribute name)
  if (key.includes('http') || key.includes('www.') || key.length > 100) {
    return null;
  }
  
  // Step 2: Remove everything before colons or equals (often has junk prefixes)
  // Example: "ford 0 Lat = Oo @ 31,255 Capacity in Ltrs" → "Capacity in Ltrs"
  if (key.includes(':')) {
    const parts = key.split(':');
    key = parts[parts.length - 1].trim(); // Take last part after colon
  }
  if (key.includes('=')) {
    const parts = key.split('=');
    key = parts[parts.length - 1].trim(); // Take last part after equals
  }
  
  // Step 3: Remove special characters but keep spaces and common punctuation
  let cleanedKey = key
    .replace(/[^\w\s\-()%/]/g, ' ') // Keep word chars, spaces, hyphens, parentheses, %, /
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
  
  // Step 4: Remove leading numbers, symbols, and junk prefixes
  // Example: "3 SKU" → "SKU", "2 Color" → "Color", "& Brand" → "Brand"
  cleanedKey = cleanedKey
    .replace(/^[\d\W_]+/, '') // Remove ALL leading non-word characters and numbers
    .replace(/[\W_]+$/, '') // Remove trailing non-word chars
    .trim();
  
  // Step 5: Check minimum length (attribute names should be at least 3 chars)
  if (cleanedKey.length < 3) {
    return null;
  }
  
  // Step 6: Filter out specific junk patterns (more aggressive)
  const junkPatterns = [
    /^[\d\s]+$/, // Only numbers and spaces
    /^[a-z]{1,2}$/i, // Single or two letters only
    /^\d+\.\d+$/, // Just decimal numbers
    /^(of|to|the|and|or|in|at|by|for|on|is|it|be|are)$/i, // Common filler words
    /ford\s*0/i, // Specific junk pattern
    /^cc\s*[il]\s*\d/i, // "Cc I 3ll"
    /^[fy]\s*[ory]+$/i, // "FY ory"
    /^po\s*rls/i, // "Po RLS)"
    /^j\s*\)/i, // "J. ) of"
    /^lb\s*pan$/i, // "Lb Pan"
    /^eco$/i, // "Eco" alone
    /^\d+\s*lat$/i, // "0 Lat"
    /^e\s*el\s*oo/i, // "E EL oo ABEL"
    /^pgh\s*e/i, // "Pgh E So"
    /^ya\s*i\s*ers/i, // "ya I ERs St.Y"
    /^sie\s*eco$/i, // "SIE Eco"
    /^ke\s*aid\s*j$/i, // "KE aid J"
    /^\d+\s*color$/i, // "2 Color"
    /^\d+\s*sku$/i, // "3 SKU"
    /^a\s*\d+/i, // "A 3995" patterns
    /^brandingmethods$/i, // "brandingMethods" (likely a code variable)
    /^packaging$/i, // Generic "packaging" without context
  ];
  
  for (const pattern of junkPatterns) {
    if (pattern.test(cleanedKey)) {
      return null;
    }
  }
  
  // Step 7: Map common B2B attribute patterns to standard names
  const attributeMapping = {
    // Capacity/Volume
    'capacity in ltrs': 'Capacity (Litres)',
    'capacity in ml': 'Capacity (ml)',
    'ca ity in ml': 'Capacity (ml)', // OCR errors
    'capacity': 'Capacity',
    'volume': 'Capacity',
    'size': 'Size',
    
    // Material
    'material': 'Material',
    'material type': 'Material Type',
    'body material': 'Body Material',
    'outer material': 'Outer Material',
    'inner material': 'Inner Material',
    
    // Product Details
    'product name': 'Product Name',
    'brand': 'Brand',
    'brand name': 'Brand',
    'model': 'Model',
    'model number': 'Model Number',
    'sku': 'SKU',
    'product code': 'Product Code',
    'item code': 'Item Code',
    
    // Pricing & MOQ
    'price': 'Price',
    'mrp': 'MRP',
    'moq': 'MOQ (Minimum Order Quantity)',
    'minimum order quantity': 'MOQ (Minimum Order Quantity)',
    'unit price': 'Unit Price',
    
    // Customization
    'customization': 'Customization Type',
    'customization type': 'Customization Type',
    'printing method': 'Printing Method',
    'branding method': 'Branding Method',
    'branding methods': 'Branding Method',
    'logo printing': 'Logo Printing',
    
    // Dimensions & Weight
    'dimensions': 'Dimensions',
    'dimension': 'Dimensions',
    'weight': 'Weight',
    'product weight': 'Weight',
    'height': 'Height',
    'width': 'Width',
    'diameter': 'Diameter',
    
    // Features
    'features': 'Features',
    'key features': 'Key Features',
    'insulation': 'Insulation Type',
    'insulation type': 'Insulation Type',
    'leak proof': 'Leak Proof',
    'spill proof': 'Spill Proof',
    'bpa free': 'BPA Free',
    'dishwasher safe': 'Dishwasher Safe',
    
    // Thermal Properties
    'hot retention': 'Hot Retention',
    'cold retention': 'Cold Retention',
    'keeps hot': 'Hot Retention',
    'keeps cold': 'Cold Retention',
    
    // Categories
    'category': 'Category',
    'product category': 'Category',
    'product type': 'Product Type',
    'type': 'Product Type',
    'bottle type': 'Bottle Type',
    
    // Stock & Delivery
    'availability': 'Availability',
    'in stock': 'Stock Status',
    'stock': 'Stock Status',
    'delivery time': 'Delivery Time',
    'lead time': 'Lead Time',
    'dispatch time': 'Dispatch Time',
    'delivery': 'Delivery',
    
    // Warranty & Certification
    'warranty': 'Warranty',
    'warranty period': 'Warranty',
    'certification': 'Certifications',
    'certifications': 'Certifications',
    
    // Other
    'color': 'Color',
    'colour': 'Color',
    'available colors': 'Available Colors',
    'no of compartments': 'Number of Compartments',
    'compartments': 'Compartments',
    'country of origin': 'Country of Origin',
    'made in': 'Country of Origin',
    'manufacturer': 'Manufacturer',
    'usage': 'Usage/Application',
    'application': 'Usage/Application',
    'cap type': 'Cap Type',
    'cap': 'Cap Type',
    'friendly packaging': 'Eco-Friendly Packaging',
    'eco friendly': 'Eco-Friendly',
  };
  
  // Normalize to lowercase for comparison
  const lowerKey = cleanedKey.toLowerCase();
  
  // Check if we have a mapping
  if (attributeMapping[lowerKey]) {
    return attributeMapping[lowerKey];
  }
  
  // Step 8: If no mapping, convert to Title Case
  cleanedKey = cleanedKey
    .split(' ')
    .map(word => {
      // Keep abbreviations uppercase (2-4 chars, all caps)
      if (word.toUpperCase() === word && word.length >= 2 && word.length <= 4) {
        return word.toUpperCase();
      }
      // Title case for normal words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  // Step 9: Final validation - reject if still looks like junk
  if (cleanedKey.match(/^\d+$/) || cleanedKey.length > 50) {
    return null; // Pure numbers or very long names
  }
  
  return cleanedKey;
}







