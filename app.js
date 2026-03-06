// 单位转换常量
const MM_TO_INCH = 0.0393701; // 毫米转英寸
const INCH_TO_MM = 25.4; // 英寸转毫米

// 预设尺寸配置
const presetSizes = {
    'A4': { width: 210, height: 297 },
    'A3': { width: 297, height: 420 },
    'A2': { width: 420, height: 594 },
    'A1': { width: 594, height: 841 },
    'A0': { width: 841, height: 1189 },
    'Letter': { width: 215.9, height: 279.4 },
    'Legal': { width: 215.9, height: 355.6 },
    'Tabloid': { width: 279.4, height: 431.8 }
};

// 应用状态
let appState = {
    canvasWidth: 210, // 画布宽度（毫米）
    canvasHeight: 297, // 画布高度（毫米）
    ppi: 300, // 像素每英寸
    colorMode: 'RGB', // 颜色模式
    bgColor: '#ffffff', // 背景颜色
    importedImages: [], // 导入的图片
    placedImages: [], // 已放置在画布上的图片
    currentImage: null, // 当前正在处理的图片
    selectedImage: null, // 当前选中的单个图片
    selectedImages: [] // 批量选择的图片
};

// 标注状态
let annotationState = {
    isDrawing: false, // 是否正在绘制标注线
    isDraggingStart: false, // 是否正在拖动起点
    isDraggingEnd: false, // 是否正在拖动终点
    startPoint: null, // 标注线起点
    endPoint: null, // 标注线终点
    image: null, // 当前标注的图片
    scale: 1, // 缩放比例
    visualScale: 1, // 视觉缩放比例
    mmPerPixel: 1, // 每像素毫米数，默认值，避免 NaN
    // 用于重新标注时保存原图片信息
    originalPlacedImage: null, // 原始放置的图片
    isReannotate: false // 是否是重新标注
};

// 画布状态
let canvasState = {
    isDragging: false, // 是否正在拖动
    dragStart: null, // 拖动开始位置
    zoom: 1, // 画布缩放比例
    guideLines: [], // 辅助线
    // 画布位置（用于拖动）
    canvasX: 0, // 画布X位置
    canvasY: 0, // 画布Y位置
    // 框选相关
    isSelecting: false, // 是否正在框选
    selectionStart: null, // 框选开始位置
    selectionEnd: null, // 框选结束位置
    // 拖动相关
    initialPositions: null // 拖动开始时的初始位置
};

const mainCanvas = document.getElementById('mainCanvas');
const mainCtx = mainCanvas.getContext('2d');
const annotationCanvas = document.getElementById('annotationCanvas');
const annotationCtx = annotationCanvas.getContext('2d');
const annotationCanvasContainer = document.getElementById('annotationCanvasContainer');
const imageToolbar = document.getElementById('imageToolbar');

