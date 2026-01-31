'use client';

import { Header } from '@/components/layout/header';
import { useScanner } from '@/hooks/use-scanner';
import HomeScreen from '@/components/medilens/home-screen';
import Scanner from '@/components/medilens/scanner';
import AnalysisStepper from '@/components/medilens/analysis-stepper';
import MedicineInfoDisplay from '@/components/medilens/medicine-info';
import { Button } from '@/components/ui/button';
import { LiveAlertsTicker } from '@/components/medilens/live-alerts-ticker';

export default function Home() {
  const scanner = useScanner();

  const renderContent = () => {
    if (scanner.error) {
        return (
            <div className="text-center text-destructive">
                <h2 className="text-2xl font-bold mb-4">Analysis Failed</h2>
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
        return scanner.medicineInfo ? <MedicineInfoDisplay info={scanner.medicineInfo} onRestart={scanner.restart} /> : <p>Loading results...</p>;
      case 'idle':
      default:
        return <HomeScreen onScan={scanner.startScan} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-background">
      <Header />
      <main className="flex-1 w-full container mx-auto px-4 pt-8 pb-20 flex items-center justify-center">
        <div className="w-full max-w-lg text-center">
            {renderContent()}
        </div>
      </main>
      <LiveAlertsTicker />
    </div>
  );
}
