import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Sparkles, X, Send, List } from 'lucide-react';
import { Product } from '../types';
import { generateProductDescription } from '../services/geminiService';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'هدفون بی‌سیم مدل X2',
    category: 'الکترونیک',
    price: 1200000,
    stock: 15,
    description: 'هدفون با کیفیت صدای عالی و باتری قوی...',
    imageUrl: 'https://picsum.photos/100/100?random=1'
  },
  {
    id: '2',
    name: 'ساعت هوشمند سری ۵',
    category: 'گجت',
    price: 3500000,
    stock: 4,
    description: 'ساعت هوشمند ضد آب با قابلیت مکالمه...',
    imageUrl: 'https://picsum.photos/100/100?random=2'
  },
];

const INITIAL_CATEGORIES = ['الکترونیک', 'گجت', 'پوشاک', 'خانه و آشپزخانه'];

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [channelId, setChannelId] = useState('');

  // Category Management State
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    // Load from Local Storage
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(MOCK_PRODUCTS);
    }

    const savedChannel = localStorage.getItem('channel_id');
    if (savedChannel) setChannelId(savedChannel);
    
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) setCategories(JSON.parse(savedCategories));
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
  };

  const saveCategories = (newCategories: string[]) => {
    setCategories(newCategories);
    localStorage.setItem('categories', JSON.stringify(newCategories));
  };

  // Form State
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    imageUrl: ''
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
    } else {
      setCurrentProduct({ name: '', category: categories[0] || '', price: 0, stock: 0, description: '', imageUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleGenerateDescription = async () => {
    if (!currentProduct.name || !currentProduct.category) {
      alert("لطفا نام و دسته‌بندی محصول را وارد کنید");
      return;
    }
    setLoadingAI(true);
    const desc = await generateProductDescription(currentProduct.name, currentProduct.category);
    setCurrentProduct(prev => ({ ...prev, description: desc }));
    setLoadingAI(false);
  };

  const handleSave = () => {
    let updatedProducts;
    if (currentProduct.id) {
      // Edit
      updatedProducts = products.map(p => p.id === currentProduct.id ? currentProduct as Product : p);
    } else {
      // Add
      updatedProducts = [...products, { ...currentProduct, id: Date.now().toString(), imageUrl: 'https://picsum.photos/100/100' } as Product];
    }
    saveProducts(updatedProducts);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      const updatedProducts = products.filter(p => p.id !== id);
      saveProducts(updatedProducts);
    }
  };

  const handleSendToChannel = (product: Product) => {
    if (!channelId) {
      alert('لطفا ابتدا آیدی کانال را در بخش "طراحی ربات > تنظیمات" وارد کنید.');
      return;
    }
    
    // Simulate API Call
    const confirmSend = confirm(`آیا مطمئن هستید که می‌خواهید محصول "${product.name}" را به کانال ${channelId} ارسال کنید؟`);
    if (confirmSend) {
      alert(`✅ محصول با موفقیت به کانال ${channelId} ارسال شد.\n\n(این یک شبیه‌سازی است)`);
    }
  };

  // Category Management Functions
  const handleAddCategory = () => {
    if (newCategoryName && !categories.includes(newCategoryName)) {
      saveCategories([...categories, newCategoryName]);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`آیا از حذف دسته "${cat}" مطمئن هستید؟`)) {
      saveCategories(categories.filter(c => c !== cat));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || p.category.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">مدیریت محصولات</h1>
          <p className="text-gray-500 mt-1">افزودن، ویرایش و مدیریت موجودی کالاها</p>
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
              placeholder="جستجو در محصولات..."
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
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-200" />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.price.toLocaleString()}</td>
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
                   <div key={cat} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                     <span className="text-sm text-gray-700">{cat}</span>
                     <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700">
                       <Trash2 size={16} />
                     </button>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام محصول</label>
                  <input 
                    type="text" 
                    value={currentProduct.name} 
                    onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-sm">برای آپلود کلیک کنید یا فایل را بکشید</span>
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