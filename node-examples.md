# Generic Node Examples for AgentBlocks

This document shows how to design generic nodes that can be executed by different runtime engines (Python, Rust, etc.).

## Generic Node Structure

Each node has a **specification** (platform-agnostic) and **implementations** (platform-specific).

### Node Specification Format

```json
{
  "id": "node_123",
  "type": "grep", 
  "version": "1.0",
  "properties": {
    "pattern": "error",
    "input_source": "file",
    "file_path": "/var/log/app.log",
    "case_insensitive": true,
    "whole_words": false,
    "invert_match": false,
    "line_numbers": true,
    "count_only": false,
    "max_count": null,
    "context_before": 0,
    "context_after": 0,
    "binary_files": "skip",
    "recursive": false,
    "file_pattern": "*.log"
  },
  "inputs": [
    {
      "name": "text_input",
      "type": "string",
      "optional": true,
      "description": "Text to search (alternative to file input)"
    }
  ],
  "outputs": [
    {
      "name": "matches",
      "type": "array",
      "description": "Array of matching lines with metadata"
    },
    {
      "name": "match_count", 
      "type": "number",
      "description": "Total number of matches found"
    }
  ]
}
```

## Grep Node Implementation

### Python Implementation

```python
# executors/python/nodes/grep_node.py

import re
import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class GrepMatch:
    line_number: int
    line_content: str
    file_path: Optional[str] = None
    context_before: List[str] = None
    context_after: List[str] = None

class GrepNode:
    def __init__(self, properties: Dict[str, Any]):
        self.pattern = properties.get('pattern', '')
        self.input_source = properties.get('input_source', 'file')  # 'file' or 'input'
        self.file_path = properties.get('file_path', '')
        
        # Grep options (matching Linux grep flags)
        self.case_insensitive = properties.get('case_insensitive', False)  # -i
        self.whole_words = properties.get('whole_words', False)           # -w  
        self.invert_match = properties.get('invert_match', False)         # -v
        self.line_numbers = properties.get('line_numbers', False)         # -n
        self.count_only = properties.get('count_only', False)             # -c
        self.max_count = properties.get('max_count', None)                # -m NUM
        self.context_before = properties.get('context_before', 0)         # -B NUM
        self.context_after = properties.get('context_after', 0)           # -A NUM
        self.binary_files = properties.get('binary_files', 'skip')        # --binary-files=TYPE
        self.recursive = properties.get('recursive', False)               # -r
        self.file_pattern = properties.get('file_pattern', '*')           # file glob pattern
        
        # Compile regex pattern
        flags = re.IGNORECASE if self.case_insensitive else 0
        if self.whole_words:
            self.pattern = rf'\b{re.escape(self.pattern)}\b'
        self.regex = re.compile(self.pattern, flags)

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the grep operation"""
        matches = []
        total_count = 0
        
        if self.input_source == 'input':
            # Search in provided text input
            text_input = inputs.get('text_input', '')
            matches, total_count = self._search_text(text_input)
            
        elif self.input_source == 'file':
            # Search in file(s)
            if self.recursive:
                matches, total_count = self._search_recursive()
            else:
                matches, total_count = self._search_file(self.file_path)
        
        # Apply max_count limit
        if self.max_count and len(matches) > self.max_count:
            matches = matches[:self.max_count]
            
        result = {
            'match_count': total_count,
            'matches': [self._match_to_dict(m) for m in matches] if not self.count_only else []
        }
        
        return result

    def _search_text(self, text: str, file_path: str = None) -> tuple[List[GrepMatch], int]:
        """Search within text content"""
        lines = text.split('\n')
        matches = []
        
        for i, line in enumerate(lines, 1):
            is_match = bool(self.regex.search(line))
            
            # Apply invert_match logic
            if self.invert_match:
                is_match = not is_match
                
            if is_match:
                # Get context lines
                context_before = []
                context_after = []
                
                if self.context_before > 0:
                    start = max(0, i - 1 - self.context_before)
                    context_before = lines[start:i-1]
                    
                if self.context_after > 0:
                    end = min(len(lines), i + self.context_after)
                    context_after = lines[i:end]
                
                match = GrepMatch(
                    line_number=i,
                    line_content=line,
                    file_path=file_path,
                    context_before=context_before,
                    context_after=context_after
                )
                matches.append(match)
                
        return matches, len(matches)

    def _search_file(self, file_path: str) -> tuple[List[GrepMatch], int]:
        """Search within a single file"""
        try:
            # Check if file is binary (basic check)
            if self.binary_files == 'skip' and self._is_binary_file(file_path):
                return [], 0
                
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            return self._search_text(content, file_path)
            
        except (IOError, UnicodeDecodeError) as e:
            print(f"Error reading {file_path}: {e}")
            return [], 0

    def _search_recursive(self) -> tuple[List[GrepMatch], int]:
        """Search recursively through directories"""
        import glob
        
        all_matches = []
        total_count = 0
        
        # Handle glob pattern for recursive search
        search_pattern = os.path.join(self.file_path, '**', self.file_pattern)
        
        for file_path in glob.glob(search_pattern, recursive=True):
            if os.path.isfile(file_path):
                matches, count = self._search_file(file_path)
                all_matches.extend(matches)
                total_count += count
                
        return all_matches, total_count

    def _is_binary_file(self, file_path: str) -> bool:
        """Simple binary file detection"""
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(1024)
                return b'\0' in chunk
        except:
            return True

    def _match_to_dict(self, match: GrepMatch) -> Dict[str, Any]:
        """Convert GrepMatch to dictionary for JSON serialization"""
        return {
            'line_number': match.line_number if self.line_numbers else None,
            'line_content': match.line_content,
            'file_path': match.file_path,
            'context_before': match.context_before or [],
            'context_after': match.context_after or []
        }

# Node factory function
def create_grep_node(properties: Dict[str, Any]) -> GrepNode:
    return GrepNode(properties)
```

