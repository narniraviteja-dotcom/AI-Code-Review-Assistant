const { normalizeAiReview, normalizeStaticAnalysis, getSuggestedFix } = require('../controllers/codeReviewController');

describe('getSuggestedFix', () => {
  test('returns semi fix for semi rule', () => {
    expect(getSuggestedFix('semi', 'Missing semicolon')).toBe(
      'Add the missing semicolon to the end of the statement.'
    );
  });

  test('returns unused var fix for no-unused-vars rule', () => {
    expect(getSuggestedFix('no-unused-vars', 'x is assigned but never used')).toBe(
      'Remove the unused variable or intentionally mark it as unused.'
    );
  });

  test('returns no-console fix for no-console rule', () => {
    expect(getSuggestedFix('no-console', 'Unexpected console statement')).toBe(
      'Remove the console statement or replace it with a logger.'
    );
  });

  test('returns undef fix for undef rule', () => {
    expect(getSuggestedFix('undef', 'x is not defined')).toBe(
      'Define the variable before using it.'
    );
  });

  test('returns generic fix for unknown rule', () => {
    expect(getSuggestedFix('unknown-rule', 'Some description')).toBe(
      'Review the flagged line and update the code to satisfy the rule.'
    );
  });
});

describe('normalizeAiReview', () => {
  test('returns fallback for empty input', () => {
    const result = normalizeAiReview('');
    expect(result.status).toBe('fallback');
    expect(result.summary).toBe('AI review unavailable at the moment. Please try again later.');
  });

  test('returns fallback for null input', () => {
    const result = normalizeAiReview(null);
    expect(result.status).toBe('fallback');
  });

  test('parses valid JSON review', () => {
    const input = JSON.stringify({
      summary: 'This code is good',
      bugs: ['Bug 1', 'Bug 2'],
      codeSmells: ['Smell 1'],
      improvements: ['Improvement 1'],
      explanation: 'Explanation text',
    });
    const result = normalizeAiReview(input);
    expect(result.summary).toBe('This code is good');
    expect(result.bugs).toHaveLength(2);
    expect(result.codeSmells).toHaveLength(1);
    expect(result.improvements).toHaveLength(1);
    expect(result.status).toBe('completed');
  });

  test('handles markdown code block JSON', () => {
    const input = '```json\n{"summary": "In markdown"}\n```';
    const result = normalizeAiReview(input);
    expect(result.summary).toBe('In markdown');
  });

  test('handles malformed JSON gracefully', () => {
    const input = 'This is some plain text response from AI';
    const result = normalizeAiReview(input);
    expect(result.status).toBe('parsed_text');
    expect(result.summary).toBe('This is some plain text response from AI');
  });
});

describe('normalizeStaticAnalysis', () => {
  test('returns no issues for empty output', () => {
    const result = normalizeStaticAnalysis('eslint', '');
    expect(result.issues).toHaveLength(0);
    expect(result.tool).toBe('eslint');
  });

  test('parses ESLint output format', () => {
    const eslintOutput = `sample.js:1:5: Missing semicolon [semi]
sample.js:3:10: 'x' is assigned but never used [no-unused-vars]`;
    const result = normalizeStaticAnalysis('eslint', eslintOutput);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].ruleName).toBe('semi');
    expect(result.issues[0].line).toBe(1);
  });

  test('parses Pylint output format', () => {
    const pylintOutput = `sample.py:1:0: [C0301] Line too long
sample.py:5:4: [W0611] Unused import`;
    const result = normalizeStaticAnalysis('pylint', pylintOutput);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});