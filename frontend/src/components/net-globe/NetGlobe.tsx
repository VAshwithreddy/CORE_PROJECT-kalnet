"use client";

import React, { useRef, useEffect } from "react";

interface NodeDef {
  id: string;
  label: string;
  type: "persona" | "service" | "data";
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  ps: number;
  color: string;
  size: number;
}

interface Packet {
  from: NodeDef;
  to: NodeDef;
  progress: number;
  speed: number;
  color: string;
}

interface NetGlobeProps {
  hoveredUserId?: string | null;
  onHoverNode?: (userId: string | null) => void;
  onSelectUserById?: (userId: string) => void;
  compact?: boolean;
}

const PERSONA_NODES = [
  { id: "EMP-014", label: "Employee", type: "persona" as const, color: "#0f766e" },
  { id: "EMP-021", label: "Engineer", type: "persona" as const, color: "#0d9488" },
  { id: "EMP-055", label: "Dept Head", type: "persona" as const, color: "#14b8a6" },
  { id: "EMP-082", label: "Product Lead", type: "persona" as const, color: "#2dd4bf" },
  { id: "EMP-001", label: "CEO", type: "persona" as const, color: "#6d28d9" },
  { id: "OPS-010", label: "Ops Lead", type: "persona" as const, color: "#4f46e5" },
  { id: "SYS-001", label: "SysAdmin", type: "persona" as const, color: "#2563eb" },
];

const SERVICE_NODES = [
  { id: "svc-auth", label: "Auth", type: "service" as const, color: "#64748b" },
  { id: "svc-db", label: "Database", type: "service" as const, color: "#64748b" },
  { id: "svc-queue", label: "Queue", type: "service" as const, color: "#64748b" },
  { id: "svc-cache", label: "Cache", type: "service" as const, color: "#64748b" },
  { id: "svc-ai", label: "AI Engine", type: "service" as const, color: "#7c3aed" },
  { id: "svc-cdn", label: "CDN", type: "service" as const, color: "#64748b" },
  { id: "svc-api", label: "API", type: "service" as const, color: "#64748b" },
  { id: "svc-logs", label: "Logging", type: "service" as const, color: "#64748b" },
];

const DATA_NODES = Array.from({ length: 14 }, (_, i) => ({
  id: `data-${i}`,
  label: "",
  type: "data" as const,
  color: "#94a3b8",
}));

