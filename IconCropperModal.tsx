import React, { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

interface IconCropperModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

export const IconCropperModal: React.FC<IconCropperModalProps> = ({
  imageSrc,
  onCancel,
  onConfirm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      drawCanvas();
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, offset]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, size, size);

    const scale = Math.max(size / img.width, size / img.height) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2 + offset.x;
    const y = (size - h) / 2 + offset.y;

    ctx.drawImage(img, x, y, w, h);

    // Subtle square guide border
    ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
  };

  const exportSquare = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = 512;
    out.height = 512;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    const ratio = 512 / 280;
    const scale = Math.max(280 / img.width, 280 / img.height) * zoom * ratio;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (512 - w) / 2 + offset.x * ratio;
    const y = (512 - h) / 2 + offset.y * ratio;

    ctx.drawImage(img, x, y, w, h);
    onConfirm(out.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Crop Square App Icon (512×512)
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Drag to reposition image and adjust zoom to generate a crisp square Android icon.
        </p>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            onPointerDown={(e) => {
              setDragging(true);
              dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
            }}
            onPointerMove={(e) => {
              if (!dragging) return;
              setOffset({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y,
              });
            }}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
            className="rounded-2xl cursor-move touch-none border border-slate-300 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-slate-500" />
          <input
            type="range"
            min={0.6}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-sky-500"
          />
          <ZoomIn className="w-4 h-4 text-slate-500" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={exportSquare}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Generate Square Icon</span>
          </button>
        </div>
      </div>
    </div>
  );
};
