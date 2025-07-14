'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * QR Code Generator utility for Lightning invoices
 */
export class QRCodeGenerator {
  static async generateDataURL(data: string, size: number = 200): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return '';
    }
  }

  static async generateSVG(data: string, size: number = 200): Promise<string> {
    try {
      return await QRCode.toString(data, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Failed to generate QR code SVG:', error);
      return '';
    }
  }
}

/**
 * React hook for QR code generation
 */
export function useQRCode(data: string, size: number = 200) {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (data) {
      setIsLoading(true);
      setError(null);
      
      QRCodeGenerator.generateDataURL(data, size)
        .then(setQrCode)
        .catch((err) => {
          console.error('QR code generation failed:', err);
          setError('Failed to generate QR code');
        })
        .finally(() => setIsLoading(false));
    }
  }, [data, size]);
  
  return { qrCode, isLoading, error };
}
