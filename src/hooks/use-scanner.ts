'use client';

import { useState, useCallback } from 'react';
import type { ScannerState, AnalysisStep, MedicineInfo } from '@/lib/types';
import { analyzeDrugData, AnalyzeDrugDataOutput } from '@/ai/flows/analyze-drug-data';

const initialAnalysisSteps: AnalysisStep[] = [
  { title: 'Uploading Image...', status: 'pending', duration: 500 },
  { title: 'Analyzing medicine packaging...', status: 'pending', duration: 4000 },
  { title: 'Identifying active ingredients...', status: 'pending', duration: 3000 },
  { title: 'Gathering information...', status: 'pending', duration: 2000 },
];


export const useScanner = () => {
  const [state, setState] = useState<ScannerState>('idle');
  const [image, setImage] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>(initialAnalysisSteps);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageQueue, setImageQueue] = useState<string[]>([]);
  
  const _runAnalysis = async (imageDataUrl: string) => {
    let currentSteps = [...initialAnalysisSteps].map(s => ({ ...s, status: 'pending' }));
    setAnalysisSteps(currentSteps.map((step, idx) => idx === 0 ? { ...step, status: 'in-progress' } : step));
    const analysisPromise = analyzeDrugData({ photoDataUri: imageDataUrl });

    for (let i = 0; i < currentSteps.length; i++) {
        currentSteps = currentSteps.map((step, idx) => 
            idx === i ? { ...step, status: 'in-progress' } : step
        );
        setAnalysisSteps(currentSteps);
        
        await new Promise(resolve => setTimeout(resolve, currentSteps[i].duration));

        currentSteps = currentSteps.map((step, idx) => 
            idx === i ? { ...step, status: 'complete' } : step
        );
        setAnalysisSteps(currentSteps);
    }

    try {
      const result: AnalyzeDrugDataOutput = await analysisPromise;

      if (result.error) {
        setMedicineInfo({ error: result.error });
        setState('info');
        return;
      }

      setMedicineInfo(result);
      setState('info');

    } catch (e: any) {
      console.error(e);
      const errorMessage = 'An unexpected error occurred during analysis.';
      setMedicineInfo({ error: errorMessage });
      setState('info');
    }
  };

  const _startAnalysisWithQueue = useCallback((imageDataUrls: string[]) => {
    if (imageDataUrls.length === 0) {
      // If queue is empty, go back to idle.
      setState('idle');
      setImage(null);
      setMedicineInfo(null);
      setError(null);
      setImageQueue([]);
      return;
    }

    const nextImage = imageDataUrls[0];
    const remainingImages = imageDataUrls.slice(1);

    setImage(nextImage);
    setImageQueue(remainingImages);
    setMedicineInfo(null);
    setError(null);
    setAnalysisSteps(initialAnalysisSteps.map(s => ({ ...s, status: 'pending' })));
    setState('analyzing');
    _runAnalysis(nextImage);
  }, []);

  const startScan = useCallback(() => {
    setState('scanning');
    setImage(null);
    setMedicineInfo(null);
    setError(null);
    setImageQueue([]);
    setAnalysisSteps(initialAnalysisSteps.map(s => ({ ...s, status: 'pending' })));
  }, []);

  const handleImageCapture = useCallback(async (imageDataUrl: string) => {
    _startAnalysisWithQueue([imageDataUrl]);
  }, [_startAnalysisWithQueue]);

  const handleMultipleImages = useCallback(async (imageDataUrls: string[]) => {
    if (imageDataUrls.length > 0) {
        _startAnalysisWithQueue(imageDataUrls);
    }
  }, [_startAnalysisWithQueue]);

  const analyzeNext = useCallback(() => {
    if(imageQueue.length > 0) {
        _startAnalysisWithQueue(imageQueue);
    } else {
        // If no more images, effectively restart
        setState('idle');
        setImage(null);
        setMedicineInfo(null);
        setError(null);
        setImageQueue([]);
    }
  }, [imageQueue, _startAnalysisWithQueue]);

  const restart = useCallback(() => {
    setState('idle');
    setImage(null);
    setMedicineInfo(null);
    setError(null);
    setImageQueue([]);
  }, []);

  return {
    state,
    image,
    analysisSteps,
    medicineInfo,
    error,
    imageQueue,
    startScan,
    handleImageCapture,
    handleMultipleImages,
    analyzeNext,
    restart,
  };
};
