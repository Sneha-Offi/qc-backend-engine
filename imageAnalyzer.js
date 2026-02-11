import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Extract product attributes from a screenshot using Claude Vision API
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} mimeType - The image MIME type (e.g., 'image/png')
 * @returns {Promise<Object>} - Extracted product attributes
 */
export async function extractAttributesFromImage(imageBuffer, mimeType) {
  try {
    console.log('🖼️ [IMAGE-ANALYZER] Starting image analysis with Claude Vision...');
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Prepare the prompt for Claude
    const prompt = `You are analyzing a screenshot of product attributes from an e-commerce admin panel or vendor catalog.

TASK: Extract ALL visible product information from this image and return it as structured JSON.

REQUIRED FIELDS TO EXTRACT (if visible):
- Product Name / Title
- Brand / Vendor Name
- Category
- Price (and currency)
- MOQ (Minimum Order Quantity)
- Material / Composition
- Dimensions (Length, Width, Height)
- Weight
- Color / Colors available
- SKU / Product Code
- Lead Time / Delivery Time
- Branding Methods (printing, engraving, etc.)
- Printable Area / Branding Area
- Packaging details
- Certifications (BIS, ISO, etc.)
- Product Description
- Any other specifications visible

IMPORTANT:
1. Extract EXACTLY what you see - don't make assumptions
2. If a field is not visible, set it to null
3. Preserve numbers, units, and formatting as shown
4. Return ONLY valid JSON, no markdown or extra text

RESPONSE FORMAT:
{
  "productName": "...",
  "brand": "...",
  "category": "...",
  "price": {...},
  "moq": "...",
  "material": "...",
  "dimensions": {...},
  "weight": "...",
  "color": "...",
  "sku": "...",
  "leadTime": "...",
  "brandingMethods": [...],
  "printableArea": "...",
  "packaging": "...",
  "certifications": [...],
  "description": "...",
  "specifications": {...},
  "extractedText": "..." // Full text visible in image
}`;

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log('✅ [IMAGE-ANALYZER] Claude Vision response received');
    
    // Extract the JSON from Claude's response
    const textContent = response.content.find(block => block.type === 'text')?.text || '';
    
    // Try to parse JSON from the response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const jsonText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonText);
      console.log('✅ [IMAGE-ANALYZER] Successfully parsed extracted data');
    } catch (parseError) {
      console.error('❌ [IMAGE-ANALYZER] Failed to parse JSON:', parseError);
      console.error('Raw response:', textContent);
      
      // Fallback: return raw text
      extractedData = {
        productName: null,
        brand: null,
        category: null,
        extractedText: textContent,
        error: 'Failed to parse structured data',
        specifications: {}
      };
    }
    
    // Add metadata
    extractedData._metadata = {
      source: 'screenshot-ocr',
      analyzer: 'claude-vision-api',
      extractedAt: new Date().toISOString(),
      imageSize: imageBuffer.length
    };
    
    console.log('📊 [IMAGE-ANALYZER] Extracted attributes:', Object.keys(extractedData).length, 'fields');
    
    return extractedData;
    
  } catch (error) {
    console.error('❌ [IMAGE-ANALYZER] Error analyzing image:', error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
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
