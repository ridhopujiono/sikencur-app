import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { isStrongPassword, isValidEmail } from '../../utils/validation';

function getFirstErrorMessage(value) {
  if (Array.isArray(value)) return value[0] ?? '';
  if (typeof value === 'string') return value;
  return '';
}

function normalizeFieldErrors(rawErrors) {
  if (!rawErrors || typeof rawErrors !== 'object') {
    return {};
  }

  return Object.entries(rawErrors).reduce((acc, [field, value]) => {
    const message = getFirstErrorMessage(value);
    if (message) {
      acc[field] = message;
    }
    return acc;
  }, {});
}

function extractFieldErrors(error) {
  const serverErrors =
    error?.fieldErrors ||
    normalizeFieldErrors(error?.data?.errors) ||
    normalizeFieldErrors(error?.response?.data?.errors) ||
    {};

  if (!serverErrors.password_confirmation) {
    return serverErrors;
  }

  return {
    ...serverErrors,
    confirmPassword: serverErrors.password_confirmation,
  };
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});

  const clearError = field => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const getInputClass = field => {
    const baseClass = 'rounded-2xl bg-neutral-100 p-4 text-base text-neutral-900 border';

    if (errors[field]) {
      return `${baseClass} border-red-500`;
    }

    if (focusedField === field) {
      return `${baseClass} border-emerald-500`;
    }

    return `${baseClass} border-transparent`;
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const formErrors = {};

    if (!trimmedName) {
      formErrors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      formErrors.name = 'Full name must be at least 2 characters.';
    }

    if (!trimmedEmail) {
      formErrors.email = 'Email is required.';
    } else if (!isValidEmail(trimmedEmail)) {
      formErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      formErrors.password = 'Password is required.';
    } else if (!isStrongPassword(password)) {
      formErrors.password = 'Use at least 8 characters with letters and numbers.';
    }

    if (!confirmPassword) {
      formErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      formErrors.confirmPassword = 'Password confirmation does not match.';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        password_confirmation: confirmPassword,
      });
    } catch (error) {
      const serverErrors = extractFieldErrors(error);
      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors);
      }

      Alert.alert('Registration Failed', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow p-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center">
            <View className="mb-10 space-y-2">
              <Text className="text-4xl font-extrabold text-neutral-900">Create account</Text>
              <Text className="text-base text-neutral-600">
                Start your FinSight journey and get full control of your financial life.
              </Text>
            </View>

            <View className="space-y-4">
              <View className="space-y-2">
                <Text className="text-sm font-medium text-neutral-900">Full Name</Text>
                <TextInput
                  autoCapitalize="words"
                  className={getInputClass('name')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={value => {
                    setName(value);
                    clearError('name');
                  }}
                  onFocus={() => setFocusedField('name')}
                  placeholder="John Doe"
                  placeholderTextColor="#a3a3a3"
                  value={name}
                />
                {errors.name ? <Text className="text-sm text-red-500">{errors.name}</Text> : null}
              </View>

              <View className="space-y-2">
                <Text className="text-sm font-medium text-neutral-900">Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={getInputClass('email')}
                  keyboardType="email-address"
                  onBlur={() => setFocusedField(null)}
                  onChangeText={value => {
                    setEmail(value);
                    clearError('email');
                  }}
                  onFocus={() => setFocusedField('email')}
                  placeholder="you@example.com"
                  placeholderTextColor="#a3a3a3"
                  value={email}
                />
                {errors.email ? <Text className="text-sm text-red-500">{errors.email}</Text> : null}
              </View>

              <View className="space-y-2">
                <Text className="text-sm font-medium text-neutral-900">Password</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={getInputClass('password')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={value => {
                    setPassword(value);
                    clearError('password');
                  }}
                  onFocus={() => setFocusedField('password')}
                  placeholder="Create a secure password"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry
                  value={password}
                />
                {errors.password ? <Text className="text-sm text-red-500">{errors.password}</Text> : null}
              </View>

              <View className="space-y-2">
                <Text className="text-sm font-medium text-neutral-900">Confirm Password</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={getInputClass('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={value => {
                    setConfirmPassword(value);
                    clearError('confirmPassword');
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry
                  value={confirmPassword}
                />
                {errors.confirmPassword ? (
                  <Text className="text-sm text-red-500">{errors.confirmPassword}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`mt-2 h-14 items-center justify-center rounded-2xl bg-emerald-600 ${
                  isLoading ? 'opacity-70' : ''
                }`}
                disabled={isLoading}
                onPress={handleRegister}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="items-center pb-2 pt-8">
            <Text className="text-neutral-600">Already have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              className="mt-2"
              onPress={() => navigation.navigate('Login')}
            >
              <Text className="font-semibold text-emerald-600">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
