
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LiveAssistant from './components/LiveAssistant';
import AuthModal from './components/AuthModal';
import PaymentModal from './components/PaymentModal';
import AdminDashboard from './components/AdminDashboard';
import { AppTheme, Project, ProductInput, AspectRatio, GenerationState, GeneratedAsset, MusicTrack, User } from './types';
import { researchProduct, generateCatalogueImage, generateVeoVideo, fileToBase64, editGeneratedImage, generateVoiceOver, generateSocialPost } from './services/geminiService';
import { getCurrentUser, logoutUser, deductCredit } from './services/authService';

const MUSIC_LIBRARY: MusicTrack[] = [
    { id: 'm1', name: 'Corporativo Animado', genre: 'Negocios', url: 'https://cdn.pixabay.com/audio/2024/09/20/audio_51a37c1660.mp3' },
    { id: 'm2', name: 'Ambiente Chill', genre: 'Relax', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'm3', name: 'Deporte Dinámico', genre: 'Acción', url: 'https://cdn.pixabay.com/audio/2024/08/12/audio_494539665f.mp3' },
    { id: 'm4', name: 'Lounge Lujoso', genre: 'Moda', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_735c02931a.mp3' },
    { id: 'm5', name: 'Pop Upbeat', genre: 'Comercial', url: 'https://cdn.pixabay.com/audio/2023/10/24/audio_3d3e818817.mp3' },
];

function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // --- App State ---
  const [theme, setTheme] = useState<AppTheme>(AppTheme.LIGHT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- Project State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // --- Input State ---
  const [campaignName, setCampaignName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('Estudio Minimalista');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  
  // --- Music State ---
  const [selectedMusicId, setSelectedMusicId] = useState<string>('');
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // --- Generation State ---
  const [genState, setGenState] = useState<GenerationState>(GenerationState.IDLE);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [socialTextLoading, setSocialTextLoading] = useState(false);

  // --- Edit Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<GeneratedAsset | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  // Helper to determine if loading
  const isGenerating = [
    GenerationState.RESEARCHING,
    GenerationState.GENERATING_IMAGES,
    GenerationState.GENERATING_VIDEO
  ].includes(genState);

  // --- Effects ---
  useEffect(() => {
    // Load User
    const user = getCurrentUser();
    if (user) {
        setCurrentUser(user);
    } else {
        setShowAuthModal(true);
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme(AppTheme.DARK);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === AppTheme.DARK) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Handle Logo Preview to avoid flickering and memory leaks
  useEffect(() => {
    if (!logo) {
      setLogoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(logo);
    setLogoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logo]);

  // --- Handlers ---

  const handleAuthSuccess = (user: User) => {
      setCurrentUser(user);
      setShowAuthModal(false);
  };

  const handleLogout = () => {
      logoutUser();
      setCurrentUser(null);
      setShowAuthModal(true);
  };

  const handleResearch = async () => {
    if (!productUrl) return;
    setGenState(GenerationState.RESEARCHING);
    setProgressMsg("Analizando URL del producto...");
    setErrorMessage('');
    try {
      const info = await researchProduct(productUrl);
      setDescription(prev => (prev ? prev + "\n\n" : "") + info);
      setGenState(GenerationState.IDLE);
    } catch (e) {
      setGenState(GenerationState.IDLE); // Go back to idle on research error so user can edit
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!currentUser) {
        setShowAuthModal(true);
        return;
    }

    if (images.length === 0) {
      alert("Por favor sube al menos una imagen del producto.");
      return;
    }

    setErrorMessage('');

    // Try to deduct credit
    try {
        const updatedUser = deductCredit(currentUser.id);
        setCurrentUser(updatedUser); // Update local state
    } catch (e) {
        setShowPaymentModal(true);
        return;
    }

    setGenState(GenerationState.GENERATING_IMAGES);
    setProgressMsg("Creando imágenes de catálogo premium (1/3)...");

    const newAssets: GeneratedAsset[] = [];

    try {
      // 1. Generate Images (3 variations)
      const base64Img = await fileToBase64(images[0]);
      
      for (let i = 0; i < 3; i++) {
        setProgressMsg(`Creando imagen premium (${i+1}/3)...`);
        const generatedImgUrl = await generateCatalogueImage(base64Img, description, style);
        
        newAssets.push({
          id: `img-${Date.now()}-${i}`,
          type: 'image',
          url: generatedImgUrl
        });
      }

      // 2. Generate Voiceover
      setGenState(GenerationState.GENERATING_VIDEO);
      setProgressMsg("Generando guion y voz en off...");
      const voiceUrl = await generateVoiceOver(description.substring(0, 200)); // Limit length
      if (voiceUrl) {
          newAssets.push({ id: `aud-${Date.now()}`, type: 'audio', url: voiceUrl, subType: 'voiceover' });
      }

      // 3. Generate Video
      setProgressMsg("Renderizando video comercial con Veo (esto puede tardar unos minutos)...");
      console.log("Iniciando generación de video Veo...");
      
      const videoUrl = await generateVeoVideo(newAssets[0].url, description, aspectRatio);
      console.log("Video generado:", videoUrl);
      
      newAssets.push({
        id: `vid-${Date.now()}`,
        type: 'video',
        url: videoUrl,
        thumbnail: newAssets[0].url // Use first image as thumb
      });

      // 4. Create Project
      const finalName = campaignName.trim() || `Campaña ${new Date().toLocaleDateString()}`;
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: finalName,
        date: new Date(),
        input: {
          images, logo, url: productUrl, description, style, aspectRatio,
          musicTrackId: selectedMusicId, musicVolume, voiceVolume
        },
        assets: newAssets
      };

      // FIFO Logic (Keep only last 5)
      const updatedProjects = [newProject, ...projects].slice(0, 5);
      setProjects(updatedProjects);
      setCurrentProject(newProject);
      setGenState(GenerationState.COMPLETE);

    } catch (error: any) {
      console.error("Error completo en handleGenerate:", error);
      setErrorMessage(error.message || "Error desconocido durante la generación.");
      setGenState(GenerationState.ERROR);
    }
  };

  // --- EDIT FUNCTIONALITY ---
  
  const openEditModal = (asset: GeneratedAsset) => {
      setEditingAsset(asset);
      setEditPrompt(""); // Reset prompt
      setIsEditModalOpen(true);
  };

  const handleConfirmEdit = async () => {
      if (!editingAsset || !editPrompt || !currentProject) return;
      
      setIsEditModalOpen(false);
      setErrorMessage('');
      
      try {
          if (editingAsset.type === 'image') {
              setGenState(GenerationState.GENERATING_IMAGES);
              setProgressMsg("Editando imagen con IA...");
              
              const newUrl = await editGeneratedImage(editingAsset.url, editPrompt);
              
              // Create new asset
              const newAsset: GeneratedAsset = {
                  id: `img-edit-${Date.now()}`,
                  type: 'image',
                  url: newUrl
              };
              
              // Update Project Assets
              const updatedProject = {
                  ...currentProject,
                  assets: [newAsset, ...currentProject.assets]
              };
              
              setCurrentProject(updatedProject);
              setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
              
          } else if (editingAsset.type === 'video') {
              setGenState(GenerationState.GENERATING_VIDEO);
              setProgressMsg("Regenerando video con nueva instrucción (esto tarda unos minutos)...");
              
              // We need a source image. Let's find the first image in the project or use the thumb
              const sourceImage = currentProject.assets.find(a => a.type === 'image');
              
              if (!sourceImage) throw new Error("No se encontró imagen base para regenerar video");
              
              const videoUrl = await generateVeoVideo(sourceImage.url, editPrompt, currentProject.input.aspectRatio);
              
              const newAsset: GeneratedAsset = {
                  id: `vid-edit-${Date.now()}`,
                  type: 'video',
                  url: videoUrl,
                  thumbnail: sourceImage.url
              };
              
              const updatedProject = {
                  ...currentProject,
                  assets: [newAsset, ...currentProject.assets]
              };
              
              setCurrentProject(updatedProject);
              setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          }
          
          setGenState(GenerationState.COMPLETE);
          
      } catch (error: any) {
          console.error("Edit error:", error);
          setErrorMessage(error.message || "Falló la edición.");
          setGenState(GenerationState.ERROR);
      }
  };

  const generateSocialCopy = async () => {
      if (!currentProject) return;
      setSocialTextLoading(true);
      const text = await generateSocialPost(currentProject.input.description, currentProject.input.style, currentProject.name);
      const updatedProject = { ...currentProject, socialPost: text };
      setCurrentProject(updatedProject);
      
      // Update in list
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSocialTextLoading(false);
  };

  const handleDownloadText = (text: string) => {
      const element = document.createElement("a");
      const file = new Blob([text], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "instagram_caption.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  const toggleMusicPreview = (url: string) => {
      if (isPlayingPreview === url) {
          audioPreviewRef.current?.pause();
          setIsPlayingPreview(null);
      } else {
          if (audioPreviewRef.current) {
              audioPreviewRef.current.src = url;
              audioPreviewRef.current.play();
          } else {
              audioPreviewRef.current = new Audio(url);
              audioPreviewRef.current.play();
          }
          setIsPlayingPreview(url);
      }
  };

  const handleShare = async (title: string, text: string, url?: string, fileUrl?: string) => {
      const shareData: any = {
          title: title,
          text: text,
      };

      if (url) shareData.url = url;

      // Try to use Native Share API first
      if (navigator.share) {
          try {
              // If we have a file URL (blob), we can try to share it as a file array if supported
              if (fileUrl) {
                  const response = await fetch(fileUrl);
                  const blob = await response.blob();
                  const file = new File([blob], "asset.png", { type: blob.type });
                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                      shareData.files = [file];
                  }
              }
              await navigator.share(shareData);
              return;
          } catch (error) {
              console.log("Error sharing:", error);
          }
      }

      // Fallback for Desktop / Non-supported browsers
      const encodedText = encodeURIComponent(`${title}\n\n${text}`);
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`;

      // Show simple alert or logic for fallback
      const choice = window.confirm(
          `Elige cómo compartir:\n\nOK -> WhatsApp\nCancelar -> Email\n\n(Nota: Para archivos, por favor descárgalos primero en PC)`
      );
      
      if (choice) {
          window.open(whatsappUrl, '_blank');
      } else {
          window.open(mailtoUrl, '_blank');
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* Auth Modals */}
      {showAuthModal && <AuthModal onSuccess={handleAuthSuccess} onClose={() => { /* Prevent close without auth if needed, or allow close to view demo */ }} />}
      {showPaymentModal && currentUser && <PaymentModal user={currentUser} onClose={() => setShowPaymentModal(false)} />}
      {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}

      {/* Edit Modal */}
      {isEditModalOpen && editingAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      {editingAsset.type === 'image' ? (
                          <><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Editar Imagen</>
                      ) : (
                          <><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Regenerar Video</>
                      )}
                  </h2>
                  
                  <p className="text-sm text-slate-500 mb-4">
                      {editingAsset.type === 'image' 
                        ? "Describe los cambios que deseas aplicar a esta imagen. Ej: 'Hazla más luminosa', 'Añade un fondo de playa'." 
                        : "Cambia la instrucción para generar un nuevo video basado en la imagen original. Ej: 'Cámara lenta', 'Zoom al producto'."}
                  </p>

                  <textarea 
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder={editingAsset.type === 'image' ? "Ej: Añade un destello de luz..." : "Ej: Movimiento de cámara suave..."}
                  />

                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setIsEditModalOpen(false)}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg font-medium"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleConfirmEdit}
                          disabled={!editPrompt.trim()}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {editingAsset.type === 'image' ? 'Generar Edición' : 'Regenerar Video'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <Sidebar 
        projects={projects} 
        onSelectProject={setCurrentProject} 
        onNewProject={() => setCurrentProject(null)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={currentUser}
        onOpenPayment={() => setShowPaymentModal(true)}
      />

      <div className="flex-1 flex flex-col h-full relative">
        <Header theme={theme} setTheme={setTheme} onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-10 pb-24">

            {/* Top Bar: User & Admin Controls */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    {currentUser && (
                        <div className="text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Hola, </span>
                            <span className="font-semibold">{currentUser.email}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {currentUser?.role === 'admin' && (
                        <button 
                            onClick={() => setShowAdminDashboard(true)}
                            className="px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700"
                        >
                            Panel Admin
                        </button>
                    )}
                    {currentUser && (
                        <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">
                            Cerrar Sesión
                        </button>
                    )}
                </div>
            </div>

            {/* --- INPUT SECTION --- */}
            {!currentProject && (
              <div className="animate-fade-in-up space-y-8">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                    Creador de Contenido Premium
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                    Transforma fotos simples en campañas de catálogo de lujo. Genera imágenes, videos y voz en off al instante.
                  </p>
                </div>

                {/* Campaign Name Input */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nombre de la Campaña</label>
                        <input 
                            type="text" 
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            placeholder={`Ej: Campaña Verano ${new Date().getFullYear()}`}
                            className="w-full bg-transparent border-none p-0 text-lg font-semibold placeholder-slate-300 dark:placeholder-slate-600 focus:ring-0 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Uploads */}
                  <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Archivos del Producto
                    </h3>

                    {/* Image Upload Area with Thumbnails */}
                    <div className="relative group">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => setImages(Array.from(e.target.files || []))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`
                        border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                        ${images.length > 0 ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-red-400'}
                      `}>
                         {images.length > 0 ? (
                             <div className="grid grid-cols-3 gap-2">
                                 {images.map((img, idx) => (
                                     <div key={idx} className="relative aspect-square rounded-lg overflow-hidden shadow-sm">
                                         <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                     </div>
                                 ))}
                                 <div className="flex items-center justify-center text-xs text-red-600 font-medium">
                                    Cambiar Selección
                                 </div>
                             </div>
                         ) : (
                             <>
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium">Sube hasta 3 fotos</p>
                                <p className="text-xs text-slate-400 mt-1">PNG, JPG</p>
                             </>
                         )}
                      </div>
                    </div>

                    {/* Logo Upload with Thumbnail */}
                    <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                            ) : (
                                <span className="text-xs text-slate-400">Logo</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium cursor-pointer hover:text-red-500 transition-colors">
                                {logo ? logo.name : "Subir Logo de Empresa"}
                                <input 
                                  type="file" 
                                  accept="image/png, image/jpeg" 
                                  className="hidden" 
                                  onChange={(e) => setLogo(e.target.files?.[0] || null)} 
                                />
                            </label>
                            <p className="text-xs text-slate-400">Recomendado: PNG Transparente</p>
                        </div>
                    </div>
                  </div>

                  {/* Right Column: Details & Music */}
                  <div className="space-y-6">
                    {/* Details Form */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <h3 className="text-lg font-semibold">Detalles de Campaña</h3>
                        
                        <div className="flex gap-2">
                            <input 
                                type="url" 
                                placeholder="URL del Producto (Opcional para autocompletar)"
                                value={productUrl}
                                onChange={(e) => setProductUrl(e.target.value)}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            />
                            <button 
                                onClick={handleResearch}
                                disabled={isGenerating || !productUrl}
                                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-4 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </button>
                        </div>

                        <textarea 
                            placeholder="Describe tu producto (o usa la URL para autocompletar). Ej: Zapatillas de running rojas, ligeras, para maratón."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-24 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none resize-none transition-all"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Estilo Visual</label>
                                <select 
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-red-500"
                                >
                                    <option>Estudio Minimalista</option>
                                    <option>Lujo y Elegancia</option>
                                    <option>Urbano / Street</option>
                                    <option>Naturaleza / Orgánico</option>
                                    <option>Neon / Cyberpunk</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Formato Video</label>
                                <select 
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-red-500"
                                >
                                    <option value={AspectRatio.SQUARE}>1:1 Cuadrado</option>
                                    <option value={AspectRatio.PORTRAIT}>9:16 Vertical (Stories)</option>
                                    <option value={AspectRatio.LANDSCAPE}>16:9 Horizontal</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Music Library */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Audio y Música</h3>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-slate-500">Vol. Música</span>
                                    <input type="range" min="0" max="1" step="0.1" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-slate-500">Vol. Voz</span>
                                    <input type="range" min="0" max="1" step="0.1" value={voiceVolume} onChange={(e) => setVoiceVolume(parseFloat(e.target.value))} className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                                </div>
                            </div>
                         </div>
                         
                         <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                             {MUSIC_LIBRARY.map(track => (
                                 <div 
                                    key={track.id} 
                                    onClick={() => setSelectedMusicId(track.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all ${selectedMusicId === track.id ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                 >
                                     <div className="flex items-center gap-3">
                                         <div 
                                            onClick={(e) => { e.stopPropagation(); toggleMusicPreview(track.url); }}
                                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                                         >
                                             {isPlayingPreview === track.url ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                                                </svg>
                                             ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                                </svg>
                                             )}
                                         </div>
                                         <div>
                                             <div className="text-sm font-medium">{track.name}</div>
                                             <div className="text-xs text-slate-500">{track.genre}</div>
                                         </div>
                                     </div>
                                     {selectedMusicId === track.id && (
                                         <span className="text-xs text-red-500 font-bold px-2">Seleccionado</span>
                                     )}
                                 </div>
                             ))}
                         </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center pt-8 gap-4">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-red-600 font-medium">{progressMsg}</p>
                        </div>
                    ) : (
                        <button 
                            onClick={handleGenerate}
                            className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold py-4 px-12 rounded-full shadow-xl shadow-red-600/30 transform hover:scale-105 transition-all flex items-center gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15.75a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                            {currentUser?.role === 'admin' ? 'Generar (Admin Ilimitado)' : `Generar Campaña (${currentUser?.credits || 0} Créditos)`}
                        </button>
                    )}

                    {/* Display Error Message clearly if present */}
                    {genState === GenerationState.ERROR && errorMessage && (
                        <div className="w-full max-w-lg p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="font-bold">No se pudo generar el video</p>
                                <p className="text-sm mt-1">{errorMessage}</p>
                                {errorMessage.includes("seguridad") && (
                                    <div className="mt-2 text-xs bg-white/50 dark:bg-black/20 p-2 rounded">
                                        <strong>Consejo:</strong> Google Veo es muy estricto con imágenes de personas, rostros o marcas registradas. Prueba con una foto donde solo salga el producto o simplifica la descripción.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
              </div>
            )}

            {/* --- RESULTS DASHBOARD --- */}
            {currentProject && (
              <div className="animate-fade-in space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                      <div>
                          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{currentProject.name}</h1>
                          <p className="text-slate-500 text-sm">Campaña Generada • {new Date(currentProject.date).toLocaleDateString()} • {currentProject.assets.length} Recursos</p>
                      </div>
                      <div className="flex gap-3">
                          <button 
                            onClick={() => handleShare(currentProject.name, "¡Mira esta campaña que he creado con Trends172!")}
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-700 flex items-center gap-2"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                              </svg>
                              Compartir Campaña
                          </button>
                          <button 
                            onClick={() => setCurrentProject(null)}
                            className="text-red-600 font-semibold hover:underline flex items-center gap-1 px-3 py-2"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                              </svg>
                              Volver
                          </button>
                      </div>
                  </div>

                  {/* Social Media Copy Section */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-lg">Texto para Instagram</h3>
                          <button 
                            onClick={generateSocialCopy} 
                            disabled={socialTextLoading}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 font-bold disabled:opacity-50"
                          >
                              {socialTextLoading ? "Generando..." : (currentProject.socialPost ? "Regenerar" : "Generar Copy IA")}
                          </button>
                      </div>
                      {currentProject.socialPost ? (
                          <div className="relative bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-sm whitespace-pre-wrap border border-slate-200 dark:border-slate-700">
                              {currentProject.socialPost}
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button 
                                    onClick={() => handleDownloadText(currentProject.socialPost || "")}
                                    className="p-2 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                                    title="Descargar TXT"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l3-3m-3 3h7.5" transform="rotate(-90 12 12)" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(currentProject.socialPost || ""); alert("Texto copiado!"); }}
                                    className="p-2 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                                    title="Copiar texto"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                    </svg>
                                </button>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                              Haz clic en "Generar Copy IA" para crear el texto para Instagram.
                          </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Video Output - Prominent */}
                      {currentProject.assets.filter(a => a.type === 'video').map(video => (
                          <div key={video.id} className="col-span-1 md:col-span-2 lg:col-span-2 bg-black rounded-2xl overflow-hidden shadow-2xl relative group aspect-video">
                              <video 
                                src={video.url} 
                                controls 
                                className="w-full h-full object-cover" 
                                poster={video.thumbnail}
                              />
                              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">VIDEO FINAL</div>
                              <div className="absolute top-4 right-4 flex gap-2">
                                  <button 
                                    onClick={() => openEditModal(video)}
                                    className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-full transition-colors"
                                    title="Regenerar Video"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleShare(`Video: ${currentProject.name}`, "Mira este video comercial generado con IA", undefined, video.url)}
                                    className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2 rounded-full transition-colors"
                                    title="Compartir Video"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                    </svg>
                                  </button>
                              </div>
                          </div>
                      ))}

                      {/* Images Grid */}
                      {currentProject.assets.filter(a => a.type === 'image').map(img => (
                          <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-lg bg-white dark:bg-slate-800">
                              <img src={img.url} alt="Generated Asset" className="w-full h-64 object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                  <div className="flex gap-2">
                                    <a href={img.url} download="catalogue-image.png" className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100">
                                        Descargar
                                    </a>
                                    <button 
                                        onClick={() => handleShare(`Imagen: ${currentProject.name}`, "Mira esta imagen generada por IA", undefined, img.url)}
                                        className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/40"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                        </svg>
                                    </button>
                                  </div>
                                  <button onClick={() => openEditModal(img)} className="bg-slate-800 text-white px-4 py-2 rounded-full font-medium text-sm border border-slate-600 hover:bg-slate-700">
                                      Editar
                                  </button>
                              </div>
                          </div>
                      ))}
                      
                      {/* Audio Asset Display */}
                      {currentProject.assets.filter(a => a.type === 'audio').map(audio => (
                           <div key={audio.id} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm border border-slate-200 dark:border-slate-700">
                               <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                   </svg>
                               </div>
                               <div className="flex-1">
                                   <div className="text-sm font-medium">Voz en Off Generada</div>
                                   <audio src={audio.url} controls className="h-6 w-full mt-1" />
                               </div>
                           </div>
                      ))}
                  </div>
              </div>
            )}
          </div>
        </main>
        
        <LiveAssistant />
      </div>
    </div>
  );
}

export default App;
