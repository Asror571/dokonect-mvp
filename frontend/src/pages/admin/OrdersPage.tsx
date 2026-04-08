import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../services/api';
import { format } from 'date-fns';

export const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/admin/orders${params}`);
      return response.data;
    },
  });

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      render: (order: any) => (
        <span className="font-mono text-sm">{order.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (order: any) => order.client?.user?.name || 'N/A',
    },
    {
      key: 'distributor',
      label: 'Distributor',
      render: (order: any) => order.distributor?.warehouseName || 'N/A',
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (order: any) => order.driver?.user?.name || 'Not assigned',
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (order: any) => `${order.totalAmount.toLocaleString()} UZS`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (order: any) => <StatusBadge status={order.status} size="sm" />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (order: any) => format(new Date(order.createdAt), 'MMM dd, HH:mm'),
    },
  ];

  const filteredOrders = orders?.filter((order: any) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.client?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600 mt-1">View and manage all orders</p>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order ID or client name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            <p className="text-gray-600 mt-2">Loading orders...</p>
          </div>
        ) : (
          <DataTable
            data={filteredOrders || []}
            columns={columns}
            searchable={false}
            onRowClick={(order) => console.log('Order clicked:', order)}
          />
        )}
      </div>
    </div>
  );
};
