import React, { useState, useEffect, useCallback } from 'react';

import { ChromePicker } from 'react-color';

import { Input, Tooltip } from 'antd';

import { isValidCSSColor, parseReactColorObject } from 'utils/colors';

import './styles.module.scss';

const CustomColorPicker = ({ initialColor = '#ffffff', colorChangeCallback = () => {} }) => {
  const [colorValue, setColorValue] = useState(initialColor);
  const [finalColor, setFinalColor] = useState(null);

  useEffect(() => {
    if (finalColor) {
      colorChangeCallback(finalColor);
    }
  }, [colorChangeCallback, finalColor]);

  const handleColorChange = useCallback((color, event) => {
    const parsedColorString = parseReactColorObject(color, 'rgba');
    if (isValidCSSColor(parsedColorString)) {
      setFinalColor(parsedColorString);
    }
  }, []);

  const colorPickerElement = (
    <ChromePicker
      color={colorValue}
      onChange={(color, value) => setColorValue(parseReactColorObject(color, 'rgba'))}
      onChangeComplete={handleColorChange}
    />
  );

  return (
    <div>
      <Tooltip
        trigger="click"
        color="white"
        arrowPointAtCenter={true}
        title={colorPickerElement}
        overlayInnerStyle={{ padding: 0 }}
      >
        <Input
          type="text"
          className="color-picker-input"
          value={colorValue}
          readOnly={true}
          maxLength={30}
          suffix={<div className="color-representation" style={{ backgroundColor: colorValue }} />}
        />
      </Tooltip>
    </div>
  );
};

export default CustomColorPicker;
