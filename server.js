import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchGoogle, searchVendor } from './scraper.js';
import { scrapeWebsite } from './scraper.js';
import { parsePDF } from './pdfParser.js';
import { parseExcel } from './excelParser.js';
import { analyzeWithAI, detectConflicts } from './aiAnalyzer.js';
import { 
  detectProductCategory, 
  extractCategoryAttributes, 
  calculateCategoryCompleteness,
  getCategoryDisplayName 
} from './categoryDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
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
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'));
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
    service: 'QC Engine Backend API v2.0 - Enhanced',
    features: ['web-scraping', 'google-search', 'pdf-parsing', 'excel-parsing', 'ai-analysis']
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
    const { productUrl, vendorName, productName } = req.body;
    
    if (!productUrl || !vendorName || !productName) {
      return res.status(400).json({ 
        error: 'Product URL, vendor name, and product name are required' 
      });
    }

    console.log('🔍 Starting comprehensive QC analysis...');
    
    // Step 1: Scrape product page
    console.log('📄 Scraping product page...');
    const scrapedData = await scrapeWebsite(productUrl);
    
    // Step 2: Search for vendor information
    console.log('🔍 Scraping vendor website for additional data...');
    const vendorResults = await searchVendor(vendorName, productName);
    
    // Step 3: Parse uploaded files (PDFs, Excel)
    console.log('📂 Processing uploaded files...');
    const parsedFiles = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
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
        } catch (error) {
          console.error(`Error parsing ${file.originalname}:`, error.message);
        }
      }
    }
    
    // Step 4: Detect product category FIRST (before AI analysis)
    console.log('🏷️  Detecting product category...');
    const detectedCategory = detectProductCategory(scrapedData);
    const categoryData = extractCategoryAttributes(scrapedData, detectedCategory);
    const categoryCompleteness = calculateCategoryCompleteness(scrapedData, parsedFiles, detectedCategory);
    
    console.log(`📦 Detected Category: ${getCategoryDisplayName(detectedCategory)}`);
    
    // Step 5: AI conflict detection (now category-aware)
    console.log('🤖 Running AI conflict detection...');
    const conflicts = await detectConflicts({
      productData: scrapedData,
      vendorFiles: parsedFiles,
      webSearchResults: vendorResults,
      category: detectedCategory,
      categoryAttributes: categoryData
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
        category: {
          detected: detectedCategory,
          displayName: getCategoryDisplayName(detectedCategory),
          attributes: categoryData.categoryAttributes,
          requiredAttributes: categoryData.requiredAttributes,
          completeness: categoryCompleteness
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('QC Analysis error:', error);
    res.status(500).json({ error: error.message });
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
  console.log('🚀 QC Engine Backend API v2.0 - Enhanced');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('✅ Features enabled:');
  console.log('   • Web Scraping (Cheerio)');
  console.log('   • Google Custom Search');
  console.log('   • PDF Parsing');
  console.log('   • Excel/CSV Processing');
  console.log('   • AI Conflict Detection (Claude)');
  console.log('='.repeat(50));
});
