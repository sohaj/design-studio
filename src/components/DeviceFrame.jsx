import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const IPHONE_ASPECT = 19.5 / 9
const ANDROID_ASPECT = 19.5 / 9

const DEVICE_CONFIGS = {
  iphone: {
    width: 2.4,
    height: 2.4 * IPHONE_ASPECT,
    depth: 0.2,
    cornerRadius: 0.42,
    screenInset: 0.045,
    bezelColor: '#0a0a0a',
    frameColor: '#8a8078',
    sideColor: '#9a9088',
    dynamicIsland: true,
  },
  android: {
    width: 2.3,
    height: 2.3 * ANDROID_ASPECT,
    depth: 0.18,
    cornerRadius: 0.30,
    screenInset: 0.05,
    bezelColor: '#0a0a0a',
    frameColor: '#2a2a2a',
    sideColor: '#444444',
    punchHole: true,
  },
}

function createRoundedRectShape(w, h, r) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}

/**
 * Loads texture from a File object using createImageBitmap (bypasses all URL/CORS issues).
 * For videos, uses blob URL with HTMLVideoElement.
 * Returns refs that are updated imperatively — no React state involved.
 */
function useScreenTextureRef(screenFile, screenUrl, isVideo, screenAspect) {
  const textureRef = useRef(null)
  const loadedRef = useRef(false)
  const videoRef = useRef(null)

  useEffect(() => {
    loadedRef.current = false
    textureRef.current = null

    if (!screenFile && !screenUrl) return

    if (isVideo && screenUrl) {
      const video = document.createElement('video')
      video.src = screenUrl
      video.loop = false
      video.muted = true
      video.playsInline = true
      video.autoplay = false
      video.preload = 'auto'
      videoRef.current = video

      video.addEventListener('loadeddata', () => {
        const tex = new THREE.VideoTexture(video)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.generateMipmaps = false
        textureRef.current = tex
        loadedRef.current = true
      })
      video.load()
    } else if (screenFile) {
      // File → createImageBitmap → "cover" fit onto screen-sized canvas → CanvasTexture
      createImageBitmap(screenFile)
        .then((bitmap) => {
          // Target canvas matches screen aspect ratio
          const targetW = 1080
          const targetH = Math.round(targetW / screenAspect)
          const canvas = document.createElement('canvas')
          canvas.width = targetW
          canvas.height = targetH
          const ctx = canvas.getContext('2d')

          // "Cover" fit: scale image to fill canvas, crop the excess
          const imgAspect = bitmap.width / bitmap.height
          const canvasAspect = targetW / targetH
          let sx, sy, sw, sh
          if (imgAspect > canvasAspect) {
            // Image is wider than screen — crop sides
            sh = bitmap.height
            sw = bitmap.height * canvasAspect
            sx = (bitmap.width - sw) / 2
            sy = 0
          } else {
            // Image is taller than screen — crop top/bottom
            sw = bitmap.width
            sh = bitmap.width / canvasAspect
            sx = 0
            sy = (bitmap.height - sh) / 2
          }
          ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetW, targetH)
          bitmap.close()

          const tex = new THREE.CanvasTexture(canvas)
          tex.colorSpace = THREE.SRGBColorSpace
          tex.minFilter = THREE.LinearFilter
          tex.magFilter = THREE.LinearFilter
          tex.generateMipmaps = false
          tex.needsUpdate = true
          textureRef.current = tex
          loadedRef.current = true
        })
        .catch((err) => {
          console.error('[DeviceFrame] createImageBitmap failed:', err)
        })
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
        videoRef.current = null
      }
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
      loadedRef.current = false
    }
  }, [screenFile, screenUrl, isVideo])

  return { textureRef, loadedRef, videoRef }
}

