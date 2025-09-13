import React, { useState, useEffect, useMemo, type ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertTriangle, Info, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Client, Product, Order, OrderItem, Expense, LogEntry, ProductTier, PaymentMethods, OrderAdjustment } from '../types';

// Helper types
export type MetricChartData = {
  title: string;
  data: { label: string; value: number }[];
};

type RevenuePeriod = {
    revenue: number;
    orders: Order[];
};

export type RevenueBreakdownData = {
    type: 'revenue_breakdown';
    title: string;
    data: {
        today: RevenuePeriod;
        week: RevenuePeriod;
        month: RevenuePeriod;
    };
};

export type MetricModalData = MetricChartData | RevenueBreakdownData | null;


// --- Reusable Modal & Form Components ---

const ModalWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-7xl',
  };

  const [isMouseDownOnBackdrop, setIsMouseDownOnBackdrop] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsMouseDownOnBackdrop(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDownOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
    setIsMouseDownOnBackdrop(false);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`glass-wrap w-full ${sizeClasses[size]}`}
          >
            <div className="glass max-h-[90vh] flex flex-col">
              <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <h2 className="text-lg font-bold text-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-muted hover:text-primary hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </header>
              <div className="p-6 overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FormRow = ({ children, className }: { children: ReactNode, className?: string }) => <div className={`flex flex-col gap-2 ${className || ''}`}>{children}</div>;
const Label = ({ children, htmlFor }: { children: ReactNode, htmlFor?: string }) => <label htmlFor={htmlFor} className="text-sm font-medium text-muted cursor-pointer">{children}</label>;

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { startAdornment?: ReactNode; endAdornment?: ReactNode }
>(({ startAdornment, endAdornment, className, ...props }, ref) => {
  const hasStartAdornment = Boolean(startAdornment);
  const hasEndAdornment = Boolean(endAdornment);
  
  return (
    <div className={`relative flex items-center w-full ${className || ''}`}>
      {hasStartAdornment && <span className="absolute left-3 text-muted pointer-events-none z-10">{startAdornment}</span>}
      <input
        ref={ref}
        {...props}
        className={`w-full bg-white/5 border border-white/10 rounded-lg py-3 text-base text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${hasStartAdornment ? 'pl-7' : 'pl-4'} ${hasEndAdornment ? 'pr-8' : 'pr-4'}`}
      />
      {hasEndAdornment && <span className="absolute right-3 text-muted pointer-events-none z-10">{endAdornment}</span>}
    </div>
  );
});

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
    <select ref={ref} {...props} className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${className || ''}`} />
));
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
    <textarea ref={ref} {...props} className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${className || ''}`} />
));
const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input ref={ref} type="checkbox" {...props} className="w-5 h-5 rounded-md bg-white/10 border-white/20 text-indigo-500 focus:ring-indigo-500/50" />
));
const FormActions = ({ children }: { children: ReactNode }) => <div className="flex justify-end items-center gap-4 mt-8 pt-6 border-t border-white/10">{children}</div>;
const CancelButton = ({ onClick }: { onClick: () => void }) => <button type="button" onClick={onClick} className="px-4 py-2 text-sm font-medium text-muted hover:text-primary">Cancel</button>;
const DeleteButton = ({ onClick }: { onClick: () => void }) => <button type="button" onClick={onClick} className="gloss-btn !bg-purple-600/80 hover:!bg-purple-600 !border-purple-600/20 hover:!shadow-purple-600/25"><Trash2 size={16} /> Delete</button>;


// --- App Modals ---

interface OrderFormState {
  clientId: string;
  items: OrderItem[];
  notes: string;
  date: string;
  amountPaid: string;
  paymentMethods: PaymentMethods;
  fees: { amount: string; description: string };
  discount: { amount: string; description: string };
}


