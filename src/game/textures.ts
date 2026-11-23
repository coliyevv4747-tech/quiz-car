import * as THREE from 'three';

export interface CityTextures {
  asphalt: THREE.CanvasTexture;
  sidewalk: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  glassFacade: THREE.CanvasTexture;
  sandstoneFacade: THREE.CanvasTexture;
  licensePlate: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  parkingSign: THREE.CanvasTexture;
  speedSign: THREE.CanvasTexture;
  stopSign: THREE.CanvasTexture;
  dashboardGauge: THREE.CanvasTexture;
  skyDome: THREE.CanvasTexture;
  dispose: () => void;
}

function configureTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
  isColor = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createCityTextures(maxAnisotropy: number): CityTextures {
  const aniso = Math.max(1, Math.min(8, maxAnisotropy));

  // 1. Realistic Asphalt
  const aspCanvas = document.createElement('canvas');
  aspCanvas.width = 512;
  aspCanvas.height = 512;
  const aspCtx = aspCanvas.getContext('2d')!;
  aspCtx.fillStyle = '#252932';
  aspCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 26 + Math.floor(Math.random() * 30);
    aspCtx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    aspCtx.fillRect(x, y, 2, 2);
  }
  const asphalt = configureTexture(aspCanvas, aniso, 24, 24, true);

  // 2. Central Asian Stone Sidewalk Pattern
  const swCanvas = document.createElement('canvas');
  swCanvas.width = 256;
  swCanvas.height = 256;
  const swCtx = swCanvas.getContext('2d')!;
  swCtx.fillStyle = '#9ea6b2';
  swCtx.fillRect(0, 0, 256, 256);
  swCtx.strokeStyle = '#7e8694';
  swCtx.lineWidth = 2;
  const tile = 32;
  for (let y = 0; y < 256; y += tile) {
    for (let x = 0; x < 256; x += tile) {
      const shade = 148 + ((x + y) % 64 === 0 ? 12 : -6);
      swCtx.fillStyle = `rgb(${shade},${shade - 2},${shade - 6})`;
      swCtx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
      swCtx.strokeRect(x, y, tile, tile);
    }
  }
  const sidewalk = configureTexture(swCanvas, aniso, 16, 16, true);

  // 3. Park Grass
  const grCanvas = document.createElement('canvas');
  grCanvas.width = 256;
  grCanvas.height = 256;
  const grCtx = grCanvas.getContext('2d')!;
  grCtx.fillStyle = '#2f5e3b';
  grCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const g = 75 + Math.floor(Math.random() * 45);
    grCtx.fillStyle = `rgb(${Math.floor(g * 0.45)},${g},${Math.floor(g * 0.52)})`;
    grCtx.fillRect(x, y, 2, 3);
  }
  const grass = configureTexture(grCanvas, aniso, 30, 30, true);

  // 4. Modern Glass Tower Facade
  const glCanvas = document.createElement('canvas');
  glCanvas.width = 256;
  glCanvas.height = 512;
  const glCtx = glCanvas.getContext('2d')!;
  glCtx.fillStyle = '#0f2238';
  glCtx.fillRect(0, 0, 256, 512);
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 8; col++) {
      const lit = Math.random() > 0.45;
      glCtx.fillStyle = lit ? '#38bdf8' : '#163554';
      if (lit && Math.random() > 0.72) glCtx.fillStyle = '#fde68a';
      glCtx.fillRect(col * 32 + 4, row * 32 + 5, 24, 22);
    }
    glCtx.fillStyle = '#334155';
    glCtx.fillRect(0, row * 32, 256, 3);
  }
  const glassFacade = configureTexture(glCanvas, aniso, 2, 3, true);

  // 5. Sandstone Residential Facade (Tashkent / Samarkand warm stone)
  const sdCanvas = document.createElement('canvas');
  sdCanvas.width = 256;
  sdCanvas.height = 512;
  const sdCtx = sdCanvas.getContext('2d')!;
  sdCtx.fillStyle = '#d4c3a3';
  sdCtx.fillRect(0, 0, 256, 512);
  for (let row = 0; row < 12; row++) {
    sdCtx.fillStyle = '#bfa982';
    sdCtx.fillRect(0, row * 42, 256, 4);
    for (let col = 0; col < 6; col++) {
      const warm = Math.random() > 0.6;
      sdCtx.fillStyle = warm ? '#fef08a' : '#1e293b';
      sdCtx.fillRect(col * 42 + 7, row * 42 + 10, 28, 24);
      sdCtx.strokeStyle = '#8b7755';
      sdCtx.lineWidth = 2;
      sdCtx.strokeRect(col * 42 + 7, row * 42 + 10, 28, 24);
    }
  }
  const sandstoneFacade = configureTexture(sdCanvas, aniso, 2, 2, true);

  // 6. Uzbek License Plate ("01 | A 777 UZ")
  const lpCanvas = document.createElement('canvas');
  lpCanvas.width = 256;
  lpCanvas.height = 64;
  const lpCtx = lpCanvas.getContext('2d')!;
  lpCtx.fillStyle = '#f8fafc';
  lpCtx.fillRect(0, 0, 256, 64);
  lpCtx.strokeStyle = '#0f172a';
  lpCtx.lineWidth = 4;
  lpCtx.strokeRect(2, 2, 252, 60);
  // Blue/white/green UZ stripe on right
  lpCtx.fillStyle = '#00a8e8';
  lpCtx.fillRect(216, 4, 36, 18);
  lpCtx.fillStyle = '#ffffff';
  lpCtx.fillRect(216, 22, 36, 18);
  lpCtx.fillStyle = '#10b981';
  lpCtx.fillRect(216, 40, 36, 20);
  lpCtx.fillStyle = '#0f172a';
  lpCtx.font = 'bold 30px monospace';
  lpCtx.fillText('01|A777AA', 14, 42);
  lpCtx.font = 'bold 14px sans-serif';
  lpCtx.fillText('UZ', 222, 36);
  const licensePlate = configureTexture(lpCanvas, aniso, 1, 1, true);

  // 7. Radial Soft Contact Shadow
  const csCanvas = document.createElement('canvas');
  csCanvas.width = 128;
  csCanvas.height = 128;
  const csCtx = csCanvas.getContext('2d')!;
  const grad = csCtx.createRadialGradient(64, 64, 14, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.72)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  csCtx.fillStyle = grad;
  csCtx.fillRect(0, 0, 128, 128);
  const contactShadow = configureTexture(csCanvas, 1, 1, 1, true);

  // 8. Traffic Signs
  const mkSign = (draw: (c: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    draw(ctx);
    return configureTexture(c, aniso, 1, 1, true);
  };

  const parkingSign = mkSign((c) => {
    c.fillStyle = '#0284c7';
    c.fillRect(6, 6, 116, 116);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 6;
    c.strokeRect(10, 10, 108, 108);
    c.fillStyle = '#ffffff';
    c.font = 'bold 82px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('P', 64, 68);
  });

  const speedSign = mkSign((c) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(64, 64, 58, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#dc2626';
    c.lineWidth = 12;
    c.stroke();
    c.fillStyle = '#0f172a';
    c.font = 'bold 54px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('60', 64, 66);
  });

  const stopSign = mkSign((c) => {
    c.fillStyle = '#dc2626';
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const x = 64 + Math.cos(a) * 58;
      const y = 64 + Math.sin(a) * 58;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 5;
    c.stroke();
    c.fillStyle = '#ffffff';
    c.font = 'bold 32px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('STOP', 64, 66);
  });

  // 9. Cockpit Dashboard Gauge Texture
  const dgCanvas = document.createElement('canvas');
  dgCanvas.width = 256;
  dgCanvas.height = 128;
  const dgCtx = dgCanvas.getContext('2d')!;
  dgCtx.fillStyle = '#090d16';
  dgCtx.fillRect(0, 0, 256, 128);
  [64, 192].forEach((cx, idx) => {
    dgCtx.strokeStyle = idx === 0 ? '#38bdf8' : '#10b981';
    dgCtx.lineWidth = 4;
    dgCtx.beginPath();
    dgCtx.arc(cx, 64, 46, Math.PI * 0.75, Math.PI * 2.25);
    dgCtx.stroke();
    dgCtx.fillStyle = '#e2e8f0';
    dgCtx.font = 'bold 16px monospace';
    dgCtx.textAlign = 'center';
    dgCtx.fillText(idx === 0 ? 'KM/H' : 'RPM', cx, 92);
  });
  const dashboardGauge = configureTexture(dgCanvas, aniso, 1, 1, true);

  // 10. Sky Dome Gradient
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 32;
  skyCanvas.height = 256;
  const skyCtx = skyCanvas.getContext('2d')!;
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 256);
  skyGrad.addColorStop(0, '#0c2d57');
  skyGrad.addColorStop(0.45, '#3b82c4');
  skyGrad.addColorStop(0.75, '#93c5fd');
  skyGrad.addColorStop(1, '#dbeafe');
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 32, 256);
  const skyDome = configureTexture(skyCanvas, 1, 1, 1, true);

  return {
    asphalt,
    sidewalk,
    grass,
    glassFacade,
    sandstoneFacade,
    licensePlate,
    contactShadow,
    parkingSign,
    speedSign,
    stopSign,
    dashboardGauge,
    skyDome,
    dispose: () => {
      asphalt.dispose();
      sidewalk.dispose();
      grass.dispose();
      glassFacade.dispose();
      sandstoneFacade.dispose();
      licensePlate.dispose();
      contactShadow.dispose();
      parkingSign.dispose();
      speedSign.dispose();
      stopSign.dispose();
      dashboardGauge.dispose();
      skyDome.dispose();
    },
  };
}
