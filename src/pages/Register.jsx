import { useState } from "react";
import client, { setStoredToken, setStoredRefreshToken } from "../api/client";
import {
  Heart,
  ChevronLeft,
  Globe,
} from "lucide-react";

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
          Português
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg ${language === "en" ? "text-blue-500 bg-blue-50" : "text-gray-700"}`}
        >
          English
        </button>
      </div>
    </div>
  );
};

const RegisterPage = ({ onLogin, onBack, language, setLanguage }) => {
  const t = {
    pt: {
      appName: "ScanWatch",
      subtitle: "Monitoramento Inteligente de Saúde",
      register: "Criar Conta",
      name: "Nome",
      email: "E-mail",
      password: "Senha",
      patient: "Paciente",
      doctor: "Médico",
      admin: "Admin",
      back: "Voltar",
      haveAccount: "Já tem conta?",
      signIn: "Entrar",
      role: "Função",
      registerSuccess: "Conta criada com sucesso!",
    },
    en: {
      appName: "ScanWatch",
      subtitle: "Smart Healthcare Monitoring",
      register: "Create Account",
      name: "Name",
      email: "Email",
      password: "Password",
      patient: "Patient",
      doctor: "Doctor",
      admin: "Admin",
      back: "Back",
      haveAccount: "Already have an account?",
      signIn: "Sign In",
      role: "Role",
      registerSuccess: "Account created successfully!",
    }
  }[language];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await client.post("/auth/register", {
        name,
        email,
        password,
        role,
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
      setError(err.response?.data?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fixed container - ensures full height and scrolling
    <div className="h-full min-h-screen overflow-y-auto">
      <div className="p-6 pb-8 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
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

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
            {t.registerSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Seu nome"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.role}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["patient", "doctor", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    role === r
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {r === "patient" && t.patient}
                  {r === "doctor" && t.doctor}
                  {r === "admin" && t.admin}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors mt-6 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? "A criar..." : t.register}
          </button>

          <div className="text-center mt-4 pb-4">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {t.haveAccount} {t.signIn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;