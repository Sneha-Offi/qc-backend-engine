// ==========================================
// RULE-BASED CONFLICT DETECTION
// (Claude AI removed - using free analysis only)
// ==========================================
export async function detectConflicts(data) {
  const { productData, vendorFiles, webSearchResults } = data;
  
  console.log('🔍 Running rule-based conflict detection...');
  return ruleBasedConflictDetection(data);
}

// ==========================================
// RULE-BASED CONFLICT DETECTION
// ==========================================
function ruleBasedConflictDetection(data) {
  const { productData, vendorFiles, webSearchResults } = data;
  const conflicts = [];
  const missingAttributes = { critical: [], recommended: [] };
  
  // Check for critical missing data
  if (!productData.price || productData.price === 'Not found') {
    conflicts.push({
      type: 'missing_data',
      severity: 'critical',
      description: 'Product price not found on product page',
      sources: ['Product Page'],
      recommendation: 'Obtain pricing from vendor files or contact vendor'
    });
    missingAttributes.critical.push('Price');
  }
  
  if (!productData.title || productData.title === 'No title found') {
    conflicts.push({
      type: 'missing_data',
      severity: 'critical',
      description: 'Product title/name not found',
      sources: ['Product Page'],
      recommendation: 'Verify product URL and scraping accuracy'
    });
    missingAttributes.critical.push('Product Title');
  }
  
  // Check for MOQ
  const hasMOQ = vendorFiles.some(file => 
    file.data.extractedData?.moq && file.data.extractedData.moq.length > 0
  ) || productData.rawText?.toLowerCase().includes('moq');
  
  if (!hasMOQ) {
    missingAttributes.critical.push('MOQ (Minimum Order Quantity)');
    conflicts.push({
      type: 'missing_data',
      severity: 'high',
      description: 'MOQ (Minimum Order Quantity) not specified in any source',
      sources: ['All Sources'],
      recommendation: 'Contact vendor for MOQ information'
    });
  }
  
  // Check for lead time
  const hasLeadTime = vendorFiles.some(file => 
    file.data.leadTime && file.data.leadTime !== 'Not specified'
  ) || productData.rawText?.toLowerCase().includes('lead time') ||
       productData.rawText?.toLowerCase().includes('delivery time');
  
  if (!hasLeadTime) {
    missingAttributes.recommended.push('Lead Time');
  }
  
  // Check for branding methods
  const hasBranding = vendorFiles.some(file => 
    file.data.brandingMethods && file.data.brandingMethods.length > 0
  ) || productData.rawText?.toLowerCase().includes('customization') ||
       productData.rawText?.toLowerCase().includes('branding');
  
  if (!hasBranding) {
    missingAttributes.recommended.push('Branding Methods');
  }
  
  // Check for material specifications
  const hasMaterial = Object.keys(productData.specifications).some(key =>
    key.toLowerCase().includes('material')
  ) || vendorFiles.some(file =>
    file.data.specifications?.material
  );
  
  if (!hasMaterial) {
    missingAttributes.recommended.push('Material Specifications');
  }
  
  // Check for dimensions
  const hasDimensions = Object.keys(productData.specifications).some(key =>
    key.toLowerCase().includes('dimension') || key.toLowerCase().includes('size')
  );
  
  if (!hasDimensions) {
    missingAttributes.recommended.push('Dimensions');
  }
  
  // Calculate completeness scores
  const productPageScore = calculateProductPageScore(productData);
  const vendorFilesScore = calculateVendorFilesScore(vendorFiles);
  const overallScore = Math.round((productPageScore + vendorFilesScore) / 2);
  
  // Brand validation (basic)
  const brandName = detectBrandName(productData, vendorFiles);
  
  return {
    conflicts,
    missingAttributes,
    brandValidation: {
      brandName: brandName || 'Unknown',
      confidence: brandName ? 'medium' : 'low',
      verified: false,
      notes: 'Rule-based brand detection (AI analysis disabled)'
    },
    completenessScore: {
      productPage: productPageScore,
      vendorFiles: vendorFilesScore,
      overall: overallScore
    },
    recommendations: generateRecommendations(conflicts, missingAttributes),
    overallRisk: calculateOverallRisk(conflicts)
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function calculateProductPageScore(productData) {
  let score = 0;
  if (productData.title && productData.title !== 'No title found') score += 25;
  if (productData.price && productData.price !== 'Not found') score += 25;
  if (productData.description && productData.description !== 'No description found') score += 15;
  if (Object.keys(productData.specifications).length > 0) score += 20;
  if (productData.images.length > 0) score += 15;
  return score;
}

function calculateVendorFilesScore(vendorFiles) {
  if (vendorFiles.length === 0) return 0;
  
  let totalScore = 0;
  vendorFiles.forEach(file => {
    let fileScore = 0;
    const data = file.data.extractedData || file.data;
    
    if (data.products && data.products.length > 0) fileScore += 20;
    if (data.pricing && data.pricing.length > 0) fileScore += 20;
    if (data.specifications && data.specifications.length > 0) fileScore += 20;
    if (data.moq && data.moq.length > 0) fileScore += 20;
    if (data.branding && data.branding.length > 0) fileScore += 20;
    
    totalScore += fileScore;
  });
  
  return Math.round(totalScore / vendorFiles.length);
}

function detectBrandName(productData, vendorFiles) {
  // Simple brand detection from title
  const title = productData.title || '';
  const words = title.split(' ');
  
  // First word is often the brand
  if (words.length > 0 && words[0].length > 2) {
    return words[0];
  }
  
  return null;
}

function generateRecommendations(conflicts, missingAttributes) {
  const recommendations = [];
  
  if (missingAttributes.critical.length > 0) {
    recommendations.push(`URGENT: Obtain critical missing data: ${missingAttributes.critical.join(', ')}`);
  }
  
  if (conflicts.length === 0) {
    recommendations.push('No major conflicts detected. Proceed with vendor onboarding.');
  } else {
    recommendations.push(`Resolve ${conflicts.length} conflict(s) before proceeding`);
  }
  
  if (missingAttributes.recommended.length > 0) {
    recommendations.push(`Consider adding: ${missingAttributes.recommended.join(', ')}`);
  }
  
  return recommendations;
}

function calculateOverallRisk(conflicts) {
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const highCount = conflicts.filter(c => c.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 1) return 'high';
  if (conflicts.length > 3) return 'medium';
  return 'low';
}

// ==========================================
// STUB FOR LEGACY AI FUNCTION
// ==========================================
export async function analyzeWithAI(prompt) {
  throw new Error('AI analysis disabled - Claude API removed to reduce costs');
}
