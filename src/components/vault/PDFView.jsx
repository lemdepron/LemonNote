import { useEffect, useRef, useState, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, 
  Download, FileText, Pen, Save, FileOutput, 
  Layers, EyeOff
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import * as pdfjsLib from "pdfjs-dist";
import PDFInkOverlay from "@/components/ink/PDFInkOverlay";
import { 
  addInkToPDF, 
  extractInkFromPDF, 
  exportPDF,
  hasInkAnnotations 
} from "@/lib/pdf/pdf-ink";
import { getFile, putFile } from "@/api/localDb";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * PDF Viewer component for rendering PDF files in notes.
 * Supports ink annotations on PDF pages with save/export.
 */
export default function PDFView({
  fileId,
  noteTitle,
  typography = {},
}) {
  const { t } = useI18n();
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null); // Raw PDF bytes for ink operations
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rendering, setRendering] = useState(false);
  const pageCanvasesRef = useRef(new Map());

  // Ink annotation state
  const [annotateMode, setAnnotateMode] = useState(false);
  const [inkStrokes, setInkStrokes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hasSavedAnnotations, setHasSavedAnnotations] = useState(false);

  // Load PDF document
  useEffect(() => {
    if (!fileId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const file = await getFile(fileId);
        
        if (!file || !file.blob) {
          throw new Error("PDF file not found");
        }

        // Load PDF document for pdf.js rendering
        const arrayBuffer = await file.blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Also keep raw bytes for ink operations
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check if PDF already has ink annotations on first page
        const hasInk = await hasInkAnnotations(bytes, 0);
        
        // Extract existing strokes if any
        let existingStrokes = [];
        if (hasInk) {
          existingStrokes = await extractInkFromPDF(bytes, 0) || [];
        }

        if (mounted) {
          setPdfDoc(pdf);
          setPdfBytes(bytes);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          setInkStrokes(existingStrokes);
          setHasSavedAnnotations(hasInk);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load PDF:", err);
        if (mounted) {
          setError(err.message || "Failed to load PDF");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      mounted = false;
    };
  }, [fileId]);

  // Render a specific page
  const renderPage = useCallback(async (pageNum, canvas) => {
    if (!pdfDoc || rendering) return;
    
    setRendering(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport,
      };
      
      await page.render(renderContext).promise;
    } catch (err) {
      console.error(`Failed to render page ${pageNum}:`, err);
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, scale, rendering]);

  // Render all pages
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";
    pageCanvasesRef.current.clear();

    for (let i = 1; i <= numPages; i++) {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "pdf-page-wrapper relative";
      pageWrapper.style.marginBottom = "2rem";

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page-canvas";
      canvas.style.display = "block";
      canvas.style.margin = "0 auto";
      canvas.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
      canvas.style.border = "1px solid var(--border)";
      canvas.style.background = "white";

      pageWrapper.appendChild(canvas);
      container.appendChild(pageWrapper);

      pageCanvasesRef.current.set(i, { canvas });
    }

    pageCanvasesRef.current.forEach(({ canvas }, pageNum) => {
      renderPage(pageNum, canvas);
    });
  }, [pdfDoc, numPages, scale, renderPage]);

  // Handle zoom
  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s * 0.8, 0.5));
  const resetZoom = () => setScale(1);

  // Handle page navigation
  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      const pageWrapper = containerRef.current?.querySelector(`.pdf-page-wrapper:nth-child(${pageNum})`);
      pageWrapper?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Download original PDF
  const handleDownload = async () => {
    if (!fileId) return;
    try {
      const file = await getFile(fileId);
      if (!file) return;
      
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name || `${noteTitle || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("fileMenu.printExport.exported", { format: "PDF" }));
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  // Toggle annotate mode
  const toggleAnnotate = () => {
    setAnnotateMode((prev) => !prev);
  };

  // Save ink annotations to PDF (updates the file in IndexedDB)
  const handleSaveAnnotations = async () => {
    if (!pdfBytes || inkStrokes.length === 0) {
      toast.error("No annotations to save");
      return;
    }

    setSaving(true);
    try {
      // Add ink to the current page
      const updatedBytes = await addInkToPDF(pdfBytes, inkStrokes, currentPage - 1);
      
      // Save updated PDF back to IndexedDB
      const file = await getFile(fileId);
      if (!file) throw new Error("File not found");

      const updatedBlob = new Blob([updatedBytes], { type: "application/pdf" });
      await putFile(updatedBlob, file.name);

      // Update local state
      setPdfBytes(updatedBytes);
      setHasSavedAnnotations(true);
      
      toast.success(t("pdf.annotate.saved") || "Annotations saved to PDF");
    } catch (err) {
      console.error("Failed to save annotations:", err);
      toast.error("Failed to save annotations");
    } finally {
      setSaving(false);
    }
  };

  // Export PDF (download annotated version)
  const handleExportPDF = async (flattened = false) => {
    if (!pdfBytes) return;

    try {
      let exportBytes = pdfBytes;
      
      if (inkStrokes.length > 0) {
        // Add current strokes for export
        exportBytes = await addInkToPDF(pdfBytes, inkStrokes, currentPage - 1);
      }
      
      // Apply export mode
      exportBytes = await exportPDF(exportBytes, flattened ? 'flattened' : 'annotated', currentPage - 1);

      const url = URL.createObjectURL(new Blob([exportBytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      const suffix = flattened ? "_flattened" : "_annotated";
      a.download = (noteTitle || "document").replace(/\.pdf$/i, "") + suffix + ".pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      toast.success(
        flattened 
          ? (t("pdf.annotate.exportedFlattened") || "Exported flattened PDF")
          : (t("pdf.annotate.exportedAnnotated") || "Exported annotated PDF")
      );
    } catch (err) {
      console.error("Failed to export PDF:", err);
      toast.error("Failed to export PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-muted-foreground">{t("ribbon.view.loadingPdf") || "Loading PDF…"}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <FileText className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{t("ribbon.view.pdfLoadError") || "Failed to load PDF"}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t("ribbon.view.noPdf") || "No PDF loaded"}</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer flex flex-col h-full">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 p-3 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border/60">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-[12px] text-foreground truncate max-w-[300px]">
            {noteTitle || "PDF Document"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Navigation */}
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label={t("ribbon.view.prevPage") || "Previous page"}
            title={t("ribbon.view.prevPage") || "Previous page"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="px-2 font-mono text-[12px] text-foreground">
            {t("ribbon.view.page", { current: currentPage, total: numPages }) || `${currentPage} / ${numPages}`}
          </span>
          
          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label={t("ribbon.view.nextPage") || "Next page"}
            title={t("ribbon.view.nextPage") || "Next page"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-border/50 mx-1" />

          {/* Zoom */}
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label={t("ribbon.view.zoomOut") || "Zoom out"}
            title={t("ribbon.view.zoomOut") || "Zoom out"}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <span className="px-2 font-mono text-[12px] text-foreground">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label={t("ribbon.view.zoomIn") || "Zoom in"}
            title={t("ribbon.view.zoomIn") || "Zoom in"}
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent transition"
            aria-label={t("ribbon.view.resetZoom") || "Reset zoom"}
            title={t("ribbon.view.resetZoom") || "Reset zoom"}
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-border/50 mx-1" />

          {/* Annotate mode toggle */}
          <button
            type="button"
            onClick={toggleAnnotate}
            className={cn(
              "p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent transition",
              annotateMode && "bg-primary/10 border-primary/50 text-primary"
            )}
            aria-label={annotateMode ? (t("pdf.annotate.exit") || "Exit annotate mode") : (t("pdf.annotate.enter") || "Enter annotate mode")}
            title={annotateMode ? (t("pdf.annotate.exit") || "Exit annotate mode") : (t("pdf.annotate.enter") || "Enter annotate mode")}
          >
            {annotateMode ? <EyeOff className="h-4 w-4" /> : <Pen className="h-4 w-4" />}
          </button>

          {/* Annotate actions (only visible in annotate mode) */}
          {annotateMode && (
            <>
              <div className="w-px h-6 bg-border/50 mx-1" />
              
              <button
                type="button"
                onClick={handleSaveAnnotations}
                disabled={saving || inkStrokes.length === 0}
                className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label={t("pdf.annotate.save") || "Save annotations to PDF"}
                title={t("pdf.annotate.save") || "Save annotations to PDF"}
              >
                <Save className="h-4 w-4" />
              </button>

              <div className="relative group">
                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  aria-label={t("pdf.annotate.export") || "Export PDF"}
                  title={t("pdf.annotate.export") || "Export PDF"}
                >
                  <FileOutput className="h-4 w-4" />
                </button>
                {/* Dropdown menu for export options */}
                <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-20">
                  <div className="bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => handleExportPDF(false)}
                      className="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
                    >
                      <Layers className="h-3.5 w-3.5 inline mr-2" />
                      {t("pdf.annotate.exportAnnotated") || "Export Annotated"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportPDF(true)}
                      className="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
                    >
                      <FileOutput className="h-3.5 w-3.5 inline mr-2" />
                      {t("pdf.annotate.exportFlattened") || "Export Flattened"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="w-px h-6 bg-border/50 mx-1" />

          {/* Print & Download (always visible) */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent transition"
            aria-label={t("ribbon.view.print") || "Print"}
            title={t("ribbon.view.print") || "Print"}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-accent transition"
            aria-label={t("ribbon.view.download") || "Download"}
            title={t("ribbon.view.download") || "Download"}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Pages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 relative"
        style={{
          background: "var(--background)",
        }}
      >
        {/* Pages are rendered dynamically via useEffect */}
        
        {/* Ink Overlay on current page when in annotate mode */}
        {annotateMode && pdfDoc && (
          <PDFInkOverlay
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            scale={scale}
            containerRef={containerRef}
            onStrokesChange={setInkStrokes}
            initialStrokes={inkStrokes}
          />
        )}
      </div>
    </div>
  );
}

// Helper for conditional class names
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}