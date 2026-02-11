// ==========================================
// CATEGORY DETECTION & ATTRIBUTE MAPPING
// ==========================================

export const PRODUCT_CATEGORIES = {
  BAGS: 'bags',
  HOME_LIVING: 'home_living',
  OFFICE_ACCESSORIES: 'office_accessories',
  APPAREL: 'apparel',
  GOURMET: 'gourmet',
  GADGETS_TECH: 'gadgets_tech',
  FITNESS: 'fitness',
  ECO_FRIENDLY: 'eco_friendly',
  BY_OCCASION: 'by_occasion'
};

// ==========================================
// CATEGORY DETECTION KEYWORDS
// ==========================================
const CATEGORY_KEYWORDS = {
  [PRODUCT_CATEGORIES.BAGS]: [
    'bag', 'backpack', 'rucksack', 'duffel', 'tote', 'sling', 'messenger', 
    'laptop bag', 'travel bag', 'gym bag', 'school bag', 'handbag', 'purse',
    'satchel', 'clutch', 'pouch', 'travel tote', 'shopping bag', 'carry bag'
  ],
  [PRODUCT_CATEGORIES.HOME_LIVING]: [
    'bottle', 'sipper', 'cup', 'mug', 'tumbler', 'flask', 'thermos', 
    'water bottle', 'coffee mug', 'tea cup', 'drinkware', 'home decor',
    'cushion', 'pillow', 'blanket', 'photo frame', 'fun game', 'board game',
    // Kitchen utensils & tools
    'peeler', 'grater', 'slicer', 'opener', 'bottle opener', 'can opener',
    'spatula', 'ladle', 'whisk', 'tongs', 'masher', 'strainer', 'colander',
    'chopper', 'cutter', 'knife', 'kitchen tool', 'kitchen utensil',
    'cookware', 'bakeware', 'cutting board', 'rolling pin'
  ],
  [PRODUCT_CATEGORIES.OFFICE_ACCESSORIES]: [
    'notebook', 'diary', 'journal', 'pen', 'pencil', 'folder', 'organizer',
    'desk clock', 'calendar', 'coaster', 'mouse pad', 'desk accessory',
    'stationery', 'planner', 'notepad', 'sticky notes'
  ],
  [PRODUCT_CATEGORIES.APPAREL]: [
    'tshirt', 't-shirt', 'shirt', 'jacket', 'hoodie', 'sweatshirt', 'polo',
    'cap', 'hat', 'apparel', 'clothing', 'wear', 'jersey', 'vest'
  ],
  [PRODUCT_CATEGORIES.GOURMET]: [
    'chocolate', 'dry fruit', 'nuts', 'snack', 'cookies', 'biscuit',
    'gourmet', 'food', 'edible', 'confectionery', 'sweet', 'hamper'
  ],
  [PRODUCT_CATEGORIES.GADGETS_TECH]: [
    'earphone', 'headphone', 'earbuds', 'bluetooth', 'speaker', 'charger',
    'power bank', 'usb', 'cable', 'tech', 'gadget', 'electronic',
    'keychain', 'pen drive', 'mouse', 'keyboard', 'webcam'
  ],
  [PRODUCT_CATEGORIES.FITNESS]: [
    'fitness', 'gym', 'yoga', 'exercise', 'workout', 'sports',
    'dumbbell', 'resistance band', 'yoga mat', 'sipper', 'shaker'
  ],
  [PRODUCT_CATEGORIES.ECO_FRIENDLY]: [
    'eco', 'sustainable', 'biodegradable', 'organic', 'bamboo',
    'jute', 'recycled', 'green', 'environment', 'natural'
  ]
};

