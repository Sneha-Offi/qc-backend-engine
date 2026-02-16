import axios from 'axios';
import * as cheerio from 'cheerio';

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
    console.log(`Scraping: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
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
            specifications[key] = value;
          }
        }
      });
    });
    
    // Try list-based specs
    $('.specifications li, .specs li, .product-specs li').each((i, item) => {
      const text = $(item).text().trim();
      const parts = text.split(':');
      if (parts.length === 2) {
        specifications[parts[0].trim()] = parts[1].trim();
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







