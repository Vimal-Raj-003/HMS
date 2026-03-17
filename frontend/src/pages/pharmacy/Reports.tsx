import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  FileText,
  Pill
} from 'lucide-react';
import { pharmacyAPI } from '../../lib/api';

interface SalesSummary {
  totalBills: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  averageBillValue: number;
}

interface TopMedicine {
  medicineId: string;
  medicineName: string;
  totalQuantity: number;
  totalRevenue: number;
  billCount: number;
}

interface SalesData {
  sales: any[];
  summary: SalesSummary;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [topMedicines, setTopMedicines] = useState<TopMedicine[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      
      const [salesRes, topMedicinesRes] = await Promise.all([
        pharmacyAPI.getSalesReport({ period }),
        pharmacyAPI.getTopMedicinesReport({ period }),
      ]);

      const salesResponse = salesRes as any;
      const topMedicinesResponse = topMedicinesRes as any;
      
      setSalesData(salesResponse);
      setTopMedicines(topMedicinesResponse || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const summary = salesData?.summary || {
    totalBills: 0,
    totalRevenue: 0,
    totalTax: 0,
    totalDiscount: 0,
    averageBillValue: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Sales Reports</h1>
          <p className="text-secondary-600">Track and analyze pharmacy sales</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-4 py-2 rounded-lg border border-secondary-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          <option value="daily">Today</option>
          <option value="weekly">Last 7 Days</option>
          <option value="monthly">Last 30 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Total Revenue</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Total Bills</p>
              <p className="text-2xl font-bold text-secondary-900">
                {summary.totalBills}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Avg. Bill Value</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(summary.averageBillValue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-100">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Total Tax</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(summary.totalTax)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Medicines */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-secondary-200">
          <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary-600" />
            Top Selling Medicines
          </h3>
          <p className="text-sm text-secondary-500">
            {period === 'daily' ? 'Today' : period === 'weekly' ? 'Last 7 days' : 'Last 30 days'} performance
          </p>
        </div>
        
        {topMedicines.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-secondary-300" />
            <p className="text-secondary-500">No sales data available</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {topMedicines.map((med, index) => (
              <div key={med.medicineId} className="p-4 flex items-center justify-between hover:bg-secondary-50">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-secondary-900">{med.medicineName}</p>
                    <p className="text-sm text-secondary-500">
                      {med.totalQuantity} units sold • {med.billCount} bills
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(med.totalRevenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales Summary */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-card p-4">
        <h3 className="font-semibold text-secondary-900 mb-4">Sales Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600">Gross Sales</p>
            <p className="text-xl font-bold text-secondary-900">
              {formatCurrency(summary.totalRevenue + summary.totalDiscount)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-secondary-600">Discounts Given</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(summary.totalDiscount)}
            </p>
          </div>
          <div className="p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-secondary-600">Net Revenue</p>
            <p className="text-xl font-bold text-primary-600">
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
