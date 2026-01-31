'use client';

import { Header } from '@/components/layout/header';
import { useScanner } from '@/hooks/use-scanner';
import HomeScreen from '@/components/medilens/home-screen';
import Scanner from '@/components/medilens/scanner';
import AnalysisStepper from '@/components/medilens/analysis-stepper';
import MedicineInfoDisplay from '@/components/medilens/medicine-info';
import { Button } from '@/components/ui/button';
import { LiveAlertsTicker } from '@/components/medilens/live-alerts-ticker';
import InteractiveBackground from '@/components/medilens/interactive-background';

export default function Home() {
  const scanner = useScanner();

  const renderContent = () => {
    if (scanner.error && scanner.state !== 'info') { // Don't show global error if it's an analysis error
        return (
            <div className="text-center text-destructive">
                <h2 className="text-2xl font-bold mb-4">An Error Occurred</h2>
                <p>{scanner.error}</p>
                <Button onClick={scanner.restart} className="mt-4">Try Again</Button>
            </div>
        );
    }
    switch (scanner.state) {
      case 'scanning':
        return <Scanner handleImageCapture={scanner.handleImageCapture} onCancel={scanner.restart} />;
      case 'analyzing':
        return <AnalysisStepper steps={scanner.analysisSteps} />;
      case 'info':
        return scanner.medicineInfo ? <MedicineInfoDisplay 
                                            info={scanner.medicineInfo} 
                                            onRestart={scanner.restart} 
                                            onAnalyzeNext={scanner.analyzeNext}
                                            hasNext={scanner.imageQueue.length > 0}
                                        /> : <AnalysisStepper steps={scanner.analysisSteps} />; // Show stepper while results are loading
      case 'idle':
      default:
        return <HomeScreen onScan={scanner.startScan} onUpload={scanner.handleMultipleImages} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-background">
      <InteractiveBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className="flex-1 w-full container mx-auto px-4 pt-8 pb-20 flex items-stretch justify-center">
          <div className="w-full max-w-lg text-center flex flex-col">
              {renderContent()}
          </div>
        </main>
        <LiveAlertsTicker />
      </div>
    </div>
  );
}
