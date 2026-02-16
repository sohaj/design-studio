import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

// Create a 1080x1920 canvas (typical mobile resolution)
const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext('2d');

// Gradient background
const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
gradient.addColorStop(0, '#6c5ce7');
gradient.addColorStop(0.5, '#a29bfe');
gradient.addColorStop(1, '#fd79a8');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1080, 1920);

// Add some text
ctx.fillStyle = 'white';
ctx.font = 'bold 120px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Test Screen', 540, 960);

// Add subtitle
ctx.font = '60px Arial';
ctx.fillText('3D Mockup Demo', 540, 1100);

// Add circles
ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
ctx.beginPath();
ctx.arc(540, 700, 150, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(540, 1300, 100, 0, Math.PI * 2);
ctx.fill();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
writeFileSync('test-screen.png', buffer);
console.log('✓ Test image created: test-screen.png (1080x1920)');