const elements = {
    presetSize: document.getElementById('presetSize'),
    canvasWidth: document.getElementById('canvasWidth'),
    canvasHeight: document.getElementById('canvasHeight'),
    ppi: document.getElementById('ppi'),
    colorMode: document.getElementById('colorMode'),
    bgColor: document.getElementById('bgColor'),
    imageMargin: document.getElementById('imageMargin'),
    applyCanvasSettings: document.getElementById('applyCanvasSettings'),
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    imageList: document.getElementById('imageList'),
    imageListPanel: document.getElementById('imageListPanel'),
    saveBtn: document.getElementById('saveBtn'),
    loadBtn: document.getElementById('loadBtn'),
    clearCanvasBtn: document.getElementById('clearCanvasBtn'),
    arrangeBtn: document.getElementById('arrangeBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    loadJsonBtn: document.getElementById('loadJsonBtn'),
    exportBtn: document.getElementById('exportBtn'),
    annotationModal: document.getElementById('annotationModal'),
    sizeSettingMethod: document.getElementById('sizeSettingMethod'),
    annotationLength: document.getElementById('annotationLength'),
    imageWidthMm: document.getElementById('imageWidthMm'),
    imageHeightMm: document.getElementById('imageHeightMm'),
    keepAspectRatio: document.getElementById('keepAspectRatio'),
    annotationMethod: document.getElementById('annotationMethod'),
    directMethod: document.getElementById('directMethod'),
    clearAnnotation: document.getElementById('clearAnnotation'),
    cancelAnnotation: document.getElementById('cancelAnnotation'),
    confirmAnnotation: document.getElementById('confirmAnnotation'),
    closeModal: document.getElementById('closeModal'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomFit: document.getElementById('zoomFit'),
    zoomLevel: document.getElementById('zoomLevel'),
    exportModal: document.getElementById('exportModal'),
    exportFormat: document.getElementById('exportFormat'),
    jpegQuality: document.getElementById('jpegQuality'),
    jpegQualityGroup: document.getElementById('jpegQualityGroup'),
    qualityValue: document.getElementById('qualityValue'),
    cancelExport: document.getElementById('cancelExport'),
    confirmExport: document.getElementById('confirmExport'),
    closeExportModal: document.getElementById('closeExportModal'),
    canvasZoomIn: document.getElementById('canvasZoomIn'),
    canvasZoomOut: document.getElementById('canvasZoomOut'),
    canvasZoomFit: document.getElementById('canvasZoomFit'),
    canvasZoomLevel: document.getElementById('canvasZoomLevel')
};

/**
 * 初始化应用
 */
function init() {
    // 设置事件监听器
    setupEventListeners();
    // 初始化画布
    initCanvas();
    // 渲染主画布
    renderMainCanvas();
    // 适配画布大小
    canvasZoomFit();
    // 初始化预设尺寸选择的显示状态
    handlePresetChange();
    
    // 检查是否有临时存档，如果有则自动加载
    const savedData = localStorage.getItem('sizeSettingCanvas');
    if (savedData) {
        const data = JSON.parse(savedData);
        appState.canvasWidth = data.appState.canvasWidth;
        appState.canvasHeight = data.appState.canvasHeight;
        appState.ppi = data.appState.ppi;
        appState.colorMode = data.appState.colorMode;
        appState.bgColor = data.appState.bgColor;
        
        // 更新UI元素
        elements.canvasWidth.value = appState.canvasWidth;
        elements.canvasHeight.value = appState.canvasHeight;
        elements.ppi.value = appState.ppi;
        elements.colorMode.value = appState.colorMode;
        elements.bgColor.value = appState.bgColor;
        
        // 重新初始化画布
        initCanvas();
        
        // 加载保存的图片
        appState.placedImages = [];
        const loadPromises = data.appState.placedImages.map(imgData => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        ...imgData,
                        image: img
                    });
                };
                img.src = imgData.imageSrc;
            });
        });
        
        // 所有图片加载完成后
        Promise.all(loadPromises).then(images => {
            appState.placedImages = images;
            renderMainCanvas();
            canvasZoomFit();
            
            // 初始化完成后隐藏loading画面
            setTimeout(function() {
                const loading = document.getElementById('loading');
                if (loading) {
                    loading.classList.add('hidden');
                }
            }, 500);
        });
    } else {
        // 没有临时存档，直接隐藏loading画面
        setTimeout(function() {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.classList.add('hidden');
            }
        }, 500);
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 预设尺寸变化
    elements.presetSize.addEventListener('change', handlePresetChange);
    
    // 自动应用画布设置
    elements.canvasWidth.addEventListener('change', applyCanvasSettings);
    elements.canvasHeight.addEventListener('change', applyCanvasSettings);
    elements.ppi.addEventListener('change', applyCanvasSettings);
    elements.colorMode.addEventListener('change', applyCanvasSettings);
    elements.bgColor.addEventListener('change', applyCanvasSettings);
    elements.imageMargin.addEventListener('change', applyCanvasSettings);
    elements.applyCanvasSettings.addEventListener('click', applyCanvasSettings);
    
    // 文件选择和拖拽
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    
    // 画布操作
    elements.saveBtn.addEventListener('click', saveCanvas);
    elements.loadBtn.addEventListener('click', loadCanvas);
    elements.clearCanvasBtn.addEventListener('click', clearCanvas);
    elements.arrangeBtn.addEventListener('click', arrangeImages);
    
    // JSON导出导入
    elements.exportJsonBtn.addEventListener('click', exportJson);
    elements.loadJsonBtn.addEventListener('click', loadJson);
    
    // 图片导出
    elements.exportBtn.addEventListener('click', openExportModal);
    
    // 标注相关
    elements.clearAnnotation.addEventListener('click', clearAnnotation);
    elements.cancelAnnotation.addEventListener('click', closeAnnotationModal);
    elements.confirmAnnotation.addEventListener('click', confirmAnnotation);
    elements.closeModal.addEventListener('click', closeAnnotationModal);
    
    // 标注画布缩放
    elements.zoomInBtn.addEventListener('click', zoomIn);
    elements.zoomOutBtn.addEventListener('click', zoomOut);
    elements.zoomFit.addEventListener('click', zoomFit);
    
    // 主画布缩放
    elements.canvasZoomIn.addEventListener('click', canvasZoomIn);
    elements.canvasZoomOut.addEventListener('click', canvasZoomOut);
    elements.canvasZoomFit.addEventListener('click', canvasZoomFit);
    
    // 导出设置
    elements.exportFormat.addEventListener('change', handleExportFormatChange);
    elements.jpegQuality.addEventListener('input', handleQualityChange);
    elements.cancelExport.addEventListener('click', closeExportModal);
    elements.confirmExport.addEventListener('click', doExport);
    elements.closeExportModal.addEventListener('click', closeExportModal);
    
    // 尺寸设置方式切换
    elements.sizeSettingMethod.addEventListener('change', function() {
        const method = elements.sizeSettingMethod.value;
        if (method === 'annotation') {
            elements.annotationMethod.style.display = 'block';
            elements.directMethod.style.display = 'none';
            // 切换回标注模式
            renderAnnotationCanvas();
        } else {
            elements.annotationMethod.style.display = 'none';
            elements.directMethod.style.display = 'block';
            // 切换到实时预览模式
            updateDirectPreview();
        }
    });
    
    // 宽度输入变化时保持宽高比
    elements.imageWidthMm.addEventListener('input', function() {
        if (elements.keepAspectRatio.checked && appState.currentImage) {
            const width = parseFloat(this.value);
            if (!isNaN(width) && width > 0) {
                const originalWidth = appState.currentImage.image.width;
                const originalHeight = appState.currentImage.image.height;
                const height = (width / originalWidth) * originalHeight;
                elements.imageHeightMm.value = height.toFixed(1);
                // 更新预览
                updateDirectPreview();
            }
        } else {
            // 不保持宽高比时也更新预览
            updateDirectPreview();
        }
    });
    
    // 高度输入变化时保持宽高比
    elements.imageHeightMm.addEventListener('input', function() {
        if (elements.keepAspectRatio.checked && appState.currentImage) {
            const height = parseFloat(this.value);
            if (!isNaN(height) && height > 0) {
                const originalWidth = appState.currentImage.image.width;
                const originalHeight = appState.currentImage.image.height;
                const width = (height / originalHeight) * originalWidth;
                elements.imageWidthMm.value = width.toFixed(1);
                // 更新预览
                updateDirectPreview();
            }
        } else {
            // 不保持宽高比时也更新预览
            updateDirectPreview();
        }
    });
    
    // 保持宽高比复选框变化
    elements.keepAspectRatio.addEventListener('change', function() {
        if (this.checked && appState.currentImage) {
            // 重新计算高度
            const width = parseFloat(elements.imageWidthMm.value);
            if (!isNaN(width) && width > 0) {
                const originalWidth = appState.currentImage.image.width;
                const originalHeight = appState.currentImage.image.height;
                const height = (width / originalWidth) * originalHeight;
                elements.imageHeightMm.value = height.toFixed(1);
            }
        }
        // 更新预览
        updateDirectPreview();
    });
    
    annotationCanvas.addEventListener('mousedown', handleAnnotationMouseDown);
    annotationCanvas.addEventListener('mousemove', handleAnnotationMouseMove);
    annotationCanvas.addEventListener('mouseup', handleAnnotationMouseUp);
    annotationCanvas.addEventListener('mouseleave', handleAnnotationMouseUp);
    
    // 将滚轮事件绑定到整个画布容器，避免在空白区域滚动时页面滚动
    const annotationCanvasWrapper = document.getElementById('annotationCanvasWrapper');
    if (annotationCanvasWrapper) {
        annotationCanvasWrapper.addEventListener('wheel', handleAnnotationWheel);
    }
    
    mainCanvas.addEventListener('mousedown', handleCanvasMouseDown);
    mainCanvas.addEventListener('mousemove', handleCanvasMouseMove);
    mainCanvas.addEventListener('mouseup', handleCanvasMouseUp);
    mainCanvas.addEventListener('mouseleave', handleCanvasMouseUp);
    mainCanvas.addEventListener('mouseenter', handleCanvasMouseEnter);
    
    // 鼠标右键拖动事件
    mainCanvas.addEventListener('contextmenu', function(e) {
        e.preventDefault(); // 阻止默认右键菜单
    });
    
    let isCanvasDragging = false;
    let canvasDragStart = null;
    
    mainCanvas.addEventListener('mousedown', function(e) {
        if (e.button === 2) { // 右键
            e.preventDefault();
            isCanvasDragging = true;
            canvasDragStart = {
                x: e.clientX - canvasState.canvasX,
                y: e.clientY - canvasState.canvasY
            };
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isCanvasDragging) {
            canvasState.canvasX = e.clientX - canvasDragStart.x;
            canvasState.canvasY = e.clientY - canvasDragStart.y;
            applyCanvasZoom();
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        isCanvasDragging = false;
    });
    
    document.addEventListener('mouseleave', function(e) {
        isCanvasDragging = false;
    });
    
    // 鼠标滚轮缩放功能
    mainCanvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.3, Math.min(3, canvasState.zoom * delta));
        
        if (newZoom !== canvasState.zoom) {
            // 计算鼠标在画布上的位置
            const rect = mainCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 计算缩放前的鼠标在画布坐标系中的位置
            const oldCanvasX = (mouseX - canvasState.canvasX) / canvasState.zoom;
            const oldCanvasY = (mouseY - canvasState.canvasY) / canvasState.zoom;
            
            // 更新缩放比例
            canvasState.zoom = newZoom;
            
            // 计算缩放后的画布位置，保持鼠标位置不变
            canvasState.canvasX = mouseX - oldCanvasX * newZoom;
            canvasState.canvasY = mouseY - oldCanvasY * newZoom;
            
            applyCanvasZoom();
        }
    });
    
    imageToolbar.addEventListener('click', handleImageToolbarClick);
    
    // 全局点击事件监听器，点击页面其他位置取消选中图片
    document.addEventListener('click', function(e) {
        // 检查点击的元素是否是按钮或工具栏
        const isButton = e.target.closest('button');
        const isToolbar = e.target.closest('.image-toolbar');
        const isCanvas = e.target.closest('canvas');
        
        // 如果点击的不是按钮、工具栏或画布，取消选中
        if (!isButton && !isToolbar && !isCanvas) {
            if (appState.selectedImage) {
                appState.selectedImage = null;
                renderMainCanvas();
                updateToolbarButtons();
            }
        }
    });
    
    // 添加键盘delete键快捷键
    document.addEventListener('keydown', function(e) {
        // 检查是否按下了delete键
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // 检查是否有选中的图片
            const imagesToDelete = appState.selectedImages.length > 0 ? appState.selectedImages : (appState.selectedImage ? [appState.selectedImage] : []);
            if (imagesToDelete.length > 0) {
                // 删除所有选中的图片
                imagesToDelete.forEach(img => {
                    const index = appState.placedImages.findIndex(i => i.id === img.id);
                    if (index > -1) {
                        appState.placedImages.splice(index, 1);
                    }
                });
                // 清空选择
                appState.selectedImage = null;
                appState.selectedImages = [];
                // 重新渲染和更新工具栏
                renderMainCanvas();
                updateToolbarButtons();
            }
        }
    });
}

function handlePresetChange() {
    const preset = elements.presetSize.value;
    if (preset && preset !== 'custom') {
        const size = presetSizes[preset];
        elements.canvasWidth.value = size.width;
        elements.canvasHeight.value = size.height;
        // 隐藏宽度和高度输入框
        elements.canvasWidth.parentElement.style.display = 'none';
        elements.canvasHeight.parentElement.style.display = 'none';
        applyCanvasSettings();
    } else {
        // 显示宽度和高度输入框
        elements.canvasWidth.parentElement.style.display = 'block';
        elements.canvasHeight.parentElement.style.display = 'block';
    }
}

