(() => {
  const site = document.querySelector('.site');
  const canvas = document.querySelector('#hero-canvas');
  const context = canvas?.getContext('2d');
  const themeButtons = document.querySelectorAll('[data-theme-option]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = 0;
  let animationFrame = 0;
  let mouseX = 0.5;
  let mouseY = 0.45;
  let targetX = 0.5;
  let targetY = 0.45;
  let theme = 'light';

  try {
    const savedTheme = window.localStorage.getItem('keita-appearance');
    if (savedTheme === 'dark' || savedTheme === 'mono') theme = savedTheme;
  } catch {
    // The site still works when browser storage is disabled.
  }

  const setTheme = (nextTheme) => {
    theme = nextTheme;
    site.dataset.theme = theme;
    themeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeOption === theme));
    });
    try {
      window.localStorage.setItem('keita-appearance', theme);
    } catch {
      // Theme changes remain active for the current page.
    }
  };

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => setTheme(button.dataset.themeOption));
  });
  setTheme(theme);

  if (canvas && context) {
    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const pointerMove = (event) => {
      targetX = event.clientX / Math.max(window.innerWidth, 1);
      targetY = event.clientY / Math.max(window.innerHeight, 1);
    };

    const draw = () => {
      frame += reduceMotion ? 0 : 0.004;
      mouseX += (targetX - mouseX) * 0.025;
      mouseY += (targetY - mouseY) * 0.025;
      context.clearRect(0, 0, width, height);

      const rows = Math.max(19, Math.round(height / 23));
      const columns = Math.max(34, Math.round(width / 25));
      const spacingX = width / (columns - 1);
      const spacingY = height / (rows - 1);
      const dark = theme === 'dark';
      const mono = theme === 'mono';
      const teal = dark ? '112, 176, 164' : mono ? '64, 70, 66' : '54, 126, 127';
      const coral = dark ? '210, 126, 103' : mono ? '111, 105, 93' : '190, 104, 80';
      const anchorX = width * (0.49 + (mouseX - 0.5) * 0.12);
      const anchorY = height * (0.48 + (mouseY - 0.5) * 0.08);

      const pointAt = (column, row) => {
        const x = column * spacingX;
        const y = row * spacingY;
        const nx = (x - anchorX) / Math.max(width * 0.53, 1);
        const ny = (y - anchorY) / Math.max(height * 0.62, 1);
        const radial = Math.exp(-(nx * nx * 1.5 + ny * ny * 2.2));
        const ripple = Math.sin(nx * 7.2 + ny * 4.2 + frame) * 0.5
          + Math.cos(ny * 10.5 - nx * 2.8 - frame * 0.7) * 0.5;
        const lift = radial * ripple * Math.min(width, height) * 0.105;
        const twist = radial * Math.sin(ny * 4 + frame * 0.5) * width * 0.018;
        return { x: x + twist, y: y + lift, depth: radial, ripple };
      };

      for (let row = 0; row < rows; row += 1) {
        context.beginPath();
        for (let column = 0; column < columns; column += 1) {
          const point = pointAt(column, row);
          if (column === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
        const focus = Math.exp(-Math.pow((row / rows - 0.48) * 2.1, 2));
        context.strokeStyle = `rgba(${row % 5 === 0 ? coral : teal}, ${0.06 + focus * 0.14})`;
        context.lineWidth = row % 5 === 0 ? 1 : 0.65;
        context.stroke();
      }

      for (let column = 0; column < columns; column += 1) {
        context.beginPath();
        for (let row = 0; row < rows; row += 1) {
          const point = pointAt(column, row);
          if (row === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
        const focus = Math.exp(-Math.pow((column / columns - 0.5) * 2.1, 2));
        context.strokeStyle = `rgba(${column % 7 === 0 ? coral : teal}, ${0.035 + focus * 0.1})`;
        context.lineWidth = column % 7 === 0 ? 0.9 : 0.55;
        context.stroke();
      }

      for (let row = 1; row < rows - 1; row += 2) {
        for (let column = 1; column < columns - 1; column += 2) {
          const point = pointAt(column, row);
          if (point.depth < 0.035) continue;
          context.fillStyle = `rgba(${point.ripple > 0.1 ? coral : teal}, ${0.1 + point.depth * 0.43})`;
          context.beginPath();
          context.arc(point.x, point.y, 0.6 + point.depth * 1.25, 0, Math.PI * 2);
          context.fill();
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', pointerMove, { passive: true });
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(animationFrame), { once: true });
  }

  document.querySelector('#back-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();
