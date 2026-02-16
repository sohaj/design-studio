import './ControlsPanel.css'

export default function ControlsPanel({
  deviceType,
  setDeviceType,
  animation,
  setAnimation,
  bgColor,
  setBgColor,
  bgGradient,
  setBgGradient,
  showBase,
  setShowBase,
  duration,
  setDuration,
  quality,
  setQuality,
  animationPresets,
}) {
  return (
    <div className="controls-panel">
      {/* Device Type */}
      <div className="control-group">
        <h3 className="section-title">Device</h3>
        <div className="control-chips">
          {[
            { id: 'iphone', label: 'iPhone' },
            { id: 'android', label: 'Android' },
            { id: 'both', label: 'Both' },
          ].map((d) => (
            <button
              key={d.id}
              className={`chip ${deviceType === d.id ? 'active' : ''}`}
              onClick={() => setDeviceType(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Preset */}
      <div className="control-group">
        <h3 className="section-title">Animation</h3>
        <div className="animation-list">
          {animationPresets.map((preset) => (
            <button
              key={preset.id}
              className={`animation-item ${animation === preset.id ? 'active' : ''}`}
              onClick={() => setAnimation(preset.id)}
            >
              <span className="animation-name">{preset.name}</span>
              <span className="animation-desc">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div className="control-group">
        <h3 className="section-title">Background</h3>
        <div className="control-row">
          <label className="control-label">Color</label>
          <div className="color-picker-wrap">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="color-input"
            />
            <span className="color-value">{bgColor}</span>
          </div>
        </div>
        <div className="control-row">
          <label className="control-label">Gradient overlay</label>
          <button
            className={`toggle ${bgGradient ? 'active' : ''}`}
            onClick={() => setBgGradient(!bgGradient)}
          >
            <div className="toggle-thumb" />
          </button>
        </div>
        <div className="control-row">
          <label className="control-label">Base shadow</label>
          <button
            className={`toggle ${showBase ? 'active' : ''}`}
            onClick={() => setShowBase(!showBase)}
          >
            <div className="toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Export Settings */}
      <div className="control-group">
        <h3 className="section-title">Export</h3>
        <div className="control-row">
          <label className="control-label">Duration</label>
          <div className="stepper">
            <button onClick={() => setDuration(Math.max(3, duration - 1))}>−</button>
            <span>{duration}s</span>
            <button onClick={() => setDuration(Math.min(30, duration + 1))}>+</button>
          </div>
        </div>
        <div className="control-row">
          <label className="control-label">Quality</label>
          <div className="control-chips">
            {['720p', '1080p', '4k'].map((q) => (
              <button
                key={q}
                className={`chip small ${quality === q ? 'active' : ''}`}
                onClick={() => setQuality(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
