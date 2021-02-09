let waitListBtn = document.querySelector("[data-waitlist-cta='true']");
let alternateWaitlistCtas = document.querySelectorAll("[data-waitlist-cta-alternate='true']");
let emailInput = document.createElement('input');
let emailValidationMsg = document.createElement('p');

let parentContainer = null;

alternateWaitlistCtas.forEach((cta) => {
  cta.addEventListener('click', function () {
    let el = waitListBtn.parentElement;
    el.scrollIntoView({ behavior: 'smooth' });
  });
});

function addEmailInput() {
  emailInput.setAttribute('type', 'email');
  emailInput.setAttribute('placeholder', 'Enter your email');
  emailInput.style.visibility = 'hidden';
  emailInput.style.opacity = 0;
  emailInput.style.display = 'block';
  emailInput.style.width = '0px';
  emailInput.style.height = '0px';
  emailInput.style.border = 0;
  emailInput.style.padding = 0;
  emailInput.style.transition = 'width 0.4s ease-in-out 0s';

  emailValidationMsg.style.color = 'red';

  parentContainer = waitListBtn.parentElement;
  parentContainer.prepend(emailInput);
  parentContainer.insertAdjacentElement('afterend', emailValidationMsg);

  window.addEventListener('scroll', function () {
    if (window.scrollY > emailInput.offsetTop - 100) {
      showEmailInput();
    }
  });
}

function copyToClipboard(element) {
  if (document.selection) {
    let range = document.body.createTextRange();
    range.moveToElementText(element);
    range.select().createTextRange();
    document.execCommand('copy');
    return true;
  } else if (window.getSelection) {
    let range = document.createRange();
    range.selectNode(element);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    return true;
  }
  return false;
}

function createSuccessDialog(response) {
  let successContainer = document.createElement('div');
  let SC_MSG = document.createElement('p');

  let SC_INFO = document.createElement('p');
  SC_INFO.innerText = 'Want earlier access? Jump ahead 5 spots for every person you refer.';

  let SC_REF_LINK = document.createElement('a');
  SC_REF_LINK.href = response.referral_link;
  SC_REF_LINK.innerText = response.referral_link;

  let SC_BTN = document.createElement('button');
  SC_BTN.textContent = 'Copy Invite Link';
  SC_BTN.classList.add('cta-1-blue', 'w-button');

  successContainer.append(SC_MSG, SC_INFO, SC_REF_LINK, SC_BTN);

  parentContainer = waitListBtn.parentElement;

  parentContainer.insertAdjacentElement('afterend', successContainer);

  successContainer.style.display = 'flex';
  successContainer.style.flexDirection = 'column';
  successContainer.style.justifyContent = 'center';
  successContainer.style.alignItems = 'center';
  successContainer.style.border = '2px solid black';
  successContainer.style.borderRadius = '6px';
  successContainer.style.padding = '15px';
  successContainer.style.background = 'white';
  successContainer.style.width = '300px';
  SC_MSG.innerText = `You're ${response.current_priority} of ${response.total_waiters_currently} in line`;
  SC_MSG.style.fontSize = '24px';
  SC_MSG.style.fontWeight = '700';

  SC_BTN.addEventListener('click', function () {
    let copied = copyToClipboard(SC_REF_LINK);
    if (copied) {
      SC_BTN.textContent = 'Copied!!!';
    }
  });

  parentContainer.style.display = 'none';
  emailValidationMsg.style.display = 'none';
}

function showEmailInput() {
  emailInput.style.height = '41px';
  emailInput.style.marginTop = '11px';
  emailInput.style.paddingRight = '50px';
  emailInput.style.paddingLeft = '10px';
  emailInput.style.border = '1px solid black';
  emailInput.style.borderRadius = '4px';
  emailInput.style.visibility = 'visible';
  emailInput.style.opacity = 1;

  if (window.outerWidth > 480) {
    emailInput.style.width = '350px';
  } else {
    emailInput.style.width = '220px';
  }

  waitListBtn.style.marginLeft = '-35px';
}

function addHoverEventToEarlyAccessBtn() {
  waitListBtn.addEventListener('mouseover', showEmailInput);
}

function addClickEventToEarlyAccessBtn() {
  waitListBtn.addEventListener('click', function () {
    if (emailInput.validity.valid) {
      emailValidationMsg.innerText = '';

      fetch('https://www.getwaitlist.com/waitlist', {
        method: 'post',
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          email: emailInput.value,
          api_key: 'JA5ISW',
          // api_key: 'QADFO7', Testing
          referral_link: document.URL,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          createSuccessDialog(data);
        })
        .catch((error) => {
          console.log('Request failed', error);
        });
    } else {
      emailValidationMsg.innerText = 'Enter correct email Id';
    }
  });
}

if (waitListBtn) {
  addEmailInput();
  addHoverEventToEarlyAccessBtn();
  addClickEventToEarlyAccessBtn();
}
