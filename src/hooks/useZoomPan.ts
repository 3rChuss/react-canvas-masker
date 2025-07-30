import React from 'react';

export interface ZoomPanOptions {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  enableWheelZoom?: boolean;
  constrainPan?: boolean;
  onScaleChange?: (scale: number) => void;
  onPanChange?: (x: number, y: number) => void;
}

export interface ZoomPanState {
  scale: number;
  transform: {
    scale: number;
    translateX: number;
    translateY: number;
  };
  baseScale: number;
  effectiveScale: number;
  isPanning: boolean;
  isSpaceKeyDown: boolean;
  isZoomKeyDown: boolean;
}

export interface ZoomPanActions {
  setScale: React.Dispatch<React.SetStateAction<number>>;
  resetZoom: () => void;
  setPan: (x: number, y: number) => void;
  getImageCoordinates: (
    clientX: number,
    clientY: number,
  ) => { x: number; y: number };
}

export function useZoomPan(
  containerRef: React.RefObject<HTMLDivElement>,
  contentSize: { x: number; y: number },
  options: ZoomPanOptions = {},
): [ZoomPanState, ZoomPanActions] {
  const {
    initialScale = 1,
    minScale = 0.8,
    maxScale = 4,
    enableWheelZoom = true,
    constrainPan = true,
    onScaleChange,
    onPanChange,
  } = options;

  // Zoom state
  const [scale, setScale] = React.useState(initialScale);
  const [transform, setTransform] = React.useState({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
  });

  // Pan state
  const [isPanning, setIsPanning] = React.useState(false);
  const [isSpaceKeyDown, setIsSpaceKeyDown] = React.useState(false);
  const [isZoomKeyDown, setIsZoomKeyDown] = React.useState(false);
  const [lastMousePosition, setLastMousePosition] = React.useState({
    x: 0,
    y: 0,
  });

  // Scale factor for automatic scaling
  const [baseScale, setBaseScale] = React.useState(1);
  const lastTransformRef = React.useRef({
    x: 0,
    y: 0,
  });
  const lastContentSizeRef = React.useRef({
    x: 0,
    y: 0,
  });

  // Effective scale (combined)
  const effectiveScale = React.useMemo(
    () => baseScale * scale,
    [baseScale, scale],
  );

  // Function to calculate image coordinates from client coordinates
  const getImageCoordinates = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();

      // Obtener dimensiones del contenedor
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Obtener posición del cursor relativa al contenedor
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;

      // Factor de escala combinada
      const combinedScale = transform.scale * baseScale;

      // 2. Calculamos el desplazamiento desde el centro del contenedor (en píxeles del contenedor)
      const fromCenterX = offsetX - containerWidth / 2;
      const fromCenterY = offsetY - containerHeight / 2;

      // 3. Convertimos a coordenadas del espacio escalado (primero deshacemos la traslación del usuario)
      const withoutUserTranslateX =
        fromCenterX - transform.translateX * combinedScale;
      const withoutUserTranslateY =
        fromCenterY - transform.translateY * combinedScale;

      // 4. Convertimos al espacio original dividiendo por la escala combinada
      const inOriginalSpaceX = withoutUserTranslateX / combinedScale;
      const inOriginalSpaceY = withoutUserTranslateY / combinedScale;

      // 5. Ajustamos para obtener las coordenadas dentro de la imagen
      const x = inOriginalSpaceX + contentSize.x / 2;
      const y = inOriginalSpaceY + contentSize.y / 2;

      return { x, y };
    },
    [transform, baseScale, containerRef],
  );

  // Function to calculate base scale
  const calculateBaseScale = React.useCallback(() => {
    if (!containerRef.current || contentSize.x === 0 || contentSize.y === 0)
      return {
        baseScale: 1,
        containerWidth: 0,
        containerHeight: 0,
      };

    const container = containerRef.current;
    const computedStyle = window.getComputedStyle(container);
    const paddingHorizontal =
      parseFloat(computedStyle.paddingLeft) +
      parseFloat(computedStyle.paddingRight);
    const paddingVertical =
      parseFloat(computedStyle.paddingTop) +
      parseFloat(computedStyle.paddingBottom);

    const availableWidth = container.clientWidth - paddingHorizontal;
    const availableHeight = container.clientHeight - paddingVertical;

    const widthRatio = availableWidth / contentSize.x;
    const heightRatio = availableHeight / contentSize.y;

    // Calculate the new base scale
    const newBaseScale = Math.min(1, widthRatio, heightRatio);

    return {
      baseScale: newBaseScale,
      containerWidth: availableWidth,
      containerHeight: availableHeight,
    };
  }, [contentSize, containerRef]);

  // Combined effect to update container size, base scale and apply initial centering
  const isInitialRender = React.useRef(true);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (
          entry.target === container &&
          contentSize.x > 0 &&
          contentSize.y > 0
        ) {
          isInitialRender.current = true;
          recalculateBaseScaleAndCenter();
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, contentSize]);

  const recalculateBaseScaleAndCenter = React.useCallback(() => {
    if (!containerRef.current || contentSize.x === 0 || contentSize.y === 0) {
      return;
    }

    lastContentSizeRef.current = { ...contentSize };

    const { baseScale: newBaseScale } = calculateBaseScale();

    // Update state with batch updates to reduce re-renders
    setBaseScale(newBaseScale);

    const centerOffsetX = 0;
    const centerOffsetY = 0;

    // Store the calculated offsets
    lastTransformRef.current = { x: centerOffsetX, y: centerOffsetY };

    setTransform({
      scale: 1, // Reset to scale 1 during initial centering
      translateX: centerOffsetX,
      translateY: centerOffsetY,
    });

    // Mark that initial render is complete
    isInitialRender.current = false;

    // Notify parent of scale change
    if (onScaleChange) {
      setTimeout(() => {
        onScaleChange(1);
      }, 0);
    }

    // Notify parent of position change but use setTimeout to break the update cycle
    if (onPanChange) {
      setTimeout(() => {
        onPanChange(centerOffsetX, centerOffsetY);
      }, 0);
    }
  }, [contentSize, containerRef, calculateBaseScale]);

  React.useLayoutEffect(() => {
    // Skip if no container or content size
    if (!containerRef.current || contentSize.x === 0 || contentSize.y === 0) {
      return;
    }

    if (
      isInitialRender.current ||
      Math.abs(lastContentSizeRef.current.x - contentSize.x) > 5 ||
      Math.abs(lastContentSizeRef.current.y - contentSize.y) > 5
    ) {
      recalculateBaseScaleAndCenter();
    }
  }, [contentSize, recalculateBaseScaleAndCenter]);

  // Handle zoom with mouse wheel (improved to maintain point-under-cursor)
  React.useEffect(() => {
    if (!enableWheelZoom || !containerRef.current) return;

    const container = containerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();

      // Get the position of the mouse relative to the container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate the position of the mouse in the original image space
      // This is the point we want to keep fixed during the zoom
      const pointXBeforeZoom =
        mouseX / baseScale - transform.translateX * transform.scale;
      const pointYBeforeZoom =
        mouseY / baseScale - transform.translateY * transform.scale;

      // Calculate the new scale
      const delta = -e.deltaY * 0.01;
      const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));

      if (newScale !== scale) {
        // Calculate new translation to keep the point under cursor fixed
        const newTranslateX =
          -pointXBeforeZoom / newScale + mouseX / baseScale / newScale;
        const newTranslateY =
          -pointYBeforeZoom / newScale + mouseY / baseScale / newScale;

        // Update state
        setScale(newScale);
        setTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        });

        onScaleChange?.(newScale);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [
    scale,
    transform,
    baseScale,
    minScale,
    maxScale,
    enableWheelZoom,
    onScaleChange,
    containerRef,
  ]);

  // Improved resetZoom function to always center the content
  const resetZoom = React.useCallback(() => {
    // Reset scale to 1
    setScale(1);
    const centerOffsetX = 0;
    const centerOffsetY = 0;

    // Apply centered transform with reset scale
    setTransform({
      scale: 1,
      translateX: centerOffsetX,
      translateY: centerOffsetY,
    });

    // Update stored reference
    lastTransformRef.current = { x: centerOffsetX, y: centerOffsetY };

    // Use setTimeout to break potential update cycles
    setTimeout(() => {
      if (onScaleChange) onScaleChange(1);
      if (onPanChange) onPanChange(centerOffsetX, centerOffsetY);
    }, 0);
  }, [calculateBaseScale, contentSize]); // Removed onScaleChange and onPanChange to break potential cycles

  // Function to programmatically set pan position with improved centering logic
  const setPan = React.useCallback(
    (x: number, y: number) => {
      setTransform((prev) => {
        // Apply constraints if enabled
        let constrainedX = x;
        let constrainedY = y;

        if (constrainPan && containerRef.current) {
          const maxPanX = contentSize.x * 0.75; // Permitir movimiento hasta 75% del ancho
          const maxPanY = contentSize.y * 0.75; // Permitir movimiento hasta 75% del alto

          constrainedX = Math.max(Math.min(x, maxPanX), -maxPanX);
          constrainedY = Math.max(Math.min(y, maxPanY), -maxPanY);
        }

        const shouldNotifyParent =
          onPanChange &&
          (prev.translateX !== constrainedX ||
            prev.translateY !== constrainedY);

        // Update transform first
        const newTransform = {
          ...prev,
          translateX: constrainedX,
          translateY: constrainedY,
        };

        // Notify parent using setTimeout to break update cycles
        if (shouldNotifyParent) {
          const notifyX = constrainedX;
          const notifyY = constrainedY;
          setTimeout(() => {
            onPanChange(notifyX, notifyY);
          }, 0);
        }

        return newTransform;
      });
    },
    [constrainPan, onPanChange, contentSize, containerRef], // Removed transform.scale from dependencies
  );

  // Blur handler
  const handleBlur = React.useCallback(() => {
    setIsPanning(false);
    setIsSpaceKeyDown(false);
    setIsZoomKeyDown(false);
  }, []);

  // Keyboard event listeners for space key and ctrl/cmd key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in input element
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;

      if (e.code === 'Space' && transform.scale > 1) {
        e.preventDefault();

        if (!isSpaceKeyDown && transform.scale > 1) {
          setIsSpaceKeyDown(true);
        }
      }

      if ((e.ctrlKey || e.metaKey) && !isZoomKeyDown) {
        setIsZoomKeyDown(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpaceKeyDown(false);
        setIsPanning(false);
      }

      // Check if Ctrl/Cmd keys were released
      if (!e.ctrlKey && !e.metaKey && isZoomKeyDown) {
        setIsZoomKeyDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isSpaceKeyDown, isZoomKeyDown, transform.scale, handleBlur]);

  // Pan handling with mouse events
  React.useEffect(() => {
    if (!containerRef.current || transform.scale <= 1) return;

    const container = containerRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button (button === 1) or left button with space key pressed
      if (e.button === 1 || (e.button === 0 && isSpaceKeyDown)) {
        e.preventDefault();
        setIsPanning(true);
        setLastMousePosition({ x: e.clientX, y: e.clientY });

        // Add grabbing cursor class to document body
        document.body.classList.add('panning-active');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;

      e.preventDefault();

      // Calculate delta movement
      const deltaX = (e.clientX - lastMousePosition.x) / transform.scale;
      const deltaY = (e.clientY - lastMousePosition.y) / transform.scale;

      // Update pan position
      setPan(transform.translateX + deltaX, transform.translateY + deltaY);

      // Update last position
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        document.body.classList.remove('panning-active');
      }
    };

    // Also stop panning if mouse leaves the window
    const handleMouseLeave = () => {
      if (isPanning) {
        setIsPanning(false);
        document.body.classList.remove('panning-active');
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    isPanning,
    isSpaceKeyDown,
    lastMousePosition,
    transform.scale,
    transform.translateX,
    transform.translateY,
    setPan,
    containerRef,
  ]);

  // Reset pan position when scale is reset to 1
  React.useEffect(() => {
    if (transform.scale <= 1) {
      setPan(0, 0);
    }
  }, [transform.scale]);

  return [
    {
      scale,
      transform,
      baseScale,
      effectiveScale,
      isPanning,
      isSpaceKeyDown,
      isZoomKeyDown,
    },
    {
      setScale,
      resetZoom,
      setPan,
      getImageCoordinates,
    },
  ];
}
