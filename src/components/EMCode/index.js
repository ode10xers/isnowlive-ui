import React, { useRef, useEffect } from 'react';

const EMCode = ({ children }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.children[0].style.width = '100%';
      ref.current.children[0].style['min-width'] = 'auto';
      ref.current.children[0].style['min-height'] = 'auto';
      ref.current.children[0].style['max-width'] = '100%';
    }
  }, [children]);

  return <div ref={ref}>{children}</div>;
};

export default EMCode;
