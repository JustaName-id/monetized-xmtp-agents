import { useXMTP } from '@/context/XMTPContext';
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import type {
  Identifier,
  SafeInstallation,
  SafeKeyPackageStatus,
} from '@xmtp/browser-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Installation = SafeInstallation & {
  keyPackageStatus: SafeKeyPackageStatus | undefined;
};

type IdentityData = {
  inboxId: string;
  recoveryIdentifier: Identifier | null;
  accountIdentifiers: Identifier[];
  installations: Installation[];
};

type IdentityState = {
  isRevoking: boolean;
  error: Error | null;
  lastSync: number | null;
};

const SYNC_COOLDOWN = 30 * 1000; // 30 seconds cooldown between syncs
const STALE_TIME = 2 * 60 * 1000; // Consider data stale after 2 minutes
const CACHE_TIME = 5 * 60 * 1000; // Keep in cache for 5 minutes

// Query key factories
const identityKeys = {
  all: ['identity'] as const,
  identity: (inboxId: string) => [...identityKeys.all, inboxId] as const,
  installations: (inboxId: string) =>
    [...identityKeys.identity(inboxId), 'installations'] as const,
};

export const useIdentity = (syncOnMount = false) => {
  const { client } = useXMTP();
  const queryClient = useQueryClient();

  // Local state for revocation tracking and sync cooldown
  const [state, setState] = useState<IdentityState>({
    isRevoking: false,
    error: null,
    lastSync: null,
  });

  // Refs for cleanup and tracking
  const revokePromiseRef = useRef<Promise<void> | null>(null);
  const revokeAllPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  const clientInboxId = client?.inboxId;

  // Helper to update local state
  const updateState = useCallback((updates: Partial<IdentityState>) => {
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  // Check if sync is on cooldown
  const isSyncOnCooldown = useCallback(() => {
    return state.lastSync && Date.now() - state.lastSync < SYNC_COOLDOWN;
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

  // Identity query
  const identityQuery: UseQueryResult<IdentityData, Error> = useQuery({
    queryKey: identityKeys.identity(clientInboxId || ''),
    queryFn: async (): Promise<IdentityData> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }

      const inboxState = await client.preferences.inboxState(true);

      if (!mountedRef.current) {
        throw new Error('Component unmounted');
      }

      const sortedInstallations = sortInstallations(inboxState.installations);

      // Get key package statuses for all installations
      const keyPackageStatuses =
        await client.getKeyPackageStatusesForInstallationIds(
          sortedInstallations.map((installation) => installation.id)
        );

      if (!mountedRef.current) {
        throw new Error('Component unmounted');
      }

      const installationsWithStatus: Installation[] = sortedInstallations.map(
        (installation) => ({
          ...installation,
          keyPackageStatus: keyPackageStatuses.get(installation.id),
        })
      );

      updateState({ lastSync: Date.now() });

      return {
        inboxId: inboxState.inboxId,
        accountIdentifiers: inboxState.accountIdentifiers,
        recoveryIdentifier: inboxState.recoveryIdentifier,
        installations: installationsWithStatus,
      };
    },
    enabled: !!client && !!clientInboxId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: syncOnMount,
    retry: (failureCount, error) => {
      // Don't retry if it's a client availability error or component unmounted
      if (
        error.message.includes('not initialized') ||
        error.message.includes('unmounted')
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Sync mutation (force refresh)
  const syncMutation: UseMutationResult<
    IdentityData,
    Error,
    { force?: boolean } | undefined
  > = useMutation({
    mutationFn: async ({
      force = false,
    }: { force?: boolean } = {}): Promise<IdentityData> => {
      if (!client || !clientInboxId) {
        throw new Error('XMTP client is not initialized');
      }

      // Respect cooldown unless forced
      if (!force && isSyncOnCooldown()) {
        // Return cached data if available and not forcing
        const cachedData = queryClient.getQueryData<IdentityData>(
          identityKeys.identity(clientInboxId)
        );
        if (cachedData) {
          return cachedData;
        }
      }

      // Force refetch the query
      const result = await queryClient.fetchQuery({
        queryKey: identityKeys.identity(clientInboxId),
        queryFn: async () => {
          const inboxState = await client.preferences.inboxState(true);
          const sortedInstallations = sortInstallations(
            inboxState.installations
          );
          const keyPackageStatuses =
            await client.getKeyPackageStatusesForInstallationIds(
              sortedInstallations.map((installation) => installation.id)
            );

          const installationsWithStatus: Installation[] =
            sortedInstallations.map((installation) => ({
              ...installation,
              keyPackageStatus: keyPackageStatuses.get(installation.id),
            }));

          updateState({ lastSync: Date.now() });

          return {
            inboxId: inboxState.inboxId,
            accountIdentifiers: inboxState.accountIdentifiers,
            recoveryIdentifier: inboxState.recoveryIdentifier,
            installations: installationsWithStatus,
          };
        },
        staleTime: 0, // Force fresh data
      });

      return result;
    },
    onError: (error: Error) => {
      updateState({ error });
    },
  });

  // Revoke installation mutation
  const revokeInstallationMutation: UseMutationResult<void, Error, Uint8Array> =
    useMutation({
      mutationFn: async (installationIdBytes: Uint8Array): Promise<void> => {
        if (!client) {
          throw new Error('XMTP client is not initialized');
        }

        // Prevent duplicate revocations
        if (revokePromiseRef.current) {
          return revokePromiseRef.current;
        }

        updateState({ isRevoking: true, error: null });

        const revokePromise = (async () => {
          try {
            await client.revokeInstallations([installationIdBytes]);
          } finally {
            updateState({ isRevoking: false });
            revokePromiseRef.current = null;
          }
        })();

        revokePromiseRef.current = revokePromise;
        return revokePromise;
      },
      onError: (error: Error) => {
        updateState({ error, isRevoking: false });
      },
      onSuccess: () => {
        // Invalidate and refetch identity data after successful revocation
        if (clientInboxId) {
          queryClient.invalidateQueries({
            queryKey: identityKeys.identity(clientInboxId),
          });
        }
      },
    });

  // Revoke all other installations mutation
  const revokeAllOtherInstallationsMutation: UseMutationResult<
    void,
    Error,
    void
  > = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!client) {
        throw new Error('XMTP client is not initialized');
      }

      // Prevent duplicate revocations
      if (revokeAllPromiseRef.current) {
        return revokeAllPromiseRef.current;
      }

      updateState({ isRevoking: true, error: null });

      const revokeAllPromise = (async () => {
        try {
          await client.revokeAllOtherInstallations();
        } finally {
          updateState({ isRevoking: false });
          revokeAllPromiseRef.current = null;
        }
      })();

      revokeAllPromiseRef.current = revokeAllPromise;
      return revokeAllPromise;
    },
    onError: (error: Error) => {
      updateState({ error, isRevoking: false });
    },
    onSuccess: () => {
      // Invalidate and refetch identity data after successful revocation
      if (clientInboxId) {
        queryClient.invalidateQueries({
          queryKey: identityKeys.identity(clientInboxId),
        });
      }
    },
  });

  // Sync wrapper - uses mutation for force refresh, query refetch for normal sync
  const sync = useCallback(
    async (force = false): Promise<void> => {
      if (force) {
        await syncMutation.mutateAsync({ force });
      } else {
        await identityQuery.refetch();
      }
    },
    [syncMutation.mutateAsync, identityQuery.refetch]
  );

  // Revoke installation wrapper
  const revokeInstallation = useCallback(
    async (installationIdBytes: Uint8Array): Promise<void> => {
      return revokeInstallationMutation.mutateAsync(installationIdBytes);
    },
    [revokeInstallationMutation.mutateAsync]
  );

  // Revoke all other installations wrapper
  const revokeAllOtherInstallations = useCallback(async (): Promise<void> => {
    return revokeAllOtherInstallationsMutation.mutateAsync();
  }, [revokeAllOtherInstallationsMutation.mutateAsync]);

  // Utility methods - all memoized to prevent infinite renders
  const refresh = useCallback(() => {
    return sync(true);
  }, [sync]);

  const clearError = useCallback(() => {
    updateState({ error: null });
    // Also clear mutation errors
    syncMutation.reset();
    revokeInstallationMutation.reset();
    revokeAllOtherInstallationsMutation.reset();
  }, [
    syncMutation.reset,
    revokeInstallationMutation.reset,
    revokeAllOtherInstallationsMutation.reset,
  ]);

  const getInstallationById = useCallback(
    (installationId: string) => {
      return identityQuery.data?.installations.find(
        (installation) => installation.id === installationId
      );
    },
    [identityQuery.data?.installations]
  );

  const getCurrentInstallation = useCallback(() => {
    if (!client || !identityQuery.data) return null;
    return identityQuery.data.installations.find(
      (installation) => installation.id === client.installationId
    );
  }, [client, identityQuery.data?.installations]);

  const getOtherInstallations = useCallback(() => {
    if (!client || !identityQuery.data) return [];
    return identityQuery.data.installations.filter(
      (installation) => installation.id !== client.installationId
    );
  }, [client, identityQuery.data?.installations]);

  const getInstallationCount = useCallback(() => {
    return identityQuery.data?.installations.length || 0;
  }, [identityQuery.data?.installations.length]);

  const hasMultipleInstallations = useCallback(() => {
    return (identityQuery.data?.installations.length || 0) > 1;
  }, [identityQuery.data?.installations.length]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Combine all errors
  const combinedError =
    state.error ||
    identityQuery.error ||
    syncMutation.error ||
    revokeInstallationMutation.error ||
    revokeAllOtherInstallationsMutation.error;

  return {
    // Data
    inboxId: identityQuery.data?.inboxId || null,
    recoveryIdentifier: identityQuery.data?.recoveryIdentifier || null,
    accountIdentifiers: identityQuery.data?.accountIdentifiers || [],
    installations: identityQuery.data?.installations || [],

    // State flags
    isIdentityPending: identityQuery.isPending,
    isSyncing: identityQuery.isLoading || syncMutation.isPending,
    isLoaded: identityQuery.isSuccess,
    isRevoking:
      state.isRevoking ||
      revokeInstallationMutation.isPending ||
      revokeAllOtherInstallationsMutation.isPending,
    error: combinedError,

    // Computed state
    isEmpty:
      identityQuery.isSuccess && identityQuery.data?.installations.length === 0,
    hasInstallations: (identityQuery.data?.installations.length || 0) > 0,
    installationCount: identityQuery.data?.installations.length || 0,
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

    // Additional TanStack Query specific utilities
    refetch: identityQuery.refetch,
    isRefetching: identityQuery.isRefetching,
    isFetching: identityQuery.isFetching,
    isStale: identityQuery.isStale,

    // Access to underlying query/mutation objects if needed
    _internal: {
      identityQuery,
      syncMutation,
      revokeInstallationMutation,
      revokeAllOtherInstallationsMutation,
    },
  };
};
