
'use strict';

(() => {
  const landing = document.getElementById('landing-page');
  const studio = document.getElementById('studio-shell');

  const openButtons = [
    document.getElementById('hero-open-studio'),
    document.getElementById('nav-open-studio'),
    document.getElementById('bottom-open-studio')
  ].filter(Boolean);

  const backButton =
    document.getElementById('btn-back-home');

  function openStudio() {
    landing.hidden = true;
    studio.hidden = false;

    window.dispatchEvent(
      new CustomEvent('pulsestage:open-command-center')
    );

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }

  function returnHome() {
    // Stop camera capture before leaving the application.
    const stop = document.getElementById('btn-stop');

    if (stop && !stop.disabled) {
      stop.click();
    }

    studio.hidden = true;
    landing.hidden = false;

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }

  openButtons.forEach(button => {
    button.addEventListener('click', openStudio);
  });

  if (backButton) {
    backButton.addEventListener('click', returnHome);
  }
})();
