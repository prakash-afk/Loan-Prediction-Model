const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function buildError(detail, status) {
  let message = "Request failed. Please try again.";
  const fieldErrors = {};

  if (Array.isArray(detail)) {
    detail.forEach((item) => {
      if (!item || !Array.isArray(item.loc)) {
        return;
      }

      const path = item.loc
        .filter((segment) => segment !== "body")
        .map((segment) => String(segment))
        .join(".");

      if (path) {
        fieldErrors[path] = item.msg || "Invalid value.";
      }
    });

    if (detail.length > 0) {
      message = detail[0]?.msg || message;
    }
  } else if (typeof detail === "string") {
    message = detail;
  }

  const error = new Error(message);
  error.status = status;
  error.fieldErrors = fieldErrors;
  error.raw = detail;
  return error;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw buildError(data?.detail ?? data, response.status);
  }

  return data;
}

export async function getHealth() {
  return request("/health");
}

export async function predictOne(payload) {
  return request("/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function predictBatch(payload) {
  return request("/predict/batch", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { API_BASE_URL };
