import React, { useState, useEffect } from 'react';
import { List, Plus, Edit2, Trash2, Search, Filter, Stethoscope, Tag as TagIcon, Building, Loader2 } from 'lucide-react';
import { adminSystemListsAPI } from '@/services/api';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Treatment {
  id: string;
  name: string;
  description: string;
  categoryRef: Category;
  categoryId: string;
}

export const SystemLists: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'treatments'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'categories') {
        const res = await adminSystemListsAPI.getCategories();
        setCategories(res.data);
      } else {
        const res = await adminSystemListsAPI.getTreatments();
        setTreatments(res.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      if (activeTab === 'categories') {
        if (editingItem) {
          await adminSystemListsAPI.updateCategory(editingItem.id, data);
          toast.success('Category updated');
        } else {
          await adminSystemListsAPI.createCategory(data);
          toast.success('Category created');
        }
      } else {
        if (editingItem) {
          await adminSystemListsAPI.updateTreatment(editingItem.id, data);
          toast.success('Treatment updated');
        } else {
          await adminSystemListsAPI.createTreatment(data);
          toast.success('Treatment created');
        }
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      if (activeTab === 'categories') {
        await adminSystemListsAPI.deleteCategory(id);
      }
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete. It might be in use.');
    }
  };

  const filteredData = activeTab === 'categories' 
    ? categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : treatments.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             System-wide Lists
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage global dropdowns, therapy catalogs, and treatment categories</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-[#CBFF38] text-gray-900 font-bold rounded-2xl shadow-lg shadow-[#CBFF38]/20 hover:scale-[1.02] transition-transform"
        >
          <Plus size={20} /> Add New {activeTab === 'categories' ? 'Category' : 'Therapy'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm self-start p-1.5 rounded-2xl border border-gray-100 mb-8 w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-[#0B1120] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
        >
          <TagIcon size={18} /> Categories
        </button>
        <button
          onClick={() => setActiveTab('treatments')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'treatments' ? 'bg-[#0B1120] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
        >
          <Stethoscope size={18} /> Therapy Catalog
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search list..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38] transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl border border-gray-100">
          <Filter size={18} /> Advanced Filter
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
            <Loader2 className="animate-spin text-[#CBFF38]" size={40} />
            <p className="font-medium">Loading system records...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-24 text-center">
             <List className="w-16 h-16 text-gray-100 mx-auto mb-4" />
             <p className="text-gray-400 font-medium">No results found in {activeTab}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Record Name</th>
                  <th className="px-8 py-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Description / Info</th>
                  {activeTab === 'treatments' && <th className="px-8 py-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Category</th>}
                  <th className="px-8 py-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900 group-hover:text-black transition-colors">{item.name}</div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tighter">ID: {item.id.split('-')[0]}</div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-gray-500 max-w-md line-clamp-2 leading-relaxed">
                        {item.description || 'No description provided for this global record.'}
                      </p>
                    </td>
                    {activeTab === 'treatments' && (
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-lg border border-blue-100">
                          {((item as Treatment).categoryRef?.name) || 'Uncategorized'}
                        </span>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 bg-[#0B1120] text-white">
              <h2 className="text-2xl font-bold">{editingItem ? 'Edit Existing' : 'Add New'} {activeTab === 'categories' ? 'Category' : 'Therapy'}</h2>
              <p className="text-sm text-gray-400 mt-1">Updates will propagate across all clinics instantly</p>
            </div>

            <form onSubmit={handleCreateOrUpdate}>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Name</label>
                  <input 
                    name="name"
                    required
                    defaultValue={editingItem?.name}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#CBFF38] focus:bg-white rounded-2xl transition-all outline-none font-bold"
                    placeholder="Enter name..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Description</label>
                  <textarea 
                    name="description"
                    defaultValue={editingItem?.description}
                    rows={4}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#CBFF38] focus:bg-white rounded-2xl transition-all outline-none text-sm leading-relaxed"
                    placeholder="Provide details for this list item..."
                  />
                </div>

                {activeTab === 'treatments' && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-1">Category</label>
                    <select 
                      name="categoryId"
                      required
                      defaultValue={editingItem?.categoryId}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#CBFF38] focus:bg-white rounded-2xl transition-all outline-none font-bold"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-8 pt-4 bg-gray-50 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-white border-2 border-gray-200 text-gray-600 font-extrabold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-[#CBFF38] text-gray-900 font-extrabold rounded-2xl shadow-xl shadow-[#CBFF38]/30 hover:shadow-[#CBFF38]/50 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  Save Global Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