### Rust Implementation

```rust
// executors/rust/src/nodes/grep_node.rs

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrepMatch {
    pub line_number: Option<usize>,
    pub line_content: String,
    pub file_path: Option<String>,
    pub context_before: Vec<String>,
    pub context_after: Vec<String>,
}

#[derive(Debug)]
pub struct GrepNode {
    pattern: String,
    regex: Regex,
    input_source: String,
    file_path: String,
    
    // Grep options
    case_insensitive: bool,
    whole_words: bool,
    invert_match: bool,
    line_numbers: bool,
    count_only: bool,
    max_count: Option<usize>,
    context_before: usize,
    context_after: usize,
    binary_files: String,
    recursive: bool,
    file_pattern: String,
}

impl GrepNode {
    pub fn new(properties: HashMap<String, serde_json::Value>) -> Result<Self, Box<dyn std::error::Error>> {
        let pattern = properties.get("pattern")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let case_insensitive = properties.get("case_insensitive")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let whole_words = properties.get("whole_words")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        // Build regex pattern
        let mut regex_pattern = pattern.clone();
        if whole_words {
            regex_pattern = format!(r"\b{}\b", regex::escape(&pattern));
        }

        let mut regex_builder = regex::RegexBuilder::new(&regex_pattern);
        regex_builder.case_insensitive(case_insensitive);
        let regex = regex_builder.build()?;

        Ok(GrepNode {
            pattern,
            regex,
            input_source: properties.get("input_source")
                .and_then(|v| v.as_str())
                .unwrap_or("file")
                .to_string(),
            file_path: properties.get("file_path")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            case_insensitive,
            whole_words,
            invert_match: properties.get("invert_match")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            line_numbers: properties.get("line_numbers")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            count_only: properties.get("count_only")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            max_count: properties.get("max_count")
                .and_then(|v| v.as_u64())
                .map(|v| v as usize),
            context_before: properties.get("context_before")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as usize,
            context_after: properties.get("context_after")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as usize,
            binary_files: properties.get("binary_files")
                .and_then(|v| v.as_str())
                .unwrap_or("skip")
                .to_string(),
            recursive: properties.get("recursive")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            file_pattern: properties.get("file_pattern")
                .and_then(|v| v.as_str())
                .unwrap_or("*")
                .to_string(),
        })
    }

    pub fn execute(&self, inputs: HashMap<String, serde_json::Value>) -> Result<HashMap<String, serde_json::Value>, Box<dyn std::error::Error>> {
        let (matches, total_count) = match self.input_source.as_str() {
            "input" => {
                let text_input = inputs.get("text_input")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                self.search_text(text_input, None)?
            },
            "file" => {
                if self.recursive {
                    self.search_recursive()?
                } else {
                    self.search_file(&self.file_path)?
                }
            },
            _ => return Err("Invalid input_source".into()),
        };

        // Apply max_count limit
        let limited_matches = if let Some(max) = self.max_count {
            matches.into_iter().take(max).collect()
        } else {
            matches
        };

        let mut result = HashMap::new();
        result.insert("match_count".to_string(), serde_json::Value::Number(total_count.into()));
        
        if !self.count_only {
            result.insert("matches".to_string(), serde_json::to_value(limited_matches)?);
        } else {
            result.insert("matches".to_string(), serde_json::Value::Array(vec![]));
        }

        Ok(result)
    }

    fn search_text(&self, text: &str, file_path: Option<&str>) -> Result<(Vec<GrepMatch>, usize), Box<dyn std::error::Error>> {
        let lines: Vec<&str> = text.lines().collect();
        let mut matches = Vec::new();

        for (i, line) in lines.iter().enumerate() {
            let is_match = self.regex.is_match(line);
            let should_include = if self.invert_match { !is_match } else { is_match };

            if should_include {
                let line_number = if self.line_numbers { Some(i + 1) } else { None };
                
                // Get context lines
                let context_before = if self.context_before > 0 {
                    let start = i.saturating_sub(self.context_before);
                    lines[start..i].iter().map(|s| s.to_string()).collect()
                } else {
                    Vec::new()
                };

                let context_after = if self.context_after > 0 {
                    let end = std::cmp::min(lines.len(), i + 1 + self.context_after);
                    lines[i + 1..end].iter().map(|s| s.to_string()).collect()
                } else {
                    Vec::new()
                };

                matches.push(GrepMatch {
                    line_number,
                    line_content: line.to_string(),
                    file_path: file_path.map(|s| s.to_string()),
                    context_before,
                    context_after,
                });
            }
        }

        Ok((matches, matches.len()))
    }

    fn search_file(&self, file_path: &str) -> Result<(Vec<GrepMatch>, usize), Box<dyn std::error::Error>> {
        // Check if file is binary
        if self.binary_files == "skip" && self.is_binary_file(file_path)? {
            return Ok((Vec::new(), 0));
        }

        let content = fs::read_to_string(file_path)?;
        self.search_text(&content, Some(file_path))
    }

    fn search_recursive(&self) -> Result<(Vec<GrepMatch>, usize), Box<dyn std::error::Error>> {
        let mut all_matches = Vec::new();
        let mut total_count = 0;

        for entry in WalkDir::new(&self.file_path) {
            let entry = entry?;
            if entry.file_type().is_file() {
                let file_path = entry.path().to_string_lossy();
                
                // Simple glob matching (for more complex patterns, use a glob crate)
                if self.file_pattern == "*" || file_path.ends_with(&self.file_pattern.replace("*", "")) {
                    let (matches, count) = self.search_file(&file_path)?;
                    all_matches.extend(matches);
                    total_count += count;
                }
            }
        }

        Ok((all_matches, total_count))
    }

    fn is_binary_file(&self, file_path: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let bytes = fs::read(file_path)?;
        Ok(bytes.iter().any(|&b| b == 0))
    }
}

// Node factory function
pub fn create_grep_node(properties: HashMap<String, serde_json::Value>) -> Result<GrepNode, Box<dyn std::error::Error>> {
    GrepNode::new(properties)
}
```

