const validationRules = {
  nameValidation: [{ required: true, message: 'Please input your name' }],
  publicUrlValidation: [{ required: true, message: 'Please input public URL' }],
  emailValidation: [{ type: 'email', required: true, message: 'Please input your email' }],
  passwordValidation: [{ required: true, message: 'Please input your password' }],
};

export default validationRules;
