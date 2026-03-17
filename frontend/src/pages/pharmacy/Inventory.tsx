import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  TrendingDown,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { pharmacyAPI } from '../../lib/api';

interface Medicine {
  id: string;
  name: string;
  genericName: string | null;
  category: string;
  brand: string | null;
  unit: string;
  price: number;
}

interface InventoryItem {
  id: string;
  medicineId: string;
  medicine: Medicine;
  batchNumber: string;
  quantity: number;
  reorderLevel: number;
  expiryDate: string;
  purchasePrice: number;
  mrp: number;
  supplier: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InventoryItemWithAlert extends InventoryItem {
  alertType?: string;
  daysUntilExpiry?: number;
}

interface AlertData {
  lowStock: InventoryItemWithAlert[];
  expiringSoon: InventoryItemWithAlert[];
  outOfStock: InventoryItemWithAlert[];
}

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'expiring'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'alerts'>('inventory');

  // Form state for adding inventory
  const [formData, setFormData] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: '',
    expiryDate: '',
    purchasePrice: '',
    mrp: '',
    supplier: '',
    location: '',
    reorderLevel: '10',
  });

  const [restockQuantity, setRestockQuantity] = useState('');

  useEffect(() => {
    // Check URL params for filters
    const filter = searchParams.get('filter');
    if (filter === 'lowStock') {
      setStockFilter('low');
      setActiveTab('alerts');
    } else if (filter === 'expiring') {
      setStockFilter('expiring');
      setActiveTab('alerts');
    } else if (filter === 'alerts') {
      setActiveTab('alerts');
    }
    
    // Check for action
    const action = searchParams.get('action');
    if (action === 'add') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [stockFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (stockFilter === 'low') {
        params.lowStock = 'true';
      } else if (stockFilter === 'out') {
        params.outOfStock = 'true';
      } else if (stockFilter === 'expiring') {
        params.expiring = 'true';
      }

      const [inventoryRes, medicinesRes, alertsRes] = await Promise.all([
        pharmacyAPI.getInventory(Object.keys(params).length > 0 ? params : undefined),
        pharmacyAPI.getMedicines({ limit: 100 }),
        pharmacyAPI.getInventoryAlerts(),
      ]);

      setInventory(inventoryRes.data || []);
      setMedicines(medicinesRes.data || []);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate numeric inputs before parsing
    const quantity = parseInt(formData.quantity, 10);
    const purchasePrice = parseFloat(formData.purchasePrice);
    const mrp = parseFloat(formData.mrp);
    const reorderLevel = parseInt(formData.reorderLevel, 10);
    
    if (!formData.medicineId || !formData.batchNumber || !formData.expiryDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    if (isNaN(purchasePrice) || purchasePrice < 0) {
      alert('Please enter a valid purchase price');
      return;
    }
    
    if (isNaN(mrp) || mrp <= 0) {
      alert('Please enter a valid MRP');
      return;
    }
    
    setSubmitting(true);
    try {
      await pharmacyAPI.addInventory({
        medicineId: formData.medicineId,
        batchNumber: formData.batchNumber,
        quantity,
        expiryDate: formData.expiryDate,
        purchasePrice,
        mrp,
        supplier: formData.supplier || undefined,
        location: formData.location || undefined,
        reorderLevel: isNaN(reorderLevel) ? 10 : reorderLevel,
      });
      
      setShowAddModal(false);
      setFormData({
        medicineId: '',
        batchNumber: '',
        quantity: '',
        expiryDate: '',
        purchasePrice: '',
        mrp: '',
        supplier: '',
        location: '',
        reorderLevel: '10',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      alert(error.response?.data?.message || 'Failed to add inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedItem || !restockQuantity) return;
    
    const quantity = parseInt(restockQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    setSubmitting(true);
    try {
      await pharmacyAPI.restockInventory(selectedItem.id, quantity);
      setShowRestockModal(false);
      setSelectedItem(null);
      setRestockQuantity('');
      fetchData();
    } catch (error: any) {
      console.error('Error restocking:', error);
      alert(error.response?.data?.message || 'Failed to restock');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: TrendingDown };
    }
    if (item.quantity <= item.reorderLevel) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: Package };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'Expired', color: 'text-red-600' };
    }
    if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry}d`, color: 'text-red-600' };
    }
    if (daysUntilExpiry <= 60) {
      return { label: `${daysUntilExpiry}d`, color: 'text-orange-600' };
    }
    return { label: `${daysUntilExpiry}d`, color: 'text-secondary-600' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate stats
  const totalItems = inventory.length;
  const lowStockCount = alerts?.lowStock?.length || 0;
  const outOfStockCount = alerts?.outOfStock?.length || 0;
  const expiringCount = alerts?.expiringSoon?.length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Inventory Management</h1>
          <p className="text-secondary-600">Manage medicine stock and batches</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Total Items</p>
              <p className="text-xl font-bold text-secondary-900">{totalItems}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setStockFilter('low'); setActiveTab('alerts'); }}
          className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:border-yellow-300 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Low Stock</p>
              <p className="text-xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => { setStockFilter('out'); setActiveTab('alerts'); }}
          className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:border-red-300 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => { setStockFilter('expiring'); setActiveTab('alerts'); }}
          className="bg-white rounded-xl border border-secondary-200 shadow-card p-4 hover:border-orange-300 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Expiring Soon</p>
              <p className="text-xl font-bold text-orange-600">{expiringCount}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'alerts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Alerts {(lowStockCount + outOfStockCount + expiringCount) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-600">
                {lowStockCount + outOfStockCount + expiringCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'inventory' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search medicines, batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Medicine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-secondary-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No inventory items found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const status = getStockStatus(item);
                      const expiry = getExpiryStatus(item.expiryDate);
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr key={item.id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-secondary-900">{item.medicine.name}</p>
                              <p className="text-sm text-secondary-500">{item.medicine.genericName || item.medicine.category}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-secondary-900">{item.batchNumber}</p>
                            {item.supplier && (
                              <p className="text-xs text-secondary-500">{item.supplier}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-secondary-900">{item.quantity}</p>
                            <p className="text-xs text-secondary-500">Min: {item.reorderLevel}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-secondary-900">{formatCurrency(item.mrp)}</p>
                            <p className="text-xs text-secondary-500">Cost: {formatCurrency(item.purchasePrice)}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-secondary-900">
                              {new Date(item.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </p>
                            <p className={`text-xs ${expiry.color}`}>{expiry.label}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setShowRestockModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'alerts' && alerts && (
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          {alerts.lowStock.length > 0 && (
            <div className="bg-white rounded-xl border border-yellow-200 shadow-card overflow-hidden">
              <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock ({alerts.lowStock.length})
                </h3>
              </div>
              <div className="divide-y divide-secondary-100">
                {alerts.lowStock.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-secondary-50">
                    <div>
                      <p className="font-medium text-secondary-900">{item.medicine.name}</p>
                      <p className="text-sm text-secondary-500">Batch: {item.batchNumber} • {item.quantity} units remaining</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowRestockModal(true);
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon Alerts */}
          {alerts.expiringSoon.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 shadow-card overflow-hidden">
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Expiring Soon ({alerts.expiringSoon.length})
                </h3>
              </div>
              <div className="divide-y divide-secondary-100">
                {alerts.expiringSoon.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-secondary-50">
                    <div>
                      <p className="font-medium text-secondary-900">{item.medicine.name}</p>
                      <p className="text-sm text-secondary-500">
                        Batch: {item.batchNumber} • Expires: {new Date(item.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-orange-600">
                      {item.daysUntilExpiry} days
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Out of Stock Alerts */}
          {alerts.outOfStock.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-card overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Out of Stock ({alerts.outOfStock.length})
                </h3>
              </div>
              <div className="divide-y divide-secondary-100">
                {alerts.outOfStock.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-secondary-50">
                    <div>
                      <p className="font-medium text-secondary-900">{item.medicine.name}</p>
                      <p className="text-sm text-secondary-500">Batch: {item.batchNumber}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowRestockModal(true);
                      }}
                      className="btn-primary btn-sm"
                    >
                      Restock Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.lowStock.length === 0 && alerts.expiringSoon.length === 0 && alerts.outOfStock.length === 0 && (
            <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
              <h3 className="text-lg font-semibold text-secondary-900">All Good!</h3>
              <p className="text-secondary-500 mt-1">No inventory alerts at this time</p>
            </div>
          )}
        </div>
      )}

      {/* Add Inventory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Add Stock</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-secondary-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddInventory} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Medicine *</label>
                <select
                  value={formData.medicineId}
                  onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select Medicine</option>
                  {medicines.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name} ({med.genericName || med.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Purchase Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">MRP *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Shelf/Bin location"
                  className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-secondary-200 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Restock Medicine</h2>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setSelectedItem(null);
                  setRestockQuantity('');
                }}
                className="p-1 hover:bg-secondary-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="font-medium text-secondary-900">{selectedItem.medicine.name}</p>
                <p className="text-sm text-secondary-500">Batch: {selectedItem.batchNumber}</p>
                <p className="text-sm text-secondary-500">Current stock: {selectedItem.quantity} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRestockModal(false);
                    setSelectedItem(null);
                    setRestockQuantity('');
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestock}
                  disabled={submitting || !restockQuantity}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Confirm Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
