import { Icon } from "@hono_homework_2/ui/components/console/icon";

import { cx } from "@hono_homework_2/ui/lib/cx";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const DEFAULT_DURATION_MS = 3000;

interface ToastState {
	duration: number;
	/** Bumped on every show so repeated identical messages restart the timer. */
	id: number;
	message: string;
}

interface ToastContextValue {
	showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Single slide-in toast matching the design's micro-interaction:
 * slides down from above the viewport, stays for `duration`, then slides back.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<ToastState | null>(null);
	const [visible, setVisible] = useState(false);

	const showToast = useCallback(
		(message: string, duration = DEFAULT_DURATION_MS) => {
			setToast((prev) => ({ id: (prev?.id ?? 0) + 1, message, duration }));
			setVisible(true);
		},
		[]
	);

	// Auto-hide; a newer toast resets the timer via the cleanup.
	useEffect(() => {
		if (!toast) {
			return;
		}
		const timer = window.setTimeout(() => setVisible(false), toast.duration);
		return () => window.clearTimeout(timer);
	}, [toast]);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				aria-live="polite"
				className={cx(
					"pointer-events-none fixed top-20 right-6 z-50 flex items-center gap-space-xs rounded-control bg-primary px-space-md py-space-sm font-display text-label-ui text-on-primary shadow-xl transition-all duration-300",
					visible
						? "translate-y-0 opacity-100"
						: "-translate-y-[100px] opacity-0"
				)}
				role="status"
			>
				<Icon name="task_alt" size={18} />
				<span>{toast?.message ?? "操作已成功完成"}</span>
			</div>
		</ToastContext.Provider>
	);
}

export function useToast(): ToastContextValue {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast must be used inside <ToastProvider>");
	}
	return ctx;
}
