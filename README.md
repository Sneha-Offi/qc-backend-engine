# QC Engine Backend API v2.0 - Enhanced

## 🚀 Features

- ✅ **Web Scraping** with Cheerio
- ✅ **Google Custom Search API** integration
- ✅ **PDF Parsing** with table and specification extraction
- ✅ **Excel/CSV Processing** with intelligent data extraction
- ✅ **AI-Powered Conflict Detection** using Claude AI
- ✅ **File Upload** support (PDF, Excel, CSV)
- ✅ **Comprehensive QC Analysis** endpoint

## 📋 Prerequisites

- Node.js 20 or higher
- Google Custom Search API credentials
- Anthropic API key (for AI features)

## 🔧 Environment Variables

```env
PORT=3000
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_google_cx_id
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Google Search
```
POST /api/search
Body: { "query": "search term", "numResults": 5 }
```

### Vendor Search
```
POST /api/search-vendor
Body: { "vendorName": "vendor", "productName": "product" }
```

### Web Scraping
```
POST /api/scrape
Body: { "url": "https://example.com" }
```

### PDF Parsing
```
POST /api/parse-pdf
Body: FormData with 'file' field (PDF)
```

### Excel Parsing
```
POST /api/parse-excel
Body: FormData with 'file' field (Excel/CSV)
```

### AI Conflict Detection
```
POST /api/analyze-conflicts
Body: {
  "productData": {...},
  "vendorFiles": [...],
  "webSearchResults": [...]
}
```

### Comprehensive QC Analysis
```
POST /api/qc-analysis
Body: FormData with:
  - productUrl: string
  - vendorName: string
  - files: multiple files (PDF/Excel/CSV)
```

## 🚀 Deployment on Railway

1. Push files to GitHub
2. Connect Railway to your GitHub repo
3. Add environment variables in Railway dashboard
4. Railway will auto-deploy

## 📦 Dependencies

- express - Web framework
- cors - CORS middleware
- cheerio - Web scraping
- axios - HTTP client
- multer - File upload handling
- pdf-parse - PDF parsing
- xlsx - Excel/CSV parsing
- @anthropic-ai/sdk - Claude AI integration