const OrderForm: React.FC<{
  value: OrderFormState;
  clients: Client[];
  products: Product[];
  onChange: (newState: OrderFormState) => void;
  onAlert: (title: string, message: string) => void;
  showDateField?: boolean;
  isCreateForm?: boolean;
}> = ({ value, clients, products, onChange, onAlert, showDateField = true, isCreateForm = false }) => {
  const [showDiscount, setShowDiscount] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showProfitDetails, setShowProfitDetails] = useState(false);

  useEffect(() => {
    setShowDiscount(Number(value.discount.amount) > 0 || !!value.discount.description);
    setShowFees(Number(value.fees.amount) > 0 || !!value.fees.description);
    setShowNotes(!!value.notes && value.notes.length > 0);
  }, [value]);
  
  const handleToggleDiscount = () => {
    const isShowing = !showDiscount;
    setShowDiscount(isShowing);
    if (!isShowing) {
      onChange({ ...value, discount: { amount: '', description: '' } });
    }
  };

  const handleToggleFees = () => {
    const isShowing = !showFees;
    setShowFees(isShowing);
    if (!isShowing) {
      onChange({ ...value, fees: { amount: '', description: '' } });
    }
  };

  const handleToggleNotes = () => {
    const isShowing = !showNotes;
    setShowNotes(isShowing);
    if (!isShowing) {
      onChange({ ...value, notes: '' });
    }
  };

  const [newItem, setNewItem] = useState<{ productId: string; selectedTierLabel: string; quantity: string; price: string }>({ productId: '', selectedTierLabel: '', quantity: '', price: '' });
  const [basePricePerUnit, setBasePricePerUnit] = useState<number | null>(null);
  
  const selectedProductForNewItem = useMemo(() => products.find(p => p.id === newItem.productId), [products, newItem.productId]);

  // Highlighting logic
  const isClientStep = !value.clientId;
  const isProductStep = !!value.clientId && !newItem.productId;
  const isAddItemStep = !!value.clientId && !!newItem.productId && value.items.length === 0;

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId);
    setBasePricePerUnit(null); // Reset

    if (!product) {
        setNewItem({ productId: '', selectedTierLabel: '', quantity: '', price: '' });
        return;
    }

    // Calculate base price from the smallest tier
    if (product.tiers && product.tiers.length > 0) {
        const sortedTiers = [...product.tiers].filter(t => t.quantity > 0).sort((a, b) => a.quantity - b.quantity);
        const smallestTier = sortedTiers[0];
        if (smallestTier) {
            setBasePricePerUnit(smallestTier.price / smallestTier.quantity);
        }
    }

    const firstTier = product.tiers?.[0];
    
    if (firstTier) {
        setNewItem({
            productId,
            selectedTierLabel: firstTier.sizeLabel,
            quantity: String(firstTier.quantity),
            price: String(firstTier.price),
        });
    } else { // No tiers, apply sensible defaults
        setNewItem({
            productId,
            selectedTierLabel: '',
            quantity: '1',
            price: '',
        });
    }
  };

  const handleTierClick = (tier: ProductTier) => {
    if (selectedProductForNewItem) {
        setNewItem(prev => ({
            ...prev,
            selectedTierLabel: tier.sizeLabel,
            quantity: String(tier.quantity),
            price: String(tier.price),
        }));
    }
  };

  const handleNewItemManualChange = (field: 'quantity' | 'price', fieldValue: string) => {
    if (fieldValue !== '' && parseFloat(fieldValue) < 0) {
        return; // Prevent negative numbers from being processed
    }

    if (field === 'quantity' && basePricePerUnit !== null) {
      const quantity = parseFloat(fieldValue);
      const price = !isNaN(quantity) ? quantity * basePricePerUnit : NaN;
      setNewItem(prev => ({
        ...prev,
        quantity: fieldValue,
        // FIX: Pass the 'price' variable to Math.round to fix a TypeError where it was called without an argument.
        price: !isNaN(price) ? String(Math.round(price)) : '',
        selectedTierLabel: 'custom',
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        [field]: fieldValue,
        selectedTierLabel: 'custom',
      }));
    }
  };

  const itemsTotal = useMemo(() => value.items.reduce((sum, item) => sum + item.price, 0), [value.items]);
  const finalTotal = useMemo(() => itemsTotal + (Number(value.fees.amount) || 0) - (Number(value.discount.amount) || 0), [itemsTotal, value.fees.amount, value.discount.amount]);
  
  const prevFinalTotalRef = useRef<number>();
  useEffect(() => {
    prevFinalTotalRef.current = finalTotal;
  });
  const prevFinalTotal = prevFinalTotalRef.current;

  useEffect(() => {
    if (isCreateForm) {
      const currentAmountPaid = Number(value.amountPaid) || 0;
      if (prevFinalTotal === undefined || Math.round(currentAmountPaid) === Math.round(prevFinalTotal)) {
        const newAmount = String(Math.round(finalTotal));
        if (value.amountPaid !== newAmount) {
          onChange({ ...value, amountPaid: newAmount });
        }
      }
    }
  }, [finalTotal, isCreateForm, prevFinalTotal, value, onChange]);

  const itemsCost = useMemo(() => {
    return value.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            return sum + (item.quantity * product.costPerUnit);
        }
        return sum;
    }, 0);
  }, [value.items, products]);

  const profit = useMemo(() => finalTotal - itemsCost, [finalTotal, itemsCost]);
  const margin = useMemo(() => (finalTotal > 0 ? (profit / finalTotal) * 100 : 0), [profit, finalTotal]);
  
  const handleAddItem = () => {
    if (!newItem.productId || !newItem.quantity || !newItem.price) {
        onAlert('Invalid Item', 'Please select a product, and enter quantity and price.');
        return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) return;
    
    const quantity = parseFloat(newItem.quantity);
    if (quantity > product.stock) {
        onAlert('Insufficient Stock', `Cannot add item. Only ${product.stock}${product.type} of ${product.name} in stock.`);
        return;
    }
    
    const tier = product.tiers.find(t => t.sizeLabel === newItem.selectedTierLabel);

    const newItems = [...value.items, {
      productId: newItem.productId,
      quantity: quantity,
      price: parseFloat(newItem.price),
      sizeLabel: tier ? tier.sizeLabel : 'Custom'
    }];
    
    onChange({
      ...value,
      items: newItems,
    });
    setNewItem({ productId: '', selectedTierLabel: '', quantity: '', price: '' });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = value.items.filter((_, i) => i !== index);
    onChange({ ...value, items: newItems });
  };

  const handlePaymentMethodChange = (method: keyof PaymentMethods) => {
    onChange({ ...value, paymentMethods: { ...value.paymentMethods, [method]: !value.paymentMethods[method] } });
  };

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 ${showDateField ? 'md:grid-cols-2' : ''} gap-6`}>
        <FormRow>
          <Label htmlFor="client">Client</Label>
          <Select id="client" value={value.clientId} onChange={e => onChange({...value, clientId: e.target.value})} className={isClientStep ? 'highlight-step' : ''}>
            <option value="" disabled>Select a client</option>
            {clients.filter(c => !c.inactive).map(c => <option key={c.id} value={c.id}>{c.name} (#{c.displayId})</option>)}
          </Select>
        </FormRow>
        {showDateField && (
            <FormRow>
            <Label htmlFor="date">Order Date</Label>
            <Input id="date" type="date" value={value.date} onChange={e => onChange({...value, date: e.target.value})} />
            </FormRow>
        )}
      </div>

      <div className="space-y-4 rounded-lg bg-white/5 p-4">
        <h3 className="font-semibold text-primary mb-2">Order Items</h3>
        <div className="space-y-2">
            {value.items.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                return (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-white/5">
                        <div className="text-sm">
                            <span className="font-semibold text-primary">{product?.name || 'Unknown Product'}</span>
                            <span className="text-muted ml-1">({item.sizeLabel || `${product?.type === 'g' ? item.quantity.toFixed(2) : Math.round(item.quantity)}${product?.type}`})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary">${Math.round(item.price).toLocaleString()}</span>
                            <button onClick={() => handleRemoveItem(index)} className="p-1.5 rounded-full text-muted hover:text-purple-400 hover:bg-purple-500/10"><Trash2 size={14}/></button>
                        </div>
                    </div>
                );
            })}
        </div>
        
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                  <Select
                      value={newItem.productId}
                      onChange={handleProductChange}
                      className={isProductStep ? 'highlight-step' : ''}
                  >
                      <option value="" disabled>Select Product</option>
                      {products.filter(p => p.stock > 0 && !p.inactive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                  {selectedProductForNewItem && (
                      <p className="text-xs text-muted mt-1 pl-1">
                          {selectedProductForNewItem.type === 'g' ? selectedProductForNewItem.stock.toFixed(2) : Math.round(selectedProductForNewItem.stock)}{selectedProductForNewItem.type !== 'unit' ? ` ${selectedProductForNewItem.type}` : ''} Left
                      </p>
                  )}
              </div>
          </div>

          {selectedProductForNewItem && selectedProductForNewItem.tiers && selectedProductForNewItem.tiers.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                  {selectedProductForNewItem.tiers.map(tier => (
                      <button
                          type="button"
                          key={tier.sizeLabel}
                          onClick={() => handleTierClick(tier)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                              newItem.selectedTierLabel === tier.sizeLabel
                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                          }`}
                      >
                          {tier.sizeLabel}
                      </button>
                  ))}
              </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start pt-2">
              <Input 
                  className="md:col-span-5" 
                  type="text"
                  inputMode="decimal"
                  min="0"
                  step={selectedProductForNewItem?.increment || 1}
                  placeholder="Custom Qty" 
                  value={newItem.quantity} 
                  onChange={e => handleNewItemManualChange('quantity', e.target.value)} 
                  endAdornment={selectedProductForNewItem?.type}
              />
              <Input 
                  className="md:col-span-5" 
                  type="text"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  placeholder="Custom Price" 
                  value={newItem.price} 
                  onChange={e => handleNewItemManualChange('price', e.target.value)} 
                  startAdornment="$" 
              />
              <button type="button" onClick={handleAddItem} className={`md:col-span-2 h-full py-3 px-4 text-base font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center justify-center ${isAddItemStep ? 'highlight-step' : ''}`} aria-label="Add Item">
                  <Plus size={18} />
              </button>
          </div>
        </div>
      </div>
      
       <FormRow>
        <Label htmlFor="payment">Payment</Label>
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex-grow min-w-[50%]">
                 <Input 
                    id="payment" 
                    type="text"
                    inputMode="decimal"
                    step="1" 
                    placeholder="0" 
                    value={value.amountPaid} 
                    onChange={e => onChange({...value, amountPaid: e.target.value})} 
                    startAdornment="$"
                />
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="payment-cash" checked={value.paymentMethods.cash} onChange={() => handlePaymentMethodChange('cash')} />
                <Label htmlFor="payment-cash">Cash</Label>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="payment-etransfer" checked={value.paymentMethods.etransfer} onChange={() => handlePaymentMethodChange('etransfer')} />
                <Label htmlFor="payment-etransfer">E-Transfer</Label>
            </div>
        </div>
      </FormRow>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
        <div className="flex items-center gap-2">
            <Checkbox id="toggle-discount" checked={showDiscount} onChange={handleToggleDiscount} />
            <Label htmlFor="toggle-discount">Discount</Label>
        </div>
        <div className="flex items-center gap-2">
            <Checkbox id="toggle-fees" checked={showFees} onChange={handleToggleFees} />
            <Label htmlFor="toggle-fees">Fees</Label>
        </div>
        <div className="flex items-center gap-2">
            <Checkbox id="toggle-notes" checked={showNotes} onChange={handleToggleNotes} />
            <Label htmlFor="toggle-notes">Notes</Label>
        </div>
      </div>
      
      <AnimatePresence>
        {showDiscount && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <FormRow className="!mt-0 pt-4">
                    <Label>Discount</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="text" inputMode="decimal" step="1" placeholder="Amount" className="col-span-1" value={value.discount.amount} onChange={e => onChange({...value, discount: { ...value.discount, amount: e.target.value }})} startAdornment="$" />
                      <Input type="text" placeholder="Description (e.g., promo)" className="col-span-2" value={value.discount.description} onChange={e => onChange({...value, discount: {...value.discount, description: e.target.value}})} />
                    </div>
                </FormRow>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {showFees && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <FormRow className="!mt-0 pt-4">
                    <Label>Fees</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="text" inputMode="decimal" step="1" placeholder="Amount" className="col-span-1" value={value.fees.amount} onChange={e => onChange({...value, fees: { ...value.fees, amount: e.target.value }})} startAdornment="$" />
                      <Input type="text" placeholder="Description (e.g., delivery)" className="col-span-2" value={value.fees.description} onChange={e => onChange({...value, fees: {...value.fees, description: e.target.value}})} />
                    </div>
                </FormRow>
            </motion.div>
        )}
      </AnimatePresence>
       
      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <FormRow className="!mt-0 pt-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={3} placeholder="Any special instructions or details about the order..." value={value.notes} onChange={e => onChange({...value, notes: e.target.value})}></Textarea>
            </FormRow>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
          type="button"
          onClick={() => setShowProfitDetails(!showProfitDetails)}
          className="w-full text-left bg-white/5 p-4 rounded-lg space-y-2 text-sm hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
          <div className="flex justify-between items-center text-muted"><span>Subtotal</span><span>${Math.round(itemsTotal).toLocaleString()}</span></div>
          {Number(value.discount.amount) > 0 && <div className="flex justify-between items-center text-muted"><span>Discount ({value.discount.description || '...'})</span><span className="text-orange-400">-${Math.round(Number(value.discount.amount)).toLocaleString()}</span></div>}
          {Number(value.fees.amount) > 0 && <div className="flex justify-between items-center text-muted"><span>Fees ({value.fees.description || '...'})</span><span>+${Math.round(Number(value.fees.amount)).toLocaleString()}</span></div>}
          
          <div className="flex justify-between items-center font-bold text-lg text-primary pt-2 border-t border-white/10"><span>Total</span><span>${Math.round(finalTotal).toLocaleString()}</span></div>
          
          <AnimatePresence>
            {showProfitDetails && itemsCost > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 mt-2 border-t border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-muted">
                    <span>Cost</span>
                    <span>-${Math.round(itemsCost).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-cyan-400 font-medium">
                    <span>Profit</span>
                    <span>${Math.round(profit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-cyan-400 font-medium">
                    <span>Margin</span>
                    <span>{margin.toFixed(1)}%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2 border-t border-white/10 space-y-1">
              {(parseFloat(value.amountPaid) || 0) > 0 && <div className="flex justify-between items-center font-medium text-cyan-400"><span>Paid</span><span>-${Math.round(parseFloat(value.amountPaid) || 0).toLocaleString()}</span></div>}
              <div className={`flex justify-between items-center font-bold ${finalTotal - (parseFloat(value.amountPaid) || 0) > 0 ? 'text-orange-400' : 'text-primary'}`}><span>Balance Due</span><span>${Math.round(finalTotal - (parseFloat(value.amountPaid) || 0)).toLocaleString()}</span></div>
          </div>
      </button>
    </div>
  );
}

export const CreateOrderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  products: Product[];
  onCreate: (order: Omit<Order, 'id' | 'total' | 'status'>) => void;
  onAlert: (title: string, message: string) => void;
}> = ({ isOpen, onClose, clients, products, onCreate, onAlert }) => {
  const getInitialState = (): OrderFormState => ({
    clientId: '',
    items: [],
    notes: '',
    date: new Date().toISOString().split('T')[0],
    amountPaid: '',
    paymentMethods: { cash: false, etransfer: false, other: false },
    fees: { amount: '', description: ''},
    discount: { amount: '', description: ''},
  });

  const [orderState, setOrderState] = useState<OrderFormState>(getInitialState());

  useEffect(() => {
    if (isOpen) {
      setOrderState(getInitialState());
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderState.clientId || orderState.items.length === 0) {
      onAlert("Invalid Order", "Please select a client and add at least one item.");
      return;
    }
    onCreate({
        ...orderState,
        amountPaid: Number(orderState.amountPaid) || 0,
        fees: { amount: Number(orderState.fees.amount) || 0, description: orderState.fees.description },
        discount: { amount: Number(orderState.discount.amount) || 0, description: orderState.discount.description },
    });
  };
  
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Create New Order" size="lg">
      <form onSubmit={handleSubmit}>
        <OrderForm 
          value={orderState}
          clients={clients}
          products={products}
          onChange={setOrderState}
          onAlert={onAlert}
          showDateField={false}
          isCreateForm
        />
        <FormActions>
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Create Order</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

export const EditOrderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  clients: Client[];
  products: Product[];
  onSave: (originalOrder: Order, updatedOrder: Omit<Order, 'id'>) => void;
  onDelete: () => void;
  onAlert: (title: string, message: string) => void;
}> = ({ isOpen, onClose, order, clients, products, onSave, onDelete, onAlert }) => {
  const getInitialState = (initialOrder: Order | null): OrderFormState => {
    if (!initialOrder) {
      return {
        clientId: '', items: [], notes: '', date: new Date().toISOString().split('T')[0],
        amountPaid: '', paymentMethods: { cash: false, etransfer: false, other: false },
        fees: { amount: '', description: ''}, discount: { amount: '', description: ''},
      };
    }
    return {
      clientId: initialOrder.clientId,
      items: initialOrder.items,
      notes: initialOrder.notes || '',
      date: initialOrder.date,
      amountPaid: String(initialOrder.amountPaid || ''),
      paymentMethods: initialOrder.paymentMethods || { cash: false, etransfer: false, other: false },
      fees: { amount: String(initialOrder.fees?.amount || ''), description: initialOrder.fees?.description || '' },
      discount: { amount: String(initialOrder.discount?.amount || ''), description: initialOrder.discount?.description || '' },
    };
  };

  const [orderState, setOrderState] = useState<OrderFormState>(getInitialState(order));

  useEffect(() => {
    if (order) {
      setOrderState(getInitialState(order));
    }
  }, [order]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    
    const itemsTotal = orderState.items.reduce((sum: number, item: OrderItem) => sum + item.price, 0);
    const feesAmount = Number(orderState.fees.amount) || 0;
    const discountAmount = Number(orderState.discount.amount) || 0;
    const total = itemsTotal + feesAmount - discountAmount;
    
    let status: 'Draft' | 'Unpaid' | 'Completed' = order.status;
    const parsedAmountPaid = Number(orderState.amountPaid) || 0;
    if (parsedAmountPaid >= total) {
      status = 'Completed';
    } else {
      status = 'Unpaid';
    }
    
    const updatedOrder = {
      clientId: orderState.clientId,
      items: orderState.items,
      notes: orderState.notes,
      date: orderState.date,
      paymentMethods: orderState.paymentMethods,
      total,
      status,
      amountPaid: parsedAmountPaid,
      fees: { amount: feesAmount, description: orderState.fees.description },
      discount: { amount: discountAmount, description: orderState.discount.description },
    };
    onSave(order, updatedOrder);
  };

  if (!order) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Edit Order ${order.id}`} size="lg">
      <form onSubmit={handleSubmit}>
        <OrderForm 
          value={orderState}
          clients={clients}
          products={products}
          onChange={setOrderState}
          onAlert={onAlert}
        />
        <FormActions>
          <DeleteButton onClick={onDelete} />
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Save Changes</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

export const CreateClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (client: Omit<Client, 'id' | 'orders' | 'totalSpent' | 'displayId'>) => void;
}> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [etransfer, setEtransfer] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, email, phone, address, etransfer, notes });
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setEtransfer('');
    setNotes('');
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Create New Client" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormRow>
          <Label htmlFor="client-name">Name</Label>
          <Input id="client-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
        </FormRow>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormRow>
                <Label htmlFor="client-phone">Phone</Label>
                <Input id="client-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </FormRow>
            <FormRow>
                <Label htmlFor="client-email">Email</Label>
                <Input id="client-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </FormRow>
        </div>
        <FormRow>
            <Label htmlFor="client-etransfer">E-Transfer Details</Label>
            <Input id="client-etransfer" type="text" value={etransfer} onChange={e => setEtransfer(e.target.value)} />
        </FormRow>
        <FormRow>
            <Label htmlFor="client-address">Address</Label>
            <Input id="client-address" type="text" value={address} onChange={e => setAddress(e.target.value)} />
        </FormRow>
        <FormRow>
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea id="client-notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </FormRow>
        <FormActions>
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Add Client</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

export const EditClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (client: Client) => void;
  onDelete: () => void;
  isPrivateMode: boolean;
}> = ({ isOpen, onClose, client, onSave, onDelete, isPrivateMode }) => {
  const [clientData, setClientData] = useState<Partial<Client>>({});
  
  useEffect(() => {
    if (client) {
      setClientData(client);
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClientData({ ...clientData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(client) {
        onSave({ ...client, ...clientData });
    }
  };
  
  if (!client) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={isPrivateMode ? `Edit Client #${client.displayId}` : `Edit ${client.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormRow>
          <Label htmlFor="edit-client-name">Name</Label>
          <Input id="edit-client-name" name="name" type="text" value={clientData.name || ''} onChange={handleChange} required />
        </FormRow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormRow>
                <Label htmlFor="edit-client-phone">Phone</Label>
                <Input id="edit-client-phone" name="phone" type="tel" value={clientData.phone || ''} onChange={handleChange} />
            </FormRow>
            <FormRow>
                <Label htmlFor="edit-client-email">Email</Label>
                <Input id="edit-client-email" name="email" type="email" value={clientData.email || ''} onChange={handleChange} />
            </FormRow>
        </div>
        <FormRow>
            <Label htmlFor="edit-client-etransfer">E-Transfer Details</Label>
            <Input id="edit-client-etransfer" name="etransfer" type="text" value={clientData.etransfer || ''} onChange={handleChange} />
        </FormRow>
        <FormRow>
            <Label htmlFor="edit-client-address">Address</Label>
            <Input id="edit-client-address" name="address" type="text" value={clientData.address || ''} onChange={handleChange} />
        </FormRow>
        <FormRow>
            <Label htmlFor="edit-client-notes">Notes</Label>
            <Textarea id="edit-client-notes" name="notes" rows={3} value={clientData.notes || ''} onChange={handleChange} />
        </FormRow>
        <FormRow>
            <div className="flex items-center gap-2">
                <Checkbox id="edit-client-inactive" name="inactive" checked={clientData.inactive || false} onChange={e => setClientData({...clientData, inactive: e.target.checked })} />
                <Label htmlFor="edit-client-inactive">Mark as Inactive</Label>
            </div>
        </FormRow>
        <FormActions>
          <DeleteButton onClick={onDelete} />
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Save Changes</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

export const ClientOrdersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: (Client & { orders: number; totalSpent: number; balance: number; }) | null;
  orders: Order[];
  products: Product[];
  isPrivateMode: boolean;
}> = ({ isOpen, onClose, client, orders, products, isPrivateMode }) => {
  if (!client) return null;

  return (
     <ModalWrapper isOpen={isOpen} onClose={onClose} title={isPrivateMode ? `Client #${client.displayId} Orders` : `${client.name}'s Orders`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="glass p-3"><p className="text-xs text-muted">Total Orders</p><p className="font-bold text-lg text-primary">{client.orders}</p></div>
            <div className="glass p-3"><p className="text-xs text-muted">Total Spent</p><p className="font-bold text-lg text-primary">${Math.round(client.totalSpent).toLocaleString()}</p></div>
            <div className="glass p-3"><p className="text-xs text-muted">Balance</p><p className={`font-bold text-lg ${client.balance > 0 ? 'text-orange-400' : 'text-primary'}`}>${Math.round(client.balance).toLocaleString()}</p></div>
            <div className="glass p-3"><p className="text-xs text-muted">Avg. Order</p><p className="font-bold text-lg text-primary">${client.orders > 0 ? Math.round(client.totalSpent / client.orders).toLocaleString() : 0}</p></div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 -mr-2">
          {orders.map(order => (
            <div key={order.id} className="glass p-4 text-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-primary">{order.id} - {order.date}</p>
                        <p className={`status-badge text-xs ${order.status === 'Completed' ? 'status-completed' : 'status-unpaid'}`}>{order.status}</p>
                    </div>
                    <p className="font-semibold text-lg text-primary">${Math.round(order.total).toLocaleString()}</p>
                </div>
                <div className="mt-2 text-xs text-muted">
                    {order.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return <div key={item.productId}>{isPrivateMode ? product?.id : product?.name} - {item.sizeLabel ?? `${item.quantity}${product?.type}`} - ${item.price}</div>
                    })}
                </div>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
};

type TierFormState = { sizeLabel: string; quantity: string; price: string; };

export const CreateProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => void;
}> = ({ isOpen, onClose, onAdd }) => {
    const getInitialState = () => ({
        name: '', 
        type: 'g' as 'g' | 'ml' | 'unit', 
        stock: '', 
        costPerUnit: '', 
        increment: '1', 
        tiers: [] as TierFormState[]
    });

  const [productData, setProductData] = useState(getInitialState());

  useEffect(() => {
    if(isOpen) {
        setProductData(getInitialState());
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (index: number, field: keyof TierFormState, value: string) => {
    const newTiers = [...productData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setProductData(prev => ({ ...prev, tiers: newTiers }));
  };

  const addTier = () => {
    setProductData(prev => ({ ...prev, tiers: [...prev.tiers, { sizeLabel: '', quantity: '', price: '' }] }));
  };
  
  const removeTier = (index: number) => {
    setProductData(prev => ({ ...prev, tiers: prev.tiers.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: productData.name,
      type: productData.type,
      stock: parseFloat(productData.stock) || 0,
      increment: parseFloat(productData.increment) || 1,
      costPerUnit: Math.round((parseFloat(productData.costPerUnit) || 0) * 100) / 100,
      tiers: productData.tiers.map(tier => ({
        sizeLabel: tier.sizeLabel,
        quantity: parseFloat(tier.quantity) || 0,
        price: parseFloat(tier.price) || 0
      }))
    });
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Create New Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormRow>
                <Label htmlFor="product-name">Product Name</Label>
                <Input id="product-name" name="name" type="text" value={productData.name} onChange={handleChange} required />
            </FormRow>
             <FormRow>
                <Label htmlFor="product-type">Unit Type</Label>
                <Select id="product-type" name="type" value={productData.type} onChange={handleChange}>
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="unit">Units</option>
                </Select>
            </FormRow>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormRow>
                <Label htmlFor="product-stock">Initial Stock</Label>
                <Input id="product-stock" name="stock" type="text" inputMode="decimal" value={productData.stock} onChange={handleChange} />
            </FormRow>
            <FormRow>
                <Label htmlFor="product-costPerUnit">Cost Per Unit</Label>
                <Input id="product-costPerUnit" name="costPerUnit" type="text" inputMode="decimal" value={productData.costPerUnit} onChange={handleChange} startAdornment="$" />
            </FormRow>
            <FormRow>
                <Label htmlFor="product-increment">Order Increment</Label>
                <Input id="product-increment" name="increment" type="text" inputMode="decimal" value={productData.increment} onChange={handleChange} />
            </FormRow>
        </div>
        <div>
            <h3 className="text-primary font-semibold mb-2">Pricing Tiers</h3>
            <div className="space-y-2">
                {productData.tiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <Input placeholder="Label (e.g., 1g)" value={tier.sizeLabel} onChange={e => handleTierChange(index, 'sizeLabel', e.target.value)} className="col-span-5" />
                        <Input type="text" inputMode="decimal" placeholder="Qty" value={tier.quantity} onChange={e => handleTierChange(index, 'quantity', e.target.value)} className="col-span-3" />
                        <Input type="text" inputMode="decimal" placeholder="Price" value={tier.price} onChange={e => handleTierChange(index, 'price', e.target.value)} className="col-span-3" startAdornment="$" />
                        <button type="button" onClick={() => removeTier(index)} className="col-span-1 text-muted hover:text-purple-400 p-2"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addTier} className="mt-4 text-indigo-400 font-semibold text-sm hover:text-indigo-300 flex items-center gap-1"><Plus size={14} /> Add Tier</button>
        </div>
        <FormActions>
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Add Product</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

interface ProductFormState {
    id: string;
    name: string;
    type: 'g' | 'ml' | 'unit';
    stock: string;
    costPerUnit: string;
    increment: string;
    tiers: { sizeLabel: string; quantity: string; price: string; }[];
    inactive?: boolean;
    lastOrdered?: string;
}

export const EditProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (product: Product) => void;
  onDelete: () => void;
  isDeletable: boolean;
  isPrivateMode: boolean;
}> = ({ isOpen, onClose, product, onSave, onDelete, isDeletable, isPrivateMode }) => {
  const [productData, setProductData] = useState<ProductFormState | null>(null);

  useEffect(() => {
    if (product) {
        setProductData({
            ...product,
            stock: String(product.stock),
            costPerUnit: String(product.costPerUnit),
            increment: String(product.increment),
            tiers: product.tiers.map(t => ({
                sizeLabel: t.sizeLabel,
                quantity: String(t.quantity),
                price: String(t.price)
            }))
        });
    }
  }, [product]);

  if (!productData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductData(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleTierChange = (index: number, field: keyof TierFormState, value: string) => {
    if (!productData) return;
    const newTiers = [...productData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setProductData({ ...productData, tiers: newTiers });
  };

  const addTier = () => {
    if (!productData) return;
    setProductData({ ...productData, tiers: [...productData.tiers, { sizeLabel: '', quantity: '', price: '' }] });
  };
  
  const removeTier = (index: number) => {
     if (!productData) return;
    setProductData({ ...productData, tiers: productData.tiers.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productData) {
      onSave({
        ...productData,
        stock: parseFloat(productData.stock) || 0,
        increment: parseFloat(productData.increment) || 1,
        costPerUnit: Math.round((parseFloat(productData.costPerUnit) || 0) * 100) / 100,
        tiers: productData.tiers.map(t => ({
            sizeLabel: t.sizeLabel,
            quantity: parseFloat(t.quantity) || 0,
            price: parseFloat(t.price) || 0
        }))
      });
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={isPrivateMode ? `Edit Product ${product?.id}` : `Edit ${product?.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormRow>
                <Label htmlFor="edit-product-name">Product Name</Label>
                <Input id="edit-product-name" name="name" type="text" value={productData.name} onChange={handleChange} required />
            </FormRow>
             <FormRow>
                <Label htmlFor="edit-product-type">Unit Type</Label>
                <Select id="edit-product-type" name="type" value={productData.type} onChange={handleChange}>
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="unit">Units</option>
                </Select>
            </FormRow>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormRow>
                <Label htmlFor="edit-product-stock">Current Stock</Label>
                <Input id="edit-product-stock" name="stock" type="text" inputMode="decimal" value={productData.stock} onChange={handleChange} />
            </FormRow>
            <FormRow>
                <Label htmlFor="edit-product-costPerUnit">Cost Per Unit</Label>
                <Input id="edit-product-costPerUnit" name="costPerUnit" type="text" inputMode="decimal" value={productData.costPerUnit} onChange={handleChange} startAdornment="$" />
            </FormRow>
            <FormRow>
                <Label htmlFor="edit-product-increment">Order Increment</Label>
                <Input id="edit-product-increment" name="increment" type="text" inputMode="decimal" value={productData.increment} onChange={handleChange} />
            </FormRow>
        </div>
        <div>
            <h3 className="text-primary font-semibold mb-2">Pricing Tiers</h3>
            <div className="space-y-2">
                {productData.tiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <Input placeholder="Label (e.g., 1g)" value={tier.sizeLabel} onChange={e => handleTierChange(index, 'sizeLabel', e.target.value)} className="col-span-5" />
                        <Input type="text" inputMode="decimal" placeholder="Qty" value={tier.quantity} onChange={e => handleTierChange(index, 'quantity', e.target.value)} className="col-span-3" />
                        <Input type="text" inputMode="decimal" placeholder="Price" value={tier.price} onChange={e => handleTierChange(index, 'price', e.target.value)} className="col-span-3" startAdornment="$" />
                        <button type="button" onClick={() => removeTier(index)} className="col-span-1 text-muted hover:text-purple-400 p-2"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addTier} className="mt-4 text-indigo-400 font-semibold text-sm hover:text-indigo-300 flex items-center gap-1"><Plus size={14} /> Add Tier</button>
        </div>
         <FormRow>
            <div className="flex items-center gap-2">
                <Checkbox id="edit-product-inactive" name="inactive" checked={productData.inactive || false} onChange={e => setProductData({...productData, inactive: e.target.checked })} />
                <Label htmlFor="edit-product-inactive">Mark as Inactive</Label>
            </div>
        </FormRow>
        <FormActions>
          {isDeletable ? <DeleteButton onClick={onDelete} /> : <div title="Cannot delete product with past orders"><DeleteButton onClick={() => {}} /></div>}
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Save Changes</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

export const AddStockModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdateStock: (productId: string, amount: number, purchaseCost: number) => void;
  isPrivateMode: boolean;
}> = ({ isOpen, onClose, product, onUpdateStock, isPrivateMode }) => {
  const [amount, setAmount] = useState<string>('');
  const [purchaseCost, setPurchaseCost] = useState<string>('');
  
  useEffect(() => {
    if (isOpen) {
        setAmount('');
        setPurchaseCost('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      onUpdateStock(product.id, parseFloat(amount) || 0, parseFloat(purchaseCost) || 0);
    }
  };
  
  if (!product) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={isPrivateMode ? `Update Stock for ${product.id}` : `Update Stock for ${product.name}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-muted">Current Stock: {product.stock.toFixed(2)}{product.type}</p>
        <FormRow>
          <Label htmlFor="stock-amount">Amount to Add/Remove</Label>
          <Input id="stock-amount" type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Use negative to remove" required />
        </FormRow>
        <FormRow>
          <Label htmlFor="purchase-cost">Total Purchase Cost (Optional)</Label>
          <Input id="purchase-cost" type="number" step="0.01" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} startAdornment="$" />
           <p className="text-xs text-muted">If adding stock, entering a cost will auto-create an expense and update the product's average cost.</p>
        </FormRow>
        <FormActions>
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Update Stock</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

export const CreateExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  expenseCategories: string[];
}> = ({ isOpen, onClose, onAdd, expenseCategories }) => {
    const getInitialState = () => ({ date: new Date().toISOString().split('T')[0], description: '', amount: '', category: '', notes: '' });
    const [expenseData, setExpenseData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setExpenseData(getInitialState());
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({ ...expenseData, amount: parseFloat(expenseData.amount) || 0 });
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="Add New Expense" size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormRow>
                    <Label htmlFor="expense-description">Description</Label>
                    <Input id="expense-description" type="text" value={expenseData.description} onChange={e => setExpenseData(prev => ({...prev, description: e.target.value}))} required />
                </FormRow>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormRow>
                        <Label htmlFor="expense-amount">Amount</Label>
                        <Input id="expense-amount" type="number" step="0.01" value={expenseData.amount} onChange={e => setExpenseData(prev => ({...prev, amount: e.target.value}))} startAdornment="$" required />
                    </FormRow>
                    <FormRow>
                        <Label htmlFor="expense-date">Date</Label>
                        <Input id="expense-date" type="date" value={expenseData.date} onChange={e => setExpenseData(prev => ({...prev, date: e.target.value}))} required />
                    </FormRow>
                </div>
                 <FormRow>
                    <Label htmlFor="expense-category">Category</Label>
                    <Input id="expense-category" type="text" value={expenseData.category} onChange={e => setExpenseData(prev => ({...prev, category: e.target.value}))} list="expense-categories" />
                    <datalist id="expense-categories">
                        {expenseCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                </FormRow>
                <FormRow>
                    <Label htmlFor="expense-notes">Notes</Label>
                    <Textarea id="expense-notes" rows={3} value={expenseData.notes} onChange={e => setExpenseData(prev => ({...prev, notes: e.target.value}))} />
                </FormRow>
                <FormActions>
                    <CancelButton onClick={onClose} />
                    <button type="submit" className="gloss-btn">Add Expense</button>
                </FormActions>
            </form>
        </ModalWrapper>
    );
};

export const EditExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSave: (expense: Expense) => void;
  onDelete: () => void;
  expenseCategories: string[];
}> = ({ isOpen, onClose, expense, onSave, onDelete, expenseCategories }) => {
  const [expenseData, setExpenseData] = useState<Partial<Expense>>({});

  useEffect(() => {
    if (expense) {
      setExpenseData(expense);
    }
  }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(expense) {
        const dataToSave = {
            ...expense, 
            ...expenseData,
            amount: parseFloat(String(expenseData.amount)) || 0
        };
        onSave(dataToSave);
    }
  };
  
  if (!expense) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Expense" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormRow>
            <Label htmlFor="edit-expense-description">Description</Label>
            <Input id="edit-expense-description" name="description" type="text" value={expenseData.description || ''} onChange={handleChange} required />
        </FormRow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormRow>
                <Label htmlFor="edit-expense-amount">Amount</Label>
                <Input id="edit-expense-amount" name="amount" type="number" step="0.01" value={expenseData.amount || ''} onChange={handleChange} startAdornment="$" required />
            </FormRow>
            <FormRow>
                <Label htmlFor="edit-expense-date">Date</Label>
                <Input id="edit-expense-date" name="date" type="date" value={expenseData.date || ''} onChange={handleChange} required />
            </FormRow>
        </div>
        <FormRow>
            <Label htmlFor="edit-expense-category">Category</Label>
            <Input id="edit-expense-category" name="category" type="text" value={expenseData.category || ''} onChange={handleChange} list="edit-expense-categories" />
            <datalist id="edit-expense-categories">
                {expenseCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
        </FormRow>
        <FormRow>
            <Label htmlFor="edit-expense-notes">Notes</Label>
            <Textarea id="edit-expense-notes" name="notes" rows={3} value={expenseData.notes || ''} onChange={handleChange} />
        </FormRow>
        <FormActions>
          <DeleteButton onClick={onDelete} />
          <CancelButton onClick={onClose} />
          <button type="submit" className="gloss-btn">Save Changes</button>
        </FormActions>
      </form>
    </ModalWrapper>
  );
};

export const LogDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  logEntry: LogEntry | null;
}> = ({ isOpen, onClose, logEntry }) => {
  if (!logEntry) return null;
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Log Details" size="md">
      <div className="space-y-4 text-sm">
        <div><span className="font-semibold text-muted">Timestamp:</span> <span className="text-primary">{new Date(logEntry.timestamp).toLocaleString()}</span></div>
        <div><span className="font-semibold text-muted">User:</span> <span className="text-primary">{logEntry.user}</span></div>
        <div><span className="font-semibold text-muted">Action:</span> <span className="text-primary">{logEntry.action}</span></div>
        <div><span className="font-semibold text-muted">Details:</span></div>
        <pre className="bg-white/5 p-4 rounded-lg text-xs text-primary overflow-x-auto">
          <code>{JSON.stringify(logEntry.details, null, 2)}</code>
        </pre>
      </div>
    </ModalWrapper>
  );
};

export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
          <AlertTriangle className="h-6 w-6 text-purple-400" aria-hidden="true" />
        </div>
        <p className="mt-4 text-primary">{message}</p>
      </div>
      <div className="mt-6 flex justify-center gap-4">
        <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-semibold text-muted hover:text-primary">Cancel</button>
        <button type="button" onClick={onConfirm} className="gloss-btn gloss-btn-danger">Confirm</button>
      </div>
    </ModalWrapper>
  );
};

export const AlertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, title, message }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
          <Info className="h-6 w-6 text-indigo-400" aria-hidden="true" />
        </div>
        <p className="mt-4 text-primary">{message}</p>
      </div>
      <div className="mt-6 flex justify-center">
        <button type="button" onClick={onClose} className="gloss-btn">OK</button>
      </div>
    </ModalWrapper>
  );
};

export const CalculatorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');

  const handlePercent = () => {
    if (input === '' || input === 'Error') return;
    try {
        const parts = input.split(/([+\-*/])/);
        if (parts[parts.length - 1] === '') return; // trailing operator

        const lastNumberStr = parts.pop() || '';
        const lastNumber = parseFloat(lastNumberStr);

        if (isNaN(lastNumber)) return;

        let percentPart;
        if (parts.length > 0) {
            const operator = parts[parts.length-1];
            if (operator === '+' || operator === '-') {
                const baseExpression = parts.slice(0,-1).join('');
                const baseValue = Function('"use strict";return (' + (baseExpression || '0') + ')')();
                percentPart = baseValue * (lastNumber / 100);
            } else {
                percentPart = lastNumber / 100;
            }
        } else {
            percentPart = lastNumber / 100;
        }
        setInput(parts.join('') + String(percentPart));
    } catch (error) {
        setInput('Error');
    }
  };

  const handleButtonClick = (value: string) => {
    if (value === 'C') {
      setInput('');
    } else if (value === '=') {
      try {
        if (input === '' || input === 'Error') return;
        const result = Function('"use strict";return (' + input + ')')();
        setInput(String(result));
      } catch (error) {
        setInput('Error');
      }
    } else if (value === '←') {
      setInput(prev => prev.slice(0, -1));
    } else if (value === '%') {
      handlePercent();
    }
    else {
      if (input === 'Error') {
          setInput(value);
      } else {
          setInput(prev => prev + value);
      }
    }
  };

  const getButtonClass = (btn: string) => {
    const baseClass = `p-4 text-xl font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50`;
    if (btn === 'C' || btn === '←' || btn === '%') {
      return `${baseClass} bg-white/10 text-muted hover:bg-white/20`;
    }
    if (['/', '*', '-', '+', '='].includes(btn)) {
      return `${baseClass} bg-indigo-500/80 text-white hover:bg-indigo-500`;
    }
    return `${baseClass} bg-white/5 text-primary hover:bg-white/10`;
  };
  
  const Button = ({ value, className = '' }: { value: string, className?: string }) => (
    <button onClick={() => handleButtonClick(value)} className={`${getButtonClass(value)} ${className}`}>
        {value}
    </button>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Calculator" size="sm">
      <div className="space-y-4">
        <div className="bg-white/5 p-4 rounded-lg text-right text-3xl font-mono text-primary break-all h-20 flex items-center justify-end">{input || '0'}</div>
        <div className="grid grid-cols-4 gap-2">
            <Button value="C" />
            <Button value="←" />
            <Button value="%" />
            <Button value="/" />
            
            <Button value="7" />
            <Button value="8" />
            <Button value="9" />
            <Button value="*" />

            <Button value="4" />
            <Button value="5" />
            <Button value="6" />
            <Button value="-" />

            <Button value="1" />
            <Button value="2" />
            <Button value="3" />
            <Button value="+" />
            
            <Button value="0" className="col-span-2" />
            <Button value="." />
            <Button value="=" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const SessionTimeoutModal: React.FC<{
  isOpen: boolean;
  onContinue: () => void;
  onLogout: () => void;
  countdown: number;
}> = ({ isOpen, onContinue, onLogout, countdown }) => (
    <ModalWrapper isOpen={isOpen} onClose={onContinue} title="Session Timeout">
        <div className="text-center">
            <p className="text-primary mb-2">You've been inactive for a while.</p>
            <p className="text-muted">You will be logged out in <span className="font-bold text-primary">{countdown}</span> seconds for security.</p>
        </div>
        <div className="mt-6 flex justify-center gap-4">
            <button onClick={onLogout} className="px-6 py-2 text-sm font-semibold text-muted hover:text-primary">Log Out</button>
            <button onClick={onContinue} className="gloss-btn">Continue Session</button>
        </div>
    </ModalWrapper>
);
