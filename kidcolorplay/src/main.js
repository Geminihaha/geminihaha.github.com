import { createIcons, icons } from 'lucide';
import confetti from 'canvas-confetti';
import { CanvasEngine } from './canvas.js';
import { soundManager } from './audio.js';
import { processEdgeDetection } from './edge-detection.js';

// Vibrant Kids Color Palette
const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', 
  '#00C7BE', '#30B0C7', '#32ADE6', '#007AFF', 
  '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', 
  '#8E8E93', '#1C1C1E', '#FFB3BA', '#FFFFBA'
];

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  createIcons({ icons });

  // DOM Elements
  const bgCanvas = document.getElementById('bg-canvas');
  const drawCanvas = document.getElementById('draw-canvas');
  const canvasContainer = document.getElementById('canvas-container');

  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnClear = document.getElementById('btn-clear');
  const btnSave = document.getElementById('btn-save');
  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');

  const toolBtns = document.querySelectorAll('.tool-mode');
  const sizeSlider = document.getElementById('size-slider');
  const sizePreview = document.getElementById('size-preview');
  const colorPalette = document.getElementById('color-palette');
  const customColorPicker = document.getElementById('custom-color-picker');

  const modalTemplates = document.getElementById('modal-templates');
  const btnOpenTemplates = document.getElementById('btn-open-templates');
  const btnCloseTemplates = document.getElementById('btn-close-templates');
  const templateCards = document.querySelectorAll('.template-card');

  const imageLoader = document.getElementById('image-loader');
  const modalFilter = document.getElementById('modal-filter');
  const btnCloseFilter = document.getElementById('btn-close-filter');
  const filterPreviewCanvas = document.getElementById('filter-preview-canvas');
  const filterThreshold = document.getElementById('filter-threshold');
  const btnApplyOriginal = document.getElementById('btn-apply-original');
  const btnApplyFilter = document.getElementById('btn-apply-filter');

  const brushCursor = document.getElementById('brush-cursor');

  let uploadedImageObj = null;

  // Initialize Canvas Engine
  const engine = new CanvasEngine(bgCanvas, drawCanvas, canvasContainer);
  engine.resizeCanvas();

  // Load default template (dinosaur)
  const defaultImg = new Image();
  defaultImg.onload = () => {
    engine.setTemplateImage(defaultImg);
  };
  defaultImg.src = './templates/dinosaur.jpg';

  // Render Color Palette
  COLORS.forEach((color, index) => {
    const btn = document.createElement('div');
    btn.className = `color-btn ${index === 0 ? 'selected' : ''}`;
    btn.style.backgroundColor = color;
    btn.setAttribute('data-color', color);

    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      engine.color = color;
      soundManager.playPopSound();
      updateSizePreview();
    });

    colorPalette.appendChild(btn);
  });

  // Custom Color Picker
  customColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    engine.color = color;
    updateSizePreview();
  });

  // History Callback
  engine.onHistoryChange = (canUndo, canRedo) => {
    btnUndo.disabled = !canUndo;
    btnRedo.disabled = !canRedo;
  };

  btnUndo.addEventListener('click', () => {
    engine.undo();
    soundManager.playPopSound(350);
  });

  btnRedo.addEventListener('click', () => {
    engine.redo();
    soundManager.playPopSound(450);
  });

  // Clear Action
  btnClear.addEventListener('click', () => {
    soundManager.playClearSound();
    if (confirm('그림을 모두 지우고 다시 시작할까요? 🤔')) {
      engine.clearDrawingCanvas(true);
    }
  });

  // Save & Celebration
  btnSave.addEventListener('click', () => {
    soundManager.playSuccessSound();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const dataUrl = engine.exportImage();
    const link = document.createElement('a');
    link.download = `내색칠작품_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  });

  // Sound Toggle
  btnSound.addEventListener('click', () => {
    const isEnabled = soundManager.toggleSound();
    soundIcon.setAttribute('data-lucide', isEnabled ? 'volume-2' : 'volume-x');
    createIcons({ icons });
    soundManager.playPopSound(isEnabled ? 600 : 200);
  });

  // Tool Buttons
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tool = btn.getAttribute('data-tool');
      engine.tool = tool;
      soundManager.playPopSound(520);
      updateSizePreview();
    });
  });

  // Size Slider
  sizeSlider.addEventListener('input', (e) => {
    engine.brushSize = parseInt(e.target.value, 10);
    updateSizePreview();
  });

  function updateSizePreview() {
    const size = engine.brushSize;
    sizePreview.style.setProperty('--preview-size', `${size}px`);
    
    // Custom inline style for preview dot
    const styleId = 'size-preview-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `#size-preview::after { width: ${size}px; height: ${size}px; background-color: ${engine.tool === 'eraser' ? '#aaa' : engine.color}; }`;

    // Cursor update
    brushCursor.style.width = `${size}px`;
    brushCursor.style.height = `${size}px`;
  }
  updateSizePreview();

  // Brush Cursor Overlay on Canvas
  drawCanvas.addEventListener('pointerenter', () => {
    brushCursor.classList.remove('hidden');
  });
  drawCanvas.addEventListener('pointerleave', () => {
    brushCursor.classList.add('hidden');
  });
  drawCanvas.addEventListener('pointermove', (e) => {
    brushCursor.style.left = `${e.clientX}px`;
    brushCursor.style.top = `${e.clientY}px`;
  });

  // Modal Open/Close - Templates
  btnOpenTemplates.addEventListener('click', () => {
    soundManager.playPopSound();
    modalTemplates.classList.remove('hidden');
  });
  btnCloseTemplates.addEventListener('click', () => {
    modalTemplates.classList.add('hidden');
  });

  templateCards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-src');
      soundManager.playSuccessSound();

      if (src === 'blank') {
        engine.setTemplateImage(null);
      } else {
        const img = new Image();
        img.onload = () => {
          engine.setTemplateImage(img);
        };
        img.src = src;
      }
      modalTemplates.classList.add('hidden');
    });
  });

  // External Image Upload & Edge Detection Filter
  imageLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    soundManager.playPopSound();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        uploadedImageObj = img;
        // Open Edge Detection Filter Modal
        processEdgeDetection(img, filterPreviewCanvas, parseInt(filterThreshold.value, 10));
        modalFilter.classList.remove('hidden');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = '';
  });

  filterThreshold.addEventListener('input', () => {
    if (uploadedImageObj) {
      processEdgeDetection(uploadedImageObj, filterPreviewCanvas, parseInt(filterThreshold.value, 10));
    }
  });

  btnCloseFilter.addEventListener('click', () => {
    modalFilter.classList.add('hidden');
  });

  btnApplyOriginal.addEventListener('click', () => {
    if (uploadedImageObj) {
      engine.setTemplateImage(uploadedImageObj);
      soundManager.playSuccessSound();
    }
    modalFilter.classList.add('hidden');
  });

  btnApplyFilter.addEventListener('click', () => {
    if (filterPreviewCanvas) {
      const filterImg = new Image();
      filterImg.onload = () => {
        engine.setTemplateImage(filterImg);
        soundManager.playSuccessSound();
      };
      filterImg.src = filterPreviewCanvas.toDataURL('image/png');
    }
    modalFilter.classList.add('hidden');
  });
});
