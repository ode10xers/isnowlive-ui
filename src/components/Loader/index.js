import React from 'react';
import { Spin } from 'antd';

const Loader = ({ children, loading, size = null, text }) => {
  return loading ? (
    <Spin size={size} tip={text}>
      {children}
    </Spin>
  ) : (
    <>{children}</>
  );
};

export default Loader;
