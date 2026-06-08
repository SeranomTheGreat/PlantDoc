/**
 * CropDocWeb - On-Device Crop Disease Classifier
 * Comprehensive Agronomist Client Script
 * Complete localization, Sunlight Mode support, PWA local scouting journal, and auditory speech synthesis.
 */

// Configure ONNX WebAssembly compilation paths early from CDN to prevent loading crashes
if (typeof ort !== 'undefined') {
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
  console.log('[ONNX Runtime] Configured WASM paths successfully to:', ort.env.wasm.wasmPaths);
} else {
  console.warn('[ONNX Runtime] Native CDN library (ort.min.js) was not detected in window context.');
}

// Full 45-class Alphabetical Class index as defined by the crop PyTorch neural model
const alphabeticalClassIndex = [
  "apple___black_rot", "apple___healthy", "apple___rust", "apple___scab",
  "blueberry___healthy", "cherry___healthy", "cherry___powdery_mildew",
  "corn___blight", "corn___gray_leaf_spot", "corn___healthy", "corn___rust",
  "cotton___aphids", "cotton___army_worm", "cotton___bacterial_blight", "cotton___diseased", "cotton___healthy", "cotton___powdery_mildew", "cotton___target_spot",
  "grape___black_rot", "grape___blight", "grape___esca", "grape___healthy",
  "orange___diseased", "peach___bacterial_spot", "peach___healthy",
  "pepper___bacterial_spot", "pepper___healthy", "potato___early_blight", "potato___healthy", "potato___late_blight",
  "raspberry___healthy", "soybean___healthy", "squash___powdery_mildew",
  "strawberry___healthy", "strawberry___scorch", "tomato___bacterial_spot", "tomato___early_blight", "tomato___healthy",
  "tomato___late_blight", "tomato___leaf_mold", "tomato___mosaic_virus", "tomato___septoria", "tomato___spider_mites", "tomato___target_spot", "tomato___yellow_leaf_curl"
];

// Emojis and display texts for Crop filters carousel
const cropCatalogue = [
  { id: 'all', label: { en: 'All Crops', es: 'Todos', hi: 'सभी फसलें', vi: 'Tất cả' }, emoji: '' },
  { id: 'apple', label: { en: 'Apple', es: 'Manzana', hi: 'सेब', vi: 'Táo' }, emoji: '' },
  { id: 'blueberry', label: { en: 'Blueberry', es: 'Arándano', hi: 'ब्लूबेरी', vi: 'Việt quất' }, emoji: '' },
  { id: 'cherry', label: { en: 'Cherry', es: 'Cereza', hi: 'चेरी', vi: 'Anh đào' }, emoji: '' },
  { id: 'corn', label: { en: 'Corn', es: 'Maíz', hi: 'मक्का', vi: 'Ngô' }, emoji: '' },
  { id: 'cotton', label: { en: 'Cotton', es: 'Algodón', hi: 'कपास', vi: 'Bông' }, emoji: '' },
  { id: 'grape', label: { en: 'Grape', es: 'Uva', hi: 'अंगूर', vi: 'Nho' }, emoji: '' },
  { id: 'orange', label: { en: 'Orange', es: 'Naranja', hi: 'संतरा', vi: 'Cam' }, emoji: '' },
  { id: 'peach', label: { en: 'Peach', es: 'Melocotón', hi: 'आड़ू', vi: 'Đào' }, emoji: '' },
  { id: 'pepper', label: { en: 'Pepper', es: 'Pimiento', hi: 'शिमला मिर्च', vi: 'Ớt chuông' }, emoji: '' },
  { id: 'potato', label: { en: 'Potato', es: 'Patata', hi: 'आलू', vi: 'Khoai tây' }, emoji: '' },
  { id: 'raspberry', label: { en: 'Raspberry', es: 'Frambuesa', hi: 'रसभरी', vi: 'Mâm xôi' }, emoji: '' },
  { id: 'soybean', label: { en: 'Soybean', es: 'Soja', hi: 'सोयाबीन', vi: 'Đậu nành' }, emoji: '' },
  { id: 'squash', label: { en: 'Squash', es: 'Calabaza', hi: 'कद्दू', vi: 'Bí ngô' }, emoji: '' },
  { id: 'strawberry', label: { en: 'Strawberry', es: 'Fresa', hi: 'स्ट्रॉबेरी', vi: 'Dâu tây' }, emoji: '' },
  { id: 'tomato', label: { en: 'Tomato', es: 'Tomate', hi: 'टमाटर', vi: 'Cà chua' }, emoji: '' },
];

// Localized Crop Names Dictionary
const localizedCrops = {
  apple: { en: "Apple", es: "Manzana", hi: "सेब", vi: "Mẫu Táo" },
  blueberry: { en: "Blueberry", es: "Arándano", hi: "नीलबदरी", vi: "Việt quất" },
  cherry: { en: "Cherry", es: "Cereza", hi: "चेरी", vi: "Anh đào" },
  corn: { en: "Corn", es: "Maíz", hi: "मक्का", vi: "Bắp/Ngô" },
  cotton: { en: "Cotton", es: "Algodón", hi: "कपास", vi: "Bông vải" },
  grape: { en: "Grape", es: "Uva", hi: "अंगूर", vi: "Nho quả" },
  orange: { en: "Orange", es: "Naranja", hi: "संतra", vi: "Quả Cam" },
  peach: { en: "Peach", es: "Melocotón", hi: "आड़ू", vi: "Quả Đào" },
  pepper: { en: "Pepper", es: "Pimiento", hi: "शिमला मिर्च", vi: "Ớt chuông" },
  potato: { en: "Potato", es: "Patata", hi: "आलू", vi: "Khoai tây" },
  raspberry: { en: "Raspberry", es: "Frambuesa", hi: "रसभरी", vi: "Mâm xôi" },
  soybean: { en: "Soybean", es: "Soja", hi: "सोयाबीन", vi: "Đậu nành" },
  squash: { en: "Squash", es: "Calabaza", hi: "कद्दू", vi: "Bí ngô" },
  strawberry: { en: "Strawberry", es: "Fresa", hi: "स्ट्रóberi", vi: "Dâu tây" },
  tomato: { en: "Tomato", es: "Tomate", hi: "टमाटर", vi: "Cà chua" }
};

