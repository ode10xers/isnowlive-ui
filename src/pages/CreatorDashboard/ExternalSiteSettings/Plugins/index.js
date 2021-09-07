import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import ReactHtmlParser from 'react-html-parser';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { TwitterPicker } from 'react-color';

import { Row, Col, Select, Typography, Button, Tooltip, Space, Form, Input } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import { copyToClipboard, generateWidgetCSSVarsFromJSON } from 'utils/helper';
import { generateWidgetLink, widgetComponentsName } from 'utils/widgets';
import validationRules from 'utils/validation';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;

const colorPickerChoices = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#1890ff',
  '#009688',
  '#4caf50',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
  '#9ae2b6',
  '#bf6d11',
  '#f379b2',
  '#34727c',
  '#5030fd',
];

const passionDefaultBlue = '#1890ff';

const Plugins = () => {
  const [form] = Form.useForm();
  const [widgetLink, setWidgetLink] = useState('');
  const [selectedWidget, setSelectedWidget] = useState(widgetComponentsName['CALENDAR'].value);

  const [previewColor, setPreviewColor] = useState(passionDefaultBlue);
  const [widgetStyling, setWidgetStyling] = useState(null);

  const generateWidgetText = useCallback(() => {
    const widgetId = `passion-${selectedWidget}-widget`;
    let iframeOnloadHandler = '';

    if (widgetStyling) {
      iframeOnloadHandler = `onload="(function(){document.getElementById('${widgetId}').contentWindow.postMessage({ command : 'add-custom-styling', data : '${widgetStyling}' }, '*')})() "`;
    }

    return `<iframe ${iframeOnloadHandler}id="${widgetId}" title="Passion.do Plugin Container" src="${widgetLink}" width="100%" height="700px" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; payment;" allowpaymentrequest="true" allowfullscreen="true" allowtransparency="true" style="border-width: 0;"> </iframe>`;
  }, [widgetLink, selectedWidget, widgetStyling]);

  // TODO: Fix this implementation for plugin variations, very hacky
  useEffect(() => {
    let queryParamData = {
      isWidget: true,
      widgetType: selectedWidget,
    };

    if (selectedWidget.startsWith('inventory-list-')) {
      queryParamData = { ...queryParamData, widgetType: widgetComponentsName['INVENTORIES'].value };

      if (selectedWidget.includes('image')) {
        queryParamData = { ...queryParamData, showImage: true };
      }

      if (selectedWidget.includes('desc')) {
        queryParamData = { ...queryParamData, showDesc: true };
      }
    }

    const generatedWidgetLink = generateWidgetLink(queryParamData);
    setWidgetLink(generatedWidgetLink);
    setWidgetStyling(null);
  }, [selectedWidget]);

  const handleSelectWidgetComponentChange = (val) => setSelectedWidget(val);

  const copyWidgetSnippet = () => copyToClipboard(generateWidgetText());

  const stylingOptionsForWidget = useMemo(() => {
    const widgetOption = Object.entries(widgetComponentsName).find(([key, val]) => val.value === selectedWidget);

    if (widgetOption) {
      return widgetOption[1].styling;
    }

    return [];
  }, [selectedWidget]);

  const handleColorChange = (color) => {
    setPreviewColor(color.hex || passionDefaultBlue);
  };

  const handleStylingFinished = (values) => {
    setWidgetStyling(generateWidgetCSSVarsFromJSON(values));
  };

  const renderPluginOptions = () => {
    const groupedByProductPlugins = Object.values(widgetComponentsName).reduce(
      (acc, val) => ({
        ...acc,
        [val.product]: {
          groupLabel: val.product,
          data: [...(acc[val.product]?.data ?? []), val],
        },
      }),
      {}
    );

    return Object.values(groupedByProductPlugins).map((pluginData) => (
      <Select.OptGroup
        label={<Text className={styles.optionSeparatorText}>{pluginData.groupLabel}</Text>}
        key={pluginData.groupLabel}
      >
        {pluginData.data.map((pluginOptions) => (
          <Select.Option key={pluginOptions.value} value={pluginOptions.value}>
            {pluginOptions.label}
          </Select.Option>
        ))}
      </Select.OptGroup>
    ));
  };

  return (
    <div className={styles.box}>
      <Row gutter={[20, 16]}>
        <Col xs={24} md={12} lg={14}>
          <Row gutter={[20, 16]}>
            <Col xs={24}>
              <Title level={4}> Add plugins to your website </Title>
            </Col>
            <Col xs={24}>
              <Row gutter={[8, 16]}>
                <Col xs={24}>
                  <Paragraph>Select a plugin that you want to embed below.</Paragraph>
                </Col>
                <Col xs={24}>
                  <Row gutter={[10, 10]} align="baseline">
                    <Col flex="0 1 auto">
                      <Text strong> Select Plugin </Text>
                    </Col>
                    <Col flex="1 0 auto">
                      <Select
                        size="small"
                        className={styles.widgetSelect}
                        placeholder="Select page to show"
                        value={selectedWidget}
                        onChange={handleSelectWidgetComponentChange}
                      >
                        {renderPluginOptions()}
                      </Select>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24}>
                  <Paragraph>You can copy the code snippet below to where you want to show the plugin</Paragraph>
                </Col>
                <Col xs={24}>
                  <div className={styles.codeSnippetContainer}>
                    <SyntaxHighlighter
                      wrapLongLines={true}
                      language="htmlbars"
                      style={atomOneLight}
                      className={styles.codeSnippet}
                    >
                      {generateWidgetText()}
                    </SyntaxHighlighter>
                    <div className={styles.copySnippetBtnContainer}>
                      <Tooltip title="Copy code snippet" trigger="hover">
                        <Button ghost type="primary" onClick={() => copyWidgetSnippet()} icon={<CopyOutlined />} />
                      </Tooltip>
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
        {stylingOptionsForWidget.length > 0 && (
          <Col xs={24} md={12} lg={10}>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Title level={5}>Customize the look of your plugin:</Title>
              </Col>
              <Col xs={24}>
                <Space direction="vertical">
                  <Paragraph>
                    {' '}
                    You can use this color picker to check the colors. Empty fields use the default colors{' '}
                  </Paragraph>
                  <div style={{ borderColor: previewColor, borderWidth: 2, borderStyle: 'solid' }}>
                    <TwitterPicker
                      className={styles.colorPicker}
                      color={previewColor}
                      onChangeComplete={handleColorChange}
                      triangle="hide"
                      colors={colorPickerChoices}
                    />
                  </div>
                </Space>
              </Col>
              <Col xs={24}>
                <Form layout="vertical" form={form} onFinish={handleStylingFinished}>
                  <Row gutter={[12, 12]}>
                    {stylingOptionsForWidget.map((options) => (
                      <Col xs={24} md={12} key={options.key}>
                        <Form.Item
                          name={options.key}
                          id={options.key}
                          label={options.label}
                          rules={validationRules.hexColorValidation()}
                        >
                          <Input placeholder="Put the hex code of the color" prefix={<Text strong> # </Text>} />
                        </Form.Item>
                      </Col>
                    ))}
                    <Col xs={24}>
                      <Row justify="end">
                        <Col>
                          <Button type="primary" htmlType="submit">
                            Submit
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Form>
              </Col>
            </Row>
          </Col>
        )}
        <Col xs={24}>
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Text strong> Preview </Text>
            </Col>
            <Col xs={24}>
              <div dangerouslySetInnerHTML={{ __html: generateWidgetText() }}></div>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Plugins;
