import type {
  Identifier,
  SafeInstallation,
  SafeKeyPackageStatus,
} from '@xmtp/browser-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useXMTP } from '@/context/XMTPContext';

export type Installation = SafeInstallation & {
  keyPackageStatus: SafeKeyPackageStatus | undefined;
};

type IdentityState = {
  inboxId: string | null;
  recoveryIdentifier: Identifier | null;
  accountIdentifiers: Identifier[];
  installations: Installation[];
  isSyncing: boolean;
  isLoaded: boolean;
  isRevoking: boolean;
  error: Error | null;
  lastSync: number | null;
};

const SYNC_COOLDOWN = 30 * 1000; // 30 seconds cooldown between syncs
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for identity data

export const useIdentity = (syncOnMount = false) => {
  const { client } = useXMTP();

  // Single state object for better management
  const [state, setState] = useState<IdentityState>({
    inboxId: null,
    recoveryIdentifier: null,
    accountIdentifiers: [],
    installations: [],
    isSyncing: false,
    isLoaded: false,
    isRevoking: false,
    error: null,
    lastSync: null,
  });

  // Refs to track ongoing operations and prevent duplicates
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const revokePromiseRef = useRef<Promise<void> | null>(null);
  const revokeAllPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  // Helper to update state
  const updateState = useCallback((updates: Partial<IdentityState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Check if sync is on cooldown
  const isSyncOnCooldown = useCallback(() => {
    return state.lastSync && (Date.now() - state.lastSync) < SYNC_COOLDOWN;
  }, [state.lastSync]);

  // Check if data is fresh enough
  const isDataFresh = useCallback(() => {
    return state.lastSync && (Date.now() - state.lastSync) < CACHE_DURATION;
  }, [state.lastSync]);

  // Sort installations by timestamp (newest first)
  const sortInstallations = useCallback((installations: SafeInstallation[]) => {
    return installations.sort((a, b) => {
      const aTime = a.clientTimestampNs || 0n;
      const bTime = b.clientTimestampNs || 0n;

      if (aTime > bTime) return -1;
      if (aTime < bTime) return 1;
      return 0;
    });
  }, []);

  // Sync with deduplication and cooldown
  const sync = useCallback(async (force = false): Promise<void> => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    // Return early if data is fresh and not forced
    if (!force && isDataFresh() && state.isLoaded) {
      return;
    }

    // Respect cooldown unless forced
    if (!force && isSyncOnCooldown()) {
      return;
    }

    // If there's already a sync in progress, wait for it
    if (syncPromiseRef.current) {
      return syncPromiseRef.current;
    }

    updateState({ isSyncing: true, error: null });

    const syncPromise = (async () => {
      try {
        const inboxState = await client.preferences.inboxState(true);

        if (!mountedRef.current) return;

        const sortedInstallations = sortInstallations(inboxState.installations);

        // Get key package statuses for all installations
        const keyPackageStatuses = await client.getKeyPackageStatusesForInstallationIds(
          sortedInstallations.map((installation) => installation.id)
        );

        if (!mountedRef.current) return;

        const installationsWithStatus: Installation[] = sortedInstallations.map(
          (installation) => ({
            ...installation,
            keyPackageStatus: keyPackageStatuses.get(installation.id),
          })
        );

        updateState({
          inboxId: inboxState.inboxId,
          accountIdentifiers: inboxState.accountIdentifiers,
          recoveryIdentifier: inboxState.recoveryIdentifier,
          installations: installationsWithStatus,
          isLoaded: true,
          lastSync: Date.now(),
          error: null,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to sync identity');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isSyncing: false });
        syncPromiseRef.current = null;
      }
    })();

    syncPromiseRef.current = syncPromise;
    return syncPromise;
  }, [client, isDataFresh, state.isLoaded, isSyncOnCooldown, sortInstallations, updateState]);

  // Revoke single installation with deduplication
  const revokeInstallation = useCallback(async (
    installationIdBytes: Uint8Array
  ): Promise<void> => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    // Prevent duplicate revocations
    if (revokePromiseRef.current) {
      return revokePromiseRef.current;
    }

    updateState({ isRevoking: true, error: null });

    const revokePromise = (async () => {
      try {
        await client.revokeInstallations([installationIdBytes]);

        // Invalidate cache and trigger a refresh
        updateState({ lastSync: null });

        // Auto-sync after revocation to get updated state
        if (mountedRef.current) {
          await sync(true);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to revoke installation');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isRevoking: false });
        revokePromiseRef.current = null;
      }
    })();

    revokePromiseRef.current = revokePromise;
    return revokePromise;
  }, [client, sync, updateState]);

  // Revoke all other installations with deduplication
  const revokeAllOtherInstallations = useCallback(async (): Promise<void> => {
    if (!client) {
      throw new Error("XMTP client is not initialized");
    }

    // Prevent duplicate revocations
    if (revokeAllPromiseRef.current) {
      return revokeAllPromiseRef.current;
    }

    updateState({ isRevoking: true, error: null });

    const revokeAllPromise = (async () => {
      try {
        await client.revokeAllOtherInstallations();

        // Invalidate cache and trigger a refresh
        updateState({ lastSync: null });

        // Auto-sync after revocation to get updated state
        if (mountedRef.current) {
          await sync(true);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to revoke all other installations');
        updateState({ error: err });
        throw err;
      } finally {
        updateState({ isRevoking: false });
        revokeAllPromiseRef.current = null;
      }
    })();

    revokeAllPromiseRef.current = revokeAllPromise;
    return revokeAllPromise;
  }, [client, sync, updateState]);

  // Auto-sync on mount if requested
  useEffect(() => {
    if (syncOnMount && client && !state.isLoaded && !state.isSyncing) {
      sync().catch(console.error);
    }
  }, [syncOnMount, client, state.isLoaded, state.isSyncing, sync]);

  // Auto-sync when client becomes available
  useEffect(() => {
    if (client && !state.isLoaded && !state.isSyncing && !isDataFresh()) {
      sync().catch(console.error);
    }
  }, [client, state.isLoaded, state.isSyncing, isDataFresh, sync]);

  // Utility methods
  const refresh = useCallback(() => {
    return sync(true);
  }, [sync]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const getInstallationById = useCallback((installationId: string) => {
    return state.installations.find(installation => installation.id === installationId);
  }, [state.installations]);

  const getCurrentInstallation = useCallback(() => {
    if (!client) return null;
    return state.installations.find(installation =>
      installation.id === client.installationId
    );
  }, [client, state.installations]);

  const getOtherInstallations = useCallback(() => {
    if (!client) return [];
    return state.installations.filter(installation =>
      installation.id !== client.installationId
    );
  }, [client, state.installations]);

  const getInstallationCount = useCallback(() => {
    return state.installations.length;
  }, [state.installations.length]);

  const hasMultipleInstallations = useCallback(() => {
    return state.installations.length > 1;
  }, [state.installations.length]);


  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // Data
    inboxId: state.inboxId,
    recoveryIdentifier: state.recoveryIdentifier,
    accountIdentifiers: state.accountIdentifiers,
    installations: state.installations,

    // State flags
    isSyncing: state.isSyncing,
    isLoaded: state.isLoaded,
    isRevoking: state.isRevoking,
    error: state.error,

    // Computed state
    isEmpty: state.isLoaded && state.installations.length === 0,
    hasInstallations: state.installations.length > 0,
    installationCount: state.installations.length,
    hasMultipleInstallations: hasMultipleInstallations(),
    currentInstallation: getCurrentInstallation(),
    otherInstallations: getOtherInstallations(),

    // Core methods
    sync,
    revokeInstallation,
    revokeAllOtherInstallations,

    // Utility methods
    refresh,
    clearError,
    getInstallationById,
    getCurrentInstallation,
    getOtherInstallations,
    getInstallationCount,

    // Client info
    hasClient: !!client,
    clientInstallationId: client?.installationId || null,
  };
};
