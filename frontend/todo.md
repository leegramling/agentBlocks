# AgentBlocks TODO

## Critical Issues (Blocking)
*All critical issues have been resolved*

## High Priority  
- [ ] Make the left propertiesPanel a fixed height 50% with vertical scroll bar.

## Medium Priority
- [ ] remove the TreeView component and all references.
- [ ] Lets keep track for variables, create a new Tab Local Variables in in the PropertiesPanel and add table of the variables in the function, these can be used as reference in other nodes. The First tab should say Properties.
- [ ] In the Edit menu add Copy, Paste, Cut, Duplicate (for nodes) 
- [ ] In the View Menu add Reset, Center (which centers the view on the selected node), Zoom In, Zoom Out
- [ ] Remove the Workflow and Tools menu 
- [ ] check the llm api, it seems like we are not connected even though it shows we are.
- [ ] write a doc bashNodes.md and explore using nodes to create bash scripts that can call linux commands like find, grep, nawk, sed, and check for files exists, and other useful command that could be used to create bashscripts.


## Low Priority
- [ ] Update code generators to understand function hierarchy
- [ ] Add function export/import functionality
- [ ] Improve function node positioning algorithm
- [ ] Add function renaming capability
- [ ] Update documentation to reflect function-based system

## Completed ✅
- [X] remove the Run, Pause, Stop buttons.
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
- [X] Add input field to left of Run button for search, and have / or ctrl F go to that field to show search name.
- [X] move the key mapping to right side and make the text lighter and under any nodes.
- [X] lets have a example nodes for debugging with a main function, with a list of fruits and a for each to print them.
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