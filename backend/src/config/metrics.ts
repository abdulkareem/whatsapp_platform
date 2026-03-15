type Labels = Record<string, string>;

const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

const key = (name: string, labels: Labels) => `${name}:${Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`).join(',')}`;

export const inboundMessagesCounter = {
  labels(tenant: string, app: string) {
    return {
      inc(value = 1) {
        const metricKey = key('wa_inbound_messages_total', { tenant, app });
        counters.set(metricKey, (counters.get(metricKey) ?? 0) + value);
      }
    };
  }
};

export const queueLatencyHistogram = {
  labels(queue: string, jobName: string) {
    return {
      observe(value: number) {
        const metricKey = key('wa_queue_latency_seconds', { queue, jobName });
        histograms.set(metricKey, [...(histograms.get(metricKey) ?? []), value]);
      }
    };
  }
};

export const campaignDispatchCounter = {
  labels(tenant: string, status: string) {
    return {
      inc(value = 1) {
        const metricKey = key('wa_campaign_dispatch_total', { tenant, status });
        counters.set(metricKey, (counters.get(metricKey) ?? 0) + value);
      }
    };
  }
};

export const metricsRegistry = {
  contentType: 'text/plain; version=0.0.4; charset=utf-8',
  async metrics() {
    const lines: string[] = [];

    for (const [metricKey, value] of counters.entries()) {
      lines.push(`${metricKey} ${value}`);
    }

    for (const [metricKey, values] of histograms.entries()) {
      const avg = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      lines.push(`${metricKey}_avg ${avg}`);
    }

    return lines.join('\n');
  }
};
