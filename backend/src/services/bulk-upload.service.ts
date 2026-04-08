import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { BulkUploadResult } from '../types/distributor.types';

const prisma = new PrismaClient();

export class BulkUploadService {
  // PROD-03: Parse Excel/CSV file
  parseFile(buffer: Buffer, filename: string): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  }

  // PROD-03: Validate row
  validateRow(row: any, rowIndex: number): string[] {
    const errors: string[] = [];

    if (!row.name) errors.push(`Qator ${rowIndex}: Nomi majburiy`);
    if (!row.sku) errors.push(`Qator ${rowIndex}: SKU majburiy`);
    if (!row.wholesale_price || isNaN(row.wholesale_price)) {
      errors.push(`Qator ${rowIndex}: Ulgurji narx noto'g'ri`);
    }

    return errors;
  }

  // PROD-03: Bulk import products
  async importProducts(
    distributorId: string,
    buffer: Buffer,
    filename: string
  ): Promise<BulkUploadResult> {
    const rows = this.parseFile(buffer, filename);
    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Validate all rows first
    const validRows: any[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors = this.validateRow(row, i + 2); // +2 for header and 1-based index

      if (errors.length > 0) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          field: 'validation',
          message: errors.join(', ')
        });
      } else {
        validRows.push({ ...row, rowIndex: i + 2 });
      }
    }

    // Import valid rows
    for (const row of validRows) {
      try {
        // Check if SKU exists
        const existing = await prisma.product.findUnique({
          where: { sku: row.sku }
        });

        if (existing) {
          result.failed++;
          result.errors.push({
            row: row.rowIndex,
            field: 'sku',
            message: 'SKU allaqachon mavjud'
          });
          continue;
        }

        // Get or create category
        let categoryId = null;
        if (row.category) {
          const category = await prisma.category.findFirst({
            where: {
              distributorId,
              name: row.category
            }
          });

          if (category) {
            categoryId = category.id;
          } else {
            const newCategory = await prisma.category.create({
              data: {
                distributorId,
                name: row.category,
                slug: slugify(row.category, { lower: true })
              }
            });
            categoryId = newCategory.id;
          }
        }

        // Get or create brand
        let brandId = null;
        if (row.brand) {
          const brand = await prisma.brand.findFirst({
            where: {
              distributorId,
              name: row.brand
            }
          });

          if (brand) {
            brandId = brand.id;
          } else {
            const newBrand = await prisma.brand.create({
              data: {
                distributorId,
                name: row.brand,
                slug: slugify(row.brand, { lower: true })
              }
            });
            brandId = newBrand.id;
          }
        }

        // Create product
        const product = await prisma.product.create({
          data: {
            distributorId,
            name: row.name,
            sku: row.sku,
            wholesalePrice: parseFloat(row.wholesale_price),
            retailPrice: row.retail_price ? parseFloat(row.retail_price) : null,
            discountType: row.discount_type || null,
            discountValue: row.discount_value ? parseFloat(row.discount_value) : null,
            status: row.status || 'ACTIVE',
            categoryId,
            brandId
          }
        });

        // Create variant if specified
        if (row.color || row.size || row.model) {
          const variant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              color: row.color || null,
              size: row.size || null,
              model: row.model || null,
              skuVariant: `${row.sku}-${row.color || ''}-${row.size || ''}-${row.model || ''}`.replace(/--+/g, '-')
            }
          });

          // Create inventory for variant
          if (row.variant_stock) {
            const warehouses = await prisma.warehouse.findMany({
              where: { distributorId, isActive: true }
            });

            for (const warehouse of warehouses) {
              await prisma.inventory.create({
                data: {
                  productId: product.id,
                  variantId: variant.id,
                  warehouseId: warehouse.id,
                  quantity: parseInt(row.variant_stock),
                  reserved: 0
                }
              });
            }
          }
        }

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: row.rowIndex,
          field: 'import',
          message: error.message
        });
      }
    }

    return result;
  }

  // PROD-03: Generate template
  generateTemplate(): Buffer {
    const template = [
      {
        name: 'Mahsulot nomi',
        sku: 'SKU123',
        category: 'Kategoriya',
        brand: 'Brend',
        wholesale_price: 100000,
        retail_price: 120000,
        discount_type: 'percent',
        discount_value: 10,
        status: 'active',
        color: 'Qizil',
        size: 'XL',
        model: 'Pro',
        variant_stock: 50
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
