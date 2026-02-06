const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

function generateMap() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.3;
    const points = 150; // 더 매끄러운 곡선을 위해 포인트 증가
    const mapPoints = [];

    // 무작위성을 위한 변수들
    const lobes = Math.floor(Math.random() * 5) + 3; // 3~7개의 큰 굴곡
    const randomness = Math.random() * 0.5 + 0.2;

    // 점 생성
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        // 1. 큰 형태 (Lobes)
        let noise = Math.sin(angle * lobes) * (baseRadius * 0.2);
        
        // 2. 중간 형태 (Medium detail)
        noise += Math.sin(angle * (lobes * 2.5)) * (baseRadius * 0.1);
        
        // 3. 세부 형태 (Roughness)
        noise += (Math.random() - 0.5) * (baseRadius * 0.15);
        
        const radius = baseRadius + noise;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        mapPoints.push({ x, y });
    }

    // Draw the Sea (already handled by canvas background, but we could add detail)

    // Draw the Island
    ctx.beginPath();
    ctx.moveTo(mapPoints[0].x, mapPoints[0].y);
    
    for (let i = 1; i < mapPoints.length; i++) {
        // Use quadratic curve for smoothing
        const xc = (mapPoints[i].x + mapPoints[i - 1].x) / 2;
        const yc = (mapPoints[i].y + mapPoints[i - 1].y) / 2;
        ctx.quadraticCurveTo(mapPoints[i - 1].x, mapPoints[i - 1].y, xc, yc);
    }
    
    // Connect the last point back to the first
    const xc = (mapPoints[0].x + mapPoints[mapPoints.length - 1].x) / 2;
    const yc = (mapPoints[0].y + mapPoints[mapPoints.length - 1].y) / 2;
    ctx.quadraticCurveTo(mapPoints[mapPoints.length - 1].x, mapPoints[mapPoints.length - 1].y, xc, yc);
    
    ctx.closePath();

    // Fill with land color
    ctx.fillStyle = '#f1c40f'; // Sand/Land color
    ctx.fill();

    // Add a stroke for the coastline
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Add some random "features" (greenery)
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * baseRadius * 0.6;
        const fx = centerX + Math.cos(angle) * dist;
        const fy = centerY + Math.sin(angle) * dist;
        
        ctx.beginPath();
        ctx.arc(fx, fy, 20 + Math.random() * 30, 0, Math.PI * 2);
        ctx.fillStyle = '#27ae60'; // Forest color
        ctx.fill();
    }
}

// Initial generation
generateMap();