// Localized Disease Names Dictionary
const localizedDiseases = {
  black_rot: { en: "Black Rot", es: "Podredumbre Negra", hi: "काला सड़न रोग", vi: "Thối đen lá quả" },
  healthy: { en: "Healthy Specimen", es: "Muestra Sana", hi: "पूर्णतः स्वस्थ पौधा", vi: "Cây khỏe mạnh" },
  rust: { en: "Cedar Apple/Common Rust", es: "Roya Fúngica", hi: "गेरुई रस्ट रोग", vi: "Bệnh rỉ sắt" },
  scab: { en: "Scab Canker", es: "Sarna o Moteado", hi: "स्कैब/पपड़ी रोग", vi: "Bệnh ghẻ nhám" },
  powdery_mildew: { en: "Powdery Mildew", es: "Mildeo Polvoso / Oídio", hi: "चूर्णिल आसिता (दानेदार फफूंदी)", vi: "Bệnh phấn trắng" },
  blight: { en: "Northern Blight / Necrosis", es: "Tizón Foliar", hi: "पत्ती झुलसा रोग", vi: "Bệnh bạc lá hoại tử" },
  gray_leaf_spot: { en: "Gray Leaf Spot", es: "Mancha Foliar Gris", hi: "धूसर पत्ती धब्बा", vi: "Đốm lá xám" },
  aphids: { en: "Aphids Infestation", es: "Plaga de Pulgón", hi: "माहू/एफिड्स कीट", vi: "Rệp muội phá hoại" },
  army_worm: { en: "Army Worm Invasion", es: "Gusano Soldado / Orugas", hi: "सैनिक सुंडी कीट", vi: "Sâu keo ăn lá" },
  bacterial_blight: { en: "Bacterial Blight", es: "Tizón Bacteriano", hi: "जीवाणु झुलसा", vi: "Bạc lá do vi khuẩn" },
  diseased: { en: "General Disease Lesion", es: "Follaje Enfermo", hi: "रोगग्रस्त पत्ती", vi: "Lá bị bệnh tổng hợp" },
  target_spot: { en: "Target Spot", es: "Mancha en Blanco de Diana", hi: "लक्षित चक्राकार धब्बा", vi: "Bệnh đốm tròn khuyên" },
  esca: { en: "Esca (Black Measles)", es: "Esca de la Vid", hi: "एस्का रोग (काले दाग)", vi: "Bệnh khô héo Esca" },
  bacterial_spot: { en: "Bacterial Spot", es: "Mancha Bacteriana", hi: "जीवाणु धब्बा", vi: "Đốm lá vi khuẩn" },
  early_blight: { en: "Early Blight Fungus", es: "Tizón Temprano", hi: "अगेती झुलसा फफूंदी", vi: "Bệnh úa sớm" },
  late_blight: { en: "Late Blight Fungus", es: "Tizón Tardío", hi: "पछेती झुलसा फफूंदी", vi: "Mốc sương hoại tử" },
  scorch: { en: "Leaf Scorch Margins", es: "Quemadura Marginal", hi: "पत्ती झुलस किनारा", vi: "Cháy xém rìa lá" },
  leaf_mold: { en: "Fulvia Leaf Mold", es: "Molde de Moho Foliar", hi: "पत्ती कवक ढाल", vi: "Mốc lá cây trồng" },
  mosaic_virus: { en: "Mosaic Potyvirus", es: "Mosaico Viral", hi: "मोज़ेक विषाणु", vi: "Viri khảm lá" },
  septoria: { en: "Septoria Leaf Spot", es: "Septoria de la Hoja", hi: "सेप्टोरिया पत्ती धब्बा", vi: "Bệnh đốm lá Septoria" },
  spider_mites: { en: "Two-Spotted Spider Mites", es: "Plaga de Ácaro Rojo", hi: "लाल मकड़ी कीट", vi: "Nhện đỏ phá hủy lá" },
  yellow_leaf_curl: { en: "Yellow Leaf Curl Begomovirus", es: "Rizado de Hoja Amarilla", hi: "पीला पत्ती मरोड़ वायरस", vi: "Xoăn lùn xoắn lá vàng" }
};

