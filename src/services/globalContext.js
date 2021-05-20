import React, { useReducer, useContext, createContext } from 'react';
import Routes from 'routes';
// import { getCookieConsentValue } from 'react-cookie-consent';

import { getLocalUserDetails } from 'utils/storage';

import http from 'services/http';
import { setAuthCookie, deleteAuthCookie } from 'services/authCookie';
import { setAuthTokenInLS } from 'services/localAuthToken';
import { resetMixPanel } from 'services/integrations/mixpanel';
import { trackUserLoginInGTM, clearGTMUserAttributes } from 'services/integrations/googleTagManager';
import { mapUserToPendo } from 'services/integrations/pendo';

const Context = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    //TODO : add action types and reduced state here
    case 'SET_USER_DETAILS':
      return {
        ...state,
        userDetails: action.payload.userDetails,
      };
    case 'SET_USER_AUTHENTICATED':
      return {
        ...state,
        userAuthenticated: action.payload,
      };
    case 'LOG_IN':
      return {
        ...state,
        userDetails: action.payload.userDetails,
        userAuthenticated: true,
      };
    case 'LOG_OUT':
      return {
        ...state,
        userDetails: null,
        userAuthenticated: false,
      };
    case 'SET_COOKIE_CONSENT':
      return {
        ...state,
        cookieConsent: action.payload,
      };
    case 'SHOW_PAYMENT_POPUP':
      return {
        ...state,
        paymentPopupVisible: true,
        ...action.payload,
      };
    case 'HIDE_PAYMENT_POPUP':
      return {
        ...state,
        paymentPopupVisible: false,
        paymentPopupData: null,
        paymentPopupCallback: () => {},
      };
    case 'SHOW_SEND_EMAIL_POPUP':
      return {
        ...state,
        emailPopupVisible: true,
        emailPopupData: action.payload,
      };
    case 'HIDE_SEND_EMAIL_POPUP':
      return {
        ...state,
        emailPopupVisible: false,
        emailPopupData: {
          recipients: {
            active: [],
            expired: [],
          },
          productId: null,
          productType: null,
        },
      };
    default:
      return state;
  }
};

const GlobalDataProvider = ({ children }) => {
  //TODO : add shared data here
  const initialState = {
    userDetails: getLocalUserDetails(),
    isAuthenticated: false,
    // TODO: Hardcoding it to true for now, since the popup will be disabled
    // cookieConsent: Boolean(getCookieConsentValue()),
    cookieConsent: true,
    paymentPopupVisible: false,
    paymentPopupData: null,
    paymentPopupCallback: () => {},
    emailPopupVisible: false,
    emailPopupData: {
      recipients: {
        active: [],
        expired: [],
      },
      productId: null,
      productType: null,
    },
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  function logIn(userDetails, rememberUser, isIframeMode = false) {
    setUserDetails(userDetails);

    if (rememberUser) {
      localStorage.setItem('remember-user', JSON.stringify(userDetails.email));
    } else {
      localStorage.removeItem('remember-user');
    }
    if (isIframeMode) {
      // Inside iframe cookies are not accessible because of security issues so using local storage
      setAuthTokenInLS(userDetails.auth_token);
    } else {
      setAuthCookie(userDetails.auth_token);
    }
    http.setAuthToken(userDetails.auth_token);

    if (userDetails.is_creator) {
      trackUserLoginInGTM(userDetails);
      mapUserToPendo(userDetails);
    }
    setUserAuthentication(true);
    dispatch({ type: 'LOG_IN', payload: { userDetails } });
  }

  function setUserDetails(userDetails) {
    localStorage.setItem('user-details', JSON.stringify(userDetails));
    dispatch({ type: 'SET_USER_DETAILS', payload: { userDetails } });
  }

  function setUserAuthentication(status) {
    dispatch({ type: 'SET_USER_AUTHENTICATED', payload: status });
  }

  function setCookieConsent(cookieConsent) {
    dispatch({ type: 'SET_COOKIE_CONSENT', payload: cookieConsent });
  }

  function showPaymentPopup(paymentPopupData, paymentPopupCallback) {
    dispatch({ type: 'SHOW_PAYMENT_POPUP', payload: { paymentPopupData, paymentPopupCallback } });
  }

  function hidePaymentPopup() {
    dispatch({ type: 'HIDE_PAYMENT_POPUP' });
  }

  function showSendEmailPopup(emailPopupData) {
    dispatch({ type: 'SHOW_SEND_EMAIL_POPUP', payload: emailPopupData });
  }

  function hideSendEmailPopup() {
    dispatch({ type: 'HIDE_SEND_EMAIL_POPUP' });
  }

  function logOut(history, shouldRedirect = false) {
    if (shouldRedirect) {
      history.push(Routes.login);
    }

    dispatch({ type: 'LOG_OUT' });
    localStorage.removeItem('user-details');
    deleteAuthCookie();
    resetMixPanel();
    clearGTMUserAttributes();
  }

  const value = {
    state,
    logOut,
    logIn,
    setUserDetails,
    setUserAuthentication,
    setCookieConsent,
    showPaymentPopup,
    hidePaymentPopup,
    showSendEmailPopup,
    hideSendEmailPopup,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

function useGlobalContext() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalDataProvider');
  }
  return context;
}

export { GlobalDataProvider, useGlobalContext };
