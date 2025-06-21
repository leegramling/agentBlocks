import React, { useState } from 'react';

interface PanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePanel: (name: string) => void;
}

const PanelModal: React.FC<PanelModalProps> = ({ isOpen, onClose, onCreatePanel }) => {
  const [panelName, setPanelName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (panelName.trim()) {
      onCreatePanel(panelName.trim());
      setPanelName('');
      onClose();
    }
  };

  const handleClose = () => {
    setPanelName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="panel-modal-overlay">
      <div className="panel-modal">
        <div className="panel-modal-header">
          <h3>Create New Module Panel</h3>
          <button 
            className="panel-modal-close"
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="panel-modal-body">
            <div className="property-group">
              <label className="property-label" htmlFor="panel-name">
                Module Name
              </label>
              <input
                id="panel-name"
                type="text"
                className="property-input"
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                placeholder="Enter module name..."
                autoFocus
              />
            </div>
          </div>
          
          <div className="panel-modal-footer">
            <button 
              type="button" 
              className="panel-modal-button secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="panel-modal-button primary"
              disabled={!panelName.trim()}
            >
              Create Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PanelModal;