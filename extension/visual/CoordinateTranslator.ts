/**
 * Extension Visual Layer - Coordinate Translator (Checkpoint 3.5 Enhanced)
 * Provides dual-mode coordinate translation:
 * 1. Direct TradingView Widget API coordinates (when accessible via pageBridge)
 * 2. Mathematical Viewport Scaling with Padding, Bar Width, and Margin offsets.
 */

export interface ViewportConfig {
  width: number;           // Total canvas width in pixels
  height: number;          // Total canvas height in pixels
  topPadding: number;      // Top price axis margin (default 20px)
  bottomPadding: number;   // Bottom time axis margin (default 30px)
  leftPadding: number;     // Left chart margin (default 0px)
  rightPadding: number;    // Right price scale margin (default 60px)
  minPrice: number;        // Minimum visible price on scale
  maxPrice: number;        // Maximum visible price on scale
  firstCandleIndex: number;// First visible candle index
  lastCandleIndex: number; // Last visible candle index
  barWidth: number;        // Width in pixels of an individual candle bar
}

export interface TvCoordinateBridgeAPI {
  priceToY?: (price: number) => number | null;
  timestampToX?: (timestamp: number) => number | null;
  indexToX?: (index: number) => number | null;
}

export class CoordinateTranslator {
  private config: ViewportConfig;
  private tvBridgeApi?: TvCoordinateBridgeAPI;

  constructor(config?: Partial<ViewportConfig>) {
    this.config = {
      width: config?.width ?? 800,
      height: config?.height ?? 600,
      topPadding: config?.topPadding ?? 20,
      bottomPadding: config?.bottomPadding ?? 30,
      leftPadding: config?.leftPadding ?? 0,
      rightPadding: config?.rightPadding ?? 60,
      minPrice: config?.minPrice ?? 21400,
      maxPrice: config?.maxPrice ?? 21500,
      firstCandleIndex: config?.firstCandleIndex ?? 0,
      lastCandleIndex: config?.lastCandleIndex ?? 100,
      barWidth: config?.barWidth ?? 8,
    };
  }

  public updateViewport(config: Partial<ViewportConfig>): void {
    this.config = { ...this.config, ...config };
    // Recalculate dynamic barWidth if last and first indices provided
    if (config.firstCandleIndex !== undefined && config.lastCandleIndex !== undefined) {
      const visibleBars = Math.max(1, config.lastCandleIndex - config.firstCandleIndex);
      const drawableWidth = this.config.width - this.config.leftPadding - this.config.rightPadding;
      this.config.barWidth = drawableWidth / visibleBars;
    }
  }

  public setTvBridgeApi(api: TvCoordinateBridgeAPI): void {
    this.tvBridgeApi = api;
  }

  public getViewport(): ViewportConfig {
    return { ...this.config };
  }

  /**
   * Converts Price to Y-axis Pixel coordinate
   */
  public priceToY(price: number): number {
    // 1. Try Native TV Bridge API first
    if (this.tvBridgeApi?.priceToY) {
      const nativeY = this.tvBridgeApi.priceToY(price);
      if (nativeY !== null && isFinite(nativeY)) return nativeY;
    }

    // 2. Mathematical Viewport Scaling Fallback
    const { height, topPadding, bottomPadding, minPrice, maxPrice } = this.config;
    const drawableHeight = height - topPadding - bottomPadding;
    const priceRange = maxPrice - minPrice;

    if (priceRange <= 0) return topPadding + drawableHeight / 2;

    const normalized = (price - minPrice) / priceRange;
    // Invert Y axis for canvas (0 is top)
    return topPadding + (1 - normalized) * drawableHeight;
  }

  /**
   * Converts Candle Index or Timestamp to X-axis Pixel coordinate
   */
  public indexToX(index: number, timestamp?: number): number {
    // 1. Try Native TV Bridge API first
    if (timestamp && this.tvBridgeApi?.timestampToX) {
      const nativeX = this.tvBridgeApi.timestampToX(timestamp);
      if (nativeX !== null && isFinite(nativeX)) return nativeX;
    }

    if (this.tvBridgeApi?.indexToX) {
      const nativeX = this.tvBridgeApi.indexToX(index);
      if (nativeX !== null && isFinite(nativeX)) return nativeX;
    }

    // 2. Mathematical Viewport Scaling Fallback
    const { leftPadding, firstCandleIndex, barWidth } = this.config;
    const relativeIndex = index - firstCandleIndex;
    return leftPadding + relativeIndex * barWidth + barWidth / 2; // Center of candle bar
  }
}
