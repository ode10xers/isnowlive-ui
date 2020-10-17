import MobileDetect from 'mobile-detect';
const md = new MobileDetect(window.navigator.userAgent);
const isMobileDevice = Boolean(md.mobile());
export default isMobileDevice;
