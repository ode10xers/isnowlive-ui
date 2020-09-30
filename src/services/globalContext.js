import React, { useReducer, useContext, createContext } from 'react';
import Routes from '../routes';
import { getLocalUserDetails } from '../utils/storage';

const Context = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    //TODO : add action types and reduced state here
    case 'SET_USER_DETAILS':
      return {
        ...state,
        userDetails: action.payload.userDetails,
      };
    case 'LOG_IN':
      return {
        ...state,
        userDetails: action.payload.userDetails,
      };
    case 'LOG_OUT':
      return {
        ...state,
        userDetails: null,
      };
    default:
      return state;
  }
};

const GlobalDataProvider = ({ children }) => {
  //TODO : add shared data here
  const initialState = {
    userDeatils: getLocalUserDetails(),
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  function logIn(userDetails, rememberUser) {
    if (rememberUser) {
      localStorage.setItem('user-details', JSON.stringify(userDetails));
    }
    dispatch({ type: 'LOG_IN', payload: { userDetails } });
  }

  function setUserDetails(userDetails) {
    dispatch({ type: 'SET_USER_DETAILS', payload: { userDetails } });
    localStorage.setItem('user-details', JSON.stringify(userDetails));
  }

  function logOut(history) {
    history.push(Routes.login);
    dispatch({ type: 'LOG_OUT' });
    localStorage.removeItem('user-details');
    localStorage.removeItem('session-token');
  }

  const value = {
    state,
    logOut,
    logIn,
    setUserDetails,
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
