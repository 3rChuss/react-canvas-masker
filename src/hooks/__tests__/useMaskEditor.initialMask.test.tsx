import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';

import { MaskEditor } from '../../components/MaskEditor';

// Helpers to create in-memory data URLs
function createImageDataUrl(width: number, height: number, fill = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
}

function createMaskDataUrl(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  // default white background for mask
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  draw(ctx);
  return canvas.toDataURL('image/png');
}

describe('useMaskEditor - initialMask behavior', () => {
  it('applies initialMask once and allows subsequent re-apply when it changes', async () => {
    const src = createImageDataUrl(32, 32, '#cccccc');
    const initialMask = createMaskDataUrl(32, 32, (ctx) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(5, 5, 10, 10);
    });

    const newMask = createMaskDataUrl(32, 32, (ctx) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(15, 15, 6, 6);
    });

    const onMaskChange = vi.fn();
    const canvasRef = React.createRef<any>();

    const { rerender } = render(
      <MaskEditor
        src={src}
        initialMask={initialMask}
        onMaskChange={onMaskChange}
        onDrawingChange={() => {}}
        canvasRef={canvasRef}
      />,
    );

    // Wait for the initial mask to be applied and onMaskChange to be notified
    await waitFor(
      () => {
        expect(onMaskChange).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    const firstCall = onMaskChange.mock.calls[0][0];
    expect(typeof firstCall).toBe('string');

    // Re-render with the same initialMask -> should NOT call again
    rerender(
      <MaskEditor
        src={src}
        initialMask={initialMask}
        onMaskChange={onMaskChange}
        onDrawingChange={() => {}}
        canvasRef={canvasRef}
      />,
    );

    // Wait a short time to ensure no extra calls
    await new Promise((r) => setTimeout(r, 200));
    expect(onMaskChange).toHaveBeenCalledTimes(1);

    // Change the initialMask to a new value -> should trigger another apply
    rerender(
      <MaskEditor
        src={src}
        initialMask={newMask}
        onMaskChange={onMaskChange}
        onDrawingChange={() => {}}
        canvasRef={canvasRef}
      />,
    );

    await waitFor(
      () => {
        expect(onMaskChange).toHaveBeenCalledTimes(2);
      },
      { timeout: 2000 },
    );

    // After clearing the canvas we should be able to draw on it
    // Clear via the exposed API
    canvasRef.current?.clear?.();

    await waitFor(() => {
      expect(onMaskChange).toHaveBeenCalled();
    });

    // Simulate a drawing operation by drawing directly on mask canvas
    const maskCanvas = canvasRef.current?.maskCanvas as HTMLCanvasElement;
    const ctx = maskCanvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(2, 2, 2, 2);

    // Check that the pixel at 2,2 is not white
    const imgData = ctx.getImageData(2, 2, 1, 1).data;
    expect(imgData[0] !== 255 || imgData[3] !== 0).toBeTruthy();
  });
});
