'use client';

import React, { useState } from 'react';
import DeviceFrame from '@/components/mobile/DeviceFrame';
import MobileApp from '@/components/mobile/MobileApp';

export default function MobilePage() {
  const [osTheme, setOsTheme] = useState<'ios' | 'android'>('ios');
  const [frameMode, setFrameMode] = useState<'iphone' | 'pixel' | 'fullscreen'>('iphone');
  const [resetKey, setResetKey] = useState(0);

  const handleResetData = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <DeviceFrame
      osTheme={osTheme}
      setOsTheme={setOsTheme}
      frameMode={frameMode}
      setFrameMode={setFrameMode}
      onResetData={handleResetData}
    >
      <MobileApp key={resetKey} osTheme={osTheme} />
    </DeviceFrame>
  );
}
