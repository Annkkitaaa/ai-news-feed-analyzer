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