export default function DeviceFrame({
  type = 'iphone',
  screenUrl,
  screenFile,
  isVideo = false,
  videoSeekTime = 0,
  timelinePlaying = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const config = DEVICE_CONFIGS[type]
  const screenW = config.width - config.screenInset * 2
  const screenH = config.height - config.screenInset * 2

  // Refs for imperative texture application
  const screenMeshRef = useRef()
  const lastSeekRef = useRef(-1)
  const screenAspect = screenW / screenH
  const { textureRef, loadedRef, videoRef } = useScreenTextureRef(screenFile, screenUrl, isVideo, screenAspect)

  // Rounded body geometry
  const bodyGeo = useMemo(() => {
    const shape = createRoundedRectShape(config.width, config.height, config.cornerRadius)
    return new THREE.ExtrudeGeometry(shape, {
      depth: config.depth,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    })
  }, [config])

  // Rounded screen geometry with normalized UVs so texture fills the screen
  const screenGeo = useMemo(() => {
    const innerRadius = Math.max(0.08, config.cornerRadius - config.screenInset - 0.01)
    const shape = createRoundedRectShape(screenW, screenH, innerRadius)
    const geo = new THREE.ShapeGeometry(shape)

    // Normalize UVs to 0-1 range so the texture stretches to fill the screen
    const uvAttr = geo.attributes.uv
    const positions = geo.attributes.position
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setXY(
        i,
        (positions.getX(i) - minX) / rangeX,
        (positions.getY(i) - minY) / rangeY
      )
    }
    uvAttr.needsUpdate = true
    return geo
  }, [screenW, screenH, config])

  // Imperatively apply texture every frame — bypasses React reconciler entirely
  useFrame(() => {
    if (!screenMeshRef.current) return
    const mat = screenMeshRef.current.material

    if (loadedRef.current && textureRef.current) {
      if (mat.map !== textureRef.current) {
        mat.map = textureRef.current
        mat.color.set('#ffffff')
        mat.needsUpdate = true
      }
      // Keep video textures updated
      if (isVideo && textureRef.current.isVideoTexture) {
        textureRef.current.needsUpdate = true
      }
    }

    // Sync video playback with timeline playhead
    const video = videoRef.current
    if (video && isVideo && loadedRef.current) {
      if (timelinePlaying) {
        if (video.paused) {
          video.currentTime = videoSeekTime || 0
          video.play().catch(() => {})
          lastSeekRef.current = -1
        }
      } else {
        if (!video.paused) video.pause()
        const seekTo = videoSeekTime || 0
        if (Math.abs(lastSeekRef.current - seekTo) > 0.03) {
          video.currentTime = seekTo
          lastSeekRef.current = seekTo
        }
      }
    }
  })

  // Body front face is at z = depth/2 in group space
  // Tiny offset prevents z-fighting with the body
  const frontZ = config.depth / 2 + 0.023

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Rounded phone body */}
      <mesh geometry={bodyGeo} position={[0, 0, -config.depth / 2]}>
        <meshPhysicalMaterial
          color={config.frameColor}
          metalness={0.85}
          roughness={0.15}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Screen bezel (thin dark border behind screen) */}
      <mesh position={[0, 0, frontZ - 0.002]}>
        <shapeGeometry args={[createRoundedRectShape(screenW + 0.02, screenH + 0.02, Math.max(0.08, config.cornerRadius - config.screenInset + 0.005))]} />
        <meshStandardMaterial color={config.bezelColor} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Screen - texture applied imperatively via useFrame */}
      <mesh ref={screenMeshRef} geometry={screenGeo} position={[0, 0, frontZ]}>
        <meshBasicMaterial color="#111122" toneMapped={false} />
      </mesh>

      {/* Dynamic Island (iPhone) - positioned near the top of the screen */}
      {type === 'iphone' && config.dynamicIsland && (
        <mesh position={[0, screenH / 2 - 0.18, frontZ + 0.001]}>
          <shapeGeometry args={[createRoundedRectShape(0.5, 0.14, 0.07)]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      )}

      {/* Punch hole camera (Android) */}
      {type === 'android' && config.punchHole && (
        <mesh position={[0, screenH / 2 - 0.15, frontZ + 0.001]}>
          <circleGeometry args={[0.05, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      )}

      {/* Side buttons (iPhone) */}
      {type === 'iphone' && (
        <>
          {/* Power button - right side */}
          <mesh position={[config.width / 2 + 0.03, 0.8, 0]}>
            <boxGeometry args={[0.04, 0.45, 0.06]} />
            <meshPhysicalMaterial color={config.sideColor} metalness={0.92} roughness={0.1} />
          </mesh>
          {/* Volume up - left side */}
          <mesh position={[-config.width / 2 - 0.03, 1.0, 0]}>
            <boxGeometry args={[0.04, 0.3, 0.06]} />
            <meshPhysicalMaterial color={config.sideColor} metalness={0.92} roughness={0.1} />
          </mesh>
          {/* Volume down - left side */}
          <mesh position={[-config.width / 2 - 0.03, 0.45, 0]}>
            <boxGeometry args={[0.04, 0.3, 0.06]} />
            <meshPhysicalMaterial color={config.sideColor} metalness={0.92} roughness={0.1} />
          </mesh>
        </>
      )}
    </group>
  )
}
