'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ScannerState, AnalysisStep, MedicineInfo, ForensicAnalysisResult } from '@/lib/types';
import { analyzeDrugData } from '@/ai/flows/analyze-drug-data';
import { forensicAnalysisFlow } from '@/ai/flows/forensic-analysis-flow';

const initialAnalysisSteps: AnalysisStep[] = [
  { title: 'Uploading and queueing images...', status: 'pending', duration: 500 },
  { title: 'Analyzing for general information...', status: 'pending', duration: 2000 },
  { title: 'Performing forensic quality check...', status: 'pending', duration: 2000 },
  { title: 'Extracting physical characteristics...', status: 'pending', duration: 2500 },
  { title: 'Searching global medical databases...', status: 'pending', duration: 3000 },
  { title: 'Validating against ground truth...', status: 'pending', duration: 2500 },
  { title: 'Calculating authenticity score...', status: 'pending', duration: 1000 },
];

export const useScanner = () => {
  const [state, setState] = useState<ScannerState>('idle');
  const [image, setImage] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>(initialAnalysisSteps);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [forensicResult, setForensicResult] = useState<ForensicAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageQueue, setImageQueue] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timerId = setTimeout(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [cooldown]);

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
      await runStep(0, currentSteps[0].duration); // Step 0: Uploading...

      // --- First API Call (Sequential) ---
      await runStep(1); // Step 1: Analyzing for general info...
      const infoResult = await analyzeDrugData({ photoDataUri: imageDataUrl });
      await new Promise(resolve => setTimeout(resolve, currentSteps[1].duration));
      setMedicineInfo(infoResult.error ? { error: infoResult.error } : infoResult);

      // --- Second, longer flow (Sequential) ---
      // This flow has multiple internal steps, but from the hook's perspective, we animate through our UI steps.
      await runStep(2, currentSteps[2].duration); // Step 2: Forensic quality check...
      await runStep(3, currentSteps[3].duration); // Step 3: Extracting...
      await runStep(4, currentSteps[4].duration); // Step 4: Searching...
      
      await runStep(5); // Step 5: Validating...
      const forensicData = await forensicAnalysisFlow({ photoDataUri: imageDataUrl });
      await new Promise(resolve => setTimeout(resolve, currentSteps[5].duration));
      
      await runStep(6, currentSteps[6].duration); // Step 6: Calculating score...

      setForensicResult(forensicData);

      // Finalize
      setAnalysisSteps(currentSteps.map(step => ({...step, status: 'complete'})));
      setState('results');
      setCooldown(30);

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred during analysis.');
      setState('results'); // Go to results to show the error
      setCooldown(30);
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
    setState('scanning');
    setImage(null);
    setMedicineInfo(null);
    setForensicResult(null);
    setError(null);
    setImageQueue([]);
    setAnalysisSteps(initialAnalysisSteps.map(s => ({ ...s, status: 'pending' })));
  }, []);

  const handleImageCapture = useCallback((imageDataUrl: string) => {
    _startAnalysisWithQueue([imageDataUrl]);
  }, [_startAnalysisWithQueue]);

  const handleMultipleImages = useCallback((imageDataUrls: string[]) => {
    if (imageDataUrls.length > 0) {
      _startAnalysisWithQueue(imageDataUrls);
    }
  }, [_startAnalysisWithQueue]);

  const analyzeNext = useCallback(() => {
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
  }, [imageQueue, _startAnalysisWithQueue]);

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
