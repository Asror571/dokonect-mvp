export interface SubRolePermissions {
  products?: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
  inventory?: {
    view?: boolean;
    adjust?: boolean;
  };
  orders?: {
    view?: boolean;
    accept?: boolean;
    reject?: boolean;
    assign?: boolean;
  };
  drivers?: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
  analytics?: {
    view?: boolean;
  };
  settings?: {
    view?: boolean;
    edit?: boolean;
  };
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface InventoryAdjustment {
  productId: string;
  variantId?: string;
  warehouseId: string;
  quantity: number;
  reason: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';
  note?: string;
  document?: string;
}

export interface OrderStats {
  new: number;
  accepted: number;
  assigned: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
  rejected: number;
}

export interface DashboardStats {
  todaySales: number;
  orderStats: OrderStats;
  lowStockCount: number;
  activeDrivers: number;
}
