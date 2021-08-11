let apiLoaderOverlay = document.createElement('div');

function insertLoader() {
  // Loader
  let apiLoader = document.createElement('div');
  apiLoader.classList.add('api-loader');
  apiLoader.innerText = 'Loading...';

  apiLoaderOverlay.classList.add('api-loader-overlay');
  apiLoaderOverlay.style.display = 'none';

  apiLoaderOverlay.appendChild(apiLoader);
  document.body.appendChild(apiLoaderOverlay);
}

function showApiLoader() {
  apiLoaderOverlay.style.display = 'flex';
}
function hideApiLoader() {
  apiLoaderOverlay.style.display = 'none';
}

function closeModal(e) {
  document.getElementById(e.target.id.replace('-button', '-close')).click();
}

const isProd = window.location.hostname.includes('passion.do');
const apiBaseUrl = isProd ? 'https://api.app.passion.do' : 'https://stage.api.app.is-now.live';
const successCodes = [200, 201, 204];

const mixpanelLoginEvent = '(Marketing) Creator Login';
const mixpanelSignupEvent = '(Marketing) Creator Signup';

function getJSONFromForm(e) {
  const formData = new FormData(document.getElementById(e.target.id.replace('-button', '')));
  const arrayFormData = Array.from(formData);
  let payload = {};
  arrayFormData.forEach(([key, val]) => {
    payload[key] = val;
  });
  return payload;
}

function mixpanelSuccessEvent(eventTag, eventData = {}) {
  if (mixpanel) {
    mixpanel.track(eventTag, {
      result: 'SUCCESS',
      error_code: 'N/A',
      error_message: 'N/A',
      ...eventData,
    });
  }
}

function mixpanelFailedEvent(eventTag, error, eventData = {}) {
  if (mixpanel) {
    mixpanel.track(eventTag, {
      result: 'FAILED',
      error,
      ...eventData,
    });
  }
}

async function sendPostRequest(apiPath, payload) {
  try {
    const response = await fetch(`${apiBaseUrl}${apiPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ...(await response.json()), status: response.status };
  } catch (error) {
    return error;
  }
}

async function handleSignUpCreator(payload, ctaText) {
  showApiLoader();
  const response = await sendPostRequest('/user', payload);

  if (successCodes.includes(response.status)) {
    pushGTMEvent('creator_signup', {
      creator_email: response.email,
      is_creator: true,
      signup_cta_text: ctaText || 'NA',
    });
    mixpanelSuccessEvent(mixpanelSignupEvent, { ...response, ctaText });
    setAuthToken(response, true);
  } else {
    hideApiLoader();
    showErrorMessage();
    mixpanelFailedEvent(mixpanelSignupEvent, response);
  }
}

async function handleLoginCreator(e) {
  const payload = getJSONFromForm(e);
  const response = await sendPostRequest('/auth/login', payload);
  if (successCodes.includes(response.status)) {
    setAuthToken(response);
  } else {
    showErrorMessage();
    mixpanelFailedEvent(mixpanelLoginEvent, response);
  }
}

function setAuthToken(userData, isSignup = false) {
  if (!userData) return;

  pushGTMEvent('creator_login', {
    creator_external_id: userData.external_id,
    creator_email: userData.email,
    creator_email_verified: userData.email_verified,
    is_creator: userData.is_creator,
    creator_first_name: userData.first_name,
    creator_last_name: userData.last_name,
    creator_username: userData.username || 'NA',
    creator_profile_complete: userData.profile_complete,
    creator_payment_account_status: userData.profile?.payment_account_status || 'NA',
    creator_payment_currency: userData.profile?.currency || 'NA',
    creator_zoom_connected: userData.profile?.zoom_connected || 'NA',
  });

  mixpanelSuccessEvent(mixpanelLoginEvent, userData);

  let targetUrl = '';

  if (userData.profile && userData.profile.custom_domain) {
    targetUrl = `https://${userData.profile.custom_domain}/creator/${
      isSignup ? 'profile' : 'dashboard'
    }?signupAuthToken=${userData.auth_token}`;
  } else {
    targetUrl = `https://${isSignup ? 'app' : userData.username || 'app'}${isProd ? '' : '.stage'}.passion.do/creator/${
      isSignup ? 'profile' : 'dashboard'
    }?signupAuthToken=${userData.auth_token}`;
  }

  targetUrl = GAURLDecorator(targetUrl);
  window.location.href = targetUrl;
}

function getElementsAndAttachEvent(query, eventName, eventHandler) {
  document.querySelectorAll(query).forEach((el) => {
    el.addEventListener(eventName, eventHandler);
  });
}

function initFormClickHandler() {
  getElementsAndAttachEvent('[signup-creator-handler-btn=true]', 'click', (e) => {
    e.preventDefault();

    const payload = { ...getJSONFromForm(e), is_creator: true };

    const referralCode = localStorage.getItem('passion_creator_referral');

    if (referralCode) payload = { ...payload, referrer: referralCode };

    const emailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (payload.email.match(emailformat)) {
      handleSignUpCreator(payload, e.innerText);
    } else {
      showErrorMessage('Invalid Email', 'Enter correct email id');
    }
  });
  getElementsAndAttachEvent('[login-creator-handler-btn=true]', 'click', handleLoginCreator);

  document.getElementById('login-modal-form').onsubmit = (e) => {
    e.preventDefault();
    document.getElementById('login-modal-form-button').click();
    return false;
  };
}

document.addEventListener('DOMContentLoaded', (e) => {
  initFormClickHandler();
  insertLoader();
});
