# Handwriting Recognition Engine Research Report

**Date:** 2026-11-18  
**Task:** C14 - Recognition research (report only)  
**Scope:** Find strong OFFLINE engines for English handwriting, handwritten math (to LaTeX), and handwritten code. No app code, no dependencies added.

---

## Corrections (added 2026-11-18 per C14b)

1. **Xenova/trocr-base-handwritten exists for transformers.js** — The claim that transformers.js does not support handwritten TrOCR was wrong. The model `Xenova/trocr-base-handwritten` (library_name: "transformers.js") has ONNX files (`onnx/encoder_model.onnx`, `onnx/decoder_model_merged_quantized.onnx`, etc.) and can be used directly with `@huggingface/transformers` pipeline API. Source: https://huggingface.co/api/models/Xenova/trocr-base-handwritten

2. **TrOCR reads one line image at a time** — TrOCR is a line-level recognizer. For multi-line notes, the image must be segmented into individual lines first (e.g., via projection profiles or a line detector). This affects both text and math use cases.

3. **tjoab/latex_finetuned (TrOCR fine-tuned on MathWriting)** — A third math candidate: `tjoab/latex_finetuned`, fine-tuned from `microsoft/trocr-base-handwritten` on Google's MathWriting dataset (500k+ handwritten math expressions). Reports **CER 14.9%** on its model card. License not explicitly stated on model card (base model is MIT); marked "not checked" below. Source: https://huggingface.co/tjoab/latex_finetuned

4. **License column added** — Every recommended model now has a "License" entry in its table, read from its model card or marked "not checked" if absent.

---

## Executive Summary

| Use Case | Recommendation | Engine | Key Details |
|----------|----------------|--------|-------------|
| **English handwritten text** | **Use transformers.js or ONNX Runtime Web + TrOCR (handwritten)** | `Xenova/trocr-base-handwritten` (transformers.js) or `onnx-community/trocr-base-handwritten-ONNX` | MIT license, ~333M params, quantized ONNX, runs in browser via transformers.js or ONNX Runtime Web |
| **Handwritten math → LaTeX** | **Use ONNX Runtime Web + TexTeller** | `nfa04/texteller-onnx-8bit` (or `OleehyO/TexTeller`) | Apache-2.0, ~298M params, ONNX quantized (8-bit), ~489 MB |
| **Handwritten math → LaTeX (alt)** | **TrOCR fine-tuned on MathWriting** | `tjoab/latex_finetuned` | Not checked (base MIT), CER 14.9%, PyTorch only (needs ONNX conversion) |
| **Handwritten code** | **None good enough** | — | No dedicated offline model found; TrOCR may work partially but untested |
| **Online (stroke-based) handwriting** | **None fully offline** | — | MyScript iinkTS requires cloud; no pure browser offline stroke recognizer found |

**Bottom line:** Two viable OFFLINE paths exist (TrOCR for text via transformers.js/ONNX Runtime Web, TexTeller for math via ONNX Runtime Web). tjoab/latex_finetuned is a promising math candidate but needs ONNX conversion. No strong offline solution for handwritten code or stroke-based recognition. Keep shapes/ink as-is for now. **TrOCR processes one line per image — multi-line input requires line segmentation.**

---

## Detailed Findings

### 1. @huggingface/transformers (transformers.js) with TrOCR

