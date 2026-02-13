export function handleUserNotFound(
  res: Response,
  data: any,
  router: any
) {
  if (res.status === 401 && data?.error === "USER_NOT_FOUND") {
    try {
      localStorage.removeItem("user");
    } catch {}
    router.push("/login");
    return true;
  }
  return false;
}