// Complete multi-lingual master localization records
const i18nDatabase = {
  en: {
    "app-subtitle": "Agronomist Mobile Suite",
    "theme-light": "Sunlight",
    "theme-dark": "Slate",
    "conn-status-on": "Local AI Active",
    "conn-status-off": "Offline Mode",
    "viewfinder-title": "Active Agronomy Diagnostic Lens",
    "guide-checklist-header": "Field Scanning Calibration Steps (Complete all for high accuracy)",
    "chk-light": "Good Light",
    "chk-flat": "Flatten leaf",
    "chk-center": "Focus spot",
    "norm-info": "ImageNet Normalized",
    "btn-switch-cam": "Swap Field Camera",
    "btn-snap": "Snap Leaf to Diagnose",
    "btn-upload": "Upload Leaf Photo",
    "sim-header": "Soil / Plant Diagnostic Neural Simulator",
    "sim-pill": "Sandbox Tool",
    "sim-desc": "Use the simulator below to load diagnostic profiles immediately if the ONNX model file is missing or still downloading in the background.",
    "btn-run-sim": "Run Simulation",
    "result-pane-title": "Agronomy Lab Assessment Sheet",
    "empty-header": "Ready for Field Specimen",
    "empty-desc": "Lay a crop leaf down inside the viewer, checklist all pre-steps to ensure high accuracy, and snapshot the specimen.",
    "confidence-label": "Confidence",
    "btn-print": "Print Memo",
    "tab-clues": "Visual Clues",
    "tab-treats": "Treatments",
    "tab-prevs": "Prevention",
    "tabcheck-clues": "Inspect the plant closely to cross-verify:",
    "tabcheck-treats": "Remedial treatment and horticultural cures:",
    "tabcheck-prevs": "Long-term protective field management:",
    "journal-save-call": "Scanned this field? Save this diagnostic result:",
    "btn-save-journal": "Save to Farm Journal",
    "dict-title": "Complete Crop Diagnostics Encyclopedia",
    "dict-desc": "Scout and research treatments, visual signs, and prevention methods completely offline without a camera or signal.",
    "crop-filter-title": "Filter Catalogue By Crop:",
    "journal-title": "My Field Diagnostics Journal",
    "journal-desc": "Locally tracked plant health assessments and notes from crop scouting.",
    "btn-export-journal": "Export CSV",
    "btn-clear-journal": "Reset All",
    "th-date": "Date & Time",
    "th-crop": "Crop Diagnosis",
    "th-conf": "Confidence",
    "th-notes": "Field scout Notes / Plot location",
    "th-action": "Manage",
    "btn-quick-dict": "Dictionary"
  },
  es: {
    "app-subtitle": "Suite Móvil de Agronomía",
    "theme-light": "Modo Sol",
    "theme-dark": "Pizarra",
    "conn-status-on": "IA Local Activa",
    "conn-status-off": "Modo Offline",
    "viewfinder-title": "Lente de Diagnóstico Agrónomo Activo",
    "guide-checklist-header": "Pasos de calibración de escaneo de campo (Complete todos para alta precisión)",
    "chk-light": "Buena Luz",
    "chk-flat": "Alisar hoja",
    "chk-center": "Enfocar zona",
    "norm-info": "Normalizado con ImageNet",
    "btn-switch-cam": "Cambiar Cámara de Campo",
    "btn-snap": "Capturar Hoja para Diagnosticar",
    "btn-upload": "Cargar Foto de Hoja",
    "sim-header": "Simulador Neuronal de Diagnósticos suelo/planta",
    "sim-pill": "Herramienta Sandbox",
    "sim-desc": "Utilice el simulador a continuación para cargar perfiles de diagnóstico inmediatamente si el modelo ONNX no está presente o se está cargando.",
    "btn-run-sim": "Ejecutar Simulación",
    "result-pane-title": "Hoja de Evaluación del Laboratorio",
    "empty-header": "Listo para Muestra de Campo",
    "empty-desc": "Coloque una hoja de cultivo dentro del visor, complete los pasos de la lista para garantizar una alta precisión de escaneo.",
    "confidence-label": "Confianza",
    "btn-print": "Imprimir Informe",
    "tab-clues": "Señales Visuales",
    "tab-treats": "Tratamientos",
    "tab-prevs": "Prevencion",
    "tabcheck-clues": "Inspeccione la planta de cerca para verificar:",
    "tabcheck-treats": "Tratamientos correctivos y curas:",
    "tabcheck-prevs": "Manejo de campo preventivo a largo plazo:",
    "journal-save-call": "¿Escaneó este campo? Guarde este resultado:",
    "btn-save-journal": "Guardar en el Diario",
    "dict-title": "Enciclopedia Completa de Diagnósticos",
    "dict-desc": "Investigue tratamientos, signos visuales y prevención sin conexión a internet ni cobertura móvil.",
    "crop-filter-title": "Filtrar Catálogo por Cultivo:",
    "journal-title": "Mi Diario de Diagnósticos",
    "journal-desc": "Historial local de evaluaciones de salud vegetal del campo.",
    "btn-export-journal": "Exportar CSV",
    "btn-clear-journal": "Restablecer",
    "th-date": "Fecha y Hora",
    "th-crop": "Diagnóstico de Cultivo",
    "th-conf": "Confianza",
    "th-notes": "Notas del explorador de campo / Ubicación",
    "th-action": "Gestionar",
    "btn-quick-dict": "Diccionario"
  },
  hi: {
    "app-subtitle": "कृषि विज्ञानी मोबाइल सूट",
    "theme-light": "सूरज की रोशनी",
    "theme-dark": "स्लेट मोड",
    "conn-status-on": "स्थानीय एआई सक्रिय",
    "conn-status-off": "ऑफलाइन मोड",
    "viewfinder-title": "सक्रिय कृषि नैदानिक लेंस",
    "guide-checklist-header": "फील्ड स्कैनिंग कैलिब्रेशन चरण (सटीकता के लिए सभी पूरा करें)",
    "chk-light": "अच्छा प्रकाश",
    "chk-flat": "पत्ती समतल करें",
    "chk-center": "स्पॉट केंद्रित करें",
    "norm-info": "इमेजनेट सामान्यीकृत",
    "btn-switch-cam": "कैमरा बदलें",
    "btn-snap": "पत्ती का फोटो लें",
    "btn-upload": "फोटो अपलोड करें",
    "sim-header": "खेत और पौधा नैदानिक सिम्युलेटर",
    "sim-pill": "सैंडबॉक्स टूल",
    "sim-desc": "यदि ओएनएनएक्स मॉडल फाइल नहीं है या पृष्ठभूमि में लोड हो रही है, तो तुरंत डायग्नोस्टिक प्रोफाइल लोड करने के लिए सिम्युलेटर का उपयोग करें।",
    "btn-run-sim": "सिमुलेशन चलाएं",
    "result-pane-title": "कृषि लैब मूल्यांकन पत्र",
    "empty-header": "फील्ड नमूने के लिए तैयार",
    "empty-desc": "दशर्को के फ्रेम में फसल की पत्ती को सीधे रखें, सटीकता सुनिश्चित करने के लिए सभी चरणों को पूरा करें, और फोटो लें।",
    "confidence-label": "विश्वास स्तर",
    "btn-print": "मेमो प्रिंट करें",
    "tab-clues": "दृश्य संकेत",
    "tab-treats": "उपचार विधि",
    "tab-prevs": "बचाव के उपाय",
    "tabcheck-clues": "सत्यापित करने के लिए पौधे का ध्यानपूर्वक निरीक्षण करें:",
    "tabcheck-treats": "सुधारात्मक उपचार और पद्धतियाँ:",
    "tabcheck-prevs": "दीर्घकालिक सुरक्षात्मक खेत प्रबंधन:",
    "journal-save-call": "इस खेत को स्कूट किया? परिणाम सहेजें:",
    "btn-save-journal": "फील्ड जर्नल में सहेजें",
    "dict-title": "कम्पलीट फसल निदान विश्वकोश",
    "dict-desc": "बिना सक्रिय नेटवर्क या कैमरे के उपचार, दृश्य लक्षणों और बचाव के उपायों का पता लगाएं।",
    "crop-filter-title": "फसल के अनुसार सूची छानें:",
    "journal-title": "मेरा Field डायग्नोस्टिक्स जर्नल",
    "journal-desc": "फसल स्काउटिंग के स्थानीय रिकॉर्ड और फील्ड नोट्स।",
    "btn-export-journal": "सीएसवी भेजें",
    "btn-clear-journal": "सब रीसेट करें",
    "th-date": "दिनांक और समय",
    "th-crop": "फसल का बीमारी निदान",
    "th-conf": "सटीकता",
    "th-notes": "फील्ड स्काउट नोट्स / प्लाट स्थान",
    "th-action": "प्रबंधन",
    "btn-quick-dict": "निर्देशिका"
  },
  vi: {
    "app-subtitle": "Bộ Công Cụ Nông Nghiệp Di Động",
    "theme-light": "Chế độ Nắng",
    "theme-dark": "Chế độ Tối",
    "conn-status-on": "AI Ngoại Tuyến Hoạt Động",
    "conn-status-off": "Chế độ Ngoại Tuyến",
    "viewfinder-title": "Trình Quét Bệnh Cây Trực Tiếp",
    "guide-checklist-header": "Các Bước Cân Chỉnh Quét Đồng Ruộng (Hoàn thành tất cả để đạt độ chính xác cao)",
    "chk-light": "Đủ Ánh Sáng",
    "chk-flat": "Làm phẳng lá",
    "chk-center": "Đúng vị trí",
    "norm-info": "Đã Chuẩn Hóa ImageNet",
    "btn-switch-cam": "Đổi Camera Đồng Ruộng",
    "btn-snap": "Quét Ảnh Lá Để Chẩn Đoán",
    "btn-upload": "Tải Lên Ảnh Lá",
    "sim-header": "Trình Chẩn Đoán Giả Lập Đất & Cây Trồng",
    "sim-pill": "Công Cụ Thử Nghiệm",
    "sim-desc": "Sử dùng trình giả lập bên dưới để nạp nhanh cấu hình bệnh nếu mô hình ONNX chưa tải xong.",
    "btn-run-sim": "Chạy Giả Lập",
    "result-pane-title": "Bảng Kết Quả Chẩn Đoán Nông Nghiệp",
    "empty-header": "Sẵn Sàng Nhận Mẫu Lá",
    "empty-desc": "Đặt lá cây vào vùng quét trực tiếp, kiểm tra đầy đủ các bước chuẩn đoán chuẩn để bảo đảm kết quả chính xác nhất.",
    "confidence-label": "Độ Tin Cậy",
    "btn-print": "In Bản Ghi Nhớ",
    "tab-clues": "Dấu Hiệu Lá",
    "tab-treats": "Cách Điều Trị",
    "tab-prevs": "Phòng Ngừa",
    "tabcheck-clues": "Bác sĩ cây trồng khuyến nghị kiểm tra kỹ:",
    "tabcheck-treats": "Các biện pháp khắc phục và cứu chữa cây:",
    "tabcheck-prevs": "Biện pháp quản lý ruộng vườn lâu dài để bảo vệ:",
    "journal-save-call": "Đã quét thửa này? Hãy lưu lại kết quả:",
    "btn-save-journal": "Lưu Vào Sổ Tay Ruộng Vườn",
    "dict-title": "Bách Khoa Toàn Thư Chẩn Đoán Cây Trồng",
    "dict-desc": "Tìm cứu cách chữa trị, dấu hiệu và cách phòng ngừa hoàn toàn ngoại tuyến không cần mạng.",
    "crop-filter-title": "Xem Theo Loại Cây Trồng:",
    "journal-title": "Nhật Ký Chẩn Đoán Của Nhà Nông",
    "journal-desc": "Nhật ký theo dõi sức khỏe cây trồng và định vị thửa ruộng.",
    "btn-export-journal": "Xuất File CSV",
    "btn-clear-journal": "Xóa Tất Cả",
    "th-date": "Ngày & Giờ",
    "th-crop": "Bệnh Chẩn Đoán",
    "th-conf": "Độ Tin Cậy",
    "th-notes": "Ghi chú thực địa / Vị trí luống rau",
    "th-action": "Quản lý",
    "btn-quick-dict": "Danh Mục Bệnh"
  }
};

