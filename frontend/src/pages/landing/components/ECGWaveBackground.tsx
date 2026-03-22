import { useEffect, useRef, useCallback } from 'react';

/* ============================================
   ECG HEART RATE WAVE BACKGROUND
   Elegant, smooth ECG animation with soft glow
   ============================================ */

// ECG waveform generator — produces a realistic heartbeat cycle
function generateECGCycle(width: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < width; i++) {
    const t = i / width;
    let y = 0;

    if (t < 0.10) y = 0;
    else if (t < 0.20) {
      y = -Math.sin(((t - 0.10) / 0.10) * Math.PI) * 0.08;
    }
    else if (t < 0.28) y = 0;
    else if (t < 0.32) {
      y = Math.sin(((t - 0.28) / 0.04) * Math.PI) * 0.06;
    }
    else if (t < 0.40) {
      y = -Math.sin(((t - 0.32) / 0.08) * Math.PI) * 0.85;
    }
    else if (t < 0.46) {
      y = Math.sin(((t - 0.40) / 0.06) * Math.PI) * 0.15;
    }
    else if (t < 0.55) y = 0;
    else if (t < 0.72) {
      y = -Math.sin(((t - 0.55) / 0.17) * Math.PI) * 0.18;
    }
    else y = 0;

    points.push(y);
  }
  return points;
}

interface WaveConfig {
  yPosition: number;
  amplitude: number;
  speed: number;
  opacity: number;
  lineWidth: number;
  cycleWidth: number;
  color: string;
  glowSize: number;
  xStart: number;
}

export default function ECGWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const offsetsRef = useRef<number[]>([]);
  const isVisibleRef = useRef(true);

  const handleScroll = useCallback(() => {
    scrollRef.current = window.scrollY;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      isVisibleRef.current = window.innerWidth >= 480;
    };

    handleResize();

    // ============================================
    // WAVE CONFIGS — Unified teal/cyan palette
    // Elegant, visible but not distracting
    // ============================================
    const waves: WaveConfig[] = [
      // Primary — teal, right-biased, most visible
      {
        yPosition: 0.36,
        amplitude: 100,
        speed: 0.7,
        opacity: 0.18,
        lineWidth: 1.8,
        cycleWidth: 320,
        color: '20, 184, 166',    // Teal
        glowSize: 15,
        xStart: 0.30,
      },
      // Secondary — cyan, slightly lower
      {
        yPosition: 0.60,
        amplitude: 70,
        speed: 0.5,
        opacity: 0.12,
        lineWidth: 1.4,
        cycleWidth: 380,
        color: '6, 182, 212',     // Cyan
        glowSize: 10,
        xStart: 0.40,
      },
      // Tertiary — light teal, top area, subtle
      {
        yPosition: 0.18,
        amplitude: 45,
        speed: 0.4,
        opacity: 0.07,
        lineWidth: 1,
        cycleWidth: 260,
        color: '45, 212, 191',    // Light teal
        glowSize: 8,
        xStart: 0.50,
      },
    ];

    offsetsRef.current = waves.map(() => 0);
    const ecgCycles = waves.map(w => generateECGCycle(w.cycleWidth));

    // ============================================
    // ANIMATION LOOP
    // ============================================
    const animate = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Scroll modifiers — gentle
      const scrollY = scrollRef.current;
      const scrollFactor = Math.max(0.6, 1 - scrollY / 3000);
      const speedMod = 1 + (scrollY / 5000) * 0.2;

      // Subtle breathing glow — very slow, barely noticeable
      const time = performance.now() / 1000;
      const breathe = 1 + Math.sin(time * 0.8) * 0.08; // 1.0 → 1.08

      waves.forEach((wave, i) => {
        const cycle = ecgCycles[i];
        const cycleLen = cycle.length;

        // Update offset
        offsetsRef.current[i] += wave.speed * speedMod;
        if (offsetsRef.current[i] >= wave.cycleWidth) {
          offsetsRef.current[i] -= wave.cycleWidth;
        }

        const offset = offsetsRef.current[i];
        const yCenter = h * wave.yPosition;
        const xStartPx = w * wave.xStart;
        const drawWidth = w - xStartPx;

        const effectiveOpacity = wave.opacity * scrollFactor;
        if (effectiveOpacity < 0.01) return;

        // ---- Soft glow pass ----
        ctx.save();
        ctx.shadowColor = `rgba(${wave.color}, ${effectiveOpacity * breathe * 0.8})`;
        ctx.shadowBlur = wave.glowSize * breathe;
        ctx.strokeStyle = `rgba(${wave.color}, ${effectiveOpacity * 0.35})`;
        ctx.lineWidth = wave.lineWidth + 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        let started = false;
        for (let x = 0; x <= drawWidth + wave.cycleWidth; x++) {
          const screenX = xStartPx + x;
          if (screenX > w) break;

          const cyclePos = Math.floor((x + offset) % cycleLen);
          const yVal = cycle[cyclePos >= 0 ? cyclePos : cycleLen + cyclePos];
          const screenY = yCenter + yVal * wave.amplitude;

          if (!started) { ctx.moveTo(screenX, screenY); started = true; }
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
        ctx.restore();

        // ---- Main line with gradient fade ----
        ctx.save();
        ctx.lineWidth = wave.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const grad = ctx.createLinearGradient(xStartPx, 0, w, 0);
        grad.addColorStop(0, `rgba(${wave.color}, 0)`);
        grad.addColorStop(0.06, `rgba(${wave.color}, ${effectiveOpacity * 0.4})`);
        grad.addColorStop(0.18, `rgba(${wave.color}, ${effectiveOpacity})`);
        grad.addColorStop(0.75, `rgba(${wave.color}, ${effectiveOpacity})`);
        grad.addColorStop(0.92, `rgba(${wave.color}, ${effectiveOpacity * 0.4})`);
        grad.addColorStop(1, `rgba(${wave.color}, 0)`);
        ctx.strokeStyle = grad;

        ctx.beginPath();
        started = false;
        for (let x = 0; x <= drawWidth + wave.cycleWidth; x++) {
          const screenX = xStartPx + x;
          if (screenX > w) break;

          const cyclePos = Math.floor((x + offset) % cycleLen);
          const yVal = cycle[cyclePos >= 0 ? cyclePos : cycleLen + cyclePos];
          const screenY = yCenter + yVal * wave.amplitude;

          if (!started) { ctx.moveTo(screenX, screenY); started = true; }
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScroll]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Base gradient — soft blue-teal derived from sidebar/brand palette */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EEF2FF] via-[#F0FDFA]/60 to-[#EFF6FF]" />
      {/* Secondary overlay for depth — subtle radial wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.04)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.04)_0%,transparent_50%)]" />

      {/* Soft ambient teal glow — right side */}
      <div className="hidden md:block absolute -top-[100px] -right-[80px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-400/[0.08] via-cyan-300/[0.04] to-transparent blur-[90px] animate-aurora-1" />
      {/* Soft ambient teal glow — left side */}
      <div className="hidden md:block absolute top-[45%] -left-[120px] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-teal-400/[0.06] via-cyan-300/[0.03] to-transparent blur-[80px] animate-aurora-2" />

      {/* ECG Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 ecg-canvas"
        aria-hidden="true"
      />

      {/* Subtle dot grid */}
      <div className="hidden md:block absolute inset-0 bg-[radial-gradient(rgba(20,184,166,0.04)_1px,transparent_1px)] bg-[size:36px_36px] animate-grid-fade" />
    </div>
  );
}
