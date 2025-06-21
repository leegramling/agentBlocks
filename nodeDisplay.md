<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentBlocks Node Editor</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #111827;
            color: #ffffff;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        
        .editor-container {
            max-width: 800px;
            margin: 0 auto;
            background: #1f2937;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #374151;
        }
        
        .panel {
            margin-bottom: 8px;
            border-left: 3px solid transparent;
        }
        
        .panel-header {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: #374151;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .panel-header:hover {
            background: #4b5563;
        }
        
        .collapse-icon {
            margin-right: 8px;
            font-size: 12px;
            color: #9ca3af;
            transition: transform 0.2s;
        }
        
        .collapsed .collapse-icon {
            transform: rotate(-90deg);
        }
        
        .panel-title {
            font-weight: bold;
            color: #e5e7eb;
        }
        
        .panel-content {
            margin-top: 4px;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .collapsed .panel-content {
            max-height: 0;
        }
        
        .node {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            margin: 2px 0;
            border-radius: 6px;
            border-left: 4px solid;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .node:hover {
            transform: translateX(2px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .node.selected {
            background: #374151;
            box-shadow: 0 0 0 2px #3b82f6;
        }
        
        .node-icon {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
            font-weight: bold;
        }
        
        .node-content {
            flex: 1;
        }
        
        .node-title {
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .node-details {
            font-size: 12px;
            color: #9ca3af;
        }
        
        .indent-1 { margin-left: 24px; }
        .indent-2 { margin-left: 48px; }
        .indent-3 { margin-left: 72px; }
        
        /* Node type colors */
        .loop { border-left-color: #ec4899; background: rgba(236, 72, 153, 0.1); }
        .loop .node-icon { background: #ec4899; }
        
        .variable { border-left-color: #f97316; background: rgba(249, 115, 22, 0.1); }
        .variable .node-icon { background: #f97316; }
        
        .function { border-left-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .function .node-icon { background: #3b82f6; }
        
        .bash { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .bash .node-icon { background: #ef4444; }
        
        .conditional { border-left-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
        .conditional .node-icon { background: #22c55e; }
        
        .assignment { border-left-color: #eab308; background: rgba(234, 179, 8, 0.1); }
        .assignment .node-icon { background: #eab308; }
        
        .line-numbers {
            position: absolute;
            left: 0;
            width: 40px;
            color: #6b7280;
            font-size: 12px;
            text-align: right;
            padding-right: 8px;
            border-right: 1px solid #374151;
            user-select: none;
        }
        
        .editor-content {
            position: relative;
            padding-left: 50px;
        }
        
        .workflow-title {
            color: #e5e7eb;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #374151;
        }
    </style>
</head>
<body>
    <div class="editor-container">
        <div class="workflow-title">📁 Batch Rename Images (image.1.png → image.001.png)</div>
        
        <div class="editor-content">
            <div class="line-numbers">
                <div style="height: 54px; line-height: 54px;">1</div>
                <div style="height: 54px; line-height: 54px;">2</div>
                <div style="height: 54px; line-height: 54px;">3</div>
                <div style="height: 54px; line-height: 54px;">4</div>
                <div style="height: 54px; line-height: 54px;">5</div>
                <div style="height: 54px; line-height: 54px;">6</div>
                <div style="height: 54px; line-height: 54px;">7</div>
                <div style="height: 54px; line-height: 54px;">8</div>
            </div>
            
            <!-- Setup Section -->
            <div class="panel">
                <div class="panel-header" onclick="togglePanel('setup')">
                    <span class="collapse-icon">▼</span>
                    <span class="panel-title">🔧 Setup Variables</span>
                </div>
                <div class="panel-content" id="setup">
                    <div class="node variable">
                        <div class="node-icon">V</div>
                        <div class="node-content">
                            <div class="node-title">base_path</div>
                            <div class="node-details">"/Users/lee/images/"</div>
                        </div>
                    </div>
                    <div class="node variable">
                        <div class="node-icon">V</div>
                        <div class="node-content">
                            <div class="node-title">file_extension</div>
                            <div class="node-details">".png"</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Loop Section -->
            <div class="panel">
                <div class="panel-header" onclick="togglePanel('main')">
                    <span class="collapse-icon">▼</span>
                    <span class="panel-title">🔄 Rename Loop (1-10)</span>
                </div>
                <div class="panel-content" id="main">
                    <div class="node loop">
                        <div class="node-icon">↻</div>
                        <div class="node-content">
                            <div class="node-title">For Each</div>
                            <div class="node-details">counter from 1 to 10</div>
                        </div>
                    </div>
                    
                    <!-- Indented nodes inside the loop -->
                    <div class="indent-1">
                        <div class="node function">
                            <div class="node-icon">f</div>
                            <div class="node-content">
                                <div class="node-title">Format Number</div>
                                <div class="node-details">counter.toString().padStart(3, '0') → formatted_num</div>
                            </div>
                        </div>
                        
                        <div class="node assignment">
                            <div class="node-icon">=</div>
                            <div class="node-content">
                                <div class="node-title">Build Paths</div>
                                <div class="node-details">old_name = base_path + "image." + counter + file_extension</div>
                            </div>
                        </div>
                        
                        <div class="node assignment">
                            <div class="node-icon">=</div>
                            <div class="node-content">
                                <div class="node-title"></div>
                                <div class="node-details">new_name = base_path + "image." + formatted_num + file_extension</div>
                            </div>
                        </div>
                        
                        <div class="node conditional">
                            <div class="node-icon">?</div>
                            <div class="node-content">
                                <div class="node-title">Check File Exists</div>
                                <div class="node-details">if file_exists(old_name)</div>
                            </div>
                        </div>
                        
                        <!-- Indented inside the conditional -->
                        <div class="indent-2">
                            <div class="node bash">
                                <div class="node-icon">$</div>
                                <div class="node-content">
                                    <div class="node-title">Rename File</div>
                                    <div class="node-details">mv "{old_name}" "{new_name}"</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Output Section -->
            <div class="panel">
                <div class="panel-header" onclick="togglePanel('output')">
                    <span class="collapse-icon">▼</span>
                    <span class="panel-title">📤 Results</span>
                </div>
                <div class="panel-content" id="output">
                    <div class="node function">
                        <div class="node-icon">📋</div>
                        <div class="node-content">
                            <div class="node-title">Print Summary</div>
                            <div class="node-details">echo "Renamed {counter} files successfully"</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function togglePanel(panelId) {
            const panel = document.getElementById(panelId).parentElement;
            panel.classList.toggle('collapsed');
        }
        
        // Add click handlers for node selection
        document.querySelectorAll('.node').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
                node.classList.add('selected');
            });
        });
    </script>
</body>
</html>
