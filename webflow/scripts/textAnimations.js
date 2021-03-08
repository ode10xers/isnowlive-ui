let swipeTextEl = document.querySelector("[data-swipe-text='true']");
let swipeTextArtistsEl = document.querySelector("[data-swipe-text-artists='true']");

const swipeTextArray = ['events', 'Session', 'Classes', 'Workshop', 'Tutorial', 'Stream', 'Shows', 'Consultation'];
const artistsArray = [
  'creators',
  'Entrepreneurs',
  'Tutors',
  'Trainers',
  'Chefs',
  'Artists',
  'Experts',
  'Yoga Instructor',
  'Musicians',
  'Solopreneurs',
];

const counter = {
  swipeTextEl: 1,
  swipeTextArtistsEl: 1,
};

function swipeText(element, textArray, interval, counterName) {
  setInterval(() => {
    if (counter[counterName] === textArray.length) {
      counter[counterName] = 0;
    }
    element.innerText = textArray[counter[counterName]];
    counter[counterName]++;
  }, interval);
}

if (swipeTextEl) {
  swipeText(swipeTextEl, swipeTextArray, 1500, 'swipeTextEl');
}

if (swipeTextArtistsEl) {
  swipeText(swipeTextArtistsEl, artistsArray, 1500, 'swipeTextArtistsEl');
}
