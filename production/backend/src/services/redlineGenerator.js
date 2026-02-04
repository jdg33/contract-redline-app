import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a redlined .docx with Word tracked changes
 *
 * Word documents are ZIP files containing XML. To add tracked changes:
 * 1. Unzip the .docx
 * 2. Parse word/document.xml
 * 3. Find and replace text with tracked change XML
 * 4. Rezip the document
 */

const TRACKED_CHANGE_AUTHOR = 'Claude';

/**
 * Get current timestamp in Word XML format
 */
function getWordTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Escape special XML characters
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x2019;'); // Smart apostrophe
}

/**
 * Create tracked change XML for a deletion
 */
function createDeletionXml(text, id) {
  const timestamp = getWordTimestamp();
  return `<w:del w:id="${id}" w:author="${TRACKED_CHANGE_AUTHOR}" w:date="${timestamp}"><w:r><w:delText>${escapeXml(text)}</w:delText></w:r></w:del>`;
}

/**
 * Create tracked change XML for an insertion
 */
function createInsertionXml(text, id) {
  const timestamp = getWordTimestamp();
  return `<w:ins w:id="${id}" w:author="${TRACKED_CHANGE_AUTHOR}" w:date="${timestamp}"><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:ins>`;
}

/**
 * Create combined delete + insert tracked change
 */
function createRedlineXml(deleteText, insertText, baseId) {
  const parts = [];

  if (deleteText) {
    parts.push(createDeletionXml(deleteText, baseId));
  }

  if (insertText) {
    parts.push(createInsertionXml(insertText, baseId + 1));
  }

  return parts.join('');
}

/**
 * Find text in Word XML content, handling split runs
 * Word often splits text across multiple <w:t> elements
 */
function findTextInXml(xmlContent, searchText) {
  // First try direct match
  if (xmlContent.includes(searchText)) {
    return { found: true, direct: true };
  }

  // Try matching with XML tags stripped (text might be split across runs)
  const textOnlyRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let fullText = '';
  let match;

  while ((match = textOnlyRegex.exec(xmlContent)) !== null) {
    fullText += match[1];
  }

  if (fullText.includes(searchText)) {
    return { found: true, direct: false };
  }

  return { found: false };
}

/**
 * Replace text in Word XML with tracked changes
 * This handles the common case where text is in a single run
 */
function replaceTextWithTrackedChange(xmlContent, searchText, deleteText, insertText, changeId) {
  // Escape the search text for regex
  const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Try to find the text within <w:t> tags
  const textPattern = new RegExp(
    `(<w:t[^>]*>)([^<]*)(${escapedSearch})([^<]*)(</w:t>)`,
    'g'
  );

  let replaced = false;
  const result = xmlContent.replace(textPattern, (match, openTag, before, found, after, closeTag) => {
    replaced = true;

    // Build the replacement
    let replacement = '';

    // Text before the match stays as-is
    if (before) {
      replacement += `${openTag}${before}${closeTag}`;
    }

    // Add the tracked change
    replacement += createRedlineXml(deleteText, insertText, changeId);

    // Text after the match stays as-is
    if (after) {
      replacement += `${openTag}${after}${closeTag}`;
    }

    return replacement;
  });

  return { content: result, replaced };
}

/**
 * Apply a single change to the document XML
 */
function applyChange(xmlContent, change, changeIdBase) {
  const searchText = change.location?.searchText || change.redline.delete;

  if (!searchText) {
    console.warn(`Skipping change ${change.id}: no search text`);
    return { content: xmlContent, applied: false };
  }

  // Check if the text exists in the document
  const searchResult = findTextInXml(xmlContent, searchText);

  if (!searchResult.found) {
    console.warn(`Could not find text for change ${change.id}: "${searchText.substring(0, 50)}..."`);
    return { content: xmlContent, applied: false };
  }

  // Apply the replacement
  const { content, replaced } = replaceTextWithTrackedChange(
    xmlContent,
    searchText,
    change.redline.delete,
    change.redline.insert,
    changeIdBase
  );

  if (replaced) {
    console.log(`Applied change ${change.id}: ${change.clause}`);
  } else {
    console.warn(`Text found but could not apply change ${change.id} (may be split across runs)`);
  }

  return { content, applied: replaced };
}

/**
 * Enable track changes in document settings
 */
function enableTrackChanges(settingsXml) {
  // Add trackRevisions element if not present
  if (!settingsXml.includes('<w:trackRevisions')) {
    // Insert before </w:settings>
    return settingsXml.replace(
      '</w:settings>',
      '<w:trackRevisions/></w:settings>'
    );
  }
  return settingsXml;
}

/**
 * Generate a redlined document with tracked changes
 */
export async function generateRedline({ contractBuffer, changes }) {
  if (!changes || changes.length === 0) {
    throw new Error('No changes to apply');
  }

  // Unzip the document
  const zip = new AdmZip(contractBuffer);

  // Get the main document content
  const documentXmlEntry = zip.getEntry('word/document.xml');
  if (!documentXmlEntry) {
    throw new Error('Invalid .docx file: missing document.xml');
  }

  let documentXml = documentXmlEntry.getData().toString('utf8');

  // Apply each change
  let changeIdCounter = 1;
  const appliedChanges = [];
  const failedChanges = [];

  for (const change of changes) {
    // Skip changes without actual redlines
    if (!change.redline.delete && !change.redline.insert) {
      continue;
    }

    const { content, applied } = applyChange(documentXml, change, changeIdCounter);
    documentXml = content;

    if (applied) {
      appliedChanges.push(change.id);
      changeIdCounter += 2; // Each change uses 2 IDs (delete + insert)
    } else {
      failedChanges.push(change.id);
    }
  }

  console.log(`Applied ${appliedChanges.length} changes, ${failedChanges.length} failed`);

  // Update the document XML
  zip.updateFile('word/document.xml', Buffer.from(documentXml, 'utf8'));

  // Enable track changes in settings
  const settingsEntry = zip.getEntry('word/settings.xml');
  if (settingsEntry) {
    let settingsXml = settingsEntry.getData().toString('utf8');
    settingsXml = enableTrackChanges(settingsXml);
    zip.updateFile('word/settings.xml', Buffer.from(settingsXml, 'utf8'));
  }

  // Return the modified document
  return zip.toBuffer();
}

/**
 * Alternative: Generate a new document with tracked changes using docx library
 * Use this if you need to create a document from scratch
 */
export async function generateRedlineFromScratch({ originalText, changes }) {
  // This would use the docx library to create a new document
  // with tracked changes from scratch. More reliable but loses
  // original formatting.

  // Implementation would go here if needed
  throw new Error('generateRedlineFromScratch not implemented - use generateRedline instead');
}
