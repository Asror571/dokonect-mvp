import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, Truck, Phone, MapPin, Loader2, Edit3, Power, X, Check } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

interface DriverFormData {
  name: string;
  phone: string;
  vehicleType: string;
  plateNumber: string;
  password: string;
}

const emptyForm: DriverFormData = { name: '', phone: '', vehicleType: 'Sedan', password: '' , plateNumber: '' };

const DriversPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [form, setForm] = useState<DriverFormData>(emptyForm);

  const { data: resp, isLoading } = useQuery({
    queryKey: ['distributor-drivers'],
    queryFn: async () => {
      const res = await api.get('/distributor/drivers');
      return res.data;
    },
  });

  const { mutate: saveDriver, isPending: saving } = useMutation({
    mutationFn: async (data: DriverFormData) => {
      if (editingDriver) {
        return api.put(`/distributor/drivers/${editingDriver.id}`, data);
      }
      return api.post('/distributor/drivers', data);
    },
    onSuccess: () => {
      toast.success(editingDriver ? 'Tahrirlandi' : "Haydovchi qo'shildi");
      queryClient.invalidateQueries({ queryKey: ['distributor-drivers'] });
      setShowModal(false);
      setEditingDriver(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: (driver: any) => api.put(`/distributor/drivers/${driver.id}`, { status: driver.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    onSuccess: () => { toast.success("Holat o'zgardi"); queryClient.invalidateQueries({ queryKey: ['distributor-drivers'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xatolik'),
  });

  const drivers = resp?.data || [];

  const openEdit = (driver: any) => {
    setEditingDriver(driver);
    setForm({ name: driver.user?.name || driver.name || '', phone: driver.user?.phone || driver.phone || '', vehicleType: driver.vehicleType || '', plateNumber: driver.plateNumber || '', password: '' });
    setShowModal(true);
  };

  const statusVariant = (s: string) => s === 'ACTIVE' ? 'success' : s === 'ON_DELIVERY' ? 'info' : 'secondary';

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="fade-in space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Haydovchilar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{drivers.length} ta haydovchi ro'yxatda</p>
        </div>
        <button
          onClick={() => { setEditingDriver(null); setForm(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Haydovchi qo'shish
        </button>
      </div>

      {/* Drivers Grid */}
      {drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-2xl border border-dashed border-slate-300 gap-3">
          <Truck className="w-12 h-12 text-slate-300" />
          <p className="text-slate-500 font-medium">Haydovchilar yo'q</p>
          <p className="text-slate-400 text-sm">Yangi haydovchi qo'shish uchun yuqoridagi tugmani bosing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver: any) => (
            <div key={driver.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm">
                    {(driver.user?.name || driver.name || 'H').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{driver.user?.name || driver.name}</p>
                    <p className="text-xs text-slate-400">{driver.vehicleType}</p>
                  </div>
                </div>
                <Badge variant={statusVariant(driver.status) as any}>
                  {driver.status === 'ACTIVE' ? 'Faol' : driver.status === 'ON_DELIVERY' ? "Yo'lda" : 'Nofaol'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {(driver.user?.phone || driver.phone) && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {driver.user?.phone || driver.phone}
                  </div>
                )}
                {driver.plateNumber && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {driver.plateNumber}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 text-center">
                  <p className="text-base font-bold text-slate-900">{driver._count?.orders || 0}</p>
                  <p className="text-[10px] text-slate-400">Buyurtmalar</p>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="flex-1 text-center">
                  <p className="text-base font-bold text-emerald-600">{driver._count?.completedOrders || 0}</p>
                  <p className="text-[10px] text-slate-400">Bajarilgan</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(driver)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
                </button>
                <button
                  onClick={() => toggleStatus(driver)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    driver.status === 'ACTIVE'
                      ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100'
                  }`}
                >
                  {driver.status === 'ACTIVE' ? <><Power className="w-3.5 h-3.5" /> O'chirish</> : <><Check className="w-3.5 h-3.5" /> Yoqish</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDriver ? 'Haydovchini tahrirlash' : "Yangi haydovchi qo'shish"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: "To'liq ismi", placeholder: 'Abdullayev Jasur' },
                { key: 'phone', label: 'Telefon', placeholder: '+998901234567' },
                { key: 'vehicleType', label: 'Mashina turi', placeholder: 'Damas, Nexia, Cobalt...' },
                { key: 'plateNumber', label: 'Davlat raqami', placeholder: '01 A 123 AA' },
                { key: 'password', label: editingDriver ? 'Yangi parol (ixtiyoriy)' : 'Parol', placeholder: '••••••••' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                  <input
                    type={key === 'password' ? 'password' : 'text'}
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Bekor</button>
              <button
                onClick={() => saveDriver(form)}
                disabled={saving || !form.name || !form.phone}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingDriver ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
