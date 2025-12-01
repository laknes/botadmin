import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Sparkles, X, Send, List, UploadCloud, Loader2, Save } from 'lucide-react';
import { Product } from '../types';
import { generateProductDescription } from '../services/geminiService';
import { useFeedback } from '../components/Feedback';

const Products: React.FC = () => {
  const { showToast, confirm, setLoading: setGlobalLoading } = useFeedback();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Category Editing State
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Form State
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    code: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    imageUrl: ''
  });

  const fetchData = async () => {
      setLoading(true);
      try {
          // Fetch Products
          const prodRes = await fetch('/api/products');
          if (prodRes.ok) setProducts(await prodRes.json());
          
          // Fetch Categories
          const catRes = await fetch('/api/categories');
          if (catRes.ok) setCategories(await catRes.json());
          
      } catch (err) {
          console.error(err);
          showToast('خطا در دریافت اطلاعات', 'error');
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.channel_id) setChannelId(data.channel_id);
            }
        } catch (e) {}
    };
    fetchSettings();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
    } else {
      setCurrentProduct({ name: '', code: '', category: categories[0] || '', price: 0, stock: 0, description: '', imageUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleGenerateDescription = async () => {
    if (!currentProduct.name || !currentProduct.category) {
      showToast("لطفا نام و دسته‌بندی محصول را وارد کنید", 'warning');
      return;
    }
    setLoadingAI(true);
    const desc = await generateProductDescription(currentProduct.name, currentProduct.category);
    setCurrentProduct(prev => ({ ...prev, description: desc }));
    setLoadingAI(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setGlobalLoading(true);
    try {
        const payload = { 
            ...currentProduct, 
            imageUrl: currentProduct.imageUrl || 'https://picsum.photos/100/100'
        };

        let res;
        if (currentProduct.id) {
            // Edit
            res = await fetch(`/api/products/${currentProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Add
            payload.id = Date.now().toString(); // Simple ID generation
            res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            await fetchData();
            setIsModalOpen(false);
            showToast('محصول با موفقیت ذخیره شد', 'success');
        } else if (res.status === 409) {
            showToast('خطا: نام محصول یا کد محصول تکراری است.', 'error');
        } else {
            showToast('خطا در ذخیره محصول', 'error');
        }
    } catch (err) {
        showToast('خطا در ارتباط با سرور', 'error');
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
        title: 'حذف محصول',
        message: 'آیا از حذف این محصول اطمینان دارید؟ این عملیات غیرقابل بازگشت است.',
        confirmText: 'بله، حذف شود',
        isDestructive: true,
        onConfirm: async () => {
             setGlobalLoading(true);
             try {
                await fetch(`/api/products/${id}`, { method: 'DELETE' });
                await fetchData();
                showToast('محصول حذف شد', 'success');
             } catch (err) {
                showToast('خطا در حذف محصول', 'error');
             } finally {
                setGlobalLoading(false);
             }
        }
    });
  };

  const handleSendToChannel = (product: Product) => {
    if (!channelId) {
      showToast('لطفا ابتدا آیدی کانال را در بخش "طراحی ربات > تنظیمات" وارد کنید.', 'warning');
      return;
    }
    confirm({
        title: 'ارسال به کانال',
        message: `آیا مطمئن هستید که می‌خواهید محصول "${product.name}" را به کانال ${channelId} ارسال کنید؟`,
        confirmText: 'ارسال',
        onConfirm: () => {
             showToast(`محصول در صف ارسال به ${channelId} قرار گرفت.`, 'success');
        }
    });
  };

  const handleAddCategory = async () => {
    if (newCategoryName && !categories.includes(newCategoryName)) {
      setGlobalLoading(true);
      try {
          const res = await fetch('/api/categories', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ name: newCategoryName })
          });
          if (res.ok) {
              setCategories([...categories, newCategoryName]);
              setNewCategoryName('');
              showToast('دسته جدید افزوده شد', 'success');
          } else {
              showToast('خطا در افزودن دسته', 'error');
          }
      } catch (e) {
          showToast('خطا در ارتباط با سرور', 'error');
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  const handleDeleteCategory = (name: string) => {
      confirm({
          title: 'حذف دسته‌بندی',
          message: `آیا از حذف دسته "${name}" مطمئن هستید؟ محصولات این دسته "بدون دسته‌بندی" خواهند شد.`,
          isDestructive: true,
          onConfirm: async () => {
               setGlobalLoading(true);
               try {
                   await fetch(`/api/categories/${name}`, { method: 'DELETE' });
                   fetchData();
                   showToast('دسته‌بندی حذف شد', 'success');
               } catch (e) {
                   showToast('خطا در حذف دسته', 'error');
               } finally {
                   setGlobalLoading(false);
               }
          }
      });
  };

  const startEditCategory = (name: string) => {
      setEditingCategory(name);
      setEditCategoryName(name);
  };

  const handleUpdateCategory = async () => {
      if (editingCategory && editCategoryName && editCategoryName !== editingCategory) {
          setGlobalLoading(true);
          try {
             await fetch(`/api/categories/${editingCategory}`, {
                 method: 'PUT',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ name: editCategoryName })
             });
             fetchData();
             setEditingCategory(null);
             showToast('نام دسته ویرایش شد', 'success');
          } catch(e) {
             showToast('خطا در ویرایش دسته', 'error');
          } finally {
              setGlobalLoading(false);
          }
      } else {
          setEditingCategory(null);
      }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">مدیریت محصولات</h1>
          <p className="text-gray-500 mt-1">افزودن، ویرایش و مدیریت موجودی کالاها (دیتابیس)</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <List size={20} />
            مدیریت دسته‌ها
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            افزودن محصول جدید
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="جستجو نام، کد یا دسته..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
                هیچ محصولی یافت نشد.
            </div>
          ) : (
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">تصویر</th>
                <th className="px-6 py-4">کد</th>
                <th className="px-6 py-4">نام محصول</th>
                <th className="px-6 py-4">دسته‌بندی</th>
                <th className="px-6 py-4">قیمت (تومان)</th>
                <th className="px-6 py-4">موجودی</th>
                <th className="px-6 py-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-200 border border-gray-100" />
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-500 text-sm">{product.code || '---'}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{Number(product.price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock > 10 ? 'bg-green-100 text-green-700' : 
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.stock > 0 ? `${product.stock} عدد` : 'ناموجود'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleSendToChannel(product)}
                        title="ارسال به کانال تلگرام"
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Send size={18} className="rtl:rotate-180" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800">مدیریت دسته‌بندی‌ها</h3>
               <button onClick={() => setIsCategoryModalOpen(false)}><X size={20} className="text-gray-500" /></button>
             </div>
             <div className="p-4">
               <div className="flex gap-2 mb-4">
                 <input 
                   type="text" 
                   placeholder="نام دسته جدید..." 
                   className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                   value={newCategoryName}
                   onChange={e => setNewCategoryName(e.target.value)}
                 />
                 <button 
                   onClick={handleAddCategory}
                   className="bg-indigo-600 text-white px-4 rounded-lg text-sm hover:bg-indigo-700"
                 >
                   افزودن
                 </button>
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                 {categories.map(cat => (
                   <div key={cat} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 group">
                     {editingCategory === cat ? (
                         <div className="flex items-center gap-2 w-full">
                             <input 
                                type="text" 
                                value={editCategoryName} 
                                onChange={e => setEditCategoryName(e.target.value)}
                                className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm outline-none"
                             />
                             <button onClick={handleUpdateCategory} className="text-green-600"><Save size={16} /></button>
                             <button onClick={() => setEditingCategory(null)} className="text-red-500"><X size={16} /></button>
                         </div>
                     ) : (
                         <>
                            <span className="text-sm text-gray-700">{cat}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditCategory(cat)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                            </div>
                         </>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {currentProduct.id ? 'ویرایش محصول' : 'افزودن محصول جدید'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام محصول <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={currentProduct.name} 
                    onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="مثال: هدفون بی سیم"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کد محصول (یکتا) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={currentProduct.code || ''} 
                    onChange={e => setCurrentProduct({...currentProduct, code: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                    placeholder="مثال: PROD-100"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
                  <select
                    value={currentProduct.category} 
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="" disabled>انتخاب کنید...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
                  <input 
                    type="number" 
                    value={currentProduct.price} 
                    onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">موجودی</label>
                  <input 
                    type="number" 
                    value={currentProduct.stock} 
                    onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تصویر محصول</label>
                <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer relative overflow-hidden ${currentProduct.imageUrl ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  
                  {currentProduct.imageUrl ? (
                    <div className="relative w-full h-48 flex items-center justify-center">
                        <img src={currentProduct.imageUrl} alt="Preview" className="h-full object-contain rounded-md" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white font-medium flex items-center gap-2">
                                <UploadCloud size={20} />
                                تغییر تصویر
                            </span>
                        </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={32} className="mb-2 text-gray-400" />
                      <span className="text-sm text-gray-500">برای آپلود کلیک کنید یا فایل را بکشید</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">توضیحات</label>
                  <button 
                    onClick={handleGenerateDescription}
                    disabled={loadingAI}
                    className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded-md transition-colors"
                  >
                    <Sparkles size={12} />
                    {loadingAI ? 'در حال نوشتن...' : 'تولید با هوش مصنوعی'}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  value={currentProduct.description}
                  onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                انصراف
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-500/20 transition-colors"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;