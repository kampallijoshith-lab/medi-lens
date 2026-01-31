'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ScannerState, AnalysisStep, MedicineInfo, ForensicAnalysisResult } from '@/lib/types';
import { forensicAnalysisFlow } from '@/ai/flows/forensic-analysis-flow';

const initialAnalysisSteps: AnalysisStep[] = [
  { title: 'Queueing image for analysis...', status: 'pending', duration: 500 },
  { title: 'Performing unified AI analysis...', status: 'pending', duration: 8000 },
  { title: 'Finalizing report...', status: 'pending', duration: 1000 },
];

const COOLDOWN_SECONDS = 60;
const COOLDOWN_STORAGE_KEY = 'medilens_cooldown_end_time';

export const useScanner = () => {
  const [state, setState] = useState<ScannerState>('idle');
  const [image, setImage] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>(initialAnalysisSteps);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [forensicResult, setForensicResult] = useState<ForensicAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageQueue, setImageQueue] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);

  // On initial load, check localStorage for an existing cooldown
  useEffect(() => {
    try {
      const endTime = localStorage.getItem(COOLDOWN_STORAGE_KEY);
      if (endTime) {
        const remainingTime = Math.ceil((parseInt(endTime) - Date.now()) / 1000);
        if (remainingTime > 0) {
          setCooldown(remainingTime);
        }
      }
    } catch (e) {
        // LocalStorage might be disabled (e.g. in private browsing)
        console.warn("Could not access localStorage for cooldown.", e);
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timerId = setTimeout(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [cooldown]);

  const startCooldown = () => {
    try {
      const endTime = Date.now() + COOLDOWN_SECONDS * 1000;
      localStorage.setItem(COOLDOWN_STORAGE_KEY, endTime.toString());
      setCooldown(COOLDOWN_SECONDS);
    } catch (e) {
      console.warn("Could not access localStorage for cooldown.", e);
      setCooldown(COOLDOWN_SECONDS); // Fallback for environments without localStorage
    }
  };

  const _runAnalysis = async (imageDataUrl: string) => {
    // Reset states for new analysis
    setMedicineInfo(null);
    setForensicResult(null);
    setError(null);
    setState('analyzing');

    let currentSteps = [...initialAnalysisSteps].map(s => ({ ...s, status: 'pending' as const }));

    const runStep = async (index: number, duration?: number) => {
      if (index < currentSteps.length) {
        currentSteps = currentSteps.map((step, idx) => 
            idx < index ? { ...step, status: 'complete' } :
            idx === index ? { ...step, status: 'in-progress' } :
            step
        );
        setAnalysisSteps(currentSteps);
        if (duration) {
            await new Promise(resolve => setTimeout(resolve, duration));
        }
      }
    };
    
    try {
      await runStep(0, currentSteps[0].duration);

      // --- Unified API Call ---
      await runStep(1);
      const unifiedResult = await forensicAnalysisFlow({ photoDataUri: imageDataUrl });
      
      // The AI might return an error for the whole process
      if (unifiedResult.error && !unifiedResult.score) {
          setError(unifiedResult.error);
          setMedicineInfo({ error: unifiedResult.error });
      } else {
          const infoResult: MedicineInfo = {
            primaryUses: unifiedResult.primaryUses,
            howItWorks: unifiedResult.howItWorks,
            commonIndications: unifiedResult.commonIndications,
            safetyDisclaimer: unifiedResult.safetyDisclaimer,
            error: unifiedResult.error,
          };
          setMedicineInfo(infoResult);
          setForensicResult(unifiedResult);
      }
      
      await runStep(2, currentSteps[2].duration);


      // Finalize
      setAnalysisSteps(currentSteps.map(step => ({...step, status: 'complete'})));
      setState('results');
      startCooldown();

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred during analysis.');
      setState('results'); // Go to results to show the error
      startCooldown();
    }
  };

  const _startAnalysisWithQueue = useCallback((imageDataUrls: string[]) => {
    if (imageDataUrls.length === 0) {
      setState('idle');
      setImage(null);
      setMedicineInfo(null);
      setForensicResult(null);
      setError(null);
      setImageQueue([]);
      return;
    }

    const nextImage = imageDataUrls[0];
    const remainingImages = imageDataUrls.slice(1);

    setImage(nextImage);
    setImageQueue(remainingImages);
    setAnalysisSteps(initialAnalysisSteps.map(s => ({ ...s, status: 'pending' })));
    _runAnalysis(nextImage);
  }, []);

  const startScan = useCallback(() => {
    if (cooldown > 0) return;
    setState('scanning');
    setImage(null);
    setMedicineInfo(null);
    setForensicResult(null);
    setError(null);
    setImageQueue([]);
    setAnalysisSteps(initialAnalysisSteps.map(s => ({ ...s, status: 'pending' })));
  }, [cooldown]);

  const handleImageCapture = useCallback((imageDataUrl: string) => {
    _startAnalysisWithQueue([imageDataUrl]);
  }, [_startAnalysisWithQueue]);

  const handleMultipleImages = useCallback((imageDataUrls: string[]) => {
    if (imageDataUrls.length > 0) {
      _startAnalysisWithQueue(imageDataUrls);
    }
  }, [_startAnalysisWithQueue]);

  const analyzeNext = useCallback(() => {
    if (cooldown > 0) return;
    if(imageQueue.length > 0) {
      _startAnalysisWithQueue(imageQueue);
    } else {
      setState('idle');
      setImage(null);
      setMedicineInfo(null);
      setForensicResult(null);
      setError(null);
      setImageQueue([]);
    }
  }, [imageQueue, _startAnalysisWithQueue, cooldown]);

  const restart = useCallback(() => {
    if (cooldown > 0) return;
    setState('idle');
    setImage(null);
    setMedicineInfo(null);
    setForensicResult(null);
    setError(null);
    setImageQueue([]);
  }, [cooldown]);

  return {
    state,
    image,
    analysisSteps,
    medicineInfo,
    forensicResult,
    error,
    imageQueue,
    cooldown,
    startScan,
    handleImageCapture,
    handleMultipleImages,
    analyzeNext,
    restart,
  };
};