function applyCanvasSettings() {
    // 保存当前PPI值用于比较
    const oldPPI = appState.ppi;
    
    // 更新画布大小（无论是否是自定义尺寸）
    appState.canvasWidth = parseFloat(elements.canvasWidth.value) || 210;
    appState.canvasHeight = parseFloat(elements.canvasHeight.value) || 297;
    
    appState.ppi = parseInt(elements.ppi.value) || 300;
    appState.colorMode = elements.colorMode.value;
    appState.bgColor = elements.bgColor.value;
    
    // 检查PPI是否发生变化
    const ppiChanged = oldPPI !== appState.ppi;
    initCanvas(ppiChanged);
    renderMainCanvas();
}

function initCanvas(ppiChanged) {
    // 保存已放置的图片信息
    const savedImages = appState.placedImages.map(img => ({
        ...img,
        // 保存图片相对于画布中心的位置比例
        centerXRatio: (img.x + img.width / 2) / mainCanvas.width,
        centerYRatio: (img.y + img.height / 2) / mainCanvas.height,
        // 保存图片的像素尺寸
        originalWidth: img.width,
        originalHeight: img.height
    }));
    
    const widthPx = Math.round(appState.canvasWidth * MM_TO_INCH * appState.ppi);
    const heightPx = Math.round(appState.canvasHeight * MM_TO_INCH * appState.ppi);
    mainCanvas.width = widthPx;
    mainCanvas.height = heightPx;
    
    // 恢复图片位置和尺寸
    if (savedImages.length > 0) {
        savedImages.forEach((savedImg, index) => {
            if (appState.placedImages[index]) {
                // 计算新的中心位置
                const newCenterX = savedImg.centerXRatio * widthPx;
                const newCenterY = savedImg.centerYRatio * heightPx;
                
                if (ppiChanged) {
                    // PPI改变时，等比缩放图片
                    const scaleFactor = appState.ppi / (savedImg.ppi || 300);
                    const newWidth = savedImg.originalWidth * scaleFactor;
                    const newHeight = savedImg.originalHeight * scaleFactor;
                    
                    appState.placedImages[index].width = newWidth;
                    appState.placedImages[index].height = newHeight;
                    appState.placedImages[index].x = newCenterX - newWidth / 2;
                    appState.placedImages[index].y = newCenterY - newHeight / 2;
                    // 保存当前PPI值
                    appState.placedImages[index].ppi = appState.ppi;
                } else {
                    // 预设尺寸改变时，保持图片像素尺寸不变，只改变位置
                    appState.placedImages[index].width = savedImg.originalWidth;
                    appState.placedImages[index].height = savedImg.originalHeight;
                    appState.placedImages[index].x = newCenterX - savedImg.originalWidth / 2;
                    appState.placedImages[index].y = newCenterY - savedImg.originalHeight / 2;
                }
            }
        });
    }
}

function handleFileSelect(e) {
    processFiles(e.target.files);
    // 重置文件输入，以便可以重复选择同一个文件
    e.target.value = '';
}

function handleDragOver(e) {
    e.preventDefault();
    elements.dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    processFiles(e.dataTransfer.files);
}

function processFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const imgData = {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        src: e.target.result,
                        width: img.width,
                        height: img.height,
                        image: img
                    };
                    appState.importedImages.push(imgData);
                    updateImageList();
                    setTimeout(() => {
                        openAnnotationModal(imgData.id);
                    }, 100);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateImageList() {
    elements.imageList.innerHTML = appState.importedImages.map(img => `
        <div class="image-item" data-id="${img.id}">
            <img src="${img.src}" class="image-item-thumb" alt="${img.name}">
            <div class="image-item-info">
                <div class="image-item-name">${img.name}</div>
            </div>
        </div>
    `).join('');
    
    // 根据是否有图片来显示/隐藏面板
    if (appState.importedImages.length > 0) {
        elements.imageListPanel.style.display = 'block';
    } else {
        elements.imageListPanel.style.display = 'none';
    }
    
    document.querySelectorAll('.image-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            openAnnotationModal(item.dataset.id);
        });
    });
}

function openAnnotationModal(imageId) {
    const img = appState.importedImages.find(i => i.id == imageId);
    if (!img) return;
    appState.currentImage = img;
    annotationState.image = img.image;
    annotationState.visualScale = 1;
    
    // 使用原始图片尺寸计算缩放
    const originalWidth = img.image.width;
    const originalHeight = img.image.height;
    
    const maxWidth = 800;
    const maxHeight = 600;
    let scale = 1;
    if (originalWidth > maxWidth) {
        scale = maxWidth / originalWidth;
    }
    if (originalHeight * scale > maxHeight) {
        scale = maxHeight / originalHeight;
    }
    
    annotationState.scale = scale;
    
    annotationCanvas.width = originalWidth * scale;
    annotationCanvas.height = originalHeight * scale;
    
    // 设置直接输入尺寸的默认值为原图尺寸（假设默认100mm宽度）
    const defaultWidthMm = 100;
    const defaultHeightMm = (defaultWidthMm / originalWidth) * originalHeight;
    elements.imageWidthMm.value = defaultWidthMm.toFixed(1);
    elements.imageHeightMm.value = defaultHeightMm.toFixed(1);
    
    // 如果有上一次的标注信息，恢复它
    if (img.lastAnnotation) {
        const lastAnn = img.lastAnnotation;
        elements.annotationLength.value = lastAnn.length || 100;
        if (lastAnn.startPoint && lastAnn.endPoint) {
            // 标注点坐标已经是相对于标注界面 canvas 的，直接使用
            annotationState.startPoint = {
                x: lastAnn.startPoint.x,
                y: lastAnn.startPoint.y
            };
            annotationState.endPoint = {
                x: lastAnn.endPoint.x,
                y: lastAnn.endPoint.y
            };
        }
    } else {
        annotationState.startPoint = null;
        annotationState.endPoint = null;
    }
    
    renderAnnotationCanvas();
    
    // 重置 transform-origin 到中心
    if (annotationCanvasContainer) {
        annotationCanvasContainer.style.transformOrigin = '50% 50%';
        annotationCanvasContainer.style.transform = 'scale(1)';
    }
    
    updateZoomLevel();
    elements.annotationModal.classList.add('active');
    
    // 触发设置方式的显示逻辑
    elements.sizeSettingMethod.dispatchEvent(new Event('change'));
}

function closeAnnotationModal() {
    // 如果是重新标注且点击取消，清除状态，不做任何改动
    if (annotationState.isReannotate) {
        annotationState.originalPlacedImage = null;
        annotationState.isReannotate = false;
    }
    
    elements.annotationModal.classList.remove('active');
    appState.currentImage = null;
}

// 实时预览直接输入尺寸的效果
function updateDirectPreview() {
    if (elements.sizeSettingMethod.value !== 'direct' || !appState.currentImage) return;
    
    const ctx = annotationCtx;
    const img = appState.currentImage.image;
    
    // 清除画布
    ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    
    // 计算预览尺寸
    const widthMm = parseFloat(elements.imageWidthMm.value);
    const heightMm = parseFloat(elements.imageHeightMm.value);
    
    if (!isNaN(widthMm) && !isNaN(heightMm) && widthMm > 0 && heightMm > 0) {
        // 计算输入的宽高比
        const inputAspectRatio = widthMm / heightMm;
        
        // 计算预览图片的显示尺寸，保持输入的宽高比
        let previewWidth, previewHeight;
        const canvasAspectRatio = annotationCanvas.width / annotationCanvas.height;
        
        if (inputAspectRatio > canvasAspectRatio) {
            // 输入图片更宽，以画布宽度为基准
            previewWidth = annotationCanvas.width;
            previewHeight = previewWidth / inputAspectRatio;
        } else {
            // 输入图片更高，以画布高度为基准
            previewHeight = annotationCanvas.height;
            previewWidth = previewHeight * inputAspectRatio;
        }
        
        // 居中绘制图片
        const x = (annotationCanvas.width - previewWidth) / 2;
        const y = (annotationCanvas.height - previewHeight) / 2;
        
        // 绘制图片
        ctx.drawImage(img, x, y, previewWidth, previewHeight);
        
        // 绘制预览边框
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, previewWidth, previewHeight);
        
        // 显示尺寸信息
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`${widthMm.toFixed(1)} × ${heightMm.toFixed(1)} mm`, x + 10, y + 10);
    } else {
        // 如果输入无效，显示原始图片
        ctx.drawImage(img, 0, 0, annotationCanvas.width, annotationCanvas.height);
    }
}

