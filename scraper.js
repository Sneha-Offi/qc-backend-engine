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