export default function NetGlobe({
  hoveredUserId,
  onHoverNode,
  onSelectUserById,
  compact = false,
}: NetGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rotation = useRef({ x: 0.25, y: 0.4 });
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef<NodeDef | null>(null);
  const time = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let W = 0, H = 0;

    const resize = () => {
      W = container.clientWidth;
      H = container.clientHeight || (compact ? 400 : 580);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Build all nodes
    const allDefs = [...PERSONA_NODES, ...SERVICE_NODES, ...DATA_NODES];
    const N = allDefs.length;
    const nodes: NodeDef[] = allDefs.map((d, i) => {
      const t = i / N;
      const inc = Math.acos(1 - 2 * t);
      const az = Math.PI * 2 * ((1 + Math.sqrt(5)) / 2) * i;
      return {
        ...d,
        x: Math.sin(inc) * Math.cos(az),
        y: Math.sin(inc) * Math.sin(az),
        z: Math.cos(inc),
        px: 0, py: 0, ps: 0,
        size: d.type === "persona" ? 7 : d.type === "service" ? 4.5 : 2.5,
      };
    });

    // Build adjacency (connections)
    const connections: [NodeDef, NodeDef][] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.62) {
          connections.push([nodes[i], nodes[j]]);
        }
      }
    }

    // Packets
    const packets: Packet[] = [];
    const spawnPacket = () => {
      const from = nodes[Math.floor(Math.random() * N)];
      const candidates = connections
        .filter(([a, b]) => a.id === from.id || b.id === from.id)
        .map(([a, b]) => (a.id === from.id ? b : a));
      if (!candidates.length) return;
      const to = candidates[Math.floor(Math.random() * candidates.length)];
      const isSpecial = from.type === "persona" || to.type === "persona";
      packets.push({
        from, to, progress: 0,
        speed: 0.004 + Math.random() * 0.008,
        color: isSpecial ? (from.color !== "#94a3b8" ? from.color : to.color) : "#64748b",
      });
    };
    for (let i = 0; i < 12; i++) spawnPacket();

    // Mouse
    let mx = -9999, my = -9999;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      if (isDragging.current) {
        const dx = e.clientX - prevMouse.current.x;
        const dy = e.clientY - prevMouse.current.y;
        rotation.current.y += dx * 0.004;
        rotation.current.x += dy * 0.004;
        prevMouse.current = { x: e.clientX, y: e.clientY };
      } else {
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
      }
    };
    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onLeave = () => {
      mx = -9999; my = -9999;
      isDragging.current = false;
      hoveredRef.current = null;
      onHoverNode?.(null);
    };
    const onClick = () => {
      const h = hoveredRef.current;
      if (h?.type === "persona") onSelectUserById?.(h.id);
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      time.current += 0.01;

      if (!isDragging.current) rotation.current.y += 0.0012;

      const cy = Math.cos(rotation.current.y), sy = Math.sin(rotation.current.y);
      const cx = Math.cos(rotation.current.x), sx = Math.sin(rotation.current.x);
      const R = Math.min(W, H) * (compact ? 0.32 : 0.34);
      const FL = 420;

      // Project nodes
      nodes.forEach(n => {
        const x1 = n.x * cy - n.z * sy;
        const z1 = n.z * cy + n.x * sy;
        const y1 = n.y * cx - z1 * sx;
        const z2 = z1 * cx + n.y * sx;
        const scale = FL / (FL + z2 * R);
        n.px = W / 2 + x1 * R * scale;
        n.py = H / 2 + y1 * R * scale;
        n.ps = scale * (1 - z2 * 0.3);
      });

      // Hover detection
      let closest: NodeDef | null = null;
      let minD = 28;
      nodes.forEach(n => {
        const d = Math.hypot(n.px - mx, n.py - my);
        if (d < minD) { minD = d; closest = n; }
      });

      // External hover override
      if (hoveredUserId) {
        const found = nodes.find(n => n.id === hoveredUserId);
        if (found) closest = found;
      }

      hoveredRef.current = closest;
      if (closest?.type === "persona") onHoverNode?.(closest.id);

      // Draw atmosphere glow
      const cx2 = W / 2, cy2 = H / 2;
      const atmoGrad = ctx.createRadialGradient(cx2, cy2, R * 0.6, cx2, cy2, R * 1.1);
      atmoGrad.addColorStop(0, "rgba(15, 118, 110, 0.03)");
      atmoGrad.addColorStop(1, "rgba(15, 118, 110, 0)");
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx2, cy2, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Draw connections
      connections.forEach(([a, b]) => {
        const isHighlighted = closest && (closest.id === a.id || closest.id === b.id);
        const avg = (a.ps + b.ps) / 2;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        if (isHighlighted) {
          ctx.strokeStyle = `rgba(15, 118, 110, ${0.5 * avg})`;
          ctx.lineWidth = 1.5;
        } else if (a.type === "persona" || b.type === "persona") {
          ctx.strokeStyle = `rgba(13, 148, 136, ${0.12 * avg})`;
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = `rgba(203, 213, 225, ${0.18 * avg})`;
          ctx.lineWidth = 0.4;
        }
        ctx.stroke();
      });

      // Update & draw packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
          spawnPacket();
          continue;
        }
        const t = p.progress;
        const px = p.from.px + (p.to.px - p.from.px) * t;
        const py = p.from.py + (p.to.py - p.from.py) * t;
        const ps = p.from.ps + (p.to.ps - p.from.ps) * t;
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * ps, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.restore();
      }

      // Draw nodes (sorted by depth)
      const sorted = [...nodes].sort((a, b) => a.ps - b.ps);
      sorted.forEach(n => {
        const isHovered = closest?.id === n.id;
        const r = n.size * n.ps;

        if (isHovered) {
          // Outer pulse ring
          ctx.save();
          ctx.globalAlpha = 0.2 + 0.1 * Math.sin(time.current * 3);
          ctx.beginPath();
          ctx.arc(n.px, n.py, r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(n.px, n.py, r * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();
          ctx.restore();
        }

        // Node shadow/glow
        ctx.save();
        if (n.type === "persona" || isHovered) {
          ctx.shadowBlur = isHovered ? 20 : 8;
          ctx.shadowColor = n.color;
        }

        // Gradient fill
        const grad = ctx.createRadialGradient(n.px - r * 0.3, n.py - r * 0.3, 0, n.px, n.py, r);
        const col = n.color;
        grad.addColorStop(0, col + "ff");
        grad.addColorStop(1, col + "99");

        ctx.beginPath();
        ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? col : (n.type === "data" ? "#cbd5e1" : grad);
        ctx.fill();

        // White ring for persona nodes
        if (n.type === "persona") {
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 1.2 * n.ps;
          ctx.stroke();
        }
        ctx.restore();

        // Labels
        if (n.type === "persona" && n.label) {
          const alpha = isHovered ? 1 : Math.max(0, (n.ps - 0.7) * 2.5);
          if (alpha > 0) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = isHovered ? "#0f172a" : "#475569";
            ctx.font = isHovered
              ? `700 11px var(--core-font-sans)`
              : `500 9px var(--core-font-sans)`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(n.label, n.px, n.py + r + 5);
            ctx.restore();
          }
        }
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [hoveredUserId, compact]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: compact ? 380 : 540 }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", cursor: "grab", width: "100%", height: "100%" }}
      />
    </div>
  );
}
