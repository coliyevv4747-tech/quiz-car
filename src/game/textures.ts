import * as THREE from 'three';

export interface CityTextures {
  asphalt: THREE.CanvasTexture;
  trackAsphalt: THREE.CanvasTexture;
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
  skyDomeNight: THREE.CanvasTexture;
  carbonFiber: THREE.CanvasTexture;
  checkeredLine: THREE.CanvasTexture;
  brakeDisc: THREE.CanvasTexture;
  smokePuff: THREE.CanvasTexture;
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

  // 1. City Asphalt
  const aspCanvas = document.createElement('canvas');
  aspCanvas.width = 512;
  aspCanvas.height = 512;
  const aspCtx = aspCanvas.getContext('2d')!;
  aspCtx.fillStyle = '#242933';
  aspCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 24 + Math.floor(Math.random() * 30);
    aspCtx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    aspCtx.fillRect(x, y, 2, 2);
  }
  const asphalt = configureTexture(aspCanvas, aniso, 24, 24, true);

  // 1b. Motorsport Track Asphalt (darker grippy tarmac with subtle racing groove)
  const trkCanvas = document.createElement('canvas');
  trkCanvas.width = 512;
  trkCanvas.height = 512;
  const trkCtx = trkCanvas.getContext('2d')!;
  trkCtx.fillStyle = '#1d2129';
  trkCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 20 + Math.floor(Math.random() * 24);
    trkCtx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    trkCtx.fillRect(x, y, 2, 2);
  }
  trkCtx.fillStyle = 'rgba(10,12,16,0.22)';
  trkCtx.fillRect(140, 0, 232, 512);
  const trackAsphalt = configureTexture(trkCanvas, aniso, 1, 24, true);

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
  grCtx.fillStyle = '#2a5635';
  grCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const g = 70 + Math.floor(Math.random() * 45);
    grCtx.fillStyle = `rgb(${Math.floor(g * 0.45)},${g},${Math.floor(g * 0.52)})`;
    grCtx.fillRect(x, y, 2, 3);
  }
  const grass = configureTexture(grCanvas, aniso, 34, 34, true);

  // 4. Modern Glass Tower Facade
  const glCanvas = document.createElement('canvas');
  glCanvas.width = 256;
  glCanvas.height = 512;
  const glCtx = glCanvas.getContext('2d')!;
  glCtx.fillStyle = '#0f2238';
  glCtx.fillRect(0, 0, 256, 512);
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 8; col++) {
      const lit = Math.random() > 0.42;
      glCtx.fillStyle = lit ? '#38bdf8' : '#163554';
      if (lit && Math.random() > 0.68) glCtx.fillStyle = '#fde68a';
      glCtx.fillRect(col * 32 + 4, row * 32 + 5, 24, 22);
    }
    glCtx.fillStyle = '#334155';
    glCtx.fillRect(0, row * 32, 256, 3);
  }
  const glassFacade = configureTexture(glCanvas, aniso, 2, 3, true);

  // 5. Sandstone Residential Facade
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
      const warm = Math.random() > 0.55;
      sdCtx.fillStyle = warm ? '#fef08a' : '#1e293b';
      sdCtx.fillRect(col * 42 + 7, row * 42 + 10, 28, 24);
      sdCtx.strokeStyle = '#8b7755';
      sdCtx.lineWidth = 2;
      sdCtx.strokeRect(col * 42 + 7, row * 42 + 10, 28, 24);
    }
  }
  const sandstoneFacade = configureTexture(sdCanvas, aniso, 2, 2, true);

  // 6. Uzbek License Plate ("01|R777UZ")
  const lpCanvas = document.createElement('canvas');
  lpCanvas.width = 256;
  lpCanvas.height = 64;
  const lpCtx = lpCanvas.getContext('2d')!;
  lpCtx.fillStyle = '#f8fafc';
  lpCtx.fillRect(0, 0, 256, 64);
  lpCtx.strokeStyle = '#0f172a';
  lpCtx.lineWidth = 4;
  lpCtx.strokeRect(2, 2, 252, 60);
  lpCtx.fillStyle = '#00a8e8';
  lpCtx.fillRect(216, 4, 36, 18);
  lpCtx.fillStyle = '#ffffff';
  lpCtx.fillRect(216, 22, 36, 18);
  lpCtx.fillStyle = '#10b981';
  lpCtx.fillRect(216, 40, 36, 20);
  lpCtx.fillStyle = '#0f172a';
  lpCtx.font = 'bold 30px monospace';
  lpCtx.fillText('01|R777GT', 14, 42);
  lpCtx.font = 'bold 14px sans-serif';
  lpCtx.fillText('UZ', 222, 36);
  const licensePlate = configureTexture(lpCanvas, aniso, 1, 1, true);

  // 7. Radial Soft Contact Shadow
  const csCanvas = document.createElement('canvas');
  csCanvas.width = 128;
  csCanvas.height = 128;
  const csCtx = csCanvas.getContext('2d')!;
  const grad = csCtx.createRadialGradient(64, 64, 14, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.78)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.40)');
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

  // 9. Cockpit Digital Racing Gauge
  const dgCanvas = document.createElement('canvas');
  dgCanvas.width = 256;
  dgCanvas.height = 128;
  const dgCtx = dgCanvas.getContext('2d')!;
  dgCtx.fillStyle = '#070b12';
  dgCtx.fillRect(0, 0, 256, 128);
  dgCtx.strokeStyle = '#38bdf8';
  dgCtx.lineWidth = 4;
  dgCtx.strokeRect(4, 4, 248, 120);
  [64, 192].forEach((cx, idx) => {
    dgCtx.strokeStyle = idx === 0 ? '#38bdf8' : '#ef4444';
    dgCtx.lineWidth = 5;
    dgCtx.beginPath();
    dgCtx.arc(cx, 64, 44, Math.PI * 0.75, Math.PI * 2.25);
    dgCtx.stroke();
    dgCtx.fillStyle = '#f8fafc';
    dgCtx.font = 'bold 15px monospace';
    dgCtx.textAlign = 'center';
    dgCtx.fillText(idx === 0 ? 'KM/H' : 'RPM x1K', cx, 92);
  });
  const dashboardGauge = configureTexture(dgCanvas, aniso, 1, 1, true);

  // 10. Day Sky Dome
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 32;
  skyCanvas.height = 256;
  const skyCtx = skyCanvas.getContext('2d')!;
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 256);
  skyGrad.addColorStop(0, '#0a2954');
  skyGrad.addColorStop(0.45, '#367bc0');
  skyGrad.addColorStop(0.75, '#93c5fd');
  skyGrad.addColorStop(1, '#dbeafe');
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 32, 256);
  const skyDome = configureTexture(skyCanvas, 1, 1, 1, true);

  // 10b. Night Sky Dome
  const nSkyCanvas = document.createElement('canvas');
  nSkyCanvas.width = 32;
  nSkyCanvas.height = 256;
  const nSkyCtx = nSkyCanvas.getContext('2d')!;
  const nSkyGrad = nSkyCtx.createLinearGradient(0, 0, 0, 256);
  nSkyGrad.addColorStop(0, '#030612');
  nSkyGrad.addColorStop(0.55, '#0b1630');
  nSkyGrad.addColorStop(0.85, '#172554');
  nSkyGrad.addColorStop(1, '#1e293b');
  nSkyCtx.fillStyle = nSkyGrad;
  nSkyCtx.fillRect(0, 0, 32, 256);
  const skyDomeNight = configureTexture(nSkyCanvas, 1, 1, 1, true);

  // 11. Carbon Fiber Weave
  const cfCanvas = document.createElement('canvas');
  cfCanvas.width = 64;
  cfCanvas.height = 64;
  const cfCtx = cfCanvas.getContext('2d')!;
  cfCtx.fillStyle = '#11141a';
  cfCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      cfCtx.fillStyle = (x + y) % 16 === 0 ? '#272c38' : '#181c24';
      cfCtx.fillRect(x, y, 7, 7);
    }
  }
  const carbonFiber = configureTexture(cfCanvas, aniso, 6, 6, true);

  // 12. Checkered Start/Finish Texture
  const chCanvas = document.createElement('canvas');
  chCanvas.width = 256;
  chCanvas.height = 64;
  const chCtx = chCanvas.getContext('2d')!;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 16; x++) {
      chCtx.fillStyle = (x + y) % 2 === 0 ? '#f8fafc' : '#0f172a';
      chCtx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  const checkeredLine = configureTexture(chCanvas, aniso, 2, 1, true);

  // 13. Ventilated Brake Disc Rotor Texture
  const bdCanvas = document.createElement('canvas');
  bdCanvas.width = 128;
  bdCanvas.height = 128;
  const bdCtx = bdCanvas.getContext('2d')!;
  bdCtx.fillStyle = '#64748b';
  bdCtx.fillRect(0, 0, 128, 128);
  bdCtx.strokeStyle = '#94a3b8';
  bdCtx.lineWidth = 3;
  for (let r = 24; r < 58; r += 8) {
    bdCtx.beginPath();
    bdCtx.arc(64, 64, r, 0, Math.PI * 2);
    bdCtx.stroke();
  }
  bdCtx.fillStyle = '#1e293b';
  for (let a = 0; a < 12; a++) {
    const ang = (a * Math.PI) / 6;
    for (let r = 30; r <= 50; r += 10) {
      bdCtx.beginPath();
      bdCtx.arc(64 + Math.cos(ang) * r, 64 + Math.sin(ang) * r, 2.2, 0, Math.PI * 2);
      bdCtx.fill();
    }
  }
  const brakeDisc = configureTexture(bdCanvas, aniso, 1, 1, true);

  // 14. Soft Smoke Puff Texture
  const smCanvas = document.createElement('canvas');
  smCanvas.width = 64;
  smCanvas.height = 64;
  const smCtx = smCanvas.getContext('2d')!;
  const smGrad = smCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
  smGrad.addColorStop(0, 'rgba(226,232,240,0.85)');
  smGrad.addColorStop(0.5, 'rgba(203,213,225,0.45)');
  smGrad.addColorStop(1, 'rgba(203,213,225,0)');
  smCtx.fillStyle = smGrad;
  smCtx.fillRect(0, 0, 64, 64);
  const smokePuff = configureTexture(smCanvas, 1, 1, 1, true);

  return {
    asphalt,
    trackAsphalt,
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
    skyDomeNight,
    carbonFiber,
    checkeredLine,
    brakeDisc,
    smokePuff,
    dispose: () => {
      asphalt.dispose();
      trackAsphalt.dispose();
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
      skyDomeNight.dispose();
      carbonFiber.dispose();
      checkeredLine.dispose();
      brakeDisc.dispose();
      smokePuff.dispose();
    },
  };
}
