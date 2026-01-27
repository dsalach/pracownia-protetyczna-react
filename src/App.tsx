import React, { useState, useEffect } from 'react';
import './index.css';
import {
  Doctor, Prosthetic, Employee, Supplier, Order, Invoice, Declaration,
  Notification, TabType, ModalType, StageProgress
} from './types';

const CURRENT_VERSION = '2.0.0';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [prosthetics, setProsthetics] = useState<Prosthetic[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('');
  const [editItem, setEditItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ type: string; id: number } | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'deadline'>('date');
  const [initialized, setInitialized] = useState(false);

  const loadAllData = React.useCallback(() => {
    try {
      const savedOrders = localStorage.getItem('orders');
      const savedDoctors = localStorage.getItem('doctors');
      const savedProsthetics = localStorage.getItem('prosthetics');
      const savedEmployees = localStorage.getItem('employees');
      const savedSuppliers = localStorage.getItem('suppliers');
      const savedInvoices = localStorage.getItem('invoices');
      const savedDeclarations = localStorage.getItem('declarations');

      setOrders(savedOrders ? JSON.parse(savedOrders) : []);
      setDoctors(savedDoctors ? JSON.parse(savedDoctors) : []);
      setEmployees(savedEmployees ? JSON.parse(savedEmployees) : []);
      setSuppliers(savedSuppliers ? JSON.parse(savedSuppliers) : []);
      setInvoices(savedInvoices ? JSON.parse(savedInvoices) : []);
      setDeclarations(savedDeclarations ? JSON.parse(savedDeclarations) : []);

      if (savedProsthetics) {
        setProsthetics(JSON.parse(savedProsthetics));
      } else {
        initializeDefaultProsthetics();
      }

      setInitialized(true);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      showNotification('Błąd ładowania danych', 'error');
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const initializeDefaultProsthetics = () => {
    const defaults: Prosthetic[] = [
      { id: Date.now(), name: 'Korona porcelanowa', gmlcCode: 'GMLC-001', minDays: 7, price: 450, stages: ['Odlew', 'Szlifowanie', 'Porcelana', 'Glazura'] },
      { id: Date.now() + 1, name: 'Most 3-punktowy', gmlcCode: 'GMLC-002', minDays: 10, price: 1200, stages: ['Odlew', 'Szlifowanie', 'Porcelana', 'Polerowanie'] },
      { id: Date.now() + 2, name: 'Proteza akrylowa', gmlcCode: 'GMLC-003', minDays: 14, price: 800, stages: ['Wycisk', 'Model', 'Ustawienie', 'Polimeryzacja'] }
    ];
    setProsthetics(defaults);
    localStorage.setItem('prosthetics', JSON.stringify(defaults));
    showNotification('Zainicjalizowano przykładowe uzupełnienia', 'info');
  };

  const saveToStorage = (key: string, data: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Błąd zapisu:', error);
      showNotification(`Błąd zapisu danych: ${error}`, 'error');
      return false;
    }
  };

  const addOrder = (data: Partial<Order>) => {
    try {
      const prosthetic = prosthetics.find(p => p.id === Number(data.prostheticId));
      if (!prosthetic) {
        showNotification('Nie znaleziono uzupełnienia', 'error');
        return;
      }
      const teethCount = (data.teethNumbers || '').split(',').filter(t => t.trim()).length || 1;
      const totalPrice = prosthetic.price * teethCount;
      const newOrder: Order = {
        id: Date.now(),
        doctorId: Number(data.doctorId),
        patientCode: data.patientCode || '',
        prostheticId: Number(data.prostheticId),
        deadline: data.deadline || '',
        teethNumbers: data.teethNumbers || '',
        teethCount,
        material: data.material || '',
        notes: data.notes,
        status: 'Nowe',
        totalPrice,
        createdAt: new Date().toISOString(),
        stages: prosthetic.stages || [],
        stageProgress: (prosthetic.stages || []).map(() => ({
          assignedTo: '', status: 'Nierozpoczęty', startedAt: null, completedAt: null
        }))
      };
      const updated = [...orders, newOrder];
      setOrders(updated);
      saveToStorage('orders', updated);
      showNotification('Zlecenie zostało dodane');
    } catch (error) {
      showNotification('Błąd dodawania zlecenia: ' + error, 'error');
    }
  };

  const updateOrder = (id: number, data: Partial<Order>) => {
    try {
      const prosthetic = prosthetics.find(p => p.id === Number(data.prostheticId));
      if (!prosthetic) return;
      const teethCount = (data.teethNumbers || '').split(',').filter(t => t.trim()).length || 1;
      const totalPrice = prosthetic.price * teethCount;
      const updated = orders.map(order =>
        order.id === id ? { ...order, ...data, doctorId: Number(data.doctorId), prostheticId: Number(data.prostheticId), totalPrice, teethCount, modifiedAt: new Date().toISOString() } : order
      );
      setOrders(updated);
      saveToStorage('orders', updated);
      showNotification('Zlecenie zaktualizowane');
    } catch (error) {
      showNotification('Błąd aktualizacji: ' + error, 'error');
    }
  };

  const deleteOrder = (id: number) => {
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    saveToStorage('orders', updated);
    showNotification('Zlecenie usunięte');
    setShowConfirmDelete(null);
  };

  const updateOrderStatus = (id: number, status: Order['status']) => {
    const updated = orders.map(order =>
      order.id === id ? { ...order, status, ...(status === 'Zakończone' ? { completedAt: new Date().toISOString() } : {}) } : order
    );
    setOrders(updated);
    saveToStorage('orders', updated);
    showNotification('Status zmieniony na: ' + status);
  };

  const updateOrderStage = (orderId: number, stageIndex: number, assignedTo: string, status: StageProgress['status']) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const newStages = [...order.stageProgress];
        const current = newStages[stageIndex] || { assignedTo: '', status: 'Nierozpoczęty', startedAt: null, completedAt: null };
        newStages[stageIndex] = {
          assignedTo, status,
          startedAt: !current.startedAt && status === 'W trakcie' ? new Date().toISOString() : current.startedAt,
          completedAt: status === 'Zakończony' ? new Date().toISOString() : null
        };
        return { ...order, stageProgress: newStages };
      }
      return order;
    });
    setOrders(updated);
    saveToStorage('orders', updated);
  };

  const generateInvoice = (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const prosthetic = prosthetics.find(p => p.id === order.prostheticId);
      const doctor = doctors.find(d => d.id === order.doctorId);
      const year = new Date().getFullYear();
      const yearInvoices = invoices.filter(inv => inv.invoiceNumber.startsWith(`FV/${year}/`));
      const nextNumber = yearInvoices.length + 1;
      const invoice: Invoice = {
        id: Date.now(), orderId, invoiceNumber: `FV/${year}/${String(nextNumber).padStart(4, '0')}`,
        doctor: doctor?.name || '', doctorId: order.doctorId, prostheticName: prosthetic?.name || '',
        teethNumbers: order.teethNumbers, teethCount: order.teethCount, unitPrice: prosthetic?.price || 0,
        amount: order.totalPrice, issueDate: new Date().toISOString(), status: 'Wystawiona'
      };
      const updated = [...invoices, invoice];
      setInvoices(updated);
      saveToStorage('invoices', updated);
      showNotification('Faktura wystawiona: ' + invoice.invoiceNumber);
    } catch (error) {
      showNotification('Błąd generowania faktury: ' + error, 'error');
    }
  };

  const generateDeclaration = (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const prosthetic = prosthetics.find(p => p.id === order.prostheticId);
      const doctor = doctors.find(d => d.id === order.doctorId);
      const declaration: Declaration = {
        id: Date.now(), orderId, declarationNumber: `OSW/${new Date().getFullYear()}/${declarations.length + 1}`,
        patientCode: order.patientCode, doctorName: doctor?.name || '', prostheticName: prosthetic?.name || '',
        gmlcCode: prosthetic?.gmlcCode || '', teethNumbers: order.teethNumbers, material: order.material,
        issueDate: new Date().toISOString(), completionDate: order.completedAt || ''
      };
      const updated = [...declarations, declaration];
      setDeclarations(updated);
      saveToStorage('declarations', updated);
      showNotification('Oświadczenie wygenerowane: ' + declaration.declarationNumber);
    } catch (error) {
      showNotification('Błąd generowania oświadczenia: ' + error, 'error');
    }
  };

  const addDoctor = (data: Partial<Doctor>) => {
    const newDoctor: Doctor = { id: Date.now(), name: data.name || '', ...data };
    const updated = [...doctors, newDoctor];
    setDoctors(updated);
    saveToStorage('doctors', updated);
    showNotification('Lekarz dodany');
  };

  const updateDoctor = (id: number, data: Partial<Doctor>) => {
    const updated = doctors.map(d => d.id === id ? { ...d, ...data } : d);
    setDoctors(updated);
    saveToStorage('doctors', updated);
    showNotification('Dane lekarza zaktualizowane');
  };

  const deleteDoctor = (id: number) => {
    if (orders.some(o => o.doctorId === id)) {
      showNotification('Nie można usunąć lekarza z przypisanymi zleceniami', 'error');
      setShowConfirmDelete(null);
      return;
    }
    const updated = doctors.filter(d => d.id !== id);
    setDoctors(updated);
    saveToStorage('doctors', updated);
    showNotification('Lekarz usunięty');
    setShowConfirmDelete(null);
  };

  const addProsthetic = (data: Partial<Prosthetic>) => {
    const newProsthetic: Prosthetic = {
      id: Date.now(), name: data.name || '', gmlcCode: data.gmlcCode || '',
      minDays: Number(data.minDays) || 0, price: Number(data.price) || 0, stages: data.stages || []
    };
    const updated = [...prosthetics, newProsthetic];
    setProsthetics(updated);
    saveToStorage('prosthetics', updated);
    showNotification('Uzupełnienie dodane');
  };

  const updateProsthetic = (id: number, data: Partial<Prosthetic>) => {
    const updated = prosthetics.map(p => p.id === id ? { ...p, ...data, minDays: Number(data.minDays), price: Number(data.price) } : p);
    setProsthetics(updated);
    saveToStorage('prosthetics', updated);
    showNotification('Uzupełnienie zaktualizowane');
  };

  const deleteProsthetic = (id: number) => {
    if (orders.some(o => o.prostheticId === id)) {
      showNotification('Nie można usunąć uzupełnienia z przypisanymi zleceniami', 'error');
      setShowConfirmDelete(null);
      return;
    }
    const updated = prosthetics.filter(p => p.id !== id);
    setProsthetics(updated);
    saveToStorage('prosthetics', updated);
    showNotification('Uzupełnienie usunięte');
    setShowConfirmDelete(null);
  };

  const addEmployee = (data: Partial<Employee>) => {
    const newEmployee: Employee = { id: Date.now(), name: data.name || '', ...data };
    const updated = [...employees, newEmployee];
    setEmployees(updated);
    saveToStorage('employees', updated);
    showNotification('Pracownik dodany');
  };

  const updateEmployee = (id: number, data: Partial<Employee>) => {
    const updated = employees.map(emp => emp.id === id ? { ...emp, ...data } : emp);
    setEmployees(updated);
    saveToStorage('employees', updated);
    showNotification('Pracownik zaktualizowany');
  };

  const deleteEmployee = (id: number) => {
    const updated = employees.filter(emp => emp.id !== id);
    setEmployees(updated);
    saveToStorage('employees', updated);
    showNotification('Pracownik usunięty');
    setShowConfirmDelete(null);
  };

  const addSupplier = (data: Partial<Supplier>) => {
    const newSupplier: Supplier = { id: Date.now(), name: data.name || '', ...data };
    const updated = [...suppliers, newSupplier];
    setSuppliers(updated);
    saveToStorage('suppliers', updated);
    showNotification('Dostawca dodany');
  };

  const updateSupplier = (id: number, data: Partial<Supplier>) => {
    const updated = suppliers.map(s => s.id === id ? { ...s, ...data } : s);
    setSuppliers(updated);
    saveToStorage('suppliers', updated);
    showNotification('Dostawca zaktualizowany');
  };

  const deleteSupplier = (id: number) => {
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    saveToStorage('suppliers', updated);
    showNotification('Dostawca usunięty');
    setShowConfirmDelete(null);
  };
  const exportData = () => {
    const exportObj = {
      version: CURRENT_VERSION, exportDate: new Date().toISOString(),
      orders, doctors, prosthetics, employees, suppliers, invoices, declarations
    };
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pracownia-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('Dane wyeksportowane');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.orders) { setOrders(imported.orders); saveToStorage('orders', imported.orders); }
        if (imported.doctors) { setDoctors(imported.doctors); saveToStorage('doctors', imported.doctors); }
        if (imported.prosthetics) { setProsthetics(imported.prosthetics); saveToStorage('prosthetics', imported.prosthetics); }
        if (imported.employees) { setEmployees(imported.employees); saveToStorage('employees', imported.employees); }
        if (imported.suppliers) { setSuppliers(imported.suppliers); saveToStorage('suppliers', imported.suppliers); }
        if (imported.invoices) { setInvoices(imported.invoices); saveToStorage('invoices', imported.invoices); }
        if (imported.declarations) { setDeclarations(imported.declarations); saveToStorage('declarations', imported.declarations); }
        showNotification('Dane zaimportowane pomyślnie');
      } catch (error) {
        showNotification('Błąd importu: ' + error, 'error');
      }
    };
    reader.readAsText(file);
  };

  const getUrgentOrders = () => {
    const today = new Date();
    const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    return orders.filter(o => {
      if (o.status === 'Zakończone') return false;
      const deadline = new Date(o.deadline);
      return deadline <= threeDays;
    });
  };

  const SimpleModal: React.FC<{ type: ModalType }> = ({ type }) => {
    const [formData, setFormData] = useState<any>(editItem || {});
    const handleSave = () => {
      if (type === 'doctor') { editItem ? updateDoctor(editItem.id, formData) : addDoctor(formData); }
      else if (type === 'prosthetic') { editItem ? updateProsthetic(editItem.id, formData) : addProsthetic(formData); }
      else if (type === 'employee') { editItem ? updateEmployee(editItem.id, formData) : addEmployee(formData); }
      else if (type === 'supplier') { editItem ? updateSupplier(editItem.id, formData) : addSupplier(formData); }
      else if (type === 'order') { editItem ? updateOrder(editItem.id, formData) : addOrder(formData); }
      setShowModal(false);
      setEditItem(null);
    };
    return (
      <div className="modal-overlay" onClick={(e) => e.currentTarget === e.target && setShowModal(false)}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">
              {editItem ? 'Edytuj' : 'Dodaj'}{' '}
              {type === 'doctor' ? 'lekarza' : type === 'prosthetic' ? 'uzupełnienie' : type === 'employee' ? 'pracownika' : type === 'supplier' ? 'dostawcę' : 'zlecenie'}
            </div>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nazwa *</label>
              <input className="input" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            {type === 'doctor' && (
              <>
                <div className="form-group">
                  <label className="form-label">Specjalizacja</label>
                  <input className="input" value={formData.specialty || ''} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input className="input" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </>
            )}
            {type === 'prosthetic' && (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Kod GMLC *</label>
                    <input className="input" value={formData.gmlcCode || ''} onChange={(e) => setFormData({ ...formData, gmlcCode: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min. dni *</label>
                    <input type="number" className="input" value={formData.minDays || ''} onChange={(e) => setFormData({ ...formData, minDays: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cena (zł) *</label>
                    <input type="number" step="0.01" className="input" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Etapy (oddzielone przecinkami)</label>
                  <input className="input" value={formData.stages ? formData.stages.join(', ') : ''} onChange={(e) => setFormData({ ...formData, stages: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="Odlew, Szlifowanie, Porcelana" />
                </div>
              </>
            )}
            {type === 'employee' && (
              <div className="form-group">
                <label className="form-label">Stanowisko</label>
                <input className="input" value={formData.position || ''} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
              </div>
            )}
            {type === 'supplier' && (
              <div className="form-group">
                <label className="form-label">Usługa</label>
                <input className="input" value={formData.service || ''} onChange={(e) => setFormData({ ...formData, service: e.target.value })} />
              </div>
            )}
            {type === 'order' && (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Lekarz *</label>
                    <select className="select" value={formData.doctorId || ''} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}>
                      <option value="">Wybierz...</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kod pacjenta *</label>
                    <input className="input" value={formData.patientCode || ''} onChange={(e) => setFormData({ ...formData, patientCode: e.target.value })} placeholder="Jan Kowalski" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Typ uzupełnienia *</label>
                    <select className="select" value={formData.prostheticId || ''} onChange={(e) => setFormData({ ...formData, prostheticId: e.target.value })}>
                      <option value="">Wybierz...</option>
                      {prosthetics.map(p => <option key={p.id} value={p.id}>{p.name} - {p.price} zł</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Termin *</label>
                    <input type="date" className="input" value={formData.deadline || ''} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Numery zębów *</label>
                    <input className="input" value={formData.teethNumbers || ''} onChange={(e) => setFormData({ ...formData, teethNumbers: e.target.value })} placeholder="14, 15, 16" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Materiał *</label>
                    <input className="input" value={formData.material || ''} onChange={(e) => setFormData({ ...formData, material: e.target.value })} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-gray" onClick={() => { setShowModal(false); setEditItem(null); }}>Anuluj</button>
            <button className="btn" onClick={handleSave}>Zapisz</button>
          </div>
        </div>
      </div>
    );
  };

  if (!initialized) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Ładowanie systemu...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {notification && <div className={`toast ${notification.type}`}><strong>{notification.message}</strong></div>}
      <nav className="nav">
        <div className="nav-header">
          <h1>🦷 System Pracowni Protetycznej</h1>
          <div className="nav-buttons">
            <button className="nav-btn" onClick={exportData}>⬇️ Eksport</button>
            <label className="nav-btn" style={{ cursor: 'pointer' }}>
              ⬆️ Import
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
            </label>
          </div>
        </div>
        <div className="nav-tabs">
          {(['dashboard', 'orders', 'doctors', 'prosthetics', 'employees', 'suppliers', 'invoices', 'declarations'] as TabType[]).map(tab => (
            <button key={tab} className={activeTab === tab ? 'nav-tab active' : 'nav-tab'} onClick={() => { setActiveTab(tab); setSearchTerm(''); }}>
              {tab === 'dashboard' && '📊 Dashboard'}
              {tab === 'orders' && '📋 Zlecenia'}
              {tab === 'doctors' && '👨‍⚕️ Lekarze'}
              {tab === 'prosthetics' && '🦷 Uzupełnienia'}
              {tab === 'employees' && '👷 Pracownicy'}
              {tab === 'suppliers' && '🚚 Dostawcy'}
              {tab === 'invoices' && '💰 Faktury'}
              {tab === 'declarations' && '📄 Oświadczenia'}
            </button>
          ))}
        </div>
      </nav>

      <main className="main">
        {activeTab === 'dashboard' && (
          <div className="card">
            <h2>📊 Panel główny</h2>
            {getUrgentOrders().length > 0 && (
              <div className="alert alert-warning">
                <strong>⚠️ Pilne zlecenia: {getUrgentOrders().length}</strong>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Zlecenia z terminem w ciągu najbliższych 3 dni</div>
              </div>
            )}
            <div className="stats">
              <div className="stat-card blue">
                <div className="stat-label">Aktywne zlecenia</div>
                <div className="stat-value">{orders.filter(o => o.status !== 'Zakończone').length}</div>
              </div>
              <div className="stat-card red">
                <div className="stat-label">Pilne zlecenia</div>
                <div className="stat-value">{getUrgentOrders().length}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-label">Ukończone (m-c)</div>
                <div className="stat-value">
                  {orders.filter(o => {
                    if (!o.completedAt) return false;
                    const completed = new Date(o.completedAt);
                    const now = new Date();
                    return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </div>
              <div className="stat-card purple">
                <div className="stat-label">Przychód (m-c)</div>
                <div className="stat-value">
                  {invoices.filter(inv => {
                    const invDate = new Date(inv.issueDate);
                    const now = new Date();
                    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
                  }).reduce((sum, inv) => sum + inv.amount, 0).toFixed(0)} zł
                </div>
              </div>
            </div>
            <div className="alert alert-success">
              <strong>✅ System działa poprawnie!</strong>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Wersja {CURRENT_VERSION} • {doctors.length} lekarzy • {prosthetics.length} typów uzupełnień • {employees.length} pracowników
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>📋 Zlecenia</h2>
                <button className="btn" onClick={() => { setModalType('order'); setEditItem(null); setShowModal(true); }}>➕ Nowe zlecenie</button>
              </div>
              <div className="search-bar">
                <input className="input search-input" placeholder="Szukaj..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'deadline')}>
                  <option value="date">Sortuj: Data</option>
                  <option value="deadline">Sortuj: Termin</option>
                </select>
              </div>
            </div>
            {orders.filter(order => {
              if (!searchTerm) return true;
              const doctor = doctors.find(d => d.id === order.doctorId);
              const prosthetic = prosthetics.find(p => p.id === order.prostheticId);
              const search = searchTerm.toLowerCase();
              return (order.patientCode || '').toLowerCase().includes(search) || (doctor?.name || '').toLowerCase().includes(search) || (prosthetic?.name || '').toLowerCase().includes(search);
            }).sort((a, b) => {
              if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
              return 0;
            }).map(order => {
              const doctor = doctors.find(d => d.id === order.doctorId);
              const prosthetic = prosthetics.find(p => p.id === order.prostheticId);
              const isOverdue = new Date(order.deadline) < new Date() && order.status !== 'Zakończone';
              return (
                <div key={order.id} className="card" style={isOverdue ? { borderLeft: '4px solid #dc2626' } : {}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div className="list-title">{prosthetic?.name || 'Nieznany typ'}</div>
                      <div className="list-desc">Lekarz: {doctor?.name || 'Nieznany'}</div>
                      <div className="list-desc">Pacjent: {order.patientCode}</div>
                      <div className="list-desc">Zęby: {order.teethNumbers} • Cena: {order.totalPrice} zł</div>
                      <div className="list-desc">Termin: {new Date(order.deadline).toLocaleDateString('pl-PL')}</div>
                      {isOverdue && <div style={{ color: '#dc2626', fontWeight: 600, marginTop: '0.25rem' }}>⚠️ PRZEKROCZONY TERMIN</div>}
                    </div>
                    <div className="list-actions">
                      <select className="select" style={{ minWidth: '150px' }} value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}>
                        <option value="Nowe">Nowe</option>
                        <option value="W realizacji">W realizacji</option>
                        <option value="Przymiarka">Przymiarka</option>
                        <option value="Poprawki">Poprawki</option>
                        <option value="Gotowe do odbioru">Gotowe</option>
                        <option value="Zakończone">Zakończone</option>
                      </select>
                      <button className="btn btn-sm" onClick={() => { setEditItem(order); setModalType('order'); setShowModal(true); }}>✏️</button>
                      {order.status === 'Zakończone' && !invoices.find(inv => inv.orderId === order.id) && (
                        <button className="btn btn-sm btn-green" onClick={() => generateInvoice(order.id)}>💰 Faktura</button>
                      )}
                      {order.status === 'Zakończone' && !declarations.find(dec => dec.orderId === order.id) && (
                        <button className="btn btn-sm btn-green" onClick={() => generateDeclaration(order.id)}>📄 Oświadczenie</button>
                      )}
                      <button className="btn btn-sm btn-red" onClick={() => setShowConfirmDelete({ type: 'order', id: order.id })}>🗑️</button>
                    </div>
                  </div>
                  {order.stages && order.stages.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Etapy produkcji:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {order.stages.map((stage, idx) => {
                          const progress = order.stageProgress[idx] || { assignedTo: '', status: 'Nierozpoczęty', startedAt: null, completedAt: null };
                          return (
                            <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 600, color: '#1f2937', flex: 1, minWidth: '150px' }}>{idx + 1}. {stage}</div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select className="select" style={{ minWidth: '150px' }} value={progress.assignedTo} onChange={(e) => updateOrderStage(order.id, idx, e.target.value, progress.status)}>
                                  <option value="">Przypisz...</option>
                                  {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                                  {suppliers.map(sup => <option key={sup.id} value={sup.name + ' (d)'}>{sup.name} (dostawca)</option>)}
                                </select>
                                <select className="select" style={{ minWidth: '130px' }} value={progress.status} onChange={(e) => updateOrderStage(order.id, idx, progress.assignedTo, e.target.value as StageProgress['status'])}>
                                  <option value="Nierozpoczęty">Nierozpoczęty</option>
                                  <option value="W trakcie">W trakcie</option>
                                  <option value="Zakończony">Zakończony</option>
                                </select>
                                <span className={`badge ${progress.status === 'Zakończony' ? 'badge-green' : progress.status === 'W trakcie' ? 'badge-yellow' : 'badge-blue'}`}>
                                  {progress.assignedTo || 'Brak'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {['doctors', 'prosthetics', 'employees', 'suppliers'].includes(activeTab) && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>
                {activeTab === 'doctors' && '👨‍⚕️ Lekarze'}
                {activeTab === 'prosthetics' && '🦷 Uzupełnienia'}
                {activeTab === 'employees' && '👷 Pracownicy'}
                {activeTab === 'suppliers' && '🚚 Dostawcy'}
              </h2>
              <button className="btn" onClick={() => { setModalType(activeTab as ModalType); setEditItem(null); setShowModal(true); }}>➕ Dodaj</button>
            </div>
            <input className="input" style={{ marginBottom: '1.5rem' }} placeholder="Szukaj..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {(activeTab === 'doctors' ? doctors : activeTab === 'prosthetics' ? prosthetics : activeTab === 'employees' ? employees : suppliers)
              .filter((item: any) => !searchTerm || Object.values(item).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())))
              .map((item: any) => (
                <div key={item.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div className="list-title">{item.name}</div>
                    {item.specialty && <div className="list-desc">Specjalizacja: {item.specialty}</div>}
                    {item.phone && <div className="list-desc">Tel: {item.phone}</div>}
                    {item.gmlcCode && <div className="list-desc">Kod: {item.gmlcCode}</div>}
                    {item.price && <div className="list-desc">Cena: {item.price} zł</div>}
                    {item.minDays && <div className="list-desc">Min. czas: {item.minDays} dni</div>}
                    {item.stages && <div className="list-desc">Etapy: {item.stages.join(', ')}</div>}
                    {item.position && <div className="list-desc">Stanowisko: {item.position}</div>}
                    {item.service && <div className="list-desc">Usługa: {item.service}</div>}
                  </div>
                  <div className="list-actions">
                    <button className="btn btn-sm" onClick={() => { setEditItem(item); setModalType(activeTab as ModalType); setShowModal(true); }}>✏️ Edytuj</button>
                    <button className="btn btn-sm btn-red" onClick={() => setShowConfirmDelete({ type: activeTab, id: item.id })}>🗑️ Usuń</button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="card">
            <h2>💰 Faktury</h2>
            {invoices.map(inv => (
              <div key={inv.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <div className="list-title">{inv.invoiceNumber}</div>
                  <div className="list-desc">Lekarz: {inv.doctor}</div>
                  <div className="list-desc">{inv.prostheticName} • {inv.teethNumbers}</div>
                  <div className="list-desc">Data: {new Date(inv.issueDate).toLocaleDateString('pl-PL')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>{inv.amount.toFixed(2)} zł</div>
                  <span className="badge badge-green">{inv.status}</span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Brak faktur</p>}
          </div>
        )}

        {activeTab === 'declarations' && (
          <div className="card">
            <h2>📄 Oświadczenia</h2>
            {declarations.map(dec => (
              <div key={dec.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <div className="list-title">{dec.declarationNumber}</div>
                  <div className="list-desc">Pacjent: {dec.patientCode}</div>
                  <div className="list-desc">{dec.prostheticName} • {dec.gmlcCode}</div>
                </div>
              </div>
            ))}
            {declarations.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Brak oświadczeń</p>}
          </div>
        )}
      </main>

      {showModal && modalType && <SimpleModal type={modalType} />}

      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header"><div className="modal-title">⚠️ Potwierdzenie usunięcia</div></div>
            <div className="modal-body"><p>Czy na pewno chcesz usunąć ten element? Operacji nie można cofnąć.</p></div>
            <div className="modal-footer">
              <button className="btn btn-gray" onClick={() => setShowConfirmDelete(null)}>Anuluj</button>
              <button className="btn btn-red" onClick={() => {
                const { type, id } = showConfirmDelete;
                if (type === 'order') deleteOrder(id);
                else if (type === 'doctor') deleteDoctor(id);
                else if (type === 'prosthetic') deleteProsthetic(id);
                else if (type === 'employee') deleteEmployee(id);
                else if (type === 'supplier') deleteSupplier(id);
              }}>Usuń</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;