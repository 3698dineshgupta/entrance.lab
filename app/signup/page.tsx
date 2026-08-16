import { redirect } from "next/navigation";

// This page used to render its own registration form that only faked
// success (router.push("/dashboard") into an empty route, no API call).
// /register is the real, working registration flow — redirect here so any
// existing links/bookmarks to /signup still land somewhere functional.
export default function SignupPage() {
  redirect("/register");
}
