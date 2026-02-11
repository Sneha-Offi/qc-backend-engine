import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '', // User needs to add this
});

// ==========================================
// AI-POWERED CONFLICT DETECTION
// ==========================================
export async function detectConflicts(data) {
  const { productData, vendorFiles, webSearchResults, category, categoryAttributes } = data;
  
  // If no API key, return basic rule-based analysis
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  No Anthropic API key found. Using rule-based conflict detection.');
    return ruleBasedConflictDetection(data);
  }
  
  try {
    console.log('🤖 Running AI-powered conflict detection...');
    
    // Prepare data for AI analysis
    const prompt = buildAnalysisPrompt(productData, vendorFiles, webSearchResults, category, categoryAttributes);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const analysisText = response.content[0].text;
    
    // Parse AI response into structured format
    const conflicts = parseAIResponse(analysisText);
    
    return conflicts;
    
  } catch (error) {
    console.error('AI Analysis Error:', error.message);
    console.log('Falling back to rule-based analysis...');
    return ruleBasedConflictDetection(data);
  }
}

// ==========================================
// BUILD ANALYSIS PROMPT FOR CLAUDE
// ==========================================
function buildAnalysisPrompt(productData, vendorFiles, webSearchResults, category, categoryAttributes) {
  // Get category-specific info
  const categoryName = category || 'Unknown';
  const detectedAttrs = categoryAttributes?.categoryAttributes || {};
  const requiredAttrs = categoryAttributes?.requiredAttributes || {};
  
  return `You are a B2B product quality control analyst for a corporate gifting platform (OffiNeeds.com). 

**IMPORTANT: This product has been automatically classified as category: ${categoryName}**

**CRITICAL RULES:**
1. ONLY extract and validate attributes relevant to ${categoryName} products
2. IGNORE attributes from other categories (e.g., if this is "Home & Living", ignore "pages", "ruling", "binding" which are for notebooks)
3. DO NOT extract attributes from web search results - use them ONLY for validation and cross-checking
4. Primary source of truth: Product URL and product title
5. If specifications contradict the title, FLAG it as suspicious data

Analyze the following product data sources and identify ANY conflicts, inconsistencies, missing information, or red flags:

# PRODUCT PAGE DATA (PRIMARY SOURCE):
Title: ${productData.title}
Price: ${productData.price}
Description: ${productData.description}
URL: ${productData.url}

# DETECTED CATEGORY-SPECIFIC ATTRIBUTES (Use these ONLY):
Category: ${categoryName}
Extracted Attributes: ${JSON.stringify(detectedAttrs, null, 2)}
Required Critical Attributes: ${JSON.stringify(requiredAttrs.critical || [], null, 2)}
Required Recommended Attributes: ${JSON.stringify(requiredAttrs.recommended || [], null, 2)}

# RAW SPECIFICATIONS (For reference only - filter by category):
${JSON.stringify(productData.specifications, null, 2)}

**IMPORTANT:** If specifications contain attributes from OTHER categories (e.g., notebook attributes for a kitchen utensil), FLAG this as data corruption and IGNORE those attributes!

# VENDOR FILES DATA (For validation):
${vendorFiles.map((file, idx) => `
File ${idx + 1}: ${file.filename}
${JSON.stringify(file.data.extractedData || file.data, null, 2)}
`).join('\n')}

# WEB SEARCH RESULTS (For validation ONLY - DO NOT extract attributes from here):
${webSearchResults.map((result, idx) => `
Result ${idx + 1}: ${result.title}
${result.snippet}
Link: ${result.link}
`).join('\n')}

**NOTE:** Web search results are for VALIDATION only. Do NOT extract new attributes from them. Only use them to verify existing attributes.

# YOUR TASK:
Analyze and provide a comprehensive QC report focusing ONLY on ${categoryName}-specific attributes:

1. **CRITICAL CONFLICTS**: Price mismatches, MOQ inconsistencies, ${categoryName}-specific attribute conflicts
2. **DATA CORRUPTION**: Flag if product page contains attributes from wrong category (e.g., notebook specs on a peeler page)
3. **MISSING DATA**: Required attributes for ${categoryName} products (${requiredAttrs.critical?.join(', ') || 'MOQ, price, specifications'})
4. **BRAND VALIDATION**: Verify brand name authenticity across all sources

**IMPORTANT FILTERING RULES:**
- For ${categoryName} products, ONLY validate these attribute types: ${requiredAttrs.critical?.join(', ') || 'category-specific attributes'}
- IGNORE attributes from other categories (e.g., if category is "Home & Living", ignore "pages", "ruling", "binding" which are for "Office Accessories")
- Flag if the product appears to be miscategorized

# OUTPUT FORMAT (JSON):
Return ONLY valid JSON with this exact structure:

{
  "conflicts": [
    {
      "type": "price_mismatch|moq_conflict|spec_conflict|missing_data|brand_issue|category_mismatch",
      "severity": "critical|high|medium|low",
      "description": "Clear description of the issue",
      "sources": ["source1", "source2"],
      "recommendation": "What to do about it"
    }
  ],
  "missingAttributes": {
    "critical": ["list of critical missing fields specific to ${categoryName}"],
    "recommended": ["list of recommended fields for ${categoryName}"]
  },
  "brandValidation": {
    "brandName": "detected brand name or 'Unknown'",
    "confidence": "high|medium|low",
    "verified": true|false,
    "notes": "verification details"
  },
  "completenessScore": {
    "productPage": 0-100,
    "vendorFiles": 0-100,
    "overall": 0-100
  },
  "recommendations": ["list of actionable recommendations"],
  "overallRisk": "low|medium|high|critical"
}`;
}

// ==========================================
// PARSE AI RESPONSE
// ==========================================
function parseAIResponse(text) {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, return error
    throw new Error('No valid JSON in AI response');
    
  } catch (error) {
    console.error('Failed to parse AI response:', error.message);
    return {
      conflicts: [{
        type: 'parsing_error',
        severity: 'high',
        description: 'Failed to parse AI analysis. Please try again.',
        sources: ['AI'],
        recommendation: 'Retry analysis or use manual review'
      }],
      missingAttributes: { critical: [], recommended: [] },
      brandValidation: { brandName: 'Unknown', confidence: 'low', verified: false },
      completenessScore: { productPage: 0, vendorFiles: 0, overall: 0 },
      recommendations: ['Retry AI analysis'],
      overallRisk: 'high'
    };
  }
}

// ==========================================
// RULE-BASED CONFLICT DETECTION (FALLBACK)
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
      notes: 'Basic rule-based brand detection. Use AI analysis for better accuracy.'
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
// EXPORT FOR GENERAL AI ANALYSIS
// ==========================================
export async function analyzeWithAI(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    return response.content[0].text;
  } catch (error) {
    console.error('AI Analysis Error:', error.message);
    throw error;
  }
}
