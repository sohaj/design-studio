import { useRef, useEffect, useMemo, Suspense, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import DeviceFrame from './DeviceFrame'
import './PreviewScene.css'

// ── Easing functions ──────────────────────────────────────────
function easeOutCubic(t) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3) }
function easeOutQuart(t) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4) }
function easeInOutCubic(t) { t = Math.min(1, Math.max(0, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
function easeOutBack(t) { t = Math.min(1, Math.max(0, t)); const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }
function smoothSin(t, freq, amp) { return Math.sin(t * freq) * amp }

// ── Scene background ──────────────────────────────────────────
function SceneBackground({ bgColor, bgGradient }) {
  const { scene } = useThree()

  useEffect(() => {
    if (bgGradient) {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      const gradient = ctx.createRadialGradient(256, 200, 0, 256, 256, 420)
      const baseColor = new THREE.Color(bgColor)
      const lighterColor = baseColor.clone().lerp(new THREE.Color('#21C063'), 0.06)
      gradient.addColorStop(0, lighterColor.getStyle())
      gradient.addColorStop(0.4, bgColor)
      gradient.addColorStop(1, new THREE.Color(bgColor).lerp(new THREE.Color('#000000'), 0.4).getStyle())
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 512)
      scene.background = new THREE.CanvasTexture(canvas)
    } else {
      scene.background = new THREE.Color(bgColor)
    }
  }, [bgColor, bgGradient, scene])

  return null
}

// ── Camera animator (for presets that move the camera) ─────────
function CameraAnimator({ animation, isPlaying }) {
  const { camera } = useThree()
  const timeRef = useRef(0)
  const defaultPos = useRef(new THREE.Vector3(0, 0, 2.5))

  useEffect(() => {
    timeRef.current = 0
    camera.position.copy(defaultPos.current)
    camera.lookAt(0, 0, 0)
  }, [animation, camera])

  useFrame((_, delta) => {
    if (!isPlaying) return
    timeRef.current += delta
    const t = timeRef.current

    switch (animation) {
      case 'scroll': {
        const camZ = 2.5 + smoothSin(t, 0.2, 0.25)
        const camY = smoothSin(t, 0.15, 0.2)
        const camX = smoothSin(t, 0.12, 0.1)
        camera.position.set(camX, camY, camZ)
        camera.lookAt(0, smoothSin(t, 0.15, 0.08), 0)
        break
      }
      case 'single': {
        const introT = Math.min(1, t / 2.5)
        const eased = easeOutCubic(introT)
        const targetZ = 2.5 - eased * 0.4
        const orbitAngle = t * 0.25
        const radius = targetZ
        camera.position.set(
          Math.sin(orbitAngle) * radius * 0.1,
          smoothSin(t, 0.2, 0.1),
          radius + smoothSin(t, 0.15, 0.1)
        )
        camera.lookAt(0, smoothSin(t, 0.12, 0.05), 0)
        break
      }
      default: {
        // Default camera position
        camera.position.lerp(defaultPos.current, 0.05)
        camera.lookAt(0, 0, 0)
      }
    }
  })

  return null
}

// ── Main animated devices ─────────────────────────────────────
function AnimatedDevices({ screens, activeScreen, zoomLevel, videoSeekTime, timelinePlaying, deviceType, animation, isPlaying }) {
  const groupRef = useRef()
  const iphoneRef = useRef()
  const androidRef = useRef()
  const timeRef = useRef(0)
  const currentZoomRef = useRef(1)

  const firstScreen = activeScreen || screens[0] || null
  const secondScreen = screens[1] || screens[0] || null

  const showIphone = deviceType === 'iphone' || deviceType === 'both'
  const showAndroid = deviceType === 'android' || deviceType === 'both'
  const isBoth = deviceType === 'both'

  // Reset time when animation changes so intro animations replay
  useEffect(() => {
    timeRef.current = 0
  }, [animation])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    if (isPlaying) timeRef.current += delta
    const t = timeRef.current
    const group = groupRef.current
    const iph = iphoneRef.current
    const and = androidRef.current

    // Reset all transforms
    group.rotation.set(0, 0, 0)
    group.position.set(0, 0, 0)
    group.scale.set(1, 1, 1)

    const iphBaseX = isBoth ? -0.8 : 0
    const andBaseX = isBoth ? 0.8 : 0
    if (iph) { iph.rotation.set(0, 0, 0); iph.position.set(iphBaseX, 0, 0); iph.scale.set(1, 1, 1) }
    if (and) { and.rotation.set(0, 0, 0); and.position.set(andBaseX, 0, 0); and.scale.set(1, 1, 1) }

    switch (animation) {
      // ── SHOWCASE: Sweeping arc with floating ──────────────
      case 'showcase': {
        group.rotation.y = smoothSin(t, 0.25, 0.35)
        group.rotation.x = smoothSin(t, 0.18, 0.05)
        group.position.y = smoothSin(t, 0.35, 0.1)

        if (iph) {
          iph.rotation.y = (isBoth ? 0.2 : 0) + smoothSin(t, 0.3, 0.04)
          iph.position.y = smoothSin(t + 0.5, 0.4, 0.03)
        }
        if (and) {
          and.rotation.y = (isBoth ? -0.2 : 0) + smoothSin(t + 1, 0.28, 0.04)
          and.position.y = smoothSin(t + 1.0, 0.4, 0.03)
        }
        break
      }

      // ── ORBIT: Smooth continuous 360° rotation ────────────
      case 'orbit': {
        group.rotation.y = t * 0.4
        group.position.y = smoothSin(t, 0.5, 0.06)
        group.rotation.x = smoothSin(t, 0.3, 0.03)

        if (iph) iph.rotation.y = isBoth ? 0.2 : 0
        if (and) and.rotation.y = isBoth ? -0.2 : 0
        break
      }

      // ── FLIP REVEAL: Dramatic 3D entry then settle ────────
      case 'flip': {
        const introTime = 2.2
        const stagger = 0.4

        if (t < introTime + stagger) {
          const groupProgress = easeOutBack(t / introTime)
          group.rotation.y = (1 - groupProgress) * Math.PI * 1.2
          group.position.y = (1 - easeOutCubic(t / introTime)) * 1.2
          group.rotation.x = (1 - easeOutCubic(t / introTime)) * 0.3

          if (iph && isBoth) {
            const iphP = easeOutBack(Math.max(0, t - 0.0) / introTime)
            iph.position.x = iphBaseX - (1 - iphP) * 2
            iph.rotation.y = 0.2 + (1 - iphP) * 0.4
          }
          if (and && isBoth) {
            const andP = easeOutBack(Math.max(0, t - stagger) / introTime)
            and.position.x = andBaseX + (1 - andP) * 2
            and.rotation.y = -0.2 - (1 - andP) * 0.4
          }
        } else {
          const postT = t - introTime - stagger
          group.rotation.y = smoothSin(postT, 0.22, 0.3)
          group.rotation.x = smoothSin(postT, 0.15, 0.04)
          group.position.y = smoothSin(postT, 0.3, 0.08)

          if (iph) {
            iph.position.x = iphBaseX
            iph.rotation.y = (isBoth ? 0.2 : 0) + smoothSin(postT, 0.25, 0.03)
          }
          if (and) {
            and.position.x = andBaseX
            and.rotation.y = (isBoth ? -0.2 : 0) + smoothSin(postT + 0.5, 0.25, 0.03)
          }
        }
        break
      }

      // ── SCROLL: Vertical panning with parallax ────────────
      case 'scroll': {
        group.rotation.y = smoothSin(t, 0.18, 0.2)
        group.rotation.x = smoothSin(t, 0.12, 0.06)
        group.position.y = smoothSin(t, 0.2, 0.15)

        if (iph) {
          iph.rotation.y = (isBoth ? 0.15 : 0) + smoothSin(t, 0.2, 0.03)
          iph.position.y = smoothSin(t + 0.3, 0.25, 0.04)
        }
        if (and) {
          and.rotation.y = (isBoth ? -0.15 : 0) + smoothSin(t + 0.5, 0.2, 0.03)
          and.position.y = smoothSin(t + 0.8, 0.25, 0.04)
        }
        break
      }

      // ── SIDE BY SIDE: Spread apart with coordinated dance ─
      case 'sideBySide': {
        const introT = Math.min(1, t / 1.8)
        const eased = easeOutQuart(introT)

        group.rotation.y = smoothSin(t, 0.2, 0.2)
        group.rotation.x = smoothSin(t, 0.14, 0.04)
        group.position.y = smoothSin(t, 0.3, 0.06)

        if (iph && isBoth) {
          const spreadX = -1.2 - smoothSin(t, 0.15, 0.1)
          iph.position.x = iphBaseX + (spreadX - iphBaseX) * eased
          iph.rotation.y = 0.3 * eased + smoothSin(t, 0.25, 0.05)
          iph.rotation.z = smoothSin(t + 0.3, 0.2, 0.02)
          iph.position.y = smoothSin(t, 0.35, 0.04)
        }
        if (and && isBoth) {
          const spreadX = 1.2 + smoothSin(t, 0.15, 0.1)
          and.position.x = andBaseX + (spreadX - andBaseX) * eased
          and.rotation.y = -0.3 * eased + smoothSin(t + 1, 0.25, 0.05)
          and.rotation.z = smoothSin(t + 0.8, 0.2, -0.02)
          and.position.y = smoothSin(t + 0.5, 0.35, 0.04)
        }
        break
      }

      // ── SINGLE FOCUS: Cinematic close-up with slow arc ────
      case 'single': {
        group.rotation.y = smoothSin(t, 0.15, 0.4)
        group.rotation.x = smoothSin(t, 0.1, 0.06)
        group.position.y = smoothSin(t, 0.2, 0.1)

        const s = 1.0 + smoothSin(t, 0.2, 0.03)
        group.scale.set(s, s, s)

        if (iph) {
          iph.rotation.y = (isBoth ? 0.15 : 0) + smoothSin(t, 0.18, 0.03)
        }
        if (and) {
          and.rotation.y = (isBoth ? -0.15 : 0) + smoothSin(t + 0.5, 0.18, 0.03)
        }
        break
      }

      // ── SLIDE FROM LEFT ─────────────────────────────
      case 'slideLeft': {
        const introT = Math.min(1, t / 1.8)
        const eased = easeOutCubic(introT)
        group.position.x = (-4) * (1 - eased)
        group.position.y = smoothSin(t, 0.3, 0.06)
        group.rotation.y = smoothSin(t, 0.2, 0.08)
        break
      }

      // ── SLIDE FROM RIGHT ────────────────────────────
      case 'slideRight': {
        const introT = Math.min(1, t / 1.8)
        const eased = easeOutCubic(introT)
        group.position.x = 4 * (1 - eased)
        group.position.y = smoothSin(t, 0.3, 0.06)
        group.rotation.y = smoothSin(t, 0.2, 0.08)
        break
      }

      // ── SLIDE DOWN (enters from top) ────────────────
      case 'slideDown': {
        const introT = Math.min(1, t / 1.8)
        const eased = easeOutCubic(introT)
        group.position.y = 4 * (1 - eased) + smoothSin(t, 0.3, 0.06)
        group.rotation.x = smoothSin(t, 0.2, 0.04)
        break
      }

      // ── SLIDE UP (enters from bottom) ───────────────
      case 'slideUp': {
        const introT = Math.min(1, t / 1.8)
        const eased = easeOutCubic(introT)
        group.position.y = (-4) * (1 - eased) + smoothSin(t, 0.3, 0.06)
        group.rotation.x = smoothSin(t, 0.2, 0.04)
        break
      }

      // ── SLIDE RIGHT + ROTATE ────────────────────────
      case 'slideRightRotate': {
        const introT = Math.min(1, t / 2.0)
        const eased = easeOutCubic(introT)
        group.position.x = 4 * (1 - eased)
        group.rotation.y = (Math.PI * 0.5) * (1 - eased) + smoothSin(t, 0.2, 0.08)
        group.position.y = smoothSin(t, 0.3, 0.06)
        break
      }

      // ── SLIDE LEFT + ROTATE ─────────────────────────
      case 'slideLeftRotate': {
        const introT = Math.min(1, t / 2.0)
        const eased = easeOutCubic(introT)
        group.position.x = (-4) * (1 - eased)
        group.rotation.y = (-Math.PI * 0.5) * (1 - eased) + smoothSin(t, 0.2, 0.08)
        group.position.y = smoothSin(t, 0.3, 0.06)
        break
      }

      default: {
        group.rotation.y = smoothSin(t, 0.3, 0.3)
        group.position.y = smoothSin(t, 0.4, 0.08)
      }
    }

    // Apply timeline zoom effect — scales the entire phone group smoothly
    const targetZoom = zoomLevel || 1
    currentZoomRef.current += (targetZoom - currentZoomRef.current) * 0.08
    const zs = currentZoomRef.current
    group.scale.set(
      group.scale.x * zs,
      group.scale.y * zs,
      group.scale.z * zs
    )
  })

  return (
    <group ref={groupRef}>
      {showIphone && (
        <group ref={iphoneRef} position={[isBoth ? -0.8 : 0, 0, 0]}>
          <DeviceFrame
            type="iphone"
            screenUrl={firstScreen?.url || null}
            screenFile={firstScreen?.file || null}
            isVideo={firstScreen?.isVideo || false}
            videoSeekTime={videoSeekTime}
            timelinePlaying={timelinePlaying}
            scale={0.35}
          />
        </group>
      )}
      {showAndroid && (
        <group ref={androidRef} position={[isBoth ? 0.8 : 0, 0, 0]}>
          <DeviceFrame
            type="android"
            screenUrl={secondScreen?.url || null}
            screenFile={secondScreen?.file || null}
            isVideo={secondScreen?.isVideo || false}
            scale={0.35}
          />
        </group>
      )}
    </group>
  )
}

