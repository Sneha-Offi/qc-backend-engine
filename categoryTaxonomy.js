// ==========================================
// PRODUCT CATEGORY TAXONOMY
// ==========================================
// Defines required attributes for each product category
// Based on OffiNeeds.com B2B gifting platform requirements

export const CATEGORY_TAXONOMY = {
  // ==========================================
  // APPAREL CATEGORIES
  // ==========================================
  'apparel': {
    name: 'Apparel - Global Category',
    keywords: ['apparel', 'clothing', 'garment', 'wear', 'dress'],
    requiredAttributes: [
      'Gender',
      'Fit',
      'Fabric',
      'GSM',
      'Sleeve Type',
      'Neck Type',
      'Brand',
      'Size',
      'Color',
      'Season'
    ],
    attributePatterns: {
      'Gender': ['men', 'women', 'unisex', 'male', 'female'],
      'Fit': ['regular', 'slim', 'oversized', 'relaxed', 'fitted'],
      'Fabric': ['cotton', 'polyester', 'blend', 'dry-fit', 'linen', 'silk'],
      'GSM': [/\d+\s*gsm/i],
      'Sleeve Type': ['half', 'full', 'sleeveless', 'short sleeve', 'long sleeve'],
      'Neck Type': ['round', 'polo', 'v-neck', 'crew neck', 'collar'],
      'Size': ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'],
      'Color': ['black', 'white', 'blue', 'red', 'green', 'navy', 'grey'],
      'Season': ['summer', 'winter', 'all-season', 'spring', 'fall']
    }
  },
  
  'tshirts': {
    name: 'T-Shirts',
    keywords: ['t-shirt', 'tshirt', 'tee', 't shirt', 'round neck', 'polo'],
    requiredAttributes: [
      'Gender',
      'Fit',
      'Sleeve Length',
      'Neck Type',
      'Fabric',
      'GSM',
      'Size',
      'Color',
      'Season'
    ],
    attributePatterns: {
      'Sleeve Length': ['half sleeve', 'full sleeve', 'sleeveless', 'short', 'long'],
      'Neck Type': ['round', 'polo', 'v-neck', 'crew'],
      'GSM': [/\d+\s*gsm/i]
    }
  },
  
  'shirts': {
    name: 'Shirts',
    keywords: ['shirt', 'formal shirt', 'casual shirt', 'button shirt'],
    requiredAttributes: [
      'Gender',
      'Fit',
      'Sleeve Length',
      'Collar Type',
      'Fabric',
      'GSM',
      'Size',
      'Color'
    ],
    attributePatterns: {
      'Collar Type': ['spread', 'button-down', 'mandarin', 'classic', 'cutaway'],
      'Sleeve Length': ['half sleeve', 'full sleeve', 'sleeveless']
    }
  },
  
  'jackets': {
    name: 'Jackets & Hoodies',
    keywords: ['jacket', 'hoodie', 'sweatshirt', 'bomber', 'blazer', 'windcheater'],
    requiredAttributes: [
      'Type',
      'Gender',
      'Fit',
      'Closure Type',
      'Fabric',
      'GSM',
      'Size',
      'Color'
    ],
    attributePatterns: {
      'Type': ['hoodie', 'zipper hoodie', 'sweatshirt', 'jacket', 'bomber'],
      'Closure Type': ['zipper', 'pullover', 'button']
    }
  },
  
  'caps': {
    name: 'Caps',
    keywords: ['cap', 'hat', 'baseball cap', 'snapback', 'beanie'],
    requiredAttributes: [
      'Gender',
      'Closure Type',
      'Fabric'
    ],
    attributePatterns: {
      'Closure Type': ['adjustable', 'fitted', 'snapback', 'velcro']
    }
  },
  
  // ==========================================
  // BAGS CATEGORIES
  // ==========================================
  'bags': {
    name: 'Bags - Global Category',
    keywords: ['bag', 'backpack', 'handbag', 'sling', 'duffle', 'messenger'],
    requiredAttributes: [
      'Bag Type',
      'Capacity',
      'Laptop Size Supported',
      'Material',
      'Closure Type',
      'Water Resistance',
      'Color',
      'Brand'
    ],
    attributePatterns: {
      'Bag Type': ['backpack', 'laptop bag', 'tote bag', 'sling bag', 'duffle bag', 'travel bag', 'handbag', 'messenger bag'],
      'Capacity': [/\d+\s*l(?:itre|iter)?/i, /\d+\s*ml/i, 'upto 10l', '10-20l', '20-30l', 'above 30l'],
      'Laptop Size Supported': ['not applicable', 'upto 13', '14', '15.6', '17'],
      'Material': ['polyester', 'nylon', 'canvas', 'leather', 'faux leather', 'cotton'],
      'Closure Type': ['zipper', 'magnetic', 'buckle', 'drawstring'],
      'Water Resistance': ['water resistant', 'waterproof', 'not water resistant']
    }
  },
  
  'laptop_bags': {
    name: 'Laptop Bags & Backpacks',
    keywords: ['laptop bag', 'laptop backpack', 'laptop messenger', 'laptop handbag', 'business bag'],
    requiredAttributes: [
      'Bag Type',
      'Laptop Size Supported',
      'Capacity',
      'Material',
      'Compartments',
      'Water Resistance',
      'Closure Type'
    ],
    attributePatterns: {
      'Bag Type': ['laptop backpack', 'laptop messenger bag', 'laptop handbag', 'convertible backpack'],
      'Compartments': ['1-2', '3-4', '5+', /\d+\s*compartment/i]
    }
  },
  
  'tote_bags': {
    name: 'Canvas & Tote Bags',
    keywords: ['tote bag', 'canvas bag', 'shopper', 'foldable tote', 'beach bag'],
    requiredAttributes: [
      'Bag Type',
      'Material',
      'Capacity',
      'Handle Type',
      'Closure Type'
    ],
    attributePatterns: {
      'Bag Type': ['tote bag', 'canvas shopper', 'foldable tote'],
      'Material': ['canvas', 'cotton canvas', 'jute blend'],
      'Handle Type': ['short handle', 'shoulder length', 'long handle'],
      'Closure Type': ['open', 'zipper', 'button', 'magnetic snap']
    }
  },
  
  'laptop_sleeves': {
    name: 'Laptop Sleeves',
    keywords: ['laptop sleeve', 'laptop case', 'laptop cover', 'sleeve'],
    requiredAttributes: [
      'Laptop Size Supported',
      'Material',
      'Padding Type',
      'Closure Type',
      'Water Resistance'
    ],
    attributePatterns: {
      'Laptop Size Supported': ['11', '12', '13', '14', '15.6', '17'],
      'Padding Type': ['basic', 'shockproof', 'extra padded'],
      'Closure Type': ['open', 'zipper', 'button', 'velcro', 'magnetic flap']
    }
  },
  
  'travel_bags': {
    name: 'Travel Bags',
    keywords: ['travel bag', 'duffel bag', 'weekender', 'gym bag', 'carry-on'],
    requiredAttributes: [
      'Bag Type',
      'Capacity',
      'Material',
      'Wheels Type',
      'Closure Type',
      'Water Resistance',
      'Strap Type'
    ],
    attributePatterns: {
      'Bag Type': ['duffel bag', 'weekender', 'gym bag', 'carry-on bag'],
      'Capacity': ['upto 30l', '30-50l', '50l+'],
      'Wheels Type': ['with wheels', 'without wheels'],
      'Strap Type': ['handheld', 'shoulder strap', 'both']
    }
  },
  
  // ==========================================
  // OFFICE ACCESSORIES CATEGORIES
  // ==========================================
  'office_accessories': {
    name: 'Office Accessories',
    keywords: ['office accessory', 'desk accessory', 'laptop accessory', 'mobile accessory', 'charger', 'cable'],
    requiredAttributes: [
      'Product Type',
      'Material',
      'Compatibility',
      'Power Type',
      'Connectivity'
    ],
    attributePatterns: {
      'Product Type': ['desktop accessory', 'desk mat', 'mouse mat', 'laptop accessory', 'mobile accessory', 'charger', 'cable', 'stand'],
      'Material': ['plastic', 'metal', 'wood', 'pu leather', 'fabric', 'silicone'],
      'Compatibility': ['laptop', 'mobile', 'tablet', 'universal'],
      'Power Type': ['wired', 'wireless', 'battery powered'],
      'Connectivity': ['usb-a', 'usb-c', 'lightning', 'wireless']
    }
  },
  
  'desktop_accessories': {
    name: 'Desktop Accessories',
    keywords: ['pen holder', 'desk organizer', 'document tray', 'monitor stand', 'mobile stand', 'cable organizer', 'desk clock'],
    requiredAttributes: [
      'Product Type',
      'Material',
      'Number of Compartments',
      'Mount Type'
    ],
    attributePatterns: {
      'Product Type': ['pen holder', 'desk organizer', 'document tray', 'monitor stand', 'mobile stand', 'cable organizer', 'desk clock'],
      'Number of Compartments': ['1-2', '3-4', '5+'],
      'Mount Type': ['tabletop', 'clamp-mounted']
    }
  },
  
  'desk_mats': {
    name: 'Desk & Mouse Mats',
    keywords: ['desk mat', 'mouse pad', 'extended mouse mat', 'desk pad'],
    requiredAttributes: [
      'Product Type',
      'Shape',
      'Material',
      'Thickness',
      'Pattern'
    ],
    attributePatterns: {
      'Product Type': ['desk mat', 'mouse pad', 'extended mouse mat'],
      'Shape': ['rectangle', 'round', 'extended'],
      'Thickness': ['thin', 'medium', 'thick'],
      'Pattern': ['solid', 'printed', 'graphic']
    }
  },
  
  'laptop_mobile_accessories': {
    name: 'Laptop & Mobile Accessories',
    keywords: ['laptop stand', 'mobile stand', 'usb hub', 'charger', 'cable', 'docking station', 'screen cleaner', 'keyboard'],
    requiredAttributes: [
      'Product Type',
      'Compatibility',
      'Connectivity',
      'Material',
      'Power Type',
      'Adjustability',
      'Foldable',
      'Warranty'
    ],
    attributePatterns: {
      'Product Type': ['laptop stand', 'mobile stand', 'usb hub', 'charger', 'cable', 'docking station', 'screen cleaner', 'keyboard'],
      'Adjustability': ['adjustable', 'fixed'],
      'Foldable': ['yes', 'no'],
      'Warranty': ['6 months', '1 year', '2 years']
    }
  },
  
  'other_accessories': {
    name: 'Other Accessories',
    keywords: ['stress ball', 'key holder', 'card holder', 'id lanyard', 'cable tag', 'badge reel', 'sticky notes holder'],
    requiredAttributes: [
      'Product Type',
      'Material',
      'Portability'
    ],
    attributePatterns: {
      'Product Type': ['stress ball', 'key holder', 'card holder', 'id lanyard', 'cable tag', 'badge reel', 'sticky notes holder'],
      'Portability': ['pocket size', 'desk size']
    }
  },
  
  // ==========================================
  // DRINKWARE CATEGORIES (Common for bottles/flasks)
  // ==========================================
  'drinkware': {
    name: 'Drinkware',
    keywords: ['bottle', 'flask', 'sipper', 'tumbler', 'mug', 'cup', 'hydration'],
    requiredAttributes: [
      'Product Type',
      'Capacity',
      'Material',
      'Insulation Type',
      'Hot Retention',
      'Cold Retention',
      'Leak Proof',
      'BPA Free',
      'Color',
      'Brand'
    ],
    attributePatterns: {
      'Product Type': ['water bottle', 'vacuum flask', 'sipper', 'tumbler', 'mug', 'sports bottle'],
      'Capacity': [/\d+\s*ml/i, /\d+\s*l(?:itre|iter)?/i],
      'Material': ['stainless steel', 'plastic', 'glass', 'copper', 'tritan'],
      'Insulation Type': ['vacuum insulated', 'double wall', 'single wall'],
      'Hot Retention': [/\d+\s*hours?/i],
      'Cold Retention': [/\d+\s*hours?/i],
      'Leak Proof': ['yes', 'no'],
      'BPA Free': ['yes', 'no']
    }
  }
};

