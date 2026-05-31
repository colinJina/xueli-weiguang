const ERROR_MAP: ReadonlyArray<{ match: RegExp; message: string }> = [
  { match: /invalid login credentials/i, message: "邮箱或密码不正确，请重试。" },
  { match: /email not confirmed/i, message: "邮箱尚未验证，请先完成邮箱验证再登录。" },
  {
    match: /user already registered/i,
    message: "该邮箱已注册，请改用登录方式进入。",
  },
  {
    match: /token has expired or is invalid/i,
    message: "验证码已过期或不正确，请重新获取。",
  },
  {
    match: /otp expired|expired token/i,
    message: "验证码已过期，请点击重新发送。",
  },
  {
    match: /token has already been used/i,
    message: "验证码已使用过，请重新获取。",
  },
  {
    match: /for security purposes,? you can only request this after (\d+) seconds/i,
    message: "操作过于频繁，请稍等片刻后再试。",
  },
  {
    match: /email rate limit exceeded|over_email_send_rate_limit/i,
    message: "邮箱验证码发送过于频繁，请几分钟后再试。",
  },
  {
    match: /password should be at least (\d+) characters/i,
    message: "密码长度过短，请使用更长的密码（建议至少 8 位）。",
  },
  {
    match: /weak password/i,
    message: "密码强度不足，请加入数字与字母的组合。",
  },
  { match: /unable to validate email address/i, message: "邮箱格式不合法，请检查后重试。" },
  { match: /network error|failed to fetch/i, message: "网络异常，请检查网络后重试。" },
  { match: /signup is disabled/i, message: "当前暂不开放注册，请稍后再试。" },
  { match: /user not found/i, message: "未找到该用户，请确认邮箱后重试。" },
];

export function translateAuthError(raw: string | null | undefined): string {
  if (!raw) {
    return "发生未知错误，请稍后再试。";
  }

  for (const entry of ERROR_MAP) {
    if (entry.match.test(raw)) {
      return entry.message;
    }
  }

  return raw;
}
