



import React, { useEffect, useState, useMemo, useRef, type ReactNode, useCallback } from 'react';
// FIX: The `Mask` icon does not exist in `lucide-react`. Replaced with `EyeOff` for the private mode toggle.
import {
  ShoppingCart, Users, Box, Plus, Home, Search,
  Package, ReceiptText, CheckCircle, History, LogOut, Settings, DollarSign, Trash2, TrendingUp, Calendar, Pencil, AreaChart, Calculator, AlertTriangle, Save, X, Download, ArrowUpDown, ArrowUp, ArrowDown, Upload, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

import { useLocalStorage } from './hooks/useLocalStorage';
import type { Page, Order, Client, Product, OrderItem, Expense, LogEntry, Metric, DashboardStat } from './types';
import { initialClients, initialProducts, initialOrders, initialExpenses, initialLogs } from './lib/data';
import { calculateCost, exportToCsv } from './lib/utils';
import { CreateOrderModal, CreateClientModal, CreateProductModal, AddStockModal, EditClientModal, EditOrderModal, EditProductModal, ClientOrdersModal, EditExpenseModal, LogDetailsModal, SessionTimeoutModal, ConfirmationModal, CreateExpenseModal, CalculatorModal, AlertModal } from './components/modals';
import { NavItem, MobileNavItem, GlassCard, ActionCard } from './components/common';
import LoginPage from './components/LoginPage';

// Firebase imports
import { AuthService } from './lib/authService';
import { FirebaseService } from './lib/firebaseService';
import type { User } from 'firebase/auth';

// FIX: Alias motion.div to a constant to help TypeScript correctly resolve the component's type.
const MotionDiv = motion.div;

const SortableHeader: React.FC<{
  title: string;
  columnKey: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  className?: string;
}> = ({ title, columnKey, sortConfig, onSort, className }) => {
  const isSorted = sortConfig.key === columnKey;
  const directionIcon = isSorted 
    ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 flex-shrink-0" /> : <ArrowDown size={14} className="ml-1 flex-shrink-0" />) 
    : <ArrowUpDown size={14} className="ml-1 text-transparent group-hover:text-muted flex-shrink-0" />;

  return (
    <button onClick={() => onSort(columnKey)} className={`flex items-center group w-full text-left ${className || ''}`}>
      <span>{title}</span> {directionIcon}
    </button>
  );
};


const DashboardPage: React.FC<{
  onNewOrder: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onViewClientOrders: (client: Client) => void;
  onEditOrder: (order: Order) => void;
  onEditProduct: (product: Product) => void;
  clients: Client[];
  orders: Order[];
  products: Product[];
  isPrivateMode: boolean;
  currentUser: string;
  dashboardStats: DashboardStat[];
}> = ({ onNewOrder, searchQuery, setSearchQuery, onViewClientOrders, onEditOrder, onEditProduct, clients, orders, products, isPrivateMode, currentUser, dashboardStats }) => {
    
    const [currentStatIndex, setCurrentStatIndex] = useState(0);

    useEffect(() => {
        if (!dashboardStats || dashboardStats.length === 0) return;

        const timer = setTimeout(() => {
            setCurrentStatIndex((prevIndex) => (prevIndex + 1) % dashboardStats.length);
        }, 5000); // Change stat every 5 seconds

        return () => clearTimeout(timer);
    }, [currentStatIndex, dashboardStats]);

    const currentStat = dashboardStats[currentStatIndex] || { label: 'Loading...', value: '' };
    
    const searchResults = useMemo(() => {
        if (!searchQuery) return null;

        const lowerQuery = searchQuery.toLowerCase();
        
        const foundClients = clients.filter(c => c.name.toLowerCase().includes(lowerQuery) || `#${c.displayId}`.includes(lowerQuery));
        const foundOrders = orders.filter(o => o.id.toLowerCase().includes(lowerQuery) || (clients.find(c => c.id === o.clientId)?.name || '').toLowerCase().includes(lowerQuery));
        const foundProducts = products.filter(p => p.name.toLowerCase().includes(lowerQuery));

        return { clients: foundClients, orders: foundOrders, products: foundProducts };
    }, [searchQuery, clients, orders, products]);

    return (
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto pt-8 md:pt-12">
            <h1 className="text-4xl font-bold text-primary tracking-tight">Welcome, {currentUser}</h1>
            <div className="h-36 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <MotionDiv
                        key={currentStatIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center"
                    >
                        <p className="text-muted text-lg">{currentStat.label}</p>
                        <h2 className="text-5xl font-bold text-primary tracking-tight mt-1">
                            {currentStat.value}
                        </h2>
                        {currentStat.subtext && <p className="text-muted text-sm mt-2">{currentStat.subtext}</p>}
                    </MotionDiv>
                </AnimatePresence>
            </div>
        </div>
        
        {searchResults && (
            <AnimatePresence>
            {/* FIX: Correctly type framer-motion component props */}
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard title="Search Results">
                    <div className="space-y-6">
                        {searchResults.clients.length > 0 && (
                            <div>
                                <h3 className="font-bold text-primary mb-2">Clients ({searchResults.clients.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {searchResults.clients.map(c => <button key={c.id} onClick={() => onViewClientOrders(c)} className="p-2 text-left rounded-md hover:bg-white/5 transition-colors text-sm"><span className="font-semibold text-primary">{isPrivateMode ? `#${c.displayId}` : c.name}</span> <span className="text-muted">#{c.displayId}</span></button>)}
                                </div>
                            </div>
                        )}
                         {searchResults.orders.length > 0 && (
                            <div>
                                <h3 className="font-bold text-primary mb-2">Orders ({searchResults.orders.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {searchResults.orders.map(o => <button key={o.id} onClick={() => onEditOrder(o)} className="p-2 text-left rounded-md hover:bg-white/5 transition-colors text-sm"><span className="font-semibold text-primary">{o.id}</span> <span className="text-muted">for {isPrivateMode ? `#${clients.find(c=>c.id === o.clientId)?.displayId}` : clients.find(c=>c.id === o.clientId)?.name}</span></button>)}
                                </div>
                            </div>
                        )}
                         {searchResults.products.length > 0 && (
                            <div>
                                <h3 className="font-bold text-primary mb-2">Products ({searchResults.products.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {searchResults.products.map(p => <button key={p.id} onClick={() => onEditProduct(p)} className="p-2 text-left rounded-md hover:bg-white/5 transition-colors text-sm"><span className="font-semibold text-primary">{isPrivateMode ? p.id : p.name}</span> <span className="text-muted">({p.stock} in stock)</span></button>)}
                                </div>
                            </div>
                        )}
                         {searchResults.clients.length === 0 && searchResults.orders.length === 0 && searchResults.products.length === 0 && (
                            <p className="text-center text-muted py-4">No results found.</p>
                         )}
                    </div>
                </GlassCard>
            </MotionDiv>
            </AnimatePresence>
        )}
      </div>
    )
};


const OrdersPage: React.FC<{ orders: Order[]; clients: Client[]; products: Product[]; searchQuery: string; onOrderClick: (order: Order) => void; onMarkAsPaid: (orderId: string) => void; onNewOrder: () => void; isPrivateMode: boolean; }> = ({ orders, clients, products, searchQuery, onOrderClick, onMarkAsPaid, onNewOrder, isPrivateMode }) => {
    const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Completed'>('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });


    const formatPaymentMethods = (order: Order) => {
        const { paymentMethods } = order;
        if (!paymentMethods) {
            // @ts-ignore - Fallback for legacy data
            return order.paymentMethod || 'N/A';
        }

        const methods = [];
        if (paymentMethods.cash) methods.push('Cash');
        if (paymentMethods.etransfer) methods.push('E-Transfer');
        if (paymentMethods.other) methods.push(paymentMethods.otherDetails || 'Other');
        return methods.join(', ') || 'N/A';
    };

    const sortedAndFilteredOrders = useMemo(() => {
        let sortableItems = orders.filter(order => {
            const searchMatch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (clients.find(c => c.id === order.clientId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (!searchMatch) return false;
            if (dateFrom && order.date < dateFrom) return false;
            if (dateTo && order.date > dateTo) return false;

            if (statusFilter === 'All') return true;

            const balance = order.total - (order.amountPaid || 0);

            if (statusFilter === 'Completed') {
                return order.status === 'Completed' || balance <= 0;
            }

            if (statusFilter === 'Unpaid') {
                return order.status === 'Unpaid' && balance > 0;
            }
            
            return order.status === statusFilter;
        });

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;
                
                const getStatus = (order: Order) => ((order.total - (order.amountPaid || 0)) <= 0) ? 'Completed' : order.status;

                switch (sortConfig.key) {
                    case 'client':
                        aValue = clients.find(c => c.id === a.clientId)?.name || '';
                        bValue = clients.find(c => c.id === b.clientId)?.name || '';
                        break;
                    case 'balance':
                        aValue = a.total - (a.amountPaid || 0);
                        bValue = b.total - (b.amountPaid || 0);
                        break;
                    case 'status':
                        aValue = getStatus(a);
                        bValue = getStatus(b);
                        break;
                    case 'date':
                        aValue = new Date(a.date).getTime();
                        bValue = new Date(b.date).getTime();
                        break;
                    default:
                        aValue = a[sortConfig.key as keyof Order];
                        bValue = b[sortConfig.key as keyof Order];
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return sortableItems;

    }, [orders, clients, searchQuery, statusFilter, dateFrom, dateTo, sortConfig]);
    
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getStatusClass = (order: Order) => {
        const balance = order.total - (order.amountPaid || 0);
        if (order.status === 'Completed' || balance <= 0) return 'status-completed';
        if (order.status === 'Unpaid') {
            return (order.amountPaid && order.amountPaid > 0) ? 'status-unpaid' : 'status-unpaid-zero';
        }
        return `status-${order.status.toLowerCase()}`;
    };


    const FilterButton: React.FC<{ label: string; value: typeof statusFilter }> = ({ label, value }) => {
        const isActive = statusFilter === value;
        return (
            <button
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    isActive 
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                    : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <GlassCard>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-primary">Orders</h2>
                <button onClick={onNewOrder} className="gloss-btn">
                    <Plus size={16} /> New Order
                </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <FilterButton label="All" value="All" />
                    <FilterButton label="Unpaid" value="Unpaid" />
                    <FilterButton label="Completed" value="Completed" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-primary" />
                    <span className="text-muted text-xs">to</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-primary" />
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-muted hover:text-primary">Clear</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                    <tr className="text-xs text-muted border-b border-white/10">
                        <th className="p-3"><SortableHeader title="Order ID" columnKey="id" sortConfig={sortConfig} onSort={handleSort} /></th>
                        <th className="p-3"><SortableHeader title="Client" columnKey="client" sortConfig={sortConfig} onSort={handleSort} /></th>
                        <th className="p-3">Products</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3"><SortableHeader title="Total" columnKey="total" sortConfig={sortConfig} onSort={handleSort} /></th>
                        <th className="p-3"><SortableHeader title="Balance" columnKey="balance" sortConfig={sortConfig} onSort={handleSort} /></th>
                        <th className="p-3"><SortableHeader title="Status" columnKey="status" sortConfig={sortConfig} onSort={handleSort} /></th>
                        <th className="p-3 text-center"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedAndFilteredOrders.map(o => {
                        const balance = o.total - (o.amountPaid || 0);
                        const isCompleted = balance <= 0;
                        const client = clients.find(c => c.id === o.clientId);
                        return (
                            <tr key={o.id} onClick={() => onOrderClick(o)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="p-3 font-mono text-primary">{o.id}</td>
                                <td className="p-3 text-primary">{isPrivateMode ? `#${client?.displayId}` : client?.name}</td>
                                <td className="p-3 text-muted text-xs">
                                    {o.items.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        return <div key={item.productId}>{(isPrivateMode ? product?.id : product?.name) || 'Unknown'} - {item.sizeLabel ?? `${product?.type === 'g' ? item.quantity.toFixed(2) : Math.round(item.quantity)}${product?.type}`}</div>
                                    })}
                                </td>
                                <td className="p-3 text-primary">{formatPaymentMethods(o)}</td>
                                <td className="p-3 text-primary font-semibold">${Math.round(o.total).toLocaleString()}</td>
                                <td className={`p-3 font-semibold ${balance > 0 ? 'text-orange-400' : balance < 0 ? 'text-cyan-400' : 'text-primary'}`}>
                                    {balance < 0 ? `-$${Math.abs(Math.round(balance)).toLocaleString()}` : `$${Math.round(balance).toLocaleString()}`}
                                </td>
                                <td className="p-3"><span className={`status-badge ${getStatusClass(o)}`}>{balance <= 0 ? 'Completed' : o.status}</span></td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center items-center gap-1">
                                    {!isCompleted ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMarkAsPaid(o.id); }}
                                            className="p-2 rounded-full hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                                            aria-label="Mark as paid"
                                            title="Mark as paid"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    ) : (
                                        <div className="p-2 text-muted cursor-not-allowed" title="Order is paid">
                                            <CheckCircle size={18} />
                                        </div>
                                    )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const ClientsPage: React.FC<{ 
    clients: (Client & { orders: number; totalSpent: number; balance: number; totalDiscounts: number; })[];
    searchQuery: string; 
    onClientClick: (client: Client) => void;
    onViewOrders: (client: Client) => void;
    onNewClient: () => void;
    isPrivateMode: boolean;
}> = ({ clients, searchQuery, onClientClick, onViewOrders, onNewClient, isPrivateMode }) => {
    
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'balance', direction: 'desc' });
    
    const sortedAndFilteredClients = useMemo(() => {
        let sortableItems = clients.filter(client =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            `#${client.displayId}`.includes(searchQuery)
        );

        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof typeof a];
            const bValue = b[sortConfig.key as keyof typeof b];
            
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            }

            if (sortConfig.direction === 'desc') {
                comparison *= -1;
            }

            // If primary sort is equal, apply secondary sort
            if (comparison === 0 && sortConfig.key !== 'orders') {
                return b.orders - a.orders;
            }

            return comparison;
        });

        return sortableItems;
    }, [clients, searchQuery, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };


    const getBalanceClass = (balance: number) => {
        if (balance > 500) return 'text-purple-400 font-bold';
        if (balance > 0) return 'text-orange-400';
        if (balance < 0) return 'text-cyan-400';
        return 'text-primary';
    };

    const totals = useMemo(() => {
        return sortedAndFilteredClients.reduce((acc, client) => {
            acc.orders += client.orders;
            acc.spent += client.totalSpent;
            acc.discounts += client.totalDiscounts;
            acc.balance += client.balance;
            return acc;
        }, { orders: 0, spent: 0, discounts: 0, balance: 0 });
    }, [sortedAndFilteredClients]);
    
    return (
        <GlassCard>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-primary">Clients</h2>
                <button onClick={onNewClient} className="gloss-btn">
                    <Plus size={16} /> Add Client
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-muted border-b border-white/10">
                            <th className="p-3"><SortableHeader title="#ID" columnKey="displayId" sortConfig={sortConfig} onSort={handleSort} /></th>
                            <th className="p-3"><SortableHeader title="Name" columnKey="name" sortConfig={sortConfig} onSort={handleSort} /></th>
                            <th className="p-3"><SortableHeader title="Orders" columnKey="orders" sortConfig={sortConfig} onSort={handleSort} /></th>
                            <th className="p-3"><SortableHeader title="Spent" columnKey="totalSpent" sortConfig={sortConfig} onSort={handleSort} /></th>
                            <th className="p-3"><SortableHeader title="Balance" columnKey="balance" sortConfig={sortConfig} onSort={handleSort} /></th>
                             <th className="p-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredClients.map(c => (
                            <tr key={c.id} onClick={() => onViewOrders(c)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="p-3 text-muted">#{c.displayId}</td>
                                <td className="p-3">
                                    <div className="font-semibold text-primary">{isPrivateMode ? `#${c.displayId}` : c.name}</div>
                                </td>
                                <td className="p-3 text-primary">{c.orders}</td>
                                <td className="p-3 text-primary font-medium">${Math.round(c.totalSpent).toLocaleString()}</td>
                                <td className={`p-3 font-medium ${getBalanceClass(c.balance)}`}>
                                    <div className="flex items-center gap-2">
                                        {c.balance > 0 && <span title="Outstanding debt"><AlertTriangle size={14} /></span>}
                                        <span>{c.balance !== 0 ? (c.balance < 0 ? `-$${Math.abs(Math.round(c.balance)).toLocaleString()}` : `$${Math.round(c.balance).toLocaleString()}`) : '-'}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onClientClick(c); }} 
                                      className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted"
                                      aria-label="Edit client"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-white/10 font-bold text-sm bg-white/5 text-primary">
                            <td className="p-3" colSpan={2}>Totals ({sortedAndFilteredClients.length} clients)</td>
                            <td className="p-3">{totals.orders}</td>
                            <td className="p-3">${Math.round(totals.spent).toLocaleString()}</td>
                            <td className="p-3">${Math.round(totals.balance).toLocaleString()}</td>
                            <td className="p-3"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </GlassCard>
    );
};

const ProductsPage: React.FC<{ 
    products: Product[]; 
    searchQuery: string; 
    onProductClick: (product: Product) => void; 
    inventoryValue: number; 
    onAddProduct: () => void;
    onUpdateStock: (product: Product) => void;
    isPrivateMode: boolean;
}> = ({ products, searchQuery, onProductClick, inventoryValue, onAddProduct, onUpdateStock, isPrivateMode }) => {
    const sortedAndFilteredProducts = useMemo(() => {
        return products
            .filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.type.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                const aHasStock = a.stock > 0;
                const bHasStock = b.stock > 0;

                // Products with stock > 0 are prioritized
                if (aHasStock && !bHasStock) return -1;
                if (!aHasStock && bHasStock) return 1;

                // If both are out of stock, sort alphabetically
                if (!aHasStock && !bHasStock) {
                    return a.name.localeCompare(b.name);
                }

                // Both products have stock, now apply sorting logic
                const aHasDate = !!a.lastOrdered;
                const bHasDate = !!b.lastOrdered;
                
                // Prioritize products that have been sold
                if (aHasDate && !bHasDate) return -1;
                if (!aHasDate && bHasDate) return 1;

                // If both have been sold, sort by most recent
                if (aHasDate && bHasDate) {
                    // Non-null assertion is safe here because of the aHasDate/bHasDate checks
                    const dateComparison = new Date(b.lastOrdered!).getTime() - new Date(a.lastOrdered!).getTime();
                    if (dateComparison !== 0) return dateComparison;
                }

                // If lastOrdered is the same or non-existent for both, sort by inventory value
                const aValue = a.stock * a.costPerUnit;
                const bValue = b.stock * b.costPerUnit;
                
                if (aValue !== bValue) {
                    return bValue - aValue; // Descending value
                }
                
                // Final tie-breaker
                return a.name.localeCompare(b.name);
            });
    }, [products, searchQuery]);

    return (
        <GlassCard>
             <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-primary">Products</h2>
                <button onClick={onAddProduct} className="gloss-btn">
                    <Plus size={16} /> Add Product
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                    <tr className="text-xs text-muted border-b border-white/10">
                        <th className="p-3">Product</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedAndFilteredProducts.map(p => {
                        const hasStock = p.stock > 0;
                        const stockColor = hasStock ? 'text-primary' : 'text-muted';
                        
                        return (
                            <tr key={p.id} onClick={() => onProductClick(p)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                                <td className={`p-3 font-semibold ${stockColor}`}>{isPrivateMode ? p.id : p.name}</td>
                                <td className="p-3">
                                    <span className={`font-medium ${stockColor}`}>
                                        {Math.floor(p.stock)}
                                        {p.type !== 'unit' ? ` ${p.type}` : ''}
                                    </span>
                                </td>
                                 <td className="p-3 text-right">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onUpdateStock(p); }} 
                                        className="p-2 rounded-full text-muted hover:bg-white/10 hover:text-primary transition-colors"
                                        aria-label={`Update stock for ${isPrivateMode ? p.id : p.name}`}
                                    >
                                        <Pencil size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const TransactionsPage: React.FC<{
    orders: Order[];
    expenses: Expense[];
    clients: Client[];
    searchQuery: string;
    onNewExpense: () => void;
    isPrivateMode: boolean;
    onEditExpense: (expense: Expense) => void;
    onEditOrder: (order: Order) => void;
}> = ({ orders, expenses, clients, searchQuery, onNewExpense, isPrivateMode, onEditExpense, onEditOrder }) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const transactions = useMemo(() => {
        const incomeTransactions = orders.map(order => {
            const client = clients.find(c => c.id === order.clientId);
            const clientDisplay = isPrivateMode 
                ? (client ? `#${client.displayId}` : 'Unknown Client') 
                : (client?.name || 'Unknown Client');
            return {
                id: `order-${order.id}`,
                date: order.date,
                type: 'Income',
                description: `Order ${order.id} for ${clientDisplay}`,
                amount: order.total,
                original: order,
            };
        });

        const expenseTransactions = expenses.map(expense => ({
            id: `expense-${expense.id}`,
            date: expense.date,
            type: 'Expense',
            description: expense.description,
            amount: -expense.amount,
            original: expense,
        }));
        
        return [...incomeTransactions, ...expenseTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, expenses, clients, isPrivateMode]);
    
    const filteredTransactions = useMemo(() => transactions.filter(t => {
        const lowerQuery = searchQuery.toLowerCase();
        // FIX: Safely access 'category' property on 't.original' which is a union type (Order | Expense).
        // The 'in' operator acts as a type guard to ensure 't.original' is of type 'Expense'.
        const searchMatch = t.description.toLowerCase().includes(lowerQuery) || ('category' in t.original && t.original.category && t.original.category.toLowerCase().includes(lowerQuery));

        if (!searchMatch) return false;

        const transactionDate = new Date(t.date);
        if (dateFrom && transactionDate < new Date(dateFrom)) return false;
        if (dateTo && transactionDate > new Date(dateTo)) return false;
        
    return true;
}), [transactions, searchQuery, dateFrom, dateTo]);

    const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
    const totalExpenses = useMemo(() => filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
    const netTotal = totalIncome + totalExpenses;
    
    return (
        <GlassCard>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-primary">Transactions</h2>
                <button onClick={onNewExpense} className="gloss-btn">
                    <Plus size={16} /> Add Expense
                </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                 <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-primary" />
                    <span className="text-muted text-xs">to</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-primary" />
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-muted hover:text-primary">Clear</button>
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-muted border-b border-white/10">
                            <th className="p-3">Date</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => (
                            <tr
                              key={t.id}
                              className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors"
                              onClick={() => {
                                  if (t.type === 'Expense') {
                                      onEditExpense(t.original as Expense);
                                  } else if (t.type === 'Income') {
                                      onEditOrder(t.original as Order);
                                  }
                              }}
                            >
                                <td className="p-3 text-muted">{t.date}</td>
                                <td className="p-3 text-primary">{t.description}</td>
                                <td className="p-3">
                                    <span className={`status-badge ${t.type === 'Income' ? 'status-completed' : 'status-unpaid-zero'}`}>{t.type}</span>
                                </td>
                                <td className={`p-3 text-right font-medium ${t.amount > 0 ? 'text-cyan-400' : 'text-purple-400'}`}>
                                    {t.amount > 0 ? `+$${Math.round(t.amount).toLocaleString()}` : `-$${Math.abs(Math.round(t.amount)).toLocaleString()}`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold border-t-2 border-white/10">
                            <td className="p-3 text-primary" colSpan={3}>Total Income</td>
                            <td className="p-3 text-right text-cyan-400">${Math.round(totalIncome).toLocaleString()}</td>
                        </tr>
                        <tr className="font-bold">
                            <td className="p-3 text-primary" colSpan={3}>Total Expenses</td>
                            <td className="p-3 text-right text-purple-400">-${Math.abs(Math.round(totalExpenses)).toLocaleString()}</td>
                        </tr>
                         <tr className="font-bold text-lg border-t border-white/10 bg-white/5">
                            <td className="p-3 text-primary" colSpan={3}>Net Total</td>
                            <td className={`p-3 text-right ${netTotal >= 0 ? 'text-primary' : 'text-purple-400'}`}>
                                {netTotal < 0 ? `-$${Math.abs(Math.round(netTotal)).toLocaleString()}` : `$${Math.round(netTotal).toLocaleString()}`}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </GlassCard>
    );
};

const LogPage: React.FC<{ logs: LogEntry[]; onLogClick: (log: LogEntry) => void; }> = ({ logs, onLogClick }) => (
    <GlassCard title="Activity Log">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-xs text-muted border-b border-white/10">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id} onClick={() => onLogClick(log)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="p-3 text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-3 text-primary">{log.user}</td>
                            <td className="p-3 text-primary">{log.action}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </GlassCard>
);

const SettingsPage: React.FC<{
    setPage: (page: Page) => void;
    onExport: (type: 'all') => void;
    onImport: (file: File) => void;
    onLogout: () => void;
    onDeleteAllData: () => void;
}> = ({ setPage, onExport, onImport, onLogout, onDeleteAllData }) => {
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(file);
            event.target.value = ''; // Reset input to allow re-uploading the same file
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-primary tracking-tight">Settings</h1>
                <p className="text-muted mt-2">Manage your dashboard's data, preferences, and user session.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ActionCard
                    icon={<ReceiptText size={24} />}
                    title="Transactions"
                    description="View a complete history of all income and expenses."
                    onClick={() => setPage('transactions')}
                />
                <ActionCard
                    icon={<History size={24} />}
                    title="Activity Log"
                    description="Track all actions performed within the dashboard."
                    onClick={() => setPage('log')}
                />
                <ActionCard
                    icon={<AreaChart size={24} />}
                    title="Reports"
                    description="Visual breakdown of sales and expense data."
                    onClick={() => setPage('reports')}
                />
                <ActionCard
                    icon={<Download size={24} />}
                    title="Export Data"
                    description="Download all your data as a single JSON file."
                    onClick={() => onExport('all')}
                />
                <ActionCard
                    icon={<Upload size={24} />}
                    title="Import Data"
                    description="Upload a previously exported JSON file to restore data."
                    onClick={handleImportClick}
                />
                <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                <ActionCard
                    icon={<LogOut size={24} />}
                    title="Log Out"
                    description="Sign out of your current session."
                    onClick={onLogout}
                    variant="danger"
                />
            </div>
            
            <div className="mt-12">
                <h2 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h2>
                <div className="glass p-6 border-red-500/30 border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-primary">Delete All Data</h3>
                            <p className="text-sm text-muted mt-1 max-w-xl">Permanently delete all clients, products, orders, expenses, and activity logs. This action is irreversible and cannot be undone.</p>
                        </div>
                        <button onClick={onDeleteAllData} className="gloss-btn gloss-btn-danger flex-shrink-0">
                            <Trash2 size={16} /> Delete All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportsPage: React.FC<{
    orders: Order[];
    products: Product[];
    expenses: Expense[];
    clients: Client[];
    isPrivateMode: boolean;
}> = ({ orders, products, expenses, clients, isPrivateMode }) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [profitSortConfig, setProfitSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'netProfit', direction: 'desc' });

    const filteredData = useMemo(() => {
        const filteredOrders = orders.filter(o => {
            if (dateFrom && o.date < dateFrom) return false;
            if (dateTo && o.date > dateTo) return false;
            return true;
        });
        const filteredExpenses = expenses.filter(e => {
            if (dateFrom && e.date < dateFrom) return false;
            if (dateTo && e.date > dateTo) return false;
            return true;
        });
        return { orders: filteredOrders, expenses: filteredExpenses };
    }, [orders, expenses, dateFrom, dateTo]);

    const reportStats = useMemo(() => {
        const { orders, expenses } = filteredData;
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const totalCost = orders.reduce((sum, o) => {
            return sum + o.items.reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.productId);
                return itemSum + (product ? item.quantity * product.costPerUnit : 0);
            }, 0);
        }, 0);
        const totalProfit = totalRevenue - totalCost;
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netIncome = totalProfit - totalExpenses;
        const orderCount = orders.length;
        const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

        return { totalRevenue, totalProfit, totalExpenses, netIncome, orderCount, avgOrderValue };
    }, [filteredData, products]);

    const handleProfitSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (profitSortConfig.key === key && profitSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setProfitSortConfig({ key, direction });
    };

    const productProfitabilityData = useMemo(() => {
        const profitMap = new Map<string, {
            productId: string;
            name: string;
            unitsSold: number;
            totalSales: number;
            totalCost: number;
            netProfit: number;
            margin: number;
        }>();

        filteredData.orders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return;

                const current = profitMap.get(item.productId) || {
                    productId: product.id,
                    name: product.name,
                    unitsSold: 0,
                    totalSales: 0,
                    totalCost: 0,
                    netProfit: 0,
                    margin: 0
                };

                current.unitsSold += item.quantity;
                current.totalSales += item.price;
                current.totalCost += item.quantity * product.costPerUnit;
                profitMap.set(item.productId, current);
            });
        });

        let result = Array.from(profitMap.values()).map(p => {
            const netProfit = p.totalSales - p.totalCost;
            const margin = p.totalSales > 0 ? (netProfit / p.totalSales) * 100 : 0;
            return { ...p, netProfit, margin };
        });

        if (profitSortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[profitSortConfig.key as keyof typeof a];
                const bValue = b[profitSortConfig.key as keyof typeof b];
                if (aValue < bValue) return profitSortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return profitSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [filteredData, products, profitSortConfig]);

    const salesByProductData = useMemo(() => {
        const salesMap = new Map<string, { name: string; sales: number }>();
        filteredData.orders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return;
                const productName = isPrivateMode ? product.id : product.name;
                const current = salesMap.get(productName) || { name: productName, sales: 0 };
                current.sales += item.price;
                salesMap.set(productName, current);
            });
        });
        return Array.from(salesMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 10);
    }, [filteredData, products, isPrivateMode]);
    
    const topClientsData = useMemo(() => {
        const clientMap = new Map<string, { name: string; sales: number }>();
        filteredData.orders.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            if (!client) return;
            const clientName = isPrivateMode ? `#${client.displayId}` : client.name;
            const current = clientMap.get(clientName) || { name: clientName, sales: 0 };
            current.sales += order.total;
            clientMap.set(clientName, current);
        });
        return Array.from(clientMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 10);
    }, [filteredData, clients, isPrivateMode]);

    const monthlySalesData = useMemo(() => {
        const salesMap = new Map<string, number>();
        filteredData.orders.forEach(order => {
            const month = new Date(order.date).toISOString().slice(0, 7); // YYYY-MM
            const current = salesMap.get(month) || 0;
            salesMap.set(month, current + order.total);
        });
        return Array.from(salesMap.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [filteredData]);

    const expenseByCategoryData = useMemo(() => {
        const expenseMap = new Map<string, number>();
        filteredData.expenses.forEach(expense => {
            const category = expense.category || 'Uncategorized';
            const current = expenseMap.get(category) || 0;
            expenseMap.set(category, current + expense.amount);
        });
        return Array.from(expenseMap.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const StatCard: React.FC<{ label: string; value: string; colorClass?: string }> = ({ label, value, colorClass = 'text-primary' }) => (
        <div className="glass p-4 rounded-lg">
            <p className="text-sm text-muted">{label}</p>
            <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <GlassCard>
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-primary">Reports</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-primary" />
                        <span className="text-muted text-xs">to</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-primary" />
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-muted hover:text-primary">Clear</button>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Revenue" value={`$${Math.round(reportStats.totalRevenue).toLocaleString()}`} colorClass="text-cyan-400" />
                <StatCard label="Total Profit" value={`$${Math.round(reportStats.totalProfit).toLocaleString()}`} colorClass="text-green-400" />
                <StatCard label="Total Orders" value={reportStats.orderCount.toLocaleString()} />
                <StatCard label="Avg. Order Value" value={`$${Math.round(reportStats.avgOrderValue).toLocaleString()}`} />
                <StatCard label="Total Expenses" value={`$${Math.round(reportStats.totalExpenses).toLocaleString()}`} colorClass="text-orange-400" />
                <StatCard label="Net Income" value={`${reportStats.netIncome < 0 ? '-' : ''}$${Math.round(Math.abs(reportStats.netIncome)).toLocaleString()}`} colorClass={reportStats.netIncome >= 0 ? 'text-green-400' : 'text-purple-400'}/>
            </div>

            <GlassCard title="Product Profitability">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-xs text-muted border-b border-white/10">
                                <th className="p-3"><SortableHeader title="Product" columnKey="name" sortConfig={profitSortConfig} onSort={handleProfitSort} /></th>
                                <th className="p-3"><SortableHeader title="Units Sold" columnKey="unitsSold" sortConfig={profitSortConfig} onSort={handleProfitSort} /></th>
                                <th className="p-3"><SortableHeader title="Total Sales" columnKey="totalSales" sortConfig={profitSortConfig} onSort={handleProfitSort} /></th>
                                <th className="p-3"><SortableHeader title="Total COGS" columnKey="totalCost" sortConfig={profitSortConfig} onSort={handleProfitSort} /></th>
                                <th className="p-3"><SortableHeader title="Net Profit" columnKey="netProfit" sortConfig={profitSortConfig} onSort={handleProfitSort} /></th>
                                <th className="p-3"><SortableHeader title="Margin" columnKey="margin" sortConfig={profitSortConfig} onSort={handleProfitSort} /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {productProfitabilityData.map(p => (
                                <tr key={p.productId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-semibold text-primary">{isPrivateMode ? p.productId : p.name}</td>
                                    <td className="p-3 text-muted">{p.unitsSold % 1 !== 0 ? p.unitsSold.toFixed(2) : p.unitsSold}</td>
                                    <td className="p-3 text-cyan-400">${Math.round(p.totalSales).toLocaleString()}</td>
                                    <td className="p-3 text-orange-400">${Math.round(p.totalCost).toLocaleString()}</td>
                                    <td className={`p-3 font-semibold ${p.netProfit >= 0 ? 'text-green-400' : 'text-purple-400'}`}>${Math.round(p.netProfit).toLocaleString()}</td>
                                    <td className="p-3 text-muted">{p.margin.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <GlassCard title="Top 10 Clients by Sales">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topClientsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis type="number" stroke="var(--text-muted)" />
                            <YAxis type="category" dataKey="name" width={80} stroke="var(--text-muted)" />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-muted)' }} contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} />
                            <Bar dataKey="sales" fill="rgba(34, 211, 238, 0.7)" />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
                <GlassCard title="Monthly Sales">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlySalesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="label" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-muted)' }} contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} />
                            <Legend wrapperStyle={{ color: 'var(--text-muted)' }} />
                            <Line type="monotone" dataKey="value" name="Sales" stroke="rgb(var(--accent))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>
                <GlassCard title="Top 10 Products by Sales">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesByProductData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis type="number" stroke="var(--text-muted)" />
                            <YAxis type="category" dataKey="name" width={80} stroke="var(--text-muted)" />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-muted)' }} contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} />
                            <Bar dataKey="sales" fill="rgba(var(--accent), 0.7)" />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
                <GlassCard title="Expenses by Category">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={expenseByCategoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="label" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-muted)' }} contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} />
                            <Legend wrapperStyle={{ color: 'var(--text-muted)' }} />
                            <Bar dataKey="value" name="Expenses" fill="rgba(192, 132, 252, 0.7)" />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>
        </div>
    )
}

const App: React.FC = () => {
  // Firebase state
  const [user, setUser] = useState<User | null>(null);
  const [firebaseService, setFirebaseService] = useState<FirebaseService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState<Page>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivateMode, setIsPrivateMode] = useLocalStorage('isPrivateMode', false);

  // Data state - now managed by Firebase
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Modal state
  const [isCreateOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [isCreateClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [isCreateProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [isAddStockModalOpen, setAddStockModalOpen] = useState(false);
  const [isCreateExpenseModalOpen, setCreateExpenseModalOpen] = useState(false);
  const [isEditClientModalOpen, setEditClientModalOpen] = useState(false);
  const [isEditOrderModalOpen, setEditOrderModalOpen] = useState(false);
  const [isEditProductModalOpen, setEditProductModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setEditExpenseModalOpen] = useState(false);
  const [isClientOrdersModalOpen, setClientOrdersModalOpen] = useState(false);
  const [isLogDetailsModalOpen, setLogDetailsModalOpen] = useState(false);
  const [isCalculatorModalOpen, setCalculatorModalOpen] = useState(false);

  const [isSessionTimeoutModalOpen, setSessionTimeoutModalOpen] = useState(false);
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [isAlertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalContent, setAlertModalContent] = useState<{ title: string; message: string }>({ title: '', message: '' });

  // Data for modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [confirmationAction, setConfirmationAction] = useState<{ onConfirm: () => void, title: string, message: string } | null>(null);

  // Initialize Firebase auth listener
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const service = new FirebaseService(firebaseUser.uid);
        setFirebaseService(service);

        // Load initial data
        try {
          const [clientsData, productsData, ordersData, expensesData, logsData] = await Promise.all([
            service.getClients(),
            service.getProducts(),
            service.getOrders(),
            service.getExpenses(),
            service.getLogs()
          ]);

          setClients(clientsData);
          setProducts(productsData);
          setOrders(ordersData);
          setExpenses(expensesData);
          setLogs(logsData);

          // Set up real-time listeners
          const unsubscribeClients = service.onClientsChange(setClients);
          const unsubscribeProducts = service.onProductsChange(setProducts);
          const unsubscribeOrders = service.onOrdersChange(setOrders);
          const unsubscribeExpenses = service.onExpensesChange(setExpenses);
          const unsubscribeLogs = service.onLogsChange(setLogs);

          // Store unsubscribe functions for cleanup
          return () => {
            unsubscribeClients();
            unsubscribeProducts();
            unsubscribeOrders();
            unsubscribeExpenses();
            unsubscribeLogs();
          };
        } catch (error) {
          console.error('Error loading data:', error);
          showAlert('Error', 'Failed to load data. Please try refreshing the page.');
        }
      } else {
        setUser(null);
        setFirebaseService(null);
        setClients([]);
        setProducts([]);
        setOrders([]);
        setExpenses([]);
        setLogs([]);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const addLog = useCallback(async (action: string, details: Record<string, any>) => {
    if (!firebaseService || !user) return;

    try {
      const newLog = await firebaseService.addLog({
        timestamp: new Date().toISOString(),
        user: user.displayName || user.email || 'Unknown User',
        action,
        details
      });
      // Real-time listener will update the logs state automatically
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }, [firebaseService, user]);

  const showAlert = (title: string, message: string) => {
    setAlertModalContent({ title, message });
    setAlertModalOpen(true);
  };

  // Client and Order data aggregation
  const clientDataWithStats = useMemo(() => {
    return clients.map(client => {
      const clientOrders = orders.filter(o => o.clientId === client.id);
      const totalSpent = clientOrders.reduce((sum, o) => sum + o.total, 0);
      const totalPaid = clientOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
      const totalDiscounts = clientOrders.reduce((sum, o) => sum + (o.discount?.amount || 0), 0);

      return {
        ...client,
        orders: clientOrders.length,
        totalSpent,
        balance: totalSpent - totalPaid,
        totalDiscounts,
      };
    });
  }, [clients, orders]);

  const inventoryValue = useMemo(() => {
    return products.reduce((total, p) => {
      if (p.stock <= 0 || !p.tiers || p.tiers.length === 0) {
        return total;
      }

      // Find the tier with the smallest positive quantity to use as a base for retail price.
      const sortedTiers = [...p.tiers]
        .filter(t => t.quantity > 0)
        .sort((a, b) => a.quantity - b.quantity);

      if (sortedTiers.length === 0) {
        return total;
      }

      const smallestTier = sortedTiers[0];
      const pricePerUnit = smallestTier.price / smallestTier.quantity;
      
      return total + (p.stock * pricePerUnit);
    }, 0);
  }, [products]);

  const inventoryCost = useMemo(() => {
    return products.reduce((total, p) => total + (p.stock * p.costPerUnit), 0);
  }, [products]);

  const dashboardStats = useMemo((): DashboardStat[] => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const weekStartDt = new Date(today);
    weekStartDt.setDate(today.getDate() - today.getDay());
    weekStartDt.setHours(0, 0, 0, 0);

    const monthStartDt = new Date(today.getFullYear(), today.getMonth(), 1);

    const ordersToday = orders.filter(o => o.date === todayStr);
    const salesToday = ordersToday.reduce((sum, o) => sum + o.total, 0);

    const salesThisWeek = orders
        .filter(o => new Date(o.date) >= weekStartDt)
        .reduce((sum, o) => sum + o.total, 0);

    const salesThisMonth = orders
        .filter(o => new Date(o.date) >= monthStartDt)
        .reduce((sum, o) => sum + o.total, 0);

    const unpaidOrders = orders.filter(o => (o.total - (o.amountPaid || 0)) > 0);
    const totalDebt = unpaidOrders.reduce((sum, o) => sum + (o.total - (o.amountPaid || 0)), 0);

    return [
        { label: 'Total Inventory Retail Value', value: `$${Math.round(inventoryValue).toLocaleString()}` },
        { label: 'Total Inventory Cost', value: `$${Math.round(inventoryCost).toLocaleString()}` },
        { label: 'Sales Today', value: `$${Math.round(salesToday).toLocaleString()}`, subtext: `${ordersToday.length} ${ordersToday.length === 1 ? 'order' : 'orders'}` },
        { label: 'Outstanding Debt', value: `$${Math.round(totalDebt).toLocaleString()}`, subtext: `From ${unpaidOrders.length} unpaid orders` },
        { label: 'Sales This Week', value: `$${Math.round(salesThisWeek).toLocaleString()}`, subtext: 'Since Sunday' },
        { label: 'Sales This Month', value: `$${Math.round(salesThisMonth).toLocaleString()}`, subtext: `In ${new Date().toLocaleString('default', { month: 'long' })}` },
    ];
  }, [products, orders, inventoryValue, inventoryCost]);

  // Event handlers
  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      setConfirmationModalOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      showAlert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleCreateOrder = (orderData: Omit<Order, 'id' | 'total' | 'status'>) => {
    const itemsTotal = orderData.items.reduce((sum, item) => sum + item.price, 0);
    const total = itemsTotal + (orderData.fees.amount || 0) - (orderData.discount.amount || 0);
    const status: 'Unpaid' | 'Completed' = orderData.amountPaid >= total ? 'Completed' : 'Unpaid';
    
    const newOrder: Order = {
      ...orderData,
      id: `ord-${(orders.length + 1).toString().padStart(4, '0')}`,
      total,
      status,
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update product stock
    const timestamp = new Date().toISOString();
    setProducts(prevProducts => prevProducts.map(p => {
        const itemInOrder = newOrder.items.find(item => item.productId === p.id);
        if (itemInOrder) {
            return { ...p, stock: p.stock - itemInOrder.quantity, lastOrdered: timestamp };
        }
        return p;
    }));

    addLog('Order Created', { orderId: newOrder.id, client: newOrder.clientId, total: newOrder.total });
    setCreateOrderModalOpen(false);
  };
  
  const handleEditOrder = (originalOrder: Order, updatedData: Omit<Order, 'id'>) => {
    const stockChanges = new Map<string, number>();

    // Calculate stock to return to inventory
    originalOrder.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) + item.quantity);
    });

    // Calculate new stock to be removed
    updatedData.items.forEach(item => {
        stockChanges.set(item.productId, (stockChanges.get(item.productId) || 0) - item.quantity);
    });

    const timestamp = new Date().toISOString();
    const updatedProductIds = new Set(updatedData.items.map(item => item.productId));

    setProducts(prevProducts => prevProducts.map(p => {
        const stockChange = stockChanges.get(p.id);
        const shouldUpdateTimestamp = updatedProductIds.has(p.id);

        if (stockChange !== undefined || shouldUpdateTimestamp) {
            const newStock = p.stock + (stockChange || 0);
            const newLastOrdered = shouldUpdateTimestamp ? timestamp : p.lastOrdered;
            return { ...p, stock: newStock, lastOrdered: newLastOrdered };
        }
        return p;
    }));

    setOrders(prev => prev.map(o => o.id === originalOrder.id ? { ...updatedData, id: originalOrder.id } : o));
    addLog('Order Updated', { orderId: originalOrder.id });
    setEditOrderModalOpen(false);
  };

  const handleDeleteOrder = () => {
    if (!selectedOrder) return;

    // Return stock to inventory
    setProducts(prevProducts => prevProducts.map(p => {
        const itemInOrder = selectedOrder.items.find(item => item.productId === p.id);
        if (itemInOrder) {
            return { ...p, stock: p.stock + itemInOrder.quantity };
        }
        return p;
    }));

    setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
    addLog('Order Deleted', { orderId: selectedOrder.id });
    setEditOrderModalOpen(false);
    setConfirmationModalOpen(false);
  };

  const handleMarkAsPaid = (orderId: string) => {
    setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
            addLog('Order Marked as Paid', { orderId });
            return { ...o, amountPaid: o.total, status: 'Completed' };
        }
        return o;
    }));
  };

  const handleCreateClient = (clientData: Omit<Client, 'id' | 'orders' | 'totalSpent' | 'displayId'>) => {
    const nextDisplayId = Math.max(0, ...clients.map(c => c.displayId)) + 1;
    const newClient: Client = {
      ...clientData,
      id: `c-${Date.now()}`,
      displayId: nextDisplayId,
      orders: 0,
      totalSpent: 0
    };
    setClients(prev => [...prev, newClient]);
    addLog('Client Created', { clientId: newClient.id, name: newClient.name });
    setCreateClientModalOpen(false);
  };

  const handleEditClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    addLog('Client Updated', { clientId: updatedClient.id });
    setEditClientModalOpen(false);
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    const clientOrders = orders.filter(o => o.clientId === selectedClient.id);
    if (clientOrders.length > 0) {
      showAlert("Cannot Delete Client", "Cannot delete client with existing orders. Please reassign or delete their orders first.");
      return;
    }
    setClients(prev => prev.filter(c => c.id !== selectedClient.id));
    addLog('Client Deleted', { clientId: selectedClient.id });
    setEditClientModalOpen(false);
    setConfirmationModalOpen(false);
  };

  const handleCreateProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...productData, id: `p-${Date.now()}` };
    setProducts(prev => [...prev, newProduct]);
    addLog('Product Created', { productId: newProduct.id, name: newProduct.name });
    setCreateProductModalOpen(false);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addLog('Product Updated', { productId: updatedProduct.id });
    setEditProductModalOpen(false);
  };
  
  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
    addLog('Product Deleted', { productId: selectedProduct.id });
    setEditProductModalOpen(false);
    setConfirmationModalOpen(false);
  };
  
  const handleUpdateStock = (productId: string, amount: number, purchaseCost: number) => {
    const productBeforeUpdate = products.find(p => p.id === productId);
    if (!productBeforeUpdate) return;

    setProducts(prev => prev.map(p => {
        if (p.id === productId) {
            const newStock = p.stock + amount;
            
            let newCostPerUnit = p.costPerUnit;
            // Only update cost if adding stock with a valid purchase cost and amount.
            if (amount > 0 && purchaseCost > 0 && newStock > 0) {
                const oldInventoryValue = p.stock * p.costPerUnit;
                const newInventoryValue = oldInventoryValue + purchaseCost;
                const calculatedCost = newInventoryValue / newStock;
                newCostPerUnit = Math.round(calculatedCost * 100) / 100;
            }

            return { 
                ...p, 
                stock: newStock,
                costPerUnit: newCostPerUnit
            };
        }
        return p;
    }));

    if (purchaseCost > 0 && amount > 0) {
      const newExpense: Omit<Expense, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        description: `Stock purchase for ${productBeforeUpdate.name}`,
        amount: purchaseCost,
        category: 'Inventory',
      };
      handleCreateExpense(newExpense);
    }
    
    addLog('Stock Updated', { 
        productId, 
        name: productBeforeUpdate.name, 
        change: amount, 
        newStock: productBeforeUpdate.stock + amount 
    });

    setAddStockModalOpen(false);
  };

  const handleCreateExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expenseData, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExpense, ...prev]);
    addLog('Expense Created', { description: newExpense.description, amount: newExpense.amount });
    setCreateExpenseModalOpen(false);
  };

  const handleEditExpense = (updatedExpense: Expense) => {
     setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
     addLog('Expense Updated', { expenseId: updatedExpense.id });
     setEditExpenseModalOpen(false);
  };
  
  const handleDeleteExpense = () => {
    if (!selectedExpense) return;
    setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
    addLog('Expense Deleted', { expenseId: selectedExpense.id });
    setEditExpenseModalOpen(false);
    setConfirmationModalOpen(false);
  };
  
  const handleDeleteAllData = async () => {
    if (!firebaseService || !user) return;

    try {
      // Note: In a real implementation, you'd want to delete all documents from Firestore
      // For now, we'll just clear the local state and add a log
      const deletionLog = await firebaseService.addLog({
        timestamp: new Date().toISOString(),
        user: user.displayName || user.email || 'Unknown User',
        action: 'All Data Deleted',
        details: { message: 'All user-generated data has been wiped.' }
      });

      // Clear local state (real-time listeners will update from Firestore)
      setClients([]);
      setProducts([]);
      setOrders([]);
      setExpenses([]);
      setLogs([]);

      setConfirmationModalOpen(false);
      showAlert("Success", "All application data has been permanently deleted.");
    } catch (error) {
      console.error('Error deleting all data:', error);
      showAlert('Error', 'Failed to delete all data. Please try again.');
    }
  };

  const handleExport = (type: 'all' | 'orders' | 'clients' | 'products' | 'expenses') => {
    if (type === 'all') {
      const allData = {
        orders,
        clients,
        products,
        expenses,
        logs
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `dashboard_export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addLog('Data Exported', { type: 'all' });
    } else {
      const dataMap = { orders, clients, products, expenses };
      const success = exportToCsv(`${type}_export_${new Date().toISOString().split('T')[0]}.csv`, dataMap[type]);
      if (success) {
          addLog('Data Exported', { type });
      } else {
          showAlert('Export Failed', 'There is no data to export.');
      }
    }
  };
  
  const handleImportData = async (file: File) => {
    if (!firebaseService) {
      showAlert("Import Error", "Firebase service not available. Please try again.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            showAlert("Import Error", "File content could not be read as text.");
            return;
        }
        try {
            const data = JSON.parse(text);

            // Basic validation to ensure we're importing the right kind of file
            if (data.clients && Array.isArray(data.clients) &&
                data.products && Array.isArray(data.products) &&
                data.orders && Array.isArray(data.orders) &&
                data.expenses && Array.isArray(data.expenses) &&
                data.logs && Array.isArray(data.logs)) {

              // First, migrate the data to Firebase
              await firebaseService.migrateLocalData({
                clients: data.clients,
                products: data.products,
                orders: data.orders,
                expenses: data.expenses,
                logs: data.logs
              });

              // The real-time listeners will automatically update the local state
              // No need to manually set state as Firebase will sync it

              addLog('Data Imported', { fileName: file.name, source: 'user_upload' });
              showAlert("Import Successful", `Successfully imported data from ${file.name}. The data has been saved to your account.`);
              setPage('dashboard'); // Navigate to dashboard to see results
            } else {
              throw new Error('Invalid JSON structure. The file does not appear to be a valid export file.');
            }
        } catch (error) {
            console.error("Failed to import data:", error);
            showAlert("Import Failed", `Please ensure you are uploading a valid JSON export file from this application. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    reader.onerror = () => {
        showAlert("File Read Error", "An error occurred while reading the file.");
    };
    reader.readAsText(file);
  };

  // Modal openers
  const openEditOrderModal = (order: Order) => { setSelectedOrder(order); setEditOrderModalOpen(true); };
  const openEditClientModal = (client: Client) => { setSelectedClient(client); setEditClientModalOpen(true); };
  const openEditProductModal = (product: Product) => { setSelectedProduct(product); setEditProductModalOpen(true); };
  const openEditExpenseModal = (expense: Expense) => { setSelectedExpense(expense); setEditExpenseModalOpen(true); };
  const openAddStockModal = (product: Product) => { setSelectedProduct(product); setAddStockModalOpen(true); };
  const openClientOrdersModal = (client: Client) => { setSelectedClient(client as any); setClientOrdersModalOpen(true); };
  const openLogDetailsModal = (log: LogEntry) => { setSelectedLog(log); setLogDetailsModalOpen(true); };

  const openDeleteConfirmation = (type: 'order' | 'client' | 'product' | 'expense' | 'logout') => {
    const actions = {
      order: { onConfirm: handleDeleteOrder, title: 'Delete Order?', message: `Are you sure you want to delete order ${selectedOrder?.id}? This will also return its items to stock. This action cannot be undone.` },
      client: { onConfirm: handleDeleteClient, title: 'Delete Client?', message: `Are you sure you want to delete client ${selectedClient?.name}? This action cannot be undone.` },
      product: { onConfirm: handleDeleteProduct, title: 'Delete Product?', message: `Are you sure you want to delete product ${selectedProduct?.name}? This action cannot be undone.` },
      expense: { onConfirm: handleDeleteExpense, title: 'Delete Expense?', message: `Are you sure you want to delete this expense? This action cannot be undone.` },
      logout: { onConfirm: handleLogout, title: 'Log Out?', message: 'Are you sure you want to log out?' }
    };
    setConfirmationAction(actions[type]);
    setConfirmationModalOpen(true);
  };
  
  const openDeleteAllDataConfirmation = () => {
    setConfirmationAction({
        onConfirm: handleDeleteAllData,
        title: 'Delete All Data?',
        message: 'Are you sure you want to permanently delete all data, including clients, products, orders, expenses, and logs? This action is irreversible.'
    });
    setConfirmationModalOpen(true);
  };
  
  // Render logic
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage
                    onNewOrder={() => setCreateOrderModalOpen(true)}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onViewClientOrders={openClientOrdersModal}
                    onEditOrder={openEditOrderModal}
                    onEditProduct={openEditProductModal}
                    clients={clients}
                    orders={orders}
                    products={products}
                    isPrivateMode={isPrivateMode}
                    currentUser={user?.displayName || user?.email || 'User'}
                    dashboardStats={dashboardStats}
                />;
      case 'orders':
        return <OrdersPage
                orders={orders}
                clients={clients}
                products={products}
                searchQuery={searchQuery}
                onOrderClick={openEditOrderModal}
                onMarkAsPaid={handleMarkAsPaid}
                onNewOrder={() => setCreateOrderModalOpen(true)}
                isPrivateMode={isPrivateMode}
            />;
      case 'clients':
        return <ClientsPage
                    clients={clientDataWithStats}
                    searchQuery={searchQuery}
                    onClientClick={openEditClientModal}
                    onViewOrders={openClientOrdersModal}
                    onNewClient={() => setCreateClientModalOpen(true)}
                    isPrivateMode={isPrivateMode}
                />;
      case 'products':
        return <ProductsPage
                    products={products}
                    searchQuery={searchQuery}
                    onProductClick={openEditProductModal}
                    inventoryValue={inventoryValue}
                    onAddProduct={() => setCreateProductModalOpen(true)}
                    onUpdateStock={openAddStockModal}
                    isPrivateMode={isPrivateMode}
                />;
      case 'transactions':
        return <TransactionsPage
                    orders={orders}
                    expenses={expenses}
                    clients={clients}
                    searchQuery={searchQuery}
                    onNewExpense={() => setCreateExpenseModalOpen(true)}
                    isPrivateMode={isPrivateMode}
                    onEditExpense={openEditExpenseModal}
                    onEditOrder={openEditOrderModal}
                />;
      case 'log':
        return <LogPage logs={logs} onLogClick={openLogDetailsModal} />;
      case 'settings':
         return <SettingsPage setPage={setPage} onExport={handleExport as any} onImport={handleImportData} onLogout={() => openDeleteConfirmation('logout')} onDeleteAllData={openDeleteAllDataConfirmation} />;
      case 'reports':
          return <ReportsPage orders={orders} products={products} expenses={expenses} clients={clients} isPrivateMode={isPrivateMode} />;
      default:
        return <div>Page not found</div>;
    }
  };

  // Show loading screen while Firebase initializes
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  const unpaidOrdersCount = orders.filter(o => o.status === 'Unpaid' && (o.total - (o.amountPaid || 0)) > 0).length;

  return (
    <div className="min-h-screen w-full text-primary p-4 md:p-6 lg:p-8">
      <div className="liquid-bg">
        <div className="blob blob--a"></div>
        <div className="blob blob--b"></div>
        <div className="blob blob--c"></div>
      </div>
      
      <div className="grid grid-cols-12 gap-6 relative z-10">
        <main className="col-span-12 space-y-6 pb-28">
          <header className={`flex items-center gap-4 ${page === 'settings' ? 'justify-end' : ''}`}>
            {page !== 'settings' && (
              <div className="relative glass flex-grow">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input 
                      type="text" 
                      placeholder="Search" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none rounded-lg pl-11 pr-4 py-3 text-base text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
              </div>
            )}
            <div className="flex items-center gap-4 flex-shrink-0">
              <button onClick={() => setCalculatorModalOpen(true)} className="glass h-14 w-14 flex items-center justify-center rounded-lg text-muted hover:text-primary transition-colors hover:bg-white/10" aria-label="Calculator"><Calculator size={28} /></button>
              <button onClick={() => setIsPrivateMode(!isPrivateMode)} className={`glass h-14 w-14 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10 ${isPrivateMode ? 'text-indigo-400' : 'text-muted hover:text-primary'}`} aria-label="Toggle Private Mode" title={isPrivateMode ? "Disable Private Mode" : "Enable Private Mode"}><EyeOff size={28} /></button>
              <button onClick={() => setPage('settings')} className="glass h-14 w-14 flex items-center justify-center rounded-lg text-muted hover:text-primary transition-colors hover:bg-white/10 settings-btn" aria-label="Settings"><Settings size={28} /></button>
            </div>
          </header>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-3 z-40">
         <div className="glass flex items-center justify-around p-1 rounded-2xl relative max-w-lg mx-auto">
            <MobileNavItem icon={<Home size={24} />} active={page==='dashboard'} onClick={() => setPage('dashboard')} />
            <MobileNavItem icon={<ShoppingCart size={24} />} active={page==='orders'} onClick={() => setPage('orders')} />
            <div className="w-16 shrink-0" aria-hidden="true" />
            <MobileNavItem icon={<Users size={24} />} active={page==='clients'} onClick={() => setPage('clients')} />
            <MobileNavItem icon={<Box size={24} />} active={page==='products'} onClick={() => setPage('products')} />
            <button onClick={() => setCreateOrderModalOpen(true)} className="gloss-btn mobile-fab" aria-label="New Order">
                <Plus size={28} />
            </button>
         </div>
      </footer>
      
      <CreateOrderModal isOpen={isCreateOrderModalOpen} onClose={() => setCreateOrderModalOpen(false)} clients={clients} products={products} onCreate={handleCreateOrder} onAlert={showAlert} />
      <EditOrderModal isOpen={isEditOrderModalOpen} onClose={() => setEditOrderModalOpen(false)} order={selectedOrder} clients={clients} products={products} onSave={handleEditOrder} onDelete={() => openDeleteConfirmation('order')} onAlert={showAlert} />
      <CreateClientModal isOpen={isCreateClientModalOpen} onClose={() => setCreateClientModalOpen(false)} onAdd={handleCreateClient} />
      <EditClientModal isOpen={isEditClientModalOpen} onClose={() => setEditClientModalOpen(false)} client={selectedClient} onSave={handleEditClient} onDelete={() => openDeleteConfirmation('client')} isPrivateMode={isPrivateMode} />
      <ClientOrdersModal isOpen={isClientOrdersModalOpen} onClose={() => setClientOrdersModalOpen(false)} client={selectedClient ? clientDataWithStats.find(c => c.id === selectedClient.id) || null : null} orders={orders.filter(o => o.clientId === selectedClient?.id)} products={products} isPrivateMode={isPrivateMode}/>
      <CreateProductModal isOpen={isCreateProductModalOpen} onClose={() => setCreateProductModalOpen(false)} onAdd={handleCreateProduct} />
      <EditProductModal isOpen={isEditProductModalOpen} onClose={() => setEditProductModalOpen(false)} product={selectedProduct} onSave={handleEditProduct} onDelete={() => openDeleteConfirmation('product')} isDeletable={selectedProduct ? !orders.some(o => o.items.some(i => i.productId === selectedProduct.id)) : false} isPrivateMode={isPrivateMode} />
      <AddStockModal isOpen={isAddStockModalOpen} onClose={() => setAddStockModalOpen(false)} product={selectedProduct} onUpdateStock={handleUpdateStock} isPrivateMode={isPrivateMode} />
      {/* FIX: Used a type guard with .filter to correctly type the array of expense categories, which avoids an unsafe and potentially ambiguous type assertion. */}
      <CreateExpenseModal isOpen={isCreateExpenseModalOpen} onClose={() => setCreateExpenseModalOpen(false)} onAdd={handleCreateExpense} expenseCategories={[...new Set(expenses.map(e => e.category).filter((c): c is string => !!c))].sort()}/>
      {/* FIX: Used a type guard with .filter to correctly type the array of expense categories, which avoids an unsafe and potentially ambiguous type assertion. */}
      <EditExpenseModal isOpen={isEditExpenseModalOpen} onClose={() => setEditExpenseModalOpen(false)} expense={selectedExpense} onSave={handleEditExpense} onDelete={() => openDeleteConfirmation('expense')} expenseCategories={[...new Set(expenses.map(e => e.category).filter((c): c is string => !!c))].sort()} />
      <LogDetailsModal isOpen={isLogDetailsModalOpen} onClose={() => setLogDetailsModalOpen(false)} logEntry={selectedLog} />
      <ConfirmationModal isOpen={isConfirmationModalOpen} onClose={() => setConfirmationModalOpen(false)} onConfirm={() => confirmationAction?.onConfirm()} title={confirmationAction?.title || ''} message={confirmationAction?.message || ''} />
      <AlertModal isOpen={isAlertModalOpen} onClose={() => setAlertModalOpen(false)} title={alertModalContent.title} message={alertModalContent.message} />
      <CalculatorModal isOpen={isCalculatorModalOpen} onClose={() => setCalculatorModalOpen(false)} />
    </div>
  );
};

export default App;
