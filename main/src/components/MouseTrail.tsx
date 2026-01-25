'use client';

import { useEffect, useRef } from 'react';

interface NodePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Line {
  spring: number;
  friction: number;
  nodes: NodePoint[];
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const E = {
  friction: 0.5,
  trails: 20,
  size: 30,
  dampening: 0.025,
  tension: 0.99,
};

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const linesRef = useRef<Line[]>([]);
  const runningRef = useRef(true);
  const frameRef = useRef(0);
  const phaseRef = useRef(Math.random() * 2 * Math.PI);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = posRef.current;

    function createNode(): NodePoint {
      return { x: 0, y: 0, vx: 0, vy: 0 };
    }

    function createLine(springBase: number): Line {
      const spring = springBase + 0.1 * Math.random() - 0.05;
      const friction = E.friction + 0.01 * Math.random() - 0.005;
      const nodes: NodePoint[] = [];

      for (let i = 0; i < E.size; i++) {
        const node = createNode();
        node.x = pos.x;
        node.y = pos.y;
        nodes.push(node);
      }

      return {
        spring,
        friction,
        nodes,
        update() {
          let e = this.spring;
          let t = this.nodes[0];
          t.vx += (pos.x - t.x) * e;
          t.vy += (pos.y - t.y) * e;

          for (let i = 0; i < this.nodes.length; i++) {
            t = this.nodes[i];
            if (i > 0) {
              const n = this.nodes[i - 1];
              t.vx += (n.x - t.x) * e;
              t.vy += (n.y - t.y) * e;
              t.vx += n.vx * E.dampening;
              t.vy += n.vy * E.dampening;
            }
            t.vx *= this.friction;
            t.vy *= this.friction;
            t.x += t.vx;
            t.y += t.vy;
            e *= E.tension;
          }
        },
        draw(ctx: CanvasRenderingContext2D) {
          let x = this.nodes[0].x;
          let y = this.nodes[0].y;

          ctx.beginPath();
          ctx.moveTo(x, y);

          for (let i = 1; i < this.nodes.length - 2; i++) {
            const e = this.nodes[i];
            const t = this.nodes[i + 1];
            x = 0.5 * (e.x + t.x);
            y = 0.5 * (e.y + t.y);
            ctx.quadraticCurveTo(e.x, e.y, x, y);
          }

          const e = this.nodes[this.nodes.length - 2];
          const t = this.nodes[this.nodes.length - 1];
          ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
          ctx.stroke();
          ctx.closePath();
        },
      };
    }

    function initLines() {
      linesRef.current = [];
      for (let i = 0; i < E.trails; i++) {
        linesRef.current.push(createLine(0.45 + (i / E.trails) * 0.025));
      }
    }

    function updatePhase() {
      phaseRef.current += 0.0015;
      return 200 + Math.sin(phaseRef.current) * 20; // Subtle blue-ish hue range
    }

    function render() {
      if (!runningRef.current || !ctx || !canvas) return;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      // Subtle light blue/teal color with very low opacity
      const hue = updatePhase();
      ctx.strokeStyle = `hsla(${Math.round(hue)}, 40%, 60%, 0.015)`;
      ctx.lineWidth = 6;

      for (const line of linesRef.current) {
        line.update();
        line.draw(ctx);
      }

      frameRef.current++;
      window.requestAnimationFrame(render);
    }

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function handleMove(e: MouseEvent | TouchEvent) {
      if ('touches' in e) {
        pos.x = e.touches[0].pageX;
        pos.y = e.touches[0].pageY;
      } else {
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
    }

    function handleStart(e: MouseEvent | TouchEvent) {
      if (linesRef.current.length === 0) {
        handleMove(e);
        initLines();
        render();
      }
      handleMove(e);
    }

    resizeCanvas();

    document.addEventListener('mousemove', handleStart, { once: true });
    document.addEventListener('touchstart', handleStart, { once: true });
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      runningRef.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
