import XLSX from 'xlsx';

// ==========================================
// EXCEL/CSV PARSING
// ==========================================
export async function parseExcel(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    console.log('📊 Excel file parsed successfully');
    console.log(`   Sheets: ${workbook.SheetNames.join(', ')}`);
    
    const parsed = {
      sheets: [],
      totalSheets: workbook.SheetNames.length,
      extractedData: {
        products: [],
        pricing: [],
        specifications: [],
        moq: [],
        branding: []
      }
    };
    
    // Parse each sheet
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      
      parsed.sheets.push({
        name: sheetName,
        rows: jsonData.length,
        columns: range.e.c + 1,
        data: jsonData
      });
      
      // Extract structured data from this sheet
      extractStructuredData(jsonData, parsed.extractedData);
    });
    
    return parsed;
    
  } catch (error) {
    console.error('Excel parsing error:', error.message);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

// ==========================================
// EXTRACT STRUCTURED DATA FROM EXCEL
// ==========================================
function extractStructuredData(rows, extractedData) {
  if (!rows || rows.length === 0) return;
  
  // Get column headers (first row keys)
  const headers = Object.keys(rows[0]).map(h => h.toLowerCase());
  
  rows.forEach(row => {
    const rowData = {};
    
    // Normalize keys to lowercase for easier matching
    Object.keys(row).forEach(key => {
      rowData[key.toLowerCase()] = row[key];
    });
    
    // Extract product information
    if (hasAnyKey(rowData, ['product', 'item', 'sku', 'code', 'name'])) {
      extractedData.products.push({
        name: findValue(rowData, ['product', 'item', 'name', 'product name']),
        sku: findValue(rowData, ['sku', 'code', 'item code', 'product code']),
        description: findValue(rowData, ['description', 'desc', 'details']),
        category: findValue(rowData, ['category', 'type', 'group'])
      });
    }
    
    // Extract pricing information
    if (hasAnyKey(rowData, ['price', 'cost', 'rate', 'amount'])) {
      extractedData.pricing.push({
        item: findValue(rowData, ['product', 'item', 'name']),
        price: findValue(rowData, ['price', 'unit price', 'cost', 'rate']),
        quantity: findValue(rowData, ['quantity', 'qty', 'units']),
        currency: findValue(rowData, ['currency', 'curr']) || 'INR',
        discount: findValue(rowData, ['discount', 'disc', 'discount %'])
      });
    }
    
    // Extract specifications
    if (hasAnyKey(rowData, ['material', 'dimensions', 'weight', 'size', 'color'])) {
      extractedData.specifications.push({
        item: findValue(rowData, ['product', 'item', 'name']),
        material: findValue(rowData, ['material', 'mat']),
        dimensions: findValue(rowData, ['dimensions', 'size', 'dim']),
        weight: findValue(rowData, ['weight', 'wt']),
        color: findValue(rowData, ['color', 'colour']),
        packaging: findValue(rowData, ['packaging', 'packing', 'pack'])
      });
    }
    
    // Extract MOQ
    if (hasAnyKey(rowData, ['moq', 'minimum', 'min order'])) {
      extractedData.moq.push({
        item: findValue(rowData, ['product', 'item', 'name']),
        moq: findValue(rowData, ['moq', 'minimum order quantity', 'min order', 'minimum']),
        unit: findValue(rowData, ['unit', 'uom']) || 'pieces',
        leadTime: findValue(rowData, ['lead time', 'delivery time', 'production time'])
      });
    }
    
    // Extract branding methods
    if (hasAnyKey(rowData, ['branding', 'printing', 'customization', 'logo'])) {
      extractedData.branding.push({
        item: findValue(rowData, ['product', 'item', 'name']),
        method: findValue(rowData, ['branding', 'branding method', 'printing', 'customization']),
        area: findValue(rowData, ['printable area', 'logo area', 'branding area']),
        colors: findValue(rowData, ['colors', 'colour options', 'available colors']),
        cost: findValue(rowData, ['branding cost', 'printing cost', 'logo cost'])
      });
    }
  });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function hasAnyKey(obj, keys) {
  return keys.some(key => obj.hasOwnProperty(key));
}

function findValue(obj, keys) {
  for (const key of keys) {
    if (obj.hasOwnProperty(key) && obj[key] !== '') {
      return obj[key];
    }
  }
  return null;
}

// ==========================================
// EXPORT CSV DATA AS WELL
// ==========================================
export function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}
