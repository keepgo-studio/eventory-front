import { Button } from "@/components/ui/button";
import { useNav } from "@/hooks/use-nav";
import Link from "next/link";

export default function Home() {
  const { navigate } = useNav();

  return (
    <div>
      <Link href={navigate("/settings")}>
        <Button>
          Go to settings...
        </Button>
      </Link>

      <Link href={navigate("/events/form/new")}>
        <Button>
          new event
        </Button>
      </Link>
    </div>
  );
}