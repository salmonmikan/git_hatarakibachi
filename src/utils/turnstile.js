const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_CONTAINER_ID = "ticket-reservation-turnstile";
const TURNSTILE_ACTION = "ticket_reservation";
const TURNSTILE_SCRIPT_TIMEOUT_MS = 10000;

let scriptPromise = null;
let widgetId = null;
let pendingChallenge = null;

function turnstileError(message, code = "TURNSTILE_FAILED") {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getSiteKey() {
  return import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";
}

function ensureContainer() {
  let container = document.getElementById(TURNSTILE_CONTAINER_ID);
  if (container) return container;

  container = document.createElement("div");
  container.id = TURNSTILE_CONTAINER_ID;
  container.setAttribute("aria-live", "polite");
  container.style.position = "fixed";
  container.style.right = "16px";
  container.style.bottom = "16px";
  container.style.zIndex = "10000";
  container.style.maxWidth = "calc(100vw - 32px)";
  document.body.appendChild(container);
  return container;
}

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  // scriptPromiseがないのにSDKも存在しない場合、既存scriptは過去の失敗・
  // 不完全ロードとみなす。errorイベントは再発火しないため新しい要素で再試行する。
  document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`)?.remove();

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let timeoutId = 0;

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
    const fail = (error) => {
      cleanup();
      script.remove();
      reject(error);
    };
    const onLoad = () => {
      cleanup();
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        script.remove();
        reject(turnstileError("セキュリティ確認を初期化できませんでした。", "TURNSTILE_UNAVAILABLE"));
      }
    };
    const onError = () => fail(
      turnstileError("セキュリティ確認を読み込めませんでした。", "TURNSTILE_UNAVAILABLE"),
    );

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    timeoutId = window.setTimeout(() => {
      fail(turnstileError("セキュリティ確認の読み込みがタイムアウトしました。", "TURNSTILE_UNAVAILABLE"));
    }, TURNSTILE_SCRIPT_TIMEOUT_MS);
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

async function ensureWidget() {
  const siteKey = getSiteKey();
  if (!siteKey) {
    throw turnstileError("セキュリティ確認の設定がありません。", "TURNSTILE_UNAVAILABLE");
  }

  const turnstile = await loadTurnstile();
  if (widgetId !== null) return { turnstile, widgetId };

  const container = ensureContainer();
  widgetId = turnstile.render(container, {
    sitekey: siteKey,
    action: TURNSTILE_ACTION,
    execution: "execute",
    appearance: "interaction-only",
    theme: "auto",
    callback: (value) => {
      const current = pendingChallenge;
      pendingChallenge = null;
      current?.resolve(value);
    },
    "expired-callback": () => {
      const current = pendingChallenge;
      pendingChallenge = null;
      current?.reject(turnstileError("セキュリティ確認の有効期限が切れました。"));
    },
    "timeout-callback": () => {
      const current = pendingChallenge;
      pendingChallenge = null;
      current?.reject(turnstileError("セキュリティ確認がタイムアウトしました。"));
    },
    "error-callback": () => {
      const current = pendingChallenge;
      pendingChallenge = null;
      current?.reject(turnstileError("セキュリティ確認に失敗しました。"));
    },
  });

  if (widgetId === undefined || widgetId === null) {
    widgetId = null;
    throw turnstileError("セキュリティ確認を表示できませんでした。", "TURNSTILE_UNAVAILABLE");
  }

  return { turnstile, widgetId };
}

export async function requestTicketReservationChallenge() {
  if (pendingChallenge) {
    throw turnstileError("セキュリティ確認を処理中です。", "TURNSTILE_BUSY");
  }

  const { turnstile, widgetId: currentWidgetId } = await ensureWidget();
  return new Promise((resolve, reject) => {
    pendingChallenge = { resolve, reject };
    try {
      turnstile.execute(currentWidgetId);
    } catch {
      pendingChallenge = null;
      reject(turnstileError("セキュリティ確認を開始できませんでした。", "TURNSTILE_UNAVAILABLE"));
    }
  });
}

export async function resetTicketReservationChallenge() {
  if (widgetId === null) return;
  try {
    const turnstile = await loadTurnstile();
    turnstile.reset(widgetId);
  } catch {
    // 次回送信時に再初期化できるよう、失敗時はwidget参照を破棄する。
    widgetId = null;
  }
}
