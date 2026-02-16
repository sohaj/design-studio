import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import './App.css'
import './components/ControlsPanel.css'
import UploadPanel from './components/UploadPanel'
import PreviewScene from './components/PreviewScene'

import Header from './components/Header'
import ExportModal from './components/ExportModal'
import Timeline from './components/Timeline'

const ANIMATION_PRESETS = [
  { id: 'showcase', name: 'Showcase' },
  { id: 'orbit', name: 'Orbit' },
  { id: 'flip', name: 'Flip' },
  { id: 'scroll', name: 'Scroll' },
  { id: 'sideBySide', name: 'Side by Side' },
  { id: 'single', name: 'Single' },
  { id: 'slideLeft', name: 'Slide Left' },
  { id: 'slideRight', name: 'Slide Right' },
  { id: 'slideDown', name: 'Slide Down' },
  { id: 'slideUp', name: 'Slide Up' },
  { id: 'slideRightRotate', name: 'Right + Rotate' },
  { id: 'slideLeftRotate', name: 'Left + Rotate' },
]

const ANIM_ICONS = {
  showcase: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="16" y="8" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 24c0-8 14-14 28-6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4"/>
      <path d="M24 38v4M20 42h8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
      <path d="M13 18l3 2-3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <path d="M35 26l-3 2 3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  ),
  orbit: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="18" y="12" width="12" height="22" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <ellipse cx="24" cy="23" rx="18" ry="8" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.35"/>
      <circle cx="42" cy="23" r="2" fill="currentColor" opacity="0.5"/>
      <path d="M40 20l2 3 2-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  flip: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="10" y="12" width="12" height="22" rx="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeDasharray="2 2"/>
      <rect x="26" y="10" width="12" height="24" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 10l10-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
      <path d="M16 36l10 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
      <path d="M22 20l4-2v8l-4-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  scroll: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="16" y="6" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="20" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
      <line x1="20" y1="18" x2="26" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
      <line x1="20" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
      <path d="M24 36v8M21 41l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  sideBySide: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="6" y="12" width="14" height="24" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="28" y="12" width="14" height="24" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M22 24h4" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" opacity="0.3"/>
    </svg>
  ),
  single: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="14" y="8" width="20" height="32" rx="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.25"/>
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
      <circle cx="24" cy="24" r="1" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  slideLeft: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="6" y="10" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeDasharray="2 2"/>
      <rect x="22" y="10" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M40 24h-8M34 20l-4 4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  slideRight: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="26" y="10" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeDasharray="2 2"/>
      <rect x="10" y="10" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 24h8M14 20l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  slideDown: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="16" y="2" width="16" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeDasharray="2 2"/>
      <rect x="16" y="16" width="16" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M24 44v-6M20 40l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  slideUp: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="16" y="20" width="16" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.25" strokeDasharray="2 2"/>
      <rect x="16" y="6" width="16" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M24 4v6M20 8l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  slideRightRotate: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="10" y="10" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" transform="rotate(-15 18 24)"/>
      <path d="M8 24h8M14 20l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <path d="M34 14a8 8 0 0 1 0 16" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.35"/>
      <path d="M34 30l-2-3h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  ),
  slideLeftRotate: (
    <svg viewBox="0 0 48 48" fill="none" className="anim-icon">
      <rect x="22" y="10" width="16" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" transform="rotate(15 30 24)"/>
      <path d="M40 24h-8M34 20l-4 4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <path d="M14 14a8 8 0 0 0 0 16" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.35"/>
      <path d="M14 30l2-3h-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    </svg>
  ),
}

const DEVICE_TYPES = ['iphone', 'android', 'both']

function recalcStartTimes(clips) {
  let time = 0
  return clips.map((clip) => {
    const updated = { ...clip, startTime: time }
    time += clip.duration
    return updated
  })
}

function getVideoDuration(url) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve(video.duration && isFinite(video.duration) ? video.duration : 5)
    }
    video.onerror = () => resolve(5)
    video.src = url
  })
}