// ==========================================
// CATEGORY DETECTION
// ==========================================
/**
 * Detect product category from title, description, and URL
 * @param {string} title - Product title
 * @param {string} description - Product description
 * @param {string} url - Product URL
 * @returns {Object} - Detected category config or null
 */
export function detectCategory(title, description = '', url = '') {
  const searchText = `${title} ${description} ${url}`.toLowerCase();
  
  // Try to match specific categories first (most specific to least specific)
  const categoryOrder = [
    'laptop_sleeves',
    'laptop_bags',
    'tote_bags',
    'travel_bags',
    'tshirts',
    'shirts',
    'jackets',
    'caps',
    'desktop_accessories',
    'desk_mats',
    'laptop_mobile_accessories',
    'other_accessories',
    'bags',
    'apparel',
    'office_accessories',
    'drinkware'
  ];
  
  for (const categoryKey of categoryOrder) {
    const category = CATEGORY_TAXONOMY[categoryKey];
    
    // Check if any keyword matches
    for (const keyword of category.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        console.log(`✅ Category detected: ${category.name} (matched keyword: "${keyword}")`);
        return {
          key: categoryKey,
          ...category
        };
      }
    }
  }
  
  console.log('⚠️ No specific category detected, using generic extraction');
  return null;
}

// ==========================================
// ATTRIBUTE EXTRACTION HELPERS
// ==========================================
/**
 * Extract category-specific attributes from text
 * @param {string} text - Text to search
 * @param {Object} category - Category config
 * @returns {Object} - Extracted attributes
 */