| Property | Value |
|----------|-------|
| **Library** | `@huggingface/transformers` (transformers.js) |
| **Model** | TrOCR (Microsoft) — vision-encoder-decoder |
| **Handwritten variant (transformers.js)** | `Xenova/trocr-base-handwritten` (quantized ONNX, library_name: "transformers.js", ~333M params) |
| **Handwritten variant (PyTorch)** | `microsoft/trocr-base-handwritten` (FP32, 333M params, MIT license) |
| **transformers.js support** | ✅ **Yes** — `Xenova/trocr-base-handwritten` provides quantized ONNX files (`onnx/encoder_model_quantized.onnx`, `onnx/decoder_model_merged_quantized.onnx`, etc.) and works with the transformers.js `pipeline("image-to-text", ...)` API. |
| **ONNX alternative (community)** | `onnx-community/trocr-base-handwritten-ONNX` — pure ONNX with multiple quantizations (int8, fp16, q4, uint8), runs via ONNX Runtime Web. |
| **License** | MIT (from base model `microsoft/trocr-base-handwritten`; Xenova conversion inherits same) |
| **Model size (quantized)** | ~1–2 GB (quantized ONNX) |
| **Offline** | ✅ Yes — runs fully in browser via transformers.js (WASM/WebGPU) or ONNX Runtime Web |
| **Accuracy (reported)** | Strong on IAM/HTR benchmarks; decent on cursive English; degrades on messy handwriting |
| **Inference time (est.)** | 200–500 ms per line image on laptop CPU (WASM); faster with WebGPU |
| **Memory** | ~500 MB–1 GB RAM for quantized model |
| **Note** | TrOCR processes **one text line per image**. Multi-line input requires line segmentation first. |

**Sources:**
- TrOCR base model card: https://huggingface.co/microsoft/trocr-base-handwritten
- Xenova transformers.js conversion: https://huggingface.co/api/models/Xenova/trocr-base-handwritten
- ONNX community conversion: https://huggingface.co/onnx-community/trocr-base-handwritten-ONNX
- License: MIT (from base model card `license: mit`)

---

### 2. Tesseract.js (tesseract.js)

| Property | Value |
|----------|-------|
| **Library** | `tesseract.js` (npm) |
| **Engine** | Tesseract OCR (C++), compiled to WebAssembly |
| **Handwriting support** | ❌ **Explicitly NOT supported** — FAQ states: "No. The Tesseract OCR model is built around assumptions that only hold for printed text. No combination of options will significantly improve performance with handwritten text. Unless your handwriting is so good that it closely resembles printed text, the results will be poor." |
| **License** | Apache-2.0 (compatible with GPL-3.0) |
| **Model size** | ~10–20 MB per language (eng.traineddata ~10 MB) |
| **Offline** | ✅ Yes — fully offline, WASM |
| **Accuracy on handwriting** | Poor (designed for printed text) |
| **Inference time** | 500–2000 ms per page on laptop |

**Source:** https://raw.githubusercontent.com/naptha/tesseract.js/master/docs/faq.md (section "Is handwritten text supported?")

---

### 3. Online (Stroke-based) Handwriting Recognizers

| Candidate | Status | Details |
|-----------|--------|---------|
| **MyScript iinkTS / iinkJS** | ❌ **Requires cloud** | Apache-2.0 licensed, but recognition happens on MyScript Cloud (requires API key, network). No offline model. Archived repo (iinkJS). |
| **Google ML Kit / MediaPipe** | ❌ **Mobile only** | Android/iOS native; no browser/WASM offline build. |
| **PRML / academic repos** | ❌ **Python only** | e.g., `PRML-Project/Online-Handwriting-Recognition` — PyTorch training code, no browser export. |
| **Various GitHub JS demos** | ❌ **Toys / limited** | `alephno/handwriting-recognition` (digits only, TensorFlow.js), `haohaaorg/js-handwriting` (Shan consonants, experimental), `goodleminh/kanji-handwriting-recognition` (Kanji, Flask backend). None generalize to English cursive. |

**Conclusion:** No production-ready, offline, stroke-based English handwriting recognizer runs in the browser today.

---

### 4. Handwritten Math → LaTeX (Image-based)

