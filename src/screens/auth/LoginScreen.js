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

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }

    try {
      setIsLoading(true);
      await login({
        email: trimmedEmail,
        password: trimmedPassword,
      });
    } catch (error) {
      Alert.alert('Login Failed', getErrorMessage(error));
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
              <Text className="text-4xl font-extrabold text-neutral-900">Welcome back</Text>
              <Text className="text-base text-neutral-600">
                Sign in to continue managing your finances with FinSight.
              </Text>
            </View>

            <View className="space-y-4">
              <View className="space-y-2">
                <Text className="text-sm font-medium text-neutral-900">Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`rounded-2xl bg-neutral-100 p-4 text-base text-neutral-900 ${
                    focusedField === 'email' ? 'border border-emerald-500' : 'border border-transparent'
                  }`}
                  keyboardType="email-address"
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  placeholder="you@example.com"
                  placeholderTextColor="#a3a3a3"
                  value={email}
                />
              </View>

              <View className="space-y-2">
                <Text className="text-sm font-medium text-neutral-900">Password</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`rounded-2xl bg-neutral-100 p-4 text-base text-neutral-900 ${
                    focusedField === 'password'
                      ? 'border border-emerald-500'
                      : 'border border-transparent'
                  }`}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  placeholder="Enter your password"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry
                  value={password}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`mt-2 h-14 items-center justify-center rounded-2xl bg-emerald-600 ${
                  isLoading ? 'opacity-70' : ''
                }`}
                disabled={isLoading}
                onPress={handleLogin}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="items-center pb-2 pt-8">
            <Text className="text-neutral-600">Don&apos;t have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              className="mt-2"
              onPress={() => navigation.navigate('Register')}
            >
              <Text className="font-semibold text-emerald-600">Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