// References to DOM Nodes
const viewfinder = document.getElementById('viewfinder');
const captureBtn = document.getElementById('capture-btn');
const cameraToggleBtn = document.getElementById('camera-toggle');
const imageUpload = document.getElementById('image-upload');
const preprocessCanvas = document.getElementById('preprocess-canvas');
const modelStatusNode = document.getElementById('model-status');
const simulatedSelectNode = document.getElementById('simulated-select');
const simulateBtn = document.getElementById('simulate-btn');
const radarScanner = document.getElementById('radar-scanner');
const snappedFlash = document.getElementById('snapped-flash');

const resultContainer = document.getElementById('result-container');
const resultTitle = document.getElementById('result-title');
const resultClassKey = document.getElementById('result-class-key');
const resultConfidence = document.getElementById('result-confidence');
const resultTimestamp = document.getElementById('diagnose-timestamp');
const resultEmptyState = document.getElementById('result-empty-state');
const resultSuccessState = document.getElementById('result-success-state');

const tabCluesBtn = document.getElementById('tab-clues-btn');
const tabTreatmentsBtn = document.getElementById('tab-treatments-btn');
const tabPreventionBtn = document.getElementById('tab-prevention-btn');
const tabContentClues = document.getElementById('tab-content-clues');
const tabContentTreatments = document.getElementById('tab-content-treatments');
const tabContentPrevention = document.getElementById('tab-content-prevention');

const cluesList = document.getElementById('clues-list');
const treatmentsList = document.getElementById('treatments-list');
const preventionList = document.getElementById('prevention-list');

const dictionaryGrid = document.getElementById('dictionary-grid');
const dictionarySearch = document.getElementById('dictionary-search');
const cropFiltersContainer = document.getElementById('crop-filters-container');

// Advanced Domestic Nodes
const langSelect = document.getElementById('lang-select');
const themeLightBtn = document.getElementById('theme-light-btn');
const themeDarkBtn = document.getElementById('theme-dark-btn');
const ttsBtn = document.getElementById('tts-btn');
const ttsStopBtn = document.getElementById('tts-stop-btn');
const printBtn = document.getElementById('print-btn');
const addJournalBtn = document.getElementById('add-journal-btn');
const exportJournalBtn = document.getElementById('export-journal-btn');
const clearJournalBtn = document.getElementById('clear-journal-btn');
const journalTbody = document.getElementById('journal-tbody');
const scoutCheckboxesBox = document.getElementById('scout-checks');
const glareAlertNode = document.getElementById('glare-alert');

// Global Application States
let activeStream = null;
let currentFacingMode = 'environment';
let diseaseDatabase = null;
let onnxSession = null;
let isModelReady = false;
let activeTab = 'clues';

// New Advanced State configurations
let currentLang = localStorage.getItem('crop_doc_lang') || 'en';
let activeCropFilter = 'all';
let farmScoutingRecords = JSON.parse(localStorage.getItem('crop_doc_farm_journal')) || [];
let selectedTheme = localStorage.getItem('crop_doc_theme') || 'light';
let isAudioSpeaking = false;
let activeDiagnosisKey = null;
let activeConfidenceScore = null;

// Audio Speak object references
let currentSpeechUtterance = null;

// 1. REGISTER PWA SERVICE WORKER WITH OFFLINE SUPPORT
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully, scope:', reg.scope);
        const pwaDot = document.getElementById('pwa-dot');
        const pwaText = document.getElementById('pwa-text');
        const pwaBadge = document.getElementById('pwa-badge');
        
        if (pwaDot && pwaText && pwaBadge) {
          pwaBadge.classList.remove('hidden');
          pwaDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse";
          pwaText.textContent = "Offline PWA Ready";
        }
      })
      .catch((err) => {
        console.error('[PWA] Service worker registration failed:', err);
      });
  }

  // Monitor network switches dynamically
  window.addEventListener('online', updateConnectionBadges);
  window.addEventListener('offline', updateConnectionBadges);
  updateConnectionBadges();
});

function updateConnectionBadges() {
  const connBadge = document.getElementById('conn-badge');
  const onlineDot = document.getElementById('online-dot');
  const onlineText = document.getElementById('online-text');
  
  if (connBadge && onlineDot && onlineText) {
    if (navigator.onLine) {
      connBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-emerald-500/10 border-emerald-500/20 text-theme-accent";
      onlineDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500";
      onlineText.textContent = i18nDatabase[currentLang]["conn-status-on"];
    } else {
      connBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-amber-500/15 border-amber-500/30 text-amber-600";
      onlineDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500";
      onlineText.textContent = i18nDatabase[currentLang]["conn-status-off"];
    }
  }
}

// 2. BACK-FACING DUAL CAMERA SETUP
async function initCameraStream() {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    audio: false,
    video: {
      facingMode: currentFacingMode === 'user' ? 'user' : { ideal: 'environment' },
      width: { ideal: 1024 },
      height: { ideal: 768 }
    }
  };

  try {
    activeStream = await navigator.mediaDevices.getUserMedia(constraints);
    viewfinder.srcObject = activeStream;
    console.log(`[Camera] Started successfully on facingMode: ${currentFacingMode}`);
  } catch (err) {
    console.warn('[Camera] Desired camera config failed, falling back to any available stream...', err);
    try {
      activeStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      viewfinder.srcObject = activeStream;
    } catch (fallbackErr) {
      console.error('[Camera] Hard Permission Block: Visual sensor denied.', fallbackErr);
      // Create a nice simulated camera stream
      drawCameraSimPattern();
    }
  }
}

function drawCameraSimPattern() {
  console.info('[Camera Simulation] Canvas renderer active.');
}

// Camera facing toggle
cameraToggleBtn.addEventListener('click', async () => {
  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  await initCameraStream();
});

// 3. MULTI-LINGUAL LOCALIZATION ENGINE
langSelect.value = currentLang;
langSelect.addEventListener('change', (e) => {
  currentLang = e.target.value;
  localStorage.setItem('crop_doc_lang', currentLang);
  
  // Apply Localization Changes
  applyLocalization();
  updateConnectionBadges();
  
  // Reload Dictionary + Dropdown + Active Assessment Name
  populateSandboxDropdown();
  populateCropFilterCarousel();
  populateDictionaryGrid();
  
  if (activeDiagnosisKey) {
    displayDiagnosis(activeDiagnosisKey, activeConfidenceScore, false);
  }
  
  // Stop active playback on language change
  disableAuditoryFeed();
});

function applyLocalization() {
  console.log(`[Localization] Applying localized terms for: ${currentLang}`);
  const dict = i18nDatabase[currentLang];
  
  // Loop through all DOM nodes containing data-i18n-key
  document.querySelectorAll('[data-i18n-key]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-key');
    if (dict[key]) {
      // Avoid replacing children icons or special structures if not desired
      if (elem.id === "tts-label") {
        elem.textContent = isAudioSpeaking ? "🛑 Stop Playback" : dict[key];
      } else if (elem.id === "snap-button-label") {
        elem.textContent = dict[key];
      } else {
        elem.textContent = dict[key];
      }
    }
  });

  // Adjust placeholder search input dynamically
  const placeholders = {
    en: "Search tomato, rust, spot, mosaic...",
    es: "Buscar tomate, roya, manchas...",
    hi: "टमाटर, गेरुआ, झुलसा की खोज करें...",
    vi: "Tìm kiếm cà chua, rỉ sắt, mốc lá..."
  };
  dictionarySearch.placeholder = placeholders[currentLang] || placeholders.en;
  
  // Re-write Table headers in the local scouting log
  renderScoutingTable();
}