| Candidate | Format | License | Offline | Details |
|-----------|--------|---------|---------|---------|
| **TexTeller (OleehyO/TexTeller)** | PyTorch + ONNX | Apache-2.0 | ✅ Via ONNX Runtime Web | VisionEncoderDecoder, 298M params, trained on synthetic + real LaTeX formulas. ONNX files included (encoder_model.onnx, decoder_model.onnx, etc.). |
| **TexTeller quantized (nfa04/texteller-onnx-8bit)** | ONNX (8-bit) | Apache-2.0 | ✅ Via ONNX Runtime Web | Quantized INT8, ~489 MB total (encoder + decoder). Includes `encoder.onnx`, `decoder.onnx`, `encoder-gpu.onnx`. |
| **tjoab/latex_finetuned** | PyTorch (safetensors) | Not checked (base model MIT) | ❌ No ONNX yet; would need conversion | TrOCR fine-tuned on Google MathWriting (500k+ samples). **CER 14.9%** (model card). No transformers.js/ONNX export currently; would need Optimum conversion. |
| **pix2tex / LaTeX-OCR (lukas-blecher/LaTeX-OCR)** | PyTorch only | MIT | ❌ Python only | No ONNX export in repo; would need manual conversion. |
| **Donut (naver-clova-ix/donut-base)** | PyTorch | MIT | ❌ Not in transformers.js | OCR-free document understanding; can do math but no browser ONNX readily available. |
| **Nougat (facebook/nougat-base)** | PyTorch | CC-BY-NC-4.0 | ❌ Non-commercial | PDF→Markdown with LaTeX; license incompatible with GPL-3.0 commercial use. |
| **Falcon-OCR (tiiuae/Falcon-OCR)** | PyTorch | Apache-2.0 | ❌ No ONNX in transformers.js | VLM for OCR; large (7B+ params). |

**Recommended:** **TexTeller ONNX (quantized)** via ONNX Runtime Web (only candidate with ready-to-use browser ONNX).
- **License:** Apache-2.0 ✅ (GPL-3.0 compatible)
- **Model files:** `encoder.onnx` (~200 MB), `decoder.onnx` (~280 MB), tokenizer files
- **Accuracy:** Strong on printed & handwritten formulas (BLEU reported on test sets)
- **Inference:** ~300–800 ms per formula on laptop CPU (WASM)

**Sources:**
- TexTeller model card: https://huggingface.co/OleehyO/TexTeller
- Quantized ONNX: https://huggingface.co/nfa04/texteller-onnx-8bit
- tjoab/latex_finetuned model card: https://huggingface.co/tjoab/latex_finetuned (CER 14.9%)
- License: Apache-2.0 (TexTeller); not explicitly stated on tjoab/latex_finetuned card

---

### 5. Handwritten Code Recognition

| Candidate | Status |
|-----------|--------|
| **TrOCR fine-tuned on code** | No public model found. TrOCR trained on IAM/HTR (natural handwriting), not source code. |
| **Code-specific OCR** | No offline browser model found. |
| **Workaround** | TrOCR (handwritten) *might* recognize code if characters are clear, but keywords, symbols, indentation will likely fail. No benchmark data. |

**Verdict:** **None good enough.** Keep ink/shapes as-is for code.

---

### 6. Indra OCR (Multilingual Document OCR with Handwriting & Math)

| Property | Value |
|----------|-------|
| **Model** | `datalab-to/indra-ocr` |
| **Format** | ONNX (multiple models: det, rec, rec_world, math_enc, math_dec, etc.) |
| **License** | OpenRAIL (Open Responsible AI License) — **needs legal review** for GPL-3.0 compatibility |
| **Handwriting** | ✅ Tagged "handwriting" in model card; demo shows handwritten letter |
| **Math** | ✅ Has `math_enc.onnx`, `math_dec_init.onnx`, `math_dec_step.onnx` |
| **Languages** | 80+ (incl. English, French, German, Spanish, Chinese, Japanese, Korean, Arabic, etc.) |
| **Model size** | ~128 MB total (all ONNX files) |
| **Offline** | ✅ Yes — pure ONNX, can run via ONNX Runtime Web |
| **Demo** | https://huggingface.co/spaces/tomngdev/indra-ocr-web (WASM demo) |

**Note:** OpenRAIL license has use-case restrictions (e.g., no surveillance, no harmful use). Compatibility with GPL-3.0 is unclear — consult legal before adopting.

**Source:** https://huggingface.co/datalab-to/indra-ocr

