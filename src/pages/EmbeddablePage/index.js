import React from 'react';

import CalendarSessions from '../../components/EmbeddableComponents/CalendarSessions';
import Dashboard from '../../components/EmbeddableComponents/Dashboard';
import parseQueryString from 'utils/parseQueryString';

export default function EmbeddablePage() {
  const location = window.location;
  const { widgetType, authCode } = parseQueryString(location.search);

  let componentToLoad = null;
  if (widgetType === 'calendar') {
    componentToLoad = <CalendarSessions />;
  } else if (widgetType === 'dashboard') {
    if (authCode) {
      componentToLoad = <Dashboard token={authCode}/>;
    } else {
      return <p>Show Login Page as the token is not found</p>;
    }
  }

  return <div style={{ padding: '20px' }}>{componentToLoad}</div>;
}