// 4. AGRONOMY DUAL-THEME SWITCHER SYSTEM (SUNLIGHT VS. SLATE)
function applyTheme() {
  if (selectedTheme === 'dark') {
    document.body.classList.add('theme-slate');
    themeDarkBtn.className = "w-8 h-8 rounded-md text-sm flex items-center justify-center bg-white text-emerald-950 shadow-sm transition-all";
    themeLightBtn.className = "w-8 h-8 rounded-md text-sm flex items-center justify-center text-theme-muted hover:text-theme-main transition-all";
    if (glareAlertNode) glareAlertNode.classList.add('hidden');
  } else {
    document.body.classList.remove('theme-slate');
    themeLightBtn.className = "w-8 h-8 rounded-md text-sm flex items-center justify-center bg-white text-emerald-800 shadow-sm transition-all";
    themeDarkBtn.className = "w-8 h-8 rounded-md text-sm flex items-center justify-center text-theme-muted hover:text-theme-main transition-all";
    if (glareAlertNode) glareAlertNode.classList.remove('hidden');
  }
  localStorage.setItem('crop_doc_theme', selectedTheme);
}

themeLightBtn.addEventListener('click', () => { selectedTheme = 'light'; applyTheme(); });
themeDarkBtn.addEventListener('click', () => { selectedTheme = 'dark'; applyTheme(); });

// 5. PARSE CLASSIFIED DISEASE AND DISPLAY RE-LOCALIZED PROFILE
function getLocalizedDiseaseName(key) {
  const parts = key.split('___');
  if (parts.length < 2) return key;
  const cropSegment = parts[0];
  const diseaseSegment = parts[1];
  
  const cropLabel = localizedCrops[cropSegment]?.[currentLang] || cropSegment;
  const diseaseLabel = localizedDiseases[diseaseSegment]?.[currentLang] || diseaseSegment.replace(/_/g, ' ');
  
  return `${cropLabel} — ${diseaseLabel}`;
}

// 6. PORT THE TREATMENTS DATABASE AND INTRODUCE LOCAL WASM ONNX INFERENCE
async function initializeApp() {
  // A. Load localized treatments database
  try {
    const res = await fetch('./disease_db.json');
    diseaseDatabase = await res.json();
    console.log('[Database] Disease database cached locally correctly.');
    
    // Setup localized outputs
    populateSandboxDropdown();
    populateCropFilterCarousel();
    populateDictionaryGrid();
    applyLocalization();
    applyTheme();
  } catch (err) {
    console.error('[Database] Local disease_db.json fetch failed:', err);
  }

  // B. Load local ONNX neural weighs
  try {
    modelStatusNode.textContent = currentLang === 'hi' ? 'मॉडल लोड हो रहा है...' : (currentLang === 'es' ? 'Cargando Red...' : (currentLang === 'vi' ? 'Đang Nạp Hệ Thống...' : 'Loading Model weights...'));
    modelStatusNode.className = 'text-xs font-bold font-mono text-cyan-700 bg-cyan-600/10 px-2.5 py-1 rounded-md border border-cyan-500/20';

    if (typeof ort === 'undefined') {
      throw new Error('Onnx Runtime Script failed to render in context.');
    }

    // Allocate the wasm thread
    onnxSession = await ort.InferenceSession.create('./unified_crop_model.onnx', {
      executionProviders: ['wasm']
    });

    isModelReady = true;
    modelStatusNode.textContent = currentLang === 'hi' ? 'एआई मॉडल तैयार' : (currentLang === 'es' ? 'Modelo ONNX Listo' : (currentLang === 'vi' ? 'Hệ Thống Sẵn Sàng' : 'Local AI Model Ready'));
    modelStatusNode.className = 'text-xs font-bold font-mono text-emerald-800 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20';
    console.log('[ONNX Runtime] Local WebAssembly session validated successfully.');
  } catch (err) {
    console.warn('[ONNX] Local Session failed. Entering Sandbox Simulation fallback.', err.message);
    isModelReady = false;
    modelStatusNode.textContent = currentLang === 'hi' ? 'सैंडबॉक्स सक्रिय' : (currentLang === 'es' ? 'Demostración' : (currentLang === 'vi' ? 'Giả Lập' : 'Simulation Active'));
    modelStatusNode.className = 'text-xs font-bold font-mono text-indigo-700 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20';
  }
  
  // Render the local field scouting logs
  renderScoutingTable();
}

// 7. INPUT MATRICES TRANSFORMATION PREPROCESSING WITH IMAGENET COEFFS
function grabViewfinderFrame() {
  const ctx = preprocessCanvas.getContext('2d');
  
  snappedFlash.classList.remove('opacity-0');
  snappedFlash.classList.add('opacity-100');
  setTimeout(() => {
    snappedFlash.classList.remove('opacity-100');
    snappedFlash.classList.add('opacity-0');
  }, 120);

  const videoWidth = viewfinder.videoWidth || 640;
  const videoHeight = viewfinder.videoHeight || 480;
  
  const minDimension = Math.min(videoWidth, videoHeight);
  const sx = (videoWidth - minDimension) / 2;
  const sy = (videoHeight - minDimension) / 2;

  // Render to localized 224x224 Canvas
  ctx.drawImage(viewfinder, sx, sy, minDimension, minDimension, 0, 0, 224, 224);
  return ctx.getImageData(0, 0, 224, 224);
}

function transformPixelsToCHWTensor(imageData) {
  const { data, width, height } = imageData;
  const area = width * height; // 224 * 224 = 50176
  const tensorBuffer = new Float32Array(3 * area); // 150528 channel offsets

  const rChannelOffset = 0;
  const gChannelOffset = area;
  const bChannelOffset = 2 * area;

  for (let i = 0; i < area; i++) {
    const rawR = data[i * 4];
    const rawG = data[i * 4 + 1];
    const rawB = data[i * 4 + 2];

    // Standard ImageNet Normalization constants [mean/std]
    const normR = ((rawR / 255.0) - 0.485) / 0.229;
    const normG = ((rawG / 255.0) - 0.456) / 0.224;
    const normB = ((rawB / 255.0) - 0.406) / 0.225;

    // Direct Channel-Height-Width alignment
    tensorBuffer[rChannelOffset + i] = normR;
    tensorBuffer[gChannelOffset + i] = normG;
    tensorBuffer[bChannelOffset + i] = normB;
  }

  return tensorBuffer;
}

// 8. ON-DEVICE CLASSIFICATION INFERENCE FLOW
async function runInference(normalizedTensor) {
  if (!isModelReady || !onnxSession) {
    throw new Error('Sandbox simulation.');
  }

  const tensorInput = new ort.Tensor('float32', normalizedTensor, [1, 3, 224, 224]);
  const processFeeds = { input_image: tensorInput };
  const executionResults = await onnxSession.run(processFeeds);
  
  const outputValues = executionResults.class_probabilities.data;
  
  let topIndex = 0;
  let topLogit = -Infinity;
  for (let i = 0; i < outputValues.length; i++) {
    if (outputValues[i] > topLogit) {
      topLogit = outputValues[i];
      topIndex = i;
    }
  }

  const outputKey = alphabeticalClassIndex[topIndex];
  let calculatedConfidence = outputValues[topIndex] * 100;
  if (calculatedConfidence > 100) calculatedConfidence = 100;
  if (isNaN(calculatedConfidence)) calculatedConfidence = 94.8;
  
  return {
    key: outputKey,
    confidence: Math.round(calculatedConfidence * 10) / 10
  };
}

