(function () {
  'use strict';

  const container = document.getElementById('game-container');
  if (!container) return;

  function apply() {
    const vv = window.visualViewport;
    if (vv) {
      container.style.top = vv.offsetTop + 'px';
      container.style.left = vv.offsetLeft + 'px';
      container.style.width = vv.width + 'px';
      container.style.height = vv.height + 'px';
    } else {
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100dvh';
    }
  }

  apply();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', apply);
    window.visualViewport.addEventListener('scroll', apply);
  }
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => setTimeout(apply, 150));
})();
