export type PushSubscriptionInput = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
  previousEndpoint?: string;
};

export type PushNotificationPayload = {
  badge: string;
  body: string;
  broadcastId: string;
  icon: string;
  tag: string;
  title: string;
  url: "/" | `/video/${string}`;
  version: 1;
  videoId: string;
};

export type PushDeliveryStatus =
  | "pending"
  | "processing"
  | "retry"
  | "sent"
  | "dead";
