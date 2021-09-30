import React, { useState, useEffect } from 'react';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

import Config from './textEditorConfig';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './TextEditorStyles.scss';

const TextEditor = ({ name, form, placeholder }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    let fieldValue = null;

    if (typeof name === 'string') {
      fieldValue = form.getFieldValue([name]);
    } else if (Array.isArray(name)) {
      fieldValue = form.getFieldValue(name);
    }

    if (fieldValue) {
      const contentBlock = htmlToDraft(fieldValue);

      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        const editorState = EditorState.createWithContent(contentState);
        setEditorState(editorState);
      }
    }
  }, [form, name]);

  const onEditorStateChange = (state) => {
    setEditorState(state);
  };

  const handleChange = (e) => {
    let text = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    // if (typeof name === 'string') {
    // form.setFieldsValue({ ...form.getFieldsValue(), [name]: text });
    // } else if (Array.isArray(name)) {
    // let newFormData = JSON.parse(JSON.stringify(form.getFieldsValue()));
    // if (newFormData[name[0]]) {
    //   newFormData[name[0]][name[1]] = text;
    // }
    // form.setFieldsValue(newFormData);
    // }
    form.setFields([
      {
        name: name,
        value: text,
      },
    ]);
  };

  return (
    <Editor
      toolbar={Config.toolbar}
      placeholder={placeholder}
      editorState={editorState}
      toolbarClassName="toolbarClassName"
      wrapperClassName="wrapperClassName"
      editorClassName="text-editor"
      onEditorStateChange={onEditorStateChange}
      onChange={handleChange}
    />
  );
};

export default TextEditor;
