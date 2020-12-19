const parseQueryString = (locationSearch) => {
  return (locationSearch.match(/([^?=&]+)(=([^&]*))?/g) || []).reduce((result, each) => {
    const [key, value] = each.split('=');
    return {
      ...result,
      [key]: decodeURIComponent(value),
    };
  }, {});
};

export default parseQueryString;