function renderAnnotationCanvas() {
    const ctx = annotationCtx;
    const scale = annotationState.scale;
    ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    ctx.drawImage(annotationState.image, 0, 0, annotationCanvas.width, annotationCanvas.height);
    if (annotationState.startPoint && annotationState.endPoint) {
        // 保存当前状态
        ctx.save();
        
        // 绘制线段
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(annotationState.startPoint.x, annotationState.startPoint.y);
        ctx.lineTo(annotationState.endPoint.x, annotationState.endPoint.y);
        ctx.stroke();
        
        // 绘制端点
        drawHandle(ctx, annotationState.startPoint);
        drawHandle(ctx, annotationState.endPoint);
        
        // 恢复保存的状态
        ctx.restore();
        
        // 移除数字显示
        // drawAnnotationText(ctx, annotationState.startPoint, annotationState.endPoint);
    }
}

function drawHandle(ctx, point) {
    // 绘制端点阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 绘制端点
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawAnnotationText(ctx, startPoint, endPoint) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy) / annotationState.scale;
    const lengthMm = length * annotationState.mmPerPixel;
    const text = lengthMm.toFixed(1) + ' mm';
    
    // 计算文本位置（线段中点）
    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2 - 15; // 上方15像素
    
    // 绘制文本背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 测量文本宽度
    ctx.font = '12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制文本背景
    const metrics = ctx.measureText(text);
    const padding = 8;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 20;
    ctx.fillRect(midX - bgWidth / 2, midY - bgHeight / 2, bgWidth, bgHeight);
    
    // 绘制文本
    ctx.fillStyle = '#2c3e50';
    ctx.font = '500 12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillText(text, midX, midY);
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function getAnnotationMousePos(e) {
    const rect = annotationCanvas.getBoundingClientRect();
    const scaleX = annotationCanvas.width / rect.width;
    const scaleY = annotationCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function isNearPoint(p1, p2, threshold = 12) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
}

function handleAnnotationMouseDown(e) {
    // 在直接输入尺寸模式下禁用标注
    if (elements.sizeSettingMethod.value === 'direct') {
        return;
    }
    
    const pos = {
        x: e.offsetX,
        y: e.offsetY
    };
    
    if (annotationState.startPoint && isNearPoint(pos, annotationState.startPoint)) {
        annotationState.isDraggingStart = true;
        return;
    }
    if (annotationState.endPoint && isNearPoint(pos, annotationState.endPoint)) {
        annotationState.isDraggingEnd = true;
        return;
    }
    annotationState.isDrawing = true;
    annotationState.startPoint = pos;
    annotationState.endPoint = { ...pos };
    renderAnnotationCanvas();
}

function handleAnnotationMouseMove(e) {
    // 在直接输入尺寸模式下禁用标注
    if (elements.sizeSettingMethod.value === 'direct') {
        return;
    }
    
    const pos = {
        x: e.offsetX,
        y: e.offsetY
    };
    
    if (annotationState.isDraggingStart) {
        annotationState.startPoint = pos;
        renderAnnotationCanvas();
        return;
    }
    if (annotationState.isDraggingEnd) {
        annotationState.endPoint = pos;
        renderAnnotationCanvas();
        return;
    }
    if (annotationState.isDrawing) {
        annotationState.endPoint = pos;
        renderAnnotationCanvas();
    }
}

function handleAnnotationMouseUp(e) {
    // 在直接输入尺寸模式下禁用标注
    if (elements.sizeSettingMethod.value === 'direct') {
        return;
    }
    
    annotationState.isDrawing = false;
    annotationState.isDraggingStart = false;
    annotationState.isDraggingEnd = false;
}

function handleAnnotationWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = annotationState.visualScale * delta;
    if (newScale < 0.2 || newScale > 20) return;
    
    const container = annotationCanvasContainer.parentElement;
    if (!container) return;
    
    // 获取容器的位置
    const containerRect = container.getBoundingClientRect();
    
    // 计算鼠标在容器内的位置（百分比）
    const originX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const originY = ((e.clientY - containerRect.top) / containerRect.height) * 100;
    
    // 设置 transform-origin 为鼠标位置
    annotationCanvasContainer.style.transformOrigin = `${originX}% ${originY}%`;
    
    // 应用缩放
    annotationState.visualScale = newScale;
    annotationCanvasContainer.style.transform = `scale(${newScale})`;
    
    updateZoomLevel();
}

function zoomIn() {
    const delta = 1.2;
    const newScale = Math.min(annotationState.visualScale * delta, 20);
    const container = annotationCanvasContainer.parentElement;
    if (!container) return;
    
    // 使用 canvas 中心作为缩放点
    annotationCanvasContainer.style.transformOrigin = '50% 50%';
    annotationState.visualScale = newScale;
    annotationCanvasContainer.style.transform = `scale(${newScale})`;
    
    updateZoomLevel();
}

function zoomOut() {
    const delta = 0.8;
    const newScale = Math.max(annotationState.visualScale * delta, 0.2);
    const container = annotationCanvasContainer.parentElement;
    if (!container) return;
    
    // 使用 canvas 中心作为缩放点
    annotationCanvasContainer.style.transformOrigin = '50% 50%';
    annotationState.visualScale = newScale;
    annotationCanvasContainer.style.transform = `scale(${newScale})`;
    
    updateZoomLevel();
}

function zoomFit() {
    const container = annotationCanvasContainer?.parentElement;
    if (!container) return;
    
    // 获取容器的可见区域尺寸
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // 获取 canvas 的原始尺寸（未缩放时）
    const canvasWidth = annotationCanvas.width;
    const canvasHeight = annotationCanvas.height;
    
    // 计算合适的缩放比例，使整张图适应容器
    const scaleX = containerWidth / canvasWidth;
    const scaleY = containerHeight / canvasHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // 不超过原始大小
    
    // 应用缩放
    annotationState.visualScale = newScale;
    annotationCanvasContainer.style.transform = `scale(${newScale})`;
    
    // 重置滚动到顶部
    container.scrollLeft = 0;
    container.scrollTop = 0;
    
    updateZoomLevel();
}

function updateZoomLevel() {
    const totalZoom = Math.round(annotationState.scale * annotationState.visualScale * 100);
    elements.zoomLevel.textContent = totalZoom + '%';
}

function canvasZoomIn() {
    const newZoom = canvasState.zoom * 1.2;
    if (newZoom > 3) return;
    canvasState.zoom = newZoom;
    applyCanvasZoom();
}

function canvasZoomOut() {
    const newZoom = canvasState.zoom * 0.8;
    canvasState.zoom = Math.max(newZoom, 0.3);
    applyCanvasZoom();
}

function canvasZoomFit() {
    const workspace = document.querySelector('.workspace');
    const wrapper = document.querySelector('.canvas-wrapper');
    if (!workspace || !wrapper) return;
    
    const workspaceWidth = workspace.clientWidth - 20;
    const workspaceHeight = workspace.clientHeight - 20;
    const canvasWidth = mainCanvas.width;
    const canvasHeight = mainCanvas.height;
    
    const scaleX = workspaceWidth / canvasWidth;
    const scaleY = workspaceHeight / canvasHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);
    
    canvasState.zoom = newZoom > 0.3 ? newZoom : 0.3;
    applyCanvasZoom();
}

