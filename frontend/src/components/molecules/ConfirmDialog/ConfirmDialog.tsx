import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';

/**
 * In-page replacement for the browser confirm and prompt boxes.
 *
 * Mount <ConfirmDialogHost /> once near the app root, then anywhere:
 *   const ok = await confirmDialog({ message: 'Delete?', danger: true });
 *   const text = await promptDialog({ message: 'Reason:' }); // null on cancel
 */

export interface ConfirmDialogOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface PromptDialogOptions extends ConfirmDialogOptions {
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
}

type Request =
  | { kind: 'confirm'; options: ConfirmDialogOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; options: PromptDialogOptions; resolve: (v: string | null) => void };

const queue: Request[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const isGreekLang = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('preferredLang') === 'el';
  } catch {
    return false;
  }
};

const defaults = () =>
  isGreekLang()
    ? { confirm: 'ΕΠΙΒΕΒΑΙΩΣΗ', cancel: 'ΑΚΥΡΩΣΗ', title: 'ΕΠΙΒΕΒΑΙΩΣΗ', promptTitle: 'ΣΥΜΠΛΗΡΩΣΗ' }
    : { confirm: 'Confirm', cancel: 'Cancel', title: 'Please confirm', promptTitle: 'Input required' };

const normalize = <T extends ConfirmDialogOptions>(input: T | string): T =>
  (typeof input === 'string' ? { message: input } : input) as T;

export function confirmDialog(options: ConfirmDialogOptions | string): Promise<boolean> {
  return new Promise((resolve) => {
    queue.push({ kind: 'confirm', options: normalize(options), resolve });
    notify();
  });
}

export function promptDialog(options: PromptDialogOptions | string): Promise<string | null> {
  return new Promise((resolve) => {
    queue.push({ kind: 'prompt', options: normalize<PromptDialogOptions>(options), resolve });
    notify();
  });
}

export const ConfirmDialogHost: React.FC = () => {
  const [, force] = useState(0);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const current = queue[0];

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    if (current.kind === 'prompt') {
      setValue(current.options.defaultValue ?? '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [current]);

  const close = (accepted: boolean) => {
    const req = queue.shift();
    if (!req) return;
    if (req.kind === 'confirm') req.resolve(accepted);
    else req.resolve(accepted ? value : null);
    notify();
  };

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, value]);

  if (!current || typeof document === 'undefined') return null;

  const d = defaults();
  const { title, message, confirmText, cancelText, danger } = current.options;
  const isPrompt = current.kind === 'prompt';
  const promptOpts = isPrompt ? (current.options as PromptDialogOptions) : undefined;
  const Icon = danger ? AlertTriangle : HelpCircle;

  return createPortal(
    <div
      className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            close(true);
          }}
        >
          <div className="flex gap-4 p-6">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
                {title ?? (isPrompt ? d.promptTitle : d.title)}
              </h2>
              <div className="mt-2 whitespace-pre-line break-words text-sm text-gray-600">{message}</div>
              {isPrompt &&
                (promptOpts?.multiline ? (
                  <textarea
                    ref={(el) => (inputRef.current = el)}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={promptOpts?.placeholder}
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <input
                    ref={(el) => (inputRef.current = el)}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={promptOpts?.placeholder}
                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
            <Button type="button" variant="outline" size="sm" onClick={() => close(false)}>
              {cancelText ?? d.cancel}
            </Button>
            <Button autoFocus={!isPrompt} type="submit" variant={danger ? 'danger' : 'primary'} size="sm">
              {confirmText ?? d.confirm}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDialogHost;
