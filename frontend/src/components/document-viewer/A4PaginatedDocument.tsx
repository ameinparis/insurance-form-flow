import { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const PAGE_WIDTH = "210mm";
const PAGE_HEIGHT = "297mm";
const PAGE_MARGIN = "12mm";
const CONTENT_HEIGHT_MM = 273;

export interface A4DocumentBlock {
  id: string;
  content: ReactNode;
  keepTogether?: boolean;
  splitText?: string;
  renderTextChunk?: (text: string, continued: boolean) => ReactNode;
}

interface A4PaginatedDocumentProps {
  blocks: A4DocumentBlock[];
  onPageCountChange?: (count: number) => void;
}

interface PlacedBlock {
  key: string;
  content: ReactNode;
}

const splitTextToFit = (
  source: HTMLElement,
  text: string,
  availableHeight: number,
): [string, string, number] => {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return [text, "", source.getBoundingClientRect().height];

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.visibility = "hidden";
  clone.style.width = `${source.getBoundingClientRect().width}px`;
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  document.body.appendChild(clone);
  const paragraph = clone.querySelector("[data-splittable-text]") as HTMLElement | null;

  if (!paragraph) {
    clone.remove();
    return [text, "", source.getBoundingClientRect().height];
  }

  let low = 1;
  let high = words.length;
  let fit = 0;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    paragraph.textContent = words.slice(0, middle).join(" ");
    if (clone.getBoundingClientRect().height <= availableHeight) {
      fit = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  paragraph.textContent = words.slice(0, fit).join(" ");
  const fittedHeight = clone.getBoundingClientRect().height;
  clone.remove();

  return [words.slice(0, fit).join(" "), words.slice(fit).join(" "), fittedHeight];
};

export const A4PaginatedDocument = ({ blocks, onPageCountChange }: A4PaginatedDocumentProps) => {
  const measureRefs = useRef(new Map<string, HTMLDivElement>());
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const [pages, setPages] = useState<PlacedBlock[][]>([]);
  const [fontsReady, setFontsReady] = useState(false);
  const [measurementVersion, setMeasurementVersion] = useState(0);

  const blockSignature = useMemo(
    () => blocks.map((block) => `${block.id}:${block.splitText?.length ?? 0}`).join("|"),
    [blocks],
  );

  useEffect(() => {
    let active = true;
    const ready = document.fonts?.ready ?? Promise.resolve();
    ready.then(() => {
      if (active) setFontsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const paginate = useCallback(() => {
    if (!fontsReady) return;

    const pxPerMm = 96 / 25.4;
    const pageCapacity = CONTENT_HEIGHT_MM * pxPerMm;
    const nextPages: PlacedBlock[][] = [[]];
    let usedHeight = 0;

    const pushPage = () => {
      nextPages.push([]);
      usedHeight = 0;
    };

    blocksRef.current.forEach((block) => {
      const measured = measureRefs.current.get(block.id);
      if (!measured) return;
      const height = measured.getBoundingClientRect().height;

      if (block.splitText && block.renderTextChunk && height > pageCapacity - usedHeight) {
        let remaining = block.splitText;
        let continued = false;
        while (remaining.trim()) {
          const available = pageCapacity - usedHeight;
          const [chunk, rest, fittedHeight] = splitTextToFit(measured, remaining, available);
          if (!chunk && usedHeight > 0) {
            pushPage();
            continue;
          }
          const safeChunk = chunk || remaining;
          nextPages[nextPages.length - 1].push({
            key: `${block.id}-${nextPages.length}`,
            content: block.renderTextChunk(safeChunk, continued),
          });
          usedHeight += Math.min(fittedHeight, pageCapacity);
          remaining = rest;
          continued = true;
          if (remaining.trim()) pushPage();
        }
        return;
      }

      if (usedHeight > 0 && height > pageCapacity - usedHeight && (block.keepTogether || height <= pageCapacity)) {
        pushPage();
      }
      nextPages[nextPages.length - 1].push({ key: block.id, content: block.content });
      usedHeight += height;
      if (height > pageCapacity) usedHeight = pageCapacity;
    });

    const populatedPages = nextPages.filter((page) => page.length > 0);
    setPages(populatedPages.length > 0 ? populatedPages : [[]]);
  }, [fontsReady]);

  useLayoutEffect(() => {
    paginate();
  }, [blockSignature, fontsReady, measurementVersion, paginate]);

  useEffect(() => {
    if (!fontsReady || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setMeasurementVersion((version) => version + 1));
    });
    measureRefs.current.forEach((element) => observer.observe(element));
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [blockSignature, fontsReady]);

  useEffect(() => {
    onPageCountChange?.(pages.length || 1);
  }, [onPageCountChange, pages.length]);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-10000px] top-0 invisible"
        style={{ width: `calc(${PAGE_WIDTH} - (${PAGE_MARGIN} * 2))` }}
      >
        {blocks.map((block) => (
          <div
            key={block.id}
            ref={(node) => {
              if (node) measureRefs.current.set(block.id, node);
              else measureRefs.current.delete(block.id);
            }}
          >
            {block.content}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8" data-page-stack>
        {(pages.length > 0 ? pages : [[]]).map((page, pageIndex) => (
          <section
            key={`page-${pageIndex}`}
            data-paper
            data-page-number={pageIndex + 1}
            className="overflow-hidden bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:bg-slate-900"
            style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: PAGE_MARGIN }}
          >
            {page.map((block) => (
              <div key={block.key}>{block.content}</div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
};