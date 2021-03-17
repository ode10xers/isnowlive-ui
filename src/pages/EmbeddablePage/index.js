import React from 'react';

import CalendarSessions from '../../components/EmbeddableComponents/CalendarSessions';
import parseQueryString from 'utils/parseQueryString';

export default function EmbeddablePage() {
  const location = window.location;
  const { widgetType } = parseQueryString(location.search);

  console.log('widgetType', widgetType);

  let componentToLoad = null;
  if (widgetType === 'calendar') {
    componentToLoad = <CalendarSessions />;
  }

  return <>{componentToLoad}</>;
}
