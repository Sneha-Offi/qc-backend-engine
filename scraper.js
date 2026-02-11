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
    // PRIORITY 1: Search vendor's official website (most trusted)
    console.log(`[SEARCH] Priority 1: Vendor official site (${vendorName})`);
    const vendorQuery = `"${productName}" site:${vendorName}.com OR site:${vendorName}.co.in OR site:${vendorName}.in specifications features`;
    const vendorResults = await searchGoogle(vendorQuery, 3);
    
    // PRIORITY 2: Search Amazon and major marketplaces (trusted sources)
    console.log(`[SEARCH] Priority 2: Amazon & marketplaces`);
    const marketplaceQuery = `"${productName}" ${vendorName} site:amazon.in OR site:amazon.com OR site:flipkart.com specifications`;
    const marketplaceResults = await searchGoogle(marketplaceQuery, 3);
    
    // Combine results (vendor first, then marketplaces)
    const allResults = [...vendorResults, ...marketplaceResults];
    
    // Filter results to ONLY include pages that mention the product name
    // This prevents cross-contamination from other products
    const filteredResults = allResults.filter(result => {
      const titleLower = (result.title || '').toLowerCase();
      const snippetLower = (result.snippet || '').toLowerCase();
      const urlLower = (result.link || '').toLowerCase();
      const productNameLower = productName.toLowerCase();
      
      // EXCLUDE offineeds.com (user's own site with corrupted data)
      if (urlLower.includes('offineeds.com')) {
        console.log(`[SEARCH FILTER] Excluded: ${result.title} (OffiNeeds site - may have corrupted data)`);
        return false;
      }
      
      // Extract first 2-3 words of product name as key identifiers
      const productKeywords = productNameLower.split(' ').slice(0, 3);
      
      // Check if at least 2 keywords from product name appear in title or snippet
      const matchCount = productKeywords.filter(keyword => 
        titleLower.includes(keyword) || snippetLower.includes(keyword)
      ).length;
      
      return matchCount >= 2; // At least 2 keywords must match
    });
    
    // Sort by source priority (vendor official > Amazon > other marketplaces)
    const sortedResults = filteredResults.sort((a, b) => {
      const aUrl = a.link.toLowerCase();
      const bUrl = b.link.toLowerCase();
      const vendorDomains = [`${vendorName.toLowerCase()}.com`, `${vendorName.toLowerCase()}.co.in`, `${vendorName.toLowerCase()}.in`];
      
      // Vendor official site gets highest priority
      const aIsVendor = vendorDomains.some(domain => aUrl.includes(domain));
      const bIsVendor = vendorDomains.some(domain => bUrl.includes(domain));
      if (aIsVendor && !bIsVendor) return -1;
      if (!aIsVendor && bIsVendor) return 1;
      
      // Amazon gets second priority
      const aIsAmazon = aUrl.includes('amazon');
      const bIsAmazon = bUrl.includes('amazon');
      if (aIsAmazon && !bIsAmazon) return -1;
      if (!aIsAmazon && bIsAmazon) return 1;
      
      return 0;
    });
    
    console.log(`[SEARCH FILTER] Found ${allResults.length} total results, kept ${sortedResults.length} relevant ones from trusted sources`);
    sortedResults.forEach((result, idx) => {
      const domain = new URL(result.link).hostname;
      console.log(`  ${idx + 1}. ${domain} - ${result.title}`);
    });
    
    return sortedResults;
  } catch (error) {
    console.error('Vendor Search Error:', error.message);
    throw new Error('Failed to search vendor website');
  }
}

// ==========================================
// ENHANCED WEB SCRAPING WITH ANTI-BOT BYPASS
// ==========================================
export async function scrapeWebsite(url, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    console.log(`[SCRAPER] Attempting to scrape: ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    // Rotate through multiple realistic browser user agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    
    const userAgent = userAgents[retryCount % userAgents.length];
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Only accept 2xx status codes
      }
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
    
    // Remove navigation, footer, etc. before extracting specs
    const $productArea = $('body').clone();
    $productArea.find('nav, header, footer, .navigation, .menu, .sidebar, .related-products, .you-may-also-like, .recommendations').remove();
    
    // Try table-based specs (only in product area)
    $productArea.find('table').each((i, table) => {
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
    
    // Extract product-specific text (avoid navigation, footer, related products)
    // Remove unwanted sections first
    $('nav, header, footer, .navigation, .menu, .sidebar, .related-products, .you-may-also-like, .recommendations, script, style').remove();
    
    // Focus on main product content areas
    let productContent = '';
    const productSelectors = [
      '.product-view', '.product-info', '.product-details', '.product-description',
      '.product-content', 'main', '.main-content', '#product', '.item-view',
      '[itemtype*="Product"]' // Schema.org Product markup
    ];
    
    // Try to find main product container
    for (const selector of productSelectors) {
      const content = $(selector).text();
      if (content && content.length > 100) {
        productContent = content;
        break;
      }
    }
    
    // Fallback: Use body text but cleaned
    if (!productContent) {
      productContent = $('body').text();
    }
    
    // Clean and limit the text
    const rawText = productContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit to first 5000 chars
    
    console.log(`[SCRAPER] ✅ Successfully scraped: ${url}`);
    
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
    console.error(`[SCRAPER] ❌ Error scraping ${url}:`, error.message);
    
    // Handle 403 Forbidden - website is blocking the scraper
    if (error.response && error.response.status === 403) {
      console.warn(`[SCRAPER] ⚠️ 403 Forbidden: Website is blocking scraper`);
      
      // Retry with different user agent if retries available
      if (retryCount < MAX_RETRIES) {
        console.log(`[SCRAPER] 🔄 Retrying with different user agent...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return scrapeWebsite(url, retryCount + 1);
      }
      
      // If all retries failed, return limited data from URL metadata
      console.warn(`[SCRAPER] ⚠️ All retries failed. Returning basic metadata only.`);
      return createFallbackData(url, 'Website is blocking automated access (403 Forbidden). Using limited data from other sources.');
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      if (retryCount < MAX_RETRIES) {
        console.log(`[SCRAPER] 🔄 Timeout - retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return scrapeWebsite(url, retryCount + 1);
      }
      return createFallbackData(url, 'Request timeout - website took too long to respond.');
    }
    
    // Handle other network errors
    if (retryCount < MAX_RETRIES && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
      console.log(`[SCRAPER] 🔄 Network error - retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return scrapeWebsite(url, retryCount + 1);
    }
    
    // For all other errors, return fallback data
    console.error(`[SCRAPER] ❌ Failed to scrape after ${retryCount + 1} attempts`);
    return createFallbackData(url, `Failed to access website: ${error.message}`);
  }
}

// Helper function to create fallback data when scraping fails
function createFallbackData(url, errorMessage) {
  // Extract basic info from URL
  let productName = 'Unknown Product';
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const cleanPath = pathname.replace(/^\/|\/$/g, '').replace(/\.html?$/i, '');
    productName = cleanPath
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  return {
    url,
    title: productName,
    price: 'Not available (scraping blocked)',
    description: `Unable to extract full product details. ${errorMessage}`,
    specifications: {},
    images: [],
    metaTags: {},
    rawText: `Product information could not be extracted from ${url}. The website may be blocking automated access. Please check vendor-provided files or search results for complete information.`,
    scrapedAt: new Date().toISOString(),
    scrapingError: errorMessage,
    isLimitedData: true
  };
}

