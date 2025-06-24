# AgentBlocks TODO

## Critical Issues (Blocking)
*All critical issues have been resolved*

## High Priority  
- [ ] Add input field to left of Run button for search, and have / or ctrl F go to that field to show search name.

## Medium Priority
- [ ] move the key mapping to right side and make the text lighter and under any nodes.
- [ ] lets have a example nodes for debugging with a main function, with a list of fruits and a for each to print them.


## Low Priority
- [ ] Update code generators to understand function hierarchy
- [ ] Add function export/import functionality
- [ ] Improve function node positioning algorithm
- [ ] Add function renaming capability
- [ ] Update documentation to reflect function-based system

## Completed ✅
- [x] Add console output for code generation functions and ensure Show Code/Execute work
- [x] Add vertical color bar to all nodes in same function
- [x] Add code preview textbox in right panel with Python/Rust toggle (made taller to fill panel)
- [x] Add key mapping help text toggle with F1 (vim/vscode style)
- [x] Add function navigation with h/l or left/right arrow keys
- [x] Add debugging output for main function JSON structure when nodes are added
- [x] Implement function instance behavior when dropping function in existing function
- [x] Implement function node chain behavior for dropped functions
- [x] Implement search/find functionality for nodes on canvas (/ or Ctrl+F, n for next)
- [x] Add keyboard navigation for node selection (↑/k, ↓/j)
- [x] Fix 'i' key insert popup to properly select highlighted node on Enter
- [x] Add yellow rectangle around active function
- [x] Implement 'i' key popup for node insertion with autocomplete
- [x] Auto-focus search input when F2 is pressed and left panel shows
- [x] Remove TreeView component from UI
- [x] Ensure first node is named 'main' instead of function
- [x] Hide left panel by default, show on F2, hide after node added
- [x] Test basic functionality - app loads and shows main function
- [x] Implement node auto-connection to last node in function
- [x] Update NodeComponent to show active function styling

## Approved
- [x] Remove module panels and Add Module button from UI
- [x] Create default 'main' function node on workflow start
- [x] Implement function node active state management
- [x] Update node dropping to attach to active function
- [x] Update node positioning to be relative to active function
- [x] Implement function switching on click
- [x] Update save/load functions to work without panels
- [x] Remove PanelComponent and PanelModal imports
- [x] Fix "panels is not defined" error on line 576 in WorkflowEditor.tsx
- [x] Remove all remaining panel references causing compilation errors
- [x] Fix "panels is not defined" error on line 1164 in WorkflowEditor.tsx (minimap)
- [x] Fix remaining panels references in loadWorkflow and exportWorkflow functions
- [x] Fix "handleReorderNode is not defined" error on line 1020

## Notes
- Function-based system is implemented but needs debugging
- Main function should appear by default when app loads
- Nodes should attach to active function when dropped
- Clicking function nodes should switch active context