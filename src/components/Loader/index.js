import React from 'react';
import { Spin } from 'antd';

const Loader = ({ children, loading, size = null, text }) => {
  return (
    <React.Fragment>
      {loading && (
        <Spin size={size} tip={text}>
          {children}
        </Spin>
      )}
      {!loading && <React.Fragment> {children} </React.Fragment>}
    </React.Fragment>
  );
};

export default Loader;
