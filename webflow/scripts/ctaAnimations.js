let containers = document.getElementsByClassName('cta-animate-container');
[...containers].forEach((container) => {

  let ctaButton = container.lastElementChild;

  // Create text input with style hidden
  let emailInput = document.createElement('input');
  emailInput.setAttribute('type', 'email');
  emailInput.setAttribute('placeholder', 'Enter your email');
  emailInput.style.visibility = 'hidden';
  emailInput.style.opacity = 0;
  emailInput.style.display = 'block';
  emailInput.style.width = '0px';
  emailInput.style.height = '0px';
  emailInput.style.border = 0;
  emailInput.style.padding = 0;
  
  if (window.outerWidth > 480) {        
    emailInput.style.transition = 'width 0.6s ease 0s';
  } else {
    emailInput.style.transition = 'height 0.6s ease 0s';
  }

  function showEmailInput() {
    if (emailInput.style.visibility !== 'visible') {

      emailInput.style.height = '41px';
      emailInput.style.marginTop = '11px';
      emailInput.style.paddingRight = '50px';
      emailInput.style.paddingLeft = '10px';
      emailInput.style.border = '1px solid black';
      emailInput.style.borderRadius = '4px';
      emailInput.style.visibility = 'visible';
      emailInput.style.opacity = 1;

      if (window.outerWidth > 480) {        
        emailInput.style.width = '280px';
        ctaButton.style.marginLeft = '-35px';
      } else {
        container.style.flexDirection = 'column'
        emailInput.style.width = '100%';
      }
    }
  }

  container.prepend(emailInput);

  ctaButton.addEventListener('mouseover', showEmailInput);
  window.addEventListener('scroll', () => {
    if (container.getBoundingClientRect().top < (window.outerWidth > 480 ? 500 : 300)) {
      showEmailInput();
    }
  });

  // Insert it in the container with style flex and two childs text input and button
  // Attach scroll event to button to show input
})