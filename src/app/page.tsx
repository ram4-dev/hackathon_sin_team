import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/auth";

export default async function Home() {
  const userId = await getAuthUserId();

  if (userId) {
    redirect("/map");
  } else {
    redirect("/login");
  }
}