export function extractCategoryAttributes(text, category) {
  const attributes = {};
  
  if (!category || !category.attributePatterns) {
    return attributes;
  }
  
  const normalizedText = text.toLowerCase();
  
  // Extract each attribute based on patterns
  Object.entries(category.attributePatterns).forEach(([attrName, patterns]) => {
    for (const pattern of patterns) {
      if (typeof pattern === 'string') {
        // Simple string matching
        if (normalizedText.includes(pattern.toLowerCase())) {
          attributes[attrName] = pattern.charAt(0).toUpperCase() + pattern.slice(1);
          break;
        }
      } else if (pattern instanceof RegExp) {
        // Regex matching
        const match = text.match(pattern);
        if (match) {
          attributes[attrName] = match[0];
          break;
        }
      }
    }
  });
  
  return attributes;
}

// ==========================================
// VALIDATION
// ==========================================
/**
 * Validate if extracted attributes meet category requirements
 * @param {Object} extractedAttributes - Attributes extracted from product
 * @param {Object} category - Category config
 * @returns {Object} - Validation result with missing attributes
 */
export function validateCategoryAttributes(extractedAttributes, category) {
  if (!category || !category.requiredAttributes) {
    return {
      isValid: true,
      missingAttributes: [],
      completeness: 100
    };
  }
  
  const missingAttributes = [];
  const extractedKeys = Object.keys(extractedAttributes);
  
  category.requiredAttributes.forEach(requiredAttr => {
    if (!extractedKeys.includes(requiredAttr)) {
      missingAttributes.push(requiredAttr);
    }
  });
  
  const completeness = Math.round(
    ((category.requiredAttributes.length - missingAttributes.length) / 
    category.requiredAttributes.length) * 100
  );
  
  return {
    isValid: missingAttributes.length === 0,
    missingAttributes,
    completeness,
    totalRequired: category.requiredAttributes.length,
    extracted: category.requiredAttributes.length - missingAttributes.length
  };
}
