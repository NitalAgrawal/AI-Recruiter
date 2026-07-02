/**
 * Resume Text Extractor
 * 
 * Modular extraction layer. Supports PDF and DOCX.
 * Swap out extractPdf / extractDocx for AI-based extraction (Gemini, etc.) 
 * in the future without changing any API or service layer.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract raw text from a PDF file
 */
const extractPdf = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text || '';
};

/**
 * Extract raw text from a DOCX file
 */
const extractDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
};

/**
 * Dispatch to the correct extractor by file type
 */
const extractText = async (filePath, fileType) => {
  if (fileType === 'pdf') return await extractPdf(filePath);
  if (fileType === 'docx') return await extractDocx(filePath);
  throw new Error(`Unsupported file type: ${fileType}`);
};

module.exports = { extractText };
