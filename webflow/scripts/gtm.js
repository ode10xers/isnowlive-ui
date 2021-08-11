const isDev = !window.location.hostname.includes('passion.do');
if (isDev) {
  // GTM Snippet for Staging Environment
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src =
      'https://www.googletagmanager.com/gtm.js?id=' +
      i +
      dl +
      '&gtm_auth=xRM0wX8_3LW-aP9qioVE2w&gtm_preview=env-35&gtm_cookies_win=x';
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-W3F8Z3H');
} else {
  // GTM Snippet for Live (PROD) Environment
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src =
      'https://www.googletagmanager.com/gtm.js?id=' +
      i +
      dl +
      '&gtm_auth=DMVjc1CVZqzwYWFdrwPU0g&gtm_preview=env-1&gtm_cookies_win=x';
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-W3F8Z3H');
}

function pushGTMEvent(eName, eData = {}) {
  if (window.dataLayer && window.dataLayer.push) {
    window.dataLayer.push({
      event: eName,
      ...eData,
    });
  }
}

function GAURLDecorator(urlString) {
  const gaCookie = document.cookie.split(';').find((val) => val.startsWith('_ga'));

  if (gaCookie) {
    urlString += (urlString.includes('?') ? '&' : '?') + gaCookie;
  }

  return urlString;
}
