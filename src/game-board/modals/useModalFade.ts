import { useCallback, useEffect, useRef, useState, type TransitionEvent } from "react";

/**
 * Keeps a modal mounted through a fade-out after the user confirms, then runs `onComplete`.
 * `shouldDisplay` is the logical "this modal should be shown" flag from game rules.
 */
export function useModalFade(shouldDisplay: boolean, onComplete: () => void) {
    const [exiting, setExiting] = useState(false);
    const [paintOpen, setPaintOpen] = useState(false);
    const completedRef = useRef(false);

    const mounted = shouldDisplay || exiting;

    useEffect(() => {
        if (!shouldDisplay) setExiting(false);
    }, [shouldDisplay]);

    useEffect(() => {
        if (mounted && !exiting) {
            const id = requestAnimationFrame(() => {
                requestAnimationFrame(() => setPaintOpen(true));
            });
            return () => cancelAnimationFrame(id);
        }
        setPaintOpen(false);
    }, [mounted, exiting]);

    const finishClose = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete();
        setExiting(false);
    }, [onComplete]);

    useEffect(() => {
        if (shouldDisplay) completedRef.current = false;
    }, [shouldDisplay]);

    const requestClose = useCallback(() => {
        setExiting(true);
        setPaintOpen(false);
    }, []);

    const onBackdropTransitionEnd = useCallback(
        (e: TransitionEvent<HTMLDivElement>) => {
            if (e.target !== e.currentTarget || e.propertyName !== "opacity") return;
            if (exiting && !paintOpen) finishClose();
        },
        [exiting, paintOpen, finishClose],
    );

    useEffect(() => {
        if (!exiting || paintOpen) return;
        const t = window.setTimeout(finishClose, 700);
        return () => window.clearTimeout(t);
    }, [exiting, paintOpen, finishClose]);

    return { mounted, openClass: paintOpen, requestClose, onBackdropTransitionEnd };
}

/** What `useModalFade` returns — pass this into modal components as `fade`. */
export type ModalFade = ReturnType<typeof useModalFade>;