function applyCanvasZoom() {
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${canvasState.canvasX}px, ${canvasState.canvasY}px) scale(${canvasState.zoom})`;
        wrapper.style.transformOrigin = 'center center';
    }
    elements.canvasZoomLevel.textContent = Math.round(canvasState.zoom * 100) + '%';
}

// 监听窗口大小变化，自动适配画布
window.addEventListener('resize', canvasZoomFit);

function clearAnnotation() {
    annotationState.startPoint = null;
    annotationState.endPoint = null;
    renderAnnotationCanvas();
}

function confirmAnnotation() {
    let imageWidthMm, imageHeightMm, realLengthMm, mmPerPixel;
    const method = elements.sizeSettingMethod.value;
    
    if (method === 'annotation') {
        if (!annotationState.startPoint || !annotationState.endPoint) {
            alert('请先在图片上画一条线段标注尺寸');
            return;
        }
        realLengthMm = parseFloat(elements.annotationLength.value);
        if (!realLengthMm || realLengthMm <= 0) {
            alert('请输入有效的实际长度');
            return;
        }
        const dx = (annotationState.endPoint.x - annotationState.startPoint.x) / annotationState.scale;
        const dy = (annotationState.endPoint.y - annotationState.startPoint.y) / annotationState.scale;
        const pixelLength = Math.sqrt(dx * dx + dy * dy);
        mmPerPixel = realLengthMm / pixelLength;
        
        // 保存 mmPerPixel 到 annotationState，用于实时显示
        annotationState.mmPerPixel = mmPerPixel;
        
        // 使用原始图片尺寸计算，而不是当前图片的尺寸
        const originalImage = appState.currentImage.image;
        imageWidthMm = originalImage.width * mmPerPixel;
        imageHeightMm = originalImage.height * mmPerPixel;
    } else {
        // 直接输入尺寸
        imageWidthMm = parseFloat(elements.imageWidthMm.value);
        imageHeightMm = parseFloat(elements.imageHeightMm.value);
        if (!imageWidthMm || !imageHeightMm || imageWidthMm <= 0 || imageHeightMm <= 0) {
            alert('请输入有效的图片尺寸');
            return;
        }
        realLengthMm = imageWidthMm; // 保存宽度作为标注长度
        mmPerPixel = imageWidthMm / appState.currentImage.image.width; // 计算每像素毫米数
    }
    
    // 计算图片在画布上的像素尺寸
    // 画布的像素尺寸 = 物理尺寸（毫米）* PPI / 25.4
    const canvasWidthPx = mainCanvas.width;
    const canvasHeightPx = mainCanvas.height;
    
    // 图片在画布上的像素尺寸应该基于物理尺寸的比例，与 PPI 无关
    // 使用 canvas 的物理尺寸（毫米）来计算比例
    const canvasWidthMm = appState.canvasWidth;
    const canvasHeightMm = appState.canvasHeight;
    
    // 图片像素尺寸 = (图片物理尺寸 / 画布物理尺寸) * 画布像素尺寸
    const imageWidthPx = (imageWidthMm / canvasWidthMm) * canvasWidthPx;
    const imageHeightPx = (imageHeightMm / canvasHeightMm) * canvasHeightPx;
    
    // 创建放置到画布的图片对象，保存标注信息
    const placedImg = {
        id: Date.now(),
        name: appState.currentImage.name,
        image: appState.currentImage.image,
        x: (canvasWidthPx - imageWidthPx) / 2,
        y: (canvasHeightPx - imageHeightPx) / 2,
        width: imageWidthPx,
        height: imageHeightPx,
        // 保存当前PPI值
        ppi: appState.ppi,
        // 保存图片相对于画布的比例（用于 PPI 改变时重新计算）
        widthRatio: imageWidthMm / canvasWidthMm,
        heightRatio: imageHeightMm / canvasHeightMm,
        // 保存标注信息供下次重新标注时使用
        lastAnnotationLength: method === 'annotation' ? realLengthMm : null,
        lastAnnotationStartPoint: method === 'annotation' && annotationState.startPoint ? {
            x: annotationState.startPoint.x / annotationState.scale,
            y: annotationState.startPoint.y / annotationState.scale
        } : null,
        lastAnnotationEndPoint: method === 'annotation' && annotationState.endPoint ? {
            x: annotationState.endPoint.x / annotationState.scale,
            y: annotationState.endPoint.y / annotationState.scale
        } : null
    };
    
    appState.placedImages.push(placedImg);
    
    // 如果是重新标注，删除原图片
    if (annotationState.isReannotate && annotationState.originalPlacedImage) {
        const originalIndex = appState.placedImages.findIndex(i => i.id === annotationState.originalPlacedImage.id);
        if (originalIndex > -1) {
            appState.placedImages.splice(originalIndex, 1);
        }
        // 清除重新标注状态
        annotationState.originalPlacedImage = null;
        annotationState.isReannotate = false;
    } else {
        // 首次标注，从导入列表中移除
        const index = appState.importedImages.findIndex(i => i.id === appState.currentImage.id);
        if (index > -1) {
            appState.importedImages.splice(index, 1);
        }
    }
    
    updateImageList();
    renderMainCanvas();
    closeAnnotationModal();
}

function renderMainCanvas() {
    // 清除之前的 filter
    mainCtx.filter = 'none';
    
    // 应用颜色模式 filter（只影响后续绘制）
    if (appState.colorMode === 'Grayscale') {
        mainCtx.filter = 'grayscale(100%)';
    }
    
    // 绘制背景
    mainCtx.fillStyle = appState.bgColor;
    mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    appState.placedImages.forEach(img => {
        mainCtx.save();
        
        // 如果有旋转角度，进行旋转
        if (img.rotation) {
            const centerX = img.x + img.width / 2;
            const centerY = img.y + img.height / 2;
            mainCtx.translate(centerX, centerY);
            mainCtx.rotate(img.rotation * Math.PI / 180);
            mainCtx.translate(-centerX, -centerY);
        }
        
        // 检查是否为无法放置的图片
        if (img.unplaced) {
            // 绘制半透明红色覆盖
            mainCtx.fillStyle = 'rgba(255, 100, 100, 0.5)';
            mainCtx.fillRect(img.x, img.y, img.width, img.height);
        }
        
        mainCtx.drawImage(img.image, img.x, img.y, img.width, img.height);
        
        // 为选中的图片添加边框
        if ((appState.selectedImage && appState.selectedImage.id === img.id) || 
            appState.selectedImages.some(selectedImg => selectedImg.id === img.id)) {
            mainCtx.strokeStyle = '#686868ff'; // 蓝色边框
            mainCtx.lineWidth = 10;
            mainCtx.strokeRect(img.x, img.y, img.width, img.height);
        }
        
        mainCtx.restore();
    });
    
    // 绘制框选区域
    if (canvasState.isSelecting && canvasState.selectionStart && canvasState.selectionEnd) {
        const x1 = Math.min(canvasState.selectionStart.x, canvasState.selectionEnd.x);
        const y1 = Math.min(canvasState.selectionStart.y, canvasState.selectionEnd.y);
        const width = Math.abs(canvasState.selectionEnd.x - canvasState.selectionStart.x);
        const height = Math.abs(canvasState.selectionEnd.y - canvasState.selectionStart.y);
        
        mainCtx.save();
        mainCtx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        mainCtx.strokeStyle = '#3498db';
        mainCtx.lineWidth = 2;
        mainCtx.fillRect(x1, y1, width, height);
        mainCtx.strokeRect(x1, y1, width, height);
        mainCtx.restore();
    }
    
    // 绘制辅助线
    drawGuideLines();
}

function drawGuideLines() {
    if (!canvasState.guideLines || canvasState.guideLines.length === 0) return;
    
    mainCtx.save();
    mainCtx.strokeStyle = '#ff0000';
    mainCtx.lineWidth = 2;
    mainCtx.setLineDash([10, 5]);
    mainCtx.shadowColor = '#ff0000';
    mainCtx.shadowBlur = 10;
    
    canvasState.guideLines.forEach(line => {
        mainCtx.beginPath();
        if (line.type === 'horizontal') {
            mainCtx.moveTo(0, line.position);
            mainCtx.lineTo(mainCanvas.width, line.position);
        } else if (line.type === 'vertical') {
            mainCtx.moveTo(line.position, 0);
            mainCtx.lineTo(line.position, mainCanvas.height);
        }
        mainCtx.stroke();
    });
    
    mainCtx.restore();
}

function detectGuideLines(selectedImg) {
    const threshold = 15; // 对齐阈值（像素）
    const guideLines = [];
    
    // 画布中心线
    const canvasCenterX = mainCanvas.width / 2;
    const canvasCenterY = mainCanvas.height / 2;
    const selectedCenterX = selectedImg.x + selectedImg.width / 2;
    const selectedCenterY = selectedImg.y + selectedImg.height / 2;
    
    // 检测画布水平居中
    if (Math.abs(selectedCenterY - canvasCenterY) < threshold) {
        guideLines.push({ type: 'horizontal', position: canvasCenterY });
        selectedImg.y = canvasCenterY - selectedImg.height / 2;
    }
    
    // 检测画布垂直居中
    if (Math.abs(selectedCenterX - canvasCenterX) < threshold) {
        guideLines.push({ type: 'vertical', position: canvasCenterX });
        selectedImg.x = canvasCenterX - selectedImg.width / 2;
    }
    
    // 检测与其他图片的对齐
    appState.placedImages.forEach(img => {
        if (img.id === selectedImg.id) return;
        
        // 左对齐
        if (Math.abs(selectedImg.x - img.x) < threshold) {
            guideLines.push({ type: 'vertical', position: img.x });
            selectedImg.x = img.x;
        }
        
        // 右对齐
        if (Math.abs(selectedImg.x + selectedImg.width - (img.x + img.width)) < threshold) {
            guideLines.push({ type: 'vertical', position: img.x + img.width });
            selectedImg.x = img.x + img.width - selectedImg.width;
        }
        
        // 上对齐
        if (Math.abs(selectedImg.y - img.y) < threshold) {
            guideLines.push({ type: 'horizontal', position: img.y });
            selectedImg.y = img.y;
        }
        
        // 下对齐
        if (Math.abs(selectedImg.y + selectedImg.height - (img.y + img.height)) < threshold) {
            guideLines.push({ type: 'horizontal', position: img.y + img.height });
            selectedImg.y = img.y + img.height - selectedImg.height;
        }
        
        // 中心对齐（水平）
        const otherCenterY = img.y + img.height / 2;
        if (Math.abs(selectedCenterY - otherCenterY) < threshold) {
            guideLines.push({ type: 'horizontal', position: otherCenterY });
            selectedImg.y = otherCenterY - selectedImg.height / 2;
        }
        
        // 中心对齐（垂直）
        const otherCenterX = img.x + img.width / 2;
        if (Math.abs(selectedCenterX - otherCenterX) < threshold) {
            guideLines.push({ type: 'vertical', position: otherCenterX });
            selectedImg.x = otherCenterX - selectedImg.width / 2;
        }
    });
    
    canvasState.guideLines = guideLines;
}

function applyColorMode(ctx) {
    if (appState.colorMode === 'Grayscale') {
        ctx.filter = 'grayscale(100%)';
    } else {
        ctx.filter = 'none';
    }
}

/**
 * 处理画布鼠标按下事件
 * @param {MouseEvent} e - 鼠标事件对象
 */
function handleCanvasMouseDown(e) {
    // 只处理左键点击
    if (e.button !== 0) {
        return;
    }
    
    // 计算鼠标在画布上的位置
    const rect = mainCanvas.getBoundingClientRect();
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;
    const pos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
    
    // 从数组末尾开始查找，优先选中后添加的图片（位于顶部）
    let clickedImage = null;
    for (let i = appState.placedImages.length - 1; i >= 0; i--) {
        const img = appState.placedImages[i];
        if (pos.x >= img.x && pos.x <= img.x + img.width &&
            pos.y >= img.y && pos.y <= img.y + img.height) {
            clickedImage = img;
            break;
        }
    }
    
    if (clickedImage) {
        // 检查点击的图片是否已经被选中
        const isAlreadySelected = appState.selectedImages.some(img => img.id === clickedImage.id);
        
        // 如果按下Shift键，添加到选择列表
        if (e.shiftKey) {
            if (!isAlreadySelected) {
                appState.selectedImages.push(clickedImage);
                appState.selectedImage = clickedImage;
            }
        } else if (!isAlreadySelected) {
            // 否则，只选择当前图片
            appState.selectedImage = clickedImage;
            appState.selectedImages = [clickedImage];
        }
        
        // 开始拖动
        canvasState.isDragging = true;
        // 记录鼠标点击位置
        canvasState.dragStart = pos;
        // 记录所有选中图片的初始位置
        canvasState.initialPositions = [];
        appState.selectedImages.forEach(img => {
            canvasState.initialPositions.push({
                x: img.x,
                y: img.y
            });
        });
        
        // 显示工具栏
        showImageToolbar(e, clickedImage.id);
        // 开始拖动时隐藏工具栏
        imageToolbar.classList.add('hidden');
        // 重新渲染
        renderMainCanvas();
    } else {
        // 没有点击到图片，开始框选
        canvasState.isSelecting = true;
        canvasState.selectionStart = pos;
        canvasState.selectionEnd = pos;
        // 清空选择
        appState.selectedImage = null;
        appState.selectedImages = [];
        // 重新渲染和更新工具栏
        renderMainCanvas();
        updateToolbarButtons();
    }
}

/**
 * 处理画布鼠标移动事件
 * @param {MouseEvent} e - 鼠标事件对象
 */
function handleCanvasMouseMove(e) {
    // 处理框选
    if (canvasState.isSelecting) {
        // 计算鼠标在画布上的位置
        const rect = mainCanvas.getBoundingClientRect();
        const scaleX = mainCanvas.width / rect.width;
        const scaleY = mainCanvas.height / rect.height;
        canvasState.selectionEnd = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
        // 重新渲染
        renderMainCanvas();
        return;
    }
    
    // 处理拖动
    if (canvasState.isDragging) {
        // 计算鼠标在画布上的位置
        const rect = mainCanvas.getBoundingClientRect();
        const scaleX = mainCanvas.width / rect.width;
        const scaleY = mainCanvas.height / rect.height;
        const pos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
        
        // 计算鼠标移动的距离
        const dx = pos.x - canvasState.dragStart.x;
        const dy = pos.y - canvasState.dragStart.y;
        
        // 检查是否有选中的图片且记录了初始位置
        if (appState.selectedImages.length > 0 && canvasState.initialPositions && canvasState.initialPositions.length === appState.selectedImages.length) {
            // 拖动所有选中的图片
            appState.selectedImages.forEach((img, index) => {
                if (canvasState.initialPositions[index]) {
                    img.x = canvasState.initialPositions[index].x + dx;
                    img.y = canvasState.initialPositions[index].y + dy;
                }
            });
            
            // 如果只有一个选中的图片，检测辅助线
            if (appState.selectedImages.length === 1 && appState.selectedImage) {
                detectGuideLines(appState.selectedImage);
            }
        }
        
        // 更新工具栏位置
        positionImageToolbar();
        
        // 重新渲染
        renderMainCanvas();
    }
}

/**
 * 处理画布鼠标释放事件
 * @param {MouseEvent} e - 鼠标事件对象
 */
function handleCanvasMouseUp(e) {
    // 结束框选
    if (canvasState.isSelecting) {
        canvasState.isSelecting = false;
        
        // 计算选择区域
        const x1 = Math.min(canvasState.selectionStart.x, canvasState.selectionEnd.x);
        const y1 = Math.min(canvasState.selectionStart.y, canvasState.selectionEnd.y);
        const x2 = Math.max(canvasState.selectionStart.x, canvasState.selectionEnd.x);
        const y2 = Math.max(canvasState.selectionStart.y, canvasState.selectionEnd.y);
        
        // 检查哪些图片在选择区域内
        appState.selectedImages = appState.placedImages.filter(img => {
            // 检查图片是否与选择区域相交
            return img.x < x2 && img.x + img.width > x1 &&
                   img.y < y2 && img.y + img.height > y1;
        });
        
        // 如果只选择了一个图片，设置selectedImage
        if (appState.selectedImages.length === 1) {
            appState.selectedImage = appState.selectedImages[0];
        } else {
            appState.selectedImage = null;
        }
        
        // 更新工具栏
        updateToolbarButtons();
    }
    
    // 结束拖动
    canvasState.isDragging = false;
    canvasState.guideLines = []; // 清除辅助线
    canvasState.initialPositions = null; // 重置初始位置
    
    // 拖动结束时重新显示工具栏
    if (appState.selectedImage || appState.selectedImages.length > 0) {
        imageToolbar.classList.remove('hidden');
        positionImageToolbar();
    }
    
    // 重新渲染
    renderMainCanvas();
}

function handleCanvasMouseEnter(e) {
    const rect = mainCanvas.getBoundingClientRect();
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;
    const pos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
    
    const hoveredImg = appState.placedImages.find(img => 
        pos.x >= img.x && pos.x <= img.x + img.width &&
        pos.y >= img.y && pos.y <= img.y + img.height
    );
    
    if (hoveredImg) {
        mainCanvas.style.cursor = 'move';
    } else {
        mainCanvas.style.cursor = 'default';
    }
}

function hideAllToolbars() {
    // 不再隐藏工具栏，只更新按钮状态
    updateToolbarButtons();
}

function updateToolbarButtons() {
    const buttons = imageToolbar.querySelectorAll('.toolbar-btn');
    const hasSelection = appState.selectedImage !== null || appState.selectedImages.length > 0;
    const isMultipleSelection = appState.selectedImages.length > 1;
    
    buttons.forEach(btn => {
        btn.disabled = !hasSelection;
        // 批量选择时隐藏重新标注按钮
        if (btn.dataset.action === 'reannotate' && isMultipleSelection) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'inline-block';
        }
    });
    
    if (hasSelection) {
        imageToolbar.classList.add('active');
        positionImageToolbar();
    } else {
        imageToolbar.classList.remove('active');
    }
}

function showImageToolbar(e, imageId) {
    imageToolbar.dataset.imageId = imageId;
    updateToolbarButtons();
}

function positionImageToolbar() {
    if (!appState.selectedImage) return;
    
    const img = appState.selectedImage;
    const canvasRect = mainCanvas.getBoundingClientRect();
    const canvasScale = mainCanvas.width / canvasRect.width;
    
    const imgX = img.x / canvasScale + canvasRect.left;
    const imgY = img.y / canvasScale + canvasRect.top;
    const imgWidth = img.width / canvasScale;
    
    // 计算工具栏位置
    let toolbarTop = imgY;
    
    // 检查图片是否超出画布上边缘
    if (img.y < 0) {
        // 固定工具栏在画布上方
        toolbarTop = canvasRect.top - 10;
    }
    
    imageToolbar.style.left = `${imgX + imgWidth / 2}px`;
    imageToolbar.style.top = `${toolbarTop}px`;
    imageToolbar.style.transform = 'translateX(-50%) translateY(-100%)';
}

function handleImageToolbarClick(e) {
    // 阻止事件冒泡，避免触发画布的点击事件
    e.stopPropagation();
    
    // 找到包含data-action属性的元素（可能是按钮本身或其内部元素）
    let target = e.target;
    while (target && !target.dataset.action) {
        target = target.parentElement;
    }
    
    const action = target ? target.dataset.action : null;
    if (!action) return;
    
    // 对所有选中的图片执行操作
    const imagesToProcess = appState.selectedImages.length > 0 ? appState.selectedImages : (appState.selectedImage ? [appState.selectedImage] : []);
    
    switch(action) {
        case 'delete':
            // 删除所有选中的图片
            imagesToProcess.forEach(img => {
                const index = appState.placedImages.findIndex(i => i.id === img.id);
                if (index > -1) {
                    appState.placedImages.splice(index, 1);
                }
            });
            appState.selectedImage = null;
            appState.selectedImages = [];
            break;
        case 'copy':
            // 复制所有选中的图片
            imagesToProcess.forEach(img => {
                const newImage = {
                    ...img,
                    id: Date.now() + Math.random(),
                    name: img.name + ' (副本)',
                    x: img.x + 20,
                    y: img.y + 20
                };
                appState.placedImages.push(newImage);
                // 将新复制的图片添加到选择列表
                appState.selectedImages.push(newImage);
            });
            break;
        case 'reannotate':
            // 重新标注只对单个图片操作
            if (imagesToProcess.length === 1) {
                appState.selectedImage = imagesToProcess[0];
                reannotateSelectedImage();
                appState.selectedImage = null;
                appState.selectedImages = [];
            }
            break;
        case 'rotate':
            // 旋转所有选中的图片
            imagesToProcess.forEach(img => {
                img.rotation = (img.rotation || 0) + 90;
                if (img.rotation >= 360) {
                    img.rotation = 0;
                }
            });
            break;
    }
    
    renderMainCanvas();
    updateToolbarButtons();
}

function deleteSelectedImage() {
    const index = appState.placedImages.findIndex(img => img.id === appState.selectedImage.id);
    if (index > -1) {
        appState.placedImages.splice(index, 1);
        appState.selectedImage = null;
        renderMainCanvas();
    }
}

function rotateSelectedImage() {
    if (!appState.selectedImage) return;
    
    // 每次旋转 90 度
    appState.selectedImage.rotation = (appState.selectedImage.rotation || 0) + 90;
    if (appState.selectedImage.rotation >= 360) {
        appState.selectedImage.rotation = 0;
    }
    
    renderMainCanvas();
}

function copySelectedImage() {
    const newImage = {
        ...appState.selectedImage,
        id: Date.now(),
        name: appState.selectedImage.name + ' (副本)',
        x: appState.selectedImage.x + 20,
        y: appState.selectedImage.y + 20
    };
    appState.placedImages.push(newImage);
    renderMainCanvas();
}

function reannotateSelectedImage() {
    const img = appState.selectedImage;
    
    // 保存原图片信息，用于确认替换时使用
    annotationState.originalPlacedImage = {
        ...img,
        image: img.image,
        lastAnnotationLength: img.lastAnnotationLength,
        lastAnnotationStartPoint: img.lastAnnotationStartPoint,
        lastAnnotationEndPoint: img.lastAnnotationEndPoint
    };
    annotationState.isReannotate = true;
    
    // 直接使用原图片打开标注界面，不删除原图片
    appState.currentImage = img;
    annotationState.image = img.image;
    annotationState.visualScale = 1;
    
    // 使用原始图片尺寸计算缩放，而不是画布上的尺寸
    const originalWidth = img.image.width;
    const originalHeight = img.image.height;
    
    const maxWidth = 800;
    const maxHeight = 600;
    let scale = 1;
    if (originalWidth > maxWidth) {
        scale = maxWidth / originalWidth;
    }
    if (originalHeight * scale > maxHeight) {
        scale = maxHeight / originalHeight;
    }
    
    annotationState.scale = scale;
    
    annotationCanvas.width = originalWidth * scale;
    annotationCanvas.height = originalHeight * scale;
    
    // 恢复上一次的标注信息
    if (img.lastAnnotationLength) {
        elements.annotationLength.value = img.lastAnnotationLength;
        if (img.lastAnnotationStartPoint && img.lastAnnotationEndPoint) {
            // 标注点坐标是相对于原始图片的像素坐标，需要乘以当前缩放比例
            annotationState.startPoint = {
                x: img.lastAnnotationStartPoint.x * scale,
                y: img.lastAnnotationStartPoint.y * scale
            };
            annotationState.endPoint = {
                x: img.lastAnnotationEndPoint.x * scale,
                y: img.lastAnnotationEndPoint.y * scale
            };
        }
    }
    
    // 计算并显示之前设置的尺寸（毫米）
    if (img.widthRatio && img.heightRatio) {
        const canvasWidthMm = appState.canvasWidth;
        const canvasHeightMm = appState.canvasHeight;
        const imageWidthMm = img.widthRatio * canvasWidthMm;
        const imageHeightMm = img.heightRatio * canvasHeightMm;
        elements.imageWidthMm.value = imageWidthMm.toFixed(1);
        elements.imageHeightMm.value = imageHeightMm.toFixed(1);
    }
    
    // 根据上一次的设置方式选择默认选项
    if (img.lastAnnotationLength && img.lastAnnotationStartPoint && img.lastAnnotationEndPoint) {
        // 上一次使用的是标注线方式
        elements.sizeSettingMethod.value = 'annotation';
    } else {
        // 上一次使用的是直接输入尺寸方式
        elements.sizeSettingMethod.value = 'direct';
    }
    
    renderAnnotationCanvas();
    
    // 重置 transform-origin 到中心
    if (annotationCanvasContainer) {
        annotationCanvasContainer.style.transformOrigin = '50% 50%';
        annotationCanvasContainer.style.transform = 'scale(1)';
    }
    
    updateZoomLevel();
    elements.annotationModal.classList.add('active');
    
    // 触发设置方式的显示逻辑，确保直接输入尺寸模式下能看到之前的尺寸
    elements.sizeSettingMethod.dispatchEvent(new Event('change'));
}

function saveCanvas() {
    const placedImageData = appState.placedImages.map(img => ({
        ...img,
        name: img.name,
        imageSrc: img.image.src
    }));
    
    const saveData = {
        appState: {
            canvasWidth: appState.canvasWidth,
            canvasHeight: appState.canvasHeight,
            ppi: appState.ppi,
            colorMode: appState.colorMode,
            bgColor: appState.bgColor,
            placedImages: placedImageData
        },
        imageData: mainCanvas.toDataURL('image/png')
    };
    localStorage.setItem('sizeSettingCanvas', JSON.stringify(saveData));
    alert('画布已保存到本地存储');
}

function loadCanvas() {
    const savedData = localStorage.getItem('sizeSettingCanvas');
    if (!savedData) {
        alert('没有找到保存的画布');
        return;
    }
    if (!confirm('加载将覆盖当前画布，确定继续吗？')) {
        return;
    }
    const data = JSON.parse(savedData);
    appState.canvasWidth = data.appState.canvasWidth;
    appState.canvasHeight = data.appState.canvasHeight;
    appState.ppi = data.appState.ppi;
    appState.colorMode = data.appState.colorMode;
    appState.bgColor = data.appState.bgColor;
    
    elements.canvasWidth.value = appState.canvasWidth;
    elements.canvasHeight.value = appState.canvasHeight;
    elements.ppi.value = appState.ppi;
    elements.colorMode.value = appState.colorMode;
    elements.bgColor.value = appState.bgColor;
    
    initCanvas();
    
    appState.placedImages = [];
    const loadPromises = data.appState.placedImages.map(imgData => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    ...imgData,
                    image: img
                });
            };
            img.src = imgData.imageSrc;
        });
    });
    
    Promise.all(loadPromises).then(images => {
        appState.placedImages = images;
        renderMainCanvas();
        // alert('画布已加载');
    });
}

function exportJson() {
    const placedImageData = appState.placedImages.map(img => ({
        ...img,
        imageSrc: img.image.src
    }));
    
    const saveData = {
        appState: {
            canvasWidth: appState.canvasWidth,
            canvasHeight: appState.canvasHeight,
            ppi: appState.ppi,
            colorMode: appState.colorMode,
            bgColor: appState.bgColor,
            placedImages: placedImageData
        }
    };
    
    const jsonStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `canvas_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

function loadJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!confirm('加载将覆盖当前画布，确定继续吗？')) {
                    return;
                }
                
                appState.canvasWidth = data.appState.canvasWidth;
                appState.canvasHeight = data.appState.canvasHeight;
                appState.ppi = data.appState.ppi;
                appState.colorMode = data.appState.colorMode;
                appState.bgColor = data.appState.bgColor;
                
                elements.canvasWidth.value = appState.canvasWidth;
                elements.canvasHeight.value = appState.canvasHeight;
                elements.ppi.value = appState.ppi;
                elements.colorMode.value = appState.colorMode;
                elements.bgColor.value = appState.bgColor;
                
                initCanvas();
                
                appState.placedImages = [];
                const loadPromises = data.appState.placedImages.map(imgData => {
                    return new Promise(resolve => {
                        const img = new Image();
                        img.onload = () => {
                            resolve({
                                ...imgData,
                                image: img
                            });
                        };
                        img.src = imgData.imageSrc;
                    });
                });
                
                Promise.all(loadPromises).then(images => {
                    appState.placedImages = images;
                    renderMainCanvas();
                    // alert('画布已从JSON文件加载');
                });
            } catch (error) {
                alert('JSON文件格式错误');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearCanvas() {
    if (!confirm('确定要清空画布吗？此操作不可恢复。')) {
        return;
    }
    
    appState.placedImages = [];
    appState.selectedImage = null;
    renderMainCanvas();
    updateToolbarButtons();
    // alert('画布已清空');
}

function arrangeImages() {
    if (appState.placedImages.length === 0) {
        alert('画布上没有图片可排版');
        return;
    }
    
    const canvasWidth = mainCanvas.width;
    const canvasHeight = mainCanvas.height;
    const marginMm = parseFloat(elements.imageMargin.value) || 5;
    const minPadding = Math.round(marginMm * MM_TO_INCH * appState.ppi); // 转换为px
    
    // 按面积从大到小排序图片，优先放置大图片
    const sortedImages = [...appState.placedImages].sort((a, b) => {
        return (b.width * b.height) - (a.width * a.height);
    });
    
    // 初始化可用空间
    let availableSpaces = [{
        x: minPadding,
        y: minPadding,
        width: canvasWidth - minPadding * 2,
        height: canvasHeight - minPadding * 2
    }];
    
    // 记录无法放置的图片
    const unplacedImages = [];
    
    // 遍历图片并放置
    sortedImages.forEach((img, index) => {
        // 找到最合适的空间
        let bestSpace = null;
        let bestScore = Infinity;
        
        for (let i = 0; i < availableSpaces.length; i++) {
            const space = availableSpaces[i];
            
            // 检查图片是否能放入当前空间
            if (img.width <= space.width && img.height <= space.height) {
                // 计算空间利用率
                const score = space.width * space.height - img.width * img.height;
                
                // 选择利用率最高的空间
                if (score < bestScore) {
                    bestScore = score;
                    bestSpace = space;
                }
            }
        }
        
        if (bestSpace) {
            // 放置图片
            img.x = bestSpace.x;
            img.y = bestSpace.y;
            // 清除无法放置标记
            img.unplaced = false;
            
            // 分割剩余空间
            const newSpaces = [];
            
            // 右侧空间
            if (bestSpace.width > img.width + minPadding) {
                newSpaces.push({
                    x: bestSpace.x + img.width + minPadding,
                    y: bestSpace.y,
                    width: bestSpace.width - img.width - minPadding,
                    height: img.height
                });
            }
            
            // 下方空间
            if (bestSpace.height > img.height + minPadding) {
                newSpaces.push({
                    x: bestSpace.x,
                    y: bestSpace.y + img.height + minPadding,
                    width: bestSpace.width,
                    height: bestSpace.height - img.height - minPadding
                });
            }
            
            // 移除已使用的空间，添加新空间
            const spaceIndex = availableSpaces.indexOf(bestSpace);
            availableSpaces.splice(spaceIndex, 1);
            availableSpaces.push(...newSpaces);
            
            // 清理无效空间
            availableSpaces = availableSpaces.filter(space => 
                space.width > 0 && space.height > 0
            );
        } else {
            // 无法放置的图片
            img.unplaced = true;
            unplacedImages.push(img);
        }
    });
    
    renderMainCanvas();
    updateToolbarButtons();
    
    if (unplacedImages.length > 0) {
        // 生成放不下的图片列表
        const imageList = unplacedImages.map((img, index) => {
            // 使用图片的名称或默认名称
            const imgName = img.name || `图片${index + 1}`;
            return `第${index + 1}张: ${imgName}`;
        }).join('\n');
        
        alert(`图片排版完成，共排列了 ${appState.placedImages.length - unplacedImages.length} 张图片。\n\n以下 ${unplacedImages.length} 张图片暂无空间放置，请手动处理：\n${imageList}`);
        
        // 2秒后恢复图片颜色
        setTimeout(() => {
            unplacedImages.forEach(img => {
                img.unplaced = false;
            });
            renderMainCanvas();
        }, 2000);
    } else {
        alert(`图片已排版完成，共排列了 ${appState.placedImages.length} 张图片`);
    }
}

// 检查两个图片是否重叠
function isOverlapping(img1, img2) {
    return !(img1.x + img1.width < img2.x || 
             img2.x + img2.width < img1.x || 
             img1.y + img1.height < img2.y || 
             img2.y + img2.height < img1.y);
}

function openExportModal() {
    elements.exportModal.classList.add('active');
}

function closeExportModal() {
    elements.exportModal.classList.remove('active');
}

function handleExportFormatChange() {
    if (elements.exportFormat.value === 'jpeg') {
        elements.jpegQualityGroup.style.display = 'flex';
    } else {
        elements.jpegQualityGroup.style.display = 'none';
    }
}

function handleQualityChange() {
    elements.qualityValue.textContent = Math.round(elements.jpegQuality.value * 100) + '%';
}

function doExport() {
    const format = elements.exportFormat.value;
    const quality = parseFloat(elements.jpegQuality.value);
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    // 导出前取消选中，避免红色边框被导出
    const wasSelected = appState.selectedImage;
    if (wasSelected) {
        appState.selectedImage = null;
        renderMainCanvas();
    }
    
    // 创建一个新的Canvas，确保导出的尺寸和PPI与设置一致
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // 设置Canvas尺寸为当前画布的像素尺寸
    exportCanvas.width = mainCanvas.width;
    exportCanvas.height = mainCanvas.height;
    
    // 将当前画布内容绘制到导出Canvas
    exportCtx.drawImage(mainCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
    
    const dataUrl = exportCanvas.toDataURL(mimeType, format === 'jpeg' ? quality : undefined);
    const link = document.createElement('a');
    link.download = `canvas_export.${format === 'jpeg' ? 'jpg' : 'png'}`;
    link.href = dataUrl;
    link.click();
    
    // 导出后恢复选中状态
    if (wasSelected) {
        appState.selectedImage = wasSelected;
        renderMainCanvas();
    }
    
    closeExportModal();
}

init();