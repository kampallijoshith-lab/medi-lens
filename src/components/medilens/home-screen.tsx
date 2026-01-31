'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HomeScreenProps {
  onScan: () => void;
  onUpload: (imageDataUrls: string[]) => void;
  cooldown: number;
}

const steps = [
  {
    icon: Camera,
    title: 'Snap',
    description: 'Take a clear photo',
  },
  {
    icon: ShieldCheck,
    title: 'Analyze',
    description: 'AI analyzes the image',
  },
  {
    icon: Upload,
    title: 'Verify',
    description: 'Get an instant verdict',
  },
];

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export default function HomeScreen({ onScan, onUpload, cooldown }: HomeScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const cooldownActive = cooldown > 0;

  const handleUploadClick = () => {
    if (cooldownActive) {
      toast({
        title: "Cooldown Active",
        description: `Please wait ${cooldown} more seconds.`,
        variant: "destructive"
      });
      return;
    }
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      toast({
          title: "Uploading images...",
          description: `Selected ${files.length} image(s) for analysis.`,
      });
      try {
        const filePromises = Array.from(files).map(readFileAsDataUrl);
        const dataUrls = await Promise.all(filePromises);
        onUpload(dataUrls);
      } catch (error) {
        console.error("Error reading files:", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "There was an error reading your selected files.",
        });
      }
    }
    // Reset file input to allow selecting the same file(s) again
    if (event.target) {
        event.target.value = '';
    }
  };


  return (
    <div className="flex flex-col items-center text-center justify-between h-full">
        <div> {/* This div will contain the top content */}
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter mb-2 mt-4 text-foreground">
                AI-Powered Medicine Verification
            </h1>
            <p className="text-md md:text-lg text-muted-foreground max-w-2xl mb-4">
                Instantly verify your medication.
            </p>

            <div className="grid grid-cols-3 gap-x-2 md:gap-x-4 mb-4 w-full max-w-sm mx-auto">
                {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full h-10 w-10 mb-1">
                      <step.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-headline text-sm font-semibold">{step.title}</h3>
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
            <Button size="lg" onClick={onScan} disabled={cooldownActive}>
              <Camera className="mr-2" />
              {cooldownActive ? `Please wait ${cooldown}s` : 'Scan Medicine'}
            </Button>
            <Button size="lg" variant="secondary" onClick={handleUploadClick} disabled={cooldownActive}>
              <Upload className="mr-2" />
               {cooldownActive ? `Please wait ${cooldown}s` : 'Upload Photo(s)'}
            </Button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
            {cooldownActive && (
              <p className="text-xs text-muted-foreground text-center">
                  A brief cooldown is enabled to prevent hitting API rate limits.
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