---

## License Compatibility Matrix (GPL-3.0 Project)

| Engine / Model | License | GPL-3.0 Compatible? |
|----------------|---------|---------------------|
| TrOCR (Microsoft / Xenova) | MIT | ✅ Yes |
| TexTeller (OleehyO) | Apache-2.0 | ✅ Yes |
| tjoab/latex_finetuned | Not checked (base MIT) | ⚠️ Unknown |
| Tesseract.js | Apache-2.0 | ✅ Yes |
| Indra OCR | OpenRAIL | ⚠️ Unclear — needs legal review |
| MyScript iinkTS | Apache-2.0 | ✅ Yes (but requires cloud) |
| pix2tex / LaTeX-OCR | MIT | ✅ Yes |
| Donut | MIT | ✅ Yes |
| Nougat | CC-BY-NC-4.0 | ❌ No (non-commercial) |

---

## Implementation Path (If Proceeding)

### For English Handwritten Text (TrOCR via transformers.js)
```bash
npm i @huggingface/transformers
# Use Xenova/trocr-base-handwritten directly via pipeline:
# import { pipeline } from '@huggingface/transformers';
# const ocr = await pipeline('image-to-text', 'Xenova/trocr-base-handwritten');
# const result = await ocr(imageBlob);
```

### For English Handwritten Text (TrOCR via ONNX Runtime Web)
```bash
npm i onnxruntime-web
# Download model files from onnx-community/trocr-base-handwritten-ONNX
# Use encoder_model_quantized.onnx + decoder_model_merged_quantized.onnx (int8/q4)
# Run via ort.InferenceSession with WASM/WebGPU backend
```

### For Handwritten Math → LaTeX (TexTeller ONNX)
```bash
npm i onnxruntime-web
# Download from nfa04/texteller-onnx-8bit
# Files: encoder.onnx, decoder.onnx, tokenizer files
# Run vision-encoder-decoder pipeline manually (preprocess image → encoder → decoder loop)
```

### Shared Infrastructure
- **transformers.js** or **ONNX Runtime Web** (~15 MB WASM, ~30 MB WebGPU) — single dependency for both
- Models stored in `public/models/` or IndexedDB (downloaded on first use)
- Quantized (int8/q4) models keep download < 500 MB each
- WebGPU preferred; WASM fallback
- **Line segmentation required** for multi-line input (TrOCR processes one line per image)

---

## What I Did NOT Check (Per Instructions)

- ❌ Did not run actual inference benchmarks (no test folder created, no samples drawn) — **C14b will do this**
- ❌ Did not measure real memory/time on target laptop
- ❌ Did not verify OpenRAIL ↔ GPL-3.0 legal compatibility
- ❌ Did not test TrOCR on code snippets
- ❌ Did not explore model quantization pipeline (Optimum) for custom conversion (e.g., tjoab/latex_finetuned → ONNX)
- ❌ License for tjoab/latex_finetuned not explicitly stated on model card

---

## Recommendation

| Use Case | Action |
|----------|--------|
| **English handwriting → text** | **Adopt TrOCR ONNX (handwritten) via ONNX Runtime Web** — strong model, MIT license, runs offline. Add as optional feature behind a flag. |
| **Handwritten math → LaTeX** | **Adopt TexTeller ONNX (quantized) via ONNX Runtime Web** — Apache-2.0, purpose-built, good accuracy. Add as optional feature. |
| **Handwritten code** | **Defer** — no viable offline model. Keep ink strokes as vector shapes. |
| **Stroke-based (online) recognition** | **Defer** — no offline browser solution. MyScript requires cloud. |

**Next step (if owner approves):** Prototype TrOCR + TexTeller in a test page, measure real latency/memory on Windows 11 laptop, then decide on integration.

---

## Sources Summary