// ── Ambient particles ─────────────────────────────────────────
function Particles() {
  const pointsRef = useRef()
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const count = 100
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.012
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.008) * 0.06
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.018} color="#21C063" transparent opacity={0.2} sizeAttenuation />
    </points>
  )
}

// ── Ground reflection plane ───────────────────────────────────
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]} receiveShadow>
      <planeGeometry args={[24, 24]} />
      <meshStandardMaterial color="#0b141a" transparent opacity={0.4} roughness={0.85} />
    </mesh>
  )
}

// ── Main export ───────────────────────────────────────────────
export default function PreviewScene({
  screens, activeScreen, zoomLevel, videoSeekTime, timelinePlaying, deviceType, animation, bgColor, bgGradient, showBase, isPlaying, canvasRef,
}) {
  return (
    <div className="preview-scene">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 2]}
        shadows
        onCreated={({ gl }) => {
          if (canvasRef) canvasRef.current = gl.domElement
        }}
      >
        <SceneBackground bgColor={bgColor} bgGradient={bgGradient} />
        <CameraAnimator animation={animation} isPlaying={isPlaying} />

        {/* ── Professional 3-point lighting ── */}
        <ambientLight intensity={0.3} />
        {/* Key light */}
        <directionalLight position={[5, 6, 5]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
        {/* Fill light */}
        <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#2ed874" />
        {/* Rim lights for edge highlights */}
        <directionalLight position={[-5, 2, -5]} intensity={0.6} color="#21C063" />
        <directionalLight position={[5, 2, -5]} intensity={0.4} color="#1aad56" />
        {/* Accent underlight */}
        <pointLight position={[0, -3, 2]} intensity={0.25} color="#21C063" distance={8} />
        {/* Top spotlight */}
        <spotLight position={[0, 8, 3]} angle={0.35} penumbra={0.7} intensity={0.5} castShadow />

        <Suspense fallback={null}>
          <AnimatedDevices
            screens={screens}
            activeScreen={activeScreen}
            zoomLevel={zoomLevel}
            videoSeekTime={videoSeekTime}
            timelinePlaying={timelinePlaying}
            deviceType={deviceType}
            animation={animation}
            isPlaying={isPlaying}
            
          />
          <Particles />
          {showBase && (
            <>
              <GroundPlane />
              <ContactShadows
                position={[0, -2.5, 0]}
                opacity={0.3}
                scale={12}
                blur={2.5}
                far={4.5}
                resolution={512}
              />
            </>
          )}
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
        />
      </Canvas>

      {screens.length === 0 && (
        <div className="preview-empty">
          <p>Upload screens to see the 3D preview</p>
        </div>
      )}
    </div>
  )
}
