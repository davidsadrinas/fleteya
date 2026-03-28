import type { SupabaseClient } from "@supabase/supabase-js";

type QueuedPoint = {
  shipment_id: string;
  location: string;
  speed: number | null;
  heading: number | null;
  created_at: string;
};

class TrackingOfflineQueue {
  private queue: QueuedPoint[] = [];
  private flushing = false;

  enqueue(point: QueuedPoint) {
    this.queue.push(point);
    // Cap at 500 points to avoid memory issues
    if (this.queue.length > 500) {
      this.queue = this.queue.slice(-500);
    }
  }

  size(): number {
    return this.queue.length;
  }

  async flush(supabase: SupabaseClient): Promise<number> {
    if (this.flushing || this.queue.length === 0) return 0;
    this.flushing = true;

    const batch = [...this.queue];
    let synced = 0;

    try {
      const { error } = await supabase.from("tracking_points").insert(batch);
      if (!error) {
        synced = batch.length;
        this.queue = this.queue.slice(batch.length);
      }
    } catch {
      // Keep queued for next attempt
    } finally {
      this.flushing = false;
    }

    return synced;
  }
}

export const trackingQueue = new TrackingOfflineQueue();
