import { useLocalStorage } from '@mantine/hooks';

export const useLocalVariables = () => {
  const [encryptionKey, setEncryptionKey] = useLocalStorage({
    key: 'XMTP_ENCRYPTION_KEY',
    defaultValue: '1234',
    getInitialValueInEffect: false,
  });

  return { encryptionKey, setEncryptionKey };
};