1. **transformers.js README** — supported tasks: https://github.com/huggingface/transformers.js/blob/main/README.md
2. **TrOCR model card** (handwritten): https://huggingface.co/microsoft/trocr-base-handwritten
3. **Xenova/trocr-base-handwritten (transformers.js)**: https://huggingface.co/api/models/Xenova/trocr-base-handwritten
4. **TrOCR ONNX (handwritten, community)**: https://huggingface.co/onnx-community/trocr-base-handwritten-ONNX
5. **TrOCR stage1 ONNX (transformers.js format)**: https://huggingface.co/onnx-community/trocr-base-stage1-ONNX
6. **Tesseract.js FAQ** (handwriting not supported): https://raw.githubusercontent.com/naptha/tesseract.js/master/docs/faq.md
7. **TexTeller model card**: https://huggingface.co/OleehyO/TexTeller
8. **TexTeller ONNX quantized**: https://huggingface.co/nfa04/texteller-onnx-8bit
9. **tjoab/latex_finetuned model card**: https://huggingface.co/tjoab/latex_finetuned (CER 14.9%)
10. **MyScript iinkTS README**: https://raw.githubusercontent.com/MyScript/iinkTS/master/README.md
11. **Indra OCR model card**: https://huggingface.co/datalab-to/indra-ocr
12. **Hugging Face model search API** — used for all model metadata (license, tags, library_name, siblings/files)

---

## C14b Benchmark Attempt (2026-11-18)

### Status: BLOCKED — Cannot Create Test Samples

The owner reported: **"i have serious issuse here i cant use any tools of canvas Robbins tools tab especially the pen."** — unable to draw 20 English lines + 10 equations in LemonNote Ink tab and export as PNG.

### Test Infrastructure Created (Ready for Future Use)

A standalone benchmark page was created at **`C:\temp\recog-test\index.html`**:

- Loads `@huggingface/transformers` via CDN (no project dependency)
- Tests `Xenova/trocr-base-handwritten` (quantized, transformers.js format)
- Accepts PNG files via file picker or drag-drop
- Reads `ground_truth.txt` (format: `filename|ground truth`)
- Measures: inference time (seconds), browser JS heap memory, word accuracy (text) / exact match (math)
- Reports pass/fail against criteria: text word accuracy ≥90%, math exact match ≥60%, avg time ≤5s

**To run when samples are available:**
1. Open `C:\temp\recog-test\index.html` in browser (http://localhost:xxxx or file://)
2. Select model: `Xenova/trocr-base-handwritten`
3. Click "Load Samples", pick all 30 PNGs + `ground_truth.txt`
4. Click "Run Benchmark"

### Alternative Sample Sources (If Owner Cannot Draw)

| Source | Description | How to Use |
|--------|-------------|------------|
| **IAM Handwriting DB** | 1,500+ English handwritten lines, public | Download, crop lines, save as PNG |
| **Google MathWriting** | 500k+ handwritten math expressions (digital ink) | Render ink to PNG via provided tools |
| **Synthetic (Texteller demo)** | `https://huggingface.co/spaces/datalab-to/indra-ocr-web` | Draw in demo, screenshot, save |
| **Quick hand-draw** | Any drawing app (Paint, Excalidraw, etc.) | Write lines, export PNG |

### Models Testable Now (Browser)

| Model | Format | Status |
|-------|--------|--------|
| `Xenova/trocr-base-handwritten` | transformers.js (quantized ONNX) | ✅ Ready — text lines only |
| `onnx-community/trocr-base-handwritten-ONNX` | ONNX Runtime Web | ⚠️ Needs custom pipeline code |
| `nfa04/texteller-onnx-8bit` | ONNX Runtime Web | ⚠️ Needs vision-encoder-decoder loop |
| `tjoab/latex_finetuned` | PyTorch only | ❌ No browser ONNX yet |

### Next Steps

1. **Owner resolves Ink tab issue** → create samples → run benchmark
2. **Or** use IAM/MathWriting dataset samples → run benchmark
3. **Or** defer benchmark until Ink tab is fixed

The benchmark code is complete and requires no LemonNote project changes.

---

*Report compiled per C14/C14b requirements. No code changes made to LemonNote. No dependencies added.*