import React from 'react';

import Passes from 'components/EmbeddableComponents/Passes';
import Videos from 'components/EmbeddableComponents/Videos';
import Courses from 'components/EmbeddableComponents/Courses';
import SessionsList from 'components/EmbeddableComponents/SessionsCardsList';
import Subscriptions from 'components/EmbeddableComponents/Subscriptions';
import CalendarSessions from 'components/EmbeddableComponents/CalendarSessions';
import AvailabilitiesPlugin from 'components/EmbeddableComponents/AvailabilitiesPlugin';
import InventoryList from 'components/EmbeddableComponents/InventoryList';

import { localStoragePluginStylingKeyPrefix, widgetComponentsName } from 'utils/widgets';

// TODO: Might want to implement lazy loading here as well
export default function EmbeddablePage({ widget }) {
  let componentToLoad = null;
  if (widget === widgetComponentsName.CALENDAR.value) {
    componentToLoad = <CalendarSessions />;
  } else if (widget === widgetComponentsName.PASSES.value) {
    componentToLoad = <Passes />;
  } else if (widget === widgetComponentsName.VIDEOS.value) {
    componentToLoad = <Videos />;
  } else if (widget === widgetComponentsName.COURSES.value) {
    componentToLoad = <Courses />;
  } else if (widget === widgetComponentsName.MEMBERSHIPS.value) {
    componentToLoad = <Subscriptions />;
  } else if (widget === widgetComponentsName.LIST.value) {
    componentToLoad = <SessionsList />;
  } else if (widget === widgetComponentsName.AVAILABILITY.value) {
    componentToLoad = <AvailabilitiesPlugin />;
  } else if (widget === widgetComponentsName.INVENTORIES.value) {
    componentToLoad = <InventoryList />;
  }

  localStorage.removeItem(`${localStoragePluginStylingKeyPrefix}${widget}`);

  window.addEventListener('message', (e) => {
    const { command, data: customStyles } = e.data;

    if (command && command === 'add-custom-styling') {
      // NOTE : Hack, we save this to LS and do the same thing whenever we need it
      localStorage.setItem(`${localStoragePluginStylingKeyPrefix}${widget}`, customStyles);
      document.head.insertAdjacentHTML('beforeend', `<style>${customStyles}</style>`);
    }
  });

  return <div>{componentToLoad}</div>;
}
