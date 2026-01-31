'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, ShieldCheck } from 'lucide-react';

interface HomeScreenProps {
  onScan: () => void;
}

const steps = [
  {
    icon: Camera,
    title: 'Snap',
    description: 'Take a clear photo of the medicine packaging.',
  },
  {
    icon: ShieldCheck,
    title: 'Analyze',
    description: 'Our AI analyzes the image against a global database.',
  },
  {
    icon: Upload,
    title: 'Verify',
    description: 'Get an instant verdict on its authenticity.',
  },
];

export default function HomeScreen({ onScan }: HomeScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      // In a real app, you would read the file and pass it to the scanner
      // For now, just trigger the scan process
      onScan();
    }
  };


  return (
    <div className="flex flex-col items-center text-center justify-between h-full">
        <div> {/* This div will contain the top content */}
            <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter mb-2 mt-4 text-foreground">
                AI-Powered Medicine Verification
            </h1>
            <p className="text-md md:text-lg text-muted-foreground max-w-2xl mb-4">
                Instantly verify the authenticity of your medication in three simple steps.
            </p>

            <div className="grid grid-cols-3 gap-x-2 md:gap-x-6 mb-4 w-full max-w-4xl">
                {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full h-10 w-10 md:h-12 md:w-12 mb-1">
                    <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h3 className="font-headline text-md md:text-lg font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground text-xs leading-tight">{step.description}</p>
                </div>
                ))}
            </div>
        </div>

      <Card className="w-full max-w-md">
        <CardHeader className="p-4">
            <CardTitle className="text-xl">Start Verification</CardTitle>
            <CardDescription>Choose an option below to begin.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col gap-3">
            <Button size="lg" onClick={onScan}>
              <Camera className="mr-2" />
              Scan Medicine
            </Button>
            <Button size="lg" variant="secondary" onClick={handleUploadClick}>
              <Upload className="mr-2" />
              Upload Photo
            </Button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}
