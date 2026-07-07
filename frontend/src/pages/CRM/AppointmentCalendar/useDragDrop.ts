import { useState, useCallback, useRef } from 'react';
import { bookingAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { HOUR_HEIGHT_PX } from './constants';
import type { DragState, ResizeState } from './types';

interface UseDragDropOptions {
  onSuccess: () => void;
}

export function useDragDrop({ onSuccess }: UseDragDropOptions) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [ghostStyle, setGhostStyle] = useState<{ top: number; height: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ── Drag Start ──────────────────────────────────────────────────────────────

  const onDragStart = useCallback(
    (e: React.MouseEvent, apt: any) => {
      e.stopPropagation();
      // offsetY = how far from the top of the card the user clicked
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const offsetX = e.clientX - rect.left;

      setDragging({
        appointmentId: apt.id,
        originalStart: apt.startTime,
        originalEnd: apt.endTime,
        offsetY,
        offsetX,
      });
    },
    [],
  );

  // ── Mouse Move ──────────────────────────────────────────────────────────────

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top - dragging.offsetY + container.scrollTop;

      const durationMs =
        new Date(dragging.originalEnd).getTime() -
        new Date(dragging.originalStart).getTime();
      const durationPx = (durationMs / 3600000) * HOUR_HEIGHT_PX;

      setGhostStyle({
        top: Math.max(0, relativeY),
        height: durationPx,
        left: 0,
        width: 100,
      });
    },
    [dragging],
  );

  // ── Mouse Up (Drop) ─────────────────────────────────────────────────────────

  const onMouseUp = useCallback(
    async (e: React.MouseEvent, dayDate?: Date) => {
      if (!dragging || !containerRef.current || !dayDate) {
        setDragging(null);
        setGhostStyle(null);
        return;
      }

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top - dragging.offsetY + container.scrollTop;

      // Convert pixel position to time
      const totalMinutes = Math.round((relativeY / HOUR_HEIGHT_PX) * 60 / 15) * 15;
      const newHour = Math.floor(totalMinutes / 60);
      const newMinute = totalMinutes % 60;

      const newStart = new Date(dayDate);
      newStart.setHours(newHour, newMinute, 0, 0);

      const durationMs =
        new Date(dragging.originalEnd).getTime() -
        new Date(dragging.originalStart).getTime();
      const newEnd = new Date(newStart.getTime() + durationMs);

      // Don't save if same time
      if (newStart.toISOString() === dragging.originalStart) {
        setDragging(null);
        setGhostStyle(null);
        return;
      }

      try {
        await bookingAPI.reschedule(
          dragging.appointmentId,
          newStart.toISOString(),
          newEnd.toISOString(),
        );
        toast.success('Appointment rescheduled!');
        onSuccess();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to reschedule appointment.');
      } finally {
        setDragging(null);
        setGhostStyle(null);
      }
    },
    [dragging, onSuccess],
  );

  // ── Resize Start ────────────────────────────────────────────────────────────

  const onResizeStart = useCallback(
    (e: React.MouseEvent, apt: any) => {
      e.stopPropagation();
      setResizing({
        appointmentId: apt.id,
        originalEnd: apt.endTime,
      });
    },
    [],
  );

  // ── Resize Mouse Up ─────────────────────────────────────────────────────────

  const onResizeMouseUp = useCallback(
    async (e: React.MouseEvent, apt: any, columnRect: DOMRect) => {
      if (!resizing) return;

      const relativeY = e.clientY - columnRect.top;
      const totalMinutes = Math.round((relativeY / HOUR_HEIGHT_PX) * 60 / 15) * 15;
      const newHour = Math.floor(totalMinutes / 60);
      const newMinute = totalMinutes % 60;

      const originalStart = new Date(apt.startTime);
      const newEnd = new Date(originalStart);
      newEnd.setHours(newHour, newMinute, 0, 0);

      // Minimum 15 minutes
      if (newEnd.getTime() - originalStart.getTime() < 15 * 60000) {
        setResizing(null);
        return;
      }

      try {
        await bookingAPI.reschedule(
          resizing.appointmentId,
          apt.startTime,
          newEnd.toISOString(),
        );
        toast.success('Duration updated!');
        onSuccess();
      } catch (err: any) {
        toast.error('Failed to update duration.');
      } finally {
        setResizing(null);
      }
    },
    [resizing, onSuccess],
  );

  return {
    dragging,
    resizing,
    ghostStyle,
    containerRef,
    onDragStart,
    onMouseMove,
    onMouseUp,
    onResizeStart,
    onResizeMouseUp,
  };
}
