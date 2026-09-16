import { useState, useRef, useCallback, useEffect } from "react";
import { FileText, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

const ZOOM_LEVELS = [0.75, 0.9, 1, 1.1, 1.25] as const;
type ZoomLevel = typeof ZOOM_LEVELS[number];

interface DocumentViewerProps {
  filename: string;
  pageLabel?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  pageCount?: number;
}

export const DocumentViewer = ({ filename, pageLabel, children, actions, pageCount = 1 }: DocumentViewerProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<ZoomLevel>(0.9);
  const [currentPage, setCurrentPage] = useState(1);

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
    const availableWidth = canvas.clientWidth - 64;
    const paperWidth = (paper as HTMLElement).offsetWidth;
    if (paperWidth > 0) {
      const fitZoom = Math.max(0.5, Math.min(1, availableWidth / paperWidth));
      setZoom(fitZoom as ZoomLevel);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateCurrentPage = () => {
      const papers = Array.from(canvas.querySelectorAll<HTMLElement>("[data-page-number]"));
      if (papers.length === 0) return;
      const readingLine = canvas.getBoundingClientRect().top + Math.min(140, canvas.clientHeight * 0.25);
      let closestPage = 1;
      let closestDistance = Number.POSITIVE_INFINITY;
      papers.forEach((paper, index) => {
        const rect = paper.getBoundingClientRect();
        const distance = readingLine < rect.top
          ? rect.top - readingLine
          : readingLine > rect.bottom
            ? readingLine - rect.bottom
            : 0;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = index + 1;
        }
      });
      setCurrentPage(closestPage);
    };
    updateCurrentPage();
    canvas.addEventListener("scroll", updateCurrentPage, { passive: true });
    return () => canvas.removeEventListener("scroll", updateCurrentPage);
  }, [pageCount, zoom]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* White preview section */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border-x border-border">
        {/* Document toolbar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white/95 dark:bg-slate-900/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
          {/* Left */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/")}
            >
              Back
            </Button>
            <span className="text-xs text-muted-foreground">·</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{filename}</span>
          </div>

          {/* Center */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">{pageLabel ?? `${currentPage} / ${pageCount}`}</span>
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

          {/* Right */}
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </div>

        {/* Grey document canvas */}
        <div className="flex-1 overflow-hidden" style={{ padding: "20px 24px 24px" }}>
          <div
            ref={canvasRef}
            className="h-full overflow-auto bg-[#EAECF0] dark:bg-slate-900/80"
            style={{ padding: "clamp(16px, 3vw, 48px)" }}
          >
            <div className="mx-auto" style={{ width: "210mm", transform: `scale(${zoom})`, transformOrigin: "top center" }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
