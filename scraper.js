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
