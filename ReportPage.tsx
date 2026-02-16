import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Home,
  Package,
  FileText,
  Settings,
  BarChart3,
  GitCompare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { ExportDialog } from "../components/ExportDialog";
import { generateTshirtMockData } from "../utils/tshirtMockData";
import { generateNotebookMockData } from "../utils/notebookMockData";

// Mock data generation
function generateMockReport(productName: string, brandName: string) {
  // Determine product type from name
  const lowerName = productName.toLowerCase();
  const isTshirt = lowerName.includes('t-shirt') || lowerName.includes('tshirt') || lowerName.includes('shirt') || lowerName.includes('tee') || lowerName.includes('apparel');
  const isDuffleBag = lowerName.includes('duffle') || lowerName.includes('bag');
  const isGiftKit = lowerName.includes('kit') || lowerName.includes('gift') || lowerName.includes('combo');
  const isNotebook = lowerName.includes('notebook') || lowerName.includes('diary') || lowerName.includes('journal') || lowerName.includes('planner');
  
  if (isTshirt) {
    return generateTshirtMockData(productName, brandName);
  }
  
  if (isGiftKit) {
    return {
      productSummary: {
        productName: productName,
        brand: brandName,
        category: "Gift Sets & Kits",
        confidenceLevel: "Medium",
      },
      extractedAttributes: [
        // Basic Product Info
        { attribute: "Product Name", value: productName, source: "Product URL", confidence: "High" },
        { attribute: "Brand", value: brandName, source: "Website", confidence: "High" },
        { attribute: "Model/SKU", value: "MCAF-SHWR-TMPT-KIT", source: "Website", confidence: "High" },
        { attribute: "Category", value: "Personal Care / Gift Sets", source: "Product URL, Website", confidence: "High" },
        { attribute: "Type", value: "Gift Kit / Combo Pack", source: "Website", confidence: "High" },
        
        // Kit Contents & Composition
        { attribute: "Number of Items in Kit", value: "4 items", source: "Website", confidence: "High" },
        { attribute: "Kit Contents", value: "Coffee Body Wash, Coffee Body Scrub, Coffee Body Lotion, Shower Cap", source: "Website, Product Images", confidence: "High" },
        { attribute: "Individual Product Sizes", value: "Body Wash: 200ml, Scrub: 100g, Lotion: 200ml", source: "Web Search - Product Details", confidence: "Medium" },
        { attribute: "Variant SKUs", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Can Items Be Sold Separately", value: "Not Listed", source: "-", confidence: "Low" },
        
        // Packaging & Presentation
        { attribute: "Gift Box Type", value: "Printed cardboard gift box", source: "Website, Product Images", confidence: "High" },
        { attribute: "Gift Box Material", value: "Coated cardboard", source: "Web Search", confidence: "Medium" },
        { attribute: "Box Dimensions", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Is Gift Wrapped", value: "Ready-to-gift packaging", source: "Website", confidence: "High" },
        { attribute: "Includes Gift Message Card", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Outer Packaging Color", value: "Coffee Brown with Graphics", source: "Product Images", confidence: "High" },
        
        // Product Specifications
        { attribute: "Total Kit Weight", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Kit Dimensions (L x W x H)", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Shelf Life / Expiry", value: "24 months from manufacturing", source: "Web Search - Brand Info", confidence: "Medium" },
        { attribute: "Manufacturing Date Code Location", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Key Ingredients", value: "Coffee, Shea Butter, Vitamin E", source: "Web Search - Product Info", confidence: "Medium" },
        { attribute: "Suitable For", value: "All skin types", source: "Website", confidence: "High" },
        { attribute: "Dermatologically Tested", value: "Yes", source: "Web Search - Brand Claims", confidence: "Medium" },
        { attribute: "Cruelty Free", value: "Yes", source: "Web Search - Brand Info", confidence: "High" },
        { attribute: "Paraben Free", value: "Yes", source: "Web Search - Brand Info", confidence: "High" },
        
        // Branding & Customization
        { attribute: "Custom Branding Available", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Custom Label/Sticker Option", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Custom Gift Message Insert", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Bulk Corporate Gifting Option", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Printable Area on Box", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "MOQ for Custom Packaging", value: "Not Listed", source: "-", confidence: "Low" },
        
        // B2B Commercial Info
        { attribute: "MOQ (Minimum Order Quantity)", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Lead Time - Stock Items", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Lead Time - Customized", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Bulk Pricing Tiers", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Unit Price (Retail/MRP)", value: "₹599", source: "Website", confidence: "High" },
        { attribute: "Unit Price (Wholesale/B2B)", value: "Not Listed", source: "-", confidence: "Low" },
        
        // Packaging & Logistics
        { attribute: "Individual Kit Packaging", value: "Gift box with outer shrink wrap", source: "Web Search", confidence: "Medium" },
        { attribute: "Master Carton Quantity", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Master Carton Dimensions", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Master Carton Weight (Gross)", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Is Shipping Box Retail-Ready", value: "Not Listed", source: "-", confidence: "Low" },
        
        // Compliance & Certifications
        { attribute: "Country of Origin", value: "India", source: "Web Search - Brand Info", confidence: "High" },
        { attribute: "HSN Code", value: "33049990", source: "Web Search", confidence: "Medium" },
        { attribute: "FSSAI/Cosmetic License", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Ingredient List (INCI Names)", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Allergen Information", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Safety Data Sheet (SDS)", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Warranty/Returns Policy", value: "7 days return if unopened", source: "Website", confidence: "Medium" },
      ],
      sourceComparison: [
        // Product Info
        { attribute: "Product Name", webValue: productName, pdfValue: `mCaffeine Coffee Shower Temptation Kit`, status: "match" },
        { attribute: "Brand", webValue: brandName, pdfValue: brandName, status: "match" },
        { attribute: "Model/SKU", webValue: "MCAF-SHWR-TMPT-KIT", pdfValue: "SKU: MCAF-SHWR-TMPT-KIT", status: "match" },
        { attribute: "Category", webValue: "Personal Care / Gift Sets", pdfValue: "Personal Care - Bath & Body", status: "similar" },
        
        // Kit Contents
        { attribute: "Number of Items in Kit", webValue: "4 items", pdfValue: "4 products", status: "match" },
        { attribute: "Kit Contents", webValue: "Coffee Body Wash, Coffee Body Scrub, Coffee Body Lotion, Shower Cap", pdfValue: "Coffee Body Wash (200ml), Coffee Body Scrub (100g), Coffee Body Lotion (200ml), Shower Cap (1 pc)", status: "match" },
        { attribute: "Individual Product Sizes", webValue: "Body Wash: 200ml, Scrub: 100g, Lotion: 200ml", pdfValue: "Body Wash: 200ml, Body Scrub: 100g, Body Lotion: 200ml", status: "match" },
        { attribute: "Variant SKUs", webValue: "Not Listed", pdfValue: "MCAF-BW-200, MCAF-BS-100, MCAF-BL-200, MCAF-SC-01", status: "only-pdf" },
        
        // Packaging
        { attribute: "Gift Box Type", webValue: "Printed cardboard gift box", pdfValue: "Premium printed gift box - 300 GSM cardboard", status: "pdf-more-detail" },
        { attribute: "Gift Box Material", webValue: "Coated cardboard", pdfValue: "300 GSM coated cardboard with matt lamination", status: "pdf-more-detail" },
        { attribute: "Box Dimensions", webValue: "Not Listed", pdfValue: "24 x 18 x 6 cm (L x W x H)", status: "only-pdf" },
        { attribute: "Total Kit Weight", webValue: "Not Listed", pdfValue: "620 grams (with packaging)", status: "only-pdf" },
        
        // Product Specifications
        { attribute: "Shelf Life / Expiry", webValue: "24 months from manufacturing", pdfValue: "24 months from MFG date", status: "match" },
        { attribute: "Manufacturing Date Code Location", webValue: "Not Listed", pdfValue: "Printed on bottom of box and each product", status: "only-pdf" },
        { attribute: "Key Ingredients", webValue: "Coffee, Shea Butter, Vitamin E", pdfValue: "Arabica Coffee Extract, Shea Butter, Vitamin E, Cocoa Butter", status: "pdf-more-detail" },
        { attribute: "Suitable For", webValue: "All skin types", pdfValue: "All skin types", status: "match" },
        { attribute: "Dermatologically Tested", webValue: "Yes", pdfValue: "Yes - Dermatologically Tested (Certificate available)", status: "match" },
        { attribute: "Cruelty Free", webValue: "Yes", pdfValue: "Cruelty Free & Vegan", status: "match" },
        { attribute: "Paraben Free", webValue: "Yes", pdfValue: "Paraben Free, SLS Free, Mineral Oil Free", status: "pdf-more-detail" },
        
        // Branding & Customization
        { attribute: "Custom Branding Available", webValue: "Not Listed", pdfValue: "Yes - Custom label stickers available", status: "only-pdf" },
        { attribute: "Custom Label/Sticker Option", webValue: "Not Listed", pdfValue: "8 x 5 cm label sticker area on box", status: "only-pdf" },
        { attribute: "Printable Area on Box", webValue: "Not Listed", pdfValue: "Not available - pre-printed packaging", status: "only-pdf" },
        { attribute: "MOQ for Custom Packaging", webValue: "Not Listed", pdfValue: "500 units for custom label stickers", status: "only-pdf" },
        
        // B2B Commercial Info
        { attribute: "MOQ (Minimum Order Quantity)", webValue: "Not Listed", pdfValue: "50 units", status: "only-pdf" },
        { attribute: "Unit Price (Retail/MRP)", webValue: "₹599", pdfValue: "MRP: ₹599", status: "match" },
        { attribute: "Unit Price (Wholesale/B2B)", webValue: "Not Listed", pdfValue: "B2B: ₹395 (for 50+ units)", status: "only-pdf" },
        { attribute: "Lead Time - Stock Items", webValue: "Not Listed", pdfValue: "3-5 business days", status: "only-pdf" },
        { attribute: "Lead Time - Customized", webValue: "Not Listed", pdfValue: "7-10 business days (custom labels)", status: "only-pdf" },
        { attribute: "Bulk Pricing Tiers", webValue: "Not Listed", pdfValue: "50-99: ₹395, 100-499: ₹375, 500+: ₹350", status: "only-pdf" },
        
        // Packaging & Logistics
        { attribute: "Individual Kit Packaging", webValue: "Gift box with outer shrink wrap", pdfValue: "Gift box with shrink wrap", status: "match" },
        { attribute: "Master Carton Quantity", webValue: "Not Listed", pdfValue: "20 units per master carton", status: "only-pdf" },
        { attribute: "Master Carton Dimensions", webValue: "Not Listed", pdfValue: "52 x 40 x 28 cm", status: "only-pdf" },
        { attribute: "Master Carton Weight (Gross)", webValue: "Not Listed", pdfValue: "13.5 kg", status: "only-pdf" },
        
        // Compliance & Certifications
        { attribute: "Country of Origin", webValue: "India", pdfValue: "India", status: "match" },
        { attribute: "HSN Code", webValue: "33049990", pdfValue: "33049990", status: "match" },
        { attribute: "FSSAI/Cosmetic License", webValue: "Not Listed", pdfValue: "Cosmetic License: 10017021000933", status: "only-pdf" },
        { attribute: "Ingredient List (INCI Names)", webValue: "Not Listed", pdfValue: "Available in technical spec sheet", status: "only-pdf" },
        { attribute: "Safety Data Sheet (SDS)", webValue: "Not Listed", pdfValue: "Available on request", status: "only-pdf" },
        { attribute: "Warranty/Returns Policy", webValue: "7 days return if unopened", pdfValue: "7 days return for unopened products", status: "match" },
      ],
      issues: {
        critical: [
          {
            type: "Missing Kit Composition Details",
            title: "Individual Product Variants/SKUs Not Listed",
            attribute: "Kit Contents",
            description: "While kit contents are described, individual product SKUs and whether items can be sold separately are not specified. Critical for inventory management and partial replacements.",
            sources: ["Website"],
            severity: "Blocker",
            recommendation: "Contact vendor and ask: 'Please provide: 1) Individual SKU codes for each item in the kit, 2) Can individual items be purchased separately? 3) Are there product-specific fact sheets for each item?'"
          },
          {
            type: "Missing Expiry/Shelf Life Compliance",
            title: "Manufacturing Date and Batch Code Location Not Specified",
            attribute: "Shelf Life",
            description: "Cosmetic products require manufacturing date and batch code for traceability. Location of this information on packaging not documented.",
            sources: ["Website", "Web Search"],
            severity: "Blocker",
            recommendation: "Ask vendor: 'Where is the manufacturing date/batch code printed? Please provide a sample label image showing this information. What is the exact shelf life from manufacturing date?'"
          }
        ],
        buildAmbiguities: [
          {
            type: "Vague Packaging Specification",
            title: "Gift Box Material Quality Not Detailed",
            attribute: "Packaging",
            description: "Description says 'coated cardboard' but GSM (thickness), durability rating, and print quality specifications not provided.",
            sources: ["Web Search"],
            severity: "Warning",
            recommendation: "Ask vendor: 'What is the GSM of the gift box cardboard? Is it laminated or spot-UV coated? Can it withstand shipping without outer protection?'"
          },
          {
            type: "Incomplete Product Specifications",
            title: "Weight and Dimensions Missing",
            attribute: "Dimensions & Weight",
            description: "Total kit weight and exact box dimensions not listed. Critical for shipping cost calculation and storage planning.",
            sources: ["Website"],
            severity: "Warning",
            recommendation: "Ask vendor: 'Please provide exact measurements: 1) Gift box dimensions (L x W x H in cm), 2) Total weight with packaging (in grams), 3) Volumetric weight for shipping calculation'"
          }
        ],
        missingInfo: [
          {
            attribute: "Individual Product SKUs",
            field: "Individual Product SKUs",
            severity: "Blocker"
          },
          {
            attribute: "Manufacturing Date/Batch Code Location",
            field: "Manufacturing Date/Batch Code Location",
            severity: "Blocker"
          },
          {
            attribute: "MOQ (Minimum Order Quantity)",
            field: "MOQ (Minimum Order Quantity)",
            severity: "Blocker"
          },
          {
            attribute: "Wholesale/B2B Unit Price",
            field: "Wholesale/B2B Unit Price",
            severity: "Blocker"
          },
          {
            attribute: "Lead Time - Stock Items",
            field: "Lead Time - Stock Items",
            severity: "Blocker"
          },
          {
            attribute: "Box Dimensions (L x W x H)",
            field: "Box Dimensions (L x W x H)",
            severity: "Warning"
          },
          {
            attribute: "Total Kit Weight",
            field: "Total Kit Weight",
            severity: "Warning"
          },
          {
            attribute: "Master Carton Quantity & Dimensions",
            field: "Master Carton Quantity & Dimensions",
            severity: "Warning"
          },
          {
            attribute: "Custom Branding Options",
            field: "Custom Branding Options",
            severity: "Warning"
          },
          {
            attribute: "MOQ for Custom Packaging",
            field: "MOQ for Custom Packaging",
            severity: "Warning"
          },
          {
            attribute: "Bulk Pricing Tiers",
            field: "Bulk Pricing Tiers",
            severity: "Warning"
          },
          {
            attribute: "FSSAI/Cosmetic License Number",
            field: "FSSAI/Cosmetic License Number",
            severity: "Warning"
          },
          {
            attribute: "Full Ingredient List (INCI Names)",
            field: "Full Ingredient List (INCI Names)",
            severity: "Info"
          },
          {
            attribute: "Allergen Information",
            field: "Allergen Information",
            severity: "Info"
          },
          {
            attribute: "Can Items Be Sold Separately",
            field: "Can Items Be Sold Separately",
            severity: "Info"
          }
        ]
      },
      completeness: {
        coreProduct: 70,
        buildManufacturing: 50,
        customization: 20,
        b2bCommercial: 25
      },
      qcStatus: "Blocked – Critical Information Missing",
      downstreamFlags: {
        customizationEnabled: false,
        salesSafeToPitch: false,
        opsReady: false,
        requiresManualReview: true
      }
    };
  }
  
  if (isDuffleBag) {
    return {
      productSummary: {
        productName: productName,
        brand: brandName,
        category: "Bags & Luggage",
        confidenceLevel: "Medium",
      },
      extractedAttributes: [
        // Basic Product Info
        { attribute: "Product Name", value: productName, source: "Product URL", confidence: "High" },
        { attribute: "Model/SKU", value: "WKD-DFL-BLK-35L", source: "Website", confidence: "High" },
        { attribute: "Category", value: "Travel Bags / Duffle Bags", source: "Product URL, Website", confidence: "High" },
        { attribute: "Type", value: "Duffle Bag", source: "Website", confidence: "High" },
        
        // Materials & Construction
        { attribute: "Material", value: "Faux Leather Fabric", source: "Website", confidence: "High" },
        { attribute: "Material Type Detail", value: "PU Faux Leather", source: "Web Search - Vendor Site", confidence: "Medium" },
        { attribute: "Lining Material", value: "Polyester", source: "Web Search - Product Specs", confidence: "Medium" },
        { attribute: "Closure Type", value: "Zip", source: "Website", confidence: "High" },
        { attribute: "Zipper Brand/Type", value: "Heavy-duty metal zipper", source: "Web Search", confidence: "Medium" },
        
        // Design & Features
        { attribute: "Color", value: "Black", source: "Website, Product URL", confidence: "High" },
        { attribute: "Color Variants Available", value: "Black, Brown, Navy", source: "Web Search - Vendor Catalog", confidence: "Medium" },
        { attribute: "Capacity", value: "35 Liters", source: "Product URL, Website", confidence: "High" },
        { attribute: "Handle", value: "Yes", source: "Website", confidence: "High" },
        { attribute: "Handle Type", value: "Dual padded carry handles", source: "Web Search", confidence: "Medium" },
        { attribute: "Strap", value: "Adjustable Shoulder Strap", source: "Website", confidence: "High" },
        { attribute: "Strap Material", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Strap Length Range", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Pockets", value: "Yes", source: "Website", confidence: "High" },
        { attribute: "Number of Pockets", value: "3 exterior, 2 interior", source: "Web Search - Product Images", confidence: "Medium" },
        { attribute: "Special Features", value: "External Shoe Compartment", source: "Website", confidence: "High" },
        { attribute: "Shoe Compartment Size", value: "Up to UK size 12", source: "Web Search", confidence: "Medium" },
        { attribute: "Water Resistant", value: "Yes", source: "Website", confidence: "High" },
        { attribute: "Water Resistance Rating", value: "Not Listed", source: "-", confidence: "Low" },
        
        // Dimensions & Weight
        { attribute: "Dimensions (L x W x H)", value: "52 x 28 x 28 cm", source: "Web Search - Vendor Site", confidence: "Medium" },
        { attribute: "Weight", value: "850g", source: "Web Search - Vendor Catalog", confidence: "Medium" },
        { attribute: "Folded/Collapsed Dimensions", value: "Not Listed", source: "-", confidence: "Low" },
        
        // Branding & Customization
        { attribute: "Customization Type", value: "DTF Printing", source: "Website", confidence: "High" },
        { attribute: "Other Branding Methods", value: "Embroidery, Screen Print available", source: "Web Search - Vendor B2B Page", confidence: "Medium" },
        { attribute: "Printable Area - Front", value: "15 x 10 cm", source: "Web Search - Customization Guide", confidence: "Medium" },
        { attribute: "Printable Area - Side", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Logo Color Limitations", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Setup Fee for Customization", value: "Not Listed", source: "-", confidence: "Low" },
        
        // B2B Commercial Info
        { attribute: "MOQ (Minimum Order Quantity)", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Lead Time - Stock", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Lead Time - Customized", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Bulk Pricing Tiers", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Unit Price (Sample/Retail)", value: "₹2,499", source: "Website", confidence: "High" },
        
        // Packaging & Logistics
        { attribute: "Individual Packaging", value: "Polybag with header card", source: "Web Search", confidence: "Medium" },
        { attribute: "Master Carton Quantity", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Carton Dimensions", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Carton Weight (Gross)", value: "Not Listed", source: "-", confidence: "Low" },
        
        // Compliance & Certifications
        { attribute: "Country of Origin", value: "India", source: "Web Search - Vendor Info", confidence: "Medium" },
        { attribute: "HSN Code", value: "42021900", source: "Web Search", confidence: "Medium" },
        { attribute: "Certifications", value: "Not Listed", source: "-", confidence: "Low" },
        { attribute: "Warranty", value: "6 months manufacturing defects", source: "Web Search", confidence: "Medium" },
      ],
      sourceComparison: [
        // Product Info
        { attribute: "Product Name", webValue: productName, pdfValue: "Weekend Duffle Bag 35L", status: "match" },
        { attribute: "Model/SKU", webValue: "WKD-DFL-BLK-35L", pdfValue: "WKD-DFL-BLK-35L", status: "match" },
        { attribute: "Category", webValue: "Travel Bags / Duffle Bags", pdfValue: "Travel & Luggage - Duffle Bags", status: "similar" },
        { attribute: "Type", webValue: "Duffle Bag", pdfValue: "Travel Duffle Bag", status: "match" },
        
        // Materials & Construction
        { attribute: "Material", webValue: "Faux Leather Fabric", pdfValue: "100% PU Faux Leather", status: "pdf-more-detail" },
        { attribute: "Material Type Detail", webValue: "PU Faux Leather", pdfValue: "Premium PU (Polyurethane) Faux Leather", status: "match" },
        { attribute: "Lining Material", webValue: "Polyester", pdfValue: "210D Polyester lining", status: "pdf-more-detail" },
        { attribute: "Closure Type", webValue: "Zip", pdfValue: "Heavy-duty metal zippers", status: "match" },
        { attribute: "Zipper Brand/Type", webValue: "Heavy-duty metal zipper", pdfValue: "YKK metal zippers", status: "pdf-more-detail" },
        
        // Design & Features
        { attribute: "Color", webValue: "Black", pdfValue: "Black", status: "match" },
        { attribute: "Color Variants Available", webValue: "Black, Brown, Navy", pdfValue: "Black, Brown, Navy Blue", status: "match" },
        { attribute: "Capacity", webValue: "35 Liters", pdfValue: "35L capacity", status: "match" },
        { attribute: "Handle Type", webValue: "Dual padded carry handles", pdfValue: "Dual padded carry handles with reinforced stitching", status: "pdf-more-detail" },
        { attribute: "Strap", webValue: "Adjustable Shoulder Strap", pdfValue: "Adjustable & Removable shoulder strap", status: "pdf-more-detail" },
        { attribute: "Strap Material", webValue: "Not Listed", pdfValue: "Nylon webbing with PU padding", status: "only-pdf" },
        { attribute: "Strap Length Range", webValue: "Not Listed", pdfValue: "95cm - 135cm", status: "only-pdf" },
        { attribute: "Number of Pockets", webValue: "3 exterior, 2 interior", pdfValue: "3 exterior pockets, 2 interior mesh pockets", status: "match" },
        { attribute: "Special Features", webValue: "External Shoe Compartment", pdfValue: "Ventilated shoe compartment (separate)", status: "match" },
        { attribute: "Shoe Compartment Size", webValue: "Up to UK size 12", pdfValue: "Fits up to UK 12 / US 13", status: "match" },
        { attribute: "Water Resistant", webValue: "Yes", pdfValue: "Water-resistant coating (not waterproof)", status: "pdf-more-detail" },
        { attribute: "Water Resistance Rating", webValue: "Not Listed", pdfValue: "Splash resistant - not submersible", status: "only-pdf" },
        
        // Dimensions & Weight
        { attribute: "Dimensions (L x W x H)", webValue: "52 x 28 x 28 cm", pdfValue: "52 x 28 x 28 cm (external dimensions)", status: "match" },
        { attribute: "Weight", webValue: "850g", pdfValue: "850 grams", status: "match" },
        { attribute: "Folded/Collapsed Dimensions", webValue: "Not Listed", pdfValue: "Not foldable - structured bag", status: "only-pdf" },
        
        // Branding & Customization
        { attribute: "Customization Type", webValue: "DTF Printing", pdfValue: "DTF Printing, Embroidery, Screen Print", status: "pdf-more-detail" },
        { attribute: "Other Branding Methods", webValue: "Embroidery, Screen Print available", pdfValue: "Embroidery, Screen Print, Laser Engraving", status: "pdf-more-detail" },
        { attribute: "Printable Area - Front", webValue: "15 x 10 cm", pdfValue: "15 x 10 cm (front panel)", status: "match" },
        { attribute: "Printable Area - Side", webValue: "Not Listed", pdfValue: "12 x 8 cm (side panel)", status: "only-pdf" },
        { attribute: "Logo Color Limitations", webValue: "Not Listed", pdfValue: "DTF: Full color, Embroidery: Max 4 colors, Screen: Max 3 colors", status: "only-pdf" },
        { attribute: "Setup Fee for Customization", webValue: "Not Listed", pdfValue: "₹500 one-time setup (waived for 100+ units)", status: "only-pdf" },
        
        // B2B Commercial Info
        { attribute: "MOQ (Minimum Order Quantity)", webValue: "Not Listed", pdfValue: "25 units", status: "only-pdf" },
        { attribute: "Lead Time - Stock", webValue: "Not Listed", pdfValue: "5-7 business days", status: "only-pdf" },
        { attribute: "Lead Time - Customized", webValue: "Not Listed", pdfValue: "10-12 business days", status: "only-pdf" },
        { attribute: "Bulk Pricing Tiers", webValue: "Not Listed", pdfValue: "25-49: ₹2,299, 50-99: ₹2,099, 100+: ₹1,899", status: "only-pdf" },
        { attribute: "Unit Price (Sample/Retail)", webValue: "₹2,499", pdfValue: "MRP: ₹2,499", status: "match" },
        
        // Packaging & Logistics
        { attribute: "Individual Packaging", webValue: "Polybag with header card", pdfValue: "Polybag with printed header card", status: "match" },
        { attribute: "Master Carton Quantity", webValue: "Not Listed", pdfValue: "10 units per master carton", status: "only-pdf" },
        { attribute: "Carton Dimensions", webValue: "Not Listed", pdfValue: "55 x 45 x 32 cm", status: "only-pdf" },
        { attribute: "Carton Weight (Gross)", webValue: "Not Listed", pdfValue: "9.5 kg", status: "only-pdf" },
        
        // Compliance & Certifications
        { attribute: "Country of Origin", webValue: "India", pdfValue: "Made in India", status: "match" },
        { attribute: "HSN Code", webValue: "42021900", pdfValue: "42021900", status: "match" },
        { attribute: "Certifications", webValue: "Not Listed", pdfValue: "ISO 9001:2015 manufacturing facility", status: "only-pdf" },
        { attribute: "Warranty", webValue: "6 months manufacturing defects", pdfValue: "6 months warranty against manufacturing defects", status: "match" },
      ],
      issues: {
        critical: [
          {
            type: "Material Specification Incomplete",
            title: "Faux Leather Type Not Fully Specified",
            attribute: "Material",
            description: "Product shows 'Faux Leather Fabric' on website and web search suggests 'PU Faux Leather' but exact material composition (percentage of PU vs other materials) is not documented. This is critical for customs, certifications, and customer transparency.",
            sources: ["Website", "Web Search"],
            severity: "Blocker",
            recommendation: "Contact the vendor and ask: 'What is the exact material composition of the faux leather? Please provide: 1) Material breakdown (e.g., 100% PU or PU/PVC blend with percentages), 2) Material safety certificate or REACH compliance document.'"
          },
          {
            type: "Water Resistance Ambiguity",
            title: "Water Resistant Claim Without Specification",
            attribute: "Water Resistant",
            description: "Website states 'Yes' for water resistant but no rating or standard is provided (e.g., IPX rating, water column measurement). Cannot verify or communicate level of protection to B2B clients.",
            sources: ["Website"],
            severity: "Blocker",
            recommendation: "Ask vendor: 'What is the water resistance rating? Is this water-resistant (light rain) or waterproof (submersion)? Please provide test results or IPX rating if available.'"
          }
        ],
        buildAmbiguities: [
          {
            type: "Hardware Quality Unspecified",
            title: "Zipper Brand and Durability Not Confirmed",
            attribute: "Hardware Quality",
            description: "Web search suggests 'heavy-duty metal zipper' but brand (YKK, SBS, etc.) and durability testing not specified. Zipper quality is critical for bag longevity.",
            sources: ["Web Search"],
            severity: "Warning",
            recommendation: "Ask vendor: 'What brand of zippers are used (e.g., YKK, SBS)? Are they corrosion-resistant? What is the zipper pull test rating?'"
          },
          {
            type: "Strap Specification Incomplete",
            title: "Strap Material and Durability Unknown",
            attribute: "Strap",
            description: "Website confirms 'Adjustable Shoulder Strap' but material, weight capacity, and adjustment range not specified.",
            sources: ["Website"],
            severity: "Warning",
            recommendation: "Ask vendor: 'What material is the shoulder strap made of? What is the adjustable length range (e.g., 90-130cm)? What weight can it safely carry?'"
          },
          {
            type: "Dimensions Inconsistency Risk",
            title: "Dimensions Only from Web Search, Not Website",
            attribute: "Dimensions",
            description: "Dimensions (52 x 28 x 28 cm) found via web search but not listed on the official product page. Need confirmation.",
            sources: ["Web Search"],
            severity: "Warning",
            recommendation: "Ask vendor: 'Please confirm exact dimensions are L: 52cm x W: 28cm x H: 28cm. Are these external or internal dimensions?'"
          }
        ],
        missingInfo: [
          {
            attribute: "Water Resistance Rating/Standard",
            field: "Water Resistance Rating/Standard",
            severity: "Blocker"
          },
          {
            attribute: "Exact Material Composition (%)",
            field: "Exact Material Composition (%)",
            severity: "Blocker"
          },
          {
            attribute: "MOQ (Minimum Order Quantity)",
            field: "MOQ (Minimum Order Quantity)",
            severity: "Blocker"
          },
          {
            attribute: "Lead Time - Stock Items",
            field: "Lead Time - Stock Items",
            severity: "Blocker"
          },
          {
            attribute: "Lead Time - Customized Orders",
            field: "Lead Time - Customized Orders",
            severity: "Blocker"
          },
          {
            attribute: "Strap Material & Weight Capacity",
            field: "Strap Material & Weight Capacity",
            severity: "Warning"
          },
          {
            attribute: "Strap Adjustable Length Range",
            field: "Strap Adjustable Length Range",
            severity: "Warning"
          },
          {
            attribute: "Logo Color Limitations (DTF)",
            field: "Logo Color Limitations (DTF)",
            severity: "Warning"
          },
          {
            attribute: "Setup Fee for Customization",
            field: "Setup Fee for Customization",
            severity: "Warning"
          },
          {
            attribute: "Bulk Pricing Tiers",
            field: "Bulk Pricing Tiers",
            severity: "Warning"
          },
          {
            attribute: "Master Carton Quantity",
            field: "Master Carton Quantity",
            severity: "Warning"
          },
          {
            attribute: "Carton Dimensions & Weight",
            field: "Carton Dimensions & Weight",
            severity: "Info"
          },
          {
            attribute: "HSN Code",
            field: "HSN Code",
            severity: "Info"
          },
          {
            attribute: "Certifications (ISO, Eco, etc.)",
            field: "Certifications (ISO, Eco, etc.)",
            severity: "Info"
          },
          {
            attribute: "Printable Area - Side Panel",
            field: "Printable Area - Side Panel",
            severity: "Info"
          }
        ]
      },
      completeness: {
        coreProduct: 75,
        buildManufacturing: 45,
        customization: 55,
        b2bCommercial: 25
      },
      qcStatus: "Blocked – Critical Conflicts",
      downstreamFlags: {
        customizationEnabled: true,
        salesSafeToPitch: false,
        opsReady: false,
        requiresManualReview: true
      }
    };
  }
  
  // Default: Use notebook mock data
  return generateNotebookMockData(productName, brandName);
}

// ==========================================
// TRANSFORM BACKEND API DATA TO FRONTEND FORMAT
// ==========================================
function transformBackendDataToReport(backendData: any, formData: any) {
  const analysis = backendData.analysis || {};
  const productPage = analysis.productPage || {};
  const category = analysis.category || {};
  const conflicts = analysis.conflicts || [];
  const completenessScore = analysis.completenessScore || {};
  
  // Extract attributes from category-specific attributes
  const categoryAttrs = category.attributes || {};
  const requiredAttrs = category.requiredAttributes || {};
  
  // Build extracted attributes list
  const extractedAttributes = [];
  
  // Always add core attributes
  extractedAttributes.push({
    attribute: "Product Name",
    value: productPage.title || formData.productName || "Not Listed",
    source: "Product URL",
    confidence: "High"
  });
  
  extractedAttributes.push({
    attribute: "Brand",
    value: formData.brandName || "Not Listed",
    source: productPage.title ? "Product URL, Website" : "Website",
    confidence: productPage.title ? "High" : "Medium"
  });
  
  extractedAttributes.push({
    attribute: "Model/SKU",
    value: productPage.specifications?.["SKU"] || productPage.specifications?.["Model"] || "Not Listed",
    source: "Website",
    confidence: productPage.specifications?.["SKU"] ? "High" : "Low"
  });
  
  extractedAttributes.push({
    attribute: "Category",
    value: category.displayName || "Unknown",
    source: "Product URL, Website",
    confidence: "High"
  });
  
  extractedAttributes.push({
    attribute: "Product Type",
    value: categoryAttrs["Product Type"] || "Not Listed",
    source: categoryAttrs["Product Type"] ? "Product URL, Website" : "Not Listed",
    confidence: categoryAttrs["Product Type"] ? "High" : "Low"
  });
  
  // Add category-specific attributes ONLY
  Object.entries(categoryAttrs).forEach(([key, value]: [string, any]) => {
    if (key !== "Product Type" && value && value !== "Not found" && value !== "Not Listed") {
      extractedAttributes.push({
        attribute: key,
        value: value,
        source: "Product URL",
        confidence: "High"
      });
    }
  });
  
  // **NEW: Add ALL specifications from productPage.specifications**
  if (productPage.specifications && typeof productPage.specifications === 'object') {
    Object.entries(productPage.specifications).forEach(([key, value]: [string, any]) => {
      // Skip if already added, or if value is empty/invalid
      if (value && value !== "Not found" && value !== "Not Listed" && value !== null) {
        const existingAttr = extractedAttributes.find(attr => attr.attribute === key);
        if (!existingAttr) {
          extractedAttributes.push({
            attribute: key,
            value: String(value),
            source: "Product Page",
            confidence: "High"
          });
        }
      }
    });
  }
  
  // **NEW: If there are additionalSources, mention them**
  if (productPage.additionalSources && productPage.additionalSources.length > 0) {
    console.log(`📊 Found data from ${productPage.additionalSources.length} additional sources`);
  }
  
  // Build issues from conflicts
  const issues = {
    critical: [],
    buildAmbiguities: [],
    missingInfo: []
  };
  
  if (Array.isArray(conflicts)) {
    conflicts.forEach((conflict: any) => {
      const severity = conflict.severity || "medium";
      const issue = {
        title: conflict.issue || conflict.title || "Data conflict detected",
        description: conflict.details || conflict.description || "Please verify with vendor",
        action: conflict.recommendation || conflict.action || "Verify with vendor"
      };
      
      if (severity === "critical" || severity === "high") {
        issues.critical.push(issue);
      } else if (severity === "medium") {
        issues.buildAmbiguities.push(issue);
      } else {
        issues.missingInfo.push(issue);
      }
    });
  }
  
  // Add missing required attributes to missingInfo
  if (requiredAttrs.critical) {
    requiredAttrs.critical.forEach((attr: string) => {
      if (!categoryAttrs[attr] || categoryAttrs[attr] === "Not found") {
        issues.missingInfo.push({
          title: `Missing ${attr}`,
          description: `Critical attribute "${attr}" not found in product page or vendor files`,
          action: `Request ${attr} information from vendor`
        });
      }
    });
  }
  
  return {
    productSummary: {
      productName: formData.productName || productPage.title || "Unknown Product",
      brand: formData.brandName || "Unknown Brand",
      category: category.displayName || "Unknown",
      productType: categoryAttrs["Product Type"] || "Unknown",
      confidenceLevel: "High"
    },
    extractedAttributes,
    issues,
    completeness: {
      overall: Math.round((completenessScore.overall || 0) * 100),
      breakdown: {
        "Product Info": Math.round((completenessScore.productInfo || 0) * 100),
        "Branding": Math.round((completenessScore.branding || 0) * 100),
        "Logistics": Math.round((completenessScore.logistics || 0) * 100),
        "Materials": Math.round((completenessScore.materials || 0) * 100)
      }
    },
    downstreamFlags: {
      customizationEnabled: issues.critical.length === 0 && issues.buildAmbiguities.length < 3,
      salesSafeToPitch: issues.critical.length === 0,
      opsReady: issues.critical.length === 0 && issues.missingInfo.length < 5,
      requiresManualReview: issues.critical.length > 0 || issues.buildAmbiguities.length > 5
    },
    sourceComparison: [], // Can be built from analysis if needed
    timestamp: new Date().toISOString()
  };
}

export function ReportPage() {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState<any>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isActionItemsOpen, setIsActionItemsOpen] = useState(true);

  useEffect(() => {
    // Get data from session storage
    const dataStr = sessionStorage.getItem('qc-engine-data');
    if (!dataStr) {
      navigate('/');
      return;
    }

    const data = JSON.parse(dataStr);
    
    // **CHECK FOR REAL BACKEND DATA FIRST**
    const backendDataStr = sessionStorage.getItem('qc-report-data');
    if (backendDataStr) {
      try {
        const backendData = JSON.parse(backendDataStr);
        // Transform backend data to match frontend format
        const transformedReport = transformBackendDataToReport(backendData, data);
        
        // Ensure downstreamFlags exists
        if (!transformedReport.downstreamFlags) {
          transformedReport.downstreamFlags = {
            customizationEnabled: false,
            salesSafeToPitch: false,
            opsReady: false,
            requiresManualReview: true
          };
        }
        
        setReport(transformedReport);
        return; // Use real data, don't generate mock
      } catch (error) {
        console.error('Error parsing backend data:', error);
        // Fall through to mock data on error
      }
    }
    
    // FALLBACK: Use mock data if no backend data available
    const mockReport = generateMockReport(data.productName, data.brandName);
    
    // Ensure downstreamFlags exists in mock data too
    if (!mockReport.downstreamFlags) {
      mockReport.downstreamFlags = {
        customizationEnabled: false,
        salesSafeToPitch: false,
        opsReady: false,
        requiresManualReview: true
      };
    }
    
    setReport(mockReport);
  }, [navigate]);

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Loading report...</div>
      </div>
    );
  }

  // Ensure downstreamFlags exists (for backward compatibility with old report data)
  if (!report.downstreamFlags) {
    report.downstreamFlags = {
      customizationEnabled: false,
      salesSafeToPitch: false,
      opsReady: false,
      requiresManualReview: true
    };
  }

  const totalIssues = report.issues.critical.length + report.issues.buildAmbiguities.length + report.issues.missingInfo.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Product Quality Report</h2>
          <p className="text-gray-600">{report.productSummary.productName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Check Another Product
          </Button>
          <Button onClick={() => setShowExportDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        productName={report.productSummary.productName}
        reportId={reportId || ""}
        reportData={report}
      />

      {/* Action Items Summary - New Section */}
      {totalIssues > 0 && (
        <Collapsible open={isActionItemsOpen} onOpenChange={setIsActionItemsOpen}>
          <Card className="mb-6 border-2 border-blue-600">
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                <CardTitle className="flex items-center justify-between text-blue-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    What You Need To Do
                  </div>
                  {isActionItemsOpen ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </CardTitle>
                <CardDescription>
                  Here's a simple checklist of actions for this product
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6">
            {/* Critical Issues Actions */}
            {report.issues.critical.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-700 font-bold">{report.issues.critical.length}</span>
                  </div>
                  <h3 className="font-semibold text-red-900">URGENT - Must Fix Before Listing</h3>
                </div>
                <div className="space-y-3 ml-10">
                  {report.issues.critical.map((issue, index) => (
                    <div key={index} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <p className="font-medium text-red-900 mb-2">✗ {issue.title}</p>
                      <p className="text-sm text-red-800 mb-2">{issue.description}</p>
                      <div className="bg-white p-3 rounded border border-red-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">→ Action Required:</p>
                        <p className="text-sm text-gray-900">{issue.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Build Ambiguities Actions */}
            {report.issues.buildAmbiguities.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-700 font-bold">{report.issues.buildAmbiguities.length}</span>
                  </div>
                  <h3 className="font-semibold text-orange-900">Important - Needs Clarification</h3>
                </div>
                <div className="space-y-3 ml-10">
                  {report.issues.buildAmbiguities.map((issue, index) => (
                    <div key={index} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                      <p className="font-medium text-orange-900 mb-2">! {issue.title}</p>
                      <p className="text-sm text-orange-800 mb-2">{issue.description}</p>
                      <div className="bg-white p-3 rounded border border-orange-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">→ Action Required:</p>
                        <p className="text-sm text-gray-900">{issue.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Information Actions */}
            {report.issues.missingInfo.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-700 font-bold">{report.issues.missingInfo.length}</span>
                  </div>
                  <h3 className="font-semibold text-yellow-900">Missing Information - Ask Vendor</h3>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded ml-10">
                  <p className="text-sm text-yellow-900 mb-3">
                    Contact the vendor and ask them to provide these details:
                  </p>
                  <div className="space-y-2">
                    {report.issues.missingInfo.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-yellow-700 mt-1">•</span>
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900">{issue.field}</p>
                          {issue.severity === "Blocker" && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Cannot list without this
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Success Message if no issues */}
      {totalIssues === 0 && (
        <Card className="mb-6 border-2 border-green-600 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div>
                <h3 className="text-xl font-bold text-green-900 mb-1">Great News!</h3>
                <p className="text-green-800">
                  This product has all the information needed. It's ready to be listed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{report.productSummary.productName}</CardTitle>
              <CardDescription className="text-base">
                <span className="font-medium text-gray-700">Brand:</span> {report.productSummary.brand} | 
                <span className="font-medium text-gray-700 ml-2">Category:</span> {report.productSummary.category}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={report.productSummary.confidenceLevel === "High" ? "default" : "secondary"}>
                Confidence: {report.productSummary.confidenceLevel}
              </Badge>
              <Badge 
                variant={
                  report.qcStatus === "Ready for QC Review" ? "default" :
                  report.qcStatus === "Needs Vendor Clarification" ? "secondary" :
                  "destructive"
                }
                className="text-sm"
              >
                {report.qcStatus}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Must Fix</p>
                <p className="text-3xl font-bold text-red-600">{report.issues.critical.length}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Needs Clarity</p>
                <p className="text-3xl font-bold text-orange-600">{report.issues.buildAmbiguities.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Missing Info</p>
                <p className="text-3xl font-bold text-yellow-600">{report.issues.missingInfo.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900">{totalIssues}</p>
              </div>
              <FileText className="w-10 h-10 text-gray-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="attributes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="attributes" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Attributes
          </TabsTrigger>
          <TabsTrigger value="source-comparison" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Source Comparison
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Issues ({totalIssues})
          </TabsTrigger>
          <TabsTrigger value="completeness" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Completeness
          </TabsTrigger>
          <TabsTrigger value="flags" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Status Flags
          </TabsTrigger>
        </TabsList>

        {/* Attributes Tab */}
        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Attributes</CardTitle>
              <CardDescription>
                All product attributes extracted from provided sources with confidence levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Attribute</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.extractedAttributes
                    .slice()
                    .sort((a: any, b: any) => {
                      // Sort filled attributes first
                      const aHasValue = a.value !== "Not Listed";
                      const bHasValue = b.value !== "Not Listed";
                      if (aHasValue && !bHasValue) return -1;
                      if (!aHasValue && bHasValue) return 1;
                      return 0;
                    })
                    .map((attr: any, index: number) => (
                      <TableRow key={index} className={attr.value === "Not Listed" ? "bg-gray-50" : ""}>
                        <TableCell className="font-medium">{attr.attribute}</TableCell>
                        <TableCell>
                          {attr.value === "Not Listed" ? (
                            <span className="text-gray-400 italic">{attr.value}</span>
                          ) : (
                            attr.value
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{attr.source}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={
                            attr.confidence === "High" ? "default" :
                            attr.confidence === "Medium" ? "secondary" :
                            "outline"
                          }>
                            {attr.confidence}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Source Comparison Tab */}
        <TabsContent value="source-comparison">
          {report.sourceComparison ? (
            <>
              {/* Attributes with Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Attributes with Information Found
                  </CardTitle>
                  <CardDescription>
                    Product attributes where we found actual data from web analysis, PDF, or both sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[220px]">Attribute</TableHead>
                        <TableHead>Web Analysis (OffiNeeds + Search)</TableHead>
                        <TableHead>PDF Analysis (Vendor File)</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.sourceComparison
                        .filter((item: any) => item.webValue !== "Not Listed" || item.pdfValue !== "Not Listed")
                        .map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.attribute}</TableCell>
                        <TableCell>
                          {item.webValue === "Not Listed" ? (
                            <span className="text-gray-400 italic">{item.webValue}</span>
                          ) : (
                            <span className="text-gray-900">{item.webValue}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.pdfValue === "Not Listed" ? (
                            <span className="text-gray-400 italic">{item.pdfValue}</span>
                          ) : (
                            <span className="text-gray-900">{item.pdfValue}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.status === "match" && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Match
                            </Badge>
                          )}
                          {item.status === "similar" && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Similar
                            </Badge>
                          )}
                          {item.status === "mismatch" && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Conflict
                            </Badge>
                          )}
                          {item.status === "only-web" && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700">
                              Web Only
                            </Badge>
                          )}
                          {item.status === "only-pdf" && (
                            <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                              PDF Only
                            </Badge>
                          )}
                          {item.status === "pdf-more-detail" && (
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                              PDF Detailed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Attributes Missing Information */}
            {report.sourceComparison.filter((item: any) => item.webValue === "Not Listed" && item.pdfValue === "Not Listed").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="w-5 h-5" />
                    Attributes Missing from Both Sources
                  </CardTitle>
                  <CardDescription>
                    Critical attributes where neither the website nor vendor PDF provided information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[220px]">Attribute</TableHead>
                        <TableHead>Web Analysis (OffiNeeds + Search)</TableHead>
                        <TableHead>PDF Analysis (Vendor File)</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.sourceComparison
                        .filter((item: any) => item.webValue === "Not Listed" && item.pdfValue === "Not Listed")
                        .map((item: any, index: number) => (
                          <TableRow key={index} className="bg-orange-50">
                            <TableCell className="font-medium">{item.attribute}</TableCell>
                            <TableCell>
                              <span className="text-gray-400 italic">{item.webValue}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-400 italic">{item.pdfValue}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-orange-400 text-orange-700">
                                Missing
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-semibold text-orange-900 mb-2">⚠️ Action Required:</p>
                    <p className="text-sm text-orange-800">
                      Contact the vendor to obtain these missing attributes. Without this information, the product cannot be listed on the platform.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Status Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <Badge variant="default" className="bg-green-600">Match</Badge>
                    <p className="text-sm text-gray-600">Information matches across sources</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive">Conflict</Badge>
                    <p className="text-sm text-gray-600">Contradictory information - needs resolution</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700">PDF Only</Badge>
                    <p className="text-sm text-gray-600">Information only found in PDF</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="border-purple-300 text-purple-700">Web Only</Badge>
                    <p className="text-sm text-gray-600">Information only found on website</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">PDF Detailed</Badge>
                    <p className="text-sm text-gray-600">PDF provides more detailed info</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">Similar</Badge>
                    <p className="text-sm text-gray-600">Information is similar but worded differently</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Source comparison data not available for this product.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload vendor PDF files to enable source comparison analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Issues Tab */}
        <TabsContent value="issues">
          <div className="space-y-6">
            {/* Critical Conflicts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-5 h-5" />
                  Critical Conflicts ({report.issues.critical.length})
                </CardTitle>
                <CardDescription>
                  Data conflicts that must be resolved before catalog listing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.issues.critical.length === 0 ? (
                  <p className="text-gray-500 italic">No critical conflicts detected</p>
                ) : (
                  <div className="space-y-4">
                    {report.issues.critical.map((issue: any, index: number) => (
                      <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-red-900">{issue.type}</h4>
                          <Badge variant="destructive">{issue.severity}</Badge>
                        </div>
                        <p className="text-sm text-red-800 mb-2">{issue.description}</p>
                        <p className="text-xs text-red-700">
                          <span className="font-medium">Sources:</span> {issue.sources.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Build Ambiguities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  Build & Quality Ambiguities ({report.issues.buildAmbiguities.length})
                </CardTitle>
                <CardDescription>
                  Vague or unclear manufacturing and quality claims
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.issues.buildAmbiguities.length === 0 ? (
                  <p className="text-gray-500 italic">No build ambiguities detected</p>
                ) : (
                  <div className="space-y-4">
                    {report.issues.buildAmbiguities.map((issue: any, index: number) => (
                      <div key={index} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-orange-900">{issue.type}</h4>
                          <Badge className="bg-orange-600">{issue.severity}</Badge>
                        </div>
                        <p className="text-sm text-orange-800 mb-2">{issue.description}</p>
                        <p className="text-xs text-orange-700">
                          <span className="font-medium">Sources:</span> {issue.sources.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Missing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-5 h-5" />
                  Missing B2B-Critical Information ({report.issues.missingInfo.length})
                </CardTitle>
                <CardDescription>
                  Required attributes not found in any source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.issues.missingInfo.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="font-medium text-yellow-900">{item.attribute}</span>
                      <Badge variant={
                        item.severity === "Blocker" ? "destructive" :
                        item.severity === "Warning" ? "secondary" :
                        "outline"
                      }>
                        {item.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Completeness Tab */}
        <TabsContent value="completeness">
          <Card>
            <CardHeader>
              <CardTitle>Data Completeness Scores</CardTitle>
              <CardDescription>
                Percentage completeness across key data categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Core Product Information</h4>
                    <p className="text-sm text-gray-600">Name, SKU, materials, dimensions, weight</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{report.completeness.coreProduct}%</span>
                </div>
                <Progress value={report.completeness.coreProduct} className="h-3" />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Build & Manufacturing Clarity</h4>
                    <p className="text-sm text-gray-600">Construction, durability, certifications</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{report.completeness.buildManufacturing}%</span>
                </div>
                <Progress value={report.completeness.buildManufacturing} className="h-3" />
                {report.completeness.buildManufacturing < 70 && (
                  <p className="text-sm text-orange-600 mt-2">• Vague quality claims without certification</p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Customization Readiness</h4>
                    <p className="text-sm text-gray-600">Branding methods, printable area, limitations</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{report.completeness.customization}%</span>
                </div>
                <Progress value={report.completeness.customization} className="h-3" />
                {report.completeness.customization < 70 && (
                  <p className="text-sm text-orange-600 mt-2">• Logo color limitations not specified</p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">B2B Commercial & Ops Readiness</h4>
                    <p className="text-sm text-gray-600">MOQ, pricing, lead time, packaging</p>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{report.completeness.b2bCommercial}%</span>
                </div>
                <Progress value={report.completeness.b2bCommercial} className="h-3" />
                {report.completeness.b2bCommercial < 70 && (
                  <div className="text-sm text-red-600 mt-2 space-y-1">
                    <p>• MOQ missing (Blocker)</p>
                    <p>• Lead time not specified (Blocker)</p>
                    <p>• Pricing tiers not available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Flags Tab */}
        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle>Downstream Status Flags</CardTitle>
              <CardDescription>
                Operational flags for platform use and workflow routing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">Customization Enabled</h4>
                      <p className="text-sm text-gray-600">Can branding be applied?</p>
                    </div>
                    {report.downstreamFlags.customizationEnabled ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">Sales-Safe to Pitch</h4>
                      <p className="text-sm text-gray-600">Ready for sales team?</p>
                    </div>
                    {report.downstreamFlags.salesSafeToPitch ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">Ops-Ready</h4>
                      <p className="text-sm text-gray-600">Can fulfill orders?</p>
                    </div>
                    {report.downstreamFlags.opsReady ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">Requires Manual Review</h4>
                      <p className="text-sm text-gray-600">Needs QC team attention?</p>
                    </div>
                    {report.downstreamFlags.requiresManualReview ? (
                      <AlertCircle className="w-8 h-8 text-orange-600" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Recommended Action
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  Based on the analysis, this product requires vendor clarification before proceeding.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900">Priority items to clarify with vendor:</p>
                  <ul className="text-sm text-blue-800 space-y-1 ml-4">
                    <li>• Exact material composition (resolve PU vs vegan leather)</li>
                    <li>• Minimum Order Quantity (MOQ)</li>
                    <li>• Lead time for standard and custom orders</li>
                    <li>• Binding method details</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}