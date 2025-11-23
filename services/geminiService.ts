import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { AspectRatio } from "../types";
import { base64ToBytes, decodeAudioData, createPcmBlob } from "./audioUtils";

// Helper to get fresh instance with potentially updated key
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data url prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

// 1. Research Product (Grounding)
export const researchProduct = async (url: string): Promise<string> => {
  if (!url) return "";
  const ai = getAIClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Investiga esta URL del producto y proporciona un resumen conciso de sus características clave, estética visual y público objetivo en español: ${url}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Check for grounding chunks to confirm usage, but primarily return text
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    console.log("Grounding info:", chunks);
    
    return response.text || "No se encontró información.";
  } catch (error) {
    console.error("Search error:", error);
    return "";
  }
};

// 2. Generate/Edit Images (Gemini 2.5 Flash Image)
export const generateCatalogueImage = async (
  originalImageBase64: string,
  prompt: string,
  style: string
): Promise<string> => {
  const ai = getAIClient();
  const fullPrompt = `Transforma esta imagen de producto en una foto de catálogo premium. Estilo: ${style}. ${prompt}. Mantén el producto como foco principal pero mejora la iluminación y el fondo.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImageBase64,
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect
            },
          },
          { text: fullPrompt },
        ],
      },
      // Nano banana does not support responseMimeType
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

// 3. Edit Existing Generated Image (Nano Banana)
export const editGeneratedImage = async (
  imageBase64: string,
  editInstruction: string
): Promise<string> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
              mimeType: 'image/png',
            },
          },
          { text: editInstruction },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Edit error:", error);
    throw error;
  }
};

// 4. Generate Video (Veo)
export const generateVeoVideo = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  console.log("Iniciando generación de video con Veo...");
  
  // Ensure Key Selection for Veo
  const win = window as any;
  if (win.aistudio && !await win.aistudio.hasSelectedApiKey()) {
    console.log("Solicitando selección de API Key...");
    await win.aistudio.openSelectKey();
  }
  
  const ai = getAIClient();
  const arMap: Record<string, "16:9" | "9:16"> = {
    '16:9': '16:9',
    '9:16': '9:16',
    '1:1': '16:9', // Veo only supports 16:9 or 9:16, mapping square to landscape
    '4:5': '9:16'
  };

  try {
    // Safer prompt prefix to avoid triggers
    // Veo is sensitive to "people" related terms and complex prompts in the preview model.
    // We construct a very safe prompt focusing purely on visual style and limit the user prompt length.
    // This helps drastically reduce "Safety Filter" errors.
    const safePrompt = `Cinematic product video, professional studio lighting, 4k resolution, slow motion, commercial advertisement style. ${prompt.substring(0, 80)}`;

    console.log("Prompt enviado a Veo:", safePrompt);

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: safePrompt,
      image: {
        imageBytes: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: arMap[aspectRatio] || '16:9',
      }
    });

    console.log("Operación Veo iniciada con éxito. ID:", operation.name);

    const MAX_ATTEMPTS = 60; 
    let attempts = 0;

    while (!operation.done) {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        throw new Error("Tiempo de espera agotado (Timeout) esperando respuesta de Veo.");
      }

      console.log(`Esperando a Veo... Intento ${attempts}/${MAX_ATTEMPTS} (esperando 10s)`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        operation = await ai.operations.getVideosOperation({operation: operation});
      } catch (pollError: any) {
        console.error("Error al consultar estado de Veo:", pollError);
        if (pollError.message && (pollError.message.includes("404") || pollError.message.includes("not found"))) {
             throw new Error("La operación de video se perdió o no se encuentra (404).");
        }
      }
    }

    // --- DEBUGGING: Log the FULL response structure ---
    console.log("DEBUG: Respuesta cruda de Veo:", JSON.stringify(operation, null, 2));

    // 1. Check explicit API Errors
    if (operation.error) {
        console.error("Error devuelto por la API de Veo:", operation.error);
        throw new Error(`Fallo en la generación de Veo: ${operation.error.message || JSON.stringify(operation.error)}`);
    }

    // 2. Check Safety Filters (RAI) in the response object
    const responseData = operation.response as any;
    // Sometimes response is inside result
    const resultData = operation.response || (operation as any).result;

    if (responseData?.raiMediaFilteredCount > 0 || responseData?.raiMediaFilteredReasons?.length > 0) {
        const reason = responseData.raiMediaFilteredReasons?.[0] || "Contenido marcado como inseguro por políticas de IA.";
        console.warn("Veo Safety Filter triggered:", reason);
        throw new Error(`No se pudo generar el video por filtros de seguridad (RAI). Razón: "${reason}".`);
    }

    if (!resultData) {
        throw new Error("La operación finalizó pero no contiene datos de 'response' ni 'result'.");
    }

    const videos = resultData.generatedVideos;

    if (!videos || videos.length === 0) {
        console.warn("Veo devolvió una lista vacía de videos. Posible filtro de seguridad silencioso.");
        throw new Error("Veo finalizó el proceso pero no generó ningún video. Posible filtro de contenido.");
    }

    const uri = videos[0]?.video?.uri;
    if (!uri) {
        throw new Error("Se encontró el objeto de video pero la URI está vacía.");
    }

    console.log("Video generado exitosamente. Descargando desde:", uri);

    // Fetch the actual bytes
    const vidResponse = await fetch(`${uri}&key=${process.env.API_KEY}`);
    
    if (!vidResponse.ok) {
        throw new Error(`Error al descargar el video final: ${vidResponse.status} ${vidResponse.statusText}`);
    }

    const blob = await vidResponse.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error("Error fatal en generateVeoVideo:", error);
    // Pass the specific error message up to the UI
    throw error;
  }
};

// 5. Generate Voice Over (TTS)
export const generateVoiceOver = async (text: string): Promise<string> => {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Voz en off promocional: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");

        // Convert base64 to blob url
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const wavBytes = pcmToWav(bytes, 24000);
        const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });
        return URL.createObjectURL(wavBlob);

    } catch (error) {
        console.error("TTS Error", error);
        return "";
    }
};

// 6. Generate Social Media Post (Instagram Only)
export const generateSocialPost = async (
    description: string,
    style: string,
    projectName: string
): Promise<string> => {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Escribe un caption atractivo EXCLUSIVAMENTE para Instagram sobre este producto.
            Nombre Campaña: ${projectName}.
            Descripción: ${description}.
            Estilo: ${style}.
            Instrucciones:
            - Usa un tono persuasivo y moderno.
            - Usa saltos de línea para que sea legible.
            - Incluye emojis estratégicos.
            - Incluye exactamente 30 hashtags relevantes al final.
            - NO incluyas texto para LinkedIn ni otras redes. Solo Instagram.`,
        });
        return response.text || "No se pudo generar el texto.";
    } catch (error) {
        console.error("Social Post Error:", error);
        return "Error al generar el texto para redes.";
    }
};

// Helper to add WAV header
function pcmToWav(pcmData: Uint8Array, sampleRate: number): Uint8Array {
    const numChannels = 1;
    const byteRate = sampleRate * numChannels * 2;
    const blockAlign = numChannels * 2;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // write PCM data
    const pcmBytes = new Uint8Array(buffer, 44);
    pcmBytes.set(pcmData);

    return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// 7. Live API Class
export class LiveClient {
  private session: any = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private onStatusChange: ((active: boolean) => void) | null = null;

  constructor(statusCallback: (active: boolean) => void) {
    this.onStatusChange = statusCallback;
  }

  async connect() {
    const ai = getAIClient();
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
            console.log("Live session connected");
            this.onStatusChange?.(true);

            if (!this.inputContext) return;
            this.inputSource = this.inputContext.createMediaStreamSource(stream);
            this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
            
            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const blob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: blob });
                });
            };

            this.inputSource.connect(this.processor);
            this.processor.connect(this.inputContext.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && this.outputContext) {
                 this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
                 const buffer = await decodeAudioData(
                     base64ToBytes(base64Audio),
                     this.outputContext
                 );
                 const source = this.outputContext.createBufferSource();
                 source.buffer = buffer;
                 source.connect(this.outputContext.destination);
                 source.start(this.nextStartTime);
                 this.nextStartTime += buffer.duration;
                 this.sources.add(source);
                 source.onended = () => this.sources.delete(source);
             }
        },
        onclose: () => {
            console.log("Live session closed");
            this.cleanup();
        },
        onerror: (err) => {
            console.error("Live session error", err);
            this.cleanup();
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        systemInstruction: "Eres un asistente creativo útil para una aplicación de generación de catálogos. Ayuda a los usuarios a refinar sus prompts e ideas en español.",
      }
    });

    this.session = sessionPromise;
  }

  disconnect() {
      if (this.session) {
          this.session.then((s: any) => s.close());
      }
      this.cleanup();
  }

  private cleanup() {
      this.onStatusChange?.(false);
      this.inputSource?.disconnect();
      this.processor?.disconnect();
      this.inputContext?.close();
      this.outputContext?.close();
      this.sources.forEach(s => s.stop());
      this.sources.clear();
      this.nextStartTime = 0;
      this.session = null;
  }
}