import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { searchGoogle, searchVendor } from './scraper.js';
import { scrapeWebsite } from './scraper.js';
import { parsePDF } from './pdfParser.js';
import { parseExcel } from './excelParser.js';
import { analyzeWithAI, detectConflicts } from './aiAnalyzer.js';
import { extractAttributesFromImage, normalizeExtractedData } from './imageAnalyzer.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      // LINK MODE: Scrape product page
      console.log('📄 Scraping product page...');
      scrapedData = await scrapeWebsite(productUrl);
      console.log('✅ Scraping complete:', scrapedData.title);
    }
    
    // Step 2: Search for vendor information
    console.log('🌐 Searching vendor information...');
    const vendorResults = await searchVendor(vendorName, scrapedData.title);
    console.log(`✅ Found ${vendorResults.length} vendor search results`);
    
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