function App() {
  const [screens, setScreens] = useState([])
  const [deviceType, setDeviceType] = useState('iphone')
  const [animation, setAnimation] = useState('showcase')
  const [bgColor, setBgColor] = useState('#161717')
  const [bgGradient, setBgGradient] = useState(false)
  const [showBase, setShowBase] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [quality, setQuality] = useState('1080p')
  const [sidebarTab, setSidebarTab] = useState('media')
  const canvasRef = useRef(null)
  const recorderRef = useRef(null)

  // ── Timeline state ───────────────────────────────
  const [timelineClips, setTimelineClips] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [zoomEffects, setZoomEffects] = useState([])

  // ── Derived values ───────────────────────────────
  const totalDuration = useMemo(
    () => timelineClips.reduce((sum, c) => sum + c.duration, 0),
    [timelineClips]
  )

  const activeClip = useMemo(() => {
    if (timelineClips.length === 0) return null
    return (
      timelineClips.find(
        (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
      ) || timelineClips[timelineClips.length - 1]
    )
  }, [timelineClips, currentTime])

  const activeScreen = useMemo(() => {
    if (!activeClip) return screens[0] || null
    return screens.find((s) => s.id === activeClip.screenId) || null
  }, [activeClip, screens])

  const activeZoomLevel = useMemo(() => {
    for (const effect of zoomEffects) {
      if (currentTime >= effect.startTime && currentTime <= effect.endTime) {
        return effect.zoomLevel
      }
    }
    return 1
  }, [zoomEffects, currentTime])

  const activeAnimation = useMemo(() => {
    if (activeClip && activeClip.animation) return activeClip.animation
    return animation
  }, [activeClip, animation])

  const videoSeekTime = useMemo(() => {
    if (!activeClip || !activeScreen?.isVideo) return 0
    return currentTime - activeClip.startTime + activeClip.trimStart
  }, [activeClip, activeScreen, currentTime])

  // ── Space key handler for play/pause ─────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && screens.length > 0) {
        e.preventDefault()
        setIsTimelinePlaying((prev) => {
          if (!prev && currentTime >= totalDuration) {
            setCurrentTime(0)
          }
          return !prev
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screens.length, currentTime, totalDuration])

  // ── Timeline playback loop ───────────────────────
  const rafRef = useRef(null)
  const lastFrameRef = useRef(null)

  useEffect(() => {
    if (!isTimelinePlaying || totalDuration === 0) {
      lastFrameRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const animate = (timestamp) => {
      if (lastFrameRef.current !== null) {
        const delta = (timestamp - lastFrameRef.current) / 1000
        setCurrentTime((prev) => {
          const next = prev + delta
          if (next >= totalDuration) {
            setIsTimelinePlaying(false)
            return totalDuration
          }
          return next
        })
      }
      lastFrameRef.current = timestamp
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastFrameRef.current = null
    }
  }, [isTimelinePlaying, totalDuration])

  // ── Upload handler (creates clips immediately, updates video durations async) ─
  const handleUpload = useCallback((files) => {
    const VIDEO_EXTENSIONS = ['.mov', '.mp4', '.webm', '.avi', '.mkv', '.m4v']
    const newScreens = Array.from(files).map((file) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      const isVideo = file.type.startsWith('video/') || VIDEO_EXTENSIONS.includes(ext)
      return {
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        isVideo,
      }
    })

    const newClips = newScreens.map((screen) => ({
      id: crypto.randomUUID(),
      screenId: screen.id,
      startTime: 0,
      duration: 3,
      trimStart: 0,
      trimEnd: 3,
      effects: [],
      animation: 'showcase',
    }))

    setScreens((prev) => [...prev, ...newScreens])
    setTimelineClips((prev) => recalcStartTimes([...prev, ...newClips]))

    // For videos, update duration asynchronously once metadata loads
    newScreens.forEach((screen, i) => {
      if (screen.isVideo) {
        getVideoDuration(screen.url).then((dur) => {
          const clipId = newClips[i].id
          setTimelineClips((prev) =>
            recalcStartTimes(
              prev.map((c) =>
                c.id === clipId ? { ...c, duration: dur, trimEnd: dur } : c
              )
            )
          )
        })
      }
    })
  }, [])

  const handleRemoveScreen = useCallback((id) => {
    setScreens((prev) => {
      const screen = prev.find((s) => s.id === id)
      if (screen) URL.revokeObjectURL(screen.url)
      return prev.filter((s) => s.id !== id)
    })
    setTimelineClips((prev) => recalcStartTimes(prev.filter((c) => c.screenId !== id)))
    setSelectedClipId(null)
  }, [])

  const handleReorderScreens = useCallback((fromIndex, toIndex) => {
    setScreens((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }, [])

  // ── Timeline operations ──────────────────────────
  const handleUpdateClip = useCallback((clipId, updates) => {
    setTimelineClips((prev) => {
      const updated = prev.map((c) => (c.id === clipId ? { ...c, ...updates } : c))
      return recalcStartTimes(updated)
    })
  }, [])

  const handleReorderClips = useCallback((fromIndex, toIndex) => {
    setTimelineClips((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return recalcStartTimes(updated)
    })
  }, [])

  const handleSplitClip = useCallback((clipId, splitTime) => {
    setTimelineClips((prev) => {
      const idx = prev.findIndex((c) => c.id === clipId)
      if (idx === -1) return prev
      const clip = prev[idx]
      const offsetInClip = splitTime - clip.startTime
      if (offsetInClip <= 0.1 || offsetInClip >= clip.duration - 0.1) return prev

      const clip1 = {
        ...clip,
        id: crypto.randomUUID(),
        duration: offsetInClip,
        trimEnd: clip.trimStart + offsetInClip,
        effects: [],
      }

      const clip2 = {
        ...clip,
        id: crypto.randomUUID(),
        duration: clip.duration - offsetInClip,
        trimStart: clip.trimStart + offsetInClip,
        effects: [],
      }

      const updated = [...prev]
      updated.splice(idx, 1, clip1, clip2)
      return recalcStartTimes(updated)
    })
  }, [])

  const handleAddZoomEffect = useCallback(() => {
    setZoomEffects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        startTime: Math.max(0, currentTime),
        endTime: Math.min(totalDuration, currentTime + 1),
        zoomLevel: 2,
      },
    ])
  }, [currentTime, totalDuration])

  const handleUpdateZoomEffect = useCallback((effectId, updates) => {
    setZoomEffects((prev) =>
      prev.map((e) => (e.id === effectId ? { ...e, ...updates } : e))
    )
  }, [])

  const handleRemoveZoomEffect = useCallback((effectId) => {
    setZoomEffects((prev) => prev.filter((e) => e.id !== effectId))
  }, [])

  const handleRemoveClip = useCallback((clipId) => {
    setTimelineClips((prev) => recalcStartTimes(prev.filter((c) => c.id !== clipId)))
    setSelectedClipId((prev) => (prev === clipId ? null : prev))
  }, [])

  // ── Export / recording ───────────────────────────
  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return
    setShowExport(true)
  }, [])

  const [convertingToMp4, setConvertingToMp4] = useState(false)

  const convertWebmToMp4 = useCallback(async (webmBlob) => {
    setConvertingToMp4(true)
    try {
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      })

      const webmData = await fetchFile(webmBlob)
      await ffmpeg.writeFile('input.webm', webmData)
      await ffmpeg.exec([
        '-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast',
        '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'output.mp4',
      ])
      const mp4Data = await ffmpeg.readFile('output.mp4')
      const mp4Blob = new Blob([mp4Data.buffer], { type: 'video/mp4' })

      const url = URL.createObjectURL(mp4Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mockup-demo-${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(url)
      ffmpeg.terminate()
    } catch (err) {
      console.error('MP4 conversion failed, falling back to WebM:', err)
      const url = URL.createObjectURL(webmBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mockup-demo-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setConvertingToMp4(false)
    }
  }, [])

  const startRecording = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('Canvas element not available for recording')
      return
    }

    const recordDuration = totalDuration > 0 ? totalDuration : 6
    if (totalDuration > 0) {
      setCurrentTime(0)
      setIsTimelinePlaying(true)
    }

    const stream = canvas.captureStream(60)
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: quality === '4k' ? 20000000 : quality === '1080p' ? 8000000 : 4000000,
    })

    const chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      const webmBlob = new Blob(chunks, { type: 'video/webm' })
      setIsRecording(false)

      const webmUrl = URL.createObjectURL(webmBlob)
      const a = document.createElement('a')
      a.href = webmUrl
      a.download = `mockup-demo-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(webmUrl)

      setIsPlaying(false)
      setIsTimelinePlaying(false)
    }

    recorderRef.current = mediaRecorder
    setIsRecording(true)
    setIsPlaying(true)
    mediaRecorder.start()

    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
    }, recordDuration * 1000)
  }, [quality, convertWebmToMp4, totalDuration])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
    }
  }, [])

  const hasScreens = screens.length > 0

  return (
    <div className="app">
      <Header>
        {hasScreens && !convertingToMp4 && (
          <>
            <button
              className="btn btn-header btn-secondary"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸ Pause' : '▶ Preview'}
            </button>
            <button
              className={`btn btn-header btn-primary ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!hasScreens}
            >
              {isRecording ? '⏹ Stop Recording' : '⏺ Record & Export'}
            </button>
          </>
        )}
        {hasScreens && convertingToMp4 && (
          <div className="btn btn-header btn-converting">
            Converting to MP4...
          </div>
        )}
      </Header>
      <main className="main-layout">
        {!hasScreens ? (
          <UploadPanel onUpload={handleUpload} fullPage />
        ) : (
          <>
            <aside className="sidebar">
              <nav className="sidebar-tabs">
                {[
                  { id: 'media', icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )},
                  { id: 'device', icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12" y2="18" />
                    </svg>
                  )},
                  { id: 'animations', icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )},
                  { id: 'background', icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  )},
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`sidebar-tab ${sidebarTab === tab.id ? 'active' : ''}`}
                    onClick={() => setSidebarTab(tab.id)}
                    title={tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
                  >
                    {tab.icon}
                    <span className="sidebar-tab-label">{tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}</span>
                  </button>
                ))}
              </nav>
              <div className="sidebar-content">
                {sidebarTab === 'media' && (
                  <>
                    <UploadPanel onUpload={handleUpload} compact />
                    <div className="screen-list">
                      <h3 className="section-title">Screens ({screens.length})</h3>
                      {screens.map((screen, index) => (
                        <div key={screen.id} className="screen-thumb">
                          {screen.isVideo ? (
                            <video src={screen.url} muted className="screen-thumb-video" />
                          ) : (
                            <img src={screen.url} alt={screen.name} />
                          )}
                          <div className="screen-thumb-info">
                            <span className="screen-thumb-name">{screen.name}</span>
                            <span className="screen-thumb-index">
                              {screen.isVideo ? 'Video' : `Screen ${index + 1}`}
                            </span>
                          </div>
                          <button
                            className="screen-thumb-remove"
                            onClick={() => handleRemoveScreen(screen.id)}
                            aria-label="Remove screen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {sidebarTab === 'device' && (
                  <div className="controls-panel">
                    <div className="control-group">
                      <h3 className="section-title">Device Type</h3>
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
                    <div className="control-group">
                      <h3 className="section-title">Export</h3>
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
                )}

                {sidebarTab === 'animations' && (() => {
                  const selClip = timelineClips.find((c) => c.id === selectedClipId)
                  const currentAnim = selClip ? selClip.animation : animation
                  return (
                    <div className="controls-panel">
                      <div className="control-group">
                        <h3 className="section-title">
                          {selClip ? `Animation — ${screens.find((s) => s.id === selClip.screenId)?.name || 'Clip'}` : 'Default Animation'}
                        </h3>
                        {!selClip && timelineClips.length > 0 && (
                          <p className="anim-hint">Select a clip in the timeline to set its animation</p>
                        )}
                        <div className="animation-grid">
                          {ANIMATION_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              className={`animation-tile ${currentAnim === preset.id ? 'active' : ''}`}
                              onClick={() => {
                                if (selClip) {
                                  handleUpdateClip(selClip.id, { animation: preset.id })
                                } else {
                                  setAnimation(preset.id)
                                }
                              }}
                            >
                              <div className="animation-tile-icon">
                                {ANIM_ICONS[preset.id]}
                              </div>
                              <span className="animation-tile-name">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {sidebarTab === 'background' && (
                  <div className="controls-panel">
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
                  </div>
                )}
              </div>
            </aside>
            <section className="preview-area">
              <PreviewScene
                screens={screens}
                activeScreen={activeScreen}
                zoomLevel={activeZoomLevel}
                videoSeekTime={videoSeekTime}
                timelinePlaying={isTimelinePlaying}
                deviceType={deviceType}
                animation={activeAnimation}
                bgColor={bgColor}
                bgGradient={bgGradient}
                showBase={showBase}
                isPlaying={isPlaying}
                canvasRef={canvasRef}
              />
              {timelineClips.length > 0 && (
                <Timeline
                  clips={timelineClips}
                  screens={screens}
                  currentTime={currentTime}
                  setCurrentTime={setCurrentTime}
                  selectedClipId={selectedClipId}
                  setSelectedClipId={setSelectedClipId}
                  isPlaying={isTimelinePlaying}
                  setIsPlaying={setIsTimelinePlaying}
                  totalDuration={totalDuration}
                  onUpdateClip={handleUpdateClip}
                  onReorderClips={handleReorderClips}
                  onSplitClip={handleSplitClip}
                  onRemoveClip={handleRemoveClip}
                  zoomEffects={zoomEffects}
                  onAddZoomEffect={handleAddZoomEffect}
                  onUpdateZoomEffect={handleUpdateZoomEffect}
                  onRemoveZoomEffect={handleRemoveZoomEffect}
                  onUpload={handleUpload}
                />
              )}
            </section>
          </>
        )}
      </main>

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          onRecord={startRecording}
          quality={quality}
          setQuality={setQuality}
        />
      )}
    </div>
  )
}

export default App