// ==========================================
// CATEGORY-SPECIFIC ATTRIBUTES
// ==========================================
export const CATEGORY_ATTRIBUTES = {
  [PRODUCT_CATEGORIES.BAGS]: {
    critical: ['capacity', 'material', 'dimensions', 'moq', 'price'],
    recommended: [
      'weight', 'compartments', 'laptop_size', 'water_resistance',
      'branding_area', 'color_options', 'warranty', 'lead_time'
    ],
    extractors: {
      capacity: /(?:capacity|volume)[:|\s]+(\d+)\s*(l|liter|litre)/gi,
      laptop_size: /(?:laptop|notebook)[:|\s]*(\d+)\s*(?:inch|")/gi,
      compartments: /(\d+)\s*(?:compartment|pocket)/gi,
      water_resistance: /(?:water\s*(?:proof|resistant)|waterproof)/gi
    }
  },
  
  [PRODUCT_CATEGORIES.HOME_LIVING]: {
    critical: ['capacity', 'material', 'moq', 'price'],
    recommended: [
      'insulation', 'temperature_retention', 'leak_proof', 'dishwasher_safe',
      'dimensions', 'branding_methods', 'color_options', 'lead_time',
      // Kitchen tool specific
      'blade_material', 'handle_material', 'features', 'warranty'
    ],
    extractors: {
      capacity: /(?:capacity|volume)[:|\\s]+(\\d+)\\s*(ml|milliliter|litre|liter|oz)/gi,
      insulation: /(?:double|single)\\s*wall|insulated|vacuum/gi,
      temperature_retention: /(?:keeps\\s*(?:hot|cold)|retains\\s*temperature).*?(\\d+)\\s*(?:hour|hr)/gi,
      leak_proof: /leak\\s*(?:proof|resistant)/gi,
      dishwasher_safe: /dishwasher\\s*safe/gi,
      // Kitchen tool extractors
      blade_material: /(?:blade|edge)[:|\\s]*(stainless\\s*steel|ceramic|carbon\\s*steel)/gi,
      handle_material: /(?:handle|grip)[:|\\s]*(plastic|rubber|wood|steel|silicone)/gi,
      features: /(?:ergonomic|comfortable|non\\s*slip|rust\\s*proof|durable)/gi
    }
  },
  
  [PRODUCT_CATEGORIES.OFFICE_ACCESSORIES]: {
    critical: ['material', 'dimensions', 'moq', 'price'],
    recommended: [
      'pages', 'ruling', 'binding', 'color_options', 'branding_area',
      'packaging', 'customization', 'lead_time'
    ],
    extractors: {
      pages: /(\d+)\s*(?:page|sheet|leaf)/gi,
      ruling: /(?:ruled|plain|dotted|grid|lined)/gi,
      binding: /(?:spiral|hard\s*bound|wire|stitched|perfect\s*bound)/gi
    }
  },
  
  [PRODUCT_CATEGORIES.APPAREL]: {
    critical: ['fabric', 'material', 'gsm', 'sizes', 'moq', 'price'],
    recommended: [
      'fit', 'color_options', 'care_instructions', 'branding_methods',
      'branding_positions', 'gender', 'neck_type', 'sleeve_length', 'lead_time'
    ],
    extractors: {
      gsm: /(\d+)\s*gsm/gi,
      sizes: /(?:size|available in)[:|\s]*((?:xs|s|m|l|xl|xxl|xxxl)(?:\s*,\s*(?:xs|s|m|l|xl|xxl|xxxl))*)/gi,
      fabric: /(?:100%|pure)?\s*(cotton|polyester|poly\s*cotton|blend|dri\s*fit|jersey)/gi,
      fit: /(?:regular|slim|relaxed|oversized|athletic)\s*fit/gi,
      neck_type: /(?:round|v|collar|polo|henley)\s*neck/gi,
      sleeve_length: /(?:half|full|short|long|three\s*quarter)\s*sleeve/gi
    }
  },
  
  [PRODUCT_CATEGORIES.GOURMET]: {
    critical: ['net_weight', 'packaging', 'shelf_life', 'moq', 'price'],
    recommended: [
      'ingredients', 'allergens', 'fssai', 'storage_conditions',
      'nutritional_info', 'custom_packaging', 'custom_labels', 'lead_time'
    ],
    extractors: {
      net_weight: /(?:net\s*weight|weight)[:|\s]+(\d+)\s*(g|gm|gram|kg|kilogram)/gi,
      shelf_life: /(?:shelf\s*life|best\s*before)[:|\s]+(\d+)\s*(day|month|year)/gi,
      fssai: /fssai\s*(?:no|number|lic|license)?[:|\s]*(\d+)/gi,
      allergens: /(?:contains|allergen)[:|\s]*(.*?)(?:\.|$)/gi
    }
  },
  
  [PRODUCT_CATEGORIES.GADGETS_TECH]: {
    critical: ['specifications', 'compatibility', 'moq', 'price'],
    recommended: [
      'battery', 'connectivity', 'charging_time', 'warranty',
      'certifications', 'material', 'dimensions', 'branding', 'lead_time'
    ],
    extractors: {
      battery: /(?:battery|mah)[:|\s]*(\d+)\s*mah/gi,
      connectivity: /(?:bluetooth|wireless|wired|usb|type\s*c)/gi,
      charging_time: /(?:charging\s*time)[:|\s]+(\d+)\s*(?:hour|hr|minute|min)/gi,
      warranty: /(\d+)\s*(?:year|month|day)\s*warranty/gi,
      bluetooth_version: /bluetooth\s*(\d+\.\d+)/gi
    }
  },
  
  [PRODUCT_CATEGORIES.FITNESS]: {
    critical: ['material', 'dimensions', 'moq', 'price'],
    recommended: [
      'weight_capacity', 'resistance_level', 'features', 'usage_instructions',
      'branding', 'color_options', 'warranty', 'lead_time'
    ],
    extractors: {
      weight_capacity: /(?:capacity|holds|supports)[:|\s]+(\d+)\s*(?:kg|kilogram)/gi,
      resistance: /(?:resistance|level)[:|\s]*(light|medium|heavy|strong)/gi
    }
  },
  
  [PRODUCT_CATEGORIES.ECO_FRIENDLY]: {
    critical: ['material', 'eco_certifications', 'moq', 'price'],
    recommended: [
      'biodegradable', 'sustainable_sourcing', 'recycled_content',
      'carbon_footprint', 'packaging', 'dimensions', 'lead_time'
    ],
    extractors: {
      eco_certification: /(?:eco\s*certified|iso\s*14001|fsc|green\s*certified)/gi,
      biodegradable: /(?:bio\s*degradable|compost|decompose)/gi,
      recycled: /(\d+)%?\s*recycled/gi
    }
  }
};

// ==========================================
// DETECT CATEGORY FROM PRODUCT DATA
// ==========================================
export function detectProductCategory(productData) {
  // PRIORITY SYSTEM:
  // 1. Title match = ABSOLUTE (10x weight) - Title is the source of truth
  // 2. Description match = High (3x weight)  
  // 3. Raw text match = Very low (0.1x weight) - Often contaminated with wrong data
  
  const titleText = (productData.title || '').toLowerCase();
  const descriptionText = (productData.description || '').toLowerCase();
  const rawText = (productData.rawText || '').toLowerCase();
  
  let categoryScores = {};
  
  // Score each category based on keyword matches
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      
      // Title matches get 10x weight (ABSOLUTE PRIORITY - Title is the source of truth!)
      const titleMatches = titleText.match(regex);
      if (titleMatches) {
        score += titleMatches.length * 10;
      }
      
      // Description matches get 3x weight
      const descMatches = descriptionText.match(regex);
      if (descMatches) {
        score += descMatches.length * 3;
      }
      
      // Raw text matches get 0.1x weight (very low - often has wrong data)
      const rawMatches = rawText.match(regex);
      if (rawMatches) {
        score += rawMatches.length * 0.1;
      }
    });
    categoryScores[category] = score;
  });
  
  // Find category with highest score
  const detectedCategory = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)[0];
  
  return detectedCategory ? detectedCategory[0] : null;
}

