import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { scrapeWebsite, searchGoogle, searchVendor } from './scraper.js';
import { extractAttributesFromFiles } from './fileParser.js';
import { extractAttributesFromImage } from './imageAnalyzer.js';
import { analyzeProduct } from './aiAnalyzer.js';
import { detectCategory, validateCategoryAttributes } from './categoryTaxonomy.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
// Configure CORS to allow Figma Make preview domains
app.use(cors({
  origin: '*', // Allow all origins (including Figma Make)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400 // Cache preflight for 24 hours
}));

app.use(express.json());

// Configure multer for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      // Allow image files for screenshot mode
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, CSV, and image files are allowed.'));
    }
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'QC Engine Backend API v3.0 - Tesseract OCR',
    features: [
      'web-scraping', 
      'google-search', 
      'pdf-parsing', 
      'excel-parsing', 
      'ai-analysis',
      'screenshot-ocr-tesseract'
    ]
  });
});

// ==========================================
// GOOGLE CUSTOM SEARCH API
// ==========================================
app.post('/api/search', async (req, res) => {
  try {
    const { query, numResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await searchGoogle(query, numResults);
    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// VENDOR-SPECIFIC SEARCH
// ==========================================
app.post('/api/search-vendor', async (req, res) => {
  try {
    const { vendorName, productName } = req.body;
    
    if (!vendorName || !productName) {
      return res.status(400).json({ error: 'Vendor name and product name are required' });
    }

    const results = await searchVendor(vendorName, productName);
    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Vendor search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// WEB SCRAPING
// ==========================================
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const data = await scrapeWebsite(url);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PDF PARSING
// ==========================================
app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const parsedData = await parsePDF(req.file.buffer);
    res.json({ 
      success: true, 
      data: parsedData,
      filename: req.file.originalname,
      filesize: req.file.size
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// EXCEL/CSV PARSING
// ==========================================
app.post('/api/parse-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel/CSV file uploaded' });
    }

    const parsedData = await parseExcel(req.file.buffer);
    res.json({ 
      success: true, 
      data: parsedData,
      filename: req.file.originalname,
      filesize: req.file.size
    });
  } catch (error) {
    console.error('Excel parsing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// AI-POWERED CONFLICT DETECTION
// ==========================================
app.post('/api/analyze-conflicts', async (req, res) => {
  try {
    const { productData, vendorFiles, webSearchResults } = req.body;
    
    if (!productData) {
      return res.status(400).json({ error: 'Product data is required' });
    }

    const conflicts = await detectConflicts({
      productData,
      vendorFiles: vendorFiles || [],
      webSearchResults: webSearchResults || []
    });

    res.json({ 
      success: true, 
      conflicts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// COMPREHENSIVE QC ANALYSIS
// ==========================================
app.post('/api/qc-analysis', upload.array('files', 10), async (req, res) => {
  try {
    const { productUrl, vendorName, useScreenshotMode } = req.body;
    
    // Screenshot mode requires vendor name, but not URL
    const isScreenshotMode = useScreenshotMode === 'true';
    
    if (!vendorName) {
      return res.status(400).json({ 
        error: 'Vendor name is required' 
      });
    }
    
    if (!isScreenshotMode && !productUrl) {
      return res.status(400).json({ 
        error: 'Product URL is required (or enable screenshot mode)' 
      });
    }

    console.log('🔍 Starting comprehensive QC analysis...');
    console.log('📸 Screenshot mode:', isScreenshotMode);
    
    let scrapedData;
    let screenshotData = null;
    
    // Step 1: Get product data (from URL or screenshot)
    if (isScreenshotMode) {
      // SCREENSHOT MODE: Extract from uploaded image
      console.log('📸 Screenshot mode enabled - looking for image file...');
      
      const imageFile = req.files?.find(f => f.mimetype.startsWith('image/'));
      
      if (!imageFile) {
        return res.status(400).json({
          error: 'Screenshot mode requires an image file upload'
        });
      }
      
      console.log(`🖼️ Processing screenshot: ${imageFile.originalname} (${imageFile.size} bytes)`);
      
      // Extract attributes from screenshot using Claude Vision
      const extractedData = await extractAttributesFromImage(imageFile.buffer, imageFile.mimetype);
      screenshotData = normalizeExtractedData(extractedData);
      scrapedData = screenshotData;
      
      console.log('✅ Screenshot analysis complete:', scrapedData.title);
      
    } else {
      // LINK MODE: **NEW APPROACH - Don't scrape the provided URL**
      // Instead: Extract brand/product name and search Google + Amazon
      console.log('🔗 Link mode: Extracting product info from URL...');
      
      // Extract product name from URL
      const urlParts = productUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      const productNameFromUrl = lastPart
        .replace(/[-_]/g, ' ')
        .replace(/\.(html|php|aspx?)$/i, '')
        .replace(/\?.*$/, '') // Remove query params
        .trim();
      
      console.log(`📦 Extracted product name: "${productNameFromUrl}"`);
      console.log(`🏷️ Brand/Vendor: "${vendorName}"`);
      
      // Initialize base product data from URL
      scrapedData = {
        url: productUrl,
        title: productNameFromUrl || vendorName + ' Product',
        description: `Product: ${productNameFromUrl}. Data aggregated from Google and Amazon search results.`,
        price: 'Not available',
        specifications: {
          'Brand': vendorName,
          'Product Name': productNameFromUrl,
          'Source URL': productUrl
        },
        images: [],
        metaTags: {},
        rawText: '',
        scrapedAt: new Date().toISOString(),
        searchBasedData: true // Flag to indicate this came from search, not direct scraping
      };
      
      // **STEP 1: Search Google for product specifications**
      console.log('🔍 Step 1: Searching Google for product specifications...');
      const googleQuery = `${productNameFromUrl} ${vendorName} specifications features price capacity material`;
      
      try {
        const googleResults = await searchGoogle(googleQuery, 5);
        console.log(`✅ Found ${googleResults.length} Google results`);
        
        // **Extract metadata from search results (titles & snippets) - NO SCRAPING NEEDED**
        if (googleResults.length > 0) {
          console.log('📋 Extracting data from Google search snippets (no scraping)...');
          
          // Use the search result snippets and titles directly
          googleResults.forEach((result, idx) => {
            // Extract any specifications from the snippet text
            const snippet = result.snippet || '';
            const title = result.title || '';
            
            // Pattern matching for common specifications
            const patterns = {
              'Capacity': /(\d+)\s*(ml|ML|litre|liter|L|oz)/i,
              'Material': /(stainless steel|plastic|glass|copper|steel|silicone|ceramic)/i,
              'Price': /₹\s*([\d,]+)|Rs\.?\s*([\d,]+)|INR\s*([\d,]+)/i,
              'Weight': /(\d+)\s*(g|kg|grams|gm)/i,
              'Hot Retention': /(\d+)\s*(hours?|hrs?)\s*(hot|warm)/i,
              'Cold Retention': /(\d+)\s*(hours?|hrs?)\s*(cold|cool)/i,
            };
            
            const combined = `${title} ${snippet}`;
            
            Object.entries(patterns).forEach(([key, pattern]) => {
              const match = combined.match(pattern);
              if (match && !scrapedData.specifications[key]) {
                scrapedData.specifications[key] = match[0];
              }
            });
            
            // Check for boolean attributes
            if (/BPA.{0,5}free/i.test(combined)) {
              scrapedData.specifications['BPA Free'] = 'Yes';
            }
            if (/leak.{0,5}proof/i.test(combined)) {
              scrapedData.specifications['Leak Proof'] = 'Yes';
            }
            if (/dishwasher.{0,5}safe/i.test(combined)) {
              scrapedData.specifications['Dishwasher Safe'] = 'Yes';
            }
          });
          
          // Store search result metadata
          scrapedData.googleSearchResults = googleResults.slice(0, 5).map(r => ({
            title: r.title,
            snippet: r.snippet,
            source: r.displayLink,
            url: r.link
          }));
          
          console.log(`✅ Extracted specifications from ${googleResults.length} search snippets (no scraping required)`);
        }
        
        // **OPTIONAL: Try scraping ONLY if we got very few specs from snippets**
        const specsCount = Object.keys(scrapedData.specifications).length;
        if (specsCount < 5 && googleResults.length > 0) {
          console.log(`⚠️ Only ${specsCount} specs found from snippets. Attempting careful scraping...`);
          
          // Try scraping top result only, with timeout
          const googleData = [];
          for (let i = 0; i < Math.min(2, googleResults.length); i++) {
            try {
              console.log(`🌐 Attempting scrape ${i+1}: ${googleResults[i].displayLink}`);
              
              // Add timeout wrapper
              const scrapeWithTimeout = Promise.race([
                scrapeWebsite(googleResults[i].link),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Scrape timeout')), 8000)
                )
              ]);
              
              const extraData = await scrapeWithTimeout;
              googleData.push({
                source: googleResults[i].displayLink,
                url: googleResults[i].link,
                data: extraData
              });
              console.log(`✅ Scraped successfully: ${extraData.title}`);
              
              // Merge the scraped data
              Object.entries(extraData.specifications || {}).forEach(([key, value]) => {
                if (!scrapedData.specifications[key] && value && value !== 'Not found') {
                  scrapedData.specifications[key] = value;
                }
              });
              
              // Stop if we got good data
              if (Object.keys(scrapedData.specifications).length >= 8) {
                console.log('✅ Sufficient specifications collected, stopping scraping.');
                break;
              }
            } catch (err) {
              console.warn(`⚠️ Scrape ${i+1} failed (expected): ${err.message}`);
              // Continue to next result
            }
          }
          
          if (googleData.length > 0) {
            scrapedData.googleScrapedSources = googleData.map(s => ({
              source: s.source,
              url: s.url,
              specsFound: Object.keys(s.data.specifications || {}).length
            }));
          }
        } else {
          console.log(`✅ Got ${specsCount} specs from snippets - skipping risky scraping`);
        }
      } catch (error) {
        console.warn('⚠️ Google search failed (continuing with base data):', error.message);
        // Continue with base product data - this is not a critical error
      }
      
      // **STEP 2: Search Amazon snippets (NO SCRAPING)**
      console.log('🔍 Step 2: Searching Amazon for additional data...');
      const amazonQuery = `${productNameFromUrl} ${vendorName} site:amazon.in OR site:amazon.com`;
      
      try {
        const amazonResults = await searchGoogle(amazonQuery, 3);
        console.log(`✅ Found ${amazonResults.length} Amazon search results`);
        
        // Extract from Amazon search snippets (NO SCRAPING)
        if (amazonResults.length > 0) {
          console.log('📋 Extracting data from Amazon search snippets...');
          
          amazonResults.forEach(result => {
            const snippet = result.snippet || '';
            const title = result.title || '';
            const combined = `${title} ${snippet}`;
            
            // Extract specifications from Amazon snippets
            const patterns = {
              'Capacity': /(\d+)\s*(ml|ML|litre|liter|L|oz)/i,
              'Material': /(stainless steel|plastic|glass|copper|steel|silicone|ceramic)/i,
              'Price': /₹\s*([\d,]+)|Rs\.?\s*([\d,]+)|INR\s*([\d,]+)/i,
              'Weight': /(\d+)\s*(g|kg|grams|gm)/i,
            };
            
            Object.entries(patterns).forEach(([key, pattern]) => {
              const match = combined.match(pattern);
              if (match && !scrapedData.specifications[key]) {
                scrapedData.specifications[key] = match[0];
              }
            });
          });
          
          // Store Amazon search results
          scrapedData.amazonSearchResults = amazonResults.map(r => ({
            title: r.title,
            snippet: r.snippet,
            source: r.displayLink,
            url: r.link
          }));
          
          console.log(`✅ Extracted data from ${amazonResults.length} Amazon snippets (no scraping)`);
        }
      } catch (error) {
        console.warn('⚠️ Amazon search failed (not critical):', error.message);
      }
      
      console.log(`✅ Product data aggregation complete! Found ${Object.keys(scrapedData.specifications).length} specifications`);
    }
    
    // Step 2: Search for vendor information
    console.log('🌐 Searching vendor information...');
    let vendorResults = [];
    
    try {
      vendorResults = await searchVendor(vendorName, scrapedData.title);
      console.log(`✅ Found ${vendorResults.length} vendor search results`);
    } catch (error) {
      console.warn('⚠️ Vendor search failed (skipping):', error.message);
      console.log('💡 Continuing analysis without web search results...');
      // Continue without vendor search results (not critical)
    }
    
    // Step 3: Parse uploaded files (PDFs, Excel, but NOT images)
    console.log('📂 Processing uploaded files...');
    const parsedFiles = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Skip image files (already processed in screenshot mode)
        if (file.mimetype.startsWith('image/')) {
          console.log(`⏭️ Skipping image file: ${file.originalname} (already processed)`);
          continue;
        }
        
        try {
          let parsedData;
          if (file.mimetype === 'application/pdf') {
            parsedData = await parsePDF(file.buffer);
          } else {
            parsedData = await parseExcel(file.buffer);
          }
          
          parsedFiles.push({
            filename: file.originalname,
            type: file.mimetype,
            size: file.size,
            data: parsedData
          });
          
          console.log(`✅ Parsed: ${file.originalname}`);
        } catch (error) {
          console.error(`❌ Error parsing ${file.originalname}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Processed ${parsedFiles.length} vendor files`);
    
    // **NEW: Detect product category and validate attributes**
    console.log('🏷️ Detecting product category...');
    const detectedCategory = detectCategory(
      scrapedData.title,
      scrapedData.description,
      scrapedData.url || ''
    );
    
    let categoryValidation = null;
    if (detectedCategory) {
      console.log(`✅ Category detected: ${detectedCategory.name}`);
      
      // Validate extracted attributes against category requirements
      categoryValidation = validateCategoryAttributes(
        scrapedData.specifications,
        detectedCategory
      );
      
      console.log(`📊 Category completeness: ${categoryValidation.completeness}% (${categoryValidation.extracted}/${categoryValidation.totalRequired} attributes)`);
      
      if (categoryValidation.missingAttributes.length > 0) {
        console.log(`⚠️ Missing required attributes:`, categoryValidation.missingAttributes);
      }
    } else {
      console.log('⚠️ No specific category detected');
    }
    
    // Step 4: AI-powered conflict detection
    console.log('🤖 Running AI conflict detection...');
    const conflicts = await detectConflicts({
      productData: scrapedData,
      vendorFiles: parsedFiles,
      webSearchResults: vendorResults
    });
    
    console.log('✅ QC Analysis complete!');
    
    res.json({
      success: true,
      analysis: {
        productPage: scrapedData,
        vendorSearchResults: vendorResults,
        uploadedFiles: parsedFiles,
        conflicts: conflicts,
        completenessScore: calculateCompletenessScore(scrapedData, parsedFiles),
        category: detectedCategory ? {
          key: detectedCategory.key,
          name: detectedCategory.name,
          requiredAttributes: detectedCategory.requiredAttributes,
          validation: categoryValidation
        } : null,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ QC Analysis error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // **ENHANCED: Return fallback data even on critical errors**
    console.log('🔄 Creating fallback response for critical error...');
    
    try {
      const fallbackData = {
        url: req.body.productUrl || 'Unknown',
        title: 'Product from ' + (req.body.vendorName || 'Unknown Vendor'),
        description: 'Unable to complete analysis due to technical error. ' + error.message,
        price: 'Not available',
        specifications: {
          'Error': error.message,
          'Note': 'Analysis incomplete. Please try again or contact support.'
        },
        images: [],
        metaTags: {},
        rawText: '',
        scrapedAt: new Date().toISOString(),
        errorFallback: true
      };
      
      res.json({
        success: true,
        warning: 'Analysis completed with errors',
        analysis: {
          productPage: fallbackData,
          vendorSearchResults: [],
          uploadedFiles: [],
          conflicts: [],
          completenessScore: { score: 20, percentage: 20, rating: 'Poor' },
          timestamp: new Date().toISOString()
        }
      });
    } catch (fallbackError) {
      // Last resort - return actual error
      res.status(500).json({ error: error.message });
    }
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function calculateCompletenessScore(productData, files) {
  let score = 0;
  const checks = {
    hasTitle: productData.title ? 20 : 0,
    hasPrice: productData.price ? 15 : 0,
    hasDescription: productData.description ? 15 : 0,
    hasSpecifications: Object.keys(productData.specifications).length > 0 ? 20 : 0,
    hasImages: productData.images.length > 0 ? 10 : 0,
    hasVendorFiles: files.length > 0 ? 20 : 0
  };
  
  score = Object.values(checks).reduce((a, b) => a + b, 0);
  
  return {
    score,
    percentage: score,
    breakdown: checks,
    rating: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor'
  };
}

// ==========================================
// ERROR HANDLING
// ==========================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 QC Engine Backend API v3.0 - Screenshot Mode');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('✅ Features enabled:');
  console.log('   • Web Scraping (Cheerio + Anti-Bot)');
  console.log('   • Google Custom Search');
  console.log('   • PDF Parsing');
  console.log('   • Excel/CSV Processing');
  console.log('   • AI Conflict Detection (Claude)');
  console.log('   • 📸 Screenshot OCR (Claude Vision API)');
  console.log('='.repeat(50));
});
