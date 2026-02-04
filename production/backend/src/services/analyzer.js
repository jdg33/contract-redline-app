import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_PLAYBOOK } from '../config/defaultPlaybook.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Extract text content from a .docx file
 */
async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Build the analysis prompt for Claude
 */
function buildAnalysisPrompt({ playbookText, contractText, contractType, organizationRole }) {
  return `You are a meticulous contract analyst for an in-house legal team. Your task is to analyze the provided contract against the organization's negotiation playbook and identify deviations that require attention.

<playbook>
${playbookText}
</playbook>

<contract>
${contractText}
</contract>

<context>
Contract Type: ${contractType}
Organization Role: ${organizationRole} (we are the ${organizationRole})
</context>

## Instructions

Analyze each material clause in the contract against the playbook standards. For each deviation found:

1. **Identify the clause type** (e.g., "Limitation of Liability", "Indemnification", "Data Protection")

2. **Classify severity**:
   - **RED**: Triggers escalation criteria from playbook, unacceptable risk, requires senior counsel review
   - **YELLOW**: Outside standard position but within acceptable range, negotiate with fallback ready
   - **GREEN**: Within standard position or acceptable, no changes needed

3. **Describe the issue** concisely but specifically

4. **Provide surgical redlines**:
   - Identify the EXACT text to delete (quote precisely from the contract)
   - Provide the replacement text to insert
   - Keep changes minimal and precise - change only what's necessary

5. **Explain rationale** - why this change protects the organization

6. **For YELLOW items**, suggest a fallback position if the primary ask is rejected

## Important Guidelines

- Be PRECISE with quoted text - it must match the contract exactly
- Focus on material terms that affect risk, liability, and obligations
- Consider the organization's role (${organizationRole}) when assessing risk
- Provide actionable, implementable redlines
- If a clause is acceptable, mark it GREEN with brief rationale

Return your analysis as a JSON array with this exact structure:

\`\`\`json
[
  {
    "id": "unique-id",
    "clause": "Clause Type Name",
    "severity": "RED|YELLOW|GREEN",
    "issue": "Brief description of the deviation",
    "location": {
      "searchText": "exact text to locate in document"
    },
    "redline": {
      "delete": "exact text to delete (empty string if adding new text)",
      "insert": "replacement or new text to insert"
    },
    "rationale": "Why this change is needed",
    "fallback": "Alternative position if primary is rejected (null for RED/GREEN)"
  }
]
\`\`\`

Analyze the contract thoroughly and return ONLY the JSON array, no other text.`;
}

/**
 * Parse Claude's response to extract the JSON array
 */
function parseAnalysisResponse(responseText) {
  // Try to extract JSON from the response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse analysis response as JSON');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Invalid JSON in response: ${e.message}`);
  }
}

/**
 * Analyze a contract against a playbook using Claude
 */
export async function analyzeContract({
  contractBuffer,
  playbookBuffer,
  contractType,
  organizationRole
}) {
  // Extract text from documents
  const contractText = await extractDocxText(contractBuffer);
  const playbookText = playbookBuffer
    ? await extractDocxText(playbookBuffer)
    : DEFAULT_PLAYBOOK;

  if (!contractText || contractText.trim().length < 100) {
    throw new Error('Contract appears to be empty or too short');
  }

  console.log(`Contract length: ${contractText.length} characters`);
  console.log(`Playbook length: ${playbookText.length} characters`);

  // Build the prompt
  const prompt = buildAnalysisPrompt({
    playbookText,
    contractText,
    contractType,
    organizationRole
  });

  // Call Claude API
  console.log('Calling Claude API for analysis...');
  const startTime = Date.now();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.2,
    system: `You are a precise, thorough contract analyst. You identify deviations from negotiation playbooks and provide surgical, implementable redlines. You always return valid JSON.`,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  const elapsed = Date.now() - startTime;
  console.log(`Claude response received in ${elapsed}ms`);

  // Extract text content from response
  const responseText = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Parse the analysis
  const analyses = parseAnalysisResponse(responseText);

  // Ensure each analysis has an ID
  const processedAnalyses = analyses.map((analysis, index) => ({
    ...analysis,
    id: analysis.id || `clause-${index + 1}`
  }));

  // Calculate summary
  const summary = {
    red: processedAnalyses.filter(a => a.severity === 'RED').length,
    yellow: processedAnalyses.filter(a => a.severity === 'YELLOW').length,
    green: processedAnalyses.filter(a => a.severity === 'GREEN').length,
    total: processedAnalyses.length
  };

  return {
    id: uuidv4(),
    analyses: processedAnalyses,
    summary,
    metadata: {
      contractType,
      organizationRole,
      analyzedAt: new Date().toISOString(),
      model: response.model,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens
    }
  };
}
