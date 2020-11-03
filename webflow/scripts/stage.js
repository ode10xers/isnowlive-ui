function findSelectorAndAttachEvent(selector, eventName, eventCallBack) {
  const element = document.querySelectorAll(selector)[0];
  if (element) {
    element.addEventListener(eventName, eventCallBack);
  }
}

function setRedirectionToSignup() {
  const signupRedirectUrl = 'https://app.stage.passion.do/signup';
  findSelectorAndAttachEvent("[data-signup-link='true']", 'click', function () {
    window.location.href = signupRedirectUrl;
  });
}

function setRedirectionToLogin() {
  const loginRedirectUrl = 'https://app.stage.passion.do/login';
  findSelectorAndAttachEvent("[data-login-link='true']", 'click', function () {
    window.location.href = loginRedirectUrl;
  });
}

setRedirectionToSignup();
setRedirectionToLogin();
