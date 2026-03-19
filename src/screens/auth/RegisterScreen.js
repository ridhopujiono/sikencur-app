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

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedConfirmPassword) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert('Validation Error', 'Password confirmation does not match.');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        password_confirmation: trimmedConfirmPassword,
      });
    } catch (error) {
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
                  className={`rounded-2xl bg-neutral-100 p-4 text-base text-neutral-900 ${
                    focusedField === 'name' ? 'border border-emerald-500' : 'border border-transparent'
                  }`}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  placeholder="John Doe"
                  placeholderTextColor="#a3a3a3"
                  value={name}
                />
              </View>

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
                  placeholder="Create a secure password"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry
                  value={password}
                />
              </View>

              <View className="space-y-2">
                <Text className="text-sm font-medium text-neutral-900">Confirm Password</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`rounded-2xl bg-neutral-100 p-4 text-base text-neutral-900 ${
                    focusedField === 'confirmPassword'
                      ? 'border border-emerald-500'
                      : 'border border-transparent'
                  }`}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry
                  value={confirmPassword}
                />
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
