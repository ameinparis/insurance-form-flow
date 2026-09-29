import { useState, useRef, useCallback } from "react";
import { Info, ZoomIn, ZoomOut, Maximize, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ZOOM_LEVELS = [0.75, 0.9, 1, 1.1, 1.25] as const;
type ZoomLevel = typeof ZOOM_LEVELS[number];

interface DocumentViewerProps {
  filename: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const DocumentViewer = ({ children, actions }: DocumentViewerProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<ZoomLevel>(1);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z);
      if (idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      return z;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      return z;
    });
  }, []);

  const handleFitWidth = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const paper = canvas.querySelector("[data-paper]");
    if (!paper) return;
    const availableWidth = canvas.clientWidth - 40;
    const paperWidth = (paper as HTMLElement).offsetWidth;
    if (paperWidth > 0) {
      const fitZoom = Math.max(0.5, Math.min(1, availableWidth / paperWidth));
      setZoom(fitZoom as ZoomLevel);
    }
  }, []);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="quotation-preview-shell h-[calc(100vh-4rem)]">
      <div className="quotation-preview-toolbar">
        <div className="quotation-preview-title">
          <span>Preview</span>
          <Info className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="quotation-preview-actions">
          <Button
            variant="ghost"
            size="sm"
            className="quotation-toolbar-action"
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="quotation-zoom-controls" aria-label="Document zoom controls">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={zoom === ZOOM_LEVELS[0]}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-14 text-center text-xs font-medium tabular-nums text-muted-foreground">{zoomPercent}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="ml-1 h-8 text-xs" onClick={handleFitWidth}>
              <Maximize className="h-3.5 w-3.5 mr-1" />
              Fit Width
            </Button>
          </div>
          {actions}
        </div>
      </div>

      <div ref={canvasRef} className="quotation-preview-canvas">
        <div className="quotation-paper-stage" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
          <div data-paper className="quote-paper overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
