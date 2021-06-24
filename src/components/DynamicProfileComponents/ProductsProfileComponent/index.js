import React from 'react';

import { Route, Switch, useRouteMatch } from 'react-router-dom';

const ProductsProfileComponent = ({ identifier = null, isEditing, updateConfigHandler, ...customComponentProps }) => {
  // TODO: Implement the edit

  const match = useRouteMatch();

  console.log(match);

  return <div></div>;
};

export default ProductsProfileComponent;
