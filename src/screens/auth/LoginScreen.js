import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import {
  API_SERVER_MODES,
  APP_VERSION,
  DEFAULT_API_BASE_URL,
  getApiServerConfig,
  isValidBaseUrl,
  saveApiServerConfig,
} from '../../utils/config';
import { isValidEmail } from '../../utils/validation';

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
  return (
    error?.fieldErrors ||
    normalizeFieldErrors(error?.data?.errors) ||
    normalizeFieldErrors(error?.response?.data?.errors) ||
    {}
  );
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [isServerModalVisible, setIsServerModalVisible] = useState(false);
  const [serverMode, setServerMode] = useState(API_SERVER_MODES.PRODUCTION);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [activeBaseUrl, setActiveBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [serverError, setServerError] = useState('');
  const [isSavingServer, setIsSavingServer] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadServerConfig = async () => {
      const config = await getApiServerConfig();
      if (!isMounted) {
        return;
      }

      setServerMode(config.mode);
      setCustomBaseUrl(config.customUrl);
      setActiveBaseUrl(
        config.mode === API_SERVER_MODES.CUSTOM && config.customUrl
          ? config.customUrl
          : DEFAULT_API_BASE_URL,
      );
    };

    loadServerConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearError = field => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const getInputClass = field => {
    const baseClass = 'rounded-2xl border bg-neutral-100 p-4 text-base text-neutral-900';

    if (errors[field]) {
      return `${baseClass} border-red-500`;
    }

    if (focusedField === field) {
      return `${baseClass} border-blue-700`;
    }

    return `${baseClass} border-blue-100`;
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const formErrors = {};

    if (!trimmedEmail) {
      formErrors.email = 'Email wajib diisi.';
    } else if (!isValidEmail(trimmedEmail)) {
      formErrors.email = 'Masukkan alamat email yang valid.';
    }

    if (!password) {
      formErrors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 8) {
      formErrors.password = 'Kata sandi minimal 8 karakter.';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      await login({
        email: trimmedEmail,
        password,
      });
    } catch (error) {
      const serverErrors = extractFieldErrors(error);
      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors);
      }

      Alert.alert('Login gagal', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const openServerModal = async () => {
    const config = await getApiServerConfig();
    setServerMode(config.mode);
    setCustomBaseUrl(config.customUrl);
    setServerError('');
    setIsServerModalVisible(true);
  };

  const handleSaveServer = async () => {
    const trimmedCustomBaseUrl = customBaseUrl.trim();

    if (
      serverMode === API_SERVER_MODES.CUSTOM &&
      !isValidBaseUrl(trimmedCustomBaseUrl)
    ) {
      setServerError('Masukkan URL lengkap, misalnya http://192.168.1.10:8004');
      return;
    }

    try {
      setIsSavingServer(true);
      setServerError('');

      const savedConfig = await saveApiServerConfig({
        mode: serverMode,
        customUrl:
          serverMode === API_SERVER_MODES.CUSTOM ? trimmedCustomBaseUrl : '',
      });

      setCustomBaseUrl(savedConfig.customUrl);
      setActiveBaseUrl(savedConfig.resolvedBaseUrl);
      setIsServerModalVisible(false);
      Alert.alert('Server diperbarui', `Base URL aktif: ${savedConfig.resolvedBaseUrl}`);
    } finally {
      setIsSavingServer(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow p-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center">
            <View className="py-7">
              <Text className="text-4xl font-extrabold">Selamat datang</Text>
              <Text className="mt-2 text-base leading-6">
                Masuk untuk melanjutkan pengelolaan keuangan Anda di SiKencur.
              </Text>
            </View>

            <View className="space-y-4">
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
                  placeholder="nama@email.com"
                  placeholderTextColor="#94a3b8"
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
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={password}
                />
                {errors.password ? <Text className="text-sm text-red-500">{errors.password}</Text> : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`mt-2 h-14 items-center justify-center rounded-2xl bg-blue-700 ${
                  isLoading ? 'opacity-70' : ''
                }`}
                disabled={isLoading}
                onPress={handleLogin}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">Masuk</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={openServerModal}>
                <Text className="text-center text-sm text-neutral-500">Versi {APP_VERSION}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="items-center pb-2 pt-8">
            <Text className="text-neutral-600">Belum punya akun?</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              className="mt-2"
              onPress={() => navigation.navigate('Register')}
            >
              <Text className="font-semibold text-blue-700">Daftar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent
        visible={isServerModalVisible}
        onRequestClose={() => setIsServerModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40 px-4 pb-6">
          <View className="rounded-3xl bg-white p-5">
            <Text className="text-xl font-bold text-neutral-900">Pilih server API</Text>
            <Text className="mt-2 text-sm leading-5 text-neutral-600">
              Perubahan ini hanya mengganti base URL backend untuk request berikutnya.
            </Text>

            <View className="mt-5 gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                className={`rounded-2xl border p-4 ${
                  serverMode === API_SERVER_MODES.PRODUCTION
                    ? 'border-blue-700 bg-blue-50'
                    : 'border-blue-100 bg-white'
                }`}
                onPress={() => {
                  setServerMode(API_SERVER_MODES.PRODUCTION);
                  setServerError('');
                }}
              >
                <Text className="text-base font-semibold text-neutral-900">Production</Text>
                <Text className="mt-1 text-sm text-neutral-600">{DEFAULT_API_BASE_URL}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`rounded-2xl border p-4 ${
                  serverMode === API_SERVER_MODES.CUSTOM
                    ? 'border-blue-700 bg-blue-50'
                    : 'border-blue-100 bg-white'
                }`}
                onPress={() => {
                  setServerMode(API_SERVER_MODES.CUSTOM);
                  setServerError('');
                }}
              >
                <Text className="text-base font-semibold text-neutral-900">Custom</Text>
                <Text className="mt-1 text-sm text-neutral-600">
                  Gunakan base URL server lain sesuai kebutuhan.
                </Text>
              </TouchableOpacity>
            </View>

            {serverMode === API_SERVER_MODES.CUSTOM ? (
              <View className="mt-4">
                <Text className="mb-2 text-sm font-medium text-neutral-900">Base URL custom</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`rounded-2xl border bg-neutral-100 p-4 text-base text-neutral-900 ${
                    serverError ? 'border-red-500' : 'border-blue-100'
                  }`}
                  keyboardType="url"
                  onChangeText={value => {
                    setCustomBaseUrl(value);
                    if (serverError) {
                      setServerError('');
                    }
                  }}
                  placeholder="http://192.168.1.10:8004"
                  placeholderTextColor="#94a3b8"
                  value={customBaseUrl}
                />
                {serverError ? (
                  <Text className="mt-2 text-sm text-red-500">{serverError}</Text>
                ) : null}
              </View>
            ) : null}

            <View className="mt-4 rounded-2xl bg-neutral-100 p-4">
              <Text className="text-sm font-medium text-neutral-900">Server aktif</Text>
              <Text className="mt-1 text-sm text-neutral-600">{activeBaseUrl}</Text>
            </View>

            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-12 flex-1 items-center justify-center rounded-2xl border border-blue-100 bg-white"
                onPress={() => setIsServerModalVisible(false)}
              >
                <Text className="text-sm font-semibold text-blue-700">Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                className={`h-12 flex-1 items-center justify-center rounded-2xl bg-blue-700 ${
                  isSavingServer ? 'opacity-70' : ''
                }`}
                disabled={isSavingServer}
                onPress={handleSaveServer}
              >
                {isSavingServer ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
