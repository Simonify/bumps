let LOADING = null;

const onReady = () => {
  for (let i = 0; i < LOADING.length; i++) {
    LOADING[i].resolve(window.YT);
  }

  LOADING = null;
};

const onError = (err) => {
  for (let i = 0; i < LOADING.length; i++) {
    LOADING[i].reject(err);
  }

  LOADING = null;
};

export default function Youtube() {
  return new Promise((resolve, reject) => {
    if (typeof window.YT === 'object') {
      return resolve(window.YT);
    }

    if (LOADING) {
      LOADING.push({ resolve, reject });
    } else {
      LOADING = [{ resolve, reject }];
      const existing = window.document.getElementById('youtube-iframe-api');

      if (existing) {
        existing.parentNode.removeChild(existing);
      }

      window.onYouTubeIframeAPIReady = onReady;

      const script = window.document.createElement('script');
      const parent = window.document.getElementsByTagName('head')[0];
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.type = 'text/javascript';
      script.onerror = onError;
      parent.appendChild(script);
    }
  });
}
