import type { Product } from '../types';

export function calculateCost(product: Product, quantity: number): number {
  if (!product || quantity <= 0) return 0;
  
  // The new Product type has costPerUnit directly.
  return product.costPerUnit * quantity;
}

export function exportToCsv(filename: string, rows: object[]): boolean {
  if (rows.length === 0) {
    return false;
  }

  const replacer = (_key: any, value: any) => value === null || value === undefined ? '' : value;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(','),
    ...rows.map(row => header.map(fieldName => JSON.stringify((row as any)[fieldName], replacer)).join(','))
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return true;
}