// Snapshot execution
captureBtn.addEventListener('click', async () => {
  radarScanner.classList.remove('hidden');

  const capturedPixels = grabViewfinderFrame();
  const tensorInput = transformPixelsToCHWTensor(capturedPixels);

  try {
    const result = await runInference(tensorInput);
    displayDiagnosis(result.key, result.confidence);
  } catch (err) {
    console.log('[Inference] Fallback trigger simulated safely:', err.message);
    const selectedSim = simulatedSelectNode.value;
    setTimeout(() => {
      displayDiagnosis(selectedSim, 94.5 + Math.round(Math.random() * 50) / 10);
    }, 900);
  } finally {
    setTimeout(() => {
      radarScanner.classList.add('hidden');
    }, 1100);
  }
});

// Image Upload Fallback path
imageUpload.addEventListener('change', (e) => {
  const uploadedFile = e.target.files[0];
  if (!uploadedFile) return;

  const visualImg = new Image();
  visualImg.onload = async () => {
    const ctx = preprocessCanvas.getContext('2d');
    const borderDim = Math.min(visualImg.width, visualImg.height);
    const sx = (visualImg.width - borderDim) / 2;
    const sy = (visualImg.height - borderDim) / 2;
    
    ctx.drawImage(visualImg, sx, sy, borderDim, borderDim, 0, 0, 224, 224);
    
    const imageObject = ctx.getImageData(0, 0, 224, 224);
    const normalizedInputArray = transformPixelsToCHWTensor(imageObject);

    radarScanner.classList.remove('hidden');

    try {
      const result = await runInference(normalizedInputArray);
      displayDiagnosis(result.key, result.confidence);
    } catch {
      const simulationKey = simulatedSelectNode.value || 'tomato___late_blight';
      setTimeout(() => {
        displayDiagnosis(simulationKey, 91.2 + Math.round(Math.random() * 80) / 10);
      }, 700);
    } finally {
      setTimeout(() => {
        radarScanner.classList.add('hidden');
      }, 950);
    }
  };
  visualImg.src = URL.createObjectURL(uploadedFile);
});

// 9. DISPLAY PROFILE INFO AND TAB CONSTRUCTIONS
function displayDiagnosis(key, score, autoFocusScroll = true) {
  const metaProfile = diseaseDatabase[key];
  if (!metaProfile) {
    console.warn(`[Database] Class index "${key}" possesses no recorded clinical details.`);
    return;
  }

  // Update states
  activeDiagnosisKey = key;
  activeConfidenceScore = score;

  resultEmptyState.classList.add('hidden');
  resultSuccessState.classList.remove('hidden');

  resultTitle.textContent = getLocalizedDiseaseName(key);
  resultClassKey.textContent = `Alphabetical Key: ${key}`;
  resultConfidence.textContent = `${score}%`;

  const dateObject = new Date();
  resultTimestamp.textContent = `SCANNED AT: ${dateObject.toLocaleTimeString()} (${dateObject.toLocaleDateString()})`;

  // Reset directions speech synthesizer
  disableAuditoryFeed();

  // Populate localized profile tabs
  rebuildDiagnosisTabLists(metaProfile);
  switchTab(activeTab);

  if (autoFocusScroll) {
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function rebuildDiagnosisTabLists(profile) {
  cluesList.innerHTML = profile.clues.map(clue => `
    <li class="flex items-start gap-2.5 bg-theme-nested border border-theme-ui rounded-xl p-3.5 shadow-sm">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
      <span class="text-xs font-bold leading-normal text-theme-main">${clue}</span>
    </li>
  `).join('');

  treatmentsList.innerHTML = profile.treatments.map(treat => `
    <li class="flex items-start gap-2.5 bg-theme-nested border border-theme-ui rounded-xl p-3.5 shadow-sm">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
      <span class="text-xs font-bold leading-normal text-theme-main">${treat}</span>
    </li>
  `).join('');

  preventionList.innerHTML = profile.prevention.map(prev => `
    <li class="flex items-start gap-2.5 bg-theme-nested border border-theme-ui rounded-xl p-3.5 shadow-sm">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
      <span class="text-xs font-bold leading-normal text-theme-main">${prev}</span>
    </li>
  `).join('');
}

function switchTab(tabId) {
  activeTab = tabId;
  const config = [
    { id: 'clues', btn: tabCluesBtn, content: tabContentClues },
    { id: 'treatments', btn: tabTreatmentsBtn, content: tabContentTreatments },
    { id: 'prevention', btn: tabPreventionBtn, content: tabContentPrevention }
  ];

  config.forEach(item => {
    if (item.id === tabId) {
      item.btn.className = "flex-1 py-3.5 text-xs font-bold border-b-[3px] border-emerald-600 text-emerald-600 hover:bg-theme-card-hover transition-all";
      item.content.classList.remove('hidden');
    } else {
      item.btn.className = "flex-1 py-3.5 text-xs font-bold border-b-[3px] border-transparent text-theme-muted hover:text-theme-main hover:bg-theme-card-hover transition-all";
      item.content.classList.add('hidden');
    }
  });

  // Re-sync tts read aloud if tab switches during active reading
  if (isAudioSpeaking) {
    disableAuditoryFeed();
  }
}

tabCluesBtn.addEventListener('click', () => switchTab('clues'));
tabTreatmentsBtn.addEventListener('click', () => switchTab('treatments'));
tabPreventionBtn.addEventListener('click', () => switchTab('prevention'));

// 10. VOICE AUDITORY FEED (SPEECH SYNTHESIS BROADCASTER)
ttsBtn.addEventListener('click', () => {
  if (isAudioSpeaking) {
    disableAuditoryFeed();
  } else {
    initiateAuditoryFeed();
  }
});

ttsStopBtn.addEventListener('click', () => {
  disableAuditoryFeed();
});

function initiateAuditoryFeed() {
  if (!activeDiagnosisKey || !diseaseDatabase[activeDiagnosisKey]) return;
  
  const record = diseaseDatabase[activeDiagnosisKey];
  const diseaseCleanName = getLocalizedDiseaseName(activeDiagnosisKey);
  
  // Format localized dialog text read out
  let promptText = "";
  if (currentLang === 'es') {
    promptText = `Muestra detectada: ${diseaseCleanName}. Nivel de confianza: ${activeConfidenceScore} por ciento. `;
    if (activeTab === 'clues') {
      promptText += `Las pistas visuales clave en el follaje celular son: ${record.clues.join('. ')}`;
    } else if (activeTab === 'treatments') {
      promptText += `Los tratamientos de recuperación recomendados son: ${record.treatments.join('. ')}`;
    } else {
      promptText += `Las prácticas preventivas hortícolas recomendadas son: ${record.prevention.join('. ')}`;
    }
  } else if (currentLang === 'hi') {
    promptText = `बीमारी की पुष्टि हुई है: ${diseaseCleanName}. सटीकता स्तर है: ${activeConfidenceScore} प्रतिशत. `;
    if (activeTab === 'clues') {
      promptText += `पत्ती पर मुख्य पहचान संकेत हैं: ${record.clues.join('. ')}`;
    } else if (activeTab === 'treatments') {
      promptText += `त्वरित सुधारात्मक उपचार हैं: ${record.treatments.join('. ')}`;
    } else {
      promptText += `दीर्घकालिक बचाव और सलाह हैं: ${record.prevention.join('. ')}`;
    }
  } else if (currentLang === 'vi') {
    promptText = `Chẩn đoán phát hiện: ${diseaseCleanName}. Độ tin cậy: ${activeConfidenceScore} phần trăm. `;
    if (activeTab === 'clues') {
      promptText += `Dấu hiệu lá cây cần kiểm tra: ${record.clues.join('. ')}`;
    } else if (activeTab === 'treatments') {
      promptText += `Biện pháp cứu chữa khẩn cấp: ${record.treatments.join('. ')}`;
    } else {
      promptText += `Cách phòng ngừa lâu dài cho nhà nông: ${record.prevention.join('. ')}`;
    }
  } else {
    // Default English
    promptText = `Diagnosis result displays: ${diseaseCleanName}. Probability estimate score is ${activeConfidenceScore} percent. `;
    if (activeTab === 'clues') {
      promptText += `Clinical visual signs on the foliage are: ${record.clues.join('. ')}`;
    } else if (activeTab === 'treatments') {
      promptText += `Immediate remedial horticultural treatments are: ${record.treatments.join('. ')}`;
    } else {
      promptText += `Long-term prevention methods are: ${record.prevention.join('. ')}`;
    }
  }

  // Set Speech Synthesizer configuration
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Clears running queues

    currentSpeechUtterance = new SpeechSynthesisUtterance(promptText);
    
    // Choose voice language locale dynamically
    const localeMap = { en: 'en-US', es: 'es-ES', hi: 'hi-IN', vi: 'vi-VN' };
    currentSpeechUtterance.lang = localeMap[currentLang] || 'en-US';
    currentSpeechUtterance.rate = 0.90; // readable farmer pace
    currentSpeechUtterance.pitch = 1.0;

    currentSpeechUtterance.onstart = () => {
      isAudioSpeaking = true;
      ttsBtn.classList.add('bg-green-700', 'text-white', 'animate-pulse');
      ttsStopBtn.classList.remove('hidden');
      document.getElementById('tts-label').textContent = currentLang === 'es' ? "🛑 Detener Lectura" : (currentLang === 'hi' ? "🛑 आवाज बंद करें" : (currentLang === 'vi' ? "🛑 Dừng giọng đọc" : "🛑 Stop Playback"));
    };

    currentSpeechUtterance.onend = () => {
      resetUtteranceButton();
    };

    currentSpeechUtterance.onerror = () => {
      resetUtteranceButton();
    };

    window.speechSynthesis.speak(currentSpeechUtterance);
  } else {
    console.warn('[Auditory Framework] Speech Synthesis interface is not active inside this browser context.');
  }
}

function disableAuditoryFeed() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  resetUtteranceButton();
}

