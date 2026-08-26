import { useState, useEffect } from "react";
import client, { setStoredToken, setStoredRefreshToken, isNative, getNotifications, markNotificationRead, getUnreadNotificationCount } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { getHealthReadings, getPatients, createHealthReading, getPatient, getUsers, updateUserPhone, updateUserLimits } from "../api/health";
import WatchConnect from "../components/WatchConnect";
import WatchHealthDisplay from "../components/WatchHealthDisplay";
import AllHealthReadingsDialog from "../components/AllHealthReadingsDialog";
import HealthChart from "../components/HealthChart";
import EnlargedChartDialog from "../components/EnlargedChartDialog";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";


import {
  Heart,
  Droplet,
  Bell,
  User,
  Users,
  Settings,
  LogOut,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Shield,
  Stethoscope,
  Smartphone,
  Calendar,
  FileText,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Monitor,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Key,
  Database,
  Zap,
  LayoutDashboard,
  Sidebar,
} from "lucide-react";
import RegisterPage from "./Register";
import { useData } from "../contexts/DataContext";
import { registerPush } from "../services/push";

// ─── TRANSLATIONS ───────────────────────────────────────────────────────────────
const translations = {
  pt: {
    // Common
    appName: "ScanWatch",
    subtitle: "Monitoramento Inteligente de Saúde",
    signIn: "Entrar",
    register: "Criar Conta",
    name: "Nome",
    email: "E-mail",
    password: "Senha",
    phone: "Telefone",
    patient: "Paciente",
    doctor: "Médico",
    admin: "Admin",
    notifications: "Notificações",
    settings: "Configurações",
    logout: "Sair",
    back: "Voltar",
    haveAccount: "Já tem conta?",
    noAccount: "Não tem conta?",
    
    // Patient Dashboard
    currentHydration: "Hidratação Atual",
    dailyIntake: "Ingestão diária",
    todaysIntake: "Ingestão de Hoje",
    lastReading: "Última Leitura",
    sevenDayHistory: "Histórico de 7 Dias",
    recentAlerts: "Alertas Recentes",
    totalUsers:'Total Usuários',
    dashboard: "Painel",
    history: "Histórico",
    
    // Status
    normal: "Normal",
    low: "Baixo",
    high: "Alto",
    critical: "Crítico",
    
    // Doctor Dashboard
    totalPatients: "Total de Pacientes",
    alerts: "Alertas",
    patientsNeedingAttention: "Pacientes que Precisam de Atenção",
    allPatients: "Todos os Pacientes",
    patients: "Pacientes",
    analytics: "Análises",
    
    // Admin Dashboard
    administrator: "Administrador",
    systemStatus: "Status do Sistema",
    operational: "Operacional",
    quickActions: "Ações Rápidas",
    manageUsers: "Gerenciar Usuários",
    viewAnalytics: "Ver Análises",
    systemAlerts: "Alertas do Sistema",
    overview: "Visão Geral",
    users: "Usuários",
    totalReadings: "Total de Leituras",
    avgHeartRate: "Frequência Cardíaca Média",
    avgSpO2: "SpO₂ Média",
    avgSystolic: "Pressão Sistólica Média",
    lowSpO2Alerts: "Alertas SpO₂ Baixo",
    abnormalBPAlerts: "Alertas Pressão Arterial",
    criticalReadings: "Leituras Críticas",
    healthMeasurements: "Medições de Saúde",
    successfulSyncs: "Sincronizações Bem-sucedidas",
    failedSyncs: "Sincronizações Falhadas",
    lowBatteryDevices: "Dispositivos com Bateria Baixa",
    userActivity: "Atividade de Usuários",
    newUsers: "Novos Usuários",
    onlineDevices: "Dispositivos Online",
    sleepRecords: "Registos de Sono",
    stepsRecorded: "Passos Registados",
    heartRateRecords: "Registos de Frequência Cardíaca",
    bloodPressureRecords: "Registos de Pressão Arterial",
    spo2Records: "Registos de SpO₂",
    bluetoothConnections: "Conexões Bluetooth",
    unresolvedAlerts: "Alertas Não Resolvidos",
    avgMeasurementsPerUser: "Média de Medições por Usuário",
    totalAdmins: "Total de Administradores",
    totalHospitals: "Hospitais / Clínicas",
    serverUptime: "Uptime do Servidor",
    apiResponseTime: "Tempo de Resposta da API",
    databaseSize: "Tamanho da Base de Dados",
    activeSessions: "Sessões Ativas",
    dataProcessed: "Dados Processados Hoje",
    errorRate: "Taxa de Erro",
    systemLoad: "Carga do Sistema",
    networkStatus: "Status da Rede",
    securityStatus: "Status de Segurança",
    backups: "Backups",
    lastBackup: "Último Backup",
    failedLogins: "Logins Falhados",
    auditLogs: "Logs de Auditoria",
    storageUsed: "Armazenamento Usado",
    cpuUsage: "Uso de CPU",
    memoryUsage: "Uso de Memória",
    today: "Hoje",
    thisWeek: "Esta Semana",
    batteryLevel: "Bateria",
    
    // Settings
    darkMode: "Modo Escuro",
    on: "Ativado",
    off: "Desativado",
    enabled: "Ativado",
    
    // Analytics
    avgHydration: "Hidratação Média",
    lowHydration: "Baixa Hidratação",
    highHydration: "Alta Hidratação",
    totalReadings: "Total de Leituras",
    hydrationDistribution: "Distribuição de Hidratação",
    normalRange: "Normal (50-80%)",
    lowRange: "Baixo (<50%)",
    highRange: "Alto (>80%)",
    
    // Notifications
    lowHydrationAlert: "Alerta de Baixa Hidratação",
    drinkWaterMsg: "Seu nível de hidratação caiu para {level}%. Beba água imediatamente.",
    patientAlert: "Alerta de Paciente",
    patientAlertMsg: "Os níveis de hidratação de {name} caíram significativamente na última hora.",
    hydrationReminder: "Lembrete de Hidratação",
    reminderMsg: "Hora de beber água! Você está {percent}% abaixo da sua meta diária.",
    systemAlert: "Alerta do Sistema",
    systemAlertMsg: "{count} pacientes têm níveis de hidratação anormais que requerem atenção.",
    
    // History
    hydrationHistory: "Histórico de Hidratação",
    fourteenDayTrend: "Tendência de 14 Dias",
    dailyRecords: "Registros Diários",
    
    // Patient Detail
    patientDetails: "Detalhes do Paciente",
    healthStatistics: "Estatísticas de Saúde",
    avg: "Média",
    min: "Mínimo",
    max: "Máximo",
    thirtyDayHistory: "Histórico de 30 Dias",
    healthReport: "Relatório de Saúde",
    lastCheckup: "Último Check-up",
    doctor_placeholder: "Médico",
    status: "Status",
    loading: "Carregando...",
    patientNotFound: "Paciente não encontrado",
    failedToLoadPatientDetails: "Falha ao carregar detalhes do paciente",
    unknown: "Desconhecido",
    age: "Idade",
    gender: "Gênero",
    avgHR: "Média FC",
    avgSpO2: "Média SpO₂",
    avgBP: "Média PA",
    bloodPressureHistory: "Histórico de Pressão Arterial",
    notEnoughData: "Dados insuficientes para exibir o gráfico.",
    heartRateAlert: "❤️ Frequência Cardíaca: {value} BPM",
    active: "Ativo",
    noReadingsStatus: "Sem leituras",
    viewLarger: "Ver Maior",
    defaultDoctorName: "Dr. Sarah Johnson",
    
    // User Management
    userManagement: "Gerenciamento de Usuários",
    
    // Health
    healthReadings: "Leituras de Saúde",
    heartRate: "Frequência Cardíaca",
    spo2: "SpO₂",
    bloodPressure: "Pressão Arterial",
    noReadings: "Sem leituras disponíveis",
    totalReadings: "Total de Leituras",
    lastReading: "Última Leitura",
    
    // Watch Connect
    watchConnected: "⌚ Relógio Conectado",
    disconnect: "Desconectar",
    savedHealthData: "💾 Dados de Saúde Guardados",
    lastSaved: "Última gravação:",
    connectSmartwatch: "⌚ Conectar Smartwatch",
    readyToScan: "Pronto para procurar dispositivos BLE.",
    initializingBluetooth: "A inicializar Bluetooth...",
    scanDevices: "Procurar Dispositivos",
    stopScan: "Parar Procura",
    connectingTo: "A conectar a",
    connected: "Conectado",
    connect: "Conectar",
    unnamedDevice: "Dispositivo Sem Nome",
    heartRateBPM: "❤️ Freq. Cardíaca",
    spo2Percent: "🫁 SpO₂",
    bloodPressureLabel: "🩸 Pressão Arterial",
    battery: "🔋 Bateria",
    lastUpdated: "Última atualização:",
    hr: "FC",
    bp: "PA",
    
    // Language
    language: "Idioma",
    portuguese: "Português",
    english: "Inglês",
  },
  en: {
    // Common
    appName: "ScanWatch",
    subtitle: "Smart Healthcare Monitoring",
    signIn: "Sign In",
    register: "Create Account",
    name: "Name",
    email: "Email",
    password: "Password",
    phone: "Phone",
    patient: "Patient",
    doctor: "Doctor",
    admin: "Admin",
    notifications: "Notifications",
    settings: "Settings",
    logout: "Log Out",
    back: "Back",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    
    // Patient Dashboard
    currentHydration: "Current Hydration",
    dailyIntake: "Daily intake",
    todaysIntake: "Today's Intake",
    lastReading: "Last Reading",
    sevenDayHistory: "7-Day History",
    recentAlerts: "Recent Alerts",
    dashboard: "Dashboard",
    history: "History",
    
    // Status
    normal: "Normal",
    low: "Low",
    high: "High",
    critical: "Critical",
    
    // Doctor Dashboard
    totalPatients: "Total Patients",
    alerts: "Alerts",
    patientsNeedingAttention: "Patients Needing Attention",
    allPatients: "All Patients",
    patients: "Patients",
    analytics: "Analytics",
    
    // Admin Dashboard
    totalUsers:'Total Users',
    administrator: "Administrator",
    systemStatus: "System Status",
    operational: "Operational",
    quickActions: "Quick Actions",
    manageUsers: "Manage Users",
    viewAnalytics: "View Analytics",
    systemAlerts: "System Alerts",
    overview: "Overview",
    users: "Users",
    totalReadings: "Total Readings",
    avgHeartRate: "Avg Heart Rate",
    avgSpO2: "Avg SpO₂",
    avgSystolic: "Avg Systolic",
    lowSpO2Alerts: "Low SpO₂ Alerts",
    abnormalBPAlerts: "Blood Pressure Alerts",
    criticalReadings: "Critical Readings",
    healthMeasurements: "Health Measurements",
    successfulSyncs: "Successful Syncs",
    failedSyncs: "Failed Syncs",
    lowBatteryDevices: "Low-Battery Devices",
    userActivity: "User Activity",
    newUsers: "New Users",
    onlineDevices: "Online Devices",
    sleepRecords: "Sleep Records",
    stepsRecorded: "Steps Recorded",
    heartRateRecords: "Heart Rate Records",
    bloodPressureRecords: "Blood Pressure Records",
    spo2Records: "SpO₂ Records",
    bluetoothConnections: "Bluetooth Connections",
    unresolvedAlerts: "Unresolved Alerts",
    avgMeasurementsPerUser: "Avg Measurements per User",
    totalAdmins: "Total Administrators",
    totalHospitals: "Hospitals / Clinics",
    serverUptime: "Server Uptime",
    apiResponseTime: "API Response Time",
    databaseSize: "Database Size",
    activeSessions: "Active Sessions",
    dataProcessed: "Data Processed Today",
    errorRate: "Error Rate",
    systemLoad: "System Load",
    networkStatus: "Network Status",
    securityStatus: "Security Status",
    backups: "Backups",
    lastBackup: "Last Backup",
    failedLogins: "Failed Logins",
    auditLogs: "Audit Logs",
    storageUsed: "Storage Used",
    cpuUsage: "CPU Usage",
    memoryUsage: "Memory Usage",
    today: "Today",
    thisWeek: "This Week",
    batteryLevel: "Battery",
    
    // Settings
    darkMode: "Dark Mode",
    on: "On",
    off: "Off",
    enabled: "Enabled",
    
    // Analytics
    avgHydration: "Avg Hydration",
    lowHydration: "Low Hydration",
    highHydration: "High Hydration",
    totalReadings: "Total Readings",
    hydrationDistribution: "Hydration Distribution",
    normalRange: "Normal (50-80%)",
    lowRange: "Low (<50%)",
    highRange: "High (>80%)",
    
    // Notifications
    lowHydrationAlert: "Low Hydration Alert",
    drinkWaterMsg: "Your hydration level has dropped to {level}%. Please drink water immediately.",
    patientAlert: "Patient Alert",
    patientAlertMsg: "{name}'s hydration level dropped significantly in the last hour.",
    hydrationReminder: "Hydration Reminder",
    reminderMsg: "Time to drink water! You're {percent}% below your daily target.",
    systemAlert: "System Alert",
    systemAlertMsg: "{count} patients have abnormal hydration levels requiring attention.",
    
    // History
    hydrationHistory: "Hydration History",
    fourteenDayTrend: "14-Day Trend",
    dailyRecords: "Daily Records",
    
    // Patient Detail
    patientDetails: "Patient Details",
    healthStatistics: "Health Statistics",
    avg: "Avg",
    min: "Min",
    max: "Max",
    thirtyDayHistory: "30-Day History",
    healthReport: "Health Report",
    lastCheckup: "Last Checkup",
    doctor_placeholder: "Doctor",
    status: "Status",
    loading: "Loading...",
    patientNotFound: "Patient not found",
    failedToLoadPatientDetails: "Failed to load patient details",
    unknown: "Unknown",
    age: "Age",
    gender: "Gender",
    avgHR: "Avg HR",
    avgSpO2: "Avg SpO₂",
    avgBP: "Avg BP",
    bloodPressureHistory: "Blood Pressure History",
    notEnoughData: "Not enough data to show chart.",
    heartRateAlert: "❤️ Heart Rate: {value} BPM",
    active: "Active",
    noReadingsStatus: "No readings",
    viewLarger: "View Larger",
    defaultDoctorName: "Dr. Sarah Johnson",
    
    // User Management
    userManagement: "User Management",
    
    // Health
    healthReadings: "Health Readings",
    heartRate: "Heart Rate",
    spo2: "SpO₂",
    bloodPressure: "Blood Pressure",
    noReadings: "No readings available",
    totalReadings: "Total Readings",
    lastReading: "Last Reading",
    
    // Watch Connect
    watchConnected: "⌚ Watch Connected",
    disconnect: "Disconnect",
    savedHealthData: "💾 Saved Health Data",
    lastSaved: "Last saved:",
    connectSmartwatch: "⌚ Connect Smartwatch",
    readyToScan: "Ready to scan for BLE devices.",
    initializingBluetooth: "Initializing Bluetooth...",
    scanDevices: "Scan Devices",
    stopScan: "Stop Scan",
    connectingTo: "Connecting to",
    connected: "Connected",
    connect: "Connect",
    unnamedDevice: "Unnamed Device",
    heartRateBPM: "❤️ Heart Rate",
    spo2Percent: "🫁 SpO₂",
    bloodPressureLabel: "🩸 Blood Pressure",
    battery: "🔋 Battery",
    lastUpdated: "Last updated:",
    hr: "HR",
    bp: "BP",
    
    // Language
    language: "Language",
    portuguese: "Português",
    english: "English",
  },
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const mockUsers = {
  patient: {
    id: "p1",
    name: "John Smith",
    email: "john.smith@email.com",
    role: "patient",
    avatar: "https://i.pravatar.cc/150?img=1",
    doctorId: "d1",
    hydrationTarget: 2500, // ml per day
  },
  doctor: {
    id: "d1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    role: "doctor",
    avatar: "https://i.pravatar.cc/150?img=5",
    specialization: "Internal Medicine",
    patients: ["p1", "p2", "p3"],
  },
  admin: {
    id: "a1",
    name: "Admin User",
    email: "admin@healthsystem.com",
    role: "admin",
    avatar: "https://i.pravatar.cc/150?img=10",
  },
};

const mockPatients = [
  {
    id: "p1",
    name: "John Smith",
    age: 34,
    gender: "Male",
    hydrationLevel: 65, // percentage
    lastReading: "2024-01-15T10:30:00Z",
    status: "normal",
    dailyIntake: 1800,
    targetIntake: 2500,
  },
  {
    id: "p2",
    name: "Emily Davis",
    age: 28,
    gender: "Female",
    hydrationLevel: 42,
    lastReading: "2024-01-15T10:25:00Z",
    status: "low",
    dailyIntake: 1200,
    targetIntake: 2200,
  },
  {
    id: "p3",
    name: "Michael Brown",
    age: 45,
    gender: "Male",
    hydrationLevel: 82,
    lastReading: "2024-01-15T10:20:00Z",
    status: "high",
    dailyIntake: 2800,
    targetIntake: 2500,
  },
];

const generateHydrationHistory = (patientId, days = 7) => {
  const history = [];
  const now = new Date();
  for (let i = days * 24; i >= 0; i -= 2) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseLevel = 60 + Math.sin(i / 24) * 15;
    const variation = (Math.random() - 0.5) * 10;
    history.push({
      time: time.toISOString(),
      level: Math.round(Math.max(30, Math.min(95, baseLevel + variation))),
      intake: Math.floor(1500 + Math.random() * 1000),
    });
  }
  return history;
};

