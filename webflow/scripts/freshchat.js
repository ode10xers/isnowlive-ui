function initFreshChat() {
  window.fcWidget.init({
    token: 'a30f40c7-e40a-4a1f-ade9-c66ee65c372d',
    host: 'https://wchat.in.freshchat.com',
    tags: ['creator'],
  });

  window.fcWidget.on('widget:opened', function (resp) {
    pushGTMEvent('talk_to_us');
  });
}
function initialize(i, t) {
  var e;
  i.getElementById(t)
    ? initFreshChat()
    : (((e = i.createElement('script')).id = t),
      (e.async = !0),
      (e.src = 'https://wchat.in.freshchat.com/js/widget.js'),
      (e.onload = initFreshChat),
      i.head.appendChild(e));
}
function initiateCall() {
  initialize(document, 'freshchat-js-sdk');
}
window.addEventListener
  ? window.addEventListener('load', initiateCall, !1)
  : window.attachEvent('load', initiateCall, !1);