// ==========================================
// EXTRACT CATEGORY-SPECIFIC ATTRIBUTES
// ==========================================
export function extractCategoryAttributes(productData, category) {
  if (!category) return {};
  
  const categoryConfig = CATEGORY_ATTRIBUTES[category];
  if (!categoryConfig) return {};
  
  const extracted = {};
  const searchText = `${productData.title} ${productData.description} ${productData.rawText}`;
  
  // Use category-specific extractors
  Object.entries(categoryConfig.extractors).forEach(([attrName, regex]) => {
    const matches = searchText.match(regex);
    if (matches) {
      if (attrName.includes('proof') || attrName.includes('safe') || attrName.includes('biodegradable')) {
        extracted[attrName] = true;
      } else if (matches.length === 1) {
        extracted[attrName] = matches[0];
      } else {
        extracted[attrName] = matches;
      }
    }
  });
  
  return {
    category,
    categoryAttributes: extracted,
    requiredAttributes: {
      critical: categoryConfig.critical,
      recommended: categoryConfig.recommended
    }
  };
}

// ==========================================
// CALCULATE CATEGORY-SPECIFIC COMPLETENESS
// ==========================================
export function calculateCategoryCompleteness(productData, vendorFiles, category) {
  if (!category) return { score: 0, details: 'Category not detected' };
  
  const categoryConfig = CATEGORY_ATTRIBUTES[category];
  if (!categoryConfig) return { score: 0, details: 'Invalid category' };
  
  const criticalAttrs = categoryConfig.critical;
  const recommendedAttrs = categoryConfig.recommended;
  
  let criticalFound = 0;
  let recommendedFound = 0;
  
  // Check product data and vendor files for attributes
  const allData = JSON.stringify({
    ...productData,
    vendorFiles: vendorFiles.map(f => f.data)
  }).toLowerCase();
  
  // Check critical attributes
  criticalAttrs.forEach(attr => {
    const attrSearch = attr.replace(/_/g, ' ');
    if (allData.includes(attrSearch) || allData.includes(attr)) {
      criticalFound++;
    }
  });
  
  // Check recommended attributes
  recommendedAttrs.forEach(attr => {
    const attrSearch = attr.replace(/_/g, ' ');
    if (allData.includes(attrSearch) || allData.includes(attr)) {
      recommendedFound++;
    }
  });
  
  // Critical: 70% weight, Recommended: 30% weight
  const criticalScore = (criticalFound / criticalAttrs.length) * 70;
  const recommendedScore = (recommendedFound / recommendedAttrs.length) * 30;
  const totalScore = Math.round(criticalScore + recommendedScore);
  
  return {
    score: totalScore,
    critical: {
      found: criticalFound,
      total: criticalAttrs.length,
      percentage: Math.round((criticalFound / criticalAttrs.length) * 100)
    },
    recommended: {
      found: recommendedFound,
      total: recommendedAttrs.length,
      percentage: Math.round((recommendedFound / recommendedAttrs.length) * 100)
    },
    missing: {
      critical: criticalAttrs.filter(attr => {
        const attrSearch = attr.replace(/_/g, ' ');
        return !allData.includes(attrSearch) && !allData.includes(attr);
      }),
      recommended: recommendedAttrs.filter(attr => {
        const attrSearch = attr.replace(/_/g, ' ');
        return !allData.includes(attrSearch) && !allData.includes(attr);
      })
    }
  };
}

// ==========================================
// GET CATEGORY DISPLAY NAME
// ==========================================
export function getCategoryDisplayName(category) {
  const names = {
    [PRODUCT_CATEGORIES.BAGS]: 'Bags & Backpacks',
    [PRODUCT_CATEGORIES.HOME_LIVING]: 'Home & Living',
    [PRODUCT_CATEGORIES.OFFICE_ACCESSORIES]: 'Office Accessories',
    [PRODUCT_CATEGORIES.APPAREL]: 'Apparel',
    [PRODUCT_CATEGORIES.GOURMET]: 'Gourmet',
    [PRODUCT_CATEGORIES.GADGETS_TECH]: 'Gadgets & Tech',
    [PRODUCT_CATEGORIES.FITNESS]: 'Fitness',
    [PRODUCT_CATEGORIES.ECO_FRIENDLY]: 'Eco-Friendly',
    [PRODUCT_CATEGORIES.BY_OCCASION]: 'By Occasion'
  };
  return names[category] || 'Unknown';
}
