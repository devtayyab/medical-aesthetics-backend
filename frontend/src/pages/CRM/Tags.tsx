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
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { addCustomerTag, removeCustomerTag, fetchCustomersByTag } from "@/store/slices/crmSlice";
import { adminAPI, userAPI } from "@/services/api";
import type { RootState, AppDispatch } from "@/store";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export const Tags: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsRes, usersRes] = await Promise.all([
          adminAPI.getTags(),
          userAPI.getAllUsers({ limit: 100 })
        ]);
        setAvailableTags(tagsRes.data);
        setCustomers(usersRes.data.map((u: any) => ({
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
    if (query.trim().length > 1) {
      const filtered = (customers || []).filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const selectCustomer = (customer: any) => {
    setTagData(prev => ({ ...prev, customerId: customer.value }));
    setCustomerSearch(customer.label);
    setSearchResults([]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-100 pb-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
            <Layers className="w-3 h-3" /> Customer Segmentation
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Customer Tags
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-2xl">
            Manage and assign tags to segment your customers.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active User</span>
            <span className="font-bold text-slate-900 text-sm">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {user?.firstName?.[0]}
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Tags', value: availableTags.length, icon: Hash, color: 'blue', subtext: 'Definitions' },
          { label: 'Recent Tags', value: '...', icon: TrendingUp, color: 'emerald', subtext: 'Interaction count' },
          { label: 'Sync Status', value: '99.9%', icon: Activity, color: 'indigo', subtext: 'Connected' },
        ].map((kpi, i) => (
          <Card key={i} className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{kpi.subtext}</span>
                </div>
              </div>
              <div className={`p-4 rounded-lg bg-slate-50 text-slate-400 border border-slate-100`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Assignment Card */}
        <Card className="xl:col-span-3 border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
            <CardTitle className="text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3 font-bold">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Assign Tag</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Categorize customer records
                  </p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Find Customer
                    </label>
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Required</span>
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Search by name or email..."
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      className="h-11 border-slate-200 bg-white rounded-lg text-sm font-medium px-4 shadow-sm"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-[calc(100%+16px)] left-0 right-0 bg-white/98 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-gray-100/50 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-500 p-3 ring-1 ring-black/5">
                        {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 z-[100] overflow-hidden p-2">
                            {searchResults.map((res) => (
                              <div
                                key={res.value}
                                onClick={() => selectCustomer(res)}
                                className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between rounded-md transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs text-uppercase">
                                    {res.label[0]}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 text-sm leading-tight">{res.label}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Customer Profile</span>
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {tagData.customerId && !searchResults.length && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-emerald-100 shadow-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Matched</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Tag
                  </label>
                  <Select
                    value={tagData.tagId}
                    onChange={(val) => setTagData(prev => ({ ...prev, tagId: val }))}
                    options={availableTags.map(t => ({ value: t.id, label: t.name }))}
                    placeholder="Choose tag definition..."
                    className="h-11 rounded-lg border-slate-200 bg-white focus:ring-blue-500/5 transition-all text-sm font-medium px-4 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Internal Notes
                  </label>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">Optional</span>
                </div>
                <div className="relative h-full">
                  <textarea
                    placeholder="Add specific context or rationale for this tag..."
                    value={tagData.notes}
                    onChange={(e) => setTagData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full h-full min-h-[140px] p-4 bg-white border border-slate-200 rounded-lg focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-medium leading-relaxed resize-none shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleAddTag}
                disabled={isLoading || !tagData.customerId || !tagData.tagId}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 text-sm shadow-sm"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Tag Assignment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tag Navigator */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="p-5 pb-3 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-slate-900 text-sm flex items-center gap-2 font-bold uppercase tracking-tight">
                <Filter className="w-4 h-4 text-blue-500" />
                Tag List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-6">
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {availableTags.map(tag => (
                  <div
                    key={tag.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer border ${selectedTagHeader?.id === tag.id
                      ? 'bg-blue-600 border-blue-500 shadow-sm text-white'
                      : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    onClick={() => handleFetchCustomersByTag(tag)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color || '#3b82f6' }} />
                      <span className="text-sm font-bold tracking-tight">
                        {tag.name}
                      </span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-all ${selectedTagHeader?.id === tag.id ? 'text-white' : 'text-slate-300'}`} />
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create New Tag</h4>
                  <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold border border-blue-100 uppercase tracking-widest">Master List</div>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Enter tag name..."
                    value={newTag.name}
                    onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white border-slate-200 text-slate-900 h-10 rounded-lg pl-3 font-bold text-sm shadow-sm"
                  />
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg bg-white p-0.5 border border-slate-200 shadow-sm">
                      <input
                        type="color"
                        value={newTag.color}
                        onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-full rounded bg-transparent cursor-pointer overflow-hidden border-none p-0"
                      />
                    </div>
                    <Button
                      onClick={handleCreateTag}
                      className="flex-1 h-10 bg-slate-900 hover:bg-black text-white font-bold rounded-lg transition-all text-xs"
                    >
                      Create definition
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      {customersByTag.length > 0 && (
        <div id="results-section" className="space-y-10 pt-16 pb-32 scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600 rounded-xl shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Customers with <span className="text-blue-600">"{selectedTagHeader?.name}"</span> tag
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedTagHeader?.color }} />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{customersByTag.length} customers found</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              Filtered List View
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-12 duration-1000">
            {customersByTag.map((customer: any, idx) => (
              <Card
                key={customer.id}
                className="group border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white"
              >
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg border border-slate-200">
                      {customer.customer?.firstName?.[0]}{customer.customer?.lastName?.[0]}
                    </div>
                    <div className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                      ID {idx + 1}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Customer Details</span>
                    <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                      {customer.customer?.firstName} {customer.customer?.lastName}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium">
                      {customer.customer?.email}
                    </div>
                  </div>

                  {customer.notes && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                        "{customer.notes}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition-all text-xs"
                      onClick={() => window.location.href = `/crm/customers/${customer.customer?.id}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-2" />
                      View Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 p-0 transition-all border border-transparent hover:border-red-100"
                      onClick={() => {
                        if (confirm("Remove this tag from customer?")) {
                          dispatch(removeCustomerTag(customer.id)).then(() => {
                            setCustomersByTag(prev => prev.filter(c => c.id !== customer.id));
                          });
                        }
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
