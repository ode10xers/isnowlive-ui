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
function hideApiLoad() {
  apiLoaderOverlay.style.display = 'none';
}

function showErrorSwal(title, msg) {
  Swal.fire({
    title: title || 'An error occured',
    text: msg || 'Something wrong happened',
    icon: 'error',
    confirmButtonText: 'Okay',
  });
}

function closeModal(e) {
  document.getElementById(e.target.id.replace('-button', '-close')).click();
}

const isProd = window.location.hostname.includes('passion.do');
const apiBaseUrl = isProd ? 'https://api.app.passion.do' : 'https://stage.api.app.is-now.live';

const successCodes = [200, 201, 204];

function getJSONFromForm(e) {
  const formData = new FormData(document.getElementById(e.target.id.replace('-button', '')));
  const arrayFormData = Array.from(formData);
  let payload = {};
  arrayFormData.forEach(([key, val]) => {
    payload[key] = val;
  });
  return payload;
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

async function handleSignUpCreator(payload) {
  showApiLoader();
  const response = await sendPostRequest('/user', payload);

  if (successCodes.includes(response.status)) {
    setAuthToken(response, true);
  } else {
    hideApiLoader();
    showErrorSwal();
  }
}

async function handleLoginCreator(e) {
  const response = await sendPostRequest('/auth/login', getJSONFromForm(e));
  console.log(response);
  if (successCodes.includes(response.status)) {
    setAuthToken(response);
  } else {
    showErrorSwal();
  }
}

function setAuthToken(userData, isSignup = false) {
  if (!userData) return;

  if (userData.profile && userData.profile.custom_domain) {
    window.location.href = `https://${userData.profile.custom_domain}/creator/${
      isSignup ? 'profile' : 'dashboard'
    }?signupAuthToken=${userData.auth_token}`;
  } else {
    window.location.href = `https://${isSignup ? 'app' : userData.username || 'app'}${
      isProd ? '' : '.stage'
    }.passion.do/creator/${isSignup ? 'profile' : 'dashboard'}?signupAuthToken=${userData.auth_token}`;
  }
}

function getElementsAndAttachEvent(query, eventName, eventHandler) {
  document.querySelectorAll(query).forEach((el) => {
    el.addEventListener(eventName, eventHandler);
  });
}

function initFormClickHandler() {
  getElementsAndAttachEvent('[signup-creator-handler-btn=true]', 'click', (e) => {
    const payload = { ...getJSONFromForm(e), is_creator: true };

    const emailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (payload.email.match(emailformat)) {
      handleSignUpCreator(payload);
    } else {
      showErrorSwal('Invalid Email', 'Enter correct email id');
    }
  });
  getElementsAndAttachEvent('[login-creator-handler-btn=true]', 'click', handleLoginCreator);

  document.getElementById('login-modal-form').onsubmit = (e) => {
    e.preventDefault();
    document.getElementById('login-modal-form-button').click();
    return false;
  };
}

document.addEventListener('DOMContentLoaded', (event) => {
  initFormClickHandler();
  insertLoader();
});
