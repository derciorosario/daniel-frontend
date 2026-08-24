import { useState, useEffect } from "react";
import client, { setStoredToken, setStoredRefreshToken, isNative, getNotifications, markNotificationRead, getUnreadNotificationCount } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { getHealthReadings, getPatients, createHealthReading, getPatient, getUsers } from "../api/health";
import WatchConnect from "../components/WatchConnect";
import WatchHealthDisplay from "../components/WatchHealthDisplay";
import AllHealthReadingsDialog from "../components/AllHealthReadingsDialog";
import HealthChart from "../components/HealthChart";
import EnlargedChartDialog from "../components/EnlargedChartDialog";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";


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
} from "lucide-react";
import RegisterPage from "./Register";
import { useData } from "../contexts/DataContext";
import { registerPush } from "../services/push";

// ─── TRANSLATIONS ───────────────────────────────────────────────────────────────
const translations = {
  pt: {
    // Common
    appName: "HydraWatch",
    subtitle: "Monitoramento Inteligente de Saúde",
    signIn: "Entrar",
    register: "Criar Conta",
    name: "Nome",
    email: "E-mail",
    password: "Senha",
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
    
    // Language
    language: "Idioma",
    portuguese: "Português",
    english: "Inglês",
  },
  en: {
    // Common
    appName: "HydraWatch",
    subtitle: "Smart Healthcare Monitoring",
    signIn: "Sign In",
    register: "Create Account",
    name: "Name",
    email: "Email",
    password: "Password",
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
const LoginPage = ({ onLogin, onNavigate, language, setLanguage }) => {
  const t = translations[language];
  const [selectedRole, setSelectedRole] = useState("patient");
  const [email, setEmail] = useState("john.smith@email.com");
  const [password, setPassword] = useState("patient123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 

  const testCredentials = {
    patient: { email: "john.smith@email.com", password: "patient123" },
    doctor: { email: "sarah.johnson@hospital.com", password: "doctor123" },
    admin: { email: "admin@healthsystem.com", password: "admin123" }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail(testCredentials[role].email);
    setPassword(testCredentials[role].password);
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

      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || "Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

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
const PatientDashboard = ({ user, onLogout, onNavigate, language, setLanguage, unreadCount }) => {
  const t = translations[language];
  const [currentHydration, setCurrentHydration] = useState(65);
  const [history, setHistory] = useState(generateHydrationHistory(user.id));
  const [readings, setReadings] = useState([]);
  const [liveHealth, setLiveHealth] = useState(null);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [isAllReadingsOpen, setIsAllReadingsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

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
          <WatchConnect
            onHealthUpdate={handleHealthUpdate}
            onDisconnect={handleDisconnect}
            savedReadings={readings}
            onSaveReading={handleSaveReading}
          />
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
          className="flex flex-col items-center text-gray-400"
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
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
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
          className="flex flex-col items-center text-gray-400"
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

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
const AdminDashboard = ({ user, onLogout, onNavigate, language, setLanguage, unreadCount }) => {
  const t = translations[language];
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    activeAlerts: 0,
    systemStatus: "operational",
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

        const alerts = readingsData.filter((r) => {
          if (r.heartRate === null) return false;
          return r.heartRate < 50 || r.heartRate > 120;
        });

        setStats({
          totalUsers,
          totalDoctors,
          totalPatients,
          activeAlerts: alerts.length,
          systemStatus: "operational",
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

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-semibold text-gray-800">{t.administrator}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
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

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* System Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.totalUsers}</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.alerts}</p>
            <p className="text-2xl font-bold text-red-500">{stats.activeAlerts}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.doctor}</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalDoctors}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.patients}</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalPatients}</p>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.systemStatus}</h3>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-800 capitalize">{stats.systemStatus === "operational" ? t.operational : stats.systemStatus}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.quickActions}</h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => onNavigate("users")}
              className="p-3 bg-blue-50 rounded-lg flex flex-col items-center"
            >
              <Users className="w-6 h-6 text-blue-500 mb-1" />
              <span className="text-xs font-medium text-gray-700">{t.manageUsers}</span>
            </button>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.systemAlerts}</h3>
          <div className="space-y-2">
            {alertReadings.length > 0 ? (
              alertReadings.slice(0, 4).map((r, i) => (
                <div key={r.id || i} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800">
                      ❤️ Heart Rate: {r.heartRate} BPM
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.user?.name || 'Unknown'} - {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-around">
        <button className="flex flex-col items-center text-blue-500">
          <Shield className="w-6 h-6" />
          <span className="text-xs mt-1">{t.overview}</span>
        </button>
        <button
          onClick={() => onNavigate("users")}
          className="flex flex-col items-center text-gray-400"
        >
          <Users className="w-6 h-6" />
          <span className="text-xs mt-1">{t.users}</span>
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
const SettingsPage = ({ user, onBack, onLogout, language, setLanguage }) => {
  const t = translations[language];

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
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
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
  const [data, setData] = useState({
    avgHydration: 0,
    lowHydration: 0,
    highHydration: 0,
    totalReadings: 0,
  });
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: readingsData } = await getHealthReadings();
        const allReadings = Array.isArray(readingsData) ? readingsData : [];
        setReadings(allReadings);

        if (allReadings.length > 0) {
          const hrValues = allReadings.map((r) => r.heartRate).filter((v) => v !== null);
          const avgHR = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : 0;
          const lowCount = hrValues.filter((v) => v < 50).length;
          const highCount = hrValues.filter((v) => v > 120).length;

          setData({
            avgHydration: avgHR,
            lowHydration: Math.round((lowCount / allReadings.length) * 100),
            highHydration: Math.round((highCount / allReadings.length) * 100),
            totalReadings: allReadings.length,
          });
        }
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
  const totalWithHR = hrValues.length;
  const normalCount = hrValues.filter((v) => v >= 50 && v <= 120).length;
  const lowCount = hrValues.filter((v) => v < 50).length;
  const highCount = hrValues.filter((v) => v > 120).length;

  const normalPercent = totalWithHR ? Math.round((normalCount / totalWithHR) * 100) : 0;
  const lowPercent = totalWithHR ? Math.round((lowCount / totalWithHR) * 100) : 0;
  const highPercent = totalWithHR ? Math.round((highCount / totalWithHR) * 100) : 0;

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

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.avgHydration}</p>
            <p className="text-xl font-bold text-gray-800">{data.avgHydration}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.lowHydration}</p>
            <p className="text-xl font-bold text-red-500">{data.lowHydration}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.highHydration}</p>
            <p className="text-xl font-bold text-amber-500">{data.highHydration}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t.totalReadings}</p>
            <p className="text-xl font-bold text-gray-800">{data.totalReadings}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.hydrationDistribution}</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-black">{t.normalRange}</span>
                <span>{normalPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${normalPercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-black">{t.lowRange}</span>
                <span>{lowPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${lowPercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-black">{t.highRange}</span>
                <span>{highPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${highPercent}%` }}></div>
              </div>
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
          return <LoginPage onLogin={handleLogin} onNavigate={navigateTo} {...commonProps} />;
      }
    }
   
  

  
    switch (currentPage) {
      case "patient":
        return <PatientDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} {...commonProps} unreadCount={unreadCount} />;
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
        return <SettingsPage user={user} onBack={goBack} onLogout={handleLogout} {...commonProps} />;
      case "users":
        return <UsersPage onBack={goBack} onNavigate={navigateTo} {...commonProps} />;
      case "analytics":
        return <AnalyticsPage onBack={goBack} {...commonProps} />;
      default:
        return <PatientDashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} {...commonProps} unreadCount={unreadCount} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]">
        {renderPage()}
      </div>
    </div>
  );
}