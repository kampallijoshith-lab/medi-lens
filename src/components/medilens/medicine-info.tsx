'use client';
      
import type { MedicineInfo } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Shield, List, AlertTriangle } from 'lucide-react';

interface MedicineInfoProps {
  info: MedicineInfo;
  onRestart: () => void;
}

export default function MedicineInfoDisplay({ info, onRestart }: MedicineInfoProps) {
  return (
    <Card className="w-full max-w-lg animate-in fade-in-50">
      <CardHeader>
        <div className="flex items-center gap-3">
           <Info className="h-8 w-8 text-primary" />
           <CardTitle className="font-headline text-2xl">Medicine Information</CardTitle>
        </div>
        <CardDescription>
          Based on the AI analysis of the packaging.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-left">
        {info.primaryUses && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Shield className="text-primary"/> Primary Uses</h3>
            <p className="text-muted-foreground">{info.primaryUses}</p>
          </div>
        )}

        {info.howItWorks && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Info className="text-primary"/> How it Works</h3>
            <p className="text-muted-foreground">{info.howItWorks}</p>
          </div>
        )}

        {info.commonIndications && info.commonIndications.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><List className="text-primary"/> Common Indications</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {info.commonIndications.map((indication, i) => <li key={i}>{indication}</li>)}
            </ul>
          </div>
        )}

        {info.safetyDisclaimer && (
          <div className="space-y-2 rounded-lg border border-accent bg-accent/10 p-4">
            <h3 className="font-semibold flex items-center gap-2 text-accent-foreground"><AlertTriangle className="text-accent"/> Safety Disclaimer</h3>
            <p className="text-sm text-accent-foreground/80">{info.safetyDisclaimer}</p>
          </div>
        )}

        <Button onClick={onRestart} className="w-full mt-4">
          Scan Another Medicine
        </Button>
      </CardContent>
    </Card>
  );
}