const generateMockNotifications = (lang = "pt") => {
  const t = translations[lang];
  return [
    {
      id: "n1",
      userId: "p1",
      type: "alert",
      title: t.lowHydrationAlert,
      message: t.drinkWaterMsg.replace("{level}", "45"),
      time: "2024-01-15T09:15:00Z",
      read: false,
      priority: "high",
    },
    {
      id: "n2",
      userId: "d1",
      type: "patient_alert",
      title: t.patientAlert,
      message: t.patientAlertMsg.replace("{name}", "John Smith"),
      time: "2024-01-15T09:15:00Z",
      read: false,
      priority: "high",
      patientId: "p1",
    },
    {
      id: "n3",
      userId: "p1",
      type: "reminder",
      title: t.hydrationReminder,
      message: t.reminderMsg.replace("{percent}", "20"),
      time: "2024-01-15T08:00:00Z",
      read: true,
      priority: "medium",
    },
    {
      id: "n4",
      userId: "a1",
      type: "system",
      title: t.systemAlert,
      message: t.systemAlertMsg.replace("{count}", "3"),
      time: "2024-01-15T07:30:00Z",
      read: false,
      priority: "high",
    },
  ];
};

// ─── LANGUAGE SELECTOR ─────────────────────────────────────────────────────────
const LanguageSelector = ({ language, setLanguage, t }) => {
  return (
    <div className="relative group">
      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center space-x-1">
        <Globe className="w-5 h-5" />
        <span className="text-xs">{language === "pt" ? "PT" : "EN"}</span>
      </button>
      <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <button
          onClick={() => setLanguage("pt")}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg ${language === "pt" ? "text-blue-500 bg-blue-50" : "text-gray-700"}`}
        >
          {t.portuguese}
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg ${language === "en" ? "text-blue-500 bg-blue-50" : "text-gray-700"}`}
        >
          {t.english}
        </button>
      </div>
    </div>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const testCredentials = {
  patient: { email: "john.smith@email.com", password: "patient123" },
  doctor: { email: "sarah.johnson@hospital.com", password: "doctor123" },
  admin: { email: "admin@healthsystem.com", password: "admin123" }
};

const LoginPage = ({ onLogin, onNavigate, language, setLanguage, selectedRole, onRoleSelect }) => {
  const t = translations[language];
  const [email, setEmail] = useState(testCredentials[selectedRole].email);
  const [password, setPassword] = useState(testCredentials[selectedRole].password);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isTestUser = Object.values(testCredentials).some(
    (tc) => tc.email === email
  );

  useEffect(() => {
    setEmail(testCredentials[selectedRole].email);
    setPassword(testCredentials[selectedRole].password);
    setPhone("");
  }, [selectedRole]);

  const handleRoleSelect = (role) => {
    onRoleSelect(role);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await client.post("/auth/login", {
        email,
        password,
      });

      const { user, token, refreshToken } = data;

      if (!user || !token) {
        throw new Error("Resposta inválida do servidor");
      }

      setStoredToken(token);
      if (refreshToken) {
        setStoredRefreshToken(refreshToken);
      }

      if (phone && phone.trim()) {
        try {
          await updateUserPhone(phone.trim());
        } catch (err) {
          console.error('Failed to update phone:', err);
        }
      }

      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || "Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  if (selectedRole === "admin") {
    return (
      <div className="min-h-screen flex">
        {/* Left Sidebar */}
        <div className="w-1/2 bg-gray-900 text-white p-8 flex flex-col justify-between hidden md:flex">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.appName}</h1>
                <p className="text-xs text-gray-400">{t.subtitle}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-8">Administrator Portal</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-gray-300">Desktop-Class Interface</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Server className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-sm text-gray-300">System Health Monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm text-gray-300">Real-Time Analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm text-gray-300">Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <span className="text-sm text-gray-300">User Management</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All Systems Operational</span>
            </div>
            <p>v2.4.1 • Build 2024.01</p>
          </div>
        </div>

        {/* Right Form */}
        <div className="flex-1 bg-white p-8 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="md:hidden flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">{t.appName}</h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Admin Login</h2>
            <p className="text-sm text-gray-500 mb-6">Sign in to the administrator dashboard</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="admin@healthsystem.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              {isTestUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.phone}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="+258 84 000 0000"
                  />
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                {["patient", "doctor", "admin"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      selectedRole === role
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {role === "patient" && t.patient}
                    {role === "doctor" && t.doctor}
                    {role === "admin" && t.admin}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors mt-6 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading ? "A entrar..." : t.signIn}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => onNavigate("register")}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {t.noAccount} {t.register}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto">
      <div className="flex justify-end mb-2">
        <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
      </div>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{t.appName}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.password}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        {isTestUser && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.phone}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="+258 84 000 0000"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
          {["patient", "doctor", "admin"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleSelect(role)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedRole === role
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {role === "patient" && t.patient}
              {role === "doctor" && t.doctor}
              {role === "admin" && t.admin}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors mt-6 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? "A entrar..." : t.signIn}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => onNavigate("register")}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            {t.noAccount} {t.register}
          </button>
        </div>
      </form>
    </div>
  );
};


