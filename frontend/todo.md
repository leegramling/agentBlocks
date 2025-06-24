# AgentBlocks TODO

## Critical Issues (Blocking)
- [ ] add console output for the function that creates code for the show code and execute do not work, they should be refactored based on our new structure without the panel.
- [ ] Test basic functionality - app should load and show main function **[Ready for Review]**

## High Priority
- [ ] make every node in a function have the same color vertical bar on the left.
- [ ] add a textbox in the right panel under properties, which is code preview so we can scroll the code have a toggle for python or rust.
- [ ] add a command field to the left of the Run button and when we type / or ctrl F use it to type the search name, currently if you type a letter that is a hotkey it will do the hotkey like Pri the I will open the insert.
- [ ] use up arrow or k key to select the node above current and down arrow or j to select the node below current node.
- [ ] use / or ctrl f to find a node in the canvas and select it, use n or whatever vscode uses to find next to find the next node 
- [ ] use h or left arrow to move to previous function and l and right arrow to move to the next function, so if we have main function and add2 function we can move between them.
- [ ] add text under the grid in the same font and color as the "Drag nodes to connect" which shows the key mapping able in vim and vscode modes. use f1 to hide and show.
- [X] there should be a selected/active node and an active function like main, have the active function with a yellow rectangle around it

- [X] when I press i key, have a popup with a input field that when I type will auto complete to a node name and when I press enter will be inserted after the active node.
- [ ] for debugging when new nodes are added to the main function print to the console the json structure for the main and its children.
- [X] when F2 is pressed and the left panel is show the focus should be in the search input so the user can type the node name.
- [X] remove treeview
- [X] First node should be named main
- [ ] If you drop a second function it because a new function node chain
- [ ] If you drop a function in a node like main, then it will be an instance if named after existing function
- [X] Hide the left panel unless F2 is pressed then show until the node is added then hide again.
- [X] Dropping nodes must connect to last node in function
- [ ] Verify function-based workflow works in browser
- [ ] Test node creation and function switching
- [ ] Update NodeComponent to show active function styling
- [ ] Update PropertiesPanel interface to work without panel props

## Medium Priority
- [ ] Add visual indicators for function hierarchy (indentation, borders, etc.)
- [ ] Improve function node styling to show active state clearly
- [ ] Add function creation workflow (currently only has main function)
- [ ] Update keyboard shortcuts to work with function system
- [ ] Clean up unused imports and variables in WorkflowEditor

## Low Priority
- [ ] Update code generators to understand function hierarchy
- [ ] Add function export/import functionality
- [ ] Improve function node positioning algorithm
- [ ] Add function renaming capability
- [ ] Update documentation to reflect function-based system

## Completed ✅
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