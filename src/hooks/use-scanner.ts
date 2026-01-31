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
  
  const startScan = useCallback(() => {
    setState('scanning');
    setImage(null);
    setMedicineInfo(null);
    setError(null);
    setAnalysisSteps(initialAnalysisSteps.map(s => ({ ...s, status: 'pending' })));
  }, []);
  
  const handleImageCapture = useCallback(async (imageDataUrl: string) => {
    setImage(imageDataUrl);
    setState('analyzing');
    await _runAnalysis(imageDataUrl);
  }, []);

  const _runAnalysis = async (imageDataUrl: string) => {
    let currentSteps = [...initialAnalysisSteps];
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
        setError(result.error);
        setState('idle'); 
        return;
      }

      setMedicineInfo(result);
      setState('info');

    } catch (e: any) {
      console.error(e);
      setError('An unexpected error occurred during analysis.');
      setState('idle');
    }
  };

  const restart = useCallback(() => {
    setState('idle');
    setImage(null);
    setMedicineInfo(null);
    setError(null);
  }, []);

  return {
    state,
    image,
    analysisSteps,
    medicineInfo,
    error,
    startScan,
    handleImageCapture,
    restart,
  };
};
