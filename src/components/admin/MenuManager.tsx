import React, { useState, useRef } from 'react';
import { MenuItem, Presentacion } from '../../types';
import { storageService } from '../../services/storage';
import {
  Utensils,
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  DollarSign,
  Image as ImageIcon,
  Clock,
  Sparkles,
  Download,
  Upload,
  Database,
  RefreshCw,
  Search,
  Table,
  LayoutGrid,
  Percent,
  FileSpreadsheet,
  Camera,
  Link,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Copy,
  SlidersHorizontal,
} from 'lucide-react';

interface MenuManagerProps {
  items: MenuItem[];
  onItemsUpdated: () => void;
}

const CATEGORIES: { id: MenuItem['category']; label: string }[] = [
  { id: 'empanadas', label: 'Empanadas' },
  { id: 'milanesas', label: 'Milanesas' },
  { id: 'hamburguesas', label: 'Hamburguesas Smash' },
  { id: 'pizzas', label: 'Pizzas al Molde' },
  { id: 'lomitos', label: 'Lomitos' },
  { id: 'minutas', label: 'Minutas & Papas' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'postres', label: 'Postres' },
];

// Presets de fotos caseras de alta calidad categorizadas
const FOOD_GALLERY_PRESETS: { category: string; title: string; url: string }[] = [
  // Empanadas
  {
    category: 'empanadas',
    title: 'Empanadas Tucumanas Doradas',
    url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'empanadas',
    title: 'Empanadas al Horno de Barro',
    url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'empanadas',
    title: 'Docena de Empanadas Variadas',
    url: 'https://images.unsplash.com/photo-1628840045864-b258529f7998?auto=format&fit=crop&w=800&q=80',
  },
  // Milanesas
  {
    category: 'milanesas',
    title: 'Sánguche de Milanesa Completo',
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'milanesas',
    title: 'Milanesa Napolitana para Compartir',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'milanesas',
    title: 'Milanesa a Caballo con Papas',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  // Hamburguesas
  {
    category: 'hamburguesas',
    title: 'Smash Doble Cheddar & Bacon',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'hamburguesas',
    title: 'Smash Burger Clásica Casera',
    url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'hamburguesas',
    title: 'Hamburguesa con Cebolla Caramelizada',
    url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
  },
  // Pizzas
  {
    category: 'pizzas',
    title: 'Pizza de Muzzarella al Molde',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'pizzas',
    title: 'Fugazzeta Rellena con Queso',
    url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'pizzas',
    title: 'Pizza Especial Jamón & Morrones',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
  },
  // Lomitos
  {
    category: 'lomitos',
    title: 'Lomito Cordobés Completo',
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'lomitos',
    title: 'Sándwich de Lomo Tostado',
    url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
  },
  // Minutas & Papas
  {
    category: 'minutas',
    title: 'Papas Rústicas Cheddar & Panceta',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'minutas',
    title: 'Papas Fritas Crujientes Bastón',
    url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'minutas',
    title: 'Tortilla de Papas Babe Rellena',
    url: 'https://images.unsplash.com/photo-1639024471287-032f66e344e2?auto=format&fit=crop&w=800&q=80',
  },
  // Bebidas
  {
    category: 'bebidas',
    title: 'Gaseosas & Línea Fría',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'bebidas',
    title: 'Cerveza Artesanal Tirada',
    url: 'https://images.unsplash.com/photo-1608270546103-9776d54d1933?auto=format&fit=crop&w=800&q=80',
  },
  // Postres
  {
    category: 'postres',
    title: 'Flan Casero Mixto',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  },
  {
    category: 'postres',
    title: 'Chocotorta Tradicional',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
];

export const MenuManager: React.FC<MenuManagerProps> = ({ items, onItemsUpdated }) => {
  // View mode: 'table' (rapid spreadsheet) or 'grid' (cards)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Quick Inline Price Editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Notification Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Dedicated Image Picker Modal
  const [imageModalDish, setImageModalDish] = useState<MenuItem | null>(null);
  const [imageTab, setImageTab] = useState<'gallery' | 'upload' | 'url'>('gallery');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Price Adjuster Modal
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | MenuItem['category']>('all');
  const [bulkType, setBulkType] = useState<'percent' | 'fixed'>('percent');
  const [bulkValue, setBulkValue] = useState<number>(10);
  const [bulkRound, setBulkRound] = useState<boolean>(true);

  // Paste Price List Modal
  const [isPasteListOpen, setIsPasteListOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pastePreview, setPastePreview] = useState<{ id: string; name: string; oldPrice: number; newPrice: number }[]>([]);

  // Modal for Adding / Full Editing Dish
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('8500');
  const [formCategory, setFormCategory] = useState<MenuItem['category']>('milanesas');
  const [formImage, setFormImage] = useState('');
  const [formPrepTime, setFormPrepTime] = useState('20');
  const [formIsHomemade, setFormIsHomemade] = useState(true);
  const [formIsPopular, setFormIsPopular] = useState(false);
  // Presentaciones de venta (unidad base + docena + media)
  const [formVendeDocena, setFormVendeDocena] = useState(false);
  const [formPrecioDocena, setFormPrecioDocena] = useState('');
  const [formVendeMedia, setFormVendeMedia] = useState(false);

  // Database Backup Modal
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // --- HANDLERS FOR FULL DISH EDIT/CREATE ---
  const handleOpenAddForm = () => {
    setEditingDishId(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('8500');
    setFormCategory('milanesas');
    setFormImage('https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80');
    setFormPrepTime('20');
    setFormIsHomemade(true);
    setFormIsPopular(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: MenuItem) => {
    setEditingDishId(item.id);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setFormImage(item.image);
    setFormPrepTime(item.preparationTimeMinutes.toString());
    setFormIsHomemade(Boolean(item.isHomemadeSpecial));
    setFormIsPopular(Boolean(item.isPopular));
    const pres = item.presentaciones || [];
    const doc = pres.find((p) => p.id === 'docena');
    setFormVendeDocena(Boolean(doc));
    setFormPrecioDocena(doc && doc.precioFijo ? doc.precioFijo.toString() : '');
    setFormVendeMedia(pres.some((p) => p.id === 'media'));
    setIsFormOpen(true);
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice.trim()) {
      alert('Completá al menos el nombre y el precio');
      return;
    }

    const priceNum = parseInt(formPrice, 10) || 5000;
    const prepNum = parseInt(formPrepTime, 10) || 20;

    // Presentaciones: unidad (base, siempre) + docena y/o media si se activan.
    // Precio docena: override manual o 12× base; media: 0.5× base. Todo automático.
    const presentaciones: Presentacion[] = [{ id: 'unidad', label: 'Unidad', factor: 1 }];
    if (formVendeDocena) {
      const pf = parseInt(formPrecioDocena, 10);
      presentaciones.push({
        id: 'docena', label: 'Docena (12 u.)', factor: 12,
        ...(Number.isFinite(pf) && pf > 0 ? { precioFijo: pf } : {}),
      });
    }
    if (formVendeMedia) {
      presentaciones.push({ id: 'media', label: 'Media porción', factor: 0.5 });
    }

    if (editingDishId) {
      storageService.updateMenuItem(editingDishId, {
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        image: formImage.trim() || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80',
        preparationTimeMinutes: prepNum,
        isHomemadeSpecial: formIsHomemade,
        isPopular: formIsPopular,
        presentaciones,
      });
      showToast(`✅ "${formName}" actualizado en la base de datos`);
    } else {
      storageService.addMenuItem({
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        image: formImage.trim() || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80',
        preparationTimeMinutes: prepNum,
        isHomemadeSpecial: formIsHomemade,
        isPopular: formIsPopular,
        presentaciones,
        isAvailable: true,
      });
      showToast(`🎉 Nuevo plato "${formName}" agregado al menú`);
    }

    setIsFormOpen(false);
    onItemsUpdated();
  };

  const handleDeleteDish = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el plato "${name}" del menú?`)) {
      storageService.deleteMenuItem(id);
      showToast(`🗑️ "${name}" eliminado de la base de datos`);
      onItemsUpdated();
    }
  };

  const handleToggleAvailable = (id: string, currentStatus: boolean, name: string) => {
    storageService.toggleItemAvailability(id);
    showToast(currentStatus ? `⏸️ "${name}" pausado (Agotado)` : `🟢 "${name}" disponible en venta`);
    onItemsUpdated();
  };

  // --- RAPID INLINE PRICE EDIT ---
  const handleStartEditPrice = (item: MenuItem) => {
    setEditingPriceId(item.id);
    setPriceInput(item.price.toString());
  };

  const handleSavePrice = (id: string, name: string) => {
    const parsed = parseInt(priceInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      storageService.updateItemPrice(id, parsed);
      showToast(`💰 Precio de "${name}" actualizado a $${parsed.toLocaleString('es-AR')}`);
      onItemsUpdated();
    }
    setEditingPriceId(null);
  };

  const handleQuickPriceStep = (item: MenuItem, delta: number) => {
    const newPrice = Math.max(100, item.price + delta);
    storageService.updateItemPrice(item.id, newPrice);
    showToast(`💰 "${item.name}": $${newPrice.toLocaleString('es-AR')}`);
    onItemsUpdated();
  };

  // --- IMAGE PICKER HANDLERS ---
  const handleOpenImagePicker = (item: MenuItem) => {
    setImageModalDish(item);
    setCustomImageUrl(item.image);
    setImageTab('gallery');
  };

  const handleSelectPresetImage = (url: string) => {
    if (!imageModalDish) return;
    storageService.updateMenuItem(imageModalDish.id, { image: url });
    showToast(`🖼️ Foto actualizada para "${imageModalDish.name}"`);
    setImageModalDish(null);
    onItemsUpdated();
  };

  const handleApplyCustomUrl = () => {
    if (!imageModalDish || !customImageUrl.trim()) return;
    storageService.updateMenuItem(imageModalDish.id, { image: customImageUrl.trim() });
    showToast(`🖼️ Foto actualizada para "${imageModalDish.name}"`);
    setImageModalDish(null);
    onItemsUpdated();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageModalDish) return;

    // Convert file to Base64 data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      storageService.updateMenuItem(imageModalDish.id, { image: base64String });
      showToast(`📸 Foto subida con éxito para "${imageModalDish.name}"`);
      setImageModalDish(null);
      onItemsUpdated();
    };
    reader.readAsDataURL(file);
  };

  // --- BULK PRICE ADJUSTMENT ---
  const calculateNewPrice = (currentPrice: number): number => {
    let result = currentPrice;
    if (bulkType === 'percent') {
      result = Math.round(currentPrice * (1 + bulkValue / 100));
    } else {
      result = currentPrice + bulkValue;
    }

    if (bulkRound) {
      // Round to nearest 100
      result = Math.round(result / 100) * 100;
    }

    return Math.max(100, result);
  };

  const handleApplyBulkPrices = () => {
    const targetItems = items.filter((it) => bulkScope === 'all' || it.category === bulkScope);
    if (targetItems.length === 0) return;

    const count = targetItems.length;
    targetItems.forEach((it) => {
      const newPrice = calculateNewPrice(it.price);
      storageService.updateItemPrice(it.id, newPrice);
    });

    showToast(`⚡ ¡Actualizados los precios de ${count} platos simultáneamente!`);
    setIsBulkPriceOpen(false);
    onItemsUpdated();
  };

  // --- PASTE PRICE LIST PARSER ---
  const handleParsePasteList = (text: string) => {
    setPasteText(text);
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const updates: { id: string; name: string; oldPrice: number; newPrice: number }[] = [];

    lines.forEach((line) => {
      // Match "Dish name: 8500" or "Dish name $8500" or "Dish name - 8500"
      const match = line.match(/(.*?)(?:[:=\-$]|\s{2,}|\t)\s*(\$?\s*[\d.]+)/);
      if (match) {
        const dishSearch = match[1].trim().toLowerCase();
        const priceStr = match[2].replace(/[$.\s]/g, '');
        const newPrice = parseInt(priceStr, 10);

        if (!isNaN(newPrice) && newPrice > 0) {
          // Find closest matching dish in menu
          const found = items.find(
            (it) =>
              it.name.toLowerCase().includes(dishSearch) ||
              dishSearch.includes(it.name.toLowerCase())
          );
          if (found && !updates.some((u) => u.id === found.id)) {
            updates.push({
              id: found.id,
              name: found.name,
              oldPrice: found.price,
              newPrice,
            });
          }
        }
      }
    });

    setPastePreview(updates);
  };

  const handleApplyPastedPrices = () => {
    pastePreview.forEach((u) => {
      storageService.updateItemPrice(u.id, u.newPrice);
    });
    showToast(`✅ ¡Se actualizaron ${pastePreview.length} platos desde la lista pegada!`);
    setIsPasteListOpen(false);
    setPasteText('');
    setPastePreview([]);
    onItemsUpdated();
  };

  // --- DATABASE BACKUP / RESTORE ---
  const handleExportDB = () => {
    const jsonStr = storageService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `punto_morfi_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDB = () => {
    if (!importJsonText.trim()) return;
    const ok = storageService.importDatabaseJSON(importJsonText.trim());
    if (ok) {
      setImportStatus('✅ Base de datos restaurada correctamente');
      showToast('✅ Base de datos cargada y sincronizada');
      onItemsUpdated();
      setTimeout(() => {
        setIsDbModalOpen(false);
        setImportStatus(null);
        setImportJsonText('');
      }, 1500);
    } else {
      setImportStatus('❌ Error: El formato JSON no es válido');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar el menú con los 14 platos caseros originales?')) {
      storageService.resetMenuToDefaults();
      showToast('🔄 Menú restaurado a los valores predeterminados');
      onItemsUpdated();
      setIsDbModalOpen(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#14201f] text-white border-2 border-[#e2e663] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#e2e663] shrink-0" />
          <span className="text-xs font-black font-['Fredoka']">{toastMessage}</span>
        </div>
      )}

      {/* Real-time Status Banner */}
      <div className="bg-[#192625] p-5 sm:p-6 rounded-3xl border border-[#2d4240] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-2 font-['Fredoka']">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Base de Datos Activa • Sincronización Simultánea en Vivo</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-['Fredoka']">
            Panel de Precios, Menú & Fotos
          </h3>
          <p className="text-xs text-[#8daaa8] mt-1 max-w-2xl">
            Modificá precios o cambiá imágenes desde esta interfaz visual. Los cambios se guardan al instante y se reflejan simultáneamente en la app de delivery, en la tablet de cocina y en el mostrador.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Price Adjustment Button */}
          <button
            onClick={() => setIsBulkPriceOpen(true)}
            className="bg-[#243635] hover:bg-[#2e4544] text-[#e2e663] border border-[#3b5553] text-xs font-black px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all font-['Fredoka']"
            title="Aumentar o ajustar precios en bloque por porcentaje o suma fija"
          >
            <Percent className="w-4 h-4 text-[#e2e663]" />
            <span>Aumento Masivo</span>
          </button>

          {/* Paste Price List Button */}
          <button
            onClick={() => setIsPasteListOpen(true)}
            className="bg-[#243635] hover:bg-[#2e4544] text-white border border-[#3b5553] text-xs font-black px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all font-['Fredoka']"
            title="Pegar nueva lista de precios en texto para actualizar rápido"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#f88d63]" />
            <span>Pegar Lista</span>
          </button>

          {/* Database Backup Button */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="bg-[#243635] hover:bg-[#2e4544] text-[#8daaa8] hover:text-white border border-[#3b5553] text-xs font-bold px-3 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all font-['Fredoka']"
            title="Ver, exportar o restaurar la Base de Datos JSON"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Base JSON</span>
          </button>

          {/* Add New Dish */}
          <button
            onClick={handleOpenAddForm}
            className="bg-gradient-to-r from-[#f88d63] to-[#fa9d79] hover:from-[#f77e50] hover:to-[#f88d63] text-[#1b2827] font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-[#f88d63]/25 flex items-center gap-2 transition-all font-['Fredoka'] tracking-wide"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#152221] p-3 rounded-2xl border border-[#2b3e3d]">
        <div className="flex items-center gap-2 flex-1">
          {/* View switcher: Table vs Grid */}
          <div className="bg-[#1e2d2c] p-1 rounded-xl border border-[#2d4240] flex items-center shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-[#f88d63] text-[#1b2827] shadow'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
              title="Vista Planilla / Tabla Rápida (para cambiar precios al vuelo)"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-['Fredoka']">Tabla Rápida</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#f88d63] text-[#1b2827] shadow'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
              title="Vista Catálogo / Tarjetas con fotos"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-['Fredoka']">Tarjetas</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#759694]" />
            <input
              type="text"
              placeholder="Buscar plato para editar precio o foto..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#1e2d2c] border border-[#2d4240] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#759694] outline-none focus:border-[#f88d63]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#f88d63] text-[#1b2827] font-black'
                : 'text-[#8daaa8] hover:text-white'
            }`}
          >
            Todos ({items.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#e2e663] text-[#1b2827] font-black'
                  : 'text-[#8daaa8] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          MODE 1: RAPID SPREADSHEET TABLE (Super Easy UI for Prices)
          ======================================================== */}
      {viewMode === 'table' && (
        <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#152221] border-b border-[#2d4240] text-[11px] uppercase font-bold text-[#8daaa8] tracking-wider">
                  <th className="py-3 px-4">Foto (Clic = Cambiar)</th>
                  <th className="py-3 px-4">Plato & Categoría</th>
                  <th className="py-3 px-4 text-center">Precio Actual ($ ARS)</th>
                  <th className="py-3 px-4 text-center">Ajuste Rápido</th>
                  <th className="py-3 px-4 text-center">Disponibilidad</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263736] text-xs">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#243534]/70 transition-colors ${
                      !item.isAvailable ? 'opacity-60 bg-[#162120]' : ''
                    }`}
                  >
                    {/* Photo with 1-click change */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => handleOpenImagePicker(item)}
                        className="group relative w-16 h-16 rounded-2xl overflow-hidden border border-[#2d4240] bg-[#14201f] cursor-pointer"
                        title="Hacé clic para cambiar la foto"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                          <Camera className="w-4 h-4 mb-0.5 text-[#e2e663]" />
                          <span>Cambiar</span>
                        </div>
                      </div>
                    </td>

                    {/* Name & Category */}
                    <td className="py-3 px-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-['Fredoka'] text-sm">
                          {item.name}
                        </span>
                        {item.isHomemadeSpecial && (
                          <span className="bg-[#f88d63]/20 text-[#f88d63] border border-[#f88d63]/30 text-[9px] font-black px-1.5 py-0.5 rounded">
                            Casero
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#e2e663] uppercase font-bold tracking-wider block mt-0.5">
                        {item.category}
                      </span>
                      <p className="text-[11px] text-[#8daaa8] line-clamp-1 mt-0.5 max-w-xs">
                        {item.description}
                      </p>
                    </td>

                    {/* Price with In-Place Editable input */}
                    <td className="py-3 px-4 text-center min-w-[170px]">
                      {editingPriceId === item.id ? (
                        <div className="inline-flex items-center gap-1 bg-[#14201f] p-1 rounded-xl border border-[#f88d63]">
                          <span className="text-[#e2e663] font-bold pl-1">$</span>
                          <input
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePrice(item.id, item.name);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            className="w-24 bg-transparent text-white font-black text-sm px-1 py-0.5 outline-none font-mono"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(item.id, item.name)}
                            className="bg-[#f88d63] hover:bg-[#fa9d79] text-[#1b2827] p-1 rounded-lg text-xs font-bold"
                            title="Confirmar precio"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="text-stone-400 hover:text-white p-1"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEditPrice(item)}
                          className="group inline-flex items-center gap-1.5 bg-[#14201f] hover:bg-[#1a2928] px-3 py-1.5 rounded-xl border border-[#2b3e3d] hover:border-[#f88d63] cursor-pointer transition-all"
                          title="Clic para editar precio"
                        >
                          <span className="text-base font-black text-[#e2e663] font-['Fredoka']">
                            ${item.price.toLocaleString('es-AR')}
                          </span>
                          <Edit2 className="w-3 h-3 text-[#759694] group-hover:text-[#f88d63] transition-colors" />
                        </div>
                      )}
                    </td>

                    {/* Quick Step Buttons (+$500 / -$500) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleQuickPriceStep(item, -500)}
                          className="bg-[#243635] hover:bg-[#2c4241] text-stone-300 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold border border-[#364e4c]"
                          title="Restar $500"
                        >
                          -$500
                        </button>
                        <button
                          onClick={() => handleQuickPriceStep(item, 500)}
                          className="bg-[#243635] hover:bg-[#2c4241] text-[#e2e663] px-2 py-1 rounded-lg text-[10px] font-bold border border-[#364e4c]"
                          title="Sumar $500"
                        >
                          +$500
                        </button>
                      </div>
                    </td>

                    {/* Available / Sold Out Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleAvailable(item.id, item.isAvailable, item.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          item.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                      >
                        {item.isAvailable ? '🟢 En Venta' : '🔴 Pausado'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenImagePicker(item)}
                          className="p-1.5 rounded-lg bg-[#243635] hover:bg-[#2c4241] text-[#e2e663] border border-[#364e4c]"
                          title="Cambiar foto de este plato"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          className="p-1.5 rounded-lg bg-[#243635] hover:bg-[#2c4241] text-[#f88d63] border border-[#364e4c]"
                          title="Editar detalles del plato"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(item.id, item.name)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Eliminar plato del menú"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODE 2: CARDS GRID (Visual Catalog)
          ======================================================== */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-3xl border flex flex-col justify-between transition-all ${
                item.isAvailable
                  ? 'bg-[#1e2d2c] border-[#2d4240]'
                  : 'bg-[#182524] border-[#253736] opacity-60'
              }`}
            >
              <div>
                <div className="flex gap-3">
                  {/* Photo with clickable camera overlay */}
                  <div
                    onClick={() => handleOpenImagePicker(item)}
                    className="group relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-[#2d4240] bg-[#14201f] cursor-pointer"
                    title="Clic para cambiar foto"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold">
                      <Camera className="w-4 h-4 mb-0.5 text-[#e2e663]" />
                      <span>Cambiar Foto</span>
                    </div>
                    {item.isHomemadeSpecial && (
                      <span className="absolute bottom-1 right-1 bg-[#f88d63] text-[#1b2827] text-[8px] font-black px-1.5 rounded">
                        Casero
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-white truncate font-['Fredoka']">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-[#e2e663] uppercase font-bold tracking-wider">
                      {item.category}
                    </span>
                    <p className="text-[11px] text-[#8daaa8] line-clamp-2 mt-0.5">
                      {item.description}
                    </p>

                    {/* Inline Price edit */}
                    <div className="mt-2 flex items-center gap-2">
                      {editingPriceId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePrice(item.id, item.name);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            className="w-24 bg-[#14201f] border border-[#f88d63] rounded-lg px-2 py-1 text-xs text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(item.id, item.name)}
                            className="bg-[#f88d63] text-[#1b2827] p-1 rounded-lg text-xs font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-[#e2e663] font-['Fredoka']">
                            ${item.price.toLocaleString('es-AR')}
                          </span>
                          <button
                            onClick={() => handleStartEditPrice(item)}
                            className="text-[#759694] hover:text-[#f88d63] p-0.5"
                            title="Modificar precio rápido"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-[#2d4240] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleAvailable(item.id, item.isAvailable, item.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    item.isAvailable
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {item.isAvailable ? '🟢 En Venta' : '🔴 Pausado'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenImagePicker(item)}
                    className="bg-[#243635] hover:bg-[#2c4241] text-[#e2e663] text-xs font-bold px-2.5 py-1.5 rounded-xl border border-[#364e4c] flex items-center gap-1"
                    title="Cambiar foto"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Foto</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditForm(item)}
                    className="bg-[#243635] hover:bg-[#2c4241] text-[#f88d63] text-xs font-bold px-2.5 py-1.5 rounded-xl border border-[#364e4c] flex items-center gap-1"
                    title="Editar plato"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteDish(item.id, item.name)}
                    className="text-stone-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                    title="Eliminar plato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          IMAGE SELECTOR & UPLOAD MODAL (Dedicated Photo Manager)
          ======================================================== */}
      {imageModalDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-[#2d4240] bg-[#152221] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white font-['Fredoka'] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#f88d63]" />
                  <span>Cambiar Foto: {imageModalDish.name}</span>
                </h3>
                <p className="text-xs text-[#8daaa8] mt-0.5">
                  Seleccioná de la galería casera, subí desde tu dispositivo o pegá un enlace web.
                </p>
              </div>
              <button
                onClick={() => setImageModalDish(null)}
                className="p-1 rounded-xl text-[#8daaa8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Photo preview bar */}
            <div className="bg-[#14201f] px-6 py-3 border-b border-[#2d4240] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={imageModalDish.image}
                  alt={imageModalDish.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#2d4240]"
                />
                <span className="text-xs text-[#8daaa8]">
                  Foto actual del plato en el menú
                </span>
              </div>

              {/* Tabs */}
              <div className="bg-[#1e2d2c] p-1 rounded-xl border border-[#2d4240] flex items-center">
                <button
                  onClick={() => setImageTab('gallery')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    imageTab === 'gallery'
                      ? 'bg-[#f88d63] text-[#1b2827]'
                      : 'text-[#8daaa8] hover:text-white'
                  }`}
                >
                  Galería Casera
                </button>
                <button
                  onClick={() => setImageTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    imageTab === 'upload'
                      ? 'bg-[#f88d63] text-[#1b2827]'
                      : 'text-[#8daaa8] hover:text-white'
                  }`}
                >
                  Subir Archivo
                </button>
                <button
                  onClick={() => setImageTab('url')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    imageTab === 'url'
                      ? 'bg-[#f88d63] text-[#1b2827]'
                      : 'text-[#8daaa8] hover:text-white'
                  }`}
                >
                  Pegar URL
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* TAB 1: Preset Gallery */}
              {imageTab === 'gallery' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#8daaa8]">
                    Hacé 1 clic sobre cualquier foto para asignarla directamente a este plato:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {FOOD_GALLERY_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectPresetImage(preset.url)}
                        className="group relative rounded-2xl overflow-hidden border border-[#2d4240] hover:border-[#f88d63] cursor-pointer bg-[#14201f] aspect-square transition-all"
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                          <span className="text-[10px] font-black text-white font-['Fredoka'] leading-tight">
                            {preset.title}
                          </span>
                          <span className="text-[9px] text-[#e2e663] uppercase">
                            {preset.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Upload File (Mobile Camera or PC) */}
              {imageTab === 'upload' && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-16 h-16 rounded-3xl bg-[#f88d63]/20 text-[#f88d63] flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-['Fredoka']">
                      Subí una foto desde tu Celular o Computadora
                    </h4>
                    <p className="text-xs text-[#8daaa8] mt-1 max-w-sm mx-auto">
                      Se guardará directamente en la base de datos local de Punto Morfi sin requerir servidor de fotos externo.
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#e2e663] hover:bg-[#edf169] text-[#1b2827] font-black px-6 py-3 rounded-2xl text-xs font-['Fredoka'] shadow-lg inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Elegir Foto o Tomar con Cámara</span>
                  </button>
                </div>
              )}

              {/* TAB 3: Paste Direct URL */}
              {imageTab === 'url' && (
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-xs font-bold text-[#e2e663] block mb-1">
                      Enlace directo a la imagen (URL pública):
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  {customImageUrl && (
                    <div className="bg-[#14201f] p-3 rounded-2xl border border-[#2b3e3d] flex items-center gap-4">
                      <img
                        src={customImageUrl}
                        alt="Previsualización"
                        className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#2d4240]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div className="text-xs text-[#8daaa8]">
                        <span className="text-white font-bold block">Vista previa exitosa</span>
                        <span>Esta imagen se mostrará en todos los catálogos</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleApplyCustomUrl}
                      disabled={!customImageUrl.trim()}
                      className="bg-[#f88d63] hover:bg-[#fa9d79] disabled:opacity-40 text-[#1b2827] font-black px-5 py-2.5 rounded-xl text-xs font-['Fredoka']"
                    >
                      Aplicar Esta Foto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BULK PRICE ADJUSTMENT MODAL (Percentages or Fixed Sum)
          ======================================================== */}
      {isBulkPriceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-[#2d4240] bg-[#152221] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#e2e663]" />
                <h3 className="text-lg font-black text-white font-['Fredoka']">
                  Aumento / Ajuste Masivo de Precios
                </h3>
              </div>
              <button
                onClick={() => setIsBulkPriceOpen(false)}
                className="p-1 rounded-xl text-[#8daaa8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Scope */}
              <div>
                <label className="font-bold text-[#e2e663] block mb-1 font-['Fredoka']">
                  ¿A qué platos aplicar el ajuste?
                </label>
                <select
                  value={bulkScope}
                  onChange={(e) => setBulkScope(e.target.value as 'all' | MenuItem['category'])}
                  className="w-full bg-[#152221] border border-[#2b3e3d] rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="all">Todo el Menú ({items.length} platos)</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      Solo {c.label} ({items.filter((i) => i.category === c.id).length} platos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Type: Percent or Fixed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#d3e2e0] block mb-1">Tipo de Ajuste</label>
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value as 'percent' | 'fixed')}
                    className="w-full bg-[#152221] border border-[#2b3e3d] rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($ ARS)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#d3e2e0] block mb-1">
                    Valor {bulkType === 'percent' ? '(Ej: 10 = +10%)' : '(Ej: 500 = +$500)'}
                  </label>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#152221] border border-[#2b3e3d] rounded-xl px-3 py-2 text-white font-bold outline-none"
                  />
                </div>
              </div>

              {/* Rounding Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-round"
                  checked={bulkRound}
                  onChange={(e) => setBulkRound(e.target.checked)}
                  className="accent-[#e2e663] w-4 h-4"
                />
                <label htmlFor="chk-round" className="text-white cursor-pointer">
                  Redondear al múltiplo de $100 más cercano (precios prolijos sin centavos)
                </label>
              </div>

              {/* Live Sample Preview */}
              <div className="bg-[#14201f] p-3 rounded-2xl border border-[#263736] space-y-1">
                <span className="text-[10px] text-[#8daaa8] uppercase font-bold tracking-wider">
                  Ejemplo de cálculo previo:
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300">Plato actual de $8.500:</span>
                  <span className="text-[#e2e663] font-bold font-['Fredoka'] text-sm">
                    Pasará a ${calculateNewPrice(8500).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-[#2d4240] flex justify-end gap-2">
                <button
                  onClick={() => setIsBulkPriceOpen(false)}
                  className="px-4 py-2 text-[#8daaa8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyBulkPrices}
                  className="bg-[#e2e663] hover:bg-[#edf169] text-[#1b2827] font-black px-5 py-2.5 rounded-xl text-xs font-['Fredoka'] shadow-lg"
                >
                  Aplicar Aumento a la Base de Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PASTE PRICE LIST MODAL (Rapid Text / Excel Import)
          ======================================================== */}
      {isPasteListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-[#2d4240] bg-[#152221] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#f88d63]" />
                <h3 className="text-lg font-black text-white font-['Fredoka']">
                  Pegar Nueva Lista de Precios
                </h3>
              </div>
              <button
                onClick={() => setIsPasteListOpen(false)}
                className="p-1 rounded-xl text-[#8daaa8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#8daaa8]">
                Pegá el listado copiado desde WhatsApp o Excel en formato <code className="bg-[#152221] text-[#e2e663] px-1 rounded">Nombre: Precio</code>:
              </p>

              <textarea
                placeholder={`Ejemplo:\nMilanesa Napolitana: 9500\nEmpanadas: 1800\nHamburguesa Smash: 8900`}
                value={pasteText}
                onChange={(e) => handleParsePasteList(e.target.value)}
                className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-2xl p-3.5 text-xs text-white font-mono h-32 outline-none"
              />

              {/* Match preview */}
              {pastePreview.length > 0 && (
                <div className="bg-[#14201f] p-3 rounded-2xl border border-[#263736] space-y-1.5 max-h-40 overflow-y-auto">
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    ✅ {pastePreview.length} platos reconocidos para actualizar:
                  </span>
                  {pastePreview.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-white truncate">{p.name}</span>
                      <span className="text-stone-400 font-mono">
                        ${p.oldPrice} ➔ <strong className="text-[#e2e663]">${p.newPrice}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 border-t border-[#2d4240] flex justify-end gap-2">
                <button
                  onClick={() => setIsPasteListOpen(false)}
                  className="px-4 py-2 text-[#8daaa8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyPastedPrices}
                  disabled={pastePreview.length === 0}
                  className="bg-[#f88d63] hover:bg-[#fa9d79] disabled:opacity-40 text-[#1b2827] font-black px-5 py-2.5 rounded-xl text-xs font-['Fredoka'] shadow-lg"
                >
                  Actualizar {pastePreview.length} Precios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FULL DISH CREATE / EDIT MODAL
          ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-[#2d4240] bg-[#152221] flex items-center justify-between">
              <h3 className="text-lg font-black text-white font-['Fredoka'] flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#f88d63]" />
                <span>{editingDishId ? 'Editar Plato & Foto' : 'Agregar Nuevo Plato al Menú'}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-xl text-[#8daaa8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDish} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-[#e2e663] block mb-1 font-['Fredoka']">
                  Nombre del Plato *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Milanesa a Caballo con Papas Rústicas"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-[#d3e2e0] block mb-1">
                  Descripción / Ingredientes
                </label>
                <textarea
                  placeholder="Detalle de la preparación casera..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl px-3.5 py-2 text-xs text-white outline-none h-20"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#e2e663] block mb-1 font-['Fredoka']">
                    Precio ($ ARS) *
                  </label>
                  <input
                    type="number"
                    placeholder="8500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#d3e2e0] block mb-1">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MenuItem['category'])}
                    className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image URL & Live Preview */}
              <div>
                <label className="text-xs font-bold text-[#f88d63] block mb-1 font-['Fredoka'] flex items-center justify-between">
                  <span>URL de la Imagen / Foto</span>
                  <span className="text-[10px] text-[#8daaa8] font-normal">Pegá enlace directo (jpg/png)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full bg-[#152221] border border-[#2b3e3d] focus:border-[#f88d63] rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono text-[11px]"
                />

                {/* Preview Box */}
                {formImage && (
                  <div className="mt-2 flex items-center gap-3 bg-[#152221] p-2.5 rounded-2xl border border-[#2b3e3d]">
                    <img
                      src={formImage}
                      alt="Vista previa"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#2d4240]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                    <div className="text-[11px] text-[#8daaa8]">
                      <span className="text-white font-bold block">Vista previa de imagen</span>
                      <span>Se mostrará en la tienda web, tótem y menú</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prep Time & Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-[#8daaa8] block mb-1">
                    Tiempo de Prep. (min)
                  </label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full bg-[#152221] border border-[#2b3e3d] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chk-homemade"
                    checked={formIsHomemade}
                    onChange={(e) => setFormIsHomemade(e.target.checked)}
                    className="accent-[#f88d63] w-4 h-4"
                  />
                  <label htmlFor="chk-homemade" className="text-xs font-bold text-white cursor-pointer">
                    Especial Casero
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chk-popular"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="accent-[#e2e663] w-4 h-4"
                  />
                  <label htmlFor="chk-popular" className="text-xs font-bold text-white cursor-pointer">
                    Destacado Popular
                  </label>
                </div>
              </div>

              {/* Presentaciones de venta (unidad / docena / media) */}
              <div className="bg-[#152221] border border-[#2b3e3d] rounded-2xl p-4 space-y-2.5">
                <label className="text-xs font-bold text-[#e2e663] block font-['Fredoka']">
                  Presentaciones de venta
                  <span className="text-[10px] text-[#8daaa8] font-normal ml-2">
                    el costo se calcula solo desde el precio base
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-docena"
                    checked={formVendeDocena}
                    onChange={(e) => setFormVendeDocena(e.target.checked)}
                    className="accent-[#f88d63] w-4 h-4"
                  />
                  <label htmlFor="chk-docena" className="text-xs font-bold text-white cursor-pointer">
                    Docena (12 u.)
                  </label>
                  {formVendeDocena && (
                    <input
                      type="number"
                      placeholder={formPrice ? `vacío = 12 × $${(12 * (parseInt(formPrice, 10) || 0)).toLocaleString('es-AR')}` : 'precio docena (opcional)'}
                      value={formPrecioDocena}
                      onChange={(e) => setFormPrecioDocena(e.target.value)}
                      className="w-48 bg-[#1b2827] border border-[#2b3e3d] focus:border-[#f88d63] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-media"
                    checked={formVendeMedia}
                    onChange={(e) => setFormVendeMedia(e.target.checked)}
                    className="accent-[#f88d63] w-4 h-4"
                  />
                  <label htmlFor="chk-media" className="text-xs font-bold text-white cursor-pointer">
                    Media porción (½ del precio base — pizza/tarta)
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-[#2d4240] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs text-[#8daaa8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#f88d63] to-[#fa9d79] text-[#1b2827] font-black px-5 py-2.5 rounded-xl text-xs shadow-lg font-['Fredoka']"
                >
                  Guardar Plato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DATABASE ACCESS & BACKUP MODAL
          ======================================================== */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e2d2c] border border-[#2d4240] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-[#2d4240] bg-[#152221] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#e2e663]" />
                <h3 className="text-lg font-black text-white font-['Fredoka']">
                  Base de Datos & Acceso Directo a Tablas
                </h3>
              </div>
              <button
                onClick={() => setIsDbModalOpen(false)}
                className="p-1 rounded-xl text-[#8daaa8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-[#d3e2e0]">
              <div className="bg-[#14201f] p-4 rounded-2xl border border-[#263736] space-y-2">
                <h4 className="font-bold text-white text-sm">¿Cómo funciona la Base de Datos?</h4>
                <p className="leading-relaxed">
                  Todos los platos, precios, imágenes, pedidos y alias de cobro se almacenan en la base de datos persistente del sistema, sincronizados simultáneamente en tiempo real. <strong>No requerís tocar una sola línea de código para actualizar menús o precios.</strong>
                </p>
                <p className="leading-relaxed">
                  Para que tengas <strong>control total</strong> de la información, podés <strong>descargar la base completa en formato JSON</strong> o restaurar un respaldo en cualquier momento con 1 clic.
                </p>
              </div>

              {/* Action buttons: Export / Import */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleExportDB}
                  className="bg-[#243635] hover:bg-[#2c4241] border border-[#364e4c] p-4 rounded-2xl flex items-center gap-3 text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#e2e663]/20 text-[#e2e663] flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-white block text-xs font-['Fredoka']">
                      Descargar Base de Datos (.json)
                    </span>
                    <span className="text-[11px] text-[#8daaa8]">
                      Copia completa de menús, fotos y alias
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleResetDefaults}
                  className="bg-[#243635] hover:bg-[#2c4241] border border-[#364e4c] p-4 rounded-2xl flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f88d63]/20 text-[#f88d63] flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-white block text-xs font-['Fredoka']">
                      Restaurar Menú Original
                    </span>
                    <span className="text-[11px] text-[#8daaa8]">
                      Regresa a los 14 platos iniciales
                    </span>
                  </div>
                </button>
              </div>

              {/* Import Area */}
              <div className="space-y-2 pt-2 border-t border-[#2d4240]">
                <label className="font-bold text-white block">
                  Restaurar o Importar JSON de Base de Datos:
                </label>
                <textarea
                  placeholder='Pegá aquí el contenido JSON para cargar platos o respaldos...'
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full bg-[#152221] border border-[#2b3e3d] rounded-2xl p-3 text-xs text-white font-mono h-28 outline-none"
                />
                {importStatus && (
                  <p className="font-bold text-xs">{importStatus}</p>
                )}
                <button
                  onClick={handleImportDB}
                  disabled={!importJsonText.trim()}
                  className="bg-[#e2e663] hover:bg-[#edf169] disabled:opacity-40 text-[#1b2827] font-black py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 font-['Fredoka']"
                >
                  <Upload className="w-4 h-4" />
                  <span>Cargar e Importar Base de Datos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
