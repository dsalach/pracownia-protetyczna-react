export interface Doctor {
  id: number;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  clinic?: string;
}

export interface Prosthetic {
  id: number;
  name: string;
  gmlcCode: string;
  minDays: number;
  price: number;
  stages: string[];
}

export interface Employee {
  id: number;
  name: string;
  position?: string;
  skills?: string[];
}

export interface Supplier {
  id: number;
  name: string;
  service?: string;
  contact?: string;
  costPerService?: number;
}

export interface StageProgress {
  assignedTo: string;
  status: 'Nierozpoczęty' | 'W trakcie' | 'Zakończony';
  startedAt: string | null;
  completedAt: string | null;
}

export interface Order {
  id: number;
  doctorId: number;
  patientCode: string;
  prostheticId: number;
  deadline: string;
  teethNumbers: string;
  teethCount: number;
  material: string;
  notes?: string;
  status: 'Nowe' | 'W realizacji' | 'Przymiarka' | 'Poprawki' | 'Gotowe do odbioru' | 'Zakończone';
  totalPrice: number;
  createdAt: string;
  completedAt?: string;
  modifiedAt?: string;
  stages: string[];
  stageProgress: StageProgress[];
}

export interface Invoice {
  id: number;
  orderId: number;
  invoiceNumber: string;
  doctor: string;
  doctorId: number;
  prostheticName: string;
  teethNumbers: string;
  teethCount: number;
  unitPrice: number;
  amount: number;
  issueDate: string;
  status: string;
}

export interface Declaration {
  id: number;
  orderId: number;
  declarationNumber: string;
  patientCode: string;
  doctorName: string;
  prostheticName: string;
  gmlcCode: string;
  teethNumbers: string;
  material: string;
  issueDate: string;
  completionDate: string;
}

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

export type TabType = 'dashboard' | 'orders' | 'doctors' | 'prosthetics' | 'employees' | 'suppliers' | 'invoices' | 'declarations';

export type ModalType = 'order' | 'doctor' | 'prosthetic' | 'employee' | 'supplier' | '';