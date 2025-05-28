import { useLocalStorage } from '@mantine/hooks';

export const useLocalVariables = () => {
  const [encryptionKey, setEncryptionKey] = useLocalStorage({
    key: 'XMTP_ENCRYPTION_KEY',
    defaultValue: '',
    getInitialValueInEffect: false,
  });

  return { encryptionKey, setEncryptionKey };
};