## Usage Examples

### Basic File Search
```json
{
  "type": "grep",
  "properties": {
    "pattern": "ERROR",
    "input_source": "file", 
    "file_path": "/var/log/app.log",
    "case_insensitive": true,
    "line_numbers": true
  }
}
```

### Text Input Search with Context
```json
{
  "type": "grep", 
  "properties": {
    "pattern": "function.*main",
    "input_source": "input",
    "case_insensitive": false,
    "context_before": 2,
    "context_after": 3,
    "line_numbers": true
  },
  "inputs": {
    "text_input": "source code here..."
  }
}
```

### Recursive Directory Search
```json
{
  "type": "grep",
  "properties": {
    "pattern": "TODO|FIXME",
    "input_source": "file",
    "file_path": "./src",
    "recursive": true,
    "file_pattern": "*.rs",
    "line_numbers": true,
    "max_count": 50
  }
}
```

### Word Boundary Search with Invert
```json
{
  "type": "grep",
  "properties": {
    "pattern": "test",
    "input_source": "file",
    "file_path": "README.md", 
    "whole_words": true,
    "invert_match": true,
    "count_only": true
  }
}
```

## Benefits of Generic Nodes

1. **Platform Independence**: Same node definition works across Python, Rust, JavaScript, etc.
2. **Consistent Interface**: All implementations expose the same inputs/outputs
3. **Feature Parity**: Linux grep flags mapped to boolean options
4. **Easy Testing**: Can compare outputs between implementations
5. **Performance Choice**: Use Python for rapid development, Rust for performance
6. **Extensibility**: Add new execution engines without changing node definitions

## Node Registry

You could maintain a registry mapping node types to available implementations:

```json
{
  "grep": {
    "python": "executors.python.nodes.grep_node.create_grep_node",
    "rust": "executors::rust::nodes::grep_node::create_grep_node", 
    "javascript": "executors.javascript.nodes.grepNode.create"
  },
  "transform": {
    "python": "executors.python.nodes.transform_node.create_transform_node",
    "rust": "executors::rust::nodes::transform_node::create_transform_node"
  }
}
```

This approach lets users choose their preferred execution engine while maintaining the same visual programming interface!