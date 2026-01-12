import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { useRouter } from "next/navigation";
export default function NotFound() {
  // const router = useRouter();
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-2">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-2 text-gray-500">
        The page you are looking for does not exist.
      </p>
      <Link href="/dashboard">
        <Button>HomePage</Button>
      </Link>
    </div>
  );
}