// ─── PATIENT DASHBOARD ─────────────────────────────────────────────────────────
const PatientDashboard = ({ user, onLogout, onNavigate, language, setLanguage, unreadCount, setAuthUser }) => {
  const t = translations[language];
  const [currentHydration, setCurrentHydration] = useState(65);
  const [history, setHistory] = useState(generateHydrationHistory(user.id));
  const [readings, setReadings] = useState([]);
  const [liveHealth, setLiveHealth] = useState(null);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [isAllReadingsOpen, setIsAllReadingsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const defaultLimits = {
    heartRate: { critical: 120, low: 60 },
    spo2: { critical: 90, low: 95 },
    bloodPressure: { critical: 140, low: 90 },
  };

  const [limits, setLimits] = useState(user.limits || defaultLimits);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsMessage, setLimitsMessage] = useState("");

  const updateLimit = (category, field, value) => {
    setLimits((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value === "" ? "" : parseInt(value) || 0,
      },
    }));
  };

  const handleSaveLimits = async () => {
    setSavingLimits(true);
    setLimitsMessage("");
    try {
      await updateUserLimits(limits);
      setLimitsMessage(language === "pt" ? "Limites guardados" : "Limits saved");
      setAuthUser({ ...user, limits });
      setTimeout(() => setLimitsMessage(""), 3000);
    } catch (err) {
      setLimitsMessage(language === "pt" ? "Erro ao guardar" : "Failed to save");
    } finally {
      setSavingLimits(false);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const { data } = await getNotifications();
      setRecentNotifications(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
    }
  };

  useEffect(() => {
    fetchRecentNotifications();
    const interval = setInterval(fetchRecentNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hydration simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 5;
      setCurrentHydration((prev) => {
        const newLevel = Math.round(Math.max(30, Math.min(95, prev + change)));
        setHistory((h) => [
          ...h.slice(1),
          { time: new Date().toISOString(), level: newLevel, intake: Math.floor(1500 + Math.random() * 1000) },
        ]);
        return newLevel;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch health readings from API
  const fetchReadings = async () => {
    try {
      const { data } = await getHealthReadings();
      setReadings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch health readings:', err);
    } finally {
      setLoadingReadings(false);
    }
  };

  useEffect(() => {
    fetchReadings();
    const interval = setInterval(fetchReadings, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleHealthUpdate = (displayed) => {
    setLiveHealth(displayed);
  };

  const handleSaveReading = async (readingData) => {
    try {
      await createHealthReading({
        heartRate: readingData.heartRate,
        spo2: readingData.spo2,
        bloodPressure: readingData.bloodPressure,
        deviceId: readingData.deviceId,
      });
      fetchReadings();
    } catch (err) {
      console.error('Failed to save health reading:', err);
    }
  };

  const handleDisconnect = () => {
    setLiveHealth(null);
  };

  const status = currentHydration < 50 ? "low" : currentHydration > 80 ? "high" : "normal";
  const statusColor = status === "low" ? "text-red-500" : status === "high" ? "text-amber-500" : "text-green-500";
  const statusText = status === "low" ? t.low : status === "high" ? t.high : t.normal;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="font-semibold text-gray-800">{user.name}</h2>
            <p className="text-xs text-gray-500">{t.patient}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
          <button
            onClick={() => onNavigate("notifications")}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={onLogout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Watch / Health Readings */}
        {isNative ? (
        
          <div>

          <WatchConnect
            onHealthUpdate={handleHealthUpdate}
            onDisconnect={handleDisconnect}
            savedReadings={readings}
            onSaveReading={handleSaveReading}
            language={language}
          />


          <WatchHealthDisplay
            hideTotals={true}
            readings={readings}
            loading={loadingReadings}
            onViewAll={() => setIsAllReadingsOpen(true)}
            language={language}
            setLanguage={setLanguage}
          />

          </div>
        ) : (
          <WatchHealthDisplay
            readings={readings}
            loading={loadingReadings}
            onViewAll={() => setIsAllReadingsOpen(true)}
            language={language}
            setLanguage={setLanguage}
          />
        )}

        <AllHealthReadingsDialog
          open={isAllReadingsOpen}
          onClose={() => setIsAllReadingsOpen(false)}
          readings={readings}
        />

        {/* Temporary Simulation Buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Simulação (Teste)</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                try {
                  await createHealthReading({
                    heartRate: 72,
                    spo2: 98,
                    bloodPressure: '120/80',
                    systolic: 120,
                    diastolic: 80,
                    deviceId: 'simulator',
                  });
                  fetchReadings();
                } catch (err) {
                  console.error('Simulation failed:', err);
                }
              }}
              className="py-2 px-3 bg-green-500 text-white text-xs rounded-lg font-medium hover:bg-green-600"
            >
              Normal Reading
            </button>
            <button
              onClick={async () => {
                try {
                  await createHealthReading({
                    heartRate: 140,
                    spo2: 85,
                    bloodPressure: '180/110',
                    systolic: 180,
                    diastolic: 110,
                    deviceId: 'simulator',
                  });
                  fetchReadings();
                } catch (err) {
                  console.error('Simulation failed:', err);
                }
              }}
              className="py-2 px-3 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600"
            >
              Critical Reading
            </button>
            <button
              onClick={async () => {
                try {
                  await createHealthReading({
                    heartRate: 45,
                    spo2: 92,
                    bloodPressure: '85/55',
                    systolic: 85,
                    diastolic: 55,
                    deviceId: 'simulator',
                  });
                  fetchReadings();
                } catch (err) {
                  console.error('Simulation failed:', err);
                }
              }}
              className="py-2 px-3 bg-amber-500 text-white text-xs rounded-lg font-medium hover:bg-amber-600"
            >
              Low Heart Rate
            </button>
            <button
              onClick={async () => {
                try {
                  await createHealthReading({
                    heartRate: Math.floor(60 + Math.random() * 40),
                    spo2: Math.floor(90 + Math.random() * 10),
                    bloodPressure: `${110 + Math.floor(Math.random() * 30)}/${70 + Math.floor(Math.random() * 20)}`,
                    systolic: 110 + Math.floor(Math.random() * 30),
                    diastolic: 70 + Math.floor(Math.random() * 20),
                    deviceId: 'simulator',
                  });
                  fetchReadings();
                } catch (err) {
                  console.error('Simulation failed:', err);
                }
              }}
              className="py-2 px-3 bg-blue-500 text-white text-xs rounded-lg font-medium hover:bg-blue-600"
            >
              Random Reading
            </button>
          </div>
        </div>

        {/* Health Limits */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">⚙️ {language === "pt" ? "Limites de Saúde" : "Health Limits"}</h3>
            <button
              onClick={handleSaveLimits}
              disabled={savingLimits}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {savingLimits ? (language === "pt" ? "A guardar..." : "Saving...") : (language === "pt" ? "Guardar" : "Save")}
            </button>
          </div>
          {limitsMessage && (
            <div className={`mb-3 p-2 rounded-lg text-xs ${limitsMessage.includes("guardados") || limitsMessage.includes("saved") ? "bg-green-50 border border-green-200 text-green-600" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {limitsMessage}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">❤️ {t.heartRate} (BPM)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">{t.critical} ({`>`})</label>
                  <input
                    type="number"
                    value={limits.heartRate.critical}
                    onChange={(e) => updateLimit("heartRate", "critical", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">{t.low} ({`<`})</label>
                  <input
                    type="number"
                    value={limits.heartRate.low}
                    onChange={(e) => updateLimit("heartRate", "low", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">🫁 SpO₂ (%)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">{t.critical} ({`<`})</label>
                  <input
                    type="number"
                    value={limits.spo2.critical}
                    onChange={(e) => updateLimit("spo2", "critical", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">{t.low} ({`<`})</label>
                  <input
                    type="number"
                    value={limits.spo2.low}
                    onChange={(e) => updateLimit("spo2", "low", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">🩸 {t.systolic} (mmHg)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">{t.critical} ({`>`})</label>
                  <input
                    type="number"
                    value={limits.bloodPressure.critical}
                    onChange={(e) => updateLimit("bloodPressure", "critical", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">{t.low} ({`<`})</label>
                  <input
                    type="number"
                    value={limits.bloodPressure.low}
                    onChange={(e) => updateLimit("bloodPressure", "low", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.recentAlerts}</h3>
          <div className="space-y-2">
            {recentNotifications.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2" onClick={() => onNavigate("notifications")}>
                {unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Sem alertas recentes"}
              </p>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onNavigate("notifications")}
                  className={`p-3 rounded-lg cursor-pointer ${n.read ? "bg-white" : "bg-blue-50 border-l-4 border-blue-500"}`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`p-1.5 rounded-lg ${n.priority === "high" ? "bg-red-100" : "bg-gray-100"}`}>
                      <AlertTriangle className={`w-3.5 h-3.5 ${n.priority === "high" ? "text-red-500" : "text-gray-500"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-around">
        <button className="flex flex-col items-center text-blue-500">
          <Activity className="w-6 h-6" />
          <span className="text-xs mt-1">{t.dashboard}</span>
        </button>
        <button
          onClick={() => onNavigate("history")}
          className="flex hidden flex-col items-center text-gray-400"
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs mt-1">{t.history}</span>
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className="flex flex-col items-center text-gray-400"
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">{t.settings}</span>
        </button>
      </div>
    </div>
  );
};

// ─── DOCTOR DASHBOARD ──────────────────────────────────────────────────────────
const DoctorDashboard = ({ user, onLogout, onNavigate, language, setLanguage, unreadCount }) => {
  const t = translations[language];
  const [patients, setPatients] = useState([]);
  const [readingsMap, setReadingsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, readingsRes] = await Promise.all([
          getPatients(),
          getHealthReadings(),
        ]);
        const patientsData = Array.isArray(patientsRes.data) ? patientsRes.data : [];
        const readingsData = Array.isArray(readingsRes.data) ? readingsRes.data : [];

        setPatients(patientsData);

        const map = {};
        readingsData.forEach(r => {
          const pid = r.patientId || r.patient?.id;
          if (!map[pid]) map[pid] = [];
          map[pid].push(r);
        });
        setReadingsMap(map);
      } catch (err) {
        console.error('Failed to fetch doctor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPatientLatestReading = (patientId) => {
    const list = readingsMap[patientId];
    return list && list.length > 0 ? list[0] : null;
  };

  const alertPatients = patients.filter((p) => {
    const reading = getPatientLatestReading(p.id);
    if (!reading) return false;
    const hr = reading.heartRate;
    return hr !== null && (hr < 50 || hr > 120);
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-black">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
         
          <div>
            <h2 className="font-semibold text-gray-800">{user.name}</h2>
            <p className="text-xs text-gray-500">{user.specialization || t.doctor}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
          <button
            onClick={() => onNavigate("notifications")}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={onLogout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.totalPatients}</p>
            <p className="text-2xl font-bold text-gray-800">{patients.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.alerts}</p>
            <p className="text-2xl font-bold text-red-500">{alertPatients.length}</p>
          </div>
        </div>

        {/* Alert Patients */}
        {alertPatients.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
              {t.patientsNeedingAttention}
            </h3>
            <div className="space-y-3">
              {alertPatients.map((p) => {
                const reading = getPatientLatestReading(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => onNavigate("patient-detail", p.id)}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.user?.name || p.name}</p>
                        <p className="text-xs text-gray-500">
                          ❤️ {reading?.heartRate !== null ? `${reading.heartRate} BPM` : '--'}
                          {reading?.spo2 !== null ? ` | 🫁 ${reading.spo2}%` : ''}
                          {reading?.bloodPressure ? ` | 🩸 ${reading.bloodPressure}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
                      {t.critical}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Patients */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.allPatients}</h3>
          {loading ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : patients.length === 0 ? (
            <p className="text-xs text-gray-500">{t.noReadings}</p>
          ) : (
            <div className="space-y-3">
              {patients.map((p) => {
                const reading = getPatientLatestReading(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => onNavigate("patient-detail", p.id)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.user?.name || p.name}</p>
                        <p className="text-xs text-gray-500">
                          {reading ? (
                            <>
                              ❤️ {reading.heartRate !== null ? `${reading.heartRate} BPM` : '--'}
                              {reading.spo2 !== null ? ` | 🫁 ${reading.spo2}%` : ''}
                              {reading.bloodPressure ? ` | 🩸 ${reading.bloodPressure}` : ''}
                            </>
                          ) : (
                            t.noReadings
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {reading?.createdAt ? new Date(reading.createdAt).toLocaleTimeString() : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-around">
        <button className="flex flex-col items-center text-blue-500">
          <Stethoscope className="w-6 h-6" />
          <span className="text-xs mt-1">{t.patients}</span>
        </button>
        <button
          onClick={() => onNavigate("analytics")}
          className="flex hidden flex-col items-center text-gray-400"
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs mt-1">{t.analytics}</span>
        </button>
        <button
          onClick={() => onNavigate("settings")}
          className="flex flex-col items-center text-gray-400"
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">{t.settings}</span>
        </button>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, sub, color = "text-gray-700", bg = "bg-white" }) => (
  <div className={`${bg} rounded-xl p-3 shadow-sm border border-gray-100`}>
    <div className="flex items-center space-x-2 mb-1">
      <span className="text-sm">{icon}</span>
      <p className="text-[10px] text-gray-500 truncate">{label}</p>
    </div>
    <p className={`text-lg font-bold ${color}`}>
      {value}
      {sub && <span className="text-[10px] text-gray-400 ml-1">{sub}</span>}
    </p>
  </div>
);

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
const AdminDashboard = ({ user, onLogout, onNavigate, language, setLanguage, unreadCount }) => {
  const t = translations[language];
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    activeAlerts: 0,
    systemStatus: "operational",
    totalReadings: 0,
    avgHeartRate: '--',
    avgSpO2: '--',
    avgSystolic: '--',
    lowSpO2Alerts: 0,
    abnormalBPAlerts: 0,
    criticalReadings: 0,
    healthMeasurements: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lowBatteryDevices: 0,
    userActivity: 0,
    newUsers: 0,
    onlineDevices: 0,
    sleepRecords: 0,
    stepsRecorded: 0,
    heartRateRecords: 0,
    bloodPressureRecords: 0,
    spo2Records: 0,
    bluetoothConnections: 0,
    unresolvedAlerts: 0,
    avgMeasurementsPerUser: 0,
    totalAdmins: 0,
    totalHospitals: 3,
    serverUptime: "99.98%",
    apiResponseTime: "45ms",
    databaseSize: "2.4 GB",
    activeSessions: 12,
    dataProcessed: "1.2 GB",
    errorRate: "0.02%",
    systemLoad: "34%",
    networkStatus: "operational",
    securityStatus: "secure",
    backups: 7,
    lastBackup: "2h ago",
    failedLogins: 3,
    auditLogs: 1240,
    storageUsed: "68%",
    cpuUsage: "34%",
    memoryUsage: "62%",
  });
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, readingsRes] = await Promise.all([
          getUsers(),
          getHealthReadings(),
        ]);

        const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
        const readingsData = Array.isArray(readingsRes.data) ? readingsRes.data : [];

        setReadings(readingsData);

        const totalUsers = usersData.length;
        const totalDoctors = usersData.filter((u) => u.role === 'doctor').length;
        const totalPatients = usersData.filter((u) => u.role === 'patient').length;

        const hrValues = readingsData.map((r) => r.heartRate).filter((v) => v !== null);
        const spo2Values = readingsData.map((r) => r.spo2).filter((v) => v !== null);
        const systolicValues = readingsData.map((r) => r.systolic).filter((v) => v !== null);

        const avgHeartRate = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : '--';
        const avgSpO2 = spo2Values.length ? Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length) : '--';
        const avgSystolic = systolicValues.length ? Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length) : '--';

        const heartRateAlerts = readingsData.filter((r) => r.heartRate !== null && (r.heartRate < 50 || r.heartRate > 120));
        const lowSpO2Alerts = readingsData.filter((r) => r.spo2 !== null && r.spo2 < 90);
        const abnormalBPAlerts = readingsData.filter((r) => r.systolic !== null && (r.systolic > 140 || r.systolic < 90));
        const criticalReadings = readingsData.filter((r) => r.heartRate !== null && (r.heartRate < 40 || r.heartRate > 150));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayReadings = readingsData.filter((r) => new Date(r.createdAt) >= today);
        const healthMeasurements = todayReadings.length;

        const avgMeasurementsPerUser = totalPatients > 0 ? Math.round(readingsData.length / totalPatients) : 0;

        const successfulSyncs = Math.floor(Math.random() * 50) + 100;
        const failedSyncs = Math.floor(Math.random() * 5);
        const lowBatteryDevices = Math.floor(Math.random() * 8);
        const onlineDevices = Math.floor(Math.random() * 20) + 10;
        const sleepRecords = Math.floor(Math.random() * 30) + 5;
        const stepsRecorded = Math.floor(Math.random() * 50000) + 10000;
        const heartRateRecords = hrValues.length;
        const bloodPressureRecords = systolicValues.length;
        const spo2Records = spo2Values.length;
        const bluetoothConnections = Math.floor(Math.random() * 15) + 5;
        const newUsers = Math.floor(Math.random() * 5) + 1;
        const unresolvedAlerts = heartRateAlerts.length;
        const totalAdmins = usersData.filter((u) => u.role === 'admin').length;

        setStats({
          totalUsers,
          totalDoctors,
          totalPatients,
          activeAlerts: heartRateAlerts.length,
          systemStatus: "operational",
          totalReadings: readingsData.length,
          avgHeartRate,
          avgSpO2,
          avgSystolic,
          lowSpO2Alerts: lowSpO2Alerts.length,
          abnormalBPAlerts: abnormalBPAlerts.length,
          criticalReadings: criticalReadings.length,
          healthMeasurements,
          successfulSyncs,
          failedSyncs,
          lowBatteryDevices,
          userActivity: Math.floor(Math.random() * 300) + 50,
          newUsers,
          onlineDevices,
          sleepRecords,
          stepsRecorded,
          heartRateRecords,
          bloodPressureRecords,
          spo2Records,
          bluetoothConnections,
          unresolvedAlerts,
          avgMeasurementsPerUser,
          totalAdmins,
          totalHospitals: 3,
          serverUptime: "99.98%",
          apiResponseTime: `${Math.floor(Math.random() * 50) + 20}ms`,
          databaseSize: `${(Math.random() * 3 + 1).toFixed(1)} GB`,
          activeSessions: Math.floor(Math.random() * 20) + 5,
          dataProcessed: `${(Math.random() * 2 + 0.5).toFixed(1)} GB`,
          errorRate: `${(Math.random() * 0.1).toFixed(3)}%`,
          systemLoad: `${Math.floor(Math.random() * 60) + 10}%`,
          networkStatus: "operational",
          securityStatus: "secure",
          backups: Math.floor(Math.random() * 10) + 1,
          lastBackup: `${Math.floor(Math.random() * 12) + 1}h ago`,
          failedLogins: Math.floor(Math.random() * 8),
          auditLogs: Math.floor(Math.random() * 2000) + 500,
          storageUsed: `${Math.floor(Math.random() * 40) + 40}%`,
          cpuUsage: `${Math.floor(Math.random() * 60) + 10}%`,
          memoryUsage: `${Math.floor(Math.random() * 50) + 30}%`,
        });
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const alertReadings = readings.filter((r) => r.heartRate !== null && (r.heartRate < 50 || r.heartRate > 120));
  const lowSpO2Readings = readings.filter((r) => r.spo2 !== null && r.spo2 < 90);
  const abnormalBPReadings = readings.filter((r) => r.systolic !== null && (r.systolic > 140 || r.systolic < 90));
  const criticalReadingsList = readings.filter((r) => r.heartRate !== null && (r.heartRate < 40 || r.heartRate > 150));

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-semibold text-gray-800">{t.administrator}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{user.name}</h2>
            <p className="text-xs text-gray-500">{t.administrator}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
          <button
            onClick={() => onNavigate("notifications")}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={onLogout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="p-4 space-y-1">
            <button className="w-full flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-medium">{t.overview}</span>
            </button>
            <button
              onClick={() => onNavigate("users")}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">{t.users}</span>
            </button>
            <button
              onClick={() => onNavigate("analytics")}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">{t.analytics}</span>
            </button>
            <button
              onClick={() => onNavigate("settings")}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">{t.settings}</span>
            </button>
          </div>
          <div className="mt-auto p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">Admin</p>
                <p className="text-[10px] text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon="👥" label={t.totalUsers} value={stats.totalUsers} color="text-blue-600" bg="bg-white" />
            <MetricCard icon="📈" label={t.totalReadings} value={stats.totalReadings} color="text-indigo-600" bg="bg-white" />
            <MetricCard icon="❤️" label={t.healthMeasurements} value={stats.healthMeasurements} color="text-red-600" bg="bg-white" />
            <MetricCard icon="🚨" label={t.alerts} value={stats.activeAlerts} color="text-amber-600" bg="bg-white" />
            <MetricCard icon="👨‍⚕️" label={t.totalDoctors} value={stats.totalDoctors} color="text-emerald-600" bg="bg-white" />
            <MetricCard icon="🛡️" label={t.totalAdmins} value={stats.totalAdmins} color="text-purple-600" bg="bg-white" />
            <MetricCard icon="🏥" label={t.totalHospitals} value={stats.totalHospitals} color="text-sky-600" bg="bg-white" />
            <MetricCard icon="👤" label={t.totalPatients} value={stats.totalPatients} color="text-pink-600" bg="bg-white" />
          </div>

          {/* System Metrics */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🖥️ {t.systemStatus}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon="🟢" label={t.serverUptime} value={stats.serverUptime} color="text-green-600" bg="bg-white" />
              <MetricCard icon="⚡" label={t.apiResponseTime} value={stats.apiResponseTime} color="text-amber-600" bg="bg-white" />
              <MetricCard icon="💾" label={t.databaseSize} value={stats.databaseSize} color="text-purple-600" bg="bg-white" />
              <MetricCard icon="🔗" label={t.activeSessions} value={stats.activeSessions} color="text-blue-600" bg="bg-white" />
              <MetricCard icon="📊" label={t.dataProcessed} value={stats.dataProcessed} color="text-indigo-600" bg="bg-white" />
              <MetricCard icon="⚠️" label={t.errorRate} value={stats.errorRate} color="text-red-600" bg="bg-white" />
              <MetricCard icon="📟" label={t.systemLoad} value={stats.systemLoad} color="text-gray-700" bg="bg-white" />
              <MetricCard icon="🌐" label={t.networkStatus} value={stats.networkStatus === "operational" ? t.operational : stats.networkStatus} color="text-green-600" bg="bg-white" />
            </div>
          </div>

          {/* Security & Storage */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🔒 Security & Storage</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon="🛡️" label={t.securityStatus} value={stats.securityStatus === "secure" ? "Secure" : stats.securityStatus} color="text-green-600" bg="bg-white" />
              <MetricCard icon="💿" label={t.storageUsed} value={stats.storageUsed} color="text-blue-600" bg="bg-white" />
              <MetricCard icon="🖥️" label={t.cpuUsage} value={stats.cpuUsage} color="text-indigo-600" bg="bg-white" />
              <MetricCard icon="🧠" label={t.memoryUsage} value={stats.memoryUsage} color="text-purple-600" bg="bg-white" />
              <MetricCard icon="📦" label={t.backups} value={stats.backups} color="text-emerald-600" bg="bg-white" />
              <MetricCard icon="🕐" label={t.lastBackup} value={stats.lastBackup} color="text-gray-600" bg="bg-white" />
              <MetricCard icon="❌" label={t.failedLogins} value={stats.failedLogins} color="text-red-600" bg="bg-white" />
              <MetricCard icon="📋" label={t.auditLogs} value={stats.auditLogs.toLocaleString()} color="text-gray-600" bg="bg-white" />
            </div>
          </div>

          {/* Health Averages */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">📈 Averages</h3>
            <div className="grid grid-cols-3 gap-4">
              <MetricCard icon="❤️" label={t.avgHeartRate} value={`${stats.avgHeartRate}`} sub="BPM" color="text-red-600" bg="bg-white" />
              <MetricCard icon="🫁" label={t.avgSpO2} value={`${stats.avgSpO2}`} sub="%" color="text-sky-600" bg="bg-white" />
              <MetricCard icon="🩸" label={t.avgSystolic} value={`${stats.avgSystolic}`} sub="mmHg" color="text-purple-600" bg="bg-white" />
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.systemStatus}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-800 capitalize">{stats.systemStatus === "operational" ? t.operational : stats.systemStatus}</span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> API</span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> DB</span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> BT</span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> ML</span>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
              {t.systemAlerts}
            </h3>
            <div className="space-y-2">
              {[...alertReadings, ...lowSpO2Readings, ...abnormalBPReadings, ...criticalReadingsList].length > 0 ? (
                [...alertReadings, ...lowSpO2Readings, ...abnormalBPReadings, ...criticalReadingsList]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 8)
                  .map((r, i) => {
                    let label = '';
                    let colorClass = 'text-amber-500';
                    if (r.heartRate !== null && (r.heartRate < 50 || r.heartRate > 120)) {
                      label = `❤️ Heart Rate: ${r.heartRate} BPM`;
                      colorClass = r.heartRate < 40 || r.heartRate > 150 ? 'text-red-500' : 'text-amber-500';
                    } else if (r.spo2 !== null && r.spo2 < 90) {
                      label = `🫁 SpO₂: ${r.spo2}%`;
                      colorClass = 'text-red-500';
                    } else if (r.systolic !== null && (r.systolic > 140 || r.systolic < 90)) {
                      label = `🩸 BP: ${r.bloodPressure || r.systolic}`;
                      colorClass = 'text-amber-500';
                    }
                    return (
                      <div key={r.id || i} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                        <AlertTriangle className={`w-4 h-4 ${colorClass} mt-0.5`} />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500">
                            {r.user?.name || 'Unknown'} - {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No active alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── NOTIFICATIONS PAGE ────────────────────────────────────────────────────────
const NotificationsPage = ({ user, onBack, language, setLanguage, onNotificationMarkedRead, unreadCount }) => {
  const t = translations[language];
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationRead(id);
      onNotificationMarkedRead?.();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.notifications}</h2>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
          <div className="relative p-2 text-gray-600">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">Sem notificações</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 rounded-xl shadow-sm cursor-pointer transition-all ${
                  n.read ? "bg-white" : "bg-blue-50 border-l-4 border-blue-500"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    n.priority === "high" ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      n.priority === "high" ? "text-red-500" : "text-gray-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-800">{n.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── HISTORY PAGE ───────────────────────────────────────────────────────────────
const HistoryPage = ({ user, onBack, language, setLanguage }) => {
  const t = translations[language];
  const [history] = useState(generateHydrationHistory(user.id, 14));

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.hydrationHistory}</h2>
        </div>
        <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.fourteenDayTrend}</h3>
          <HealthChart data={history} color="#3b82f6" colorBy="hydration" />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.dailyRecords}</h3>
          <div className="space-y-2">
            {history
              .filter((_, i) => i % 4 === 0)
              .slice(0, 7)
              .map((h, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">
                    {new Date(h.time).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-800">{h.level.toFixed(0)}%</span>
                    <Droplet className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PATIENT DETAIL PAGE ───────────────────────────────────────────────────────
const PatientDetailPage = ({ patientId, onBack, language, setLanguage, unreadCount }) => {
  const t = translations[language];
  const [patient, setPatient] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnlargedChartOpen, setIsEnlargedChartOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientRes, readingsRes] = await Promise.all([
          getPatient(patientId),
          getHealthReadings(),
        ]);
        setPatient(patientRes.data);
        const allReadings = Array.isArray(readingsRes.data) ? readingsRes.data : [];
        const patientReadings = allReadings.filter(
          (r) => (r.patientId || r.patient?.id) === patientId
        );
        setReadings(patientReadings);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch patient data:', err);
        setError(t.failedToLoadPatientDetails);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.patientDetails}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.patientDetails}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500">{error || t.patientNotFound}</p>
        </div>
      </div>
    );
  }

  const patientName = patient.user?.name || patient.name || t.unknown;
  const patientAge = patient.age || '--';
  const patientGender = patient.gender || '--';
  const latestReading = readings[0] || null;

  const chartData = readings
    .slice()
    .reverse()
    .map((r) => ({
      time: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
      level: r.systolic,
    }))
    .filter((d) => d.level !== null && d.level !== undefined);

  const hrValues = readings.map((r) => r.heartRate).filter((v) => v !== null);
  const spo2Values = readings.map((r) => r.spo2).filter((v) => v !== null);
  const bpValues = readings.map((r) => r.systolic).filter((v) => v !== null);

  const avgHR = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : '--';
  const avgSpO2 = spo2Values.length ? Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length) : '--';
  const avgBP = bpValues.length ? Math.round(bpValues.reduce((a, b) => a + b, 0) / bpValues.length) : '--';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.patientDetails}</h2>
        </div>
        <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Patient Profile */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{patientName}</h3>
              <p className="text-sm text-gray-500">{t.age}: {patientAge} | {t.gender}: {patientGender}</p>
            </div>
          </div>

          {/* Latest Health Readings */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t.heartRate}</p>
              <p className="text-lg font-bold text-gray-800">
                {latestReading?.heartRate !== null ? `${latestReading.heartRate} BPM` : '--'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {latestReading?.createdAt ? new Date(latestReading.createdAt).toLocaleString() : ''}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t.spo2}</p>
              <p className="text-lg font-bold text-gray-800">
                {latestReading?.spo2 !== null ? `${latestReading.spo2}%` : '--'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {latestReading?.createdAt ? new Date(latestReading.createdAt).toLocaleString() : ''}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t.bloodPressure}</p>
              <p className="text-lg font-bold text-gray-800">
                {latestReading?.bloodPressure || '--'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {latestReading?.createdAt ? new Date(latestReading.createdAt).toLocaleString() : ''}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t.totalReadings}</p>
              <p className="text-lg font-bold text-gray-800">{readings.length}</p>
            </div>
          </div>

          {/* Health Stats */}
          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">{t.healthStatistics}</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-gray-500">{t.avgHR}</p>
                <p className="text-sm font-bold text-gray-800">{avgHR} BPM</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">{t.avgSpO2}</p>
                <p className="text-sm font-bold text-gray-800">{avgSpO2}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">{t.avgBP}</p>
                <p className="text-sm font-bold text-gray-800">{avgBP}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Health History Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t.bloodPressureHistory}</h3>
            {chartData.length > 1 && (
              <button
                onClick={() => setIsEnlargedChartOpen(true)}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                {t.viewLarger}
              </button>
            )}
          </div>
          {chartData.length > 1 ? (
            <HealthChart data={chartData} color="#8b5cf6" colorBy="bloodPressure" />
          ) : (
            <p className="text-xs text-gray-500 text-center py-8">{t.notEnoughData}</p>
          )}
        </div>

        {/* Recent Alerts */}
        {readings.some((r) => (r.heartRate !== null && (r.heartRate < 50 || r.heartRate > 120))) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
              {t.recentAlerts}
            </h3>
            <div className="space-y-2">
              {readings
                .filter((r) => r.heartRate !== null && (r.heartRate < 50 || r.heartRate > 120))
                .slice(0, 5)
                .map((r, i) => (
                  <div key={r.id || i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-800">
                      {t.heartRateAlert.replace('{value}', r.heartRate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Report Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <FileText className="w-4 h-4 text-blue-500 mr-2" />
            {t.healthReport}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-600">{t.lastCheckup}</span>
              <span className="text-xs text-gray-800">
                {latestReading?.createdAt ? new Date(latestReading.createdAt).toLocaleDateString() : '--'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-600">{t.doctor_placeholder}</span>
              <span className="text-xs text-gray-800">{patient.user?.name || t.defaultDoctorName}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs text-gray-600">{t.status}</span>
              <span className="text-xs font-medium text-gray-800">
                {latestReading ? t.active : t.noReadingsStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <EnlargedChartDialog
        open={isEnlargedChartOpen}
        onClose={() => setIsEnlargedChartOpen(false)}
        chartData={chartData}
        chartColor="#8b5cf6"
        chartType="line"
        chartMetric="bloodPressure"
      />
    </div>
  );
};

// ─── SETTINGS PAGE ───────────────────────────────────────────────────────────────
const SettingsPage = ({ user, onBack, onLogout, language, setLanguage, setAuthUser }) => {
  const t = translations[language];

  const defaultLimits = {
    heartRate: { critical: 120, low: 60 },
    spo2: { critical: 90, low: 95 },
    bloodPressure: { critical: 140, low: 90 },
  };

  const [limits, setLimits] = useState(user.limits || defaultLimits);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const updateLimit = (category, field, value) => {
    setLimits((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value === "" ? "" : parseInt(value) || 0,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      await updateUserLimits(limits);
      setSaveMessage(language === "pt" ? "Limites guardados com sucesso" : "Limits saved successfully");
      setAuthUser({ ...user, limits });
    } catch (err) {
      setSaveMessage(language === "pt" ? "Erro ao guardar limites" : "Failed to save limits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.settings}</h2>
        </div>
        <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center space-x-4 mb-4">
           
            <div>
              <h3 className="font-medium text-gray-800">{user.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{user.role === "patient" ? t.patient : user.role === "doctor" ? t.doctor : t.admin}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t.email}</span>
              <span className="text-sm text-gray-800">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t.notifications}</span>
              <span className="text-sm text-green-600">{t.enabled}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{t.darkMode}</span>
              <span className="text-sm text-gray-800">{t.off}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">{language === "pt" ? "Limites de Saúde" : "Health Limits"}</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                {language === "pt"
                  ? "Defina os valores limite para quando os seus sinais vitais são considerados críticos ou baixos. Estes valores serão utilizados para gerar alertas e notificações quando as medições estiverem fora dos limites normais."
                  : "Set the threshold values for when your vital signs are considered critical or low. These values will be used to generate alerts and notifications when measurements are outside normal limits."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">❤️ {t.heartRate}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.critical} ({`>`} BPM)</label>
              <input
                type="number"
                value={limits.heartRate.critical}
                onChange={(e) => updateLimit("heartRate", "critical", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.low} ({`<`} BPM)</label>
              <input
                type="number"
                value={limits.heartRate.low}
                onChange={(e) => updateLimit("heartRate", "low", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">🫁 SpO₂</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.critical} ({`<`} %)</label>
              <input
                type="number"
                value={limits.spo2.critical}
                onChange={(e) => updateLimit("spo2", "critical", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.low} ({`<`} %)</label>
              <input
                type="number"
                value={limits.spo2.low}
                onChange={(e) => updateLimit("spo2", "low", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">🩸 {t.systolic} (mmHg)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.critical} ({`>`})</label>
              <input
                type="number"
                value={limits.bloodPressure.critical}
                onChange={(e) => updateLimit("bloodPressure", "critical", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t.low} ({`<`})</label>
              <input
                type="number"
                value={limits.bloodPressure.low}
                onChange={(e) => updateLimit("bloodPressure", "low", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${saveMessage.includes("sucesso") || saveMessage.includes("successfully") ? "bg-green-50 border border-green-200 text-green-600" : "bg-red-50 border border-red-200 text-red-600"}`}>
            {saveMessage}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors mb-4 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {saving ? (language === "pt" ? "A guardar..." : "Saving...") : (language === "pt" ? "Guardar Limites" : "Save Limits")}
        </button>

        <button
          onClick={onLogout}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
        >
          {t.logout}
        </button>
      </div>
    </div>
  );
};

// ─── USERS PAGE (ADMIN) ────────────────────────────────────────────────────────
const UsersPage = ({ onBack, onNavigate, language, setLanguage }) => {
  const t = translations[language];
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data } = await getUsers();
        setUsers(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleBadge = (role) => {
    const colors = {
      patient: 'bg-blue-100 text-blue-600',
      doctor: 'bg-green-100 text-green-600',
      admin: 'bg-purple-100 text-purple-600',
    };
    const labels = {
      patient: t.patient,
      doctor: t.doctor,
      admin: t.admin,
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[role] || 'bg-gray-100 text-gray-600'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const isActive = status === 'active';
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const patients = users.filter((u) => u.role === 'patient');
  const doctors = users.filter((u) => u.role === 'doctor');

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.userManagement}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.userManagement}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.userManagement}</h2>
        </div>
        <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="space-y-2 mb-4">
            {patients.map((u) => {
              const patientId = u.patientProfile?.id || u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => onNavigate("patient-detail", patientId)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.name || u.email}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getRoleBadge(u.role)}
                    {getStatusBadge(u.status)}
                  </div>
                </div>
              );
            })}
            {patients.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No patients found</p>
            )}
          </div>

          <h3 className="text-xs font-medium text-gray-500 mb-2">{t.doctor}</h3>
          <div className="space-y-2">
            {doctors.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.name || u.email}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getRoleBadge(u.role)}
                  {getStatusBadge(u.status)}
                </div>
              </div>
            ))}
            {doctors.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No doctors found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ANALYTICS PAGE ────────────────────────────────────────────────────────────
const AnalyticsPage = ({ onBack, language, setLanguage }) => {
  const t = translations[language];
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: readingsData } = await getHealthReadings();
        const allReadings = Array.isArray(readingsData) ? readingsData : [];
        setReadings(allReadings);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.analytics}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const hrValues = readings.map((r) => r.heartRate).filter((v) => v !== null);
  const spo2Values = readings.map((r) => r.spo2).filter((v) => v !== null);
  const bpValues = readings.map((r) => r.systolic).filter((v) => v !== null);

  const calcStats = (values) => {
    if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  };

  const hrStats = calcStats(hrValues);
  const spo2Stats = calcStats(spo2Values);
  const bpStats = calcStats(bpValues);

  const hrLow = hrValues.filter((v) => v < 60).length;
  const hrNormal = hrValues.filter((v) => v >= 60 && v <= 100).length;
  const hrAttention = hrValues.filter((v) => v > 100 && v <= 120).length;
  const hrCritical = hrValues.filter((v) => v > 120).length;

  const spo2Low = spo2Values.filter((v) => v < 90).length;
  const spo2Attention = spo2Values.filter((v) => v >= 90 && v < 95).length;
  const spo2Normal = spo2Values.filter((v) => v >= 95).length;

  const bpLow = bpValues.filter((v) => v < 90).length;
  const bpNormal = bpValues.filter((v) => v >= 90 && v <= 140).length;
  const bpCritical = bpValues.filter((v) => v > 140).length;

  const calcPercent = (count, total) => total ? Math.round((count / total) * 100) : 0;

  const displayData = [
    { name: language === "pt" ? "Normal" : "Normal", value: 145, color: "#22c55e" },
    { name: language === "pt" ? "Atenção" : "Attention", value: 32, color: "#f59e0b" },
    { name: language === "pt" ? "Crítico" : "Critical", value: 18, color: "#ef4444" },
    { name: language === "pt" ? "Baixo" : "Low", value: 12, color: "#3b82f6" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-800">{t.analytics}</h2>
        </div>
        <LanguageSelector language={language} setLanguage={setLanguage} t={t} />
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Heart Rate Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">❤️ {t.heartRate}</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.avg}</p>
              <p className="text-lg font-bold text-gray-800">{hrStats.avg}</p>
              <p className="text-[10px] text-gray-400">BPM</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.min}</p>
              <p className="text-lg font-bold text-blue-600">{hrStats.min}</p>
              <p className="text-[10px] text-gray-400">BPM</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.max}</p>
              <p className="text-lg font-bold text-red-600">{hrStats.max}</p>
              <p className="text-[10px] text-gray-400">BPM</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-600 font-medium">{t.normalRange} (60-100)</span>
                <span>{calcPercent(hrNormal, hrValues.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${calcPercent(hrNormal, hrValues.length)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-500 font-medium">Atenção (101-120)</span>
                <span>{calcPercent(hrAttention, hrValues.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${calcPercent(hrAttention, hrValues.length)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-500 font-medium">{t.critical} ({`>`}120)</span>
                <span>{calcPercent(hrCritical, hrValues.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${calcPercent(hrCritical, hrValues.length)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-500 font-medium">{t.low} ({`<`}60)</span>
                <span>{calcPercent(hrLow, hrValues.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${calcPercent(hrLow, hrValues.length)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* SpO2 Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🫁 SpO₂</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.avg}</p>
              <p className="text-lg font-bold text-gray-800">{spo2Stats.avg}</p>
              <p className="text-[10px] text-gray-400">%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.min}</p>
              <p className="text-lg font-bold text-blue-600">{spo2Stats.min}</p>
              <p className="text-[10px] text-gray-400">%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.max}</p>
              <p className="text-lg font-bold text-green-600">{spo2Stats.max}</p>
              <p className="text-[10px] text-gray-400">%</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-600 font-medium">Normal (95–100%)</span>
                <span>{calcPercent(spo2Normal, spo2Values.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${calcPercent(spo2Normal, spo2Values.length)}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Geralmente considerado normal</p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-500 font-medium">Atenção (90–94%)</span>
                <span>{calcPercent(spo2Attention, spo2Values.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${calcPercent(spo2Attention, spo2Values.length)}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Merece atenção, especialmente se persistir</p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-500 font-medium">Crítico (&lt;90%)</span>
                <span>{calcPercent(spo2Low, spo2Values.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${calcPercent(spo2Low, spo2Values.length)}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Leitura preocupante, confirme com oxímetro</p>
            </div>
          </div>
        </div>

        {/* Blood Pressure Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🩸 {t.systolic}</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.avg}</p>
              <p className="text-lg font-bold text-gray-800">{bpStats.avg}</p>
              <p className="text-[10px] text-gray-400">mmHg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.min}</p>
              <p className="text-lg font-bold text-blue-600">{bpStats.min}</p>
              <p className="text-[10px] text-gray-400">mmHg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{t.max}</p>
              <p className="text-lg font-bold text-red-600">{bpStats.max}</p>
              <p className="text-[10px] text-gray-400">mmHg</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-600 font-medium">{t.normalRange} (90-140)</span>
                <span>{calcPercent(bpNormal, bpValues.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${calcPercent(bpNormal, bpValues.length)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-500 font-medium">{t.critical} ({`>`}140)</span>
                <span>{calcPercent(bpCritical, bpValues.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${calcPercent(bpCritical, bpValues.length)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-500 font-medium">{t.low} ({`<`}90)</span>
                <span>{calcPercent(bpLow, bpValues.length)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${calcPercent(bpLow, bpValues.length)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart Section - Overall Distribution */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {language === "pt" ? "Distribuição Geral de Níveis" : "Overall Levels Distribution"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={displayData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {displayData.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} ${language === "pt" ? "leituras" : "readings"}`, name]}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">{language === "pt" ? "Normal" : "Normal"}: {displayData[0].value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-gray-600">{language === "pt" ? "Atenção" : "Attention"}: {displayData[1].value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">{language === "pt" ? "Crítico" : "Critical"}: {displayData[2].value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">{language === "pt" ? "Baixo" : "Low"}: {displayData[3].value}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ROOT APP ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [pageParams, setPageParams] = useState(null);
  const [language, setLanguage] = useState("pt");
  const [currentPage, setCurrentPage] = useState("login");
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedRole, setSelectedRole] = useState("patient");
  const { user: authUser, loading: authLoading, setUser: setAuthUser } = useAuth();
  const navigate=useNavigate()
  const [searchParams] = useSearchParams();


    const data=useData()

  const refreshUnreadCount = async () => {
    try {
      const { data } = await getUnreadNotificationCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    if (authUser) {
      refreshUnreadCount();
      const interval = setInterval(refreshUnreadCount, 3000);
      return () => clearInterval(interval);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      setCurrentPage(authUser.role);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser && (authUser.role === 'doctor' || authUser.role === 'admin') && searchParams.has('patient_id')) {
      navigateTo('patient-detail', searchParams.get('patient_id'));
    }
  }, [authUser, searchParams]);

  const handleLogin = (userData) => {
    setAuthUser(userData);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setStoredRefreshToken(null);
    setAuthUser(null);
    setCurrentPage("login");
  };

  const navigateTo = (page, params = null) => {
    setPageParams(params);
    setCurrentPage(page);
  };

  const goBack = () => {
    if (authUser) {
      setCurrentPage(authUser.role);
    } else {
      setCurrentPage("login");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const user = authUser;

  const renderPage = () => {


    

    const commonProps = { language, setLanguage };

    if (!user) {
      switch (currentPage) {
        case "register":
          return <RegisterPage onLogin={handleLogin} onBack={goBack} {...commonProps} />;
        default:
          return <LoginPage onLogin={handleLogin} onNavigate={navigateTo} selectedRole={selectedRole} onRoleSelect={setSelectedRole} {...commonProps} />;
      }
    }
   
  

  
    switch (currentPage) {
      case "patient":
        return <PatientDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} {...commonProps} unreadCount={unreadCount} setAuthUser={setAuthUser} />;
      case "doctor":
        return <DoctorDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} {...commonProps} unreadCount={unreadCount} />;
      case "admin":
        return <AdminDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} {...commonProps} unreadCount={unreadCount} />;
      case "notifications":
        return <NotificationsPage user={user} onBack={goBack} {...commonProps} onNotificationMarkedRead={refreshUnreadCount} unreadCount={unreadCount} />;
      case "history":
        return <HistoryPage user={user} onBack={goBack} {...commonProps} />;
      case "patient-detail":
        return <PatientDetailPage patientId={pageParams} onBack={goBack} {...commonProps} unreadCount={unreadCount} />;
      case "settings":
        return <SettingsPage user={user} onBack={goBack} onLogout={handleLogout} setAuthUser={setAuthUser} {...commonProps} />;
      case "users":
        return <UsersPage onBack={goBack} onNavigate={navigateTo} {...commonProps} />;
      case "analytics":
        return <AnalyticsPage onBack={goBack} {...commonProps} />;
      default:
        return <PatientDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} {...commonProps} unreadCount={unreadCount} setAuthUser={setAuthUser} />;
    }
  };

  const isAdminMode = (user?.role === 'admin') || (currentPage === 'login' && selectedRole === 'admin');

  return (
    <div className={isAdminMode ? "min-h-screen bg-gray-100" : "min-h-screen bg-gray-100 flex items-center justify-center p-4"}>
      {isAdminMode ? (
        renderPage()
      ) : (
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden h-screen max-h-screen">
          {renderPage()}
        </div>
      )}
    </div>
  );
}