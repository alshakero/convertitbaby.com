const LANGUAGE_STORAGE_KEY = "convertitbaby-language";
const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = {
  en: { label: "English", dir: "ltr" },
  ar: { label: "العربية", dir: "rtl" },
  pl: { label: "Polski", dir: "ltr" },
  de: { label: "Deutsch", dir: "ltr" },
};

const fileKindKeys = {
  archive: "fileKind.archive",
  document: "fileKind.document",
  office: "fileKind.office",
  data: "fileKind.data",
  config: "fileKind.config",
  email: "fileKind.email",
  certificate: "fileKind.certificate",
  playlist: "fileKind.playlist",
  palette: "fileKind.palette",
  workout: "fileKind.workout",
  rawImage: "fileKind.rawImage",
  subtitle: "fileKind.subtitle",
  geo: "fileKind.geo",
  ebook: "fileKind.ebook",
  vector: "fileKind.vector",
  font: "fileKind.font",
  model3d: "fileKind.model3d",
  code: "fileKind.code",
  heic: "fileKind.heic",
  image: "fileKind.image",
  gif: "fileKind.gif",
  pdf: "fileKind.pdf",
  video: "fileKind.video",
  audio: "fileKind.audio",
  unknown: "fileKind.unknown",
};

const outputLabelKeys = {
  "WebM video": "output.webmVideo",
  "MP4 video": "output.mp4Video",
  "JPG still": "output.jpgStill",
  "PNG still": "output.pngStill",
  "Compressed PDF": "output.compressedPdf",
  "PNG images": "output.pngImages",
  "ZIP archive": "output.zipArchive",
  "TAR archive": "output.tarArchive",
  "TGZ archive": "output.tgzArchive",
  "GZIP file": "output.gzipFile",
  "7Z archive": "output.7zArchive",
  "RAR archive": "output.rarArchive",
  "BZIP2 file": "output.bzip2File",
  "XZ file": "output.xzFile",
  "Zstandard file": "output.zstandardFile",
  "Brotli file": "output.brotliFile",
  Pretty: "output.pretty",
  Minified: "output.minified",
  Original: "output.original",
};

const enPlural = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const translations = {
  en: {
    "page.home.title":
      "convertitbaby.com - Private, Free File and Archive Converter",
    "page.about.title": "About convertitbaby.com",
    "nav.primary": "Primary",
    "nav.home": "convertitbaby.com home",
    "nav.about": "About",
    "nav.source": "Source code",
    "language.label": "Language",
    "home.eyebrow": "Free, private, no limits",
    "home.title": "Drop files. Pick outputs. Go.",
    "home.lede":
      "Add as many images, media files, PDFs, archives, or compressed files as you want. Nothing uploads, so conversion starts immediately on your device.",
    "home.formatCount":
      "99 supported formats, all handled privately on your device.",
    "drop.title": "Drop files here or choose files",
    "drop.meta":
      "Images, PDFs, media, archives, office files, email, certificates, playlists, palettes, maps, workout files, fonts, ebooks, 3D, and code",
    "support.eyebrow": "Supported files",
    "support.title":
      "We detect each file and show the outputs that make sense.",
    "support.images.title": "Images",
    "support.images.body":
      "HEIC, HEIF, JPG, PNG, WebP, AVIF, BMP, TIFF, GIF stills, JXL, PSD, DNG, CR2, NEF, and ARW files are recognized.",
    "support.media.title": "Media",
    "support.media.body":
      "GIF, audio, and video formats are detected automatically. Choose from the available outputs for each file.",
    "support.archives.title": "Archives",
    "support.archives.body":
      "ZIP, RAR, 7Z, TAR, GZIP, TGZ, BZ2, XZ, Zstandard, Brotli, LZ, and LZMA files can be detected and repackaged.",
    "support.documents.title": "Documents & office",
    "support.documents.body":
      "DOCX, TXT, Markdown, HTML, PPTX, ODT, ODP, ODS, and XLSX can become readable document or table formats. PDFs can become PNG pages or compressed PDFs.",
    "support.data.title": "Data & spreadsheets",
    "support.data.body":
      "JSON, YAML, CSV, TSV, XML, XLSX, vCard, iCal, and env files can move between structured, readable formats.",
    "support.config.title": "Config",
    "support.config.body":
      "TOML, INI, properties, and plist files can convert to JSON, YAML, TOML, INI, or XML.",
    "support.email.title": "Email",
    "support.email.body":
      "EML can become TXT, HTML, or PDF. MSG files are detected and kept available for private handling.",
    "support.certificates.title": "Certificates",
    "support.certificates.body":
      "PEM, DER, CRT, and CER files can convert between certificate encodings or export a readable summary.",
    "support.playlists.title": "Playlists",
    "support.playlists.body":
      "M3U, M3U8, PLS, and CUE playlists can become JSON, CSV, or plain text.",
    "support.palettes.title": "Palettes",
    "support.palettes.body":
      "GPL, ASE, and palette images can export colors as JSON or CSS variables.",
    "support.captions.title": "Captions",
    "support.captions.body":
      "SRT and WebVTT subtitles can convert between caption formats or export plain transcript text.",
    "support.mapWorkout.title": "Map & workout data",
    "support.mapWorkout.body":
      "GeoJSON, KML, GPX, TCX, NMEA, and FIT can convert or export point data where the format can be read locally.",
    "support.vector.title": "Vector & icons",
    "support.vector.body":
      "SVG can export to PNG, WebP, or PDF. Images can also become ICO files.",
    "support.ebooks.title": "Ebooks",
    "support.ebooks.body":
      "EPUB can become HTML, TXT, or PDF. MOBI and AZW3 files are recognized when added.",
    "support.fonts.title": "Fonts",
    "support.fonts.body":
      "TTF, OTF, WOFF, and WOFF2 files are recognized and kept available for private handling.",
    "support.models.title": "3D models",
    "support.models.body":
      "OBJ and STL can convert between each other. GLTF and GLB can also convert between text and binary forms.",
    "support.code.title": "Code",
    "support.code.body":
      "CSS, JavaScript, SQL, GraphQL, and Proto files can be cleaned up for reading or minified for smaller files.",
    "queue.eyebrow": "File queue",
    "queue.title": "Choose outputs for each file",
    "queue.clear": "Clear",
    "queue.go": "Go",
    "queue.empty":
      "Your files will appear here with an output menu for each one.",
    "results.label": "Batch download",
    "results.downloadAll": "Download all",
    "footer.privacy":
      "convertitbaby.com keeps file, archive, and compression conversion private. Files are never uploaded anyways.",
    "footer.madeInPoland": "Made in Poland with ❤️",
    "footer.source": "View the source on GitHub",
    "about.eyebrow": "About",
    "about.title": "Private file conversion, because files are personal.",
    "about.lede":
      "I always find myself converting files online, then immediately worrying about what happens to those files after upload. So I made convertitbaby.com as a privacy-oriented tool to fix that issue.",
    "about.browser":
      "Conversion happens entirely in your browser. Your files are not uploaded to a server, so file conversion stays useful without making you hand over the file first.",
    "about.madeByPrefix": "Made by",
    "about.madeBySuffix": "in 2026.",
    "status.dropFiles": "Drop files to begin.",
    "status.noFilesSelected":
      "No files were selected. Try dragging the file in instead.",
    "status.couldNotAdd": "Could not add that file.",
    "status.filesAdded": ({ added, total }) =>
      `${enPlural(added, "file")} added. ${enPlural(total, "file")} in queue.`,
    "status.addSupportedFiles": "Add supported files first.",
    "status.converting": ({ count }) =>
      `Converting ${enPlural(count, "file")}...`,
    "status.doneFailed": ({ done, failed }) => `${done} done, ${failed} failed.`,
    "status.converted": ({ count }) => `Converted ${enPlural(count, "file")}.`,
    "status.preparingDownload": ({ count }) =>
      `Preparing ${enPlural(count, "file")} for download...`,
    "status.downloaded": ({ filename }) => `Downloaded ${filename}.`,
    "status.downloadedZip": ({ count }) =>
      `Downloaded ${enPlural(count, "file")} as a ZIP.`,
    "status.couldNotPrepareDownload":
      "Could not prepare the batch download.",
    "itemStatus.ready": "Ready",
    "itemStatus.unavailable": "Unavailable",
    "itemStatus.unsupported": "Unsupported",
    "itemStatus.converting": "Converting",
    "itemStatus.done": "Done",
    "itemStatus.failed": "Failed",
    "queue.outputFor": ({ filename }) => `Output format for ${filename}`,
    "queue.remove": "Remove",
    "queue.removeFile": ({ filename }) => `Remove ${filename}`,
    "queue.supportNote": "Some outputs are unavailable for this file.",
    "fileKind.archive": "Archive",
    "fileKind.document": "Document",
    "fileKind.office": "Office",
    "fileKind.data": "Data",
    "fileKind.config": "Config",
    "fileKind.email": "Email",
    "fileKind.certificate": "Certificate",
    "fileKind.playlist": "Playlist",
    "fileKind.palette": "Palette",
    "fileKind.workout": "Workout",
    "fileKind.rawImage": "Specialized image",
    "fileKind.subtitle": "Subtitles",
    "fileKind.geo": "Map data",
    "fileKind.ebook": "Ebook",
    "fileKind.vector": "Vector",
    "fileKind.font": "Font",
    "fileKind.model3d": "3D model",
    "fileKind.code": "Code",
    "fileKind.heic": "HEIC image",
    "fileKind.image": "Image",
    "fileKind.gif": "GIF",
    "fileKind.pdf": "PDF",
    "fileKind.video": "Video",
    "fileKind.audio": "Audio",
    "fileKind.unknown": "Unsupported",
    "fileKind.file": "File",
    "output.webmVideo": "WebM video",
    "output.mp4Video": "MP4 video",
    "output.jpgStill": "JPG still",
    "output.pngStill": "PNG still",
    "output.compressedPdf": "Compressed PDF",
    "output.pngImages": "PNG images",
    "output.zipArchive": "ZIP archive",
    "output.tarArchive": "TAR archive",
    "output.tgzArchive": "TGZ archive",
    "output.gzipFile": "GZIP file",
    "output.7zArchive": "7Z archive",
    "output.rarArchive": "RAR archive",
    "output.bzip2File": "BZIP2 file",
    "output.xzFile": "XZ file",
    "output.zstandardFile": "Zstandard file",
    "output.brotliFile": "Brotli file",
    "output.pretty": "Pretty",
    "output.minified": "Minified",
    "output.original": "Original",
  },
  ar: {
    "page.home.title": "convertitbaby.com - محول ملفات وأرشيفات خاص ومجاني",
    "page.about.title": "حول convertitbaby.com",
    "nav.primary": "أساسي",
    "nav.home": "الصفحة الرئيسية لـ convertitbaby.com",
    "nav.about": "حول",
    "nav.source": "الشيفرة المصدرية",
    "language.label": "اللغة",
    "home.eyebrow": "مجاني وخاص ومن دون حدود",
    "home.title": "أفلت الملفات. اختر الصيغ. وانطلق.",
    "home.lede":
      "أضف أي عدد تريده من الصور أو ملفات الوسائط أو ملفات PDF أو الأرشيفات أو الملفات المضغوطة. لا يتم رفع أي شيء، لذلك يبدأ التحويل فوراً على جهازك.",
    "home.formatCount": "99 صيغة مدعومة، وكلها تعالج بخصوصية على جهازك.",
    "drop.title": "أفلت الملفات هنا أو اختر ملفات",
    "drop.meta":
      "صور، PDF، وسائط، أرشيفات، ملفات مكتبية، بريد إلكتروني، شهادات، قوائم تشغيل، لوحات ألوان، خرائط، ملفات تمارين، خطوط، كتب إلكترونية، نماذج ثلاثية الأبعاد، وشيفرة",
    "support.eyebrow": "الملفات المدعومة",
    "support.title": "نكتشف كل ملف ونعرض المخرجات المناسبة له.",
    "support.images.title": "الصور",
    "support.images.body":
      "يتم التعرف على ملفات HEIC وHEIF وJPG وPNG وWebP وAVIF وBMP وTIFF ولقطات GIF وJXL وPSD وDNG وCR2 وNEF وARW.",
    "support.media.title": "الوسائط",
    "support.media.body":
      "يتم اكتشاف صيغ GIF والصوت والفيديو تلقائياً. اختر من المخرجات المتاحة لكل ملف.",
    "support.archives.title": "الأرشيفات",
    "support.archives.body":
      "يمكن اكتشاف ملفات ZIP وRAR و7Z وTAR وGZIP وTGZ وBZ2 وXZ وZstandard وBrotli وLZ وLZMA وإعادة حزمها.",
    "support.documents.title": "المستندات والملفات المكتبية",
    "support.documents.body":
      "يمكن تحويل DOCX وTXT وMarkdown وHTML وPPTX وODT وODP وODS وXLSX إلى صيغ مستندات أو جداول قابلة للقراءة. ويمكن تحويل PDF إلى صفحات PNG أو ملفات PDF مضغوطة.",
    "support.data.title": "البيانات والجداول",
    "support.data.body":
      "يمكن نقل JSON وYAML وCSV وTSV وXML وXLSX وvCard وiCal وملفات env بين صيغ منظمة ومقروءة.",
    "support.config.title": "الإعدادات",
    "support.config.body":
      "يمكن تحويل ملفات TOML وINI وproperties وplist إلى JSON أو YAML أو TOML أو INI أو XML.",
    "support.email.title": "البريد الإلكتروني",
    "support.email.body":
      "يمكن تحويل EML إلى TXT أو HTML أو PDF. ويتم اكتشاف ملفات MSG وإتاحتها للمعالجة الخاصة.",
    "support.certificates.title": "الشهادات",
    "support.certificates.body":
      "يمكن تحويل ملفات PEM وDER وCRT وCER بين ترميزات الشهادات أو تصدير ملخص قابل للقراءة.",
    "support.playlists.title": "قوائم التشغيل",
    "support.playlists.body":
      "يمكن تحويل قوائم M3U وM3U8 وPLS وCUE إلى JSON أو CSV أو نص عادي.",
    "support.palettes.title": "لوحات الألوان",
    "support.palettes.body":
      "يمكن تصدير ألوان GPL وASE وصور اللوحات بصيغة JSON أو متغيرات CSS.",
    "support.captions.title": "الترجمات النصية",
    "support.captions.body":
      "يمكن تحويل ترجمات SRT وWebVTT بين صيغ التعليقات أو تصدير نص التفريغ فقط.",
    "support.mapWorkout.title": "بيانات الخرائط والتمارين",
    "support.mapWorkout.body":
      "يمكن تحويل GeoJSON وKML وGPX وTCX وNMEA وFIT أو تصدير بيانات النقاط عندما يمكن قراءة الصيغة محلياً.",
    "support.vector.title": "المتجهات والأيقونات",
    "support.vector.body":
      "يمكن تصدير SVG إلى PNG أو WebP أو PDF. ويمكن أيضاً تحويل الصور إلى ملفات ICO.",
    "support.ebooks.title": "الكتب الإلكترونية",
    "support.ebooks.body":
      "يمكن تحويل EPUB إلى HTML أو TXT أو PDF. ويتم التعرف على ملفات MOBI وAZW3 عند إضافتها.",
    "support.fonts.title": "الخطوط",
    "support.fonts.body":
      "يتم التعرف على ملفات TTF وOTF وWOFF وWOFF2 وإتاحتها للمعالجة الخاصة.",
    "support.models.title": "نماذج ثلاثية الأبعاد",
    "support.models.body":
      "يمكن تحويل OBJ وSTL بين بعضهما. ويمكن أيضاً تحويل GLTF وGLB بين الصيغة النصية والثنائية.",
    "support.code.title": "الشيفرة",
    "support.code.body":
      "يمكن تنظيف ملفات CSS وJavaScript وSQL وGraphQL وProto للقراءة أو تصغيرها لتقليل الحجم.",
    "queue.eyebrow": "قائمة الملفات",
    "queue.title": "اختر المخرجات لكل ملف",
    "queue.clear": "مسح",
    "queue.go": "ابدأ",
    "queue.empty": "ستظهر ملفاتك هنا مع قائمة مخرجات لكل ملف.",
    "results.label": "تنزيل الدفعة",
    "results.downloadAll": "تنزيل الكل",
    "footer.privacy":
      "يحافظ convertitbaby.com على خصوصية تحويل الملفات والأرشيفات والضغط. لا يتم رفع الملفات أبداً.",
    "footer.madeInPoland": "صنع في بولندا مع ❤️",
    "footer.source": "عرض المصدر على GitHub",
    "about.eyebrow": "حول",
    "about.title": "تحويل ملفات خاص، لأن الملفات شخصية.",
    "about.lede":
      "أجد نفسي دائماً أحول الملفات عبر الإنترنت، ثم أقلق فوراً مما يحدث لها بعد رفعها. لذلك صنعت convertitbaby.com كأداة تركز على الخصوصية لحل هذه المشكلة.",
    "about.browser":
      "يحدث التحويل بالكامل داخل متصفحك. لا يتم رفع ملفاتك إلى خادم، لذلك يبقى تحويل الملفات مفيداً من دون أن تضطر إلى تسليم الملف أولاً.",
    "about.madeByPrefix": "صنعه",
    "about.madeBySuffix": "في 2026.",
    "status.dropFiles": "أفلت الملفات للبدء.",
    "status.noFilesSelected":
      "لم يتم اختيار أي ملفات. جرّب سحب الملف وإفلاته بدلاً من ذلك.",
    "status.couldNotAdd": "تعذرت إضافة ذلك الملف.",
    "status.filesAdded": ({ added, total }) =>
      `تمت إضافة ${added}. إجمالي الملفات في القائمة: ${total}.`,
    "status.addSupportedFiles": "أضف ملفات مدعومة أولاً.",
    "status.converting": ({ count }) => `جار تحويل ${count} ملف.`,
    "status.doneFailed": ({ done, failed }) =>
      `اكتمل ${done}، وفشل ${failed}.`,
    "status.converted": ({ count }) => `اكتمل تحويل ${count} ملف.`,
    "status.preparingDownload": ({ count }) =>
      `جار تجهيز ${count} ملف للتنزيل.`,
    "status.downloaded": ({ filename }) => `تم تنزيل ${filename}.`,
    "status.downloadedZip": ({ count }) =>
      `تم تنزيل ${count} ملف كأرشيف ZIP.`,
    "status.couldNotPrepareDownload": "تعذر تجهيز تنزيل الدفعة.",
    "itemStatus.ready": "جاهز",
    "itemStatus.unavailable": "غير متاح",
    "itemStatus.unsupported": "غير مدعوم",
    "itemStatus.converting": "جار التحويل",
    "itemStatus.done": "تم",
    "itemStatus.failed": "فشل",
    "queue.outputFor": ({ filename }) => `صيغة الإخراج لـ ${filename}`,
    "queue.remove": "إزالة",
    "queue.removeFile": ({ filename }) => `إزالة ${filename}`,
    "queue.supportNote": "بعض المخرجات غير متاحة لهذا الملف.",
    "fileKind.archive": "أرشيف",
    "fileKind.document": "مستند",
    "fileKind.office": "ملف مكتبي",
    "fileKind.data": "بيانات",
    "fileKind.config": "إعدادات",
    "fileKind.email": "بريد إلكتروني",
    "fileKind.certificate": "شهادة",
    "fileKind.playlist": "قائمة تشغيل",
    "fileKind.palette": "لوحة ألوان",
    "fileKind.workout": "تمارين",
    "fileKind.rawImage": "صورة متخصصة",
    "fileKind.subtitle": "ترجمات نصية",
    "fileKind.geo": "بيانات خرائط",
    "fileKind.ebook": "كتاب إلكتروني",
    "fileKind.vector": "متجه",
    "fileKind.font": "خط",
    "fileKind.model3d": "نموذج ثلاثي الأبعاد",
    "fileKind.code": "شيفرة",
    "fileKind.heic": "صورة HEIC",
    "fileKind.image": "صورة",
    "fileKind.gif": "GIF",
    "fileKind.pdf": "PDF",
    "fileKind.video": "فيديو",
    "fileKind.audio": "صوت",
    "fileKind.unknown": "غير مدعوم",
    "fileKind.file": "ملف",
    "output.webmVideo": "فيديو WebM",
    "output.mp4Video": "فيديو MP4",
    "output.jpgStill": "لقطة JPG",
    "output.pngStill": "لقطة PNG",
    "output.compressedPdf": "PDF مضغوط",
    "output.pngImages": "صور PNG",
    "output.zipArchive": "أرشيف ZIP",
    "output.tarArchive": "أرشيف TAR",
    "output.tgzArchive": "أرشيف TGZ",
    "output.gzipFile": "ملف GZIP",
    "output.7zArchive": "أرشيف 7Z",
    "output.rarArchive": "أرشيف RAR",
    "output.bzip2File": "ملف BZIP2",
    "output.xzFile": "ملف XZ",
    "output.zstandardFile": "ملف Zstandard",
    "output.brotliFile": "ملف Brotli",
    "output.pretty": "منسق",
    "output.minified": "مصغر",
    "output.original": "الأصلي",
  },
  pl: {
    "page.home.title":
      "convertitbaby.com - prywatny, darmowy konwerter plików i archiwów",
    "page.about.title": "O convertitbaby.com",
    "nav.primary": "Główna",
    "nav.home": "Strona główna convertitbaby.com",
    "nav.about": "O stronie",
    "nav.source": "Kod źródłowy",
    "language.label": "Język",
    "home.eyebrow": "Za darmo, prywatnie, bez limitów",
    "home.title": "Upuść pliki. Wybierz formaty. Gotowe.",
    "home.lede":
      "Dodaj dowolną liczbę obrazów, plików multimedialnych, PDF-ów, archiwów lub plików skompresowanych. Nic nie jest wysyłane, więc konwersja zaczyna się od razu na Twoim urządzeniu.",
    "home.formatCount":
      "99 obsługiwanych formatów, wszystkie przetwarzane prywatnie na Twoim urządzeniu.",
    "drop.title": "Upuść pliki tutaj albo wybierz pliki",
    "drop.meta":
      "Obrazy, PDF-y, multimedia, archiwa, pliki biurowe, e-mail, certyfikaty, playlisty, palety, mapy, treningi, fonty, ebooki, 3D i kod",
    "support.eyebrow": "Obsługiwane pliki",
    "support.title":
      "Wykrywamy każdy plik i pokazujemy pasujące formaty wyjściowe.",
    "support.images.title": "Obrazy",
    "support.images.body":
      "Rozpoznawane są pliki HEIC, HEIF, JPG, PNG, WebP, AVIF, BMP, TIFF, klatki GIF, JXL, PSD, DNG, CR2, NEF i ARW.",
    "support.media.title": "Multimedia",
    "support.media.body":
      "Formaty GIF, audio i wideo są wykrywane automatycznie. Wybierz dostępny format wyjściowy dla każdego pliku.",
    "support.archives.title": "Archiwa",
    "support.archives.body":
      "Pliki ZIP, RAR, 7Z, TAR, GZIP, TGZ, BZ2, XZ, Zstandard, Brotli, LZ i LZMA mogą być wykrywane i przepakowywane.",
    "support.documents.title": "Dokumenty i biuro",
    "support.documents.body":
      "DOCX, TXT, Markdown, HTML, PPTX, ODT, ODP, ODS i XLSX mogą stać się czytelnymi dokumentami lub tabelami. PDF-y mogą stać się stronami PNG albo skompresowanymi PDF-ami.",
    "support.data.title": "Dane i arkusze",
    "support.data.body":
      "JSON, YAML, CSV, TSV, XML, XLSX, vCard, iCal i pliki env można przenosić między uporządkowanymi, czytelnymi formatami.",
    "support.config.title": "Konfiguracja",
    "support.config.body":
      "Pliki TOML, INI, properties i plist można konwertować do JSON, YAML, TOML, INI albo XML.",
    "support.email.title": "E-mail",
    "support.email.body":
      "EML może stać się TXT, HTML albo PDF. Pliki MSG są wykrywane i pozostają dostępne do prywatnej obsługi.",
    "support.certificates.title": "Certyfikaty",
    "support.certificates.body":
      "Pliki PEM, DER, CRT i CER można konwertować między kodowaniami certyfikatów albo eksportować jako czytelne podsumowanie.",
    "support.playlists.title": "Playlisty",
    "support.playlists.body":
      "Playlisty M3U, M3U8, PLS i CUE mogą stać się JSON, CSV albo zwykłym tekstem.",
    "support.palettes.title": "Palety",
    "support.palettes.body":
      "GPL, ASE i obrazy palet mogą eksportować kolory jako JSON albo zmienne CSS.",
    "support.captions.title": "Napisy",
    "support.captions.body":
      "Napisy SRT i WebVTT można konwertować między formatami napisów albo eksportować jako zwykły transkrypt.",
    "support.mapWorkout.title": "Mapy i treningi",
    "support.mapWorkout.body":
      "GeoJSON, KML, GPX, TCX, NMEA i FIT można konwertować albo eksportować jako dane punktów, gdy format da się odczytać lokalnie.",
    "support.vector.title": "Wektory i ikony",
    "support.vector.body":
      "SVG można eksportować do PNG, WebP albo PDF. Obrazy mogą też stać się plikami ICO.",
    "support.ebooks.title": "Ebooki",
    "support.ebooks.body":
      "EPUB może stać się HTML, TXT albo PDF. Pliki MOBI i AZW3 są rozpoznawane po dodaniu.",
    "support.fonts.title": "Fonty",
    "support.fonts.body":
      "Pliki TTF, OTF, WOFF i WOFF2 są rozpoznawane i pozostają dostępne do prywatnej obsługi.",
    "support.models.title": "Modele 3D",
    "support.models.body":
      "OBJ i STL można konwertować między sobą. GLTF i GLB można też konwertować między postacią tekstową i binarną.",
    "support.code.title": "Kod",
    "support.code.body":
      "Pliki CSS, JavaScript, SQL, GraphQL i Proto można uporządkować do czytania albo zminifikować, aby były mniejsze.",
    "queue.eyebrow": "Kolejka plików",
    "queue.title": "Wybierz format wyjściowy dla każdego pliku",
    "queue.clear": "Wyczyść",
    "queue.go": "Start",
    "queue.empty":
      "Twoje pliki pojawią się tutaj z menu formatu wyjściowego dla każdego z nich.",
    "results.label": "Pobieranie partii",
    "results.downloadAll": "Pobierz wszystko",
    "footer.privacy":
      "convertitbaby.com dba o prywatną konwersję plików, archiwów i kompresji. Pliki nigdy nie są wysyłane.",
    "footer.madeInPoland": "Stworzone w Polsce z ❤️",
    "footer.source": "Zobacz kod na GitHubie",
    "about.eyebrow": "O stronie",
    "about.title": "Prywatna konwersja plików, bo pliki są osobiste.",
    "about.lede":
      "Ciągle zdarza mi się konwertować pliki online, a potem od razu martwić się, co dzieje się z nimi po wysłaniu. Dlatego stworzyłem convertitbaby.com jako narzędzie nastawione na prywatność.",
    "about.browser":
      "Konwersja odbywa się w całości w przeglądarce. Twoje pliki nie trafiają na serwer, więc konwersja pozostaje użyteczna bez oddawania pliku komukolwiek.",
    "about.madeByPrefix": "Stworzone przez",
    "about.madeBySuffix": "w 2026.",
    "status.dropFiles": "Upuść pliki, aby zacząć.",
    "status.noFilesSelected":
      "Nie wybrano plików. Spróbuj przeciągnąć plik tutaj.",
    "status.couldNotAdd": "Nie udało się dodać tego pliku.",
    "status.filesAdded": ({ added, total }) =>
      `Dodano: ${added}. W kolejce: ${total}.`,
    "status.addSupportedFiles": "Najpierw dodaj obsługiwane pliki.",
    "status.converting": ({ count }) => `Konwersja plików: ${count}.`,
    "status.doneFailed": ({ done, failed }) =>
      `Ukończono: ${done}, niepowodzenia: ${failed}.`,
    "status.converted": ({ count }) => `Przekonwertowano pliki: ${count}.`,
    "status.preparingDownload": ({ count }) =>
      `Przygotowywanie plików do pobrania: ${count}.`,
    "status.downloaded": ({ filename }) => `Pobrano ${filename}.`,
    "status.downloadedZip": ({ count }) =>
      `Pobrano pliki jako ZIP: ${count}.`,
    "status.couldNotPrepareDownload":
      "Nie udało się przygotować pobierania partii.",
    "itemStatus.ready": "Gotowe",
    "itemStatus.unavailable": "Niedostępne",
    "itemStatus.unsupported": "Nieobsługiwane",
    "itemStatus.converting": "Konwersja",
    "itemStatus.done": "Ukończono",
    "itemStatus.failed": "Niepowodzenie",
    "queue.outputFor": ({ filename }) => `Format wyjściowy dla ${filename}`,
    "queue.remove": "Usuń",
    "queue.removeFile": ({ filename }) => `Usuń ${filename}`,
    "queue.supportNote": "Niektóre formaty wyjściowe są niedostępne dla tego pliku.",
    "fileKind.archive": "Archiwum",
    "fileKind.document": "Dokument",
    "fileKind.office": "Biuro",
    "fileKind.data": "Dane",
    "fileKind.config": "Konfiguracja",
    "fileKind.email": "E-mail",
    "fileKind.certificate": "Certyfikat",
    "fileKind.playlist": "Playlista",
    "fileKind.palette": "Paleta",
    "fileKind.workout": "Trening",
    "fileKind.rawImage": "Obraz specjalistyczny",
    "fileKind.subtitle": "Napisy",
    "fileKind.geo": "Dane map",
    "fileKind.ebook": "Ebook",
    "fileKind.vector": "Wektor",
    "fileKind.font": "Font",
    "fileKind.model3d": "Model 3D",
    "fileKind.code": "Kod",
    "fileKind.heic": "Obraz HEIC",
    "fileKind.image": "Obraz",
    "fileKind.gif": "GIF",
    "fileKind.pdf": "PDF",
    "fileKind.video": "Wideo",
    "fileKind.audio": "Audio",
    "fileKind.unknown": "Nieobsługiwane",
    "fileKind.file": "Plik",
    "output.webmVideo": "Wideo WebM",
    "output.mp4Video": "Wideo MP4",
    "output.jpgStill": "Klatka JPG",
    "output.pngStill": "Klatka PNG",
    "output.compressedPdf": "Skompresowany PDF",
    "output.pngImages": "Obrazy PNG",
    "output.zipArchive": "Archiwum ZIP",
    "output.tarArchive": "Archiwum TAR",
    "output.tgzArchive": "Archiwum TGZ",
    "output.gzipFile": "Plik GZIP",
    "output.7zArchive": "Archiwum 7Z",
    "output.rarArchive": "Archiwum RAR",
    "output.bzip2File": "Plik BZIP2",
    "output.xzFile": "Plik XZ",
    "output.zstandardFile": "Plik Zstandard",
    "output.brotliFile": "Plik Brotli",
    "output.pretty": "Czytelny",
    "output.minified": "Zminifikowany",
    "output.original": "Oryginał",
  },
  de: {
    "page.home.title":
      "convertitbaby.com - privater, kostenloser Datei- und Archivkonverter",
    "page.about.title": "Über convertitbaby.com",
    "nav.primary": "Primär",
    "nav.home": "Startseite von convertitbaby.com",
    "nav.about": "Über",
    "nav.source": "Quellcode",
    "language.label": "Sprache",
    "home.eyebrow": "Kostenlos, privat, ohne Limits",
    "home.title": "Dateien ablegen. Formate wählen. Los.",
    "home.lede":
      "Füge so viele Bilder, Mediendateien, PDFs, Archive oder komprimierte Dateien hinzu, wie du möchtest. Nichts wird hochgeladen, daher beginnt die Konvertierung sofort auf deinem Gerät.",
    "home.formatCount":
      "99 unterstützte Formate, alle privat auf deinem Gerät verarbeitet.",
    "drop.title": "Dateien hier ablegen oder auswählen",
    "drop.meta":
      "Bilder, PDFs, Medien, Archive, Office-Dateien, E-Mail, Zertifikate, Playlists, Paletten, Karten, Trainingsdateien, Schriften, E-Books, 3D und Code",
    "support.eyebrow": "Unterstützte Dateien",
    "support.title":
      "Wir erkennen jede Datei und zeigen die passenden Ausgaben.",
    "support.images.title": "Bilder",
    "support.images.body":
      "HEIC, HEIF, JPG, PNG, WebP, AVIF, BMP, TIFF, GIF-Standbilder, JXL, PSD, DNG, CR2, NEF und ARW werden erkannt.",
    "support.media.title": "Medien",
    "support.media.body":
      "GIF-, Audio- und Videoformate werden automatisch erkannt. Wähle die verfügbaren Ausgaben für jede Datei.",
    "support.archives.title": "Archive",
    "support.archives.body":
      "ZIP, RAR, 7Z, TAR, GZIP, TGZ, BZ2, XZ, Zstandard, Brotli, LZ und LZMA können erkannt und neu gepackt werden.",
    "support.documents.title": "Dokumente & Office",
    "support.documents.body":
      "DOCX, TXT, Markdown, HTML, PPTX, ODT, ODP, ODS und XLSX können zu lesbaren Dokument- oder Tabellenformaten werden. PDFs können PNG-Seiten oder komprimierte PDFs werden.",
    "support.data.title": "Daten & Tabellen",
    "support.data.body":
      "JSON, YAML, CSV, TSV, XML, XLSX, vCard, iCal und env-Dateien können zwischen strukturierten, lesbaren Formaten wechseln.",
    "support.config.title": "Konfiguration",
    "support.config.body":
      "TOML-, INI-, properties- und plist-Dateien können zu JSON, YAML, TOML, INI oder XML konvertiert werden.",
    "support.email.title": "E-Mail",
    "support.email.body":
      "EML kann zu TXT, HTML oder PDF werden. MSG-Dateien werden erkannt und für die private Verarbeitung bereitgehalten.",
    "support.certificates.title": "Zertifikate",
    "support.certificates.body":
      "PEM-, DER-, CRT- und CER-Dateien können zwischen Zertifikatskodierungen konvertiert oder als lesbare Zusammenfassung exportiert werden.",
    "support.playlists.title": "Playlists",
    "support.playlists.body":
      "M3U-, M3U8-, PLS- und CUE-Playlists können zu JSON, CSV oder Klartext werden.",
    "support.palettes.title": "Paletten",
    "support.palettes.body":
      "GPL, ASE und Palettenbilder können Farben als JSON oder CSS-Variablen exportieren.",
    "support.captions.title": "Untertitel",
    "support.captions.body":
      "SRT- und WebVTT-Untertitel können zwischen Untertitelformaten konvertiert oder als reiner Transkripttext exportiert werden.",
    "support.mapWorkout.title": "Karten- & Trainingsdaten",
    "support.mapWorkout.body":
      "GeoJSON, KML, GPX, TCX, NMEA und FIT können konvertiert oder als Punktdaten exportiert werden, wenn das Format lokal lesbar ist.",
    "support.vector.title": "Vektoren & Icons",
    "support.vector.body":
      "SVG kann als PNG, WebP oder PDF exportiert werden. Bilder können auch zu ICO-Dateien werden.",
    "support.ebooks.title": "E-Books",
    "support.ebooks.body":
      "EPUB kann zu HTML, TXT oder PDF werden. MOBI- und AZW3-Dateien werden beim Hinzufügen erkannt.",
    "support.fonts.title": "Schriften",
    "support.fonts.body":
      "TTF-, OTF-, WOFF- und WOFF2-Dateien werden erkannt und für die private Verarbeitung bereitgehalten.",
    "support.models.title": "3D-Modelle",
    "support.models.body":
      "OBJ und STL können ineinander konvertiert werden. GLTF und GLB können außerdem zwischen Text- und Binärform wechseln.",
    "support.code.title": "Code",
    "support.code.body":
      "CSS-, JavaScript-, SQL-, GraphQL- und Proto-Dateien können zum Lesen formatiert oder für kleinere Dateien minifiziert werden.",
    "queue.eyebrow": "Dateiwarteschlange",
    "queue.title": "Ausgaben für jede Datei wählen",
    "queue.clear": "Leeren",
    "queue.go": "Los",
    "queue.empty":
      "Deine Dateien erscheinen hier mit einem Ausgabemenü für jede Datei.",
    "results.label": "Stapel-Download",
    "results.downloadAll": "Alle herunterladen",
    "footer.privacy":
      "convertitbaby.com hält Datei-, Archiv- und Komprimierungskonvertierung privat. Dateien werden nie hochgeladen.",
    "footer.madeInPoland": "Gemacht in Polen mit ❤️",
    "footer.source": "Quellcode auf GitHub ansehen",
    "about.eyebrow": "Über",
    "about.title": "Private Dateikonvertierung, weil Dateien persönlich sind.",
    "about.lede":
      "Ich konvertiere ständig Dateien online und frage mich danach sofort, was nach dem Upload mit ihnen passiert. Deshalb habe ich convertitbaby.com als datenschutzorientiertes Werkzeug gebaut.",
    "about.browser":
      "Die Konvertierung läuft vollständig in deinem Browser. Deine Dateien werden nicht auf einen Server hochgeladen, sodass Dateikonvertierung nützlich bleibt, ohne dass du die Datei zuerst aus der Hand gibst.",
    "about.madeByPrefix": "Gemacht von",
    "about.madeBySuffix": "im Jahr 2026.",
    "status.dropFiles": "Dateien ablegen, um zu beginnen.",
    "status.noFilesSelected":
      "Es wurden keine Dateien ausgewählt. Versuche, die Datei hierher zu ziehen.",
    "status.couldNotAdd": "Diese Datei konnte nicht hinzugefügt werden.",
    "status.filesAdded": ({ added, total }) =>
      `Hinzugefügt: ${added}. In der Warteschlange: ${total}.`,
    "status.addSupportedFiles": "Füge zuerst unterstützte Dateien hinzu.",
    "status.converting": ({ count }) => `Dateien werden konvertiert: ${count}.`,
    "status.doneFailed": ({ done, failed }) =>
      `Fertig: ${done}, fehlgeschlagen: ${failed}.`,
    "status.converted": ({ count }) => `Konvertierte Dateien: ${count}.`,
    "status.preparingDownload": ({ count }) =>
      `Dateien werden für den Download vorbereitet: ${count}.`,
    "status.downloaded": ({ filename }) => `${filename} heruntergeladen.`,
    "status.downloadedZip": ({ count }) =>
      `Dateien als ZIP heruntergeladen: ${count}.`,
    "status.couldNotPrepareDownload":
      "Der Stapel-Download konnte nicht vorbereitet werden.",
    "itemStatus.ready": "Bereit",
    "itemStatus.unavailable": "Nicht verfügbar",
    "itemStatus.unsupported": "Nicht unterstützt",
    "itemStatus.converting": "Konvertierung",
    "itemStatus.done": "Fertig",
    "itemStatus.failed": "Fehlgeschlagen",
    "queue.outputFor": ({ filename }) => `Ausgabeformat für ${filename}`,
    "queue.remove": "Entfernen",
    "queue.removeFile": ({ filename }) => `${filename} entfernen`,
    "queue.supportNote":
      "Einige Ausgaben sind für diese Datei nicht verfügbar.",
    "fileKind.archive": "Archiv",
    "fileKind.document": "Dokument",
    "fileKind.office": "Office",
    "fileKind.data": "Daten",
    "fileKind.config": "Konfiguration",
    "fileKind.email": "E-Mail",
    "fileKind.certificate": "Zertifikat",
    "fileKind.playlist": "Playlist",
    "fileKind.palette": "Palette",
    "fileKind.workout": "Training",
    "fileKind.rawImage": "Spezialbild",
    "fileKind.subtitle": "Untertitel",
    "fileKind.geo": "Kartendaten",
    "fileKind.ebook": "E-Book",
    "fileKind.vector": "Vektor",
    "fileKind.font": "Schrift",
    "fileKind.model3d": "3D-Modell",
    "fileKind.code": "Code",
    "fileKind.heic": "HEIC-Bild",
    "fileKind.image": "Bild",
    "fileKind.gif": "GIF",
    "fileKind.pdf": "PDF",
    "fileKind.video": "Video",
    "fileKind.audio": "Audio",
    "fileKind.unknown": "Nicht unterstützt",
    "fileKind.file": "Datei",
    "output.webmVideo": "WebM-Video",
    "output.mp4Video": "MP4-Video",
    "output.jpgStill": "JPG-Standbild",
    "output.pngStill": "PNG-Standbild",
    "output.compressedPdf": "Komprimiertes PDF",
    "output.pngImages": "PNG-Bilder",
    "output.zipArchive": "ZIP-Archiv",
    "output.tarArchive": "TAR-Archiv",
    "output.tgzArchive": "TGZ-Archiv",
    "output.gzipFile": "GZIP-Datei",
    "output.7zArchive": "7Z-Archiv",
    "output.rarArchive": "RAR-Archiv",
    "output.bzip2File": "BZIP2-Datei",
    "output.xzFile": "XZ-Datei",
    "output.zstandardFile": "Zstandard-Datei",
    "output.brotliFile": "Brotli-Datei",
    "output.pretty": "Formatiert",
    "output.minified": "Minifiziert",
    "output.original": "Original",
  },
};

let currentLanguage = getStoredLanguage();
const listeners = new Set();

export function initI18n({ onLanguageChange } = {}) {
  if (onLanguageChange) listeners.add(onLanguageChange);
  setupLanguageSelectors();
  applyTranslations();
}

export function t(key, params = {}) {
  const value = translations[currentLanguage]?.[key] ?? translations.en[key];
  if (typeof value === "function") return value(params);
  if (typeof value === "string") return formatTemplate(value, params);
  return key;
}

export function formatFileKindLabel(kind) {
  return t(fileKindKeys[kind] || "fileKind.file");
}

export function formatOutputLabel(label) {
  const key = outputLabelKeys[label];
  return key ? t(key) : label;
}

export function itemStatusLabel(status) {
  return t(`itemStatus.${status}`);
}

export function getCurrentLanguage() {
  return currentLanguage;
}

function setupLanguageSelectors() {
  document.querySelectorAll("[data-language-select]").forEach((select) => {
    select.value = currentLanguage;
    select.addEventListener("change", () => {
      setLanguage(select.value);
    });
  });
}

function setLanguage(language) {
  const nextLanguage = normalizeLanguage(language);
  if (nextLanguage === currentLanguage) return;

  currentLanguage = nextLanguage;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch {
    // Ignore storage failures; the selector still works for this page view.
  }
  applyTranslations();
  listeners.forEach((listener) => listener(currentLanguage));
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = LANGUAGES[currentLanguage].dir;

  const page = document.body.dataset.page;
  const pageTitle = page ? t(`page.${page}.title`) : "";
  if (pageTitle) document.title = pageTitle;

  document.querySelectorAll("[data-language-select]").forEach((select) => {
    select.value = currentLanguage;
  });

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-attrs]").forEach((element) => {
    element.dataset.i18nAttrs.split(",").forEach((pair) => {
      const [attribute, key] = pair.split(":").map((part) => part.trim());
      if (attribute && key) element.setAttribute(attribute, t(key));
    });
  });
}

function getStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function normalizeLanguage(language) {
  return Object.hasOwn(LANGUAGES, language) ? language : DEFAULT_LANGUAGE;
}

function formatTemplate(value, params) {
  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => params[key] ?? "");
}