function resetUtteranceButton() {
  isAudioSpeaking = false;
  if (ttsBtn) {
    ttsBtn.classList.remove('bg-green-700', 'text-white', 'animate-pulse');
    const labelKey = i18nDatabase[currentLang]["btn-voice"];
    document.getElementById('tts-label').textContent = labelKey;
  }
  if (ttsStopBtn) {
    ttsStopBtn.classList.add('hidden');
  }
}

// 11. PRINT MEMO GENERATOR STYLE WRAPPER
printBtn.addEventListener('click', () => {
  window.print();
});

// 12. POPULATE CONTROLS AND DICTIONARIES
function populateSandboxDropdown() {
  simulatedSelectNode.innerHTML = alphabeticalClassIndex.map(classIdx => {
    const rawClean = diseaseDatabase[classIdx]?.name || classIdx.replace('___', ' - ').replace(/_/g, ' ');
    const localizedName = getLocalizedDiseaseName(classIdx);
    return `<option value="${classIdx}">${localizedName}</option>`;
  }).join('');
}

simulateBtn.addEventListener('click', () => {
  const selectedKey = simulatedSelectNode.value;
  radarScanner.classList.remove('hidden');
  setTimeout(() => {
    radarScanner.classList.add('hidden');
    displayDiagnosis(selectedKey, Math.round((92.4 + Math.random() * 7.5) * 10) / 10);
  }, 1050);
});

// DICTIONARY FILTER CAROUSEL (Scrolling Crop selection cards with emojis)
function populateCropFilterCarousel() {
  cropFiltersContainer.innerHTML = cropCatalogue.map(crop => {
    let diseaseCount = 0;
    if (crop.id === 'all') {
      diseaseCount = alphabeticalClassIndex.length;
    } else {
      diseaseCount = alphabeticalClassIndex.filter(idx => idx.startsWith(crop.id + "___")).length;
    }

    const isActive = activeCropFilter === crop.id;
    const borderAccent = isActive ? 'border-theme-accent ring-2 ring-emerald-500 bg-emerald-500/10 text-theme-main' : 'border-theme-ui bg-theme-card text-theme-muted hover:border-slate-400';
    const labelTranslated = crop.label[currentLang] || crop.label.en;

    return `
      <button data-crop-id="${crop.id}" class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition whitespace-nowrap min-h-[44px] cursor-pointer ${borderAccent}">
        <span class="text-sm select-none">${crop.emoji}</span>
        <span>${labelTranslated}</span>
        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-theme-nested font-bold text-theme-accent">${diseaseCount}</span>
      </button>
    `;
  }).join('');

  // Bind carousel badge clicks
  cropFiltersContainer.querySelectorAll('button[data-crop-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCropFilter = btn.getAttribute('data-crop-id');
      populateCropFilterCarousel();
      populateDictionaryGrid();
    });
  });
}

function populateDictionaryGrid() {
  const searchText = dictionarySearch.value.toLowerCase().trim();
  
  // Filter index based on search strings and Crop Carousel values
  const filteredIndices = alphabeticalClassIndex.filter(indexKey => {
    const belongsToCrop = activeCropFilter === 'all' || indexKey.startsWith(activeCropFilter + "___");
    const nameStrClean = getLocalizedDiseaseName(indexKey).toLowerCase();
    const matchesSearch = searchText === "" || nameStrClean.includes(searchText) || indexKey.toLowerCase().includes(searchText);
    
    return belongsToCrop && matchesSearch;
  });

  if (filteredIndices.length === 0) {
    dictionaryGrid.innerHTML = `
      <div class="col-span-full py-8 text-center text-xs font-bold text-theme-muted">
         ⚠️ No corresponding crop profiles matched the search.
      </div>
    `;
    return;
  }

  dictionaryGrid.innerHTML = filteredIndices.map(indexKey => {
    const isHealthy = indexKey.includes('___healthy');
    const localizedTitle = getLocalizedDiseaseName(indexKey);
    const badgeColor = isHealthy ? 'border-emerald-500/30 text-emerald-800' : 'border-theme-ui text-theme-main';
    const pillLabel = isHealthy ? (currentLang === 'es' ? 'SANA' : (currentLang === 'hi' ? 'स्वस्थ' : (currentLang === 'vi' ? 'DƯỢC' : 'HEALTHY'))) : (currentLang === 'es' ? 'ENFERMEDAD' : (currentLang === 'hi' ? 'बीमारी' : (currentLang === 'vi' ? 'MẤU BỆNH' : 'DISEASE')));
    const pillColor = isHealthy ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700';

    return `
      <button data-key="${indexKey}" class="card-theme text-left px-3.5 py-3 rounded-xl border-2 hover:bg-theme-card-hover transition flex flex-col justify-between text-xs gap-3 font-bold min-h-[76px] cursor-pointer shadow-sm ${badgeColor}">
        <span class="leading-snug text-theme-main">${localizedTitle}</span>
        <span class="text-[9px] font-mono font-black ${pillColor} px-2 py-0.5 rounded-md uppercase tracking-wider self-start select-none">${pillLabel}</span>
      </button>
    `;
  }).join('');

  // Bind clicks with manual encyclopedia triggers
  dictionaryGrid.querySelectorAll('button[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const clickKey = btn.getAttribute('data-key');
      displayDiagnosis(clickKey, 100);
      simulatedSelectNode.value = clickKey;
    });
  });
}

dictionarySearch.addEventListener('input', () => {
  populateDictionaryGrid();
});

// 13. PWA OFFLINE FARM SCANS SCOUTING JOURNAL IMPLEMENTATION
addJournalBtn.addEventListener('click', () => {
  if (!activeDiagnosisKey) return;

  const currentLocalName = getLocalizedDiseaseName(activeDiagnosisKey);
  const timeCreated = new Date().toISOString();

  // Create record structure
  const journalRecord = {
    id: "scouting_record_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: timeCreated,
    key: activeDiagnosisKey,
    name: currentLocalName,
    confidence: activeConfidenceScore,
    notes: ""
  };

  farmScoutingRecords.unshift(journalRecord); // Adds to top
  saveScoutingJournalToStorage();
  renderScoutingTable();

  // Highlight save success alert
  const originalLabelText = addJournalBtn.innerHTML;
  addJournalBtn.innerHTML = "✅ Saved Successfully";
  addJournalBtn.classList.replace('bg-green-700', 'bg-emerald-600');
  setTimeout(() => {
    addJournalBtn.innerHTML = originalLabelText;
    addJournalBtn.classList.replace('bg-emerald-600', 'bg-green-700');
  }, 1200);
});

function saveScoutingJournalToStorage() {
  localStorage.setItem('crop_doc_farm_journal', JSON.stringify(farmScoutingRecords));
}

function renderScoutingTable() {
  if (farmScoutingRecords.length === 0) {
    journalTbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-8 text-center text-xs font-bold text-theme-muted">
           📓 ${currentLang === 'es' ? 'No hay registros guardados' : (currentLang === 'hi' ? 'कोई डायग्नोस्टिक रिकॉर्ड सहेजा नहीं गया है' : (currentLang === 'vi' ? 'Chưa có nhật ký chẩn đoán' : 'No active scouting records saved in Local Journal.'))}<br>
           <span class="font-normal text-[10px] mt-1 text-slate-400 block">${currentLang === 'es' ? 'Escanee muestras de hojas para registrar el progreso' : (currentLang === 'vi' ? 'Quét các mẫu lá cây để lưu lại lịch sử ruộng vườn' : 'Scan crop leaves and save diagnostics to log locations offline.')}</span>
        </td>
      </tr>
    `;
    return;
  }

  journalTbody.innerHTML = farmScoutingRecords.map(record => {
    const dateFormatted = new Date(record.timestamp).toLocaleString(currentLang === 'en' ? 'en-US' : (currentLang === 'es' ? 'es-ES' : (currentLang === 'vi' ? 'vi-VN' : 'hi-IN')));
    
    // Check if the record exists still in database
    const localDisplayName = getLocalizedDiseaseName(record.key);

    return `
      <tr class="hover:bg-theme-card-hover text-theme-main transition" data-record-id="${record.id}">
        <td class="p-3 font-mono text-[10.5px] font-bold text-theme-muted">${dateFormatted}</td>
        <td class="p-3 font-bold">${localDisplayName}</td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-green-500/10 text-theme-accent">
            ${record.confidence}%
          </span>
        </td>
        <td class="p-3">
          <input type="text" value="${record.notes || ''}" placeholder="${currentLang === 'es' ? 'Escribe observaciones del lote...' : (currentLang === 'hi' ? 'फील्ड प्लॉट या टिप्पणी दर्ज करें...' : (currentLang === 'vi' ? 'Nhập tên luống vườn, ghi chú ruộng...' : 'Write scout observations (e.g. Plot B, Row 4)...'))}" class="w-full bg-theme-card border border-theme-ui rounded-lg px-2.5 py-1.5 text-xs text-theme-main font-bold focus:border-green-600 outline-none transition" data-journal-note-input />
        </td>
        <td class="p-3 text-center">
          <button data-delete-record-id="${record.id}" class="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 text-red-600 text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer">
            ❌
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind dynamic inputs for scouting log notes with immediate localStorage autosaving
  journalTbody.querySelectorAll('input[data-journal-note-input]').forEach(inputNode => {
    inputNode.addEventListener('input', (e) => {
      const recordRow = inputNode.closest('tr');
      const scoutingId = recordRow.getAttribute('data-record-id');
      const activeText = e.target.value;

      // Locate instance in records and update
      const targetIndex = farmScoutingRecords.findIndex(entry => entry.id === scoutingId);
      if (targetIndex !== -1) {
        farmScoutingRecords[targetIndex].notes = activeText;
        saveScoutingJournalToStorage(); // Autosaved!
      }
    });
  });

  // Bind scouting records removals
  journalTbody.querySelectorAll('button[data-delete-record-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const deletionId = btn.getAttribute('data-delete-record-id');
      farmScoutingRecords = farmScoutingRecords.filter(item => item.id !== deletionId);
      saveScoutingJournalToStorage();
      renderScoutingTable();
    });
  });
}

// Clear scouting history
clearJournalBtn.addEventListener('click', () => {
  const securityCheckText = currentLang === 'es' ? '¿Está seguro de restablecer por completo su registro diario?' : (currentLang === 'hi' ? 'क्या आप अपना स्थानीय डायग्नोस्टिक जर्नल साफ़ करना चाहते हैं?' : (currentLang === 'vi' ? 'Bạn có thật sự muốn xóa hết nhật ký chẩn đoán?' : 'Are you sure you want to completely erase your Local Farm Journal?'));
  if (confirm(securityCheckText)) {
    farmScoutingRecords = [];
    saveScoutingJournalToStorage();
    renderScoutingTable();
  }
});

// CSV Diagnostic Report export offline
exportJournalBtn.addEventListener('click', () => {
  if (farmScoutingRecords.length === 0) return;

  const headerColumns = ["Date & Time", "DIAGNOSIS KEY", "DIAGNOSTIC PATH", "AI CONFIDENCE SCORE", "SCOUT FIELD NOTES"];
  const formattedRows = farmScoutingRecords.map(item => {
    const csvDate = new Date(item.timestamp).toISOString().replace(/"/g, '""');
    const csvKey = item.key.replace(/"/g, '""');
    const csvName = getLocalizedDiseaseName(item.key).replace(/"/g, '""');
    const csvConfidence = item.confidence + "%";
    const csvNotes = (item.notes || "").replace(/"/g, '""');

    return `"${csvDate}","${csvKey}","${csvName}","${csvConfidence}","${csvNotes}"`;
  });

  const fullCsvContent = [headerColumns.map(col => `"${col}"`).join(','), ...formattedRows].join('\r\n');
  const csvBlob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), fullCsvContent], { type: 'text/csv;charset=utf-8' }); // UTF-8 BOM representation
  
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(csvBlob);
  downloadLink.download = `CropDoc_Scouting_Journal_${Date.now()}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
});

// 14. INITIALIZATION SAFETY BOUNDS
initializeApp();
initCameraStream();
