/**
 * Utility functions for handling variable substitution in text
 */

// Process text with {variable_name} syntax
export const processVariableSubstitution = (text: string, context: 'python' | 'bash' | 'display' = 'python'): string => {
  if (!text) return text;
  
  // Find all {variable_name} patterns
  const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  
  return text.replace(variablePattern, (match, variableName) => {
    switch (context) {
      case 'python':
        // For Python code, use f-string or string formatting
        return `{${variableName}}`;
      case 'bash':
        // For bash, use $variable syntax
        return `$${variableName}`;
      case 'display':
        // For display purposes, keep the original format
        return match;
      default:
        return match;
    }
  });
};

// Check if text contains variable references
export const hasVariableReferences = (text: string): boolean => {
  if (!text) return false;
  const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/;
  return variablePattern.test(text);
};

// Extract variable names from text
export const extractVariableNames = (text: string): string[] => {
  if (!text) return [];
  
  const variablePattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const matches = [];
  let match;
  
  while ((match = variablePattern.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return Array.from(new Set(matches)); // Remove duplicates
};

// Convert text to Python f-string format if it contains variables
export const toPythonFString = (text: string): string => {
  if (!text) return '""';
  
  // Check if text contains variable references
  if (hasVariableReferences(text)) {
    // Convert {variable} to Python f-string format
    const processedText = text.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '{$1}');
    return `f"${processedText}"`;
  }
  
  // Regular string
  return `"${text}"`;
};

// Convert text to bash variable substitution format
export const toBashVariableSubstitution = (text: string): string => {
  if (!text) return text;
  
  // Convert {variable} to $variable
  return text.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '$$$1');
};

// Validate variable names in text
export const validateVariableReferences = (text: string, availableVariables: string[]): { isValid: boolean; invalidVariables: string[] } => {
  const referencedVariables = extractVariableNames(text);
  const invalidVariables = referencedVariables.filter(varName => !availableVariables.includes(varName));
  
  return {
    isValid: invalidVariables.length === 0,
    invalidVariables
  };
};