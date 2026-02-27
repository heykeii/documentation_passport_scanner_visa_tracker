import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    setPasswordStrength(strength)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.terms) newErrors.terms = 'You must agree to the terms and conditions'
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target
    const newValue = type === 'checkbox' ? checked : value
    setFormData({ ...formData, [name]: newValue })
    
    if (name === 'password') calculatePasswordStrength(value)
    if (errors[name]) setErrors({ ...errors, [name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      setTimeout(() => {
        alert(`Welcome ${formData.firstName}! Your account has been created.`)
        setIsLoading(false)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          terms: false,
        })
        setPasswordStrength(0)
      }, 1500)
    } else {
      setErrors(newErrors)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength <= 2) return 'bg-orange-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return ''
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 2) return 'Fair'
    if (passwordStrength <= 3) return 'Good'
    return 'Strong'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 via-white to-orange-100 px-4 py-8">
      {/* Animated blur elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-orange-100">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold bg-linear-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Join Travelly and explore the world with us.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold text-gray-700">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`h-10 text-sm border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                    errors.firstName ? 'border-red-500 ring-1 ring-red-500' : ''
                  }`}
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold text-gray-700">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`h-10 text-sm border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                    errors.lastName ? 'border-red-500 ring-1 ring-red-500' : ''
                  }`}
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`h-10 text-sm border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                  errors.email ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`h-10 text-sm border-gray-200 pr-10 focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                    errors.password ? 'border-red-500 ring-1 ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-orange-600 transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.5-9-7.5a9.77 9.77 0 012.1-4.6m2.1-2.1A9.77 9.77 0 0112 4c5 0 9 3.5 9 7.5a9.77 9.77 0 01-2.1 4.6m-2.1 2.1A9.77 9.77 0 0112 19c-1.02 0-2.01-.13-2.925-.375M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.5 0c0 4-4 7.5-9 7.5S3 16 3 12s4-7.5 9-7.5 9 3.5 9 7.5z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full w-1/5 transition-all ${getPasswordStrengthColor()}`} style={{ width: `${passwordStrength * 20}%` }}></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{getPasswordStrengthText()}</span>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`h-10 text-sm border-gray-200 pr-10 focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-orange-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.5-9-7.5a9.77 9.77 0 012.1-4.6m2.1-2.1A9.77 9.77 0 0112 4c5 0 9 3.5 9 7.5a9.77 9.77 0 01-2.1 4.6m-2.1 2.1A9.77 9.77 0 0112 19c-1.02 0-2.01-.13-2.925-.375M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.5 0c0 4-4 7.5-9 7.5S3 16 3 12s4-7.5 9-7.5 9 3.5 9 7.5z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2 pt-1">
              <Checkbox
                id="terms"
                name="terms"
                checked={formData.terms}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, terms: checked })
                  if (errors.terms) setErrors({ ...errors, terms: '' })
                }}
                className="border-gray-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 mt-1"
              />
              <Label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer font-normal leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-orange-600 hover:underline font-semibold">
                  terms and conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-orange-600 hover:underline font-semibold">
                  privacy policy
                </a>
              </Label>
            </div>
            {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium">OR</span>
            <Separator className="flex-1 bg-gray-200" />
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="h-9 border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </Button>
            <Button variant="outline" size="sm" className="h-9 border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Button>
          </div>
        </CardContent>

        <Separator className="bg-gray-200" />

        <CardFooter className="text-center pt-6">
          <p className="text-sm text-gray-600 w-full">
            Already have an account?{' '}
            <a href="/login" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
              Sign in here
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Signup
