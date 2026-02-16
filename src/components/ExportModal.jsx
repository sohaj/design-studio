import './ExportModal.css'

export default function ExportModal({ onClose, onRecord, quality, setQuality }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Video</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>Quality</label>
            <div className="control-chips">
              {['720p', '1080p', '4k'].map((q) => (
                <button
                  key={q}
                  className={`chip ${quality === q ? 'active' : ''}`}
                  onClick={() => setQuality(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-info">
            <p>The video duration will match your timeline length. It will be recorded in real-time from the 3D preview and exported as WebM.</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onRecord(); onClose(); }}>
            Start Recording
          </button>
        </div>
      </div>
    </div>
  )
}
