import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, CheckCircle, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const roleLabels: Record<string, string> = {
  STORE_OWNER: 'Do\'kon egasi',
  DISTRIBUTOR: 'Distribyutor',
  ADMIN: 'Admin',
};

const AdminUsers = () => {
  const [role, setRole]     = useState('');
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', role, page],
    queryFn: async () => {
      const res = await api.get(`/admin/users?role=${role}&page=${page}`);
      return res.data.data;
    },
  });

  const { mutate: blockUser }   = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/block`),
    onSuccess: () => { toast.success('Bloklandi'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });
  const { mutate: unblockUser } = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/unblock`),
    onSuccess: () => { toast.success('Blok olib tashlandi'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });
  const { mutate: verifyDist }  = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/distributors/${id}/verify`),
    onSuccess: () => { toast.success('Tasdiqlandi'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const users = data?.users || [];
  const total = data?.total || 0;

  const filtered = users.filter((u: any) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.storeOwner?.storeName || u.distributor?.companyName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Foydalanuvchilar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} ta foydalanuvchi</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full pl-9 pr-3 h-9 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="h-9 bg-white border border-slate-200 rounded-xl px-3 text-sm focus:outline-none"
        >
          <option value="">Barcha rollar</option>
          <option value="STORE_OWNER">Do'kon egasi</option>
          <option value="DISTRIBUTOR">Distribyutor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-violet-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Foydalanuvchi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Holat</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user: any) => {
                const name = user.storeOwner?.storeName || user.distributor?.companyName || 'Admin';
                const distId = user.distributor?.id;
                const isVerified = user.distributor?.isVerified;

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'primary' : 'secondary'}>
                        {roleLabels[user.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <Badge variant="danger">Bloklangan</Badge>
                      ) : (
                        <Badge variant="success">Faol</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'DISTRIBUTOR' && !isVerified && distId && (
                          <Button size="sm" variant="outline" onClick={() => verifyDist(distId)}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Tasdiqlash
                          </Button>
                        )}
                        {user.isBlocked ? (
                          <Button size="sm" variant="outline" onClick={() => unblockUser(user.id)}>
                            <ShieldOff className="w-3.5 h-3.5 mr-1" />
                            Blokdan chiqar
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => blockUser(user.id)}>
                            <Shield className="w-3.5 h-3.5 mr-1" />
                            Bloklash
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">Foydalanuvchilar topilmadi</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
