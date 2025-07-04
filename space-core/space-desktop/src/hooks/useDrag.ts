import { useCallback, useRef, useState, useEffect } from 'react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseDragOptions {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrag?: (deltaX: number, deltaY: number) => void;
  threshold?: number;
}

export function useDrag(options: UseDragOptions = {}) {
  const { onDragStart, onDragEnd, onDrag, threshold = 5 } = options;
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  const dragRef = useRef<HTMLElement | null>(null);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button !== 0) return; // Only handle left mouse button
    
    event.preventDefault();
    
    const startX = event.clientX;
    const startY = event.clientY;
    
    setDragState({
      isDragging: true,
      startX,
      startY,
      currentX: startX,
      currentY: startY
    });
    
    hasDraggedRef.current = false;
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    event.preventDefault();
    
    const currentX = event.clientX;
    const currentY = event.clientY;
    const deltaX = currentX - dragState.currentX;
    const deltaY = currentY - dragState.currentY;
    
    // Check if we've moved beyond the threshold
    const totalDistance = Math.sqrt(
      Math.pow(currentX - dragState.startX, 2) + 
      Math.pow(currentY - dragState.startY, 2)
    );
    
    if (!hasDraggedRef.current && totalDistance > threshold) {
      hasDraggedRef.current = true;
      onDragStart?.();
    }
    
    if (hasDraggedRef.current) {
      // Move the window
      if (window.electronAPI && deltaX !== 0 || deltaY !== 0) {
        window.electronAPI.startDrag(deltaX, deltaY);
      }
      
      onDrag?.(deltaX, deltaY);
    }
    
    setDragState(prev => ({
      ...prev,
      currentX,
      currentY
    }));
  }, [dragState.isDragging, dragState.currentX, dragState.currentY, dragState.startX, dragState.startY, threshold, onDragStart, onDrag]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    event.preventDefault();
    
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));
    
    if (hasDraggedRef.current) {
      onDragEnd?.();
    }
    
    hasDraggedRef.current = false;
  }, [dragState.isDragging, onDragEnd]);

  const bindDragEvents = useCallback((element: HTMLElement | null) => {
    if (dragRef.current) {
      dragRef.current.removeEventListener('mousedown', handleMouseDown);
    }
    
    dragRef.current = element;
    
    if (element) {
      element.addEventListener('mousedown', handleMouseDown);
      element.style.cursor = 'move';
      element.style.userSelect = 'none';
    }
  }, [handleMouseDown]);

  // Global mouse events for drag continuation
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'move';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging: dragState.isDragging,
    bindDragEvents,
    dragProps: {
      onMouseDown: handleMouseDown
    }
  };
} 