import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RotateCcw,
  Check,
  X,
  FlipHorizontal,
  Sparkles,
  MapPin,
  Clock,
  Shield,
  AlertCircle,
  Upload,
  Crosshair,
  Zap,
} from 'lucide-react';
import { GoaTaluka, Language } from '../types';
import { translations } from '../utils/translations';
import { formatCoordinates } from '../utils/smartLogic';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  taluka: GoaTaluka;
  landmark?: string;
  latitude: number;
  longitude: number;
  language: Language;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  taluka,
  landmark,
  latitude,
  longitude,
  language,
}) => {
  const t = translations[language];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [stampWatermark, setStampWatermark] = useState<boolean>(true);
  const [isShutterActive, setIsShutterActive] = useState<boolean>(false);
  const [gridVisible, setGridVisible] = useState<boolean>(true);

  // Stop current active stream
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported in this browser.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsInitializing(false);
      let msg = t.cameraPermissionError;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings, or use the Native Camera button below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device detected on this system.';
      }
      setCameraError(msg);
    }
  };

  // Mount/Unmount stream listener
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedImage]);

  if (!isOpen) return null;

  // Toggle Camera Facing Mode (rear vs front)
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture Snapshot from Video Frame
  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Use actual video stream dimensions
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // If Geo-tag watermark is enabled, burn civic verification overlay onto the photo
    if (stampWatermark) {
      const bannerHeight = Math.max(70, Math.floor(height * 0.12));
      const y = height - bannerHeight;

      // Dark translucent banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(0, y, width, bannerHeight);

      // Accent orange top border line
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, y, width, Math.max(3, Math.floor(bannerHeight * 0.04)));

      // Font sizing relative to image width
      const titleFontSize = Math.max(14, Math.floor(width * 0.024));
      const subFontSize = Math.max(11, Math.floor(width * 0.018));

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${titleFontSize}px sans-serif`;
      ctx.fillText(
        `🏛️ NAGRIK SETU | GOA CIVIC GRIEVANCE VERIFIED`,
        20,
        y + bannerHeight * 0.38
      );

      ctx.fillStyle = '#cbd5e1';
      ctx.font = `500 ${subFontSize}px sans-serif`;
      const dateStr = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
      const locationLine = `📍 ${taluka} ${landmark ? `• ${landmark}` : ''} | GPS: ${formatCoordinates(
        latitude,
        longitude
      )} | 🕒 ${dateStr}`;
      ctx.fillText(locationLine, 20, y + bannerHeight * 0.76);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Fallback Native Capture input handler
  const handleNativeFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCapturedImage(reader.result);
          stopStream();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Retake Photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm and save captured photo
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>{t.takePhotoWithCamera}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-600 text-white font-black uppercase">
                  Live
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Goa PWD Inspection Camera • {taluka}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-camera-modal"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Preview Screen Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[400px]">
          {/* Hidden Canvas for Frame Processing & Watermarking */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden Fallback Native Capture Input */}
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativeFileFallback}
            className="hidden"
          />

          {/* Shutter flash animation overlay */}
          {isShutterActive && (
            <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-150" />
          )}

          {capturedImage ? (
            /* Snapshot Review Mode */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured Pothole"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-emerald-950/90 text-emerald-200 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Photo Captured Successfully</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Camera Permission Error / Fallback Screen */
            <div className="p-6 text-center text-slate-300 max-w-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  id="btn-trigger-native-camera"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Device Camera / Gallery</span>
                </button>

                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Retry Permission
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream Viewfinder */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Targeting Grid & Crosshair */}
              {gridVisible && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25 border border-white/20">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30 flex items-center justify-center">
                      <Crosshair className="w-8 h-8 text-orange-400/80 animate-pulse" />
                    </div>
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div />
                  </div>

                  {/* Top HUD badge */}
                  <div className="flex items-center justify-between text-[11px] text-white/90 z-20">
                    <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="font-bold">LIVE PWD SENSOR</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 font-mono text-[10px]">
                      {formatCoordinates(latitude, longitude)}
                    </div>
                  </div>

                  {/* Bottom Live Geo-tag banner preview in viewfinder */}
                  {stampWatermark && (
                    <div className="z-20 p-2 rounded-lg bg-slate-950/85 backdrop-blur-md border-t-2 border-orange-500 text-white space-y-0.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[10px] text-orange-400 uppercase tracking-wider">
                          🏛️ NAGRIK SETU • GOA CIVIC PWD
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date().toLocaleTimeString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 truncate">
                        📍 {taluka} • GPS: {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Initializing Spinner */}
              {isInitializing && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-white space-y-2 z-20">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-300">
                    Initializing Goa Road Camera...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Viewfinder Controls & Watermark Toggle */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={stampWatermark}
              onChange={(e) => setStampWatermark(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-slate-800 border-slate-700"
            />
            <span className="text-[11px] font-medium text-slate-300">
              {t.geoTagWatermark || 'Geo-Tag Stamp on Photo'}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGridVisible((prev) => !prev)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                gridVisible
                  ? 'bg-slate-800 text-orange-400 border-orange-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Grid {gridVisible ? 'ON' : 'OFF'}
            </button>

            {!capturedImage && !cameraError && (
              <button
                type="button"
                id="btn-flip-camera"
                onClick={handleToggleFacingMode}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 text-[11px] font-medium transition-colors"
                title="Switch Camera (Front/Rear)"
              >
                <FlipHorizontal className="w-3 h-3 text-orange-400" />
                <span>{t.flipCamera}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-4">
          {capturedImage ? (
            /* Review Actions */
            <div className="flex items-center gap-3 w-full max-w-md">
              <button
                type="button"
                id="btn-retake-photo"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-orange-400" />
                <span>{t.retakePhoto}</span>
              </button>

              <button
                type="button"
                id="btn-confirm-photo"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-102"
              >
                <Check className="w-4 h-4" />
                <span>{t.useCapturedPhoto}</span>
              </button>
            </div>
          ) : (
            /* Live Camera Shutter Button */
            <div className="flex items-center justify-center gap-6 w-full">
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center transition-colors"
                title="Upload from device gallery"
              >
                <Upload className="w-4 h-4" />
              </button>

              {/* Big Circular Camera Shutter Button */}
              <button
                type="button"
                id="btn-camera-shutter"
                onClick={handleTakeSnapshot}
                disabled={isInitializing || !!cameraError}
                className="group relative w-18 h-18 rounded-full border-4 border-white p-1.5 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="w-full h-full rounded-full bg-orange-600 group-hover:bg-orange-500 transition-colors flex items-center justify-center text-white shadow-xl shadow-orange-600/50">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              <div className="w-10 h-10 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                PWD
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
