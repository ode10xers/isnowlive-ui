export const getExternalLink = (link = null) => {
  if (link) {
    if (link.includes('//')) {
      return link;
    } else {
      return '//' + link;
    }
  } else {
    return '';
  }
};
