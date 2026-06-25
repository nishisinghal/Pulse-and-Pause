// ============================================
// SWASTHYA YOUTH — Charts (Canvas)
// ============================================
window.Charts = (() => {

  function drawBarChart(canvasId, labels, values, color = '#3ecf8e', maxVal) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '200px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = 200;
    const padding = { top: 20, right: 10, bottom: 35, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const max = maxVal || Math.max(...values, 1);
    const barCount = labels.length;
    const barGap = 8;
    const barWidth = Math.min(30, (chartW - barGap * (barCount + 1)) / barCount);
    const totalBarsWidth = barCount * barWidth + (barCount - 1) * barGap;
    const startX = padding.left + (chartW - totalBarsWidth) / 2;

    ctx.clearRect(0, 0, w, h);

    // Draw bars with animation frame
    let progress = 0;
    function animate() {
      progress = Math.min(progress + 0.05, 1);
      ctx.clearRect(0, 0, w, h);

      const isLight = document.body.getAttribute('data-theme') === 'light';
      const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
      const textColorTop = isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
      const textColorBottom = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';

      // Grid lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
      }

      labels.forEach((label, i) => {
        const x = startX + i * (barWidth + barGap);
        const val = values[i] * progress;
        const barH = (val / max) * chartH;
        const y = padding.top + chartH - barH;

        // Bar gradient
        const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color + '40');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
        ctx.fill();

        // Value on top
        if (values[i] > 0) {
          ctx.fillStyle = textColorTop;
          ctx.font = '500 10px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(Math.round(values[i]), x + barWidth / 2, y - 6);
        }

        // Label at bottom
        ctx.fillStyle = textColorBottom;
        ctx.font = '500 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth / 2, h - 8);
      });

      if (progress < 1) requestAnimationFrame(animate);
    }
    animate();
  }

  function drawLineChart(canvasId, labels, values, color = '#5b8cf7') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '200px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = 200;
    const padding = { top: 20, right: 15, bottom: 35, left: 15 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const max = Math.max(...values, 1) * 1.1;
    const stepX = chartW / Math.max(labels.length - 1, 1);

    const isLight = document.body.getAttribute('data-theme') === 'light';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    const textColorBottom = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Area fill
    const points = values.map((v, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - (v / max) * chartH
    }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, color + '05');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots + Labels
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Label
      ctx.fillStyle = textColorBottom;
      ctx.font = '500 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], p.x, h - 8);
    });
  }

  function drawProgressRing(elementId, percentage, color = '#3ecf8e', size = 80) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const radius = (size / 2) - 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    el.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none"
          stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none"
          stroke="${color}" stroke-width="5" stroke-linecap="round"
          stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
          class="progress-ring-circle"
          style="--ring-circumference: ${circumference}; --ring-offset: ${offset};
                 transform: rotate(-90deg); transform-origin: center;
                 transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);">
          <animate attributeName="stroke-dashoffset" from="${circumference}" to="${offset}" dur="1s"
            fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
        </circle>
      </svg>`;
  }

  return { drawBarChart, drawLineChart, drawProgressRing };
})();
