import {
  Trash2,
  Plus,
  Hash,
  Filter,
  Users,
  CheckCircle,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ExternalLink,
  Search,
  Mail,
  Phone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { addCustomerTag, removeCustomerTag, fetchCustomersByTag } from "@/store/slices/crmSlice";
import { adminAPI, userAPI } from "@/services/api";
import type { RootState, AppDispatch } from "@/store";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export const Tags: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);

  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [customersByTag, setCustomersByTag] = useState<any[]>([]);
  const [selectedTagHeader, setSelectedTagHeader] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [tagData, setTagData] = useState({
    customerId: "",
    tagId: "",
    notes: ""
  });

  const [newTag, setNewTag] = useState({
    name: "",
    color: "#3b82f6",
    description: ""
  });

  const [isSearching, setIsSearching] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [resultsSearch, setResultsSearch] = useState("");

  const searchCustomers = async () => {
    if (!customerSearch.trim() || customerSearch.length < 2) return;
    setIsSearching(true);
    try {
      const res = await userAPI.getAllUsers({ search: customerSearch, limit: 10 });
      const users = Array.isArray(res.data) ? res.data : res.data.users || [];
      setSearchResults(users.map((u: any) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.email})`
      })));
    } catch (err) {
      console.error("Profile search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      // Only search if we haven't already selected a customer (indicated by label match)
      const isAlreadySelected = customers.some(c => c.label === customerSearch && c.value === tagData.customerId);
      if (customerSearch.length >= 2 && !isAlreadySelected) {
        searchCustomers();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [customerSearch, tagData.customerId, customers]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsRes, usersRes] = await Promise.all([
          adminAPI.getTags(),
          userAPI.getAllUsers({ limit: 50 })
        ]);
        setAvailableTags(tagsRes.data);
        const initialUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
        setCustomers(initialUsers.map((u: any) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName} (${u.email})`
        })));
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  const handleAddTag = async () => {
    if (!tagData.customerId || !tagData.tagId) {
      alert("Please select a customer and a tag");
      return;
    }

    try {
      await dispatch(addCustomerTag({
        ...tagData
      })).unwrap();
      setTagData({ customerId: "", tagId: "", notes: "" });
      setCustomerSearch("");
      
      // Auto-refresh the list if a tag is selected
      if (selectedTagHeader) {
        handleFetchCustomersByTag(selectedTagHeader);
      }
      
      alert("Tag assigned successfully!");
    } catch (error) {
      alert("Failed to assign tag");
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name) return;
    try {
      const res = await adminAPI.createTag(newTag);
      setAvailableTags(prev => [...prev, res.data]);
      setNewTag({ name: "", color: "#3b82f6", description: "" });
      alert("New tag definition created!");
    } catch (err) {
      alert("Failed to create tag definition");
    }
  };

  const handleFetchCustomersByTag = async (tag: any) => {
    try {
      const result = await dispatch(fetchCustomersByTag({ tagId: tag.id })).unwrap();
      setCustomersByTag(result);
      setSelectedTagHeader(tag);
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      alert("Failed to fetch customers");
    }
  };

  const handleCustomerSearch = (query: string) => {
    setCustomerSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
    }
  };

  const selectCustomer = (customer: any) => {
    setTagData(prev => ({ ...prev, customerId: customer.value }));
    setCustomerSearch(customer.label);
    setSearchResults([]);
  };

  const handleRefresh = async () => {
    try {
      const tagsRes = await adminAPI.getTags();
      setAvailableTags(tagsRes.data);
      if (selectedTagHeader) {
        handleFetchCustomersByTag(selectedTagHeader);
      }
    } catch (err) {
      console.error("Refresh failed", err);
    }
  };

  return (
    <div className='p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-top-4 duration-700'>
      {/* 1. Sleek Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-black text-slate-900 tracking-tight'>Tag Studio</h1>
          <p className='text-slate-500 font-medium text-xs'>Segment your database with precision tags and custom attributes.</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            className='h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all'
          >
            <Activity className='w-3.5 h-3.5 mr-2' /> Refresh Data
          </Button>
        </div>
      </div>

      {/* 2. KPI Section */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {[
          { label: 'Tag Definitions', value: availableTags.length, icon: Hash, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Segments', value: availableTags.filter(t => t.usageCount > 0).length || 0, icon: Layers, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Direct Assignments', value: 'Live', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Sync Status', value: '99.2%', icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <Card
            key={i}
            className='border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200 group hover:shadow-md transition-all'
          >
            <CardContent className='p-4 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className='w-5 h-5' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>{kpi.label}</span>
                  <span className='text-sm font-black text-slate-900 mt-0.5'>{kpi.value}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* ---------- LEFT COLUMN: ASSIGNMENT & CREATION (8 COLS) ---------- */}
        <div className='lg:col-span-8 space-y-6'>
          {/* A. Tag Assignment Card */}
          <Card className='border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-100'>
            <CardHeader className='bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between'>
              <CardTitle className='text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2'>
                <Plus className='w-4 h-4 text-[#CBFF38]' /> Assign Tag to Customer
              </CardTitle>
              <div className='px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold border border-blue-100 uppercase tracking-widest'>Required</div>
            </CardHeader>
            <CardContent className='p-6 space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest px-1'>Find Customer</label>
                  <div className='relative'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
                      <Input
                        placeholder='Search name or email...'
                        value={customerSearch}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        className='h-11 pl-10 border-slate-100 bg-slate-50/50 focus:bg-white rounded-xl text-sm font-bold transition-all'
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className='absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden p-1.5 animate-in fade-in slide-in-from-top-2'>
                        {searchResults.map((res) => (
                          <div
                            key={res.value}
                            onClick={() => selectCustomer(res)}
                            className='p-3 hover:bg-[#CBFF38]/10 cursor-pointer flex items-center justify-between rounded-lg transition-all group'
                          >
                            <div className='flex items-center gap-3'>
                              <div className='w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-white group-hover:text-black transition-colors'>
                                {res.label[0]}
                              </div>
                              <div className='flex flex-col'>
                                <span className='font-bold text-slate-800 text-xs leading-tight'>{res.label}</span>
                                <span className='text-[10px] text-slate-400 font-medium'>Database Match</span>
                              </div>
                            </div>
                            <ArrowRight className='w-3.5 h-3.5 text-slate-200 group-hover:text-black transition-all' />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest px-1'>Select Label</label>
                  <Select
                    value={tagData.tagId}
                    onChange={(val) => setTagData(prev => ({ ...prev, tagId: val }))}
                    options={availableTags.map(t => ({ value: t.id, label: t.name }))}
                    placeholder='Select a definition...'
                    className='h-11 border-slate-100 bg-slate-50/50 rounded-xl font-bold shadow-none'
                  />
                </div>
              </div>

              <div className='space-y-1.5'>
                <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest px-1'>Assignment Notes</label>
                <textarea
                  placeholder='Why are you applying this tag? (Optional)'
                  value={tagData.notes}
                  onChange={(e) => setTagData(prev => ({ ...prev, notes: e.target.value }))}
                  className='w-full min-h-[100px] p-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#CBFF38] outline-none transition-all text-sm font-medium leading-relaxed resize-none'
                />
              </div>

              <div className='flex justify-end pt-2'>
                <Button
                  onClick={handleAddTag}
                  disabled={isLoading || !tagData.customerId || !tagData.tagId}
                  className='h-11 px-8 bg-black text-[#CBFF38] border-none hover:bg-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10 transition-all active:scale-[0.98]'
                >
                  {isLoading ? 'Processing...' : 'Assign Tag'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* B. Results Grid (Dynamic) */}
          {customersByTag.length > 0 && (
            <div id='results-section' className='space-y-6 animate-in slide-in-from-bottom-8 duration-700'>
              <div className='flex items-center justify-between px-2 pt-4 border-t border-slate-100'>
                <div className='flex items-center gap-3'>
                  <div className='w-2 h-2 rounded-full bg-[#CBFF38] animate-pulse' />
                  <h2 className='text-sm font-black text-slate-900 uppercase tracking-widest'>
                    Found {customersByTag.length} Customers with "{selectedTagHeader?.name}"
                  </h2>
                </div>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400' />
                  <Input
                    placeholder='Filter results...'
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    className='h-8 w-48 pl-9 bg-slate-50 border-none rounded-lg text-xs font-bold'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {customersByTag.filter(customer =>
                  customer.customer?.firstName?.toLowerCase().includes(resultsSearch.toLowerCase()) ||
                  customer.customer?.lastName?.toLowerCase().includes(resultsSearch.toLowerCase()) ||
                  customer.customer?.email?.toLowerCase().includes(resultsSearch.toLowerCase())
                ).map((customer: any) => (
                  <Card
                    key={customer.id}
                    className='border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200 group hover:shadow-md transition-all'
                  >
                    <CardContent className='p-5 space-y-4'>
                      <div className='flex justify-between items-start'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-xl bg-slate-900 text-[#CBFF38] flex items-center justify-center font-bold text-sm'>
                            {customer.customer?.firstName?.[0]}{customer.customer?.lastName?.[0]}
                          </div>
                          <div>
                            <h3 className='font-black text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors'>
                              {customer.customer?.firstName} {customer.customer?.lastName}
                            </h3>
                            <p className='text-[10px] font-bold text-slate-400 mt-0.5'>{customer.customer?.email}</p>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-slate-300 hover:text-red-500 transition-colors'
                          onClick={() => {
                            if (confirm("Remove tag?")) {
                              dispatch(removeCustomerTag(customer.id)).then(() => {
                                setCustomersByTag(prev => prev.filter(c => c.id !== customer.id));
                              });
                            }
                          }}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>

                      {customer.notes && (
                        <div className='p-3 bg-slate-50 rounded-xl border border-slate-100'>
                          <p className='text-[10px] text-slate-500 font-medium italic leading-relaxed'>
                            "{customer.notes}"
                          </p>
                        </div>
                      )}

                      <div className='flex items-center gap-2 pt-1'>
                        <Button
                          variant='outline'
                          className='flex-1 h-8 rounded-lg border-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-50'
                          onClick={() => navigate(`/crm/customer/${customer.customer?.id}`)}
                        >
                          <ExternalLink className='w-3 h-3 mr-1.5' /> Profile
                        </Button>
                        <Button
                          variant='outline'
                          className='flex-1 h-8 rounded-lg border-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-50'
                        >
                          <Mail className='w-3 h-3 mr-1.5' /> Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---------- RIGHT COLUMN: DEFINITION LIBRARY (4 COLS) ---------- */}
        <div className='lg:col-span-4 space-y-6'>
          {/* C. Library List */}
          <Card className='border-none shadow-sm bg-white rounded-2xl overflow-hidden border border-slate-200'>
            <CardHeader className='bg-slate-50 border-b border-slate-100 py-4 px-6'>
              <CardTitle className='text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2'>
                <Filter className='w-4 h-4 text-blue-500' /> Definition Library
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4 space-y-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400' />
                <Input
                  placeholder='Find definition...'
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className='h-9 text-xs pl-9 border-none bg-slate-50 rounded-xl font-bold'
                />
              </div>

              <div className='space-y-1 max-h-[400px] overflow-y-auto pr-1 no-scrollbar'>
                {availableTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleFetchCustomersByTag(tag)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group overflow-hidden relative ${selectedTagHeader?.id === tag.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-white border border-transparent hover:bg-slate-50 hover:border-slate-100'
                      }`}
                  >
                    {selectedTagHeader?.id === tag.id && (
                      <div className='absolute left-0 top-0 bottom-0 w-1 bg-[#CBFF38]' />
                    )}
                    <div className='flex items-center gap-3 relative z-10'>
                      <div className='w-2 h-2 rounded-full' style={{ backgroundColor: tag.color || '#3b82f6' }} />
                      <span className={`text-xs font-black tracking-tight ${selectedTagHeader?.id === tag.id ? 'text-white' : 'text-slate-700'}`}>
                        {tag.name}
                      </span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-all ${selectedTagHeader?.id === tag.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>

              {/* D. Create New Definition */}
              <div className='pt-6 border-t border-slate-100 space-y-4'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>New Definition</h4>
                  <Layers className='w-3.5 h-3.5 text-slate-300' />
                </div>
                <div className='space-y-3'>
                  <Input
                    placeholder='Internal Label Name...'
                    value={newTag.name}
                    onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                    className='h-10 border-slate-100 bg-slate-50 focus:bg-white rounded-xl text-xs font-bold'
                  />
                  <div className='flex items-center gap-2'>
                    <div className='relative w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden p-0.5 flex-shrink-0'>
                      <input
                        type='color'
                        value={newTag.color}
                        onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                        className='absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer scale-125'
                      />
                    </div>
                    <Button
                      onClick={handleCreateTag}
                      disabled={!newTag.name}
                      className='flex-1 h-10 bg-black text-white hover:bg-slate-900 border-none rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-95'
                    >
                      Store Label
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
