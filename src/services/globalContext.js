import React, { useReducer, useContext, createContext } from 'react';

const Context = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    //TODO : add action types and reduced state here
    default:
      return state;
  }
};

const GlobalDataProvider = ({ children }) => {
  //TODO : add shared data here
  const initialState = {};

  const [state, dispatch] = useReducer(reducer, initialState);

  const logOut = (history) => {
    //TODO: handle logout
  };

  const logIn = (userDetails, rememberUser) => {
    //TODO: handle login
    dispatch({ type: 'LOG_IN', payload: { userDetails } });
  };

  const value = {
    state,
    logOut,
    logIn,
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
