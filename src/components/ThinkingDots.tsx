import { useEffect, useRef } from 'react'
import './ThinkingDots.css'

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uCursor;
uniform float uSpeed;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uBg;
uniform float uAmbient;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec2 lobePos(float i, float t) {
  float ang = i * 2.094395;
  float wander = 0.34 * (0.78 + 0.22 * sin(t * 0.37 + i * 1.9));
  return vec2(
    cos(ang + t * 0.21 * uSpeed + i) * wander,
    sin(ang * 1.17 + t * 0.17 * uSpeed - i * 0.55) * wander
  );
}

float cloudDensity(vec2 p, float t) {
  float d = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 c = lobePos(float(i), t);
    vec2 delta = p - c;
    float r2 = dot(delta, delta) / 0.145;
    d += exp(-r2 * 2.15);
  }
  float turb = vnoise(p * 2.2 + t * 0.16) * 2.0 - 1.0;
  d *= 1.0 + 0.12 * turb;
  float breath = 0.94 + 0.06 * sin(t * 0.55);
  // Keep a soft drifting cloud, but much quieter than before.
  return clamp(d * breath * 0.38, 0.0, 0.7);
}

// Soft disc under the pointer — small radius, gentle lift only.
float cursorHighlight(vec2 p) {
  vec2 md = p - uMouse;
  float r2 = dot(md, md);
  return uCursor * exp(-r2 / 0.016);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime;

  const float spacing = 0.02;
  vec2 cellId = floor(p / spacing);
  vec2 cellCenter = (cellId + 0.5) * spacing;
  vec2 local = p - cellCenter;

  float dens = cloudDensity(cellCenter, t);
  float cursor = cursorHighlight(cellCenter);
  float jitter = (hash12(cellId) - 0.5) * 0.01;
  float pulse = sin(t * 1.6 - length(cellCenter) * 9.0 + cellId.x * 0.35);

  float radius = (0.028 + dens * 0.022 + pulse * 0.006 + jitter + cursor * 0.04) * spacing;
  radius = max(radius, spacing * 0.016);

  float dist = length(local);
  float soft = 0.32 * radius;
  float dotMask = 1.0 - smoothstep(radius - soft, radius + soft, dist);

  float brightness = mix(uAmbient, uAmbient + 0.22, clamp(dens, 0.0, 1.0));
  brightness += pulse * 0.03;
  brightness += cursor * 0.72;
  brightness = clamp(brightness, 0.08, 1.35);

  float accentMix = smoothstep(0.42, 0.95, dens * 0.85 + cursor * 0.55);
  vec3 tint = mix(uColor, uAccent, accentMix);
  vec3 lit = tint * brightness;

  float halo = 0.035 * dens * dens * exp(-dist / spacing * 3.2);
  lit += uAccent * (halo + cursor * 0.22 * exp(-dist / spacing * 2.4));

  vec3 color = mix(uBg, lit, clamp(dotMask, 0.0, 1.0));
  color += (hash12(gl_FragCoord.xy + floor(t * 24.0)) - 0.5) * 0.02;

  float vig = length(p * vec2(0.72, 1.0));
  color *= 1.0 - 0.08 * smoothstep(0.4, 1.2, vig);

  gl_FragColor = vec4(color, 1.0);
}
`

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').trim()
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const n = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return [0.5, 0.5, 0.5]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('WebGL shader alloc failed')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'compile failed'
    gl.deleteShader(shader)
    throw new Error(log)
  }
  return shader
}

export type ThinkingDotsProps = {
  color?: string
  accentColor?: string
  backgroundColor?: string
  ambient?: number
  speed?: number
  paused?: boolean
  cursorInteraction?: boolean
  className?: string
}

export default function ThinkingDots({
  color = '#ff44af',
  accentColor = '#ff44af',
  backgroundColor = '#121212',
  ambient = 0.55,
  speed = 1,
  paused = false,
  cursorInteraction = true,
  className = '',
}: ThinkingDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewCanvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef({
    color,
    accentColor,
    backgroundColor,
    ambient,
    speed,
    paused,
    cursorInteraction,
  })
  propsRef.current = {
    color,
    accentColor,
    backgroundColor,
    ambient,
    speed,
    paused,
    cursorInteraction,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const viewCanvas = viewCanvasRef.current
    if (!canvas || !viewCanvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      // Needed so we can copy frames onto a 2D canvas that backdrop-filter can sample.
      preserveDrawingBuffer: true,
    })
    const viewCtx = viewCanvas.getContext('2d', { alpha: false })
    if (!gl || gl.isContextLost() || !viewCtx) return

    const onLost = (event: Event) => {
      event.preventDefault()
    }
    canvas.addEventListener('webglcontextlost', onLost, false)

    let vert: WebGLShader
    let frag: WebGLShader
    let program: WebGLProgram
    try {
      vert = compile(gl, gl.VERTEX_SHADER, VERT)
      frag = compile(gl, gl.FRAGMENT_SHADER, FRAG)
      const linked = gl.createProgram()
      if (!linked) throw new Error('program alloc failed')
      gl.attachShader(linked, vert)
      gl.attachShader(linked, frag)
      gl.linkProgram(linked)
      if (!gl.getProgramParameter(linked, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(linked) ?? 'link failed')
      }
      program = linked
    } catch (err) {
      console.warn('ThinkingDots: WebGL init failed', err)
      canvas.removeEventListener('webglcontextlost', onLost)
      return
    }

    gl.useProgram(program)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const loc = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      time: gl.getUniformLocation(program, 'uTime'),
      mouse: gl.getUniformLocation(program, 'uMouse'),
      cursor: gl.getUniformLocation(program, 'uCursor'),
      speed: gl.getUniformLocation(program, 'uSpeed'),
      color: gl.getUniformLocation(program, 'uColor'),
      accent: gl.getUniformLocation(program, 'uAccent'),
      bg: gl.getUniformLocation(program, 'uBg'),
      ambient: gl.getUniformLocation(program, 'uAmbient'),
    }

    const mouseTarget = { x: 0, y: 0 }
    const mouseSmooth = { x: 0, y: 0 }
    let cursorTarget = 0
    let cursorSmooth = 0
    let time = 1.2
    let last = performance.now()
    let raf = 0
    let running = true
    let dpr = Math.min(window.devicePixelRatio || 1, 1.75)

    const setSize = () => {
      const w = Math.max(1, viewCanvas.clientWidth || canvas.clientWidth)
      const h = Math.max(1, viewCanvas.clientHeight || canvas.clientHeight)
      const width = Math.max(1, Math.floor(w * dpr))
      const height = Math.max(1, Math.floor(h * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      if (viewCanvas.width !== width || viewCanvas.height !== height) {
        viewCanvas.width = width
        viewCanvas.height = height
      }
      gl.viewport(0, 0, width, height)
      gl.uniform2f(loc.resolution, width, height)
    }

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const aspect = rect.width / Math.max(rect.height, 1)
      return {
        x: ((clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * aspect,
        y: 0.5 - (clientY - rect.top) / Math.max(rect.height, 1),
      }
    }

    const onMove = (e: PointerEvent) => {
      if (!propsRef.current.cursorInteraction || propsRef.current.paused) return
      const p = toLocal(e.clientX, e.clientY)
      mouseTarget.x = p.x
      mouseTarget.y = p.y
      cursorTarget = 1
    }

    const onLeave = () => {
      cursorTarget = 0
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    const ro = new ResizeObserver(setSize)
    ro.observe(viewCanvas)
    setSize()

    const draw = (now: number) => {
      if (!running || gl.isContextLost()) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const p = propsRef.current
      if (!p.paused && document.visibilityState !== 'hidden') {
        time += dt * p.speed
      }

      const follow = 1 - Math.exp(-dt * 7)
      mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * follow
      mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * follow
      cursorSmooth +=
        ((p.cursorInteraction && !p.paused ? cursorTarget : 0) - cursorSmooth) * follow

      const base = hexToRgb(p.color)
      const accent = hexToRgb(p.accentColor)
      const bg = hexToRgb(p.backgroundColor)

      gl.uniform1f(loc.time, time)
      gl.uniform2f(loc.mouse, mouseSmooth.x, mouseSmooth.y)
      gl.uniform1f(loc.cursor, cursorSmooth)
      gl.uniform1f(loc.speed, p.speed)
      gl.uniform3f(loc.color, base[0], base[1], base[2])
      gl.uniform3f(loc.accent, accent[0], accent[1], accent[2])
      gl.uniform3f(loc.bg, bg[0], bg[1], bg[2])
      gl.uniform1f(loc.ambient, p.ambient)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      viewCtx.drawImage(canvas, 0, 0)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('webglcontextlost', onLost)
      ro.disconnect()
      // Avoid deleting GL objects: React Strict Mode remounts on the same
      // canvas and a torn-down context often fails to reinitialize.
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="thinking-dots-gl" aria-hidden="true" />
      <canvas
        ref={viewCanvasRef}
        className={`thinking-dots${className ? ` ${className}` : ''}`}
        aria-hidden="true"
      />
    </>
  )
}
