import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Camera, History, Sparkles, Wind, Brain, Activity, RefreshCw, Palette, Coffee, User, Home, Settings, Layout, Languages, LogOut, UserPlus, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, getDocFromServer, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// WARNING: Client-side API key usage is intended for demo/prototyping purposes only.
// If deploying to production, please implement a backend to proxy API requests and secure the key.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Types ---
type CreativeState = 'flow' | 'fog' | 'drought' | 'storm';
type Language = 'en' | 'es';
type Tab = 'scan' | 'diagnosis' | 'tracker' | 'history' | 'profile' | 'guide';

interface AuraState {
  id: string;
  date: string;
  day: number;
  status: CreativeState;
  focusLevel: number;
  moodLevel: number;
  blockLevel: number;
  serenity: number;
  energy: number;
  imageUrl?: string;
  userId?: string;
  createdAt?: number;
}

// --- Translations ---
const translations = {
  en: {
    title: "GO FOR BETTER CREATIVITY WITH BLOOMMIND",
    hello: "Hello!",
    start: "Let's start!",
    capture: "Capture Essence",
    retake: "Retake",
    analyze: "Analyze",
    history: "View History",
    goodMorning: "Good Morning, Creative",
    currentAura: "Current Bloom",
    ritual: "Ritual",
    focus: "Focus",
    scan: "Scan",
    diagnosis: "Diagnosis",
    logs: "Logs",
    tracker: "Tracker",
    profile: "Profile",
    permissionDenied: "Camera access is needed. If you denied it, check your browser settings or upload a photo instead.",
    requestPermission: "Retry / Request Permission",
    uploadPhoto: "Upload Photo",
    requesting: "Requesting...",
    login: "Login",
    register: "Register",
    username: "Username",
    email: "Email",
    logout: "Logout",
    stats: "Creative Stats",
    concentration: "Concentration",
    mood: "Mood",
    block: "Creative Block",
    tip: "Pro Tip",
    // Aura states (Flower Symbolism)
    flow: "Blue Himalayan Poppy",
    fog: "Ghost Orchid",
    drought: "Resurrection Fern",
    storm: "Flame Lily",
    auraBrillante: "The Ethereal Flow",
    auraOpaca: "The Elusive Clarity",
    auraSeca: "The Patient Rebirth",
    auraElectrica: "The Wild Passion",
    // Rituals
    ritualFlow: "Keep creating, you're at your best!",
    ritualFog: "Take a 15 min break and smell fresh mint.",
    ritualDrought: "Hydration and Rosemary. Your brain needs fuel.",
    ritualStorm: "Breathe. 5 minutes of meditation with lavender.",
    ritualFlowGen: "Seize the momentum! Don't stop sketching.",
    ritualFogGen: "Change environment. A citrus scent will help.",
    ritualDroughtGen: "Hydration and Rosemary. Your brain needs fuel.",
    ritualStormGen: "Breathe. 5 minutes of meditation with lavender.",
    aromaJazmin: "Jasmine",
    aromaMenta: "Mint",
    aromaRomero: "Rosemary",
    aromaLavanda: "Lavender",
    // Tips
    tipFlow: "Try the Pomodoro technique to maintain this momentum.",
    tipFog: "Go for a short walk. Fresh air clears the mind.",
    tipDrought: "Look at references outside your field for inspiration.",
    tipStorm: "Listen to lo-fi music and focus on one small task.",
    learnMore: "Learn more about your emotions in creative block and learn to bloom",
    back: "Back",
    guideTitle: "Bloom Guide",
    states: [
      { id: 1, name: "Saturated Mind", feeling: "too many ideas, mental noise, can't focus", need: "calm + order", plants: "Lavender, Chamomile, Eucalyptus", colors: "purple, soft green", effect: "lowers anxiety and allows clarity", icon: "🧠" },
      { id: 2, name: "Mental Fog", feeling: "don't know where to start, everything feels confusing", need: "focus + lightness", plants: "Mint, Rosemary, Basil", colors: "bright green", effect: "activates the mind and orders thoughts", icon: "🌫️" },
      { id: 3, name: "Total Block", feeling: "nothing comes out, frustration, creative void", need: "activation + movement", plants: "Ginger, Citrus, Calendula", colors: "yellow, orange", effect: "breaks inertia", icon: "🪨" },
      { id: 4, name: "Low Energy", feeling: "apathy, zero desire to create", need: "energy + vitality", plants: "Sunflower, Lemon, Geranium", colors: "vibrant yellow", effect: "lifts the mood", icon: "😔" },
      { id: 5, name: "Self-doubt", feeling: "this is not enough, fear of creating", need: "confidence + softness", plants: "Rose, Jasmine, Peony", colors: "pink, white", effect: "reconnects with emotional expression", icon: "💔" },
      { id: 6, name: "Excess Pressure", feeling: "everything must be perfect → you don't start", need: "letting go + flowing", plants: "Lotus flower, Lavender, Bamboo", colors: "white, light green", effect: "invites to flow without judgment", icon: "🔥" },
      { id: 7, name: "Creative Disconnection", feeling: "don't feel inspired, everything flat", need: "reconnect with the sensory", plants: "Patchouli, Sandalwood, Moss", colors: "dark green, earth", effect: "deep connection / grounding", icon: "🌑" },
      { id: 8, name: "Lack of Inspiration", feeling: "no new ideas", need: "stimulus + curiosity", plants: "Orchid, Tulip, Exotic flowers", colors: "varied / vibrant colors", effect: "awakens imagination", icon: "🌈" }
    ]
  },
  es: {
    title: "MEJORA TU CREATIVIDAD CON BLOOMMIND",
    hello: "¡Hola!",
    start: "¡Empecemos!",
    capture: "Capturar Esencia",
    retake: "Repetir",
    analyze: "Analizar",
    history: "Ver Historial",
    goodMorning: "Buenos Días, Creativo",
    currentAura: "Floración Actual",
    ritual: "Ritual",
    focus: "Enfoque",
    scan: "Escanear",
    diagnosis: "Diagnóstico",
    logs: "Registros",
    tracker: "Seguimiento",
    profile: "Perfil",
    permissionDenied: "Acceso denegado. Revisa tus ajustes de cámara o sube una foto.",
    requestPermission: "Reintentar / Solicitar Permiso",
    uploadPhoto: "Subir Foto",
    requesting: "Solicitando...",
    login: "Iniciar Sesión",
    register: "Registrarse",
    username: "Usuario",
    email: "Correo",
    logout: "Cerrar Sesión",
    stats: "Estadísticas Creativas",
    concentration: "Concentración",
    mood: "Ánimo",
    block: "Bloqueo Creativo",
    tip: "Consejo Pro",
    // Aura states (Flower Symbolism)
    flow: "Amapola Azul del Himalaya",
    fog: "Orquídea Fantasma",
    drought: "Helecho de la Resurrección",
    storm: "Lirio de Fuego",
    auraBrillante: "El Flujo Etéreo",
    auraOpaca: "La Claridad Elusiva",
    auraSeca: "El Renacimiento Paciente",
    auraElectrica: "La Pasión Salvaje",
    // Rituals
    ritualFlow: "Sigue creando, estás en tu mejor momento.",
    ritualFog: "Toma un descanso de 15 min y huele menta fresca.",
    ritualDrought: "Hidratación y Romero. Tu cerebro necesita combustible.",
    ritualStorm: "Respira. 5 minutos de meditación con lavanda.",
    ritualFlowGen: "¡Aprovecha el impulso! No pares de bocetar.",
    ritualFogGen: "Cambia de entorno. Un aroma cítrico te ayudará.",
    ritualDroughtGen: "Hidratación y Romero. Tu cerebro necesita combustible.",
    ritualStormGen: "Respira. 5 minutos de meditación con lavanda.",
    aromaJazmin: "Jazmín",
    aromaMenta: "Menta",
    aromaRomero: "Romero",
    aromaLavanda: "Lavanda",
    // Tips
    tipFlow: "Prueba la técnica Pomodoro para mantener este impulso.",
    tipFog: "Da un paseo corto. El aire fresco despeja la mente.",
    tipDrought: "Busca referencias fuera de tu campo para inspirarte.",
    tipStorm: "Escucha música lo-fi y enfócate en una tarea pequeña.",
    learnMore: "Conoce más sobre tus emociones en el bloqueo creativo y aprende a florecer",
    back: "Volver",
    guideTitle: "Guía de Floración",
    states: [
      { id: 1, name: "Mente Saturada", feeling: "demasiadas ideas, ruido mental, no puedes enfocarte", need: "calma + orden", plants: "Lavanda, Manzanilla, Eucalipto", colors: "morado, verde suave", efecto: "baja la ansiedad y permite claridad", icon: "🧠" },
      { id: 2, name: "Niebla Mental", feeling: "no sabes por dónde empezar, todo se siente confuso", need: "enfoque + ligereza", plants: "Menta, Romero, Albahaca", colors: "verde brillante", efecto: "activa la mente y ordena pensamientos", icon: "🌫️" },
      { id: 3, name: "Bloqueo Total", feeling: "no sale nada, frustración, vacío creativo", need: "activación + movimiento", plants: "Jengibre, Citrus, Caléndula", colors: "amarillo, naranja", efecto: "rompe la inercia", icon: "🪨" },
      { id: 4, name: "Baja Energía", feeling: "apatía, cero ganas de crear", need: "energía + vitalidad", plants: "Girasol, Limón, Geranio", colors: "amarillo vibrante", efecto: "eleva el ánimo", icon: "😔" },
      { id: 5, name: "Auto-duda", feeling: "esto no es suficiente, miedo a crear", need: "confianza + suavidad", plants: "Rosa, Jazmín, Peonía", colors: "rosado, blanco", efecto: "reconecta con la expresión emocional", icon: "💔" },
      { id: 6, name: "Exceso de presión", feeling: "todo debe ser perfecto → no empiezas", need: "soltar + fluir", plants: "Flor de loto, Lavanda, Bambú", colors: "blanco, verde claro", efecto: "invita a fluir sin juicio", icon: "🔥" },
      { id: 7, name: "Desconexión creativa", feeling: "no te sientes inspirado, todo plano", need: "reconectar con lo sensorial", plants: "Pachulí, Sándalo, Musgo", colors: "verde oscuro, tierra", efecto: "conexión profunda / grounding", icon: "🌑" },
      { id: 8, name: "Falta de inspiración", feeling: "no hay ideas nuevas", need: "estímulo + curiosidad", plants: "Orquídea, Tulipán, Flores exóticas", colors: "colores variados / vibrantes", efecto: "despierta imaginación", icon: "🌈" }
    ]
  }
};

