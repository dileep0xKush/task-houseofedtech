interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const key = identifier;

  if (!store[key]) {
    store[key] = { count: 1, resetTime: now + windowMs };
    return true;
  }

  const record = store[key];

  if (now > record.resetTime) {
    store[key] = { count: 1, resetTime: now + windowMs };
    return true;
  }

  record.count++;
  return record.count <= limit;
}

export function getRateLimitStatus(identifier: string): {
  remaining: number;
  limit: number;
  resetTime: number;
} {
  const record = store[identifier];
  const now = Date.now();

  if (!record) {
    return { remaining: 60, limit: 60, resetTime: now + 60000 };
  }

  if (now > record.resetTime) {
    return { remaining: 60, limit: 60, resetTime: now + 60000 };
  }

  return {
    remaining: Math.max(0, 60 - record.count),
    limit: 60,
    resetTime: record.resetTime,
  };
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  Object.entries(store).forEach(([key, value]) => {
    if (now > value.resetTime + 3600000) {
      delete store[key];
    }
  });
}, 3600000);
