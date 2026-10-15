/**
 * Canvas drawing helpers for cute 2D cartoon army graphics.
 * High-performance, lightweight, scalable to low-end devices.
 */

export function drawCartoonSoldier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1,
  character: string = 'Leo',
  action: 'idle' | 'run' | 'jump' | 'slide' = 'run',
  frame: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Bobbing animation
  const bob = action === 'run' ? Math.sin(frame * 0.25) * 4 : 0;
  const legAngle = action === 'run' ? Math.sin(frame * 0.25) * 0.4 : 0;

  // Character theme colors
  const skinColor = '#fed7aa';
  let uniformColor = '#15803d'; // Leo green
  let hatColor = '#166534';
  let hairColor = '#78350f';

  if (character === 'Bella') {
    uniformColor = '#047857';
    hatColor = '#065f46';
    hairColor = '#b45309';
  } else if (character === 'Teddy') {
    uniformColor = '#b45309';
    hatColor = '#92400e';
    hairColor = '#451a03';
  } else if (character === 'Maya') {
    uniformColor = '#0369a1';
    hatColor = '#075985';
    hairColor = '#1e293b';
  }

  if (action === 'slide') {
    // Sliding pose: lower to ground, sliding on knees
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body tilted back
    ctx.fillStyle = uniformColor;
    ctx.beginPath();
    ctx.roundRect(-24, 0, 42, 18, 8);
    ctx.fill();

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(-14, -6, 12, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.arc(-14, -9, 13, Math.PI, 0);
    ctx.fill();

    // Star on helmet
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-14, -9, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-9, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 36, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs / Boots
  const legOffset = action === 'jump' ? -6 : 0;
  // Left leg
  ctx.fillStyle = '#3f3f46';
  ctx.save();
  ctx.translate(-6, 22 + legOffset);
  ctx.rotate(legAngle);
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 14, 4);
  ctx.fill();
  // Boot
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.roundRect(-5, 10, 11, 6, 3);
  ctx.fill();
  ctx.restore();

  // Right leg
  ctx.fillStyle = '#3f3f46';
  ctx.save();
  ctx.translate(6, 22 + legOffset);
  ctx.rotate(-legAngle);
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 14, 4);
  ctx.fill();
  // Boot
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.roundRect(-4, 10, 11, 6, 3);
  ctx.fill();
  ctx.restore();

  // Torso / Jacket
  ctx.fillStyle = uniformColor;
  ctx.beginPath();
  ctx.roundRect(-14, 2 + bob, 28, 22, 6);
  ctx.fill();

  // Belt with gold buckle
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-14, 16 + bob, 28, 4);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-4, 15 + bob, 8, 6);

  // Arms
  const armSwing = action === 'run' ? -legAngle * 1.2 : 0;
  ctx.fillStyle = uniformColor;
  ctx.save();
  ctx.translate(-14, 6 + bob);
  ctx.rotate(armSwing);
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 16, 4);
  ctx.fill();
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(14, 6 + bob);
  ctx.rotate(-armSwing);
  ctx.fillStyle = uniformColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 16, 4);
  ctx.fill();
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, -10 + bob, 14, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.arc(-7, -7 + bob, 3, 0, Math.PI * 2);
  ctx.arc(7, -7 + bob, 3, 0, Math.PI * 2);
  ctx.fill();

  // Friendly Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-5, -11 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(5, -11 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-4, -12 + bob, 1, 0, Math.PI * 2);
  ctx.arc(6, -12 + bob, 1, 0, Math.PI * 2);
  ctx.fill();

  // Big Happy Smile
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -7 + bob, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Hair fringes
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.arc(-8, -16 + bob, 4, 0, Math.PI * 2);
  ctx.arc(8, -16 + bob, 4, 0, Math.PI * 2);
  ctx.fill();

  // Friendly Army Helmet
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.arc(0, -15 + bob, 15, Math.PI, 0);
  ctx.fill();

  // Helmet brim
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.roundRect(-17, -16 + bob, 34, 4, 2);
  ctx.fill();

  // Yellow Star emblem on Helmet
  drawStar(ctx, 0, -17 + bob, 4, 5, '#facc15');

  ctx.restore();
}

export function drawCartoonJeep(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1,
  vehicleType: string = 'GreenJeep',
  wheelAngle: number = 0,
  bounce: number = 0
) {
  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.scale(scale, scale);

  let bodyColor = '#4d7c0f'; // green
  let roofColor = '#365314';
  let detailColor = '#ca8a04';

  if (vehicleType === 'DesertJeep') {
    bodyColor = '#d97706';
    roofColor = '#92400e';
    detailColor = '#f59e0b';
  } else if (vehicleType === 'RescueJeep') {
    bodyColor = '#dc2626';
    roofColor = '#991b1b';
    detailColor = '#ffffff';
  } else if (vehicleType === 'TigerJeep') {
    bodyColor = '#ea580c';
    roofColor = '#7c2d12';
    detailColor = '#18181b';
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 45, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-42, -8, 84, 24, 6);
  ctx.fill();

  // Front Hood & Grille
  ctx.beginPath();
  ctx.roundRect(14, -4, 28, 18, 4);
  ctx.fill();

  // Windshield & Frame
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.roundRect(-10, -26, 26, 20, 3);
  ctx.fill();
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Roll Cage / Roof Bar
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-36, -6);
  ctx.lineTo(-36, -26);
  ctx.lineTo(-8, -26);
  ctx.stroke();

  // Friendly Headlight
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(40, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Golden Star on door
  drawStar(ctx, -14, 4, 7, 5, '#facc15');

  // Big Cartoon Wheels with treads
  const drawWheel = (wx: number, wy: number) => {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(wheelAngle);

    // Tire
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Wheel Rim
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Center Hub
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Spokes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
    }

    ctx.restore();
  };

  drawWheel(-26, 18);
  drawWheel(26, 18);

  ctx.restore();
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  points: number = 5,
  color: string = '#facc15'
) {
  const innerRadius = outerRadius * 0.45;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / points;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < points; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();

  // Sparkling highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - outerRadius * 0.2, cy - outerRadius * 0.2, outerRadius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number = 10,
  frame: number = 0
) {
  ctx.save();
  const widthFactor = Math.abs(Math.sin(frame * 0.08));

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius + 2, radius * Math.max(0.2, widthFactor), 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * Math.max(0.15, widthFactor), radius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (widthFactor > 0.5) {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(cx, cy, (radius - 3) * widthFactor, radius - 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.font = `bold ${radius}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy);
  }

  ctx.restore();
}
