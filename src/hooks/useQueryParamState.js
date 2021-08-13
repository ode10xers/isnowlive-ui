import { useCallback, useState } from 'react';

// NOTE: Adapted from https://medium.com/swlh/using-react-hooks-to-sync-your-component-state-with-the-url-query-string-81ccdfcb174f

const setQueryStringWithoutPageReload = (qsValue) => {
  const newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + qsValue;

  window.history.pushState({ path: newurl }, '', newurl);
};

const setQueryStringValue = (key, value, queryString = window.location.search) => {
  const values = new URLSearchParams(queryString.slice(1));

  if (value === null || value === undefined) {
    values.delete(key);
  } else {
    values.set(key, value);
  }

  setQueryStringWithoutPageReload(`?${values.toString()}`);
};

export const getQueryStringValue = (key, queryString = window.location.search) =>
  new URLSearchParams(queryString.slice(1)).get(key);

const useQueryParamState = (key, initialValue) => {
  const [value, setValue] = useState(getQueryStringValue(key) || initialValue);
  const onSetValue = useCallback(
    (newValue) => {
      setValue(newValue);
      setQueryStringValue(key, newValue);
    },
    [key]
  );

  return [value, onSetValue];
};

export default useQueryParamState;