// --- Mock Data ---
const getMockHistory = (): AuraState[] => [
  {
    id: '1',
    date: '21 Mon',
    day: 21,
    status: 'flow',
    focusLevel: 95,
    moodLevel: 90,
    blockLevel: 5,
    serenity: 80,
    energy: 90,
  },
  {
    id: '2',
    date: '22 Tue',
    day: 22,
    status: 'fog',
    focusLevel: 40,
    moodLevel: 50,
    blockLevel: 60,
    serenity: 50,
    energy: 60,
  },
];

const generateMockAura = (imageUrl: string): AuraState => {
  const statuses: CreativeState[] = ['flow', 'fog', 'drought', 'storm'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const days = ['21 Mon', '22 Tue', '23 Wed', '24 Thu', '25 Fri', '26 Sat'];
  const randomDayStr = days[Math.floor(Math.random() * days.length)];
  const randomDayNum = parseInt(randomDayStr.split(' ')[0]);

  return {
    id: Date.now().toString(),
    date: randomDayStr,
    day: randomDayNum,
    status: randomStatus,
    focusLevel: Math.floor(Math.random() * 40) + (randomStatus === 'flow' ? 60 : 20),
    moodLevel: Math.floor(Math.random() * 40) + (randomStatus === 'flow' ? 60 : 20),
    blockLevel: Math.floor(Math.random() * 40) + (randomStatus === 'flow' ? 0 : 40),
    serenity: Math.floor(Math.random() * 40) + (randomStatus === 'storm' ? 10 : 50),
    energy: Math.floor(Math.random() * 40) + (randomStatus === 'drought' ? 10 : 50),
    imageUrl
  };
};

// --- Components ---

const Face = ({ mood }: { mood: CreativeState }) => {
  if (mood === 'flow') return (
    <div className="flex flex-col items-center justify-center space-y-1">
      <div className="flex space-x-4">
        <div className="w-2 h-2 bg-black rounded-full" />
        <div className="w-2 h-2 bg-black rounded-full" />
      </div>
      <div className="w-6 h-3 border-b-4 border-black rounded-full" />
    </div>
  );
  if (mood === 'fog') return (
    <div className="flex flex-col items-center justify-center space-y-1">
      <div className="flex space-x-4">
        <div className="w-2 h-2 bg-black rounded-full" />
        <div className="w-2 h-2 bg-black rounded-full" />
      </div>
      <div className="w-4 h-1 bg-black rounded-full" />
    </div>
  );
  if (mood === 'drought') return (
    <div className="flex flex-col items-center justify-center space-y-1">
      <div className="flex space-x-4">
        <div className="w-2 h-2 bg-black rounded-full" />
        <div className="w-2 h-2 bg-black rounded-full" />
      </div>
      <div className="w-4 h-4 border-4 border-black rounded-full" />
    </div>
  );
  return (
    <div className="flex flex-col items-center justify-center space-y-1">
      <div className="flex space-x-4">
        <div className="w-2 h-1 bg-black rounded-full rotate-12" />
        <div className="w-2 h-1 bg-black rounded-full -rotate-12" />
      </div>
      <div className="w-6 h-1 bg-black rounded-full" />
    </div>
  );
};

const AuraCharacter = ({ status, size = 'lg' }: { status: CreativeState, size?: 'sm' | 'md' | 'lg' }) => {
  const getShape = () => {
    switch (status) {
      case 'flow': return 'rounded-full bg-lime-vibrant';
      case 'fog': return 'rounded-[2rem] bg-pink-vibrant';
      case 'drought': return 'rounded-3xl bg-blue-vibrant';
      case 'storm': return 'rounded-xl bg-star-yellow';
      default: return 'rounded-full bg-lime-vibrant';
    }
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
  };

  const petalCount = 8;
  const petals = Array.from({ length: petalCount });

  return (
    <motion.div 
      animate={{ 
        y: [0, -10, 0],
        rotate: status === 'storm' ? [-2, 2, -2] : [0, 0, 0]
      }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className={`${sizeClasses[size]} relative flex items-center justify-center`}
    >
      {/* Petals */}
      {petals.map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
          style={{
            transform: `rotate(${i * (360 / petalCount)}deg) translateY(-40%)`,
          }}
          className={`absolute w-1/3 h-1/2 rounded-full border-2 border-black opacity-40 ${
            status === 'flow' ? 'bg-lime-vibrant' :
            status === 'fog' ? 'bg-pink-vibrant' :
            status === 'drought' ? 'bg-blue-vibrant' : 'bg-star-yellow'
          }`}
        />
      ))}
      
      {/* Main Shape */}
      <div className={`${sizeClasses[size]} ${getShape()} flex items-center justify-center shadow-xl relative border-4 border-black z-10`}>
        <Face mood={status} />
        {status === 'flow' && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-4 -right-4 text-4xl"
          >
            ✨
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const Sticker = ({ children, className }: { children: ReactNode, className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-black rounded-full blur-sm opacity-10 translate-y-1" />
    <div className="bg-white px-4 py-2 rounded-full border-2 border-black font-black text-xs uppercase tracking-widest relative">
      {children}
    </div>
  </div>
);

const Starburst = ({ children, className }: { children: ReactNode, className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-lime-vibrant scale-110 rotate-12 [clip-path:polygon(50%_0%,_61%_35%,_98%_35%,_68%_57%,_79%_91%,_50%_70%,_21%_91%,_32%_57%,_2%_35%,_39%_35%)]" />
    <div className="relative font-black text-xs uppercase tracking-tighter text-center">
      {children}
    </div>
  </div>
);

const OnboardingModal = ({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: any }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white border-4 border-black rounded-[3.5rem] w-full max-w-sm p-8 shadow-[0_15px_0_black] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-lime-vibrant" />
          
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-pink-vibrant rounded-full border-4 border-black mx-auto flex items-center justify-center shadow-[0_5px_0_black]">
              <Brain className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">
              {t.hello} <br /> Bienvenido a BloomMind
            </h2>
            
            <p className="text-sm font-bold text-navy-deep opacity-80 leading-snug">
              Supera el bloqueo creativo con la ayuda de la naturaleza. BloomMind analiza tu estado emocional a través de tu rostro para recomendarte plantas, aromas y rituales que desbloqueen tu mente.
            </p>
            
            <div className="bg-stone-100 p-4 rounded-3xl border-2 border-black space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-lime-vibrant rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black">1</div>
                <p className="text-[10px] font-black uppercase text-left">Escanea tu rostro hoy</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-vibrant rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black">2</div>
                <p className="text-[10px] font-black uppercase text-left">Descubre tu floración actual</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-star-yellow rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black">3</div>
                <p className="text-[10px] font-black uppercase text-left">Sigue el ritual recomendado</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full bg-navy-deep text-white font-black py-4 rounded-2xl border-2 border-black shadow-[0_6px_0_black] active:shadow-none active:translate-y-1 transition-all uppercase tracking-widest"
            >
              ¡Comencemos!
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isScanning, setIsScanning] = useState(false);
  const [currentAura, setCurrentAura] = useState<AuraState | null>(null);
  const [history, setHistory] = useState<AuraState[]>([]);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [expandedGuideId, setExpandedGuideId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [trackerDays, setTrackerDays] = useState<Record<string, CreativeState>>({});
  const [trackerMonth, setTrackerMonth] = useState(new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })).getMonth());
  const trackerYear = 2026;

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync Firestore history & tracker
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const aurasQuery = query(
      collection(db, 'users', currentUser.uid, 'auras'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeAuras = onSnapshot(aurasQuery, (snapshot) => {
      const auras: AuraState[] = [];
      snapshot.forEach(doc => {
        auras.push(doc.data() as AuraState);
      });
      setHistory(auras);
      
      // Default to today Colombia
      const colToday = getColombiaDateString(new Date());
      if (!selectedHistoryDate) {
        setSelectedHistoryDate(colToday);
      }
    }, (error) => {
       console.error("Firestore error:", error);
    });

    const trackerQuery = collection(db, 'users', currentUser.uid, 'tracker');
    const unsubscribeTracker = onSnapshot(trackerQuery, (snapshot) => {
      const td: Record<string, CreativeState> = {};
      snapshot.forEach(d => {
        td[d.id] = d.data().status as CreativeState;
      });
      setTrackerDays(td);
    }, (error) => {
       console.error("Firestore error:", error);
    });

    return () => {
      unsubscribeAuras();
      unsubscribeTracker();
    };
  }, [currentUser]);

  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Camera API not available");
      setHasCameraPermission(false);
      return;
    }

    setHasCameraPermission(null); // Reset state to show "requesting" feedback
    stopCamera();
    
    try {
      // Check for available devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      
      if (!hasVideoDevice) {
        console.warn("No video input devices found during enumeration");
        setHasCameraPermission(false);
        return;
      }

      let mediaStream: MediaStream;

      // Attempt 1: Basic video constraints (most compatible)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      } catch (err1) {
        console.warn("Attempt 1 (video: true) failed, trying Attempt 2:", err1);
        
        // Attempt 2: Preferred constraints (front-facing camera)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }
          });
        } catch (err2) {
          console.warn("Attempt 2 (facingMode: 'user') failed, trying Attempt 3:", err2);
          
          // Attempt 3: Enumerate and pick first available video device explicitly
          const videoDevice = devices.find(device => device.kind === 'videoinput');
          if (videoDevice && videoDevice.deviceId) {
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
              video: { deviceId: { exact: videoDevice.deviceId } }
            });
          } else {
            throw err2; 
          }
        }
      }

      streamRef.current = mediaStream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure the video element is ready
        const playVideo = () => {
          videoRef.current?.play().catch(e => {
            console.error("Error playing video:", e);
            // Retry once after a short delay if it's a transient error
            setTimeout(() => videoRef.current?.play(), 300);
          });
        };
        
        if (videoRef.current.readyState >= 2) {
          playVideo();
        } else {
          videoRef.current.onloadeddata = playVideo;
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.message === 'Permission denied') {
        console.warn("Camera permission denied by user.");
      } else {
        console.error("Final error accessing camera:", err);
      }
      setHasCameraPermission(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (activeTab === 'scan' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, capturedImage, startCamera, stopCamera]);

  // Ensure video feed is attached if stream exists
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Error playing video in effect:", e));
    }
  }, [hasCameraPermission]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCapturedImage(e.target.result as string);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!capturedImage) return;
    setIsScanning(true);
    console.log("Starting AI analysis...");

    try {
      // Extract base64 completely without the prefix
      const base64Data = capturedImage.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
            {
              text: "Analyze the facial expression, environment, and overall vibe of this image of a creative person. Base your answer strictly on 4 statuses related to creative block: 'flow' (Saturated Mind - active, slightly chaotic but brilliant), 'fog' (Mental Fog - confused, distracted, unsure), 'drought' (Total Block, Low Energy - tired, frustrated, blank stare), or 'storm' (Excess Pressure - intense, perfect-seeking, stressed). Then estimate their focusLevel (1-100), moodLevel (1-100), blockLevel (1-100), serenity (1-100), and energy (1-100). Return ONLY A VALID JSON MATCHING THIS EXACT SCHEMA AND NOTHING ELSE.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "Must be exactly one of: 'flow', 'fog', 'drought', 'storm'",
              },
              focusLevel: { type: Type.INTEGER },
              moodLevel: { type: Type.INTEGER },
              blockLevel: { type: Type.INTEGER },
              serenity: { type: Type.INTEGER },
              energy: { type: Type.INTEGER },
            },
            required: ["status", "focusLevel", "moodLevel", "blockLevel", "serenity", "energy"],
          },
        },
      });

      console.log("AI Response received:", response.text);
      const parsedJson = JSON.parse(response.text || '{}');
      const validStatuses = ['flow', 'fog', 'drought', 'storm'];
      const determinedStatus = (validStatuses.includes(parsedJson.status) ? parsedJson.status : 'fog') as CreativeState;

      const now = new Date();
      const colToday = getColombiaDateString(now);
      const colDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
      const dayNum = colDate.getDate();
      
      const newId = Date.now().toString();

      const newAura: AuraState = {
        id: newId,
        date: colToday,
        day: dayNum,
        status: determinedStatus,
        focusLevel: parsedJson.focusLevel || 50,
        moodLevel: parsedJson.moodLevel || 50,
        blockLevel: parsedJson.blockLevel || 50,
        serenity: parsedJson.serenity || 50,
        energy: parsedJson.energy || 50,
        imageUrl: capturedImage,
        userId: currentUser?.uid,
        createdAt: Date.now()
      };

      if (currentUser) {
        console.log("Saving to Firestore for user:", currentUser.uid);
        try {
          const docRef = doc(db, 'users', currentUser.uid, 'auras', newId);
          await setDoc(docRef, newAura);
          
          // Also update daily tracker
          const trackerId = getColombiaTrackerID(now);
          const trackerRef = doc(db, 'users', currentUser.uid, 'tracker', trackerId);
          await setDoc(trackerRef, {
            status: determinedStatus,
            updatedAt: Date.now()
          }, { merge: true });
        } catch (error) {
          console.error("Firebase save failed:", error);
        }
      } 
      
      // Always update local state for immediate feedback
      setHistory(prev => {
        if (prev.some(h => h.id === newAura.id)) return prev;
        const updated = [newAura, ...prev];
        return updated.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
      });

      setCurrentAura(newAura);
      setActiveTab('diagnosis');
      setCapturedImage(null);

    } catch (error) {
      console.error("AI Analysis failed:", error);
      // Fallback to random if API fails
      const fallbackAura = generateMockAura(capturedImage);
      if (currentUser) {
        fallbackAura.userId = currentUser.uid;
        fallbackAura.createdAt = Date.now();
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'auras', fallbackAura.id), fallbackAura);
          
          // Also update daily tracker for fallback
          const trackerId = getColombiaTrackerID(new Date());
          const trackerRef = doc(db, 'users', currentUser.uid, 'tracker', trackerId);
          await setDoc(trackerRef, {
            status: fallbackAura.status,
            updatedAt: Date.now()
          }, { merge: true });
        } catch (e) {
          console.error("Firestore fallback save failed:", e);
        }
      } else {
        setHistory(prev => [fallbackAura, ...prev]);
      }
      
      setCurrentAura(fallbackAura);
      setActiveTab('diagnosis');
      setCapturedImage(null);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'es' : 'en');

  const getColombiaDateString = (date: Date) => {
    // Return language-independent YYYY-MM-DD using en-CA for format consistency
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-').map(Number);
    // Create a date object from the strings (interpreted as local, but we just want the day of week)
    const date = new Date(y, m - 1, d);
    const dayNames = lang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${d} ${dayNames[date.getDay()]}`;
  };

  const getColombiaTrackerID = (date: Date) => {
    const colDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const y = colDate.getFullYear();
    const m = (colDate.getMonth() + 1).toString().padStart(2, '0');
    const d = colDate.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getAuraData = (status: CreativeState) => {
    const diagnoses = {
      flow: t.auraBrillante,
      fog: t.auraOpaca,
      drought: t.auraSeca,
      storm: t.auraElectrica
    };
    const aromas = {
      flow: t.aromaJazmin,
      fog: t.aromaMenta,
      drought: t.aromaRomero,
      storm: t.aromaLavanda
    };
    const rituals = {
      flow: t.ritualFlowGen,
      fog: t.ritualFogGen,
      drought: t.ritualDroughtGen,
      storm: t.ritualStormGen
    };
    const tips = {
      flow: t.tipFlow,
      fog: t.tipFog,
      drought: t.tipDrought,
      storm: t.tipStorm
    };
    return {
      diagnosis: diagnoses[status],
      aroma: aromas[status],
      ritual: rituals[status],
      tip: tips[status]
    };
  };

  const PuzzleGame = ({ type }: { type: number }) => {
    const [solved, setSolved] = useState(false);
    const [pieces, setPieces] = useState<number[]>([]);
    
    useEffect(() => {
      const initial = Array.from({ length: 4 }, (_, i) => i).sort(() => Math.random() - 0.5);
      setPieces(initial);
    }, []);

    const handlePieceClick = (idx: number) => {
      if (solved) return;
      const newPieces = [...pieces];
      const nextIdx = (idx + 1) % 4;
      [newPieces[idx], newPieces[nextIdx]] = [newPieces[nextIdx], newPieces[idx]];
      setPieces(newPieces);
      if (newPieces.every((p, i) => p === i)) setSolved(true);
    };

    const puzzleColors = ['bg-purple-300', 'bg-green-300', 'bg-yellow-300', 'bg-orange-300', 'bg-pink-300', 'bg-emerald-300', 'bg-teal-300', 'bg-indigo-300'];

    return (
      <div className="mt-6 p-4 bg-white/30 rounded-3xl border-2 border-black border-dashed" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black uppercase opacity-60">Creative Puzzle</span>
          {solved && <span className="text-[10px] font-black text-green-700 uppercase animate-bounce">✨ Resuelto!</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-[120px] mx-auto">
          {pieces.map((p, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePieceClick(i)}
              className={`aspect-square cursor-pointer border-2 border-black rounded-xl flex items-center justify-center text-lg font-black ${puzzleColors[(type-1)%8]}`}
            >
              {p + 1}
            </motion.div>
          ))}
        </div>
        <p className="text-center text-[8px] font-bold mt-2 opacity-50 uppercase">Ordena las piezas para desbloquear tu mente</p>
      </div>
    );
  };

  const renderGuide = () => {
    const cardStyles = [
      { bg: 'bg-[#f3e8ff]', border: 'border-[#c084fc]', text: 'text-[#6b21a8]' }, // Morado
      { bg: 'bg-[#dcfce7]', border: 'border-[#4ade80]', text: 'text-[#166534]' }, // Verde brillante
      { bg: 'bg-[#fef08a]', border: 'border-[#facc15]', text: 'text-[#854d0e]' }, // Amarillo
      { bg: 'bg-[#fef9c3]', border: 'border-[#fde047]', text: 'text-[#854d0e]' }, // Amarillo vibrante
      { bg: 'bg-[#fce7f3]', border: 'border-[#f472b6]', text: 'text-[#9d174d]' }, // Rosado
      { bg: 'bg-[#f0fdf4]', border: 'border-[#86efac]', text: 'text-[#14532d]' }, // Blanco verde
      { bg: 'bg-[#ecfccb]', border: 'border-[#a3e635]', text: 'text-[#3f6212]' }, // Verde oscuro
      { bg: 'bg-[#ffedd5]', border: 'border-[#fdba74]', text: 'text-[#9a3412]' }  // Colores variados
    ];

    return (
      <div className="p-6 space-y-4 pb-48">
        {t.states.map((state: any, index: number) => {
          const style = cardStyles[index % cardStyles.length];
          const isExpanded = expandedGuideId === state.id;
          return (
            <motion.div 
              key={state.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setExpandedGuideId(isExpanded ? null : state.id)}
              className={`${style.bg} border-4 ${style.border} p-6 rounded-[2.5rem] shadow-[0_8px_0_black] cursor-pointer transition-transform hover:scale-[1.01] active:scale-95`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl bg-white w-16 h-16 rounded-2xl border-2 border-black flex items-center justify-center shadow-[0_4px_0_black]">
                  {state.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{state.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {state.colors.split(', ').map((color: string) => (
                      <div key={color} className="text-[8px] font-black uppercase px-2 py-0.5 border border-black rounded-full bg-white">
                        {color}
                      </div>
                    ))}
                  </div>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="font-black text-xl">↓</motion.div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-4 text-xs pt-6 mt-4 border-t-2 border-black border-dashed">
                      <div className="space-y-1">
                        <span className="font-black uppercase opacity-60 text-[10px]">{lang === 'es' ? 'Cómo se siente' : 'How it feels'}</span>
                        <p className="font-bold leading-tight">{state.feeling}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="font-black uppercase opacity-60 text-[10px]">{lang === 'es' ? 'Qué necesitas' : 'What you need'}</span>
                          <p className="font-bold text-pink-vibrant">{state.need}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="font-black uppercase opacity-60 text-[10px]">{lang === 'es' ? 'Efecto' : 'Effect'}</span>
                          <p className={`font-black ${style.text}`}>{state.effect || state.efecto}</p>
                        </div>
                      </div>
                      <div className="bg-navy-deep text-white p-4 rounded-2xl border-2 border-black shadow-[0_4px_0_black]">
                        <span className="font-black uppercase opacity-60 text-[10px] block mb-2">{lang === 'es' ? 'Plantas / Flores' : 'Plants / Flowers'}</span>
                        <p className="font-bold text-lime-vibrant">{state.plants}</p>
                      </div>
                      <PuzzleGame type={state.id} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const handleTrackerClick = async (day: number) => {
    if (!currentUser) {
      alert("Debes iniciar sesión para usar el seguimiento manual.");
      return;
    }
    const dateStr = `${trackerYear}-${(trackerMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const currentStatus = trackerDays[dateStr];
    let nextStatus: CreativeState | null = null;
    
    if (!currentStatus) nextStatus = 'flow';
    else if (currentStatus === 'flow') nextStatus = 'fog';
    else if (currentStatus === 'fog') nextStatus = 'drought';
    else nextStatus = null; // Remove it if clicking again

    try {
      if (nextStatus) {
        await setDoc(doc(db, 'users', currentUser.uid, 'tracker', dateStr), {
          status: nextStatus,
          updatedAt: Date.now()
        });
      } else {
        // Technically rules don't permit delete nicely or maybe they do, wait I added delete. 
        // But let's just cycle. We can rely on 'drought' -> 'flow'
        await setDoc(doc(db, 'users', currentUser.uid, 'tracker', dateStr), {
          status: 'flow',
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      console.error("Error updating tracker", error);
    }
  };

  const renderTracker = () => {
    const daysInMonth = new Date(trackerYear, trackerMonth + 1, 0).getDate();
    const firstDayIndex = new Date(trackerYear, trackerMonth, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Calc dynamic stats combining history and tracker data for the selected month
    const getStats = () => {
      let totalFocus = 0, totalMood = 0, totalBlock = 0, count = 0;
      
      // Filter history by selected tracker month
      history.forEach(h => {
        const hDate = new Date(h.createdAt || 0);
        // We use Colombia timezone for consistent month comparison
        const colHDate = new Date(hDate.toLocaleString("en-US", { timeZone: "America/Bogota" }));
        if (colHDate.getMonth() === trackerMonth) {
          totalFocus += h.focusLevel;
          totalMood += h.moodLevel;
          totalBlock += h.blockLevel;
          count++;
        }
      });

      // Combine with tracker state for the same month
      Object.keys(trackerDays).forEach(dateStr => {
        const parts = dateStr.split('-');
        const month = parseInt(parts[1]) - 1;
        
        if (month === trackerMonth) {
          const day = parseInt(parts[2]);
          // Only add tracker if history doesn't already have a record for this day in this month
          if (!history.some(h => {
            const hDate = new Date(h.createdAt || 0);
            const colHDate = new Date(hDate.toLocaleString("en-US", { timeZone: "America/Bogota" }));
            return colHDate.getDate() === day && colHDate.getMonth() === month;
          })) {
            const s = trackerDays[dateStr];
            if (s === 'flow') { totalFocus += 95; totalMood += 50; totalBlock += 5; }
            else if (s === 'fog') { totalFocus += 50; totalMood += 95; totalBlock += 30; }
            else if (s === 'drought') { totalFocus += 10; totalMood += 20; totalBlock += 95; }
            else if (s === 'storm') { totalFocus += 30; totalMood += 30; totalBlock += 80; }
            count++;
          }
        }
      });

      if (count === 0) return { f: 0, m: 0, b: 0 };
      return { f: Math.round(totalFocus / count), m: Math.round(totalMood / count), b: Math.round(totalBlock / count) };
    };
    const s = getStats();

    return (
      <div className="p-6 space-y-6 pb-48">
        <div className={`${theme === 'dark' ? 'bg-white/5 border-white shadow-[0_8px_0_white]' : 'bg-white border-black shadow-[0_8px_0_black]'} border-4 p-6 rounded-[2rem]`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>{t.tracker}</h3>
            <Calendar className="w-8 h-8 text-pink-vibrant" />
          </div>
          
          <div className={`flex items-center justify-between mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-stone-100'} rounded-full border-2 border-current p-1`}>
            <button onClick={() => setTrackerMonth(m => Math.max(0, m - 1))} className="px-3 py-1 font-black opacity-60 hover:opacity-100">&lt;</button>
            <div className="font-black text-xs uppercase">{monthNames[trackerMonth]} {trackerYear}</div>
            <button onClick={() => setTrackerMonth(m => Math.min(11, m + 1))} className="px-3 py-1 font-black opacity-60 hover:opacity-100">&gt;</button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
              <div key={i} className={`text-center text-[10px] font-black opacity-40 ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>{d}</div>
            ))}
            {blanks.map(b => <div key={`b-${b}`} />)}
            {days.map(day => {
              const dateStr = `${trackerYear}-${(trackerMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const pAura = history.find(h => h.day === day && new Date(h.createdAt || 0).getMonth() === trackerMonth);
              const trackerStatus = trackerDays[dateStr];
              const displayStatus = trackerStatus || (pAura ? pAura.status : null);
              
              return (
                <motion.div 
                  key={day}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTrackerClick(day)}
                  className={`cursor-pointer aspect-square rounded-lg border-2 border-current flex items-center justify-center text-xs font-black relative overflow-hidden transition-colors ${
                    displayStatus ? (
                      displayStatus === 'flow' ? 'bg-lime-vibrant text-black' :
                      displayStatus === 'fog' ? 'bg-pink-vibrant text-black' :
                      displayStatus === 'drought' ? 'bg-blue-vibrant text-white' : 'bg-star-yellow text-black'
                    ) : (theme === 'dark' ? 'bg-white/5 hover:bg-white/20' : 'bg-stone-100 hover:bg-stone-200')
                  }`}
                >
                  {day}
                  {(trackerStatus || pAura) && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-star-yellow/20 border-white text-white shadow-[0_8px_0_white]' : 'bg-star-yellow border-black text-navy-deep shadow-[0_8px_0_black]'} border-4 p-6 rounded-[2rem]`}>
          <div className="flex justify-between items-center mb-4">
             <h4 className="font-black uppercase text-sm">{t.stats}</h4>
          </div>
          <div className="space-y-4">
            {[
              { label: t.concentration, val: s.f, color: 'bg-lime-vibrant' },
              { label: t.mood, val: s.m, color: 'bg-pink-vibrant' },
              { label: t.block, val: s.b, color: 'bg-blue-vibrant' }
            ].map(stat => (
              <div key={stat.label} className="space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span>{stat.label}</span>
                  <span>{stat.val}%</span>
                </div>
                <div className={`h-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-white'} border-2 border-current rounded-full overflow-hidden`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.val}%` }}
                    className={`h-full ${stat.color} border-r-2 border-current`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Use signInWithPopup - ensure it's triggered directly by user gesture
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setCurrentUser(result.user);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("El buscador bloqueó la ventana emergente. Por favor, habilita las ventanas emergentes para BloomMind.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Este dominio no está autorizado para login. Verifica que el dominio de Vercel esté en la lista blanca de Firebase Console.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This is a common error when one popup is already open or user closed it, just ignore it
      } else {
        alert("Ocurrió un error al intentar iniciar sesión. Por favor reintenta.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const handleUpdateName = async () => {
    if (!currentUser) return;
    try {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(currentUser, { displayName: newName });
      setIsEditingName(false);
      // to reflect changes instantly we can just update a dummy state or reload current user
      setCurrentUser({ ...currentUser, displayName: newName } as FirebaseUser);
    } catch (e) {
      console.error(e);
    }
  };

  const getPlantOfTheMonth = () => {
    if (history.length === 0) return t.flow; // default
    
    const counts = { flow: 0, fog: 0, drought: 0, storm: 0 };
    history.forEach(h => {
      if (counts[h.status] !== undefined) counts[h.status]++;
    });
    
    let dominant: CreativeState = 'flow';
    let max = -1;
    for (const [key, val] of Object.entries(counts)) {
      if (val > max) { max = val; dominant = key as CreativeState; }
    }
    
    const plantMap: Record<CreativeState, string> = {
      flow: t.flow, fog: t.fog, drought: t.drought, storm: t.storm
    };
    return plantMap[dominant];
  };

  const renderProfile = () => {
    if (currentUser) {
      return (
        <div className={`p-6 space-y-6 ${theme === 'dark' ? 'dark text-white' : ''}`}>
          <div className={`${theme === 'dark' ? 'bg-white/10 text-white border-white shadow-[0_10px_0_white]' : 'bg-white text-navy-deep border-black shadow-[0_10px_0_black]'} border-4 p-8 rounded-[3rem] text-center space-y-4 relative`}>
            <div className={`w-32 h-32 ${theme === 'dark' ? 'bg-white/10' : 'bg-stone-100'} rounded-full border-4 border-current mx-auto flex items-center justify-center overflow-hidden`}>
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className={`w-16 h-16 ${theme === 'dark' ? 'text-white' : 'text-navy-deep'} opacity-20`} />
              )}
            </div>
            
            <div className="flex flex-col items-center justify-center py-2">
              {isEditingName ? (
                <div className={`flex ${theme === 'dark' ? 'bg-white/10' : 'bg-stone-100'} rounded-full border-2 border-current overflow-hidden shadow-[0_2px_0_currentColor]`}>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Nuevo nombre"
                    className="bg-transparent px-4 py-2 font-black text-sm outline-none w-32"
                  />
                  <button onClick={handleUpdateName} className="bg-lime-vibrant text-black px-4 py-2 font-black text-xs uppercase border-l-2 border-current">OK</button>
                </div>
              ) : (
                <div 
                  className="group cursor-pointer flex flex-col items-center" 
                  onClick={() => { setIsEditingName(true); setNewName(currentUser.displayName || ''); }}
                >
                  <h3 className={`text-2xl font-black uppercase max-w-[200px] mx-auto truncate text-ellipsis group-hover:text-pink-vibrant transition-colors ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>
                    {currentUser.displayName || 'Creative User'}
                  </h3>
                  <div className={`text-[10px] font-black uppercase opacity-40 mt-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-stone-200'} px-2 py-1 rounded-full`}>Editar Nombre</div>
                </div>
              )}
            </div>

            <p className={`text-sm font-bold opacity-60 truncate w-[200px] mx-auto text-ellipsis ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>{currentUser.email}</p>
            
            <div className={`${theme === 'dark' ? 'bg-blue-vibrant/20 text-white' : 'bg-star-yellow text-navy-deep'} border-2 border-current p-4 rounded-2xl shadow-[0_4px_0_currentColor] mt-4 text-left`}>
              <span className="text-[10px] font-black uppercase opacity-60 block">Planta del mes</span>
              <span className="font-black text-lg leading-tight uppercase">{getPlantOfTheMonth()}</span>
              <p className="text-xs font-bold mt-1 opacity-80">(Basado en tus emociones más frecuentes)</p>
            </div>

            {/* Theme Toggle */}
            <div className={`mt-4 p-4 rounded-2xl border-2 border-current ${theme === 'dark' ? 'bg-white/5' : 'bg-stone-50'} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-vibrant text-white' : 'bg-star-yellow text-black'}`}>
                  {theme === 'dark' ? <Wind className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>{theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
              </div>
              <button 
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                className={`w-12 h-6 rounded-full border-2 border-current relative transition-colors ${theme === 'dark' ? 'bg-lime-vibrant' : 'bg-stone-200'}`}
              >
                <motion.div 
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full border border-black"
                />
              </button>
            </div>

            <button 
              onClick={handleLogout}
              className={`w-full mt-4 bg-pink-vibrant text-black font-black py-4 rounded-2xl border-2 border-current shadow-[0_4px_0_currentColor] active:shadow-none active:translate-y-1 transition-all uppercase flex items-center justify-center space-x-2`}
            >
              <LogOut className="w-5 h-5" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
          <div className={`${theme === 'dark' ? 'bg-white/10 border-white text-white shadow-[0_10px_0_white]' : 'bg-white border-black text-navy-deep shadow-[0_10px_0_black]'} border-4 p-8 rounded-[3rem] space-y-6 text-center`}>
          <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-white/10' : 'bg-stone-100'} rounded-full border-4 border-current mx-auto flex items-center justify-center mb-4`}>
             <User className={`w-10 h-10 ${theme === 'dark' ? 'text-white' : 'text-navy-deep'} opacity-30`} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Sign in to save your history</h3>
          <p className="text-xs font-bold opacity-60">Connect with Google to securely store your creative states and track your blooming over time.</p>

          <button 
            onClick={handleLogin}
            className={`w-full ${theme === 'dark' ? 'bg-lime-vibrant text-black border-white shadow-[0_4px_0_white]' : 'bg-lime-vibrant text-black border-black shadow-[0_4px_0_black]'} font-black py-4 rounded-2xl border-2 active:shadow-none active:translate-y-1 transition-all uppercase flex items-center justify-center space-x-2 mt-4`}
          >
            <UserPlus className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f0ea] flex justify-center items-start sm:items-center relative overflow-hidden">
      {/* Decorative Desktop Background */}
      <div className="hidden sm:block absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-lime-vibrant rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-pulse" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-pink-vibrant rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-20 left-1/3 w-[30rem] h-[30rem] bg-blue-vibrant rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main App Container */}
      <div className={`w-full min-h-screen sm:min-h-[850px] sm:h-[90vh] ${theme === 'dark' ? 'bg-navy-deep text-white' : 'bg-white text-navy-deep'} font-sans flex flex-col max-w-md sm:rounded-[3rem] shadow-2xl overflow-hidden relative border-x-4 sm:border-y-4 border-navy-deep z-10`}>
      
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} t={t} />
      <button 
        onClick={toggleLang}
        className="absolute top-4 right-4 z-[60] bg-white border-2 border-black p-2 rounded-full shadow-[0_2px_0_black] active:shadow-none active:translate-y-0.5 transition-all flex items-center space-x-1"
      >
        <Languages className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase">{lang}</span>
      </button>

      <AnimatePresence mode="wait">
        {/* SCAN / SPLASH SCREEN */}
        {activeTab === 'scan' && (
          <motion.div 
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col bg-navy-deep p-8 relative overflow-y-auto overflow-x-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-10 right-10 w-20 h-20 bg-blue-vibrant rounded-full opacity-20 blur-xl" />
            <div className="absolute bottom-40 left-10 w-32 h-32 bg-pink-vibrant rounded-full opacity-20 blur-xl" />
            
            <div className="mt-12 space-y-2">
              <h1 className="text-4xl font-black text-lime-vibrant leading-tight uppercase tracking-tighter">
                {t.title.split(' ').slice(0, 3).join(' ')}<br />
                {t.title.split(' ').slice(3, 5).join(' ')}<br />
                {t.title.split(' ').slice(5).join(' ')}
              </h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Sticker elements */}
              <motion.div 
                animate={{ rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute top-0 right-0 bg-lime-vibrant px-4 py-2 rounded-full border-2 border-black font-black text-xs rotate-12 z-10"
              >
                {t.hello}
              </motion.div>
              
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute top-24 -left-4 bg-blue-vibrant px-6 py-3 rounded-full border-2 border-black font-black text-lg -rotate-12 z-50"
              >
                {t.start}
              </motion.div>

              {/* Camera / Character Area */}
              <div className="relative w-full aspect-square flex items-center justify-center">
                <div className="w-64 h-64 rounded-3xl overflow-hidden border-4 border-black bg-white relative flex items-center justify-center">
                   <canvas ref={canvasRef} className="hidden" />
                   {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover grayscale" />
                   ) : (hasCameraPermission === false || permissionError) ? (
                    <div className="p-4 text-center space-y-3 pt-10">
                      <div className="bg-red-50 p-2 rounded-2xl border border-red-100 mb-1">
                        <p className="text-[10px] font-black uppercase text-red-500 leading-tight">{t.permissionDenied}</p>
                      </div>
                      <div className="flex flex-col space-y-2 relative">
                        <button 
                          onClick={() => { setHasCameraPermission(null); setPermissionError(null); startCamera(); }}
                          className="bg-navy-deep text-white text-[10px] font-black px-4 py-2 rounded-full border-2 border-black shadow-[0_2px_0_black] active:shadow-none active:translate-y-0.5 transition-all uppercase"
                        >
                          {t.requestPermission}
                        </button>
                        
                        <div className="relative mt-2">
                           <input 
                             type="file" 
                             accept="image/*" 
                             className="hidden" 
                             ref={fileInputRef}
                             onChange={handleFileUpload}
                           />
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="w-full bg-lime-vibrant text-black text-[10px] font-black px-4 py-2 rounded-full border-2 border-black shadow-[0_2px_0_black] active:shadow-none active:translate-y-0.5 transition-all"
                           >
                             {t.uploadPhoto || "Upload Photo"}
                           </button>
                        </div>
                        
                        <a 
                          href="https://support.google.com/chrome/answer/2693767" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[8px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity underline mt-2 inline-block"
                        >
                          Troubleshoot Camera
                        </a>
                      </div>
                    </div>
                   ) : hasCameraPermission === null ? (
                    <div className="flex flex-col items-center space-y-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-navy-deep opacity-40" />
                      <span className="text-[10px] font-black uppercase opacity-40">{t.requesting}</span>
                    </div>
                   ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                   )}
                   
                   {isScanning && (
                    <div className="absolute inset-0 bg-lime-vibrant/40 flex items-center justify-center z-20">
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-full h-1 bg-white shadow-[0_0_10px_white] absolute"
                      />
                      <Sparkles className="w-12 h-12 text-white animate-pulse" />
                    </div>
                   )}
                </div>
                
                {/* Character overlaying camera */}
                {!isScanning && !capturedImage && (
                  <div className="absolute -bottom-10 -right-4">
                    <AuraCharacter status="flow" size="md" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {!capturedImage ? (
                <button 
                  onClick={capturePhoto}
                  disabled={hasCameraPermission === false}
                  className={`w-full bg-lime-vibrant text-black font-black py-4 rounded-2xl border-2 border-black shadow-[0_4px_0_black] active:shadow-none active:translate-y-1 transition-all uppercase tracking-widest ${hasCameraPermission === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t.capture}
                </button>
              ) : (
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setCapturedImage(null)}
                    className="flex-1 bg-white text-black font-black py-4 rounded-2xl border-2 border-black shadow-[0_4px_0_black] active:shadow-none active:translate-y-1 transition-all uppercase"
                  >
                    {t.retake}
                  </button>
                  <button 
                    onClick={handleScan}
                    className="flex-1 bg-lime-vibrant text-black font-black py-4 rounded-2xl border-2 border-black shadow-[0_4px_0_black] active:shadow-none active:translate-y-1 transition-all uppercase"
                  >
                    {t.analyze}
                  </button>
                </div>
              )}
              <button 
                onClick={() => setActiveTab('history')}
                className="w-full text-white/60 font-bold text-sm uppercase tracking-widest py-2"
              >
                {t.history}
              </button>
            </div>
          </motion.div>
        )}

        {/* DASHBOARD VIEWS */}
        {(activeTab !== 'scan') && (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-navy-deep' : 'bg-[#f0f4ff]'} h-full overflow-y-auto relative pb-32`}
          >
            {/* Header */}
            <div className="p-6 pt-16">
              <div className="flex flex-wrap items-center justify-between">
                <div>
                  <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-navy-deep'} leading-tight`}>{activeTab === 'guide' ? t.guideTitle : t.goodMorning}</h2>
                  {activeTab === 'guide' && (
                    <p className="text-sm font-bold opacity-60 mt-1">Conoce cómo te sientes</p>
                  )}
                </div>
                {activeTab === 'guide' && (
                  <button 
                    onClick={() => setActiveTab('tracker')}
                    className={`mt-4 w-full sm:w-auto ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white text-navy-deep'} border-2 border-current px-6 py-2 rounded-full font-black text-xs shadow-[0_2px_0_currentColor] active:shadow-none active:translate-y-0.5 transition-all`}
                  >
                    {t.back}
                  </button>
                )}
              </div>
              
              {/* Diagnostic Message moved down if needed, but keeping logic for now */}

              {/* Guide Button for Tracker */}
              {activeTab === 'tracker' && (
                <button 
                  onClick={() => setActiveTab('guide')}
                  className={`w-full mt-6 ${theme === 'dark' ? 'bg-lime-vibrant/20 border-white text-white' : 'bg-lime-vibrant border-black text-navy-deep'} border-4 p-4 rounded-2xl shadow-[0_6px_0_currentColor] active:shadow-none active:translate-y-1 transition-all flex items-center justify-between group`}
                >
                  <span className="text-xs font-black uppercase text-left leading-tight max-w-[200px]">
                    {t.learnMore}
                  </span>
                  <div className="bg-white p-2 rounded-full border-2 border-black group-hover:rotate-12 transition-transform">
                    <Sparkles className="w-5 h-5 text-pink-vibrant" />
                  </div>
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1">
              {activeTab === 'diagnosis' && currentAura && (
                <div className="p-6">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-lime-vibrant rounded-[2.5rem] p-6 border-2 border-black shadow-[0_6px_0_black] relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">{t.currentAura}</h3>
                        <p className="text-sm font-bold opacity-80">{getAuraData(currentAura.status).diagnosis}</p>
                      </div>
                      <span className="font-black text-xs uppercase opacity-60">Now</span>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <AuraCharacter status={currentAura.status} size="md" />
                      <div className="text-right space-y-1">
                        <div className="text-xs font-black uppercase opacity-60">{t.ritual}</div>
                        <p className="text-sm font-bold max-w-[150px] leading-tight">{getAuraData(currentAura.status).ritual}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Diagnostic Message Box (Repositioned lower) */}
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 bg-white border-2 border-black p-4 rounded-3xl flex items-center space-x-3 shadow-[0_4px_0_black]"
                  >
                    <div className="bg-lime-vibrant p-2 rounded-full border-2 border-black text-black">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase leading-tight">Tu floración ha sido actualizada en tu historial y base de datos.</p>
                  </motion.div>

                  {/* View History Button */}
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    onClick={() => {
                      setActiveTab('history');
                      const colToday = getColombiaDateString(new Date());
                      setSelectedHistoryDate(colToday);
                    }}
                    className="w-full mt-6 bg-blue-vibrant text-white font-black py-4 rounded-2xl border-2 border-black shadow-[0_4px_0_black] active:shadow-none active:translate-y-1 transition-all uppercase tracking-widest flex items-center justify-center space-x-2"
                  >
                    <History className="w-5 h-5" />
                    <span>Ver mi historial</span>
                  </motion.button>
                </div>
              )}

              {activeTab === 'tracker' && renderTracker()}

              {activeTab === 'guide' && renderGuide()}

              {activeTab === 'history' && (
                <div className="flex-1 flex flex-col">
                  {/* Colombia Linked Date Picker */}
                  <div className="px-6 pt-4 mb-6 overflow-x-auto no-scrollbar">
                    <div className="flex space-x-4 justify-center">
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        const offset = i - 3;
                        d.setDate(d.getDate() + offset);
                        
                        const dayStr = getColombiaDateString(d);
                        // We need the Bogota day/month for the label
                        const colDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Bogota" }));
                        const dayNum = colDate.getDate();
                        const dayName = (lang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])[colDate.getDay()];
                        const monthShort = (lang === 'es' ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dic'])[colDate.getMonth()];
                        
                        const isToday = getColombiaDateString(new Date()) === dayStr;
                        const isSelected = selectedHistoryDate === dayStr;

                        return (
                          <motion.button
                            key={dayStr}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedHistoryDate(dayStr)}
                            className={`flex-shrink-0 w-14 h-20 rounded-2xl border-2 border-current flex flex-col items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-blue-vibrant text-white shadow-[0_4px_0_currentColor]' 
                                : (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-lime-vibrant text-navy-deep')
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase opacity-60">{dayName}</span>
                            <span className="text-xl font-black">{dayNum}</span>
                            <span className="text-[8px] font-black uppercase">{monthShort}</span>
                            {isToday && <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-vibrant rounded-full border border-black" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 px-6 space-y-4 pb-24">
                    {(() => {
                      const recordsForDay = history.filter(h => h.date === selectedHistoryDate);
                      
                      if (recordsForDay.length > 0) {
                        return recordsForDay.map((item, idx) => {
                          const auraData = getAuraData(item.status);
                          return (
                            <motion.div 
                              key={item.id}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`rounded-[2.5rem] p-6 border-2 border-black shadow-[0_6px_0_black] relative overflow-hidden ${
                                item.status === 'flow' ? 'bg-lime-vibrant text-black' : 
                                item.status === 'fog' ? 'bg-pink-vibrant text-black' : 
                                item.status === 'drought' ? 'bg-blue-vibrant text-white' : 'bg-star-yellow text-black'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-black uppercase tracking-tighter">{auraData.diagnosis}</h3>
                                  <p className="text-sm font-bold opacity-80">{auraData.aroma}</p>
                                </div>
                                <span className={`font-black text-[10px] uppercase opacity-60 p-2 rounded-full ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-white/20 text-navy-deep'}`}>{formatDisplayDate(item.date)}</span>
                              </div>
                              
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                   <AuraCharacter status={item.status} size="sm" />
                                   <div className="text-xs font-black uppercase">
                                     <div>{t.focus}: {item.focusLevel}%</div>
                                     <div>{t.mood}: {item.moodLevel}%</div>
                                   </div>
                                </div>
                                <div className="text-right flex flex-col justify-center">
                                   <div className="text-[10px] font-black uppercase opacity-60">{t.tip}</div>
                                   <p className="text-[10px] font-bold leading-tight italic">"{auraData.tip}"</p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        });
                      } else {
                        // AUTOMATIC RECORD - fallback for empty days
                        const auraData = getAuraData('fog');
                        const isTodaySelected = getColombiaDateString(new Date()) === selectedHistoryDate;
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`rounded-[2.5rem] p-8 border-2 border-current border-dashed text-center space-y-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/50'}`}
                          >
                            <div className="flex flex-col items-center">
                              {isTodaySelected ? (
                                <button 
                                  onClick={() => setActiveTab('scan')}
                                  className="group flex flex-col items-center"
                                >
                                  <div className={`w-16 h-16 bg-lime-vibrant rounded-full border-2 border-black flex items-center justify-center mb-4 shadow-[0_4px_0_black] group-active:translate-y-1 group-active:shadow-none transition-all text-black`}>
                                    <Camera className="w-8 h-8" />
                                  </div>
                                  <h3 className={`text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>Comenzar Escaneo</h3>
                                  <p className={`text-xs font-bold uppercase opacity-60 ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>Analiza tu floración de hoy</p>
                                </button>
                              ) : (
                                <>
                                  <RefreshCw className={`w-12 h-12 ${theme === 'dark' ? 'text-white' : 'text-navy-deep'} opacity-20 mb-4 animate-spin-slow`} />
                                  <h3 className={`text-xl font-black uppercase tracking-tighter opacity-40 ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>Sin Registro</h3>
                                  <p className={`text-xs font-bold uppercase opacity-30 ${theme === 'dark' ? 'text-white' : 'text-navy-deep'}`}>No hay datos para {selectedHistoryDate}</p>
                                </>
                              )}
                            </div>

                            <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-stone-100/50'} p-6 rounded-3xl border-2 border-current border-dashed opacity-40 grayscale flex flex-col items-center`}>
                               <AuraCharacter status="fog" size="sm" />
                               <p className="mt-4 font-bold text-[10px] italic">"Tu historial se vincula automáticamente con cada escaneo facial que realizas."</p>
                            </div>
                          </motion.div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && renderProfile()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom Nav */}
      {activeTab !== 'scan' && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[350px] ${theme === 'dark' ? 'bg-navy-deep border-white shadow-[0_6px_0_white]' : 'bg-white border-black shadow-[0_6px_0_black]'} rounded-full border-2 flex items-center justify-around p-2 z-50`}>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`p-3 rounded-full transition-all ${activeTab === 'scan' ? (theme === 'dark' ? 'bg-white text-navy-deep border-2 border-navy-deep' : 'bg-navy-deep text-white border-2 border-white/20') : (theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-navy-deep hover:bg-stone-100')}`}
          >
            <Home className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`p-3 rounded-full transition-all ${(activeTab === 'tracker' || activeTab === 'guide') ? (theme === 'dark' ? 'bg-white text-navy-deep border-2 border-navy-deep' : 'bg-navy-deep text-white border-2 border-white/20') : (theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-navy-deep hover:bg-stone-100')}`}
          >
            <Calendar className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`p-3 rounded-full transition-all ${activeTab === 'history' ? (theme === 'dark' ? 'bg-white text-navy-deep border-2 border-navy-deep' : 'bg-navy-deep text-white border-2 border-white/20') : (theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-navy-deep hover:bg-stone-100')}`}
          >
            <History className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`p-3 rounded-full transition-all ${activeTab === 'profile' ? (theme === 'dark' ? 'bg-white text-navy-deep border-2 border-navy-deep' : 'bg-navy-deep text-white border-2 border-white/20') : (theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-navy-deep hover:bg-stone-100')}`}
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
    </div>
  );
}

