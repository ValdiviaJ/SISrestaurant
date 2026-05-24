import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Utensils, Edit, Trash2, X, Loader2, Upload, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import { Dish, Category } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export const DishList: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currency_symbol || 'S/';

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dish Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [savingDish, setSavingDish] = useState(false);
  const [dishForm, setDishForm] = useState({
    name: '',
    price: '',
    category_id: '',
    description: '',
    image_url: '',
    is_available: true
  });
  const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url');
  const [dishImageFile, setDishImageFile] = useState<File | null>(null);
  const [dishImagePreview, setDishImagePreview] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, dishesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/dishes')
      ]);
      setCategories(categoriesRes.data);
      setDishes(dishesRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Error al conectar con el servidor. No se pudo cargar el menú.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Handling
  const handleOpenCategoryEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || ''
    });
  };

  const handleCancelCategoryEdit = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setSavingCategory(true);
    try {
      if (selectedCategory) {
        const res = await api.put(`/categories/${selectedCategory.id}`, categoryForm);
        setCategories(categories.map(c => c.id === selectedCategory.id ? res.data : c));
        // Update category name in dishes local state too
        setDishes(dishes.map(d => d.category_id === selectedCategory.id ? { ...d, category: res.data } : d));
      } else {
        const res = await api.post('/categories', categoryForm);
        setCategories([...categories, res.data]);
      }
      handleCancelCategoryEdit();
    } catch (err) {
      console.error(err);
      alert('Error al guardar la categoría. Intente nuevamente.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Todos los platos asociados serán eliminados automáticamente.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      setDishes(dishes.filter(d => d.category_id !== id));
      if (activeCategory === categories.find(c => c.id === id)?.slug) {
        setActiveCategory('all');
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la categoría.');
    }
  };

  // Dish Handling
  const handleOpenDishCreate = () => {
    setSelectedDish(null);
    setDishForm({
      name: '',
      price: '',
      category_id: categories[0]?.id.toString() || '',
      description: '',
      image_url: '',
      is_available: true
    });
    setImageInputMode('url');
    setDishImageFile(null);
    setDishImagePreview(null);
    setIsDishModalOpen(true);
  };

  const handleOpenDishEdit = (dish: Dish) => {
    setSelectedDish(dish);
    setDishForm({
      name: dish.name,
      price: dish.price.toString(),
      category_id: dish.category_id.toString(),
      description: dish.description || '',
      image_url: dish.image_url || '',
      is_available: dish.is_available
    });
    setImageInputMode(dish.image_url && !dish.image_url.includes('/storage/dishes/') ? 'url' : 'file');
    setDishImageFile(null);
    setDishImagePreview(dish.image_url || null);
    setIsDishModalOpen(true);
  };

  const handleDishFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDishImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDishImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name.trim() || !dishForm.price || !dishForm.category_id) return;
    setSavingDish(true);

    const formData = new FormData();
    formData.append('name', dishForm.name);
    formData.append('price', dishForm.price);
    formData.append('category_id', dishForm.category_id);
    formData.append('description', dishForm.description);
    formData.append('is_available', dishForm.is_available ? '1' : '0');

    if (imageInputMode === 'file') {
      if (dishImageFile) {
        formData.append('image', dishImageFile);
      }
    } else if (dishForm.image_url) {
      formData.append('image_url', dishForm.image_url);
    }

    try {
      if (selectedDish) {
        // Workaround for PHP PUT requests with multipart files
        formData.append('_method', 'PUT');
        const res = await api.post(`/dishes/${selectedDish.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDishes(dishes.map(d => d.id === selectedDish.id ? res.data : d));
      } else {
        const res = await api.post('/dishes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setDishes([...dishes, res.data]);
      }
      setIsDishModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el plato. Verifique que los campos sean válidos.');
    } finally {
      setSavingDish(false);
    }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este plato?')) return;
    try {
      await api.delete(`/dishes/${id}`);
      setDishes(dishes.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el plato.');
    }
  };

  const handleToggleAvailability = async (dish: Dish) => {
    // Optimistic local state update
    setDishes(dishes.map(d => d.id === dish.id ? { ...d, is_available: !d.is_available } : d));
    
    try {
      const res = await api.patch(`/dishes/${dish.id}/toggle-availability`);
      setDishes(dishes.map(d => d.id === dish.id ? res.data.dish : d));
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setDishes(dishes.map(d => d.id === dish.id ? dish : d));
      alert('No se pudo actualizar la disponibilidad.');
    }
  };

  // Filter & Search Logic
  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = activeCategory === 'all' || 
      (dish.category?.slug === activeCategory);
    
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesCategory && matchesSearch;
  });

  // Render Skeletons for Loading State
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
          </div>
          <div className="h-12 w-36 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="flex gap-2 pb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl h-80 p-4 space-y-4">
              <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-900 rounded-md"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Gestión de Platos & Menú
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Administra los platos, bebidas, categorías y disponibilidad del menú.
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={handleOpenDishCreate}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold shadow-lg shadow-emerald-500/20 text-sm transition-all self-start sm:self-auto"
          >
            <Plus size={18} />
            Nuevo Plato
          </button>
        )}
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-thin">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300
              ${activeCategory === 'all' 
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }
            `}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300
                ${activeCategory === cat.slug 
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }
              `}
            >
              {cat.name}
            </button>
          ))}
          {isAdmin && (
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors" 
              title="Gestionar Categorías"
            >
              <Tag size={16} />
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar plato o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs text-slate-700 dark:text-slate-300 shadow-sm"
          />
        </div>

      </div>

      {/* error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Grid List Dishes */}
      {filteredDishes.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
          <Utensils size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Menú vacío
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 px-4">
            No hay platos cargados que coincidan con la selección.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDishes.map((dish) => (
            <div 
              key={dish.id} 
              className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col h-full
                ${!dish.is_available ? 'opacity-75' : ''}
              `}
            >
              {/* Dish Image */}
              <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center shrink-0">
                {dish.image_url ? (
                  <img 
                    src={dish.image_url} 
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-img');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                {/* Fallback visual illustration */}
                <div className={`fallback-img absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 gap-2
                  ${dish.image_url ? 'hidden' : ''}
                `}>
                  <Utensils size={36} className="opacity-70 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Delicia RestoSuite</span>
                </div>

                {/* Category Badge */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                  {dish.category?.name || 'Menú'}
                </span>

                {/* Availability Overlay */}
                {!dish.is_available && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                      Agotado
                    </span>
                  </div>
                )}
              </div>

              {/* Dish Details */}
              <div className="p-5 flex flex-col justify-between flex-grow">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm group-hover:text-emerald-500 transition-colors line-clamp-1">
                      {dish.name}
                    </h3>
                    <span className="font-black text-slate-950 dark:text-white text-sm shrink-0">
                      {currencySymbol} {Number(dish.price).toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {dish.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                {/* Card Actions (Only for Admin) */}
                {isAdmin && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    {/* Toggle availability */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAvailability(dish)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none
                          ${dish.is_available ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}
                        `}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${dish.is_available ? 'translate-x-4' : 'translate-x-0'}
                          `}
                        />
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {dish.is_available ? 'Disponible' : 'Agotado'}
                      </span>
                    </div>

                    {/* Edit/Delete buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDishEdit(dish)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                        title="Editar Plato"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteDish(dish.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 transition-colors"
                        title="Eliminar Plato"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DISH CREATE / EDIT MODAL */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                {selectedDish ? 'Editar Plato del Menú' : 'Agregar Nuevo Plato'}
              </h2>
              <button 
                onClick={() => setIsDishModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveDish} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={dishForm.name}
                    onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl focus:border-emerald-500 outline-none text-xs"
                    placeholder="Ej. Ceviche Mixto"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl focus:border-emerald-500 outline-none text-xs font-semibold"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría *</label>
                  <select
                    value={dishForm.category_id}
                    required
                    onChange={(e) => setDishForm({ ...dishForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl focus:border-emerald-500 outline-none text-xs"
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={dishForm.description}
                    onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl focus:border-emerald-500 outline-none text-xs"
                    placeholder="Ingresa los ingredientes o detalles del plato..."
                  />
                </div>

                {/* Image upload selection */}
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Imagen del Plato</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all
                          ${imageInputMode === 'url' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-400 hover:text-slate-600'}
                        `}
                      >
                        Enlace (URL)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('file')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all
                          ${imageInputMode === 'file' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-400 hover:text-slate-600'}
                        `}
                      >
                        Subir Archivo
                      </button>
                    </div>
                  </div>

                  {imageInputMode === 'url' ? (
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <LinkIcon size={14} />
                      </span>
                      <input
                        type="text"
                        value={dishForm.image_url}
                        onChange={(e) => {
                          setDishForm({ ...dishForm, image_url: e.target.value });
                          setDishImagePreview(e.target.value);
                        }}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl focus:border-emerald-500 outline-none text-xs"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl cursor-pointer text-slate-500 hover:text-emerald-500 text-xs font-semibold transition-colors">
                        <Upload size={14} />
                        Seleccionar imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDishFileChange}
                        />
                      </label>
                      {dishImageFile && (
                        <span className="text-[10px] text-slate-400 truncate max-w-xs">{dishImageFile.name}</span>
                      )}
                    </div>
                  )}

                  {/* Image Preview */}
                  {dishImagePreview && (
                    <div className="relative w-full h-24 mt-2 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                      <img 
                        src={dishImagePreview} 
                        alt="Previsualización" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDishImagePreview(null);
                          setDishImageFile(null);
                          setDishForm({ ...dishForm, image_url: '' });
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-slate-900/70 text-white hover:bg-slate-900 rounded-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDishForm({ ...dishForm, is_available: !dishForm.is_available })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                      ${dishForm.is_available ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}
                    `}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${dishForm.is_available ? 'translate-x-4' : 'translate-x-0'}
                      `}
                    />
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Plato disponible en carta inmediatamente
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDish}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingDish && <Loader2 size={12} className="animate-spin" />}
                  {selectedDish ? 'Actualizar Plato' : 'Guardar Plato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up flex flex-col h-[550px]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                Gestionar Categorías del Menú
              </h2>
              <button 
                onClick={() => {
                  handleCancelCategoryEdit();
                  setIsCategoryModalOpen(false);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Form to Create/Edit */}
              <form onSubmit={handleSaveCategory} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:border-emerald-500 outline-none text-xs"
                      placeholder="Ej. Pizzas, Sopas..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descripción</label>
                    <input
                      type="text"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:border-emerald-500 outline-none text-xs"
                      placeholder="Breve descripción de la categoría"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white text-slate-500"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1"
                  >
                    {savingCategory && <Loader2 size={10} className="animate-spin" />}
                    {selectedCategory ? 'Guardar Cambios' : 'Añadir Categoría'}
                  </button>
                </div>
              </form>

              {/* Categories list */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categorías Registradas</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {cat.description || 'Sin descripción'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenCategoryEdit(cat)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                          title="Editar"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No hay categorías creadas.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleCancelCategoryEdit();
                  setIsCategoryModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-50 text-white dark:text-slate-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
