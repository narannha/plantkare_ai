import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, History, Leaf, Droplets, Thermometer, Sun, Activity, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type HealthStatus = 'healthy' | 'stress' | 'mild_disease' | 'critical';

interface PlantState {
  id: string;
  date: string;
  status: HealthStatus;
  diagnosis: string;
  temperature: number;
  humidity: number;
  light: number;
  recommendation: string;
  imageUrl?: string;
}

// --- Mock Data ---
const mockHistory: PlantState[] = [
  {
    id: '1',
    date: 'Hace 2 semanas',
    status: 'healthy',
    diagnosis: 'Planta saludable',
    temperature: 22,
    humidity: 60,
    light: 5000,
    recommendation: 'Mantener cuidados actuales.',
  },
  {
    id: '2',
    date: 'Hace 1 semana',
    status: 'stress',
    diagnosis: 'Estrés hídrico leve',
    temperature: 25,
    humidity: 30,
    light: 6000,
    recommendation: 'Aumentar frecuencia de riego.',
  },
];

const generateMockDiagnosis = (imageUrl: string): PlantState => {
  const statuses: HealthStatus[] = ['healthy', 'stress', 'mild_disease', 'critical'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const diagnoses = {
    healthy: 'Planta en perfecto estado',
    stress: 'Estrés por calor',
    mild_disease: 'Deficiencia de nutrientes',
    critical: 'Infección fúngica grave'
  };

  const recommendations = {
    healthy: '¡Sigue así! Tu planta está feliz.',
    stress: 'Mueve la planta a un lugar más fresco y revisa la humedad.',
    mild_disease: 'Aplica un fertilizante equilibrado (NPK).',
    critical: 'Aísla la planta y aplica fungicida inmediatamente.'
  };

  return {
    id: Date.now().toString(),
    date: 'Justo ahora',
    status: randomStatus,
    diagnosis: diagnoses[randomStatus],
    temperature: Math.floor(Math.random() * 15) + 15, // 15-30
    humidity: Math.floor(Math.random() * 60) + 20, // 20-80
    light: Math.floor(Math.random() * 8000) + 2000, // 2000-10000
    recommendation: recommendations[randomStatus],
    imageUrl
  };
};

// --- Components ---

const PlantAvatar = ({ status, size = 'lg' }: { status: HealthStatus, size?: 'sm' | 'md' | 'lg' }) => {
  const getFace = () => {
    switch (status) {
      case 'healthy': return '😎';
      case 'stress': return '🥵';
      case 'mild_disease': return '🤢';
      case 'critical': return '💀';
      default: return '😐';
    }
  };

  const getColor = () => {
    switch (status) {
      case 'healthy': return 'bg-lime-300 text-lime-800 border-lime-500 shadow-[0_0_15px_rgba(163,230,53,0.6)]';
      case 'stress': return 'bg-yellow-300 text-yellow-800 border-yellow-500 shadow-[0_0_15px_rgba(253,224,71,0.6)]';
      case 'mild_disease': return 'bg-orange-300 text-orange-800 border-orange-500 shadow-[0_0_15px_rgba(253,186,116,0.6)]';
      case 'critical': return 'bg-red-400 text-red-900 border-red-600 shadow-[0_0_15px_rgba(248,113,113,0.6)]';
      default: return 'bg-gray-200 text-gray-600 border-gray-400';
    }
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl border-2',
    md: 'w-20 h-20 text-4xl border-4',
    lg: 'w-32 h-32 text-6xl border-4',
  };

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={`rounded-full flex items-center justify-center ${sizeClasses[size]} ${getColor()} transition-all duration-300`}
    >
      <motion.div
        animate={status === 'healthy' ? { y: [0, -5, 0] } : status === 'stress' ? { x: [-2, 2, -2] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {getFace()}
      </motion.div>
    </motion.div>
  );
};

const StatusBadge = ({ status, text }: { status: HealthStatus, text: string }) => {
  const getColors = () => {
    switch (status) {
      case 'healthy': return 'bg-lime-500 text-lime-950 border-lime-600';
      case 'stress': return 'bg-yellow-400 text-yellow-950 border-yellow-500';
      case 'mild_disease': return 'bg-orange-500 text-orange-950 border-orange-600';
      case 'critical': return 'bg-red-500 text-white border-red-700';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  return (
    <span className={`px-4 py-1.5 rounded-full font-bold text-sm shadow-md border-2 ${getColors()}`}>
      {text}
    </span>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'diagnosis' | 'history'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<PlantState | null>(null);
  const [history, setHistory] = useState<PlantState[]>(mockHistory);
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = mediaStream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
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

  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

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

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleScan = () => {
    if (!capturedImage) return;
    
    setIsScanning(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsScanning(false);
      const newDiagnosis = generateMockDiagnosis(capturedImage);
      setCurrentDiagnosis(newDiagnosis);
      setHistory(prev => [newDiagnosis, ...prev]);
      setActiveTab('diagnosis');
      setCapturedImage(null); // Reset for next time
    }, 3000);
  };

  const handleWater = () => {
    setIsWatering(true);
    setTimeout(() => setIsWatering(false), 2500);
  };

  return (
    <div className="min-h-screen bg-yellow-50 text-stone-800 font-sans flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x-4 border-yellow-400">
      {/* Header */}
      <header className="bg-yellow-400 text-yellow-950 p-4 flex items-center justify-center shadow-[0_4px_20px_rgba(250,204,21,0.4)] z-20 relative overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -right-10 -top-10 opacity-20"
        >
          <Sun className="w-32 h-32" />
        </motion.div>
        <Leaf className="mr-2 w-8 h-8" />
        <h1 className="text-2xl font-black tracking-tight uppercase italic">PlantCare AI</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <AnimatePresence mode="wait">
          
          {/* SCANNER TAB */}
          {activeTab === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="h-full flex flex-col items-center justify-center p-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-yellow-600 mb-2 drop-shadow-sm">¡Analiza tu Planta!</h2>
                <p className="text-stone-600 font-medium">Toma una foto para descubrir cómo se siente.</p>
              </div>

              <div className="relative w-72 h-96 rounded-[2rem] overflow-hidden bg-stone-800 border-8 border-yellow-400 flex items-center justify-center mb-8 shadow-[0_10px_30px_rgba(250,204,21,0.3)]">
                {/* Hidden canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />

                {capturedImage ? (
                  <img src={capturedImage} alt="Captured plant" className="w-full h-full object-cover" />
                ) : hasCameraPermission === false ? (
                  <div className="text-center p-4 text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-red-400" />
                    <p>Permiso de cámara denegado.</p>
                    <button onClick={startCamera} className="mt-4 px-4 py-2 bg-yellow-400 text-yellow-950 rounded-full font-bold">Reintentar</button>
                  </div>
                ) : (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    onLoadedMetadata={() => {
                      videoRef.current?.play().catch(e => console.error("Error playing video:", e));
                    }}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-yellow-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-full h-2 bg-yellow-300 shadow-[0_0_20px_rgba(253,224,71,1)] absolute left-0"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Activity className="w-16 h-16 text-yellow-300 drop-shadow-lg mb-2" />
                    </motion.div>
                    <p className="text-yellow-300 font-black text-xl tracking-widest uppercase drop-shadow-md">Analizando...</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 w-full px-4">
                {!capturedImage ? (
                  <button 
                    onClick={capturePhoto}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black text-lg py-4 px-8 rounded-full shadow-[0_6px_0_rgba(202,138,4,1)] hover:shadow-[0_4px_0_rgba(202,138,4,1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center"
                  >
                    <Camera className="mr-2 w-6 h-6" />
                    Tomar Foto
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={retakePhoto}
                      disabled={isScanning}
                      className="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold py-4 rounded-full shadow-[0_6px_0_rgba(168,162,158,1)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      <RefreshCw className="mr-2 w-5 h-5" />
                      Otra vez
                    </button>
                    <button 
                      onClick={handleScan}
                      disabled={isScanning}
                      className="flex-1 bg-lime-400 hover:bg-lime-500 text-lime-950 font-black py-4 rounded-full shadow-[0_6px_0_rgba(101,163,13,1)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      <Activity className="mr-2 w-5 h-5" />
                      Analizar
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* DIAGNOSIS TAB */}
          {activeTab === 'diagnosis' && currentDiagnosis && (
            <motion.div 
              key="diagnosis"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="p-6 flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-yellow-600 drop-shadow-sm">Resultado</h2>
                <StatusBadge status={currentDiagnosis.status} text={currentDiagnosis.diagnosis} />
              </div>

              <div className="mb-10 relative">
                <motion.div
                   animate={{ y: [-10, 10, -10] }}
                   transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <PlantAvatar status={currentDiagnosis.status} />
                </motion.div>
                
                {/* Watering Animation (GIF style) */}
                <AnimatePresence>
                  {isWatering && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-10 -left-10 w-48 h-48 pointer-events-none z-30"
                    >
                      {/* Using a placeholder for a watering gif, using emoji particles instead for reliability */}
                      <div className="absolute inset-0 flex items-start justify-center pt-4">
                         <motion.div animate={{ y: [0, 100], opacity: [1, 0] }} transition={{ duration: 0.8, repeat: 3 }} className="text-3xl absolute left-10">💧</motion.div>
                         <motion.div animate={{ y: [0, 120], opacity: [1, 0] }} transition={{ duration: 0.7, repeat: 3, delay: 0.2 }} className="text-4xl absolute left-20">💦</motion.div>
                         <motion.div animate={{ y: [0, 90], opacity: [1, 0] }} transition={{ duration: 0.9, repeat: 3, delay: 0.4 }} className="text-2xl absolute right-10">💧</motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Indicators Grid */}
              <div className="w-full grid grid-cols-3 gap-4 mb-8">
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 rounded-3xl shadow-[0_8px_0_rgba(231,229,228,1)] border-2 border-stone-200 flex flex-col items-center">
                  <Thermometer className="w-8 h-8 text-orange-500 mb-2" />
                  <span className="text-xs text-stone-400 font-bold uppercase">Temp</span>
                  <span className="text-xl font-black text-stone-700">{currentDiagnosis.temperature}°C</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 rounded-3xl shadow-[0_8px_0_rgba(231,229,228,1)] border-2 border-stone-200 flex flex-col items-center">
                  <Droplets className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-xs text-stone-400 font-bold uppercase">Humedad</span>
                  <span className="text-xl font-black text-stone-700">{currentDiagnosis.humidity}%</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 rounded-3xl shadow-[0_8px_0_rgba(231,229,228,1)] border-2 border-stone-200 flex flex-col items-center">
                  <Sun className="w-8 h-8 text-yellow-500 mb-2" />
                  <span className="text-xs text-stone-400 font-bold uppercase">Luz</span>
                  <span className="text-xl font-black text-stone-700">{currentDiagnosis.light} lx</span>
                </motion.div>
              </div>

              {/* Recommendations */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full bg-yellow-100 rounded-3xl p-6 border-4 border-yellow-300 mb-8 shadow-[0_8px_0_rgba(253,224,71,1)] relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 text-6xl opacity-20">💡</div>
                <h3 className="text-yellow-900 font-black text-xl mb-3 flex items-center">
                  ¡Plan de Acción!
                </h3>
                <p className="text-yellow-800 font-medium text-lg leading-snug">
                  {currentDiagnosis.recommendation}
                </p>
              </motion.div>

              {/* Actions */}
              <div className="w-full flex space-x-4">
                <button 
                  onClick={handleWater}
                  disabled={isWatering}
                  className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-cyan-950 font-black text-lg py-4 rounded-full shadow-[0_6px_0_rgba(6,182,212,1)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center"
                >
                  <Droplets className="w-6 h-6 mr-2" />
                  ¡Regar!
                </button>
                <button 
                  onClick={() => {
                    setCapturedImage(null);
                    setActiveTab('scan');
                  }}
                  className="flex-1 bg-fuchsia-400 hover:bg-fuchsia-500 text-fuchsia-950 font-black text-lg py-4 rounded-full shadow-[0_6px_0_rgba(192,38,211,1)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Otra Foto
                </button>
              </div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="p-6"
            >
              <h2 className="text-3xl font-black text-yellow-600 mb-8 drop-shadow-sm flex items-center">
                <History className="mr-3 w-8 h-8" />
                Tu Diario
              </h2>
              
              <div className="space-y-6">
                {history.map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={item.id} 
                    className="bg-white rounded-[2rem] p-5 shadow-[0_8px_0_rgba(231,229,228,1)] border-2 border-stone-200 flex items-center relative overflow-hidden"
                  >
                    {item.imageUrl && (
                       <div className="absolute right-0 top-0 bottom-0 w-24 opacity-20">
                         <img src={item.imageUrl} className="w-full h-full object-cover" alt="scan" />
                         <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
                       </div>
                    )}
                    <div className="mr-5 z-10">
                      <PlantAvatar status={item.status} size="md" />
                    </div>
                    <div className="flex-1 z-10">
                      <div className="flex flex-col mb-2">
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{item.date}</span>
                        <h3 className="font-black text-lg text-stone-800 leading-tight">{item.diagnosis}</h3>
                      </div>
                      <StatusBadge status={item.status} text={item.status === 'healthy' ? 'Sana' : item.status === 'stress' ? 'Estrés' : 'Enferma'} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t-4 border-stone-200 flex justify-around items-center p-2 pb-safe absolute bottom-0 w-full z-30 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => {
            setCapturedImage(null);
            setActiveTab('scan');
          }}
          className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${activeTab === 'scan' ? 'bg-yellow-100 text-yellow-600 scale-110' : 'text-stone-400 hover:bg-stone-50'}`}
        >
          <Camera className={`w-7 h-7 mb-1 ${activeTab === 'scan' ? 'animate-bounce' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">Cámara</span>
        </button>
        
        <button 
          onClick={() => currentDiagnosis && setActiveTab('diagnosis')}
          disabled={!currentDiagnosis}
          className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${activeTab === 'diagnosis' ? 'bg-lime-100 text-lime-600 scale-110' : 'text-stone-400 hover:bg-stone-50'} ${!currentDiagnosis && 'opacity-40 cursor-not-allowed'}`}
        >
          <Activity className={`w-7 h-7 mb-1 ${activeTab === 'diagnosis' ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">Estado</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${activeTab === 'history' ? 'bg-fuchsia-100 text-fuchsia-600 scale-110' : 'text-stone-400 hover:bg-stone-50'}`}
        >
          <History className={`w-7 h-7 mb-1 ${activeTab === 'history' ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '3s' }} />
          <span className="text-[10px] font-black uppercase tracking-widest">Diario</span>
        </button>
      </nav>
    </div>
  );
}
