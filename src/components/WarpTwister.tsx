import { useEffect, useRef } from 'react'
import './WarpTwister.css'

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
uniform float uRadius;
uniform float uNarrow;
uniform float uLength;
uniform float uHazeSpeed;
uniform float uDustSpeed;
uniform float uHazeStrength;
uniform float uHazeFrequency;
uniform float uDustDensity;
uniform float uDustSize;
uniform float uDustOpacity;
uniform float uEdgeFade;
uniform float uSpiralTight;
uniform float uRotSpeed;
uniform vec3 uBase;
uniform vec3 uBg;
uniform float uCamDist;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

vec2 rot2(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float helixRadius(float y) {
  float t = y / max(uLength * 0.5, 0.001);
  float pinch = 1.0 + uNarrow * 0.12 * t * t;
  return uRadius / pinch;
}

float mapHelix(vec3 p) {
  float halfLen = uLength * 0.5;
  p.xz = rot2(p.xz, uTime * uRotSpeed + p.y * uSpiralTight);

  float rad = helixRadius(p.y);
  float r = length(p.xz);
  float lobe = 0.2 * rad * cos(atan(p.z, p.x) * 2.0);
  float tube = abs(r - rad) - rad * 0.26 - lobe;

  float strand = max(0.16, rad * 0.2);
  float d1 = length(p.xz - vec2(rad, 0.0)) - strand;
  float d2 = length(p.xz + vec2(rad, 0.0)) - strand;

  float spacing = 1.05;
  float yi = clamp(floor(p.y / spacing + 0.5) * spacing, -halfLen + 0.25, halfLen - 0.25);
  float rr = helixRadius(yi);
  float rung = sdCapsule(p, vec3(rr, yi, 0.0), vec3(-rr, yi, 0.0), strand * 0.34);

  float d = min(min(tube, min(d1, d2)), rung);
  return max(d, abs(p.y) - halfLen);
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0024, 0.0);
  return normalize(vec3(
    mapHelix(p + e.xyy) - mapHelix(p - e.xyy),
    mapHelix(p + e.yxy) - mapHelix(p - e.yxy),
    mapHelix(p + e.yyx) - mapHelix(p - e.yyx)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime;

  vec3 ro = vec3(0.15, 0.05, uCamDist);
  vec3 ta = vec3(0.0, 0.0, 0.0);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(vec3(0.0, 1.0, 0.0), ww));
  vec3 vv = cross(ww, uu);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.72 * ww);

  float dist = 0.0;
  float hit = -1.0;
  float closest = 8.0;
  vec3 p = ro;
  for (int i = 0; i < 72; i++) {
    p = ro + rd * dist;
    float d = mapHelix(p);
    closest = min(closest, d);
    if (d < 0.0018) {
      hit = 1.0;
      break;
    }
    if (dist > 30.0) break;
    dist += d;
  }

  vec3 col = uBg;

  float haze = 0.0;
  float hz = 0.35;
  for (int i = 0; i < 20; i++) {
    vec3 hp = ro + rd * hz;
    hp.xz = rot2(hp.xz, t * uRotSpeed + hp.y * uSpiralTight);
    float halfLen = uLength * 0.5;
    float rad = helixRadius(hp.y);
    float tube = length(hp.xz) / max(rad * 1.4, 0.001);
    float inside = smoothstep(1.4, 0.12, tube);
    inside *= smoothstep(halfLen + 0.7, halfLen - 0.5, abs(hp.y));
    float n = vnoise(
      hp * (uHazeFrequency * 0.038) +
      vec3(0.0, -t * uHazeSpeed * 1.35, t * uHazeSpeed * 0.32)
    );
    haze += inside * (0.34 + 0.66 * n) * exp(-hz * 0.06);
    hz += 0.48;
  }
  col += uBase * haze * uHazeStrength * 0.55;

  float missGlow = exp(-max(closest, 0.0) * 3.6) * 0.72;
  col += uBase * missGlow;

  if (hit > 0.0) {
    vec3 nrm = calcNormal(p);
    vec3 l1 = normalize(vec3(0.42, 0.88, 0.48));
    vec3 l2 = normalize(vec3(-0.55, 0.15, 0.7));
    float diff = clamp(dot(nrm, l1), 0.0, 1.0);
    float wrap = clamp(dot(nrm, l2) * 0.5 + 0.5, 0.0, 1.0);
    float fres = pow(1.0 - clamp(dot(nrm, -rd), 0.0, 1.0), 2.15);
    float ao = clamp(0.5 + 0.5 * mapHelix(p + nrm * 0.14) / 0.14, 0.22, 1.0);
    vec3 albedo = mix(uBase * 0.38, uBase, wrap);
    vec3 lit = albedo * (0.18 + 0.9 * diff) + uBase * fres * 0.92;
    lit *= ao;
    float fog = 1.0 - exp(-dist * 0.05);
    col = mix(col, lit, 0.9);
    col = mix(col, uBg + uBase * 0.08, fog * 0.38);
  }

  vec2 duv = gl_FragCoord.xy / max(uDustSize * 0.11, 1.0);
  vec2 id = floor(duv + vec2(t * uDustSpeed * 0.08, -t * uDustSpeed * 0.05));
  vec2 f = fract(duv) - 0.5;
  float n = hash12(id);
  float thresh = 1.0 - clamp(uDustDensity * 0.0011, 0.0, 0.32);
  if (n > thresh) {
    vec2 j = vec2(hash12(id + 1.7), hash12(id + 3.1)) - 0.5;
    float tw = 0.5 + 0.5 * sin(t * 2.6 + n * 22.0);
    float mote = smoothstep(0.24, 0.0, length(f - j * 0.32)) * tw;
    col += uBase * mote * uDustOpacity * 2.6;
  }

  float vig = length(uv * vec2(0.7, 1.0));
  col *= 1.0 - uEdgeFade * 0.11 * smoothstep(0.32, 1.22, vig);
  col += (hash12(gl_FragCoord.xy + floor(t * 18.0)) - 0.5) * 0.018;

  gl_FragColor = vec4(col, 1.0);
}
`

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

export type WarpTwisterProps = {
  radius?: number
  narrow?: number
  length?: number
  hazeSpeed?: number
  dustSpeed?: number
  hazeStrength?: number
  hazeFrequency?: number
  dustDensity?: number
  dustSize?: number
  dustOpacity?: number
  edgeFade?: number
  spiralTight?: number
  rotSpeed?: number
  baseColor?: [number, number, number]
  baseColorLight?: [number, number, number]
  cameraDistance?: number
  theme?: 'dark' | 'light'
  paused?: boolean
  className?: string
}

export default function WarpTwister({
  radius = 1.5,
  narrow = 1.8,
  length = 10,
  hazeSpeed = 0.5,
  dustSpeed = 1,
  hazeStrength = 0.25,
  hazeFrequency = 100,
  dustDensity = 300,
  dustSize = 100,
  dustOpacity = 0.1,
  edgeFade = 2,
  spiralTight = 0.5,
  rotSpeed = 0.12,
  baseColor = [0.753, 0.518, 0.988],
  baseColorLight = [0.267, 0, 0.667],
  cameraDistance = 8.5,
  theme = 'dark',
  paused = false,
  className = '',
}: WarpTwisterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewCanvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef({
    radius,
    narrow,
    length,
    hazeSpeed,
    dustSpeed,
    hazeStrength,
    hazeFrequency,
    dustDensity,
    dustSize,
    dustOpacity,
    edgeFade,
    spiralTight,
    rotSpeed,
    baseColor,
    baseColorLight,
    cameraDistance,
    theme,
    paused,
  })
  propsRef.current = {
    radius,
    narrow,
    length,
    hazeSpeed,
    dustSpeed,
    hazeStrength,
    hazeFrequency,
    dustDensity,
    dustSize,
    dustOpacity,
    edgeFade,
    spiralTight,
    rotSpeed,
    baseColor,
    baseColorLight,
    cameraDistance,
    theme,
    paused,
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
      console.warn('WarpTwister: WebGL init failed', err)
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
      radius: gl.getUniformLocation(program, 'uRadius'),
      narrow: gl.getUniformLocation(program, 'uNarrow'),
      length: gl.getUniformLocation(program, 'uLength'),
      hazeSpeed: gl.getUniformLocation(program, 'uHazeSpeed'),
      dustSpeed: gl.getUniformLocation(program, 'uDustSpeed'),
      hazeStrength: gl.getUniformLocation(program, 'uHazeStrength'),
      hazeFrequency: gl.getUniformLocation(program, 'uHazeFrequency'),
      dustDensity: gl.getUniformLocation(program, 'uDustDensity'),
      dustSize: gl.getUniformLocation(program, 'uDustSize'),
      dustOpacity: gl.getUniformLocation(program, 'uDustOpacity'),
      edgeFade: gl.getUniformLocation(program, 'uEdgeFade'),
      spiralTight: gl.getUniformLocation(program, 'uSpiralTight'),
      rotSpeed: gl.getUniformLocation(program, 'uRotSpeed'),
      base: gl.getUniformLocation(program, 'uBase'),
      bg: gl.getUniformLocation(program, 'uBg'),
      camDist: gl.getUniformLocation(program, 'uCamDist'),
    }

    let time = 1.4
    let last = performance.now()
    let raf = 0
    let running = true
    const dprCap = 1.6

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
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

    const ro = new ResizeObserver(setSize)
    ro.observe(viewCanvas)
    setSize()

    const draw = (now: number) => {
      if (!running || gl.isContextLost()) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const p = propsRef.current
      if (!p.paused && document.visibilityState !== 'hidden') {
        time += dt
      }

      const color = p.theme === 'light' ? p.baseColorLight : p.baseColor
      const bg =
        p.theme === 'light' ? [0.933, 0.941, 0.953] : [0.071, 0.071, 0.071]

      gl.uniform1f(loc.time, time)
      gl.uniform1f(loc.radius, p.radius)
      gl.uniform1f(loc.narrow, p.narrow)
      gl.uniform1f(loc.length, p.length)
      gl.uniform1f(loc.hazeSpeed, p.hazeSpeed)
      gl.uniform1f(loc.dustSpeed, p.dustSpeed)
      gl.uniform1f(loc.hazeStrength, p.hazeStrength)
      gl.uniform1f(loc.hazeFrequency, p.hazeFrequency)
      gl.uniform1f(loc.dustDensity, p.dustDensity)
      gl.uniform1f(loc.dustSize, p.dustSize)
      gl.uniform1f(loc.dustOpacity, p.dustOpacity)
      gl.uniform1f(loc.edgeFade, p.edgeFade)
      gl.uniform1f(loc.spiralTight, p.spiralTight)
      gl.uniform1f(loc.rotSpeed, p.rotSpeed)
      gl.uniform3f(loc.base, color[0], color[1], color[2])
      gl.uniform3f(loc.bg, bg[0], bg[1], bg[2])
      gl.uniform1f(loc.camDist, p.cameraDistance)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      viewCtx.drawImage(canvas, 0, 0)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      canvas.removeEventListener('webglcontextlost', onLost)
      ro.disconnect()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="warp-twister-gl" aria-hidden="true" />
      <canvas
        ref={viewCanvasRef}
        className={`warp-twister${className ? ` ${className}` : ''}`}
        aria-hidden="true"
      />
    </>
  )
}
