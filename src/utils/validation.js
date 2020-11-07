const validationRules = {
  nameValidation: [{ required: true, message: 'Please input name' }],
  publicUrlValidation: [
    { required: true, message: 'Please input public URL' },
    {
      pattern: new RegExp('^[a-zA-Z]*$'),
      message: 'field does not accept numbers and special characters',
    },
  ],
  emailValidation: [{ type: 'email', required: true, message: 'Please input your email' }],
  passwordValidation: [{ required: true, message: 'Please input your password' }],
  requiredValidation: [{ required: true, message: 'This field is required.' }],
};

export default validationRules;
