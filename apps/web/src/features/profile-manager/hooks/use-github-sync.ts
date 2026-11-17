import type { AppRouter } from "@hono_homework_2/api/routers/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useCallback, useRef } from "react";

import { trpc } from "@/utils/trpc";

import {
	clearToken,
	loadToken,
	maskToken,
	saveToken,
} from "../lib/token-storage";

export const GITHUB_SESSION_KEY = ["github-session"] as const;

export type GithubSession = inferRouterOutputs<AppRouter>["github"]["sync"] & {
	/** Masked form of the token that produced this sync result. */
	maskedToken: string;
};

export type GithubSyncStatus = "idle" | "pending" | "success" | "error";

export interface GithubSyncError {
	message: string;
	resetEpoch: number | null;
}

interface SyncAttempt {
	/** Generation at the time this attempt started; see `syncState`. */
	generation: number;
	token: string;
}

/**
 * Module-level (not per-hook) because the token in sessionStorage is global
 * and the mutation callbacks may outlive the component that started them.
 * - `generation` is bumped by every new sync and every clear; only the
 *   attempt matching the latest generation may touch storage/session.
 * - `confirmedToken` is the last token GitHub accepted (rollback target);
 *   a token already in storage at load time survived a previous rollback.
 */
const syncState = {
	generation: 0,
	confirmedToken: loadToken(),
};

const isLatestAttempt = (
	attempt: SyncAttempt | undefined
): attempt is SyncAttempt =>
	attempt !== undefined && attempt.generation === syncState.generation;

export function useGithubSync() {
	const queryClient = useQueryClient();
	// Handed from sync() to onMutate; the ref object outlives unmount.
	const pendingAttempt = useRef<SyncAttempt | null>(null);
	// Mutation-level callbacks (unlike mutate() callbacks) still run after the
	// initiating component unmounts, so rollback can't be skipped by navigation.
	const mutation = useMutation(
		trpc.github.sync.mutationOptions({
			onMutate: (): SyncAttempt | undefined => {
				const attempt = pendingAttempt.current ?? undefined;
				pendingAttempt.current = null;
				return attempt;
			},
			onSuccess: (result, _variables, attempt) => {
				if (!isLatestAttempt(attempt)) {
					return;
				}
				syncState.confirmedToken = attempt.token;
				// Mask from the token that produced this result, so a re-sync
				// with a different token always updates the displayed mask.
				const next: GithubSession = {
					...result,
					maskedToken: maskToken(attempt.token),
				};
				queryClient.setQueryData(GITHUB_SESSION_KEY, next);
			},
			onError: (_error, _variables, attempt) => {
				// Skip if superseded by a newer sync or a clear.
				if (!isLatestAttempt(attempt)) {
					return;
				}
				if (syncState.confirmedToken) {
					saveToken(syncState.confirmedToken);
				} else {
					clearToken();
				}
			},
		})
	);

	const { data } = useQuery({
		queryKey: GITHUB_SESSION_KEY,
		queryFn: () => null,
		enabled: false,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const session = (data ?? null) as GithubSession | null;

	const { mutate, reset: resetMutation } = mutation;
	const sync = useCallback(
		(token: string) => {
			syncState.generation += 1;
			pendingAttempt.current = { generation: syncState.generation, token };
			// The tRPC link reads the token from storage for the request header.
			saveToken(token);
			mutate();
		},
		[mutate]
	);

	const clear = useCallback(() => {
		// Invalidate any in-flight attempt so its late callback can't resurrect state.
		syncState.generation += 1;
		syncState.confirmedToken = null;
		clearToken();
		resetMutation();
		// Only drop the GitHub session; other cached app data is untouched.
		// Setting null (rather than removeQueries) notifies the mounted observer.
		queryClient.setQueryData(GITHUB_SESSION_KEY, null);
	}, [resetMutation, queryClient]);

	const error: GithubSyncError | null = mutation.error
		? {
				message: mutation.error.message,
				resetEpoch: mutation.error.data?.resetEpoch ?? null,
			}
		: null;

	const status: GithubSyncStatus = mutation.status;

	return { sync, clear, data: session, status, error };
}
