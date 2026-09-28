import { describe, expect, it } from "vitest";

import {
  parsePushSubscriptionInput,
  parsePushUnsubscribeInput,
  PushSubscriptionValidationError,
} from "@/lib/push/subscription-input";

const validPayload = {
  endpoint: "https://push.example.test/subscriptions/device-1",
  expirationTime: null,
  keys: {
    auth: "abcdefgh12345678",
    p256dh:
      "BKM4N-q7RAwFzY9_vV6p2vQx9zIKcf6l72L4cP7p71cKj9V0CGv2qA2z7n7vQw4qWvLa",
  },
};

describe("parsePushSubscriptionInput", () => {
  it("accepts a valid HTTPS push subscription", () => {
    expect(parsePushSubscriptionInput(validPayload)).toEqual(validPayload);
  });

  it("keeps a distinct previous endpoint for subscription rotation", () => {
    expect(
      parsePushSubscriptionInput({
        ...validPayload,
        previousEndpoint: "https://push.example.test/subscriptions/device-old",
      }),
    ).toMatchObject({
      previousEndpoint: "https://push.example.test/subscriptions/device-old",
    });
  });

  it("drops a previous endpoint when it matches the current endpoint", () => {
    expect(
      parsePushSubscriptionInput({
        ...validPayload,
        previousEndpoint: validPayload.endpoint,
      }),
    ).not.toHaveProperty("previousEndpoint");
  });

  it.each([
    ["non-HTTPS endpoint", { ...validPayload, endpoint: "http://push.example.test/a" }],
    ["credentialed endpoint", { ...validPayload, endpoint: "https://user:pass@push.example.test/a" }],
    ["invalid expiration", { ...validPayload, expirationTime: -1 }],
    [
      "invalid auth key",
      { ...validPayload, keys: { ...validPayload.keys, auth: "not valid" } },
    ],
  ])("rejects %s", (_name, payload) => {
    expect(() => parsePushSubscriptionInput(payload)).toThrow(
      PushSubscriptionValidationError,
    );
  });
});

describe("parsePushUnsubscribeInput", () => {
  it("accepts the endpoint-only payload", () => {
    expect(parsePushUnsubscribeInput({ endpoint: validPayload.endpoint })).toEqual({
      endpoint: validPayload.endpoint,
    });
  });
});
