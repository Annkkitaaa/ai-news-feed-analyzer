import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiUser, FiArrowLeft } from 'react-icons/fi';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  
  const initialValues = {
    email: '',
    password: '',
  };
  
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required'),
  });
  
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await login(values.email, values.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-pattern bg-light-300 dark:bg-dark-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-3 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-full h-full">
                  <path d="M12 7.76L4.64 15.11C4.14 15.61 3.25 15.61 2.76 15.11V15.11C2.34 14.7 2.34 14.02 2.76 13.6L11.47 4.89C11.76 4.6 12.24 4.6 12.53 4.89L21.24 13.6C21.66 14.02 21.66 14.7 21.24 15.11V15.11C20.75 15.61 19.86 15.61 19.36 15.11L12 7.76Z" />
                  <path d="M12 12.44L19.04 19.5C19.52 19.97 19.52 20.75 19.04 21.22C18.56 21.69 17.78 21.69 17.3 21.22L12.53 16.43C12.38 16.29 12.15 16.22 11.93 16.22C11.71 16.22 11.49 16.29 11.33 16.43L6.7 21.22C6.22 21.69 5.44 21.69 4.96 21.22C4.48 20.75 4.48 19.97 4.96 19.5L12 12.44Z" />
                </svg>
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
              Sign in to NewsFlow
            </h2>
            <p className="mt-2 text-sm text-light-800 dark:text-light-500">
              Your AI-powered news intelligence platform
            </p>
          </div>
          
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                      Email address
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="input"
                      placeholder="Enter your email"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-light-900 dark:text-light-300">
                        Password
                      </label>
                      <Link to="/forgot-password" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                        Forgot password?
                      </Link>
                    </div>
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="input"
                      placeholder="Enter your password"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-light-500 dark:border-dark-100 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-light-900 dark:text-light-400">
                    Remember me
                  </label>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : 'Sign in'}
                  </button>
                </div>
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-center text-sm p-3 rounded-lg mt-2">
                    {error}
                  </div>
                )}
              </Form>
            )}
          </Formik>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-light-800 dark:text-light-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  
  const initialValues = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  
  const validationSchema = Yup.object({
    first_name: Yup.string()
      .required('First name is required'),
    last_name: Yup.string()
      .required('Last name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });
  
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { confirmPassword, ...userData } = values;
      await register(userData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-pattern bg-light-300 dark:bg-dark-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-3 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-full h-full">
                  <path d="M12 7.76L4.64 15.11C4.14 15.61 3.25 15.61 2.76 15.11V15.11C2.34 14.7 2.34 14.02 2.76 13.6L11.47 4.89C11.76 4.6 12.24 4.6 12.53 4.89L21.24 13.6C21.66 14.02 21.66 14.7 21.24 15.11V15.11C20.75 15.61 19.86 15.61 19.36 15.11L12 7.76Z" />
                  <path d="M12 12.44L19.04 19.5C19.52 19.97 19.52 20.75 19.04 21.22C18.56 21.69 17.78 21.69 17.3 21.22L12.53 16.43C12.38 16.29 12.15 16.22 11.93 16.22C11.71 16.22 11.49 16.29 11.33 16.43L6.7 21.22C6.22 21.69 5.44 21.69 4.96 21.22C4.48 20.75 4.48 19.97 4.96 19.5L12 12.44Z" />
                </svg>
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-light-800 dark:text-light-500">
              Join NewsFlow - Your AI-powered news intelligence platform
            </p>
          </div>
          
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                        First Name
                      </label>
                      <Field
                        id="first_name"
                        name="first_name"
                        type="text"
                        className="input"
                        placeholder="First name"
                      />
                      <ErrorMessage
                        name="first_name"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                        Last Name
                      </label>
                      <Field
                        id="last_name"
                        name="last_name"
                        type="text"
                        className="input"
                        placeholder="Last name"
                      />
                      <ErrorMessage
                        name="last_name"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                      Email address
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="input"
                      placeholder="Enter your email"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                      Password
                    </label>
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      className="input"
                      placeholder="Create a password"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                      Confirm Password
                    </label>
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="input"
                      placeholder="Confirm password"
                    />
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </span>
                    ) : 'Create Account'}
                  </button>
                </div>
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-center text-sm p-3 rounded-lg mt-2">
                    {error}
                  </div>
                )}
              </Form>
            )}
          </Formik>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-light-800 dark:text-light-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, loading, error } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const initialValues = {
    email: '',
  };
  
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
  });
  
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await forgotPassword(values.email);
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-pattern bg-light-300 dark:bg-dark-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex justify-start mb-8">
            <Link
              to="/login"
              className="inline-flex items-center text-light-800 dark:text-light-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <FiArrowLeft className="mr-2" />
              Back to login
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-3 shadow-md">
                <FiMail className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
              Forgot Password
            </h2>
            <p className="mt-2 text-sm text-light-800 dark:text-light-500">
              Enter your email and we'll send you instructions to reset your password
            </p>
          </div>
          
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Check your email</h3>
              <p className="text-light-800 dark:text-light-500 mb-6">
                We've sent password reset instructions to your email address. Please check your inbox.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="primary-button"
              >
                Return to login
              </button>
            </div>
          ) : (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="mt-8 space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                      Email address
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="input"
                      placeholder="Enter your email"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting || loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : 'Send Reset Instructions'}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-center text-sm p-3 rounded-lg mt-2">
                      {error}
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const { resetPassword, loading, error } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);
  
  const initialValues = {
    password: '',
    confirmPassword: '',
  };
  
  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });
  
  const handleSubmit = async (values, { setSubmitting }) => {
    if (!token) {
      toast.error('Reset token is missing');
      return;
    }
    
    try {
      await resetPassword(token, values.password);
      setIsSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-pattern bg-light-300 dark:bg-dark-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex justify-start mb-8">
            <Link
              to="/login"
              className="inline-flex items-center text-light-800 dark:text-light-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <FiArrowLeft className="mr-2" />
              Back to login
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-3 shadow-md">
                <FiLock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-light-800 dark:text-light-500">
              Create a new password for your account
            </p>
          </div>
          
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Password Reset Success</h3>
              <p className="text-light-800 dark:text-light-500 mb-6">
                Your password has been reset successfully.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="primary-button"
              >
                Sign in with new password
              </button>
            </div>
          ) : (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="mt-8 space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                      New Password
                    </label>
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      className="input"
                      placeholder="Create a new password"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                      Confirm New Password
                    </label>
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="input"
                      placeholder="Confirm new password"
                    />
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting || loading || !token}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Resetting Password...
                        </span>
                      ) : 'Reset Password'}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-center text-sm p-3 rounded-lg mt-2">
                      {error}
                    </div>
                  )}
                  
                  {!token && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 text-center text-sm p-3 rounded-lg mt-2">
                      Invalid or missing reset token. Please check your reset link.
